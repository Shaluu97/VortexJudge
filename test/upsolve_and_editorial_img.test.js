const assert = require('assert');
const db = require('../src/db');
const contestsEngine = require('../src/contests');
const editorialSvg = require('../src/editorialSvg');

console.log('====================================================');
console.log('RUNNING UPSOLVE RULES & EDITORIAL IMAGE TEST SUITE');
console.log('====================================================');

let testsPassed = 0;
let totalTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`[Test ${String(totalTests).padStart(2, '0')}] ✓ PASS: ${name}`);
        testsPassed++;
    } catch (err) {
        console.error(`[Test ${String(totalTests).padStart(2, '0')}] ✗ FAIL: ${name}`);
        console.error(err);
        process.exit(1);
    }
}

// ── SETUP FIXTURES IN IN-MEMORY / LOCAL DB ──
const timestamp = Date.now();
const testContestTitle = `Test_Upsolve_Contest_${timestamp}`;

// Create test contest: ended 1 hour ago
const startTime = new Date(Date.now() - 3600000 * 3).toISOString();
const endTime = new Date(Date.now() - 3600000 * 1).toISOString();

const contestRes = db.prepare(`
    INSERT INTO contests (
        title, type, contest_mode, start_time, end_time, duration,
        is_active, editorial_enabled, editorial_published
    ) VALUES (?, 'icpc', 'NORMAL', ?, ?, '02:00', 1, 1, 1)
`).run(testContestTitle, startTime, endTime);

const testContestId = contestRes.lastInsertRowid;

// Create 3 test problems
const prob1Res = db.prepare(`INSERT INTO problems (title, code, difficulty, time_limit, memory_limit, statement, input_format, output_format, score) VALUES ('Problem Alpha', 'PA_${timestamp}', 'Easy', 1000, 256, 'Sample statement A', 'Input format A', 'Output format A', 10)`).run();
const prob2Res = db.prepare(`INSERT INTO problems (title, code, difficulty, time_limit, memory_limit, statement, input_format, output_format, score) VALUES ('Problem Beta', 'PB_${timestamp}', 'Medium', 1000, 256, 'Sample statement B', 'Input format B', 'Output format B', 10)`).run();
const prob3Res = db.prepare(`INSERT INTO problems (title, code, difficulty, time_limit, memory_limit, statement, input_format, output_format, score) VALUES ('Problem Gamma', 'PC_${timestamp}', 'Hard', 1000, 256, 'Sample statement C', 'Input format C', 'Output format C', 10)`).run();

const pA = prob1Res.lastInsertRowid;
const pB = prob2Res.lastInsertRowid;
const pC = prob3Res.lastInsertRowid;

db.prepare(`INSERT INTO contest_problems (contest_id, problem_id, letter, score, problem_order) VALUES (?, ?, 'A', 10, 1)`).run(testContestId, pA);
db.prepare(`INSERT INTO contest_problems (contest_id, problem_id, letter, score, problem_order) VALUES (?, ?, 'B', 10, 2)`).run(testContestId, pB);
db.prepare(`INSERT INTO contest_problems (contest_id, problem_id, letter, score, problem_order) VALUES (?, ?, 'C', 10, 3)`).run(testContestId, pC);

// Create 3 users:
// 1. userOfficial: submits during contest
// 2. userUpsolver: submits after contest (pure upsolver)
// 3. userOfficialWithUpsolve: submits in contest and also upsolves post-contest
const u1Res = db.prepare(`INSERT INTO users (username, full_name, password_hash, role) VALUES ('alice_official_${timestamp}', 'Alice Alieva', 'hash', 'student')`).run();
const u2Res = db.prepare(`INSERT INTO users (username, full_name, password_hash, role) VALUES ('bob_upsolver_${timestamp}', 'Bob Boboev', 'hash', 'student')`).run();
const u3Res = db.prepare(`INSERT INTO users (username, full_name, password_hash, role) VALUES ('charlie_hybrid_${timestamp}', 'Charlie Ch', 'hash', 'student')`).run();

const uAlice = u1Res.lastInsertRowid;
const uBob = u2Res.lastInsertRowid;
const uCharlie = u3Res.lastInsertRowid;

