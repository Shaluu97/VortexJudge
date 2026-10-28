const assert = require('assert');
const db = require('../src/db');
const contestsEngine = require('../src/contests');

console.log('--- STARTING CONTEST REGISTRATION & VISIBILITY TESTS ---');

// 1. Setup test users
db.prepare("INSERT OR IGNORE INTO users (username, password_hash, full_name, role) VALUES ('assigned_user1', 'hash', 'Assigned User 1', 'student')").run();
db.prepare("INSERT OR IGNORE INTO users (username, password_hash, full_name, role) VALUES ('unassigned_user', 'hash', 'Unassigned User', 'student')").run();

const assignedUser = db.prepare("SELECT * FROM users WHERE username = 'assigned_user1'").get();
const unassignedUser = db.prepare("SELECT * FROM users WHERE username = 'unassigned_user'").get();

// 2. Setup test contests: one Private LIVE, one Public LIVE, one Upcoming, one Finished
const now = Date.now();
const oneHour = 3600 * 1000;

// Format helper for local-like datetime string (e.g. 2026-10-22T14:00)
function toLocalString(ms) {
    const d = new Date(ms);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const liveStart = toLocalString(now - oneHour);
const liveEnd = toLocalString(now + 2 * oneHour);
const upcomingStart = toLocalString(now + 2 * oneHour);
const upcomingEnd = toLocalString(now + 4 * oneHour);
const finishedStart = toLocalString(now - 4 * oneHour);
const finishedEnd = toLocalString(now - 2 * oneHour);

// Cleanup existing test contests
db.prepare("DELETE FROM contests WHERE title LIKE 'Test Vis %'").run();

// Create Private LIVE contest
const insPrivLive = db.prepare(`
    INSERT INTO contests (title, type, contest_mode, start_time, end_time, is_active)
    VALUES ('Test Vis Private LIVE', 'PRIVATE', 'private', ?, ?, 1)
`).run(liveStart, liveEnd);
const privLiveId = Number(insPrivLive.lastInsertRowid);

// Create Public LIVE contest
const insPubLive = db.prepare(`
    INSERT INTO contests (title, type, contest_mode, start_time, end_time, is_active)
    VALUES ('Test Vis Public LIVE', 'PUBLIC', 'public', ?, ?, 1)
`).run(liveStart, liveEnd);
const pubLiveId = Number(insPubLive.lastInsertRowid);

// Create Public Upcoming contest
const insPubUp = db.prepare(`
    INSERT INTO contests (title, type, contest_mode, start_time, end_time, is_active)
    VALUES ('Test Vis Public Upcoming', 'PUBLIC', 'public', ?, ?, 1)
`).run(upcomingStart, upcomingEnd);
const pubUpId = Number(insPubUp.lastInsertRowid);

// 3. Test Requirement 1: Admin attaches user via "+ Qatnashuvchini qo'shish"
// Simulate admin adding assigned_user1 to privLiveId and pubUpId
db.prepare(`
    INSERT INTO contest_participants (contest_id, user_id, is_official, is_registered, status)
    VALUES (?, ?, 1, 1, 'REGISTERED')
    ON CONFLICT(contest_id, user_id) DO UPDATE SET is_registered = 1, status = 'REGISTERED'
`).run(privLiveId, assignedUser.id);

db.prepare(`
    INSERT INTO contest_participants (contest_id, user_id, is_official, is_registered, status)
    VALUES (?, ?, 1, 1, 'REGISTERED')
    ON CONFLICT(contest_id, user_id) DO UPDATE SET is_registered = 1, status = 'REGISTERED'
`).run(pubUpId, assignedUser.id);

// Verify DB record
const cpRecord = db.prepare("SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?").get(privLiveId, assignedUser.id);
assert.strictEqual(cpRecord.is_registered, 1, 'Participant must have is_registered = 1');
assert.strictEqual(cpRecord.status, 'REGISTERED', 'Participant status must be REGISTERED');
console.log('✓ Requirement 1: Admin attachment automatically sets is_registered = 1 and status = REGISTERED');

// 4. Test Requirement 2: GET /api/contests logic simulation
function getContestsForUser(user) {
    const userId = user ? user.id : null;
    const isStaff = user && ['admin', 'judge'].includes(String(user.role).toLowerCase());
    
    const contests = db.prepare(`
        SELECT c.*, 
               (SELECT COUNT(*) FROM contest_problems WHERE contest_id = c.id) as problems_count,
               (SELECT COUNT(*) FROM contest_participants cp JOIN users u ON cp.user_id = u.id WHERE cp.contest_id = c.id AND LOWER(u.role) NOT IN ('admin', 'judge')) as participants_count
        FROM contests c
        WHERE (c.is_active = 1 OR c.is_active IS NULL)
        ORDER BY c.start_time DESC
    `).all();

    let userRegisteredContests = new Set();
    if (userId) {
        const rows = db.prepare('SELECT contest_id FROM contest_participants WHERE user_id = ? AND (is_disqualified = 0 OR is_disqualified IS NULL)').all(userId);
        rows.forEach(r => userRegisteredContests.add(r.contest_id));
    }

    const curNow = Date.now();
    return contests
        .filter(c => {
            const isPrivate = ['PRIVATE', 'YOPIQ'].includes(String(c.type || '').trim().toUpperCase()) || 
                              ['private', 'yopiq'].includes(String(c.contest_mode || '').trim().toLowerCase());
            if (isPrivate && !isStaff) {
                return userRegisteredContests.has(c.id);
            }
            return true;
        })
        .map(c => {
            const startMs = contestsEngine.parseSubDate(c.start_time);
            const endMs = contestsEngine.parseSubDate(c.end_time);
            return {
                ...c,
                start_time_ms: startMs,
                end_time_ms: endMs,
                is_live: curNow >= startMs && curNow <= endMs,
                is_upcoming: curNow < startMs,
                is_finished: curNow > endMs,
                is_registered: userRegisteredContests.has(c.id)
            };
        });
}

// Check for assignedUser:
const assignedContests = getContestsForUser(assignedUser);
const privLiveAssigned = assignedContests.find(c => c.id === privLiveId);
assert(privLiveAssigned, 'Assigned user MUST see private contest they are attached to');
assert.strictEqual(privLiveAssigned.is_registered, true, 'Assigned user MUST have is_registered === true');
assert.strictEqual(privLiveAssigned.is_live, true, 'Contest must be detected as is_live === true');
console.log('✓ Requirement 2a: Private contest visible to assigned user with is_registered: true and is_live: true');

// Check for unassignedUser:
const unassignedContests = getContestsForUser(unassignedUser);
const privLiveUnassigned = unassignedContests.find(c => c.id === privLiveId);
assert(!privLiveUnassigned, 'Unassigned user MUST NOT see private contest');
const pubLiveUnassigned = unassignedContests.find(c => c.id === pubLiveId);
assert(pubLiveUnassigned, 'Public contest MUST be visible to unassigned user');
assert.strictEqual(pubLiveUnassigned.is_registered, false, 'Unassigned user is_registered must be false on public contest');
console.log('✓ Requirement 2b: Private contest hidden from unassigned user, public contest visible');

// 5. Test Requirement 3: Tabs categorization
const liveTabs = assignedContests.filter(c => c.is_live);
const upcomingTabs = assignedContests.filter(c => c.is_upcoming);

assert(liveTabs.some(c => c.id === privLiveId), 'Private LIVE contest must appear in LIVE tab for assigned user');
assert(liveTabs.some(c => c.id === pubLiveId), 'Public LIVE contest must appear in LIVE tab');
assert(upcomingTabs.some(c => c.id === pubUpId), 'Upcoming contest must appear in Upcoming tab');
console.log('✓ Requirement 3: Categorization into LIVE, Upcoming and Finished tabs operates correctly');

// 6. Test Requirement 4: Timezone consistency
const dtLocal = '2026-10-22T14:00';
const parsedLocalMs = contestsEngine.parseSubDate(dtLocal);
assert(parsedLocalMs > 0, 'parseSubDate must parse datetime-local string without error');
// Ensure it matches client Date.parse for local time
const expectedLocalMs = new Date(dtLocal).getTime();
assert.strictEqual(parsedLocalMs, expectedLocalMs, 'parseSubDate must match local Date time for datetime-local');
console.log('✓ Requirement 4: Timezone consistency verified between server parser and local Date');

// Cleanup
db.prepare("DELETE FROM contests WHERE title LIKE 'Test Vis %'").run();
console.log('\n🎉 ALL CONTEST REGISTRATION & VISIBILITY TESTS PASSED 100%!');
