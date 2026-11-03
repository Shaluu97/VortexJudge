const assert = require('assert');
const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('../src/db');
const presence = require('../src/presence');
const apiRoutes = require('../src/routes/api');
const adminRoutes = require('../src/routes/admin');

async function runPresenceTests() {
    console.log('\n======================================================');
    console.log('🧪 RUNNING USER PRESENCE & ACTIVITY TRACKING TESTS');
    console.log('======================================================\n');

    let testsPassed = 0;
    let totalTests = 0;

    function recordPass(desc) {
        totalTests++;
        testsPassed++;
        console.log(`[Test ${String(totalTests).padStart(2, '0')}] ✓ PASS: ${desc}`);
    }

    // ── 1. MODULE UNIT TESTS (src/presence.js) ──
    console.log('--- 1. Testing src/presence.js helper & presence logic ---');

    const now = Date.now();

    // 1.1 formatTimeAgoUz
    assert.strictEqual(presence.formatTimeAgoUz(null, now), 'Hech qachon kirmagan');
    assert.strictEqual(presence.formatTimeAgoUz(undefined, now), 'Hech qachon kirmagan');
    assert.strictEqual(presence.formatTimeAgoUz(0, now), 'Hech qachon kirmagan');
    assert.strictEqual(presence.formatTimeAgoUz(now - 10 * 1000, now), 'Hozir');
    assert.strictEqual(presence.formatTimeAgoUz(now - 5 * 60 * 1000, now), '5 daqiqa oldin');
    assert.strictEqual(presence.formatTimeAgoUz(now - 2 * 3600 * 1000, now), '2 soat oldin');
    assert.strictEqual(presence.formatTimeAgoUz(now - 3 * 24 * 3600 * 1000, now), '3 kun oldin');
    assert.strictEqual(presence.formatTimeAgoUz(now - 45 * 24 * 3600 * 1000, now), '1 oy oldin');
    assert.strictEqual(presence.formatTimeAgoUz(now - 400 * 24 * 3600 * 1000, now), '1 yil oldin');
    recordPass('formatTimeAgoUz formats relative time in Uzbek correctly');

    // 1.2 computeUserPresence for offline/empty user
    const emptyUser = { id: 999999, username: 'ghost', last_seen_at: null };
    const emptyPres = presence.computeUserPresence(emptyUser, now);
    assert.strictEqual(emptyPres.status, 'offline');
    assert.strictEqual(emptyPres.label, 'Oflayn');
    assert.strictEqual(emptyPres.indicator, '⚫');
    assert.strictEqual(emptyPres.last_seen_time_ago, 'Hech qachon kirmagan');
    recordPass('Empty / never visited user produces offline status and indicator');

    // 1.3 In-memory presence recording: Online, Away, Offline
    presence.resetPresenceCache();
    const testUserId = 77701;

    // Record Online
    presence.recordHeartbeat(testUserId, { state: 'online', page: '/problems', ip: '127.0.0.1', timestampMs: now });
    const presOnline = presence.computeUserPresence({ id: testUserId }, now);
    assert.strictEqual(presOnline.status, 'online');
    assert.strictEqual(presOnline.label, 'Faol (Saytda)');
    assert.strictEqual(presOnline.indicator, '🟢');
    assert.strictEqual(presOnline.is_active_tab, 1);
    assert.strictEqual(presOnline.last_seen_time_ago, 'Hozir faol');
    recordPass('Heartbeat state "online" registers as Faol (🟢)');

    // Record Away (switched tab / inactive)
    presence.recordHeartbeat(testUserId, { state: 'away', page: '/problems', ip: '127.0.0.1', timestampMs: now });
    const presAway = presence.computeUserPresence({ id: testUserId }, now);
    assert.strictEqual(presAway.status, 'away');
    assert.strictEqual(presAway.label, 'Boshqa oynada');
    assert.strictEqual(presAway.indicator, '🟡');
    assert.strictEqual(presAway.is_active_tab, 0);
    assert.strictEqual(presAway.last_seen_time_ago, 'Hozir (nofaol)');
    recordPass('Heartbeat state "away" registers as Boshqa oynada (🟡)');

    // Record Offline (tab closed / beforeunload)
    presence.recordHeartbeat(testUserId, { state: 'offline', page: '/problems', ip: '127.0.0.1', timestampMs: now });
    const presOffline = presence.computeUserPresence({ id: testUserId }, now);
    assert.strictEqual(presOffline.status, 'offline');
    assert.strictEqual(presOffline.label, 'Oflayn');
    assert.strictEqual(presOffline.indicator, '⚫');
    recordPass('Heartbeat state "offline" registers immediately as Oflayn (⚫)');

    // 1.4 Automatic timeout to offline after 75+ seconds
    presence.recordHeartbeat(testUserId, { state: 'online', page: '/contests', ip: '127.0.0.1', timestampMs: now - 80 * 1000 });
    const presTimedOut = presence.computeUserPresence({ id: testUserId }, now);
    assert.strictEqual(presTimedOut.status, 'offline', 'Ping older than 75s must become offline');
    assert.strictEqual(presTimedOut.indicator, '⚫');
    assert.strictEqual(presTimedOut.last_seen_time_ago, '1 daqiqa oldin');
    recordPass('Pings older than 75 seconds automatically expire to Oflayn (⚫)');

    // ── 2. HTTP ENDPOINTS & ADMIN MONITORING ──
    console.log('\n--- 2. Testing HTTP Heartbeat & Admin Presence Endpoints ---');

    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    app.use(cookieParser());

    let currentMockUser = null;
    app.use((req, res, next) => {
        req.user = currentMockUser;
        next();
    });

    app.use('/api', apiRoutes);
    app.use('/api/admin', adminRoutes);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        // 2.1 Unauthenticated heartbeat -> 401
        currentMockUser = null;
        const resUnauth = await fetch(`${baseUrl}/api/presence/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: 'online', page: '/problems' })
        });
        assert.strictEqual(resUnauth.status, 401, 'Guest heartbeat must return 401');
        recordPass('Unauthenticated heartbeat returns 401 Unauthorized');

        // Create test student and admin in DB
        const suffix = Date.now();
        const studentRow = db.prepare(`
            INSERT INTO users (username, role, full_name, password_hash)
            VALUES (?, 'student', 'Student Pres Test', 'hash')
        `).run(`student_pres_${suffix}`);
        const studentUser = { id: studentRow.lastInsertRowid, username: `student_pres_${suffix}`, role: 'student' };

        const adminRow = db.prepare(`
            INSERT INTO users (username, role, full_name, password_hash)
            VALUES (?, 'admin', 'Admin Pres Test', 'hash')
        `).run(`admin_pres_${suffix}`);
        const adminUser = { id: adminRow.lastInsertRowid, username: `admin_pres_${suffix}`, role: 'admin' };

        // 2.2 Student sends online heartbeat
        currentMockUser = studentUser;
        const resStudentPing = await fetch(`${baseUrl}/api/presence/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: 'online', page: '/problems/42' })
        });
        assert.strictEqual(resStudentPing.status, 200, 'Student heartbeat must return 200');
        const pingBody = await resStudentPing.json();
        assert.strictEqual(pingBody.ok, true);
        recordPass('Student heartbeat successfully recorded on backend');

        // 2.3 Non-admin accessing /api/admin/presence -> 403
        currentMockUser = studentUser;
        const resForbidden = await fetch(`${baseUrl}/api/admin/presence`);
        assert.strictEqual(resForbidden.status, 403, 'Student cannot view admin presence monitoring');
        recordPass('Admin presence monitoring strictly requires Admin role (403 for students)');

        // 2.4 Admin queries /api/admin/presence
        currentMockUser = adminUser;
        const resAdminPres = await fetch(`${baseUrl}/api/admin/presence`);
        assert.strictEqual(resAdminPres.status, 200);
        const presData = await resAdminPres.json();
        assert(presData.stats, 'Presence stats object must exist');
        assert(typeof presData.stats.online === 'number', 'stats.online must be number');
        assert(typeof presData.stats.away === 'number', 'stats.away must be number');
        assert(typeof presData.stats.offline === 'number', 'stats.offline must be number');
        assert(Array.isArray(presData.users), 'users must be array');

        const studentFound = presData.users.find(u => u.id === studentUser.id);
        assert(studentFound, 'Student must be listed in presence monitoring');
        assert.strictEqual(studentFound.presence_status, 'online');
        assert.strictEqual(studentFound.presence_indicator, '🟢');
        assert.strictEqual(studentFound.presence_label, 'Faol (Saytda)');
        assert.strictEqual(studentFound.current_page, '/problems/42');
        recordPass('Admin /api/admin/presence accurately displays student as Online (🟢)');

        // 2.5 Student switches tab -> sends 'away'
        currentMockUser = studentUser;
        await fetch(`${baseUrl}/api/presence/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: 'away', page: '/problems/42' })
        });

        currentMockUser = adminUser;
        const resAdminAway = await fetch(`${baseUrl}/api/admin/presence`);
        const awayData = await resAdminAway.json();
        const studentAway = awayData.users.find(u => u.id === studentUser.id);
        assert.strictEqual(studentAway.presence_status, 'away');
        assert.strictEqual(studentAway.presence_indicator, '🟡');
        assert.strictEqual(studentAway.presence_label, 'Boshqa oynada');
        recordPass('Admin /api/admin/presence reflects Away (🟡) when user switches tabs');

        // 2.6 Student closes tab -> sends 'offline' beacon
        currentMockUser = studentUser;
        await fetch(`${baseUrl}/api/presence/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: 'offline', page: '/problems/42' })
        });

        currentMockUser = adminUser;
        const resAdminOff = await fetch(`${baseUrl}/api/admin/presence`);
        const offData = await resAdminOff.json();
        const studentOff = offData.users.find(u => u.id === studentUser.id);
        assert.strictEqual(studentOff.presence_status, 'offline');
        assert.strictEqual(studentOff.presence_indicator, '⚫');
        assert.strictEqual(studentOff.presence_label, 'Oflayn');
        recordPass('Admin /api/admin/presence reflects Offline (⚫) immediately on tab close');

        // 2.7 Contest participants endpoint includes presence
        const contestInsert = db.prepare(`
            INSERT INTO contests (title, type, contest_mode, start_time, end_time, duration, is_active)
            VALUES (?, 'PUBLIC', 'NORMAL', '2026-11-03T10:00:00+05:00', '2026-11-03T14:00:00+05:00', '02:00', 1)
        `).run(`Pres_Contest_${suffix}`);
        const testContestId = contestInsert.lastInsertRowid;

        db.prepare(`
            INSERT INTO contest_participants (contest_id, user_id, is_official, is_registered, status)
            VALUES (?, ?, 1, 1, 'REGISTERED')
        `).run(testContestId, studentUser.id);

        const resParts = await fetch(`${baseUrl}/api/contests/${testContestId}/participants`);
        assert.strictEqual(resParts.status, 200);
        const partsData = await resParts.json();
        const partStudent = partsData.participants.find(p => p.user_id === studentUser.id);
        assert(partStudent, 'Student must be in contest participants list');
        assert(partStudent.presence_status, 'Participant must have presence_status');
        assert(partStudent.presence_indicator, 'Participant must have presence_indicator');
        recordPass('Contest participants list enriches every student with live presence indicators');

        // Cleanup fixtures
        db.prepare('DELETE FROM contest_participants WHERE contest_id = ?').run(testContestId);
        db.prepare('DELETE FROM contests WHERE id = ?').run(testContestId);
        db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(studentUser.id, adminUser.id);

    } finally {
        server.close();
    }

    console.log(`\n======================================================`);
    console.log(`🎉 ALL ${testsPassed} USER PRESENCE & ACTIVITY TESTS PASSED!`);
    console.log(`======================================================\n`);
}

runPresenceTests().catch(err => {
    console.error('Presence Test Failed:', err);
    process.exit(1);
});
