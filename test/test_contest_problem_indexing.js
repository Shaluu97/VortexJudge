const db = require('../src/db');
const assert = require('assert');

function getLetterIndex(index) {
    let letter = '';
    index = Number(index) + 1;
    while (index > 0) {
        const rem = (index - 1) % 26;
        letter = String.fromCharCode(65 + rem) + letter;
        index = Math.floor((index - 1) / 26);
    }
    return letter;
}

// Test alphabet indexing function
console.log('Testing Alphabet Indexing Function:');
assert.strictEqual(getLetterIndex(0), 'A');
assert.strictEqual(getLetterIndex(1), 'B');
assert.strictEqual(getLetterIndex(25), 'Z');
assert.strictEqual(getLetterIndex(26), 'AA');
assert.strictEqual(getLetterIndex(27), 'AB');
assert.strictEqual(getLetterIndex(51), 'AZ');
assert.strictEqual(getLetterIndex(52), 'BA');
console.log('✓ Alphabet indexing passed (A..Z..AA..AB..BA)');

// Test DB search for A+B
// Insert sample A+B problem if not exists
const existing = db.prepare('SELECT id FROM problems WHERE title = ?').get('A+B Masalasi');
let testProbId;
if (!existing) {
    const res = db.prepare(`
        INSERT INTO problems (code, title, statement, input_format, output_format, time_limit, memory_limit, score, is_active, is_public, visibility, is_secret)
        VALUES ('TESTAB1', 'A+B Masalasi', 'A va B yig‘indisini hisoblang', 'A B', 'A+B', 1000, 256, 10, 1, 1, 'public', 0)
    `).run();
    testProbId = res.lastInsertRowid;
} else {
    testProbId = existing.id;
}

const query = 'A+B';
const pattern = `%${query.toLowerCase()}%`;
const searchResults = db.prepare(`
    SELECT p.id, p.code, p.title
    FROM problems p
    WHERE p.is_active = 1 AND (LOWER(p.title) LIKE ? OR LOWER(p.code) LIKE ?)
`).all(pattern, pattern);

console.log('Search results for "A+B":', searchResults.map(r => r.title));
assert(searchResults.some(r => r.title.includes('A+B')));
console.log('✓ Problem search with special characters like A+B passed!');