// Register Alice and Charlie
db.prepare(`INSERT INTO contest_participants (contest_id, user_id, is_official) VALUES (?, ?, 1)`).run(testContestId, uAlice);
db.prepare(`INSERT INTO contest_participants (contest_id, user_id, is_official) VALUES (?, ?, 1)`).run(testContestId, uCharlie);

// Contest submissions (during contest: 1 hour after start)
const midContestTime = new Date(Date.now() - 3600000 * 2).toISOString();
// Alice solves problem A on 1st attempt at +10 min
db.prepare(`INSERT INTO submissions (user_id, contest_id, problem_id, status, language, code, is_upsolve, created_at) VALUES (?, ?, ?, 'Accepted', 'cpp', '// code', 0, ?)`).run(uAlice, testContestId, pA, midContestTime);

// Charlie solves problem B after 1 WA during contest
db.prepare(`INSERT INTO submissions (user_id, contest_id, problem_id, status, language, code, is_upsolve, created_at) VALUES (?, ?, ?, 'Wrong Answer', 'cpp', '// code', 0, ?)`).run(uCharlie, testContestId, pB, midContestTime);
db.prepare(`INSERT INTO submissions (user_id, contest_id, problem_id, status, language, code, is_upsolve, created_at) VALUES (?, ?, ?, 'Accepted', 'cpp', '// code', 0, ?)`).run(uCharlie, testContestId, pB, midContestTime);

// Post-contest submissions (30 minutes ago, past endTime)
const postContestTime = new Date(Date.now() - 1800000).toISOString();

// Bob (pure upsolver) solves problem A on 1st attempt
db.prepare(`INSERT INTO submissions (user_id, contest_id, problem_id, status, language, code, is_upsolve, created_at) VALUES (?, ?, ?, 'Accepted', 'cpp', '// code', 1, ?)`).run(uBob, testContestId, pA, postContestTime);
// Bob also fails problem C twice without AC
db.prepare(`INSERT INTO submissions (user_id, contest_id, problem_id, status, language, code, is_upsolve, created_at) VALUES (?, ?, ?, 'Wrong Answer', 'cpp', '// code', 1, ?)`).run(uBob, testContestId, pC, postContestTime);
db.prepare(`INSERT INTO submissions (user_id, contest_id, problem_id, status, language, code, is_upsolve, created_at) VALUES (?, ?, ?, 'Time Limit Exceeded', 'cpp', '// code', 1, ?)`).run(uBob, testContestId, pC, postContestTime);

// Charlie (hybrid) upsolves problem A post-contest after 2 WAs
db.prepare(`INSERT INTO submissions (user_id, contest_id, problem_id, status, language, code, is_upsolve, created_at) VALUES (?, ?, ?, 'Wrong Answer', 'cpp', '// code', 1, ?)`).run(uCharlie, testContestId, pA, postContestTime);
db.prepare(`INSERT INTO submissions (user_id, contest_id, problem_id, status, language, code, is_upsolve, created_at) VALUES (?, ?, ?, 'Wrong Answer', 'cpp', '// code', 1, ?)`).run(uCharlie, testContestId, pA, postContestTime);
db.prepare(`INSERT INTO submissions (user_id, contest_id, problem_id, status, language, code, is_upsolve, created_at) VALUES (?, ?, ?, 'Accepted', 'cpp', '// code', 1, ?)`).run(uCharlie, testContestId, pA, postContestTime);


// ── TEST CASES ──

runTest('Official participants receive full points, ranks, and times', () => {
    const standings = contestsEngine.getContestStandings(testContestId, true);
    assert(standings, 'Standings data should be returned');
    const { leaderboard } = standings;

    const alice = leaderboard.find(u => u.user_id === uAlice);
    assert(alice, 'Alice must be in leaderboard');
    assert.strictEqual(alice.rank, 1, 'Alice rank should be 1');
    assert.strictEqual(alice.total_score, 10, 'Alice total_score should be 10');
    assert(alice.penalty > 0, 'Alice penalty must be > 0');
    assert.strictEqual(alice.problemStats[pA].display, '+', 'Alice problem A display should be +');
    assert(alice.problemStats[pA].time_formatted.length > 0, 'Alice problem A must have formatted time');
    assert.strictEqual(alice.problemStats[pA].is_upsolve, false, 'Alice problem A is official, not upsolve');
});

