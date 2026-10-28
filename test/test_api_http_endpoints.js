const assert = require('assert');
const db = require('../src/db');

async function testHttpEndpoints() {
    console.log('Testing HTTP Endpoints on http://localhost:3000...');

    // Setup admin user & session
    db.prepare("INSERT OR IGNORE INTO users (id, username, password_hash, full_name, role) VALUES (1111, 'api_admin', 'hash', 'API Admin', 'admin')").run();
    const adminToken = 'admin-api-token-' + Date.now();
    db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, 1111)").run(adminToken);

    // 1. Check user search with include_staff=true
    const resUsers = await fetch('http://localhost:3000/api/admin/users/search?include_staff=true&q=api_admin', {
        headers: { 'Cookie': `token=${adminToken}` }
    });
    assert.strictEqual(resUsers.status, 200, 'Search must return 200 for admin');
    const usersData = await resUsers.json();
    const users = Array.isArray(usersData) ? usersData : (usersData.users || []);
    assert(Array.isArray(users), 'users must be an array');
    assert(users.some(u => u.username === 'api_admin'), 'Must find api_admin user');
    console.log(`✓ GET /api/admin/users/search?include_staff=true returned matching user:`, users[0].username);

    // 2. Check contests list
    const resContests = await fetch('http://localhost:3000/api/contests');
    assert.strictEqual(resContests.status, 200, 'Contests must return 200');
    const contestsData = await resContests.json();
    assert(Array.isArray(contestsData), 'contests must be an array');
    console.log(`✓ GET /api/contests returned ${contestsData.length} contest(s)`);

    // Cleanup session
    db.prepare("DELETE FROM sessions WHERE token = ?").run(adminToken);

    console.log('\n🎉 ALL HTTP ENDPOINTS TESTED SUCCESSFULLY!');
}

testHttpEndpoints().catch(err => {
    console.error('HTTP test failed:', err);
    process.exit(1);
});
