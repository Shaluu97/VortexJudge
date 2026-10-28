const db = require('./src/db');
const runner = require('./src/judge/runner');

async function waitSubmission(id) {
    while (true) {
        const sub = db.prepare('SELECT id, status, time_spent, memory_used, test_details, compiler_output FROM submissions WHERE id = ?').get(id);
        if (sub && sub.status !== 'Pending' && sub.status !== 'Running') {
            return sub;
        }
        await new Promise(r => setTimeout(r, 200));
    }
}

async function run() {
    console.log('--- TEST 1: Normal Correct C++ Solution ---');
    const normalCpp = `#include <iostream>
using namespace std;
int main() {
    long long a, b;
    while (cin >> a >> b) {
        cout << a + b << endl;
    }
    return 0;
}`;
    const sub1 = db.prepare(`
        INSERT INTO submissions (user_id, problem_id, language, code, status)
        VALUES (1, 1, 'cpp', ?, 'Pending')
    `).run(normalCpp);
    runner.enqueueSubmission(sub1.lastInsertRowid);
    const res1 = await waitSubmission(sub1.lastInsertRowid);
    console.log('Test 1 Verdict:', res1.status);
    console.log('Test 1 Memory Used:', res1.memory_used, 'KB');
    console.log('Test 1 Time Spent:', res1.time_spent, 'ms');

    console.log('\n--- TEST 2: C++ 400MB Memory Hog (Problem limit is 256MB) ---');
    const hogCpp = `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int*> ptrs;
    for (int i = 0; i < 400; i++) {
        int* p = new int[250000]; // 1MB
        p[0] = i;
        p[249999] = i;
        ptrs.push_back(p);
    }
    long long a, b;
    if (cin >> a >> b) cout << a + b << endl;
    return 0;
}`;
    const sub2 = db.prepare(`
        INSERT INTO submissions (user_id, problem_id, language, code, status)
        VALUES (1, 1, 'cpp', ?, 'Pending')
    `).run(hogCpp);
    runner.enqueueSubmission(sub2.lastInsertRowid);
    const res2 = await waitSubmission(sub2.lastInsertRowid);
    console.log('Test 2 Verdict:', res2.status);
    console.log('Test 2 Memory Used:', res2.memory_used, 'KB');
    console.log('Test 2 Test Details:', res2.test_details);

    console.log('\n--- TEST 3: Python 400MB Memory Hog (Problem limit is 256MB) ---');
    const hogPy = `import sys
data = []
for _ in range(50):
    data.append([0] * 1000000) # ~8MB each = ~400MB
for line in sys.stdin:
    parts = line.split()
    if len(parts) >= 2:
        print(int(parts[0]) + int(parts[1]))
`;
    const sub3 = db.prepare(`
        INSERT INTO submissions (user_id, problem_id, language, code, status)
        VALUES (1, 1, 'python', ?, 'Pending')
    `).run(hogPy);
    runner.enqueueSubmission(sub3.lastInsertRowid);
    const res3 = await waitSubmission(sub3.lastInsertRowid);
    console.log('Test 3 Verdict:', res3.status);
    console.log('Test 3 Memory Used:', res3.memory_used, 'KB');
    console.log('Test 3 Test Details:', res3.test_details);
}

run().catch(console.error);
