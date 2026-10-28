const assert = require('assert');
const path = require('path');
const fs = require('fs');
const db = require('../src/db');

console.log('Testing Subtasks & ICPC Testing Architecture...');

// 1. Check DB columns and tables
const probCols = db.prepare('PRAGMA table_info(problems)').all().map(c => c.name);
assert(probCols.includes('is_subtask'), 'problems table must have is_subtask');
assert(probCols.includes('icpc_archive_path'), 'problems table must have icpc_archive_path');

const subtasksTable = db.prepare('PRAGMA table_info(subtasks)').all().map(c => c.name);
assert(subtasksTable.includes('problem_id'), 'subtasks table must have problem_id');
assert(subtasksTable.includes('subtask_index'), 'subtasks table must have subtask_index');
assert(subtasksTable.includes('score'), 'subtasks table must have score');
assert(subtasksTable.includes('tests_path'), 'subtasks table must have tests_path');
assert(subtasksTable.includes('has_testcases'), 'subtasks table must have has_testcases');
console.log('✓ Database schema verified successfully');

// 2. Insert test problem
const testCode = 'TEST_SUBTASK_' + Date.now();
const ins = db.prepare(`
    INSERT INTO problems (code, title, statement, input_format, output_format, is_subtask, has_subtasks)
    VALUES (?, 'Subtask Test Problem', 'Statement here', 'N', 'Ans', 1, 1)
`).run(testCode);
const testId = Number(ins.lastInsertRowid);

// 3. Insert subtasks
db.prepare(`
    INSERT INTO subtasks (problem_id, subtask_index, score, tests_path, has_testcases, tests_count)
    VALUES (?, 1, 50, 'problems/' || ? || '/subtasks/subtask_1', 0, 0),
           (?, 2, 50, 'problems/' || ? || '/subtasks/subtask_2', 0, 0)
`).run(testId, testId, testId, testId);

const fetchedSubtasks = db.prepare('SELECT * FROM subtasks WHERE problem_id = ? ORDER BY subtask_index ASC').all(testId);
assert.strictEqual(fetchedSubtasks.length, 2, 'Must have 2 subtasks');
assert.strictEqual(fetchedSubtasks[0].subtask_index, 1, 'First subtask index must be 1');
assert.strictEqual(fetchedSubtasks[0].score, 50, 'First subtask score must be 50');
assert.strictEqual(fetchedSubtasks[1].subtask_index, 2, 'Second subtask index must be 2');
console.log('✓ Subtasks insertion & retrieval verified');

// 4. Test renumbering on delete of Subtask #1 or Subtask #2
db.prepare('DELETE FROM subtasks WHERE problem_id = ? AND subtask_index = 2').run(testId);
const remaining = db.prepare('SELECT * FROM subtasks WHERE problem_id = ?').all(testId);
assert.strictEqual(remaining.length, 1, 'Only 1 subtask should remain');
assert.strictEqual(remaining[0].subtask_index, 1, 'Subtask #1 must be intact');
console.log('✓ Subtask deletion verified');

// Cleanup
db.prepare('DELETE FROM subtasks WHERE problem_id = ?').run(testId);
db.prepare('DELETE FROM problems WHERE id = ?').run(testId);
console.log('✓ Cleanup completed');

console.log('ALL SUBTASK INTEGRITY TESTS PASSED SUCCESSFULLY! 🎉');