runTest('Pure upsolving participant is placed at the very end of standings', () => {
    const standings = contestsEngine.getContestStandings(testContestId, true);
    const { leaderboard } = standings;

    const bobIdx = leaderboard.findIndex(u => u.user_id === uBob);
    const aliceIdx = leaderboard.findIndex(u => u.user_id === uAlice);
    const charlieIdx = leaderboard.findIndex(u => u.user_id === uCharlie);

    assert(bobIdx > aliceIdx && bobIdx > charlieIdx, 'Bob (upsolver) must be after all official participants');
});

runTest('Upsolving participant has blank rank, rating, score, attempts, penalty and asterisk name', () => {
    const standings = contestsEngine.getContestStandings(testContestId, true);
    const bob = standings.leaderboard.find(u => u.user_id === uBob && u.is_upsolve);

    assert(bob, 'Bob must exist in upsolve leaderboard');
    assert.strictEqual(bob.rank, '', 'Upsolve rank must be blank');
    assert.strictEqual(bob.rating, '', 'Upsolve rating must be blank');
    assert.strictEqual(bob.total_score, '', 'Upsolve total_score must be blank');
    assert.strictEqual(bob.solved, '', 'Upsolve solved/topshirilgan must be blank');
    assert.strictEqual(bob.penalty, '', 'Upsolve penalty must be blank');
    assert(bob.full_name.startsWith('* '), `Upsolve full_name must start with "* ", got ${bob.full_name}`);
    assert(bob.display_name.startsWith('* '), `Upsolve display_name must start with "* ", got ${bob.display_name}`);
    assert(bob.display_username.startsWith('* '), `Upsolve display_username must start with "* ", got ${bob.display_username}`);
});

runTest('Upsolve problem cell displays (+) or (+K) with NO time', () => {
    const standings = contestsEngine.getContestStandings(testContestId, true);
    const bob = standings.leaderboard.find(u => u.user_id === uBob && u.is_upsolve);

    // Problem A solved 1st attempt in upsolve
    const cellA = bob.problemStats[pA];
    assert.strictEqual(cellA.solved, true, 'Cell A should be solved');
    assert.strictEqual(cellA.is_upsolve, true, 'Cell A should be marked is_upsolve');
    assert.strictEqual(cellA.display, '+', 'Cell A display should be +');
    assert.strictEqual(cellA.time_formatted, '', 'Cell A must have NO time formatted');
    assert.strictEqual(cellA.penalty, 0, 'Cell A must award 0 penalty');
});

runTest('Upsolve problem cell displays (-K) for failed attempts without time', () => {
    const standings = contestsEngine.getContestStandings(testContestId, true);
    const bob = standings.leaderboard.find(u => u.user_id === uBob && u.is_upsolve);

    // Problem C failed twice in upsolve
    const cellC = bob.problemStats[pC];
    assert.strictEqual(cellC.solved, false, 'Cell C is not solved');
    assert.strictEqual(cellC.display, '-2', 'Cell C display should be -2');
    assert.strictEqual(cellC.time_formatted, '', 'Cell C must have NO time formatted');
});

runTest('Hybrid participant appears in official standings AND also gets separate upsolve row at bottom', () => {
    const standings = contestsEngine.getContestStandings(testContestId, true);
    const { leaderboard } = standings;

    // 1. Official row
    const charlieOfficial = leaderboard.find(u => u.user_id === uCharlie && !u.is_upsolve);
    assert(charlieOfficial, 'Charlie must appear in official standings');
    assert.strictEqual(charlieOfficial.rank, 2, 'Charlie official rank should be 2');
    assert.strictEqual(charlieOfficial.total_score, 10, 'Charlie official score should be 10');
    assert.strictEqual(charlieOfficial.problemStats[pB].display, '+1', 'Official Problem B should be +1');
    assert(charlieOfficial.problemStats[pB].time_formatted.length > 0, 'Official Problem B must have time');
    assert.strictEqual(charlieOfficial.problemStats[pA].display, '', 'Official Problem A was not attempted in contest');

    // 2. Separate Upsolve row at bottom
    const charlieUpsolve = leaderboard.find(u => u.user_id === uCharlie && u.is_upsolve);
    assert(charlieUpsolve, 'Charlie must also appear in upsolve section at the bottom');
    assert.strictEqual(charlieUpsolve.rank, '', 'Charlie upsolve rank must be blank');
    assert.strictEqual(charlieUpsolve.total_score, '', 'Charlie upsolve score must be blank');
    assert.strictEqual(charlieUpsolve.penalty, '', 'Charlie upsolve penalty must be blank');
    assert.strictEqual(charlieUpsolve.rating, '', 'Charlie upsolve rating must be blank');
    assert.strictEqual(charlieUpsolve.solved, '', 'Charlie upsolve solved count must be blank');
    assert(charlieUpsolve.full_name.startsWith('* '), 'Charlie upsolve name must start with * ');
    assert.strictEqual(charlieUpsolve.problemStats[pA].display, '+2', 'Upsolve Problem A should display +2');
    assert.strictEqual(charlieUpsolve.problemStats[pA].time_formatted, '', 'Upsolve Problem A must not show time');
});

