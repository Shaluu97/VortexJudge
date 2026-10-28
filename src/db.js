const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Create tables
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    rating INTEGER DEFAULT 1200,
    solved_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    statement TEXT NOT NULL,
    input_format TEXT NOT NULL,
    output_format TEXT NOT NULL,
    note TEXT,
    time_limit INTEGER DEFAULT 1000,
    memory_limit INTEGER DEFAULT 256,
    difficulty TEXT DEFAULT 'Oson',
    score INTEGER DEFAULT 100,
    checker_type TEXT DEFAULT 'default',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS testcases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL,
    test_index INTEGER NOT NULL,
    input_data TEXT NOT NULL,
    output_data TEXT NOT NULL,
    is_sample INTEGER DEFAULT 0,
    points INTEGER DEFAULT 10,
    subtask_group INTEGER DEFAULT 1,
    FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    contest_type TEXT DEFAULT 'icpc',
    freeze_minutes INTEGER DEFAULT 60,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contest_problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contest_id INTEGER NOT NULL,
    problem_id INTEGER NOT NULL,
    problem_order INTEGER NOT NULL,
    letter TEXT NOT NULL,
    score INTEGER DEFAULT 100,
    UNIQUE(contest_id, problem_id),
    FOREIGN KEY(contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contest_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contest_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contest_id, user_id),
    FOREIGN KEY(contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    problem_id INTEGER NOT NULL,
    contest_id INTEGER,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    score INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    memory_used INTEGER DEFAULT 0,
    test_details TEXT,
    compiler_output TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(problem_id) REFERENCES problems(id)
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

// Safe column migrations for existing SQLite databases
function ensureColumn(table, column, definition) {
    try {
        const info = db.prepare(`PRAGMA table_info(${table})`).all();
        if (!info.some(c => c.name === column)) {
            db.exec(`ALTER TABLE ${table} ADD COLUMN "${column}" ${definition}`);
        }
    } catch (e) {
        console.error(`Migration error on ${table}.${column}:`, e.message);
    }
}

// Users extensions
ensureColumn('users', 'first_name', "TEXT DEFAULT ''");
ensureColumn('users', 'last_name', "TEXT DEFAULT ''");
ensureColumn('users', 'school', "TEXT DEFAULT 'Aniqlanmagan'");
ensureColumn('users', 'grade', "TEXT DEFAULT ''");
ensureColumn('users', 'contest_rating', "INTEGER DEFAULT 1200");
ensureColumn('users', 'karma', "INTEGER DEFAULT 0");
ensureColumn('users', 'last_visit', "DATETIME DEFAULT NULL");
ensureColumn('users', 'favorites', "TEXT DEFAULT '[]'");
ensureColumn('users', 'plain_password', "TEXT DEFAULT ''");
ensureColumn('users', 'theme', "TEXT DEFAULT 'light'");

// Problems extensions
ensureColumn('problems', 'category', "TEXT DEFAULT 'Boshlang‘ich'");
ensureColumn('problems', 'is_secret', "INTEGER DEFAULT 0");
ensureColumn('problems', 'is_archived', "INTEGER DEFAULT 0");
ensureColumn('problems', 'author_name', "TEXT DEFAULT 'Hakam'");
ensureColumn('problems', 'checker_comparator', "TEXT DEFAULT 'default'");
ensureColumn('problems', 'checker_lang', "TEXT DEFAULT 'cpp'");
ensureColumn('problems', 'checker_code', "TEXT DEFAULT ''");
ensureColumn('problems', 'validator_lang', "TEXT DEFAULT 'cpp'");
ensureColumn('problems', 'validator_code', "TEXT DEFAULT ''");
ensureColumn('problems', 'validator_mode', "INTEGER DEFAULT 0");
ensureColumn('problems', 'has_subtasks', "INTEGER DEFAULT 0");
ensureColumn('problems', 'is_subtask', "INTEGER DEFAULT 0");
ensureColumn('problems', 'icpc_archive_path', "TEXT DEFAULT ''");
ensureColumn('problems', 'subtasks_config', "TEXT DEFAULT '[]'");

// Testcases extensions
ensureColumn('testcases', 'subtask_group', "INTEGER DEFAULT 1");
ensureColumn('testcases', 'zip_name', "TEXT DEFAULT ''");

// Contests extensions
ensureColumn('contests', 'contest_mode', "TEXT DEFAULT 'public'");
ensureColumn('contests', 'type', "TEXT DEFAULT 'PUBLIC'");
ensureColumn('contests', 'default_language', "TEXT DEFAULT 'uz'");
ensureColumn('contests', 'allowed_programming_languages', "TEXT DEFAULT '[\"python3\", \"pypy\", \"cpp17\", \"java\"]'");
ensureColumn('contests', 'allowed_languages', "TEXT DEFAULT '[\"cpp\",\"java\",\"python\"]'");
ensureColumn('contests', 'editorial', "TEXT DEFAULT ''");
ensureColumn('contests', 'rules', "TEXT DEFAULT 'ICPC_CUSTOM'");
ensureColumn('contests', 'participation_mode', "TEXT DEFAULT 'NORMAL'");
ensureColumn('contests', 'participation_type', "TEXT DEFAULT 'INDIVIDUAL'");
ensureColumn('contests', 'duration', "TEXT DEFAULT '02:00'");
ensureColumn('contests', 'registration_end_time', "DATETIME DEFAULT NULL");
ensureColumn('contests', 'min_rating', "INTEGER DEFAULT 1000");
ensureColumn('contests', 'max_rating', "INTEGER DEFAULT 5000");
ensureColumn('contests', 'rating_limit', "INTEGER DEFAULT 0");
ensureColumn('contests', 'submissions_limit', "INTEGER DEFAULT 0");
ensureColumn('contests', 'rules_url', "TEXT DEFAULT ''");
ensureColumn('contests', 'max_attempts_per_problem', "INTEGER DEFAULT NULL");
ensureColumn('contests', 'penalty_per_wrong_attempt', "INTEGER DEFAULT 4");
ensureColumn('contests', 'hide_problem_authors', "INTEGER DEFAULT 0");
ensureColumn('contests', 'hide_authors', "INTEGER DEFAULT 0");
ensureColumn('contests', 'hide_results', "INTEGER DEFAULT 0");
ensureColumn('contests', 'hide_submissions', "INTEGER DEFAULT 0");
ensureColumn('contests', 'open_standings', "INTEGER DEFAULT 0");
ensureColumn('contests', 'open_registration', "INTEGER DEFAULT 1");
ensureColumn('contests', 'show_problems_after_contest', "INTEGER DEFAULT 1");
ensureColumn('contests', 'allow_virtual_participation', "INTEGER DEFAULT 0");
ensureColumn('contests', 'virtual_allowed', "INTEGER DEFAULT 0");
ensureColumn('contests', 'judges', "TEXT DEFAULT '[]'");
ensureColumn('contests', 'target_grades', "TEXT DEFAULT '[]'");

// Contest problems extensions
ensureColumn('contest_problems', 'letter_index', "TEXT DEFAULT 'A'");
ensureColumn('contest_problems', 'order', "INTEGER DEFAULT 1");
ensureColumn('contest_problems', 'order_num', "INTEGER DEFAULT 0");

// Contest participants extensions
ensureColumn('contest_participants', 'is_official', "INTEGER DEFAULT 1");
ensureColumn('contest_participants', 'is_registered', "INTEGER DEFAULT 1");
ensureColumn('contest_participants', 'status', "TEXT DEFAULT 'REGISTERED'");
ensureColumn('contest_participants', 'is_disqualified', "INTEGER DEFAULT 0");
ensureColumn('contest_participants', 'disqualification_reason', "TEXT DEFAULT NULL");

try {
    db.exec(`
        UPDATE contest_participants 
        SET is_registered = 1, status = 'REGISTERED' 
        WHERE is_registered IS NULL OR is_registered = 0 OR status IS NULL;

        UPDATE contest_problems 
        SET letter_index = letter 
        WHERE letter IS NOT NULL AND letter != '';
    `);
} catch (_) {}

// Problems visibility extensions (Public vs Private)
ensureColumn('problems', 'is_public', "INTEGER DEFAULT 0");
ensureColumn('problems', 'visibility', "TEXT DEFAULT 'private'");

// Synchronize visibility and is_public / is_secret consistency
try {
    db.exec(`
        UPDATE problems SET is_public = 0, visibility = 'private' WHERE is_secret = 1 OR visibility = 'private' OR is_public = 0;
        UPDATE problems SET is_public = 1, visibility = 'public' WHERE is_public = 1 AND (is_secret = 0 OR is_secret IS NULL) AND visibility = 'public';
    `);
} catch (_) {}

// Submissions extensions
ensureColumn('submissions', 'attempt_number', "INTEGER DEFAULT 1");
ensureColumn('submissions', 'is_upsolve', "INTEGER DEFAULT 0");
ensureColumn('submissions', 'execution_time_ms', "INTEGER DEFAULT 0");
ensureColumn('submissions', 'memory_kb', "INTEGER DEFAULT 0");

// Create new tables for Contest Judges and Contest Plagiarism
db.exec(`
CREATE TABLE IF NOT EXISTS contest_judges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contest_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'judge',
    status TEXT DEFAULT 'ACCEPTED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contest_id, user_id),
    FOREIGN KEY(contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contest_plagiarism (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contest_id INTEGER NOT NULL,
    problem_id INTEGER NOT NULL,
    submission_id INTEGER NOT NULL,
    suspect_user_id INTEGER NOT NULL,
    similarity_percentage REAL DEFAULT 0,
    code_snippet TEXT DEFAULT '',
    admin_note TEXT DEFAULT '',
    status TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY(submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY(suspect_user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

// Safe index creation
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS subtasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            problem_id INTEGER NOT NULL,
            subtask_index INTEGER NOT NULL,
            score INTEGER DEFAULT 50,
            tests_path TEXT DEFAULT '',
            has_testcases INTEGER DEFAULT 0,
            tests_count INTEGER DEFAULT 0,
            zip_name TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS contest_editorials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contest_id INTEGER NOT NULL,
            problem_id INTEGER NOT NULL,
            explanation TEXT DEFAULT '',
            code_cpp TEXT DEFAULT '',
            code_python TEXT DEFAULT '',
            code_java TEXT DEFAULT '',
            is_published INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(contest_id, problem_id)
        );

        CREATE INDEX IF NOT EXISTS idx_subtasks_problem ON subtasks(problem_id);
        CREATE INDEX IF NOT EXISTS idx_problems_public ON problems(is_public, is_active);
        CREATE INDEX IF NOT EXISTS idx_submissions_contest ON submissions(contest_id, user_id, problem_id);
        CREATE INDEX IF NOT EXISTS idx_plagiarism_contest ON contest_plagiarism(contest_id, problem_id);
        CREATE INDEX IF NOT EXISTS idx_judges_contest ON contest_judges(contest_id, user_id);
        CREATE INDEX IF NOT EXISTS idx_editorials_contest ON contest_editorials(contest_id, problem_id);
    `);
} catch (e) {
    console.error('Indeks yaratishda ogohlantirish:', e.message);
}

try {
    db.exec(`ALTER TABLE contests ADD COLUMN editorial_published INTEGER DEFAULT 0;`);
} catch (e) {}
try {
    db.exec(`ALTER TABLE contests ADD COLUMN editorial_enabled INTEGER DEFAULT 0;`);
} catch (e) {}

module.exports = db;
