/**
 * VortexJudge PostgreSQL Cloud Integration Module
 * Provides automated schema migrations, cloud persistence, and seamless
 * state hydration for Neon.tech, Supabase, and standard PostgreSQL databases.
 * 
 * Works in tandem with local runtime SQLite for zero-latency judging and
 * persistent cloud durability across ephemeral container restarts on Render.com.
 */

const { Pool } = require('pg');

let pool = null;
let isInitialized = false;
let isConfigured = false;
let isSyncing = false;
let sqliteRef = null;
const dirtyTables = new Set();
let debounceTimer = null;

const TABLES = [
  'settings',
  'users',
  'problems',
  'testcases',
  'contests',
  'contest_problems',
  'contest_participants',
  'submissions',
  'contest_editorials',
  'subtasks',
  'contest_judges',
  'contest_plagiarism',
  'sessions'
];

// PostgreSQL Schema Migration DDL
const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS _vortex_meta (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  rating INT DEFAULT 1200,
  solved_count INT DEFAULT 0,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  school TEXT DEFAULT 'Aniqlanmagan',
  grade TEXT DEFAULT '',
  contest_rating INT DEFAULT 1200,
  karma INT DEFAULT 0,
  last_visit TIMESTAMPTZ DEFAULT NULL,
  favorites TEXT DEFAULT '[]',
  plain_password TEXT DEFAULT '',
  theme VARCHAR(50) DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS problems (
  id BIGINT PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  statement TEXT NOT NULL,
  input_format TEXT NOT NULL,
  output_format TEXT NOT NULL,
  note TEXT,
  time_limit INT DEFAULT 1000,
  memory_limit INT DEFAULT 256,
  difficulty VARCHAR(50) DEFAULT 'Oson',
  score INT DEFAULT 100,
  checker_type VARCHAR(50) DEFAULT 'default',
  is_active INT DEFAULT 1,
  is_public INT DEFAULT 0,
  is_secret INT DEFAULT 0,
  is_archived INT DEFAULT 0,
  visibility VARCHAR(50) DEFAULT 'private',
  category VARCHAR(255) DEFAULT 'Boshlang‘ich',
  author_name VARCHAR(255) DEFAULT 'Hakam',
  checker_comparator VARCHAR(50) DEFAULT 'default',
  checker_lang VARCHAR(50) DEFAULT 'cpp',
  checker_code TEXT DEFAULT '',
  validator_lang VARCHAR(50) DEFAULT 'cpp',
  validator_code TEXT DEFAULT '',
  validator_mode INT DEFAULT 0,
  has_subtasks INT DEFAULT 0,
  is_subtask INT DEFAULT 0,
  icpc_archive_path TEXT DEFAULT '',
  subtasks_config TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testcases (
  id BIGINT PRIMARY KEY,
  problem_id BIGINT NOT NULL,
  test_index INT NOT NULL,
  input_data TEXT NOT NULL,
  output_data TEXT NOT NULL,
  is_sample INT DEFAULT 0,
  points INT DEFAULT 10,
  subtask_group INT DEFAULT 1,
  zip_name TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS contests (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  contest_type VARCHAR(50) DEFAULT 'icpc',
  freeze_minutes INT DEFAULT 60,
  is_active INT DEFAULT 1,
  contest_mode VARCHAR(50) DEFAULT 'public',
  type VARCHAR(50) DEFAULT 'PUBLIC',
  default_language VARCHAR(50) DEFAULT 'uz',
  allowed_programming_languages TEXT DEFAULT '[]',
  allowed_languages TEXT DEFAULT '[]',
  editorial TEXT DEFAULT '',
  rules VARCHAR(50) DEFAULT 'ICPC_CUSTOM',
  participation_mode VARCHAR(50) DEFAULT 'NORMAL',
  participation_type VARCHAR(50) DEFAULT 'INDIVIDUAL',
  duration VARCHAR(50) DEFAULT '02:00',
  registration_end_time TIMESTAMPTZ DEFAULT NULL,
  min_rating INT DEFAULT 1000,
  max_rating INT DEFAULT 5000,
  rating_limit INT DEFAULT 0,
  submissions_limit INT DEFAULT 0,
  rules_url TEXT DEFAULT '',
  max_attempts_per_problem INT DEFAULT NULL,
  penalty_per_wrong_attempt INT DEFAULT 4,
  hide_problem_authors INT DEFAULT 0,
  hide_authors INT DEFAULT 0,
  hide_results INT DEFAULT 0,
  hide_submissions INT DEFAULT 0,
  open_standings INT DEFAULT 0,
  open_registration INT DEFAULT 1,
  show_problems_after_contest INT DEFAULT 1,
  allow_virtual_participation INT DEFAULT 0,
  virtual_allowed INT DEFAULT 0,
  judges TEXT DEFAULT '[]',
  target_grades TEXT DEFAULT '[]',
  editorial_published INT DEFAULT 0,
  editorial_enabled INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contest_problems (
  id BIGINT PRIMARY KEY,
  contest_id BIGINT NOT NULL,
  problem_id BIGINT NOT NULL,
  problem_order INT NOT NULL,
  letter VARCHAR(10) NOT NULL,
  letter_index VARCHAR(10) DEFAULT 'A',
  score INT DEFAULT 100,
  order_num INT DEFAULT 0,
  UNIQUE(contest_id, problem_id)
);

CREATE TABLE IF NOT EXISTS contest_participants (
  id BIGINT PRIMARY KEY,
  contest_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  is_official INT DEFAULT 1,
  is_registered INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'REGISTERED',
  is_disqualified INT DEFAULT 0,
  disqualification_reason TEXT DEFAULT NULL,
  UNIQUE(contest_id, user_id)
);

CREATE TABLE IF NOT EXISTS submissions (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  problem_id BIGINT NOT NULL,
  contest_id BIGINT,
  language VARCHAR(50) NOT NULL,
  code TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  score INT DEFAULT 0,
  time_spent INT DEFAULT 0,
  memory_used INT DEFAULT 0,
  test_details TEXT,
  compiler_output TEXT,
  attempt_number INT DEFAULT 1,
  is_upsolve INT DEFAULT 0,
  execution_time_ms INT DEFAULT 0,
  memory_kb INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contest_editorials (
  id BIGINT PRIMARY KEY,
  contest_id BIGINT NOT NULL,
  problem_id BIGINT NOT NULL,
  explanation TEXT DEFAULT '',
  code_cpp TEXT DEFAULT '',
  code_python TEXT DEFAULT '',
  code_java TEXT DEFAULT '',
  is_published INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, problem_id)
);

CREATE TABLE IF NOT EXISTS subtasks (
  id BIGINT PRIMARY KEY,
  problem_id BIGINT NOT NULL,
  subtask_index INT NOT NULL,
  score INT DEFAULT 50,
  tests_path TEXT DEFAULT '',
  has_testcases INT DEFAULT 0,
  tests_count INT DEFAULT 0,
  zip_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contest_judges (
  id BIGINT PRIMARY KEY,
  contest_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(50) DEFAULT 'judge',
  status VARCHAR(50) DEFAULT 'ACCEPTED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, user_id)
);

CREATE TABLE IF NOT EXISTS contest_plagiarism (
  id BIGINT PRIMARY KEY,
  contest_id BIGINT NOT NULL,
  problem_id BIGINT NOT NULL,
  submission_id BIGINT NOT NULL,
  suspect_user_id BIGINT NOT NULL,
  similarity_percentage REAL DEFAULT 0,
  code_snippet TEXT DEFAULT '',
  admin_note TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(255) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_problems_code ON problems(code);
CREATE INDEX IF NOT EXISTS idx_testcases_prob ON testcases(problem_id);
CREATE INDEX IF NOT EXISTS idx_cp_contest ON contest_problems(contest_id);
CREATE INDEX IF NOT EXISTS idx_participants_contest ON contest_participants(contest_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_prob ON submissions(user_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_editorials_contest_prob ON contest_editorials(contest_id, problem_id);
`;

/**
 * Initialize PostgreSQL connection, apply auto-migrations, and synchronize state.
 */
async function initPostgres(sqliteDb) {
  sqliteRef = sqliteDb;
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || !dbUrl.trim()) {
    console.log('[PostgreSQL]: DATABASE_URL is not set. Running in resilient local SQLite mode.');
    isConfigured = false;
    return false;
  }

  isConfigured = true;

  try {
    pool = new Pool({
      connectionString: dbUrl.trim(),
      ssl: { rejectUnauthorized: false }, // Compatible with Supabase, Neon.tech, Render Postgres
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL POOL ERROR]:', err.message);
    });

    const client = await pool.connect();
    console.log('[PostgreSQL]: Successfully connected to cloud database via DATABASE_URL.');

    try {
      // 1. Run Auto-migrations
      console.log('[PostgreSQL]: Verifying & applying schema migrations...');
      await client.query(SCHEMA_DDL);
      console.log('[PostgreSQL]: All tables verified and ready.');

      // 2. Check existing data in PostgreSQL
      const probCountRes = await client.query('SELECT COUNT(*) as c FROM problems');
      const cloudProbCount = parseInt(probCountRes.rows[0].c, 10) || 0;

      if (cloudProbCount > 0) {
        // Cloud has authoritative data -> Hydrate into local SQLite
        console.log(`[PostgreSQL]: Found existing data in cloud database (${cloudProbCount} problems). Restoring local runtime cache...`);
        await hydrateFromPostgres(client, sqliteDb);
      } else {
        // Cloud is empty -> Push current seed data to cloud
        console.log('[PostgreSQL]: Cloud database is empty. Initializing cloud database with current data...');
        await seedPostgresFromLocal(client, sqliteDb);
      }

      await client.query(`
        INSERT INTO _vortex_meta (key, value, updated_at) 
        VALUES ('last_sync', NOW()::text, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
      `);

      isInitialized = true;
      console.log('[PostgreSQL]: Cloud persistence is ACTIVE. All data will be preserved permanently across container restarts.');
      return true;

    } finally {
      client.release();
    }

  } catch (err) {
    console.error('[PostgreSQL INIT ERROR]: Could not initialize cloud database:', err.message);
    console.warn('[PostgreSQL]: Falling back to local runtime database to ensure uninterrupted service.');
    return false;
  }
}

/**
 * Hydrates local SQLite database from Cloud PostgreSQL.
 */
async function hydrateFromPostgres(client, sqliteDb) {
  if (!sqliteDb || typeof sqliteDb.prepare !== 'function') return;

  for (const table of TABLES) {
    try {
      const res = await client.query(`SELECT * FROM ${table}`);
      if (!res.rows || res.rows.length === 0) continue;

      sqliteDb.exec('BEGIN TRANSACTION');
      try {
        sqliteDb.exec(`DELETE FROM ${table}`);

        const sampleRow = res.rows[0];
        const cols = Object.keys(sampleRow);
        const placeholders = cols.map(() => '?').join(', ');
        const insertSql = `INSERT OR REPLACE INTO ${table} (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
        const stmt = sqliteDb.prepare(insertSql);

        for (const row of res.rows) {
          const vals = cols.map(c => {
            const val = row[c];
            if (val instanceof Date) return val.toISOString();
            if (val === null || val === undefined) return null;
            return val;
          });
          stmt.run(...vals);
        }

        sqliteDb.exec('COMMIT');
        console.log(`[PostgreSQL -> SQLite]: Restored ${res.rows.length} records into '${table}'.`);
      } catch (errTable) {
        sqliteDb.exec('ROLLBACK');
        console.error(`[PostgreSQL -> SQLite]: Error restoring table '${table}':`, errTable.message);
      }
    } catch (e) {
      console.error(`[PostgreSQL -> SQLite]: Query error on '${table}':`, e.message);
    }
  }
}

/**
 * Seeds empty Cloud PostgreSQL from current local SQLite.
 */
async function seedPostgresFromLocal(client, sqliteDb) {
  if (!sqliteDb || typeof sqliteDb.prepare !== 'function') return;

  for (const table of TABLES) {
    try {
      const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
      if (!rows || rows.length === 0) continue;

      await client.query('BEGIN');
      try {
        await client.query(`TRUNCATE TABLE ${table} CASCADE`);

        const cols = Object.keys(rows[0]);
        const colList = cols.map(c => `"${c}"`).join(', ');

        for (const row of rows) {
          const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(', ');
          const vals = cols.map(c => row[c]);
          await client.query(`INSERT INTO ${table} (${colList}) VALUES (${placeholders})`, vals);
        }

        await client.query('COMMIT');
        console.log(`[SQLite -> PostgreSQL]: Seeded ${rows.length} records into cloud '${table}'.`);
      } catch (errTable) {
        await client.query('ROLLBACK');
        console.error(`[SQLite -> PostgreSQL]: Error seeding table '${table}':`, errTable.message);
      }
    } catch (e) {
      console.error(`[SQLite -> PostgreSQL]: Read error on '${table}':`, e.message);
    }
  }
}

/**
 * Notifies that a table was modified in the local database.
 * Schedules an asynchronous background sync to Cloud PostgreSQL.
 */
function notifyTableModified(tableName) {
  if (!isConfigured || !pool) return;
  const clean = String(tableName).toLowerCase().trim();
  if (TABLES.includes(clean)) {
    dirtyTables.add(clean);
    scheduleDebouncedSync();
  }
}

function scheduleDebouncedSync() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    flushPendingSync().catch(err => {
      console.error('[PostgreSQL BACKGROUND SYNC ERROR]:', err.message);
    });
  }, 1000);
}

/**
 * Flushes all pending dirty tables to Cloud PostgreSQL.
 */
async function flushPendingSync() {
  if (!isConfigured || !pool || dirtyTables.size === 0 || isSyncing) return;
  if (!sqliteRef || typeof sqliteRef.prepare !== 'function') return;

  isSyncing = true;
  const tablesToSync = Array.from(dirtyTables);
  dirtyTables.clear();

  let client;
  try {
    client = await pool.connect();
    for (const table of tablesToSync) {
      try {
        const rows = sqliteRef.prepare(`SELECT * FROM ${table}`).all();
        await client.query('BEGIN');
        await client.query(`DELETE FROM ${table}`);

        if (rows && rows.length > 0) {
          const cols = Object.keys(rows[0]);
          const colList = cols.map(c => `"${c}"`).join(', ');

          for (const row of rows) {
            const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(', ');
            const vals = cols.map(c => row[c]);
            await client.query(`INSERT INTO ${table} (${colList}) VALUES (${placeholders})`, vals);
          }
        }

        await client.query('COMMIT');
        console.log(`[PostgreSQL SYNC]: Synchronized ${rows.length} rows for table '${table}' to cloud.`);
      } catch (tableErr) {
        await client.query('ROLLBACK');
        console.error(`[PostgreSQL SYNC ERROR on '${table}']:`, tableErr.message);
        dirtyTables.add(table); // Re-queue for next sync
      }
    }

    await client.query(`
      INSERT INTO _vortex_meta (key, value, updated_at) 
      VALUES ('last_sync', NOW()::text, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
    `);

  } catch (err) {
    console.error('[PostgreSQL FLUSH ERROR]:', err.message);
    // Re-queue tables
    for (const t of tablesToSync) dirtyTables.add(t);
  } finally {
    if (client) client.release();
    isSyncing = false;
  }
}

/**
 * Returns current status of PostgreSQL cloud database.
 */
function getStatus() {
  if (!isConfigured) {
    return { configured: false, status: 'local_sqlite', message: 'DATABASE_URL not set' };
  }
  return {
    configured: true,
    initialized: isInitialized,
    status: isInitialized ? 'connected' : 'connecting_or_error',
    dirty_tables_count: dirtyTables.size
  };
}

// Graceful process exit flush
process.on('SIGINT', async () => {
  if (dirtyTables.size > 0) {
    console.log('[PostgreSQL]: Flushing pending changes before exit...');
    await flushPendingSync();
  }
});

process.on('SIGTERM', async () => {
  if (dirtyTables.size > 0) {
    console.log('[PostgreSQL]: Flushing pending changes before termination...');
    await flushPendingSync();
  }
});

module.exports = {
  initPostgres,
  notifyTableModified,
  flushPendingSync,
  getStatus,
  TABLES
};