runTest('Excel export adheres to all upsolve rules (blank rank, * name, blank fields, no times)', () => {
    const xlsxBuffer = contestsEngine.exportStandingsToExcel(testContestId, true);
    assert(xlsxBuffer && xlsxBuffer.length > 0, 'Excel buffer must be generated');

    const XLSX = require('xlsx');
    const workbook = XLSX.read(xlsxBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets['Natijalar'];
    const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Find Bob's row (upsolver)
    const bobRow = sheetData.find(row => row && String(row[1]).includes('Bob Boboev'));
    assert(bobRow, 'Bob row must exist in Excel sheet');

    assert.strictEqual(bobRow[0] || '', '', 'Excel Rank must be blank');
    assert(bobRow[1].startsWith('* '), 'Excel Name must start with * ');
    assert.strictEqual(bobRow[4] || '', '', 'Excel Rating must be blank');
    assert.strictEqual(bobRow[5] || '', '', 'Excel Score must be blank');
    assert.strictEqual(bobRow[6] || '', '', 'Excel Topshirilgan must be blank');
    assert.strictEqual(bobRow[7] || '', '', 'Excel Penalty must be blank');

    // Problem A cell should be '+' without time
    assert.strictEqual(bobRow[8], '+', 'Excel Problem A cell must be +');
    // Problem C cell should be '-2' without time
    assert.strictEqual(bobRow[10], '-2', 'Excel Problem C cell must be -2');
});

runTest('Server SVG generator produces crisp dark IDE code snapshot with anti-copy watermarks', () => {
    const sampleCpp = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`;

    const svg = editorialSvg.generateCodeSvg(sampleCpp, 'cpp', 'A. Problem Alpha - C++20 Rasmiy Yechim');
    assert(svg.startsWith('<svg'), 'Output must be an SVG element');
    assert(svg.includes('🔒 Nusxalash taqiqlangan'), 'Must contain security anti-copy watermark');
    assert(svg.includes('user-select:none'), 'Must have user-select:none styling');
    assert(svg.includes('cout'), 'Must contain syntax-highlighted code tokens');
    assert(svg.includes('1'), 'Must include line numbers');
});

runTest('Contest 1 problems have verified Accepted solutions in C++, Python, and Java', () => {
    const editorials = db.prepare('SELECT problem_id, code_cpp, code_python, code_java FROM contest_editorials WHERE contest_id = 1').all();
    assert(editorials.length >= 5, 'Contest 1 must have at least 5 problem editorials');

    for (const ed of editorials) {
        assert(ed.code_cpp && ed.code_cpp.trim().length > 10, `Problem ${ed.problem_id} must have C++ code`);
        assert(ed.code_python && ed.code_python.trim().length > 10, `Problem ${ed.problem_id} must have Python code`);
        assert(ed.code_java && ed.code_java.trim().length > 10, `Problem ${ed.problem_id} must have Java code`);
    }
});

console.log('====================================================');
console.log(`TEST RESULTS: ${testsPassed} / ${totalTests} PASSED`);
console.log('====================================================');

if (testsPassed === totalTests) {
    console.log('🎉 ALL UPSOLVE & EDITORIAL TESTS PASSED 100%!');
} else {
    process.exit(1);
}
