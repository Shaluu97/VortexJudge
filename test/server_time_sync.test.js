const assert = require('assert');
const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('../src/db');
const timeSync = require('../src/timeSync');
const contestsEngine = require('../src/contests');
const apiRoutes = require('../src/routes/api');

async function runTimeSyncTests() {
    console.log('\n======================================================');
    console.log('🧪 RUNNING SERVER TIME SYNC & ANTI-CHEAT TIMER TESTS');
    console.log('======================================================\n');

    let testsPassed = 0;
    let totalTests = 0;

    function recordPass(desc) {
        totalTests++;
        testsPassed++;
        console.log(`[Test ${String(totalTests).padStart(2, '0')}] ✓ PASS: ${desc}`);
    }

    // ── 1. MODULE UNIT TESTS (src/timeSync.js) ──
    console.log('--- 1. Testing src/timeSync.js logic ---');

    // 1.1 Timezone Constants
    assert.strictEqual(timeSync.TASHKENT_OFFSET_HOURS, 5);
    assert.strictEqual(timeSync.TASHKENT_OFFSET_MS, 5 * 3600 * 1000);
    assert.strictEqual(timeSync.TASHKENT_TZ_NAME, 'Asia/Tashkent');
    recordPass('Tashkent UTC+5 constants verified');

    // 1.2 getNowUtcMs and getNowTashkentIso
    const nowMs = timeSync.getNowUtcMs();
    assert(Math.abs(nowMs - Date.now()) < 50, 'UtcMs should be within 50ms of Date.now()');
    const tashkentIso = timeSync.getNowTashkentIso();
    assert(tashkentIso.endsWith('+05:00'), 'Tashkent ISO must end with +05:00 offset');
    recordPass('getNowUtcMs and getNowTashkentIso return valid timestamps');

    // 1.3 parseToMs parity checks
    // UTC ISO vs Tashkent ISO equivalence:
    // 2026-11-03T07:00:00Z should equal 2026-11-03T12:00:00+05:00
    const utcMs = timeSync.parseToMs('2026-11-03T07:00:00Z');
    const tashkentMs = timeSync.parseToMs('2026-11-03T12:00:00+05:00');
    assert.strictEqual(utcMs, tashkentMs, '07:00:00Z must equal 12:00:00+05:00 in UTC ms');

    // datetime-local string without tz offset: 2026-11-03T12:00 is interpreted as Tashkent time (+05:00)
    const localMs = timeSync.parseToMs('2026-11-03T12:00');
    assert.strictEqual(localMs, tashkentMs, 'datetime-local without tz must be treated as Tashkent time');

    // slash date format with AM/PM: 11/03/2026 09:00 AM
    const slashMs = timeSync.parseToMs('11/03/2026 09:00 AM');
    assert(slashMs > 0, 'Slash date format parsed successfully');
    const slashNormalized = timeSync.normalizeToTashkentIso('11/03/2026 09:00 AM');
    assert(slashNormalized.startsWith('2026-11-03T09:00:00'), `Normalized slash date must be 2026-11-03T09:00:00+05:00, got: ${slashNormalized}`);
    assert(slashNormalized.endsWith('+05:00'), 'Normalized slash date must have +05:00 offset');
    recordPass('parseToMs handles ISO UTC, Tashkent ISO, datetime-local, and slash AM/PM accurately');

    // 1.4 normalizeToTashkentIso
    const norm = timeSync.normalizeToTashkentIso('2026-11-03T14:30');
    assert.strictEqual(norm, '2026-11-03T14:30:00+05:00');
    recordPass('normalizeToTashkentIso outputs standardized YYYY-MM-DDTHH:mm:ss+05:00 string');

    // ── 2. HTTP ENDPOINTS & SERVER TIME SYNC ──
    console.log('\n--- 2. Testing HTTP Endpoints & Anti-Clock-Tampering ---');

    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    app.use(cookieParser());

    let mockUser = null;
    app.use((req, res, next) => {
        req.user = mockUser;
        next();
    });

    app.use('/api', apiRoutes);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        // 2.1 GET /api/time
        const resTime = await fetch(`${baseUrl}/api/time`);
        assert.strictEqual(resTime.status, 200, 'GET /api/time should return 200');
        const timeHeader = resTime.headers.get('x-server-time');
        assert(timeHeader && !isNaN(Number(timeHeader)), 'X-Server-Time header must be present and numeric');
        const timeData = await resTime.json();
        assert(typeof timeData.timestamp === 'number', 'timestamp must be number');
        assert(timeData.server_time.endsWith('Z'), 'server_time must be UTC ISO ending in Z');
        assert(timeData.server_time_tashkent.endsWith('+05:00'), 'server_time_tashkent must have +05:00');
        assert.strictEqual(timeData.timezone, 'Asia/Tashkent');
        assert.strictEqual(timeData.utc_offset_hours, 5);
        assert.strictEqual(timeData.utc_offset_ms, 18000000);
        recordPass('GET /api/time returns high-precision server time and Tashkent metadata');

        // 2.2 GET /api/contests sets X-Server-Time
        const resContests = await fetch(`${baseUrl}/api/contests`);
        assert.strictEqual(resContests.status, 200);
        assert(resContests.headers.get('x-server-time'), 'GET /api/contests must include X-Server-Time');
        const contestsList = await resContests.json();
        assert(Array.isArray(contestsList), 'Contests should return array');
        if (contestsList.length > 0) {
            assert(typeof contestsList[0].server_time_ms === 'number', 'server_time_ms must be provided');
            assert(typeof contestsList[0].start_time_ms === 'number', 'start_time_ms must be provided');
            assert(typeof contestsList[0].end_time_ms === 'number', 'end_time_ms must be provided');
        }
        recordPass('GET /api/contests includes X-Server-Time header and millisecond timestamps');

        // ── 3. CONTEST ACCESS ENFORCEMENT & ANTI-CHEAT ──
        console.log('\n--- 3. Testing Anti-Cheat Problem Locking Before Contest Start ---');

        const testSuffix = Date.now();
        // Create upcoming contest: starts in 2 hours, ends in 4 hours
        const upcomingStart = timeSync.formatMsToTashkentIso(Date.now() + 2 * 3600 * 1000);
        const upcomingEnd = timeSync.formatMsToTashkentIso(Date.now() + 4 * 3600 * 1000);

        const contestInsert = db.prepare(`
            INSERT INTO contests (title, type, contest_mode, start_time, end_time, duration, is_active)
            VALUES (?, 'PUBLIC', 'NORMAL', ?, ?, '02:00', 1)
        `).run(`Upcoming_Contest_${testSuffix}`, upcomingStart, upcomingEnd);
        const testContestId = contestInsert.lastInsertRowid;

        // Create a problem for this contest
        const probInsert = db.prepare(`
            INSERT INTO problems (title, code, difficulty, time_limit, memory_limit, statement, input_format, output_format, score)
            VALUES ('Secret Problem', ?, 'Medium', 1000, 256, 'Secret Task Statement', 'In', 'Out', 100)
        `).run(`CODE_${testSuffix}`);
        const testProbId = probInsert.lastInsertRowid;

        db.prepare(`
            INSERT INTO contest_problems (contest_id, problem_id, letter, score, problem_order)
            VALUES (?, ?, 'A', 100, 1)
        `).run(testContestId, testProbId);

        // Create student user
        const studentInsert = db.prepare(`
            INSERT INTO users (username, role, full_name, password_hash)
            VALUES (?, 'student', 'Student Test', 'hash')
        `).run(`student_${testSuffix}`);
        const studentUser = { id: studentInsert.lastInsertRowid, username: `student_${testSuffix}`, role: 'student' };

        // Create admin user
        const adminInsert = db.prepare(`
            INSERT INTO users (username, role, full_name, password_hash)
            VALUES (?, 'admin', 'Admin Test', 'hash')
        `).run(`admin_${testSuffix}`);
        const adminUser = { id: adminInsert.lastInsertRowid, username: `admin_${testSuffix}`, role: 'admin' };

        // Register student for contest
        db.prepare(`
            INSERT INTO contest_participants (contest_id, user_id, is_official, is_registered, status)
            VALUES (?, ?, 1, 1, 'REGISTERED')
        `).run(testContestId, studentUser.id);

        // 3.1 Student attempts to access problem before start_time
        mockUser = studentUser;
        const resStudentProb = await fetch(`${baseUrl}/api/contests/${testContestId}/problems/${testProbId}`);
        assert.strictEqual(resStudentProb.status, 403, 'Student must get 403 when accessing problem before contest start');
        const studentProbBody = await resStudentProb.json();
        assert(studentProbBody.error && studentProbBody.error.includes('boshlanmadi'), 'Should return "Musobaqa hali boshlanmadi!" error');
        recordPass('Student is strictly blocked (HTTP 403) from viewing problems before contest start');

        // 3.2 Student attempts to submit solution before start_time
        const resStudentSubmit = await fetch(`${baseUrl}/api/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contest_id: testContestId,
                problem_id: testProbId,
                language: 'cpp',
                code: '#include <iostream>\nint main(){ return 0; }'
            })
        });
        assert.strictEqual(resStudentSubmit.status, 403, 'Student submission before contest start must be rejected with 403');
        const submitBody = await resStudentSubmit.json();
        assert(submitBody.error && submitBody.error.includes('boshlanmadi'), 'Submission error must specify contest not started');
        recordPass('Student is strictly blocked (HTTP 403) from submitting code before contest start');

        // 3.3 Admin CAN view problems before contest start (for preparation)
        mockUser = adminUser;
        const resAdminProb = await fetch(`${baseUrl}/api/contests/${testContestId}/problems/${testProbId}`);
        assert.strictEqual(resAdminProb.status, 200, 'Admin should be allowed to view problem before contest starts');
        const adminProbBody = await resAdminProb.json();
        assert.strictEqual(adminProbBody.problem.id, testProbId);
        recordPass('Admin/Judge has preview access before contest starts');

        // 3.4 Contest Details API returns accurate time_to_start
        const resDetails = await fetch(`${baseUrl}/api/contests/${testContestId}`);
        assert.strictEqual(resDetails.status, 200);
        const detailsData = await resDetails.json();
        assert.strictEqual(detailsData.contest.is_started, false, 'Contest must not be started');
        assert(detailsData.contest.time_to_start > 3600 * 1000, 'time_to_start must be calculated from server time (> 1 hour)');
        recordPass('GET /api/contests/:id accurately returns time_to_start and timestamps from server time');

        // ── 4. CLIENT MONOTONIC CLOCK EMULATION ──
        console.log('\n--- 4. Testing Client-side Monotonic Clock Logic ---');

        // Load and verify client-side time_sync.js functions
        const timeSyncJs = require('../public/time_sync.js');
        assert(timeSyncJs, 'public/time_sync.js exports TimeSync');
        const formatted = timeSyncJs.formatRemaining(3665000); // 1 hr 1 min 5 sec
        assert.strictEqual(formatted, '01:01:05', 'formatRemaining formats hh:mm:ss correctly');

        const parsed1 = timeSyncJs.parseContestTime('2026-11-03T12:00:00+05:00');
        assert.strictEqual(parsed1, tashkentMs, 'Client TimeSync.parseContestTime produces exact same ms as server');
        recordPass('Client-side TimeSync formatRemaining and parseContestTime verified');

        // Cleanup test fixtures
        db.prepare('DELETE FROM contest_problems WHERE contest_id = ?').run(testContestId);
        db.prepare('DELETE FROM contest_participants WHERE contest_id = ?').run(testContestId);
        db.prepare('DELETE FROM problems WHERE id = ?').run(testProbId);
        db.prepare('DELETE FROM contests WHERE id = ?').run(testContestId);
        db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(studentUser.id, adminUser.id);

    } finally {
        server.close();
    }

    console.log(`\n======================================================`);
    console.log(`🎉 ALL ${testsPassed} SERVER TIME SYNC & ANTI-CHEAT TESTS PASSED!`);
    console.log(`======================================================\n`);
}

runTimeSyncTests().catch(err => {
    console.error('Time Sync Test Failed:', err);
    process.exit(1);
});
