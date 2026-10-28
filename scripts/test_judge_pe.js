const db = require('../src/db');
const runner = require('../src/judge/runner');

async function waitSubmission(id) {
    while (true) {
        const sub = db.prepare('SELECT id, status, time_spent, memory_used, test_details, compiler_output FROM submissions WHERE id = ?').get(id);
        if (sub && sub.status !== 'Pending' && sub.status !== 'Running') {
            return sub;
        }
        await new Promise(r => setTimeout(r, 100));
    }
}

async function testPE() {
    console.log('=== TESTING PRESENTATION ERROR (PE) ===\n');

    // 1. Create a test problem with checker_type = 'strict'
    // Problem output expects "5\n" for test 1 (input "2 3\n")
    const testProb = db.prepare(`
        INSERT INTO problems (code, title, statement, input_format, output_format, note, time_limit, memory_limit, score, checker_type, visibility, is_public)
        VALUES ('9999', 'PE Test Problem', 'A+B problem', '', '', '', 1000, 256, 100, 'strict', 'public', 1)
    `).run();
    const probId = Number(testProb.lastInsertRowid);

    // Insert 1 testcase: input "2 3\n", output "5\n"
    db.prepare(`
        INSERT INTO testcases (problem_id, test_index, input_data, output_data, is_sample, points, subtask_group)
        VALUES (?, 1, '2 3\n', '5\n', 1, 100, 1)
    `).run(probId);

    // CASE 1: Exact match C++ solution -> Expect Accepted
    console.log('1. Submitting exact match: "cout << a + b << endl;"');
    const exactCode = `#include <iostream>
using namespace std;
int main() {
    int a, b;
    if (cin >> a >> b) cout << a + b << endl;
    return 0;
}`;
    let sub = db.prepare(`INSERT INTO submissions (user_id, problem_id, language, code, status) VALUES (1, ?, 'cpp', ?, 'Pending')`).run(probId, exactCode);
    runner.enqueueSubmission(sub.lastInsertRowid);
    let res = await waitSubmission(sub.lastInsertRowid);
    console.log('   Verdict:', res.status);
    console.log('   Details:', res.test_details);

    // CASE 2: Trailing space: "cout << a + b << ' ' << endl;" -> Expect Presentation Error
    console.log('\n2. Submitting trailing space: "cout << a + b << \\" \\" << endl;"');
    const trailingSpaceCode = `#include <iostream>
using namespace std;
int main() {
    int a, b;
    if (cin >> a >> b) cout << a + b << " " << endl;
    return 0;
}`;
    sub = db.prepare(`INSERT INTO submissions (user_id, problem_id, language, code, status) VALUES (1, ?, 'cpp', ?, 'Pending')`).run(probId, trailingSpaceCode);
    runner.enqueueSubmission(sub.lastInsertRowid);
    res = await waitSubmission(sub.lastInsertRowid);
    console.log('   Verdict:', res.status);
    console.log('   Details:', res.test_details);

    // CASE 3: Extra empty lines: "cout << a + b << endl << endl;" -> Expect Presentation Error
    console.log('\n3. Submitting extra newline: "cout << a + b << endl << endl;"');
    const extraNewlineCode = `#include <iostream>
using namespace std;
int main() {
    int a, b;
    if (cin >> a >> b) cout << a + b << endl << endl;
    return 0;
}`;
    sub = db.prepare(`INSERT INTO submissions (user_id, problem_id, language, code, status) VALUES (1, ?, 'cpp', ?, 'Pending')`).run(probId, extraNewlineCode);
    runner.enqueueSubmission(sub.lastInsertRowid);
    res = await waitSubmission(sub.lastInsertRowid);
    console.log('   Verdict:', res.status);
    console.log('   Details:', res.test_details);

    // CASE 4: Wrong Answer: "cout << a + b + 1 << endl;" -> Expect Wrong Answer
    console.log('\n4. Submitting wrong answer: "cout << a + b + 1 << endl;"');
    const wrongCode = `#include <iostream>
using namespace std;
int main() {
    int a, b;
    if (cin >> a >> b) cout << a + b + 1 << endl;
    return 0;
}`;
    sub = db.prepare(`INSERT INTO submissions (user_id, problem_id, language, code, status) VALUES (1, ?, 'cpp', ?, 'Pending')`).run(probId, wrongCode);
    runner.enqueueSubmission(sub.lastInsertRowid);
    res = await waitSubmission(sub.lastInsertRowid);
    console.log('   Verdict:', res.status);
    console.log('   Details:', res.test_details);

    // 2. Test Case Sensitivity (e.g. YES/NO problem)
    const yesProb = db.prepare(`
        INSERT INTO problems (code, title, statement, input_format, output_format, note, time_limit, memory_limit, score, checker_type, visibility, is_public)
        VALUES ('9998', 'Yes/No Test Problem', 'Print YES', '', '', '', 1000, 256, 100, 'strict', 'public', 1)
    `).run();
    const yesProbId = Number(yesProb.lastInsertRowid);
    db.prepare(`
        INSERT INTO testcases (problem_id, test_index, input_data, output_data, is_sample, points, subtask_group)
        VALUES (?, 1, '1\n', 'YES\n', 1, 100, 1)
    `).run(yesProbId);

    // CASE 5: Lowercase "yes" instead of "YES" in strict mode -> Expect Presentation Error
    console.log('\n5. Submitting "yes" when expected is "YES" (strict checker):');
    const yesCode = `print("yes")`;
    sub = db.prepare(`INSERT INTO submissions (user_id, problem_id, language, code, status) VALUES (1, ?, 'python', ?, 'Pending')`).run(yesProbId, yesCode);
    runner.enqueueSubmission(sub.lastInsertRowid);
    res = await waitSubmission(sub.lastInsertRowid);
    console.log('   Verdict:', res.status);
    console.log('   Details:', res.test_details);

    // Clean up temporary test problems & submissions
    db.prepare('DELETE FROM submissions WHERE problem_id IN (?, ?)').run(probId, yesProbId);
    db.prepare('DELETE FROM testcases WHERE problem_id IN (?, ?)').run(probId, yesProbId);
    db.prepare('DELETE FROM problems WHERE id IN (?, ?)').run(probId, yesProbId);

    console.log('\n=== ALL TESTS FINISHED SUCCESSFULLY! ===');
}

testPE().catch(console.error);
