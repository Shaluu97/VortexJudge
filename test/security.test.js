const assert = require('assert');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('../src/db');
const { ensureAdminUser, hashPassword, comparePassword, loginUser } = require('../src/auth');
const authRoutes = require('../src/routes/auth');
const apiRoutes = require('../src/routes/api');

async function runSecurityTests() {
    console.log('\n======================================================');
    console.log('🧪 RUNNING SECURITY HARDENING INTEGRATION TESTS (STEP 3)');
    console.log('======================================================\n');

    // TEST 1: Dynamic Admin User & Bcrypt Password Verification
    console.log('TEST 1: Admin credentials from Environment & Bcrypt hashing...');
    const testAdminUser = 'sec_admin_' + Date.now();
    const testAdminPass = 'SuperSecretPass_' + Date.now() + '!';

    process.env.ADMIN_USERNAME = testAdminUser;
    process.env.ADMIN_PASSWORD = testAdminPass;

    ensureAdminUser(db);

    const adminRow = db.prepare('SELECT * FROM users WHERE username = ?').get(testAdminUser);
    assert(adminRow, 'Admin user must exist in DB');
    assert.strictEqual(adminRow.role, 'admin', 'Admin user must have role admin');
    assert.strictEqual(adminRow.plain_password, '', 'plain_password must be empty string in DB');
    assert(adminRow.password_hash && adminRow.password_hash.startsWith('$2'), 'Password must be hashed with bcrypt ($2a$ or $2b$)');
    assert(comparePassword(testAdminPass, adminRow.password_hash), 'Password hash must verify with testAdminPass');
    assert(!comparePassword('WrongPassword', adminRow.password_hash), 'Invalid password must fail');

    // Test loginUser function with valid and invalid passwords
    const loginOk = loginUser(testAdminUser, testAdminPass);
    assert(loginOk && loginOk.token, 'Admin login with valid password must succeed');
    const loginBad = loginUser(testAdminUser, 'WrongPassword');
    assert.strictEqual(loginBad, null, 'Admin login with wrong password must return null');
    console.log('  ✅ TEST 1 PASSED: Admin hashed securely, plain_password zeroed out, env credentials honored.\n');

    // TEST 2: Temporary Random Token Generation when ADMIN_PASSWORD is missing
    console.log('TEST 2: Temporary random token generation when ADMIN_PASSWORD is not set...');
    delete process.env.ADMIN_PASSWORD;
    const testTempUser = 'temp_admin_' + Date.now();
    process.env.ADMIN_USERNAME = testTempUser;

    ensureAdminUser(db);
    const tempAdminRow = db.prepare('SELECT * FROM users WHERE username = ?').get(testTempUser);
    assert(tempAdminRow, 'Temporary admin user must be created in DB');
    assert.strictEqual(tempAdminRow.role, 'admin');
    assert.strictEqual(tempAdminRow.plain_password, '');
    assert(tempAdminRow.password_hash && tempAdminRow.password_hash.length > 20);
    console.log('  ✅ TEST 2 PASSED: Temporary token generated securely and warned to console.\n');

    // Build standalone Express app to test HTTP middleware & routes
    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    app.use(cookieParser());

    // Inject mock user middleware
    let mockUser = null;
    app.use((req, res, next) => {
        req.user = mockUser;
        next();
    });

    app.use('/api/auth', authRoutes);
    app.use('/api', apiRoutes);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        // TEST 3: Auth Rate Limiting on /api/auth/login
        console.log('TEST 3: Rate Limiting on /api/auth/login (Max 10 attempts)...');
        let got429 = false;
        for (let i = 0; i < 15; i++) {
            const res = await fetch(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'nonexistent', password: 'badpassword' })
            });
            if (res.status === 429) {
                got429 = true;
                const body = await res.json();
                assert(body.error && body.error.includes('Juda ko‘p urinishlar'), 'Rate limit error message in Uzbek expected');
                break;
            }
        }
        assert(got429, 'Excessive login requests must trigger HTTP 429 Too Many Requests');
        console.log('  ✅ TEST 3 PASSED: /api/auth/login blocked brute-force with HTTP 429.\n');

        // TEST 4: Submit Rate Limiting on /api/submissions and /api/test-samples
        console.log('TEST 4: Rate Limiting on /api/test-samples (Max 5 attempts in 30s)...');
        let gotSubmit429 = false;
        for (let i = 0; i < 8; i++) {
            const res = await fetch(`${baseUrl}/api/test-samples`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: 'python', code: 'print("hi")', samples: [{ input: '1', output: '1' }] })
            });
            if (res.status === 429) {
                gotSubmit429 = true;
                const body = await res.json();
                assert(body.error && body.error.includes('Juda tez so‘rov'), 'Submit rate limit error message expected');
                break;
            }
        }
        assert(gotSubmit429, 'Excessive test/submit requests must trigger HTTP 429 Too Many Requests');
        console.log('  ✅ TEST 4 PASSED: /api/test-samples blocked spam with HTTP 429.\n');

        // TEST 5: Data Leak Prevention in /api/test-samples
        console.log('TEST 5: Data Leak Prevention in /api/test-samples (Hidden tests must never leak)...');
        // Create a test problem with only hidden test cases (is_sample = 0)
        const probCode = 'PROB_SEC_' + Date.now();
        const pRes = db.prepare(`
            INSERT INTO problems (code, title, statement, input_format, output_format, time_limit, memory_limit, is_public, is_active)
            VALUES (?, 'Secret Problem', 'Secret statement', 'Integers', 'Result', 1000, 256, 1, 1)
        `).run(probCode);
        const pId = pRes.lastInsertRowid;

        // Insert hidden test case
        db.prepare(`
            INSERT INTO testcases (problem_id, test_index, input_data, output_data, is_sample)
            VALUES (?, 1, 'TOP_SECRET_INPUT', 'TOP_SECRET_OUTPUT', 0)
        `).run(pId);

        // Request test-samples on this problem
        const sampleCheckRes = await fetch(`${baseUrl}/api/test-samples`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': '192.168.100.5' // Use separate IP to avoid earlier rate limit
            },
            body: JSON.stringify({
                problem_id: pId,
                language: 'python',
                code: 'print(1)'
            })
        });

        const sampleCheckData = await sampleCheckRes.json();
        assert.strictEqual(sampleCheckRes.status, 400, 'Must return 400 when no sample tests exist');
        assert(sampleCheckData.error && sampleCheckData.error.includes('namunaviy testlar mavjud emas'), 'Should return Uzbek error');
        console.log('  ✅ TEST 5 PASSED: Hidden test cases are never returned by /api/test-samples.\n');

        // TEST 6: RBAC & Anti-Cheat on /api/submissions/:id/code and /api/submissions/:id
        console.log('TEST 6: RBAC & Anti-Cheat on submissions (Students cannot view each other\'s code)...');
        // Create student 1 and student 2
        const s1 = db.prepare(`
            INSERT INTO users (username, password_hash, full_name, role)
            VALUES (?, 'hash', 'Student One', 'user')
        `).run('student_one_' + Date.now()).lastInsertRowid;

        const s2 = db.prepare(`
            INSERT INTO users (username, password_hash, full_name, role)
            VALUES (?, 'hash', 'Student Two', 'user')
        `).run('student_two_' + Date.now()).lastInsertRowid;

        // Student 1 submits code
        const subId = db.prepare(`
            INSERT INTO submissions (user_id, problem_id, language, code, status, score, test_details)
            VALUES (?, ?, 'python', 'SECRET_STUDENT_1_CODE = 42', 'WA', 0, ?)
        `).run(s1, pId, JSON.stringify([
            { index: 1, is_sample: false, verdict: 'WA', message: 'Tokenlar mos kelmadi: kutilgan "TOP_SECRET_OUTPUT", olingan "0"' }
        ])).lastInsertRowid;

        // Anonymous user tries to view code -> 401
        mockUser = null;
        const anonRes = await fetch(`${baseUrl}/api/submissions/${subId}/code`);
        assert.strictEqual(anonRes.status, 401, 'Anonymous user must get 401');

        // Student 2 tries to view Student 1 code -> 403 Forbidden
        mockUser = { id: s2, role: 'user', username: 'student_two' };
        const s2Res = await fetch(`${baseUrl}/api/submissions/${subId}/code`);
        assert.strictEqual(s2Res.status, 403, 'Student 2 must get 403 Forbidden when trying to view Student 1 code');
        const s2Data = await s2Res.json();
        assert(s2Data.error && s2Data.error.includes("ko'ra olmaysiz"), 'Anti-cheat message expected');

        // Student 1 (owner) views their own submission details -> test_details message must be sanitized
        mockUser = { id: s1, role: 'user', username: 'student_one' };
        const s1SubRes = await fetch(`${baseUrl}/api/submissions/${subId}`);
        assert.strictEqual(s1SubRes.status, 200);
        const s1SubData = await s1SubRes.json();
        const details = s1SubData.submission.test_details;
        assert(details && details.length > 0);
        assert(!details[0].message.includes('TOP_SECRET_OUTPUT'), 'Hidden expected output must be stripped from student view!');
        assert.strictEqual(details[0].message, 'Noto‘g‘ri javob', 'Sanitized verdict message expected for students');

        // Admin views Student 1 submission details -> sees full debugging details
        mockUser = { id: 999999, role: 'admin', username: 'admin' };
        const adminSubRes = await fetch(`${baseUrl}/api/submissions/${subId}`);
        assert.strictEqual(adminSubRes.status, 200);
        const adminSubData = await adminSubRes.json();
        const adminDetails = adminSubData.submission.test_details;
        assert(adminDetails[0].message.includes('TOP_SECRET_OUTPUT'), 'Admin must be able to see full debugging details');

        console.log('  ✅ TEST 6 PASSED: RBAC strictly enforced, hidden outputs completely sanitized for students, admin inspection intact.\n');

        console.log('======================================================');
        console.log('🎉 ALL SECURITY INTEGRATION TESTS PASSED SUCCESSFULLY!');
        console.log('======================================================\n');
    } finally {
        server.close();
    }
}

runSecurityTests().catch(err => {
    console.error('❌ SECURITY TEST FAILED:', err);
    process.exit(1);
});
