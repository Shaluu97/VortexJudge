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

postgresManager.initPostgres(db).then(async (result) => {
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

    // 4. Test Topological Order of TABLES
    const tables = postgresManager.TABLES;
    const usersIdx = tables.indexOf('users');
    const contestsIdx = tables.indexOf('contests');
    const problemsIdx = tables.indexOf('problems');
    const testcasesIdx = tables.indexOf('testcases');
    const submissionsIdx = tables.indexOf('submissions');

    assert(usersIdx !== -1 && contestsIdx !== -1 && problemsIdx !== -1, 'Core tables must exist in TABLES');
    assert(usersIdx < problemsIdx, 'Independent table users must come before problems');
    assert(contestsIdx < problemsIdx, 'Independent table contests must come before problems');
    assert(problemsIdx < testcasesIdx, 'Parent table problems must come before child testcases');
    assert(problemsIdx < submissionsIdx, 'Parent table problems must come before child submissions');
    assert(usersIdx < submissionsIdx, 'Parent table users must come before child submissions');
    console.log('[PASS] Topological table restoration order verified (users, contests -> problems -> testcases, submissions)');

    // 5. Test SQLite Foreign Keys toggling and mock hydration
    postgresManager.setSqliteForeignKeys(db, false);
    assert.strictEqual(db.pragma('foreign_keys', { simple: true }), 0, 'PRAGMA foreign_keys should be 0 (OFF)');
    postgresManager.setSqliteForeignKeys(db, true);
    assert.strictEqual(db.pragma('foreign_keys', { simple: true }), 1, 'PRAGMA foreign_keys should be 1 (ON)');
    console.log('[PASS] PRAGMA foreign_keys = OFF and ON toggling verified');

    // 6. Test Mock Hydration with active foreign keys
    const mockClient = {
        query: async (sql) => {
            if (sql.includes('FROM users')) {
                return { rows: [db.prepare("SELECT * FROM users WHERE username = 'admin'").get()] };
            }
            if (sql.includes('FROM problems')) {
                const sampleProb = db.prepare("SELECT * FROM problems LIMIT 1").get();
                return { rows: sampleProb ? [sampleProb] : [] };
            }
            return { rows: [] };
        }
    };

    // Hydrate with mock client
    await postgresManager.hydrateFromPostgres(mockClient, db);
    assert.strictEqual(db.pragma('foreign_keys', { simple: true }), 1, 'PRAGMA foreign_keys must be restored to 1 (ON) after hydration');
    console.log('[PASS] hydrateFromPostgres executed without FOREIGN KEY constraint errors and restored foreign_keys = ON');

    console.log('=== ALL POSTGRESQL INTEGRATION TESTS PASSED! ===');
    process.exit(0);
}).catch(err => {
    console.error('[FAIL]:', err);
    process.exit(1);
});
