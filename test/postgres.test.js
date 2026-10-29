// Test PostgreSQL Cloud integration module
const assert = require('assert');
const postgresManager = require('../src/postgres');
const db = require('../src/db');
const { ensureAdminUser } = require('../src/auth');

console.log('=== TESTING POSTGRESQL MODULE ===');

// Ensure default admin exists
ensureAdminUser(db);

// 1. Without DATABASE_URL (Local fallback mode)
delete process.env.DATABASE_URL;

postgresManager.initPostgres(db).then((result) => {
    assert.strictEqual(result, false, 'Should return false when DATABASE_URL is not set');
    const status = postgresManager.getStatus();
    assert.strictEqual(status.configured, false, 'Configured should be false');
    assert.strictEqual(status.status, 'local_sqlite', 'Status should be local_sqlite');
    console.log('[PASS] Local SQLite fallback mode verified');

    // 2. Check table notification
    postgresManager.notifyTableModified('contests');
    postgresManager.notifyTableModified('submissions');
    postgresManager.notifyTableModified('non_existent_table');
    console.log('[PASS] Table modification notification handled safely');

    // 3. Test db write hooks
    const testAdmin = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
    assert(testAdmin, 'Admin user should exist in SQLite');
    
    // Test update on user
    db.prepare("UPDATE users SET theme = 'dark' WHERE username = 'admin'").run();
    db.prepare("UPDATE users SET theme = 'light' WHERE username = 'admin'").run();
    console.log('[PASS] db.prepare().run() write hook executed cleanly without errors');

    console.log('=== ALL POSTGRESQL INTEGRATION TESTS PASSED! ===');
    process.exit(0);
}).catch(err => {
    console.error('[FAIL]:', err);
    process.exit(1);
});
