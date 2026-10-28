const http = require('http');
const db = require('../src/db');
const assert = require('assert');

// Clean and prepare test data
const now = new Date();
const past = new Date(now.getTime() - 3600 * 1000).toISOString();
const future = new Date(now.getTime() + 3600 * 1000).toISOString();
const futureFar = new Date(now.getTime() + 7200 * 1000).toISOString();

console.log('--- STARTING PROBLEM PRIVACY & ACCESS CONTROL TESTS ---');

// 1. Ensure test users exist
let adminUser = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
let normalUser = db.prepare("SELECT * FROM users WHERE role = 'user' LIMIT 1").get();
let unregUser = db.prepare("SELECT * FROM users WHERE username = 'test_unreg_user'").get();

if (!unregUser) {
    db.prepare(`
        INSERT INTO users (username, password_hash, full_name, role)
        VALUES ('test_unreg_user', 'hash', 'Unregistered Student', 'user')
    `).run();
    unregUser = db.prepare("SELECT * FROM users WHERE username = 'test_unreg_user'").get();
}

// 2. Ensure test problems exist (one public, one private)
let pubProb = db.prepare("SELECT * FROM problems WHERE code = 'TESTPUB'").get();
if (!pubProb) {
    db.prepare(`
        INSERT INTO problems (code, title, statement, input_format, output_format, time_limit, memory_limit, score, is_active, is_public, visibility, is_secret)
        VALUES ('TESTPUB', 'Test Public Problem', 'Statement', 'Input', 'Output', 1000, 256, 100, 1, 1, 'public', 0)
    `).run();
    pubProb = db.prepare("SELECT * FROM problems WHERE code = 'TESTPUB'").get();
} else {
    db.prepare("UPDATE problems SET is_public = 1, visibility = 'public', is_secret = 0 WHERE id = ?").run(pubProb.id);
}

let privProb = db.prepare("SELECT * FROM problems WHERE code = 'TESTPRIV'").get();
if (!privProb) {
    db.prepare(`
        INSERT INTO problems (code, title, statement, input_format, output_format, time_limit, memory_limit, score, is_active, is_public, visibility, is_secret)
        VALUES ('TESTPRIV', 'Test Private Problem', 'Secret statement', 'Secret Input', 'Secret Output', 1000, 256, 100, 1, 0, 'private', 1)
    `).run();
    privProb = db.prepare("SELECT * FROM problems WHERE code = 'TESTPRIV'").get();
} else {
    db.prepare("UPDATE problems SET is_public = 0, visibility = 'private', is_secret = 1 WHERE id = ?").run(privProb.id);
}

// 3. Ensure test contests exist (one active, one upcoming)
let activeContest = db.prepare("SELECT * FROM contests WHERE title = 'Test Active Contest'").get();
if (!activeContest) {
    const res = db.prepare(`
        INSERT INTO contests (title, description, start_time, end_time, contest_type, is_active)
        VALUES ('Test Active Contest', 'Active contest desc', ?, ?, 'icpc', 1)
    `).run(past, future);
    activeContest = db.prepare("SELECT * FROM contests WHERE id = ?").get(res.lastInsertRowid);
} else {
    db.prepare("UPDATE contests SET start_time = ?, end_time = ? WHERE id = ?").run(past, future, activeContest.id);
}

let upcomingContest = db.prepare("SELECT * FROM contests WHERE title = 'Test Upcoming Contest'").get();
if (!upcomingContest) {
    const res = db.prepare(`
        INSERT INTO contests (title, description, start_time, end_time, contest_type, is_active)
        VALUES ('Test Upcoming Contest', 'Upcoming contest desc', ?, ?, 'icpc', 1)
    `).run(future, futureFar);
    upcomingContest = db.prepare("SELECT * FROM contests WHERE id = ?").get(res.lastInsertRowid);
} else {
    db.prepare("UPDATE contests SET start_time = ?, end_time = ? WHERE id = ?").run(future, futureFar, upcomingContest.id);
}

// Attach private problem to both contests
db.prepare("INSERT OR IGNORE INTO contest_problems (contest_id, problem_id, problem_order, letter) VALUES (?, ?, 1, 'A')").run(activeContest.id, privProb.id);
db.prepare("INSERT OR IGNORE INTO contest_problems (contest_id, problem_id, problem_order, letter) VALUES (?, ?, 1, 'A')").run(upcomingContest.id, privProb.id);

// Register normalUser to both contests, but NOT unregUser
db.prepare("INSERT OR IGNORE INTO contest_participants (contest_id, user_id, is_official) VALUES (?, ?, 1)").run(activeContest.id, normalUser.id);
db.prepare("INSERT OR IGNORE INTO contest_participants (contest_id, user_id, is_official) VALUES (?, ?, 1)").run(upcomingContest.id, normalUser.id);
db.prepare("DELETE FROM contest_participants WHERE user_id = ?").run(unregUser.id);

// Create session tokens for test users
const adminToken = 'admin-test-token-' + Date.now();
const normalToken = 'normal-test-token-' + Date.now();
const unregToken = 'unreg-test-token-' + Date.now();

db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(adminToken, adminUser.id);
db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(normalToken, normalUser.id);
db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(unregToken, unregUser.id);

// Helper function to make HTTP requests
function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch (_) {}
                resolve({ status: res.statusCode, headers: res.headers, data: parsed, text: data });
            });
        });
        req.on('error', reject);
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    try {
        console.log('\n--- 1. Testing Public Catalog Filtering ---');
        // Unauthenticated request to /api/problems
        const unauthCatalog = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api/problems',
            method: 'GET'
        });
        assert.strictEqual(unauthCatalog.status, 200);
        const unauthCodes = unauthCatalog.data.map(p => p.code);
        console.log('Unauthenticated problem count:', unauthCodes.length);
        assert(unauthCodes.includes('TESTPUB'), 'Public problem must be visible in public catalog');
        assert(!unauthCodes.includes('TESTPRIV'), 'Private problem MUST NOT be in public catalog');
        assert(!unauthCodes.includes('0901'), '0901 (Private) MUST NOT be in public catalog');
        console.log('✓ Public catalog excludes private problems for unauthenticated visitors');

        // Normal student request to /api/problems
        const studentCatalog = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api/problems',
            method: 'GET',
            headers: { 'Cookie': `token=${normalToken}` }
        });
        assert.strictEqual(studentCatalog.status, 200);
        const studentCodes = studentCatalog.data.map(p => p.code);
        assert(!studentCodes.includes('TESTPRIV'), 'Private problem MUST NOT be visible to student');
        assert(!studentCodes.includes('0901'), '0901 MUST NOT be visible to student');
        console.log('✓ Public catalog excludes private problems for logged-in students');

        // Admin request to /api/problems
        const adminCatalog = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api/problems',
            method: 'GET',
            headers: { 'Cookie': `token=${adminToken}` }
        });
        assert.strictEqual(adminCatalog.status, 200);
        const adminCodes = adminCatalog.data.map(p => p.code);
        assert(adminCodes.includes('TESTPRIV'), 'Admin must see private problems in /api/problems');
        assert(adminCodes.includes('TESTPUB'), 'Admin must see public problems in /api/problems');
        console.log('✓ Admin exemption verified in /api/problems');

        // Live autocomplete search /api/problems/search
        const studentSearch = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api/problems/search?q=TESTPRIV',
            method: 'GET',
            headers: { 'Cookie': `token=${normalToken}` }
        });
        assert.strictEqual(studentSearch.status, 200);
        assert.strictEqual(studentSearch.data.problems.length, 0, 'Private problem must not appear in student search');
        console.log('✓ Search excludes private problems for students');

        const adminSearch = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api/problems/search?q=TESTPRIV',
            method: 'GET',
            headers: { 'Cookie': `token=${adminToken}` }
        });
        assert.strictEqual(adminSearch.status, 200);
        assert(adminSearch.data.problems.some(p => p.code === 'TESTPRIV'), 'Admin search finds private problem');
        console.log('✓ Search includes private problems for admin');

        console.log('\n--- 2. Testing Direct Route Protection ---');
        // Student direct access to private problem via /api/problems/:code
        const directApiStudent = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api/problems/TESTPRIV',
            method: 'GET',
            headers: { 'Cookie': `token=${normalToken}` }
        });
        assert.strictEqual(directApiStudent.status, 403, 'Direct access to private problem must be 403 Forbidden');
        assert.strictEqual(directApiStudent.data.is_private, true);
        console.log('✓ Direct API access to private problem blocked with 403 Forbidden');

        // Student direct access to private problem via HTML route /problems/:code
        const directHtmlStudent = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: '/problems/TESTPRIV',
            method: 'GET',
            headers: { 'Cookie': `token=${normalToken}` }
        });
        assert.strictEqual(directHtmlStudent.status, 403, 'Direct HTML route to private problem must return 403');
        assert(directHtmlStudent.text.includes('403 — Maxfiy Masala'), 'HTML page must display 403 message');
        console.log('✓ Direct browser route to private problem blocked with 403 page');

        // Admin direct access
        const directAdmin = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api/problems/TESTPRIV',
            method: 'GET',
            headers: { 'Cookie': `token=${adminToken}` }
        });
        assert.strictEqual(directAdmin.status, 200, 'Admin can view private problem directly');
        console.log('✓ Admin can access private problem directly');

        console.log('\n--- 3. Testing Contest-Only Visibility Rule ---');
        // Upcoming contest: not started yet
        // Participant in upcoming contest
        const upcomingParticipant = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: `/api/contests/${upcomingContest.id}/problems/${privProb.id}`,
            method: 'GET',
            headers: { 'Cookie': `token=${normalToken}` }
        });
        assert.strictEqual(upcomingParticipant.status, 403, 'Participant cannot access problem before contest starts');
        console.log('✓ Problem hidden before contest start (even for registered participant)');

        // Active contest: started
        // Unregistered student trying to access contest problem
        const unregAccess = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: `/api/contests/${activeContest.id}/problems/${privProb.id}`,
            method: 'GET',
            headers: { 'Cookie': `token=${unregToken}` }
        });
        assert.strictEqual(unregAccess.status, 403, 'Unregistered student cannot access contest problem');
        console.log('✓ Unregistered student blocked from contest problem with 403');

        // Registered student accessing active contest problem
        const regAccess = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: `/api/contests/${activeContest.id}/problems/${privProb.id}`,
            method: 'GET',
            headers: { 'Cookie': `token=${normalToken}` }
        });
        assert.strictEqual(regAccess.status, 200, 'Registered participant can access active contest problem');
        assert.strictEqual(regAccess.data.problem.code, 'TESTPRIV');
        console.log('✓ Registered participant successfully accessed active contest problem');

        // Also test /olympiads route alias
        const olymAccess = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: `/api/olympiads/${activeContest.id}/problems/${privProb.id}`,
            method: 'GET',
            headers: { 'Cookie': `token=${normalToken}` }
        });
        assert.strictEqual(olymAccess.status, 200, 'Alias /api/olympiads/:id/problems/:pid works');
        console.log('✓ /api/olympiads URL alias works correctly');

        console.log('\n--- 4. Testing Submission Access Control ---');
        // Submitting to private problem without contest_id
        const submitNoContest = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api/submissions',
            method: 'POST',
            headers: {
                'Cookie': `token=${normalToken}`,
                'Content-Type': 'application/json'
            }
        }, {
            problem_id: privProb.id,
            language: 'cpp',
            code: 'int main(){return 0;}'
        });
        assert.strictEqual(submitNoContest.status, 403, 'Submission to private problem outside contest must be 403');
        console.log('✓ Submissions to private problem outside contest blocked with 403');

        // Unregistered user submitting with contest_id
        const submitUnreg = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api/submissions',
            method: 'POST',
            headers: {
                'Cookie': `token=${unregToken}`,
                'Content-Type': 'application/json'
            }
        }, {
            problem_id: privProb.id,
            contest_id: activeContest.id,
            language: 'cpp',
            code: 'int main(){return 0;}'
        });
        assert.strictEqual(submitUnreg.status, 403, 'Unregistered user submitting to contest must be 403');
        console.log('✓ Unregistered user cannot submit to contest');

        // Registered user submitting with contest_id to active contest
        const submitReg = await request({
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api/submissions',
            method: 'POST',
            headers: {
                'Cookie': `token=${normalToken}`,
                'Content-Type': 'application/json'
            }
        }, {
            problem_id: privProb.id,
            contest_id: activeContest.id,
            language: 'cpp',
            code: 'int main(){return 0;}'
        });
        assert.strictEqual(submitReg.status, 200, 'Registered participant can submit to active contest');
        assert.strictEqual(submitReg.data.success, true);
        console.log('✓ Registered participant successfully submitted to active contest');

        console.log('\n🎉 ALL PRIVACY AND ACCESS CONTROL TESTS PASSED PERFECTLY!\n');
    } catch (err) {
        console.error('\n❌ TEST FAILED:', err);
        process.exit(1);
    } finally {
        // Clean up test sessions
        db.prepare("DELETE FROM sessions WHERE token IN (?, ?, ?)").run(adminToken, normalToken, unregToken);
    }
}

runTests();
