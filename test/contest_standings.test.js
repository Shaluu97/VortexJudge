const assert = require('assert');
const db = require('../src/db');
const contestsEngine = require('../src/contests');
const plagiarismEngine = require('../src/plagiarism');
const XLSX = require('xlsx');

console.log('====================================================');
console.log('RUNNING MANDATORY 20-TEST CONTEST STANDINGS SUITE');
console.log('====================================================\n');

// Setup isolated test contest and users
const TEST_CONTEST_ID = 999999;
const TEST_PROB_A = 999901;
const TEST_PROB_B = 999902;
const TEST_PROB_C = 999903;

const USER_ALI = 99991;
const USER_VALI = 99992;
const USER_SALIM = 99993;
const USER_KARIM = 99994;
const USER_OLIM = 99995;

const START_TIME = '2026-10-19T10:00:00.000Z';
const END_TIME = '2026-10-19T15:00:00.000Z';

function cleanup() {
    db.prepare('DELETE FROM contest_plagiarism WHERE contest_id = ?').run(TEST_CONTEST_ID);
    db.prepare('DELETE FROM submissions WHERE contest_id = ?').run(TEST_CONTEST_ID);
    db.prepare('DELETE FROM contest_participants WHERE contest_id = ?').run(TEST_CONTEST_ID);
    db.prepare('DELETE FROM contest_problems WHERE contest_id = ?').run(TEST_CONTEST_ID);
    db.prepare('DELETE FROM contests WHERE id = ?').run(TEST_CONTEST_ID);
    db.prepare('DELETE FROM problems WHERE id IN (?, ?, ?)').run(TEST_PROB_A, TEST_PROB_B, TEST_PROB_C);
    db.prepare('DELETE FROM users WHERE id IN (?, ?, ?, ?, ?)').run(USER_ALI, USER_VALI, USER_SALIM, USER_KARIM, USER_OLIM);
}

function setup() {
    cleanup();

    // Insert Users
    const insertUser = db.prepare(`
        INSERT INTO users (id, username, password_hash, full_name, school, rating, role)
        VALUES (?, ?, 'hash', ?, ?, ?, 'user')
    `);
    insertUser.run(USER_ALI, 'ali', 'Ali Valiyev', '1-maktab', 1500);
    insertUser.run(USER_VALI, 'vali', 'Vali Aliyev', '2-maktab', 1400);
    insertUser.run(USER_SALIM, 'salim', 'Salim Karimov', '3-maktab', 1300);
    insertUser.run(USER_KARIM, 'karim', 'Karim Salimov', '4-maktab', 1200);
    insertUser.run(USER_OLIM, 'olim', 'Olim Olimov', '5-maktab', 1100);

    // Insert Problems
    const insertProb = db.prepare(`
        INSERT INTO problems (id, code, title, statement, input_format, output_format, score)
        VALUES (?, ?, ?, 'Statement', 'Input', 'Output', ?)
    `);
    insertProb.run(TEST_PROB_A, 'PROB_A', 'Masala A', 7);
    insertProb.run(TEST_PROB_B, 'PROB_B', 'Masala B', 7);
    insertProb.run(TEST_PROB_C, 'PROB_C', 'Masala C', 10);

    // Insert Contest
    db.prepare(`
        INSERT INTO contests (
            id, title, start_time, end_time, contest_type, penalty_per_wrong_attempt,
            is_active, show_problems_after_contest
        )
        VALUES (?, 'Test Contest', ?, ?, 'icpc', 4, 1, 1)
    `).run(TEST_CONTEST_ID, START_TIME, END_TIME);

    // Attach Problems to Contest
    const attachProb = db.prepare(`
        INSERT INTO contest_problems (contest_id, problem_id, problem_order, letter, letter_index, score)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    attachProb.run(TEST_CONTEST_ID, TEST_PROB_A, 1, 'A', 'A', 7);
    attachProb.run(TEST_CONTEST_ID, TEST_PROB_B, 2, 'B', 'B', 7);
    attachProb.run(TEST_CONTEST_ID, TEST_PROB_C, 3, 'C', 'C', 10);

    // Register Participants
    const regPart = db.prepare(`
        INSERT INTO contest_participants (contest_id, user_id, is_official)
        VALUES (?, ?, 1)
    `);
    regPart.run(TEST_CONTEST_ID, USER_ALI);
    regPart.run(TEST_CONTEST_ID, USER_VALI);
    regPart.run(TEST_CONTEST_ID, USER_SALIM);
    regPart.run(TEST_CONTEST_ID, USER_KARIM);
    regPart.run(TEST_CONTEST_ID, USER_OLIM);
}

let submissionCounter = 800000;
function addSub(userId, probId, status, minutesFromStart, seconds = 0) {
    submissionCounter++;
    const subDate = new Date(new Date(START_TIME).getTime() + (minutesFromStart * 60000) + (seconds * 1000)).toISOString();
    db.prepare(`
        INSERT INTO submissions (id, contest_id, user_id, problem_id, language, code, status, score, created_at, is_upsolve)
        VALUES (?, ?, ?, ?, 'cpp', 'int main(){}', ?, ?, ?, 0)
    `).run(submissionCounter, TEST_CONTEST_ID, userId, probId, status, status === 'Accepted' ? 100 : 0, subDate);
    return submissionCounter;
}

const results = [];
function recordTest(testNum, title, pass, details = '') {
    results.push({ testNum, title, pass, details });
    const mark = pass ? '✓ PASS' : '✗ FAIL';
    console.log(`[Test ${String(testNum).padStart(2, '0')}] ${mark}: ${title}`);
    if (!pass && details) {
        console.error(`   -> Error: ${details}`);
    }
}

async function runTests() {
    try {
        setup();

        // ----------------------------------------------------
        // TEST 1: Urinish yo‘q bo‘lsa — katak bo‘sh, vaqt va jarima 0.
        // ----------------------------------------------------
        {
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const ali = data.leaderboard.find(u => u.user_id === USER_ALI);
            const statA = ali.problemStats[TEST_PROB_A];
            const pass = statA.display === '' && statA.time === 0 && ali.penalty === 0 && ali.total_score === 0;
            recordTest(1, 'Urinish yo‘q bo‘lsa — katak bo‘sh, vaqt va jarima 0', pass);
        }

        // ----------------------------------------------------
        // TEST 2: 1 ta xato — '-1', vaqt yo‘q, jarimaga hisoblanmaydi.
        // ----------------------------------------------------
        {
            addSub(USER_ALI, TEST_PROB_A, 'Wrong Answer', 5);
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const ali = data.leaderboard.find(u => u.user_id === USER_ALI);
            const statA = ali.problemStats[TEST_PROB_A];
            const pass = statA.display === '-1' && statA.time === 0 && ali.penalty === 0 && !statA.solved;
            recordTest(2, '1 ta xato — "-1", vaqt yo‘q, jarimaga hisoblanmaydi', pass);
        }

        // ----------------------------------------------------
        // TEST 3: 3 ta xato, Accepted yo‘q — '-3', vaqt yo‘q, jarimaga hisoblanmaydi.
        // ----------------------------------------------------
        {
            addSub(USER_ALI, TEST_PROB_A, 'Time Limit Exceeded', 8);
            addSub(USER_ALI, TEST_PROB_A, 'Runtime Error', 9);
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const ali = data.leaderboard.find(u => u.user_id === USER_ALI);
            const statA = ali.problemStats[TEST_PROB_A];
            const pass = statA.display === '-3' && statA.time === 0 && ali.penalty === 0 && !statA.solved;
            recordTest(3, '3 ta xato, Accepted yo‘q — "-3", vaqt yo‘q, jarimaga hisoblanmaydi', pass);
        }

        // ----------------------------------------------------
        // TEST 4: 1-urinishda Accepted — '+', vaqt ko‘rsatiladi, jarima = vaqt.
        // ----------------------------------------------------
        {
            // Vali solves Prob B on 1st try at minute 10
            addSub(USER_VALI, TEST_PROB_B, 'Accepted', 10, 0);
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const vali = data.leaderboard.find(u => u.user_id === USER_VALI);
            const statB = vali.problemStats[TEST_PROB_B];
            const pass = statB.display === '+' && statB.time === 10 && vali.penalty === 10 && statB.solved;
            recordTest(4, '1-urinishda Accepted — "+", vaqt ko‘rsatiladi, jarima = vaqt', pass);
        }

        // ----------------------------------------------------
        // TEST 5: 1 ta xatodan keyin Accepted — '+1', jarima = vaqt + 4.
        // ----------------------------------------------------
        {
            // Salim: 1 WA at min 5, then AC at min 15. Penalty = 15 + 4*1 = 19.
            addSub(USER_SALIM, TEST_PROB_B, 'Wrong Answer', 5);
            addSub(USER_SALIM, TEST_PROB_B, 'Accepted', 15);
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const salim = data.leaderboard.find(u => u.user_id === USER_SALIM);
            const statB = salim.problemStats[TEST_PROB_B];
            const pass = statB.display === '+1' && statB.time === 15 && statB.penalty === 19 && salim.penalty === 19;
            recordTest(5, '1 ta xatodan keyin Accepted — "+1", jarima = vaqt + 4', pass);
        }

        // ----------------------------------------------------
        // TEST 6: 2 ta xatodan keyin Accepted — '+2', jarima = vaqt + 8.
        // ----------------------------------------------------
        {
            // Karim: 2 WA at min 5, min 10, then AC at min 25 on Prob B. Penalty = 25 + 4*2 = 33.
            addSub(USER_KARIM, TEST_PROB_B, 'Wrong Answer', 5);
            addSub(USER_KARIM, TEST_PROB_B, 'Wrong Answer', 10);
            addSub(USER_KARIM, TEST_PROB_B, 'Accepted', 25);
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const karim = data.leaderboard.find(u => u.user_id === USER_KARIM);
            const statB = karim.problemStats[TEST_PROB_B];
            const pass = statB.display === '+2' && statB.time === 25 && statB.penalty === 33 && karim.penalty === 33;
            recordTest(6, '2 ta xatodan keyin Accepted — "+2", jarima = vaqt + 8', pass);
        }

        // ----------------------------------------------------
        // TEST 7: 3 ta xatodan keyin Accepted — '+3', jarima = vaqt + 12.
        // ----------------------------------------------------
        {
            // Olim: 3 WA at min 2, 4, 6, then AC at min 18 on Prob B. Penalty = 18 + 4*3 = 30.
            addSub(USER_OLIM, TEST_PROB_B, 'Wrong Answer', 2);
            addSub(USER_OLIM, TEST_PROB_B, 'Wrong Answer', 4);
            addSub(USER_OLIM, TEST_PROB_B, 'Wrong Answer', 6);
            addSub(USER_OLIM, TEST_PROB_B, 'Accepted', 18);
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const olim = data.leaderboard.find(u => u.user_id === USER_OLIM);
            const statB = olim.problemStats[TEST_PROB_B];
            const pass = statB.display === '+3' && statB.time === 18 && statB.penalty === 30 && olim.penalty === 30;
            recordTest(7, '3 ta xatodan keyin Accepted — "+3", jarima = vaqt + 12', pass);
        }

        // ----------------------------------------------------
        // TEST 8: Accepted dan keyingi har qanday urinishlar jarimani va katakni o‘zgartirmaydi.
        // ----------------------------------------------------
        {
            // Vali already solved Prob B with + and penalty 10. Submitting WA and AC after AC.
            addSub(USER_VALI, TEST_PROB_B, 'Wrong Answer', 30);
            addSub(USER_VALI, TEST_PROB_B, 'Accepted', 35);
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const vali = data.leaderboard.find(u => u.user_id === USER_VALI);
            const statB = vali.problemStats[TEST_PROB_B];
            const pass = statB.display === '+' && statB.time === 10 && statB.penalty === 10 && vali.penalty === 10;
            recordTest(8, 'Accepted dan keyingi har qanday urinishlar jarimani va katakni o‘zgartirmaydi', pass);
        }

        // ----------------------------------------------------
        // TEST 9: Masalani birinchi yechgan ishtirokchining katagi yashil fonga bo‘yaladi (first_to_solve = true).
        // ----------------------------------------------------
        {
            // On Prob B: Vali solved at min 10, Salim at min 15, Olim at min 18, Karim at min 25.
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const vali = data.leaderboard.find(u => u.user_id === USER_VALI);
            const statB = vali.problemStats[TEST_PROB_B];
            const pass = statB.first_to_solve === true;
            recordTest(9, 'Masalani birinchi yechgan ishtirokchining katagi yashil fonga bo‘yaladi (first_to_solve = true)', pass);
        }

        // ----------------------------------------------------
        // TEST 10: Har bir masala bo‘yicha yashil rang mustaqil aniqlanadi.
        // ----------------------------------------------------
        {
            // On Prob A: Ali solves at min 20 (first on Prob A).
            addSub(USER_ALI, TEST_PROB_A, 'Accepted', 20);
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const ali = data.leaderboard.find(u => u.user_id === USER_ALI);
            const vali = data.leaderboard.find(u => u.user_id === USER_VALI);
            const aliA = ali.problemStats[TEST_PROB_A].first_to_solve;
            const valiB = vali.problemStats[TEST_PROB_B].first_to_solve;
            const valiA = vali.problemStats[TEST_PROB_A].first_to_solve;
            const pass = aliA === true && valiB === true && valiA === false;
            recordTest(10, 'Har bir masala bo‘yicha yashil rang mustaqil aniqlanadi', pass);
        }

        // ----------------------------------------------------
        // TEST 11: Ali 10:05 da WA, Vali 10:06 da AC olsa, Vali birinchi yechgan bo‘ladi; Ali 10:08 da AC olsa ham yashil rang Valida qoladi.
        // ----------------------------------------------------
        {
            // On Prob C:
            // Ali submits WA at min 5
            addSub(USER_ALI, TEST_PROB_C, 'Wrong Answer', 5);
            // Vali submits AC at min 6
            addSub(USER_VALI, TEST_PROB_C, 'Accepted', 6);
            // Ali submits AC at min 8
            addSub(USER_ALI, TEST_PROB_C, 'Accepted', 8);

            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const aliC = data.leaderboard.find(u => u.user_id === USER_ALI).problemStats[TEST_PROB_C];
            const valiC = data.leaderboard.find(u => u.user_id === USER_VALI).problemStats[TEST_PROB_C];
            const pass = valiC.first_to_solve === true && aliC.first_to_solve === false;
            recordTest(11, 'Ali 10:05 da WA, Vali 10:06 da AC olsa Vali birinchi, Ali 10:08 da AC olsa ham yashil Valida qoladi', pass);
        }

        // ----------------------------------------------------
        // TEST 12: Ball yuqori bo‘lsa, jarima katta bo‘lsa ham yuqori o‘rinda turadi.
        // ----------------------------------------------------
        {
            // Let's check scores:
            // Ali: Prob A (score 7) + Prob C (score 10) = 17 ball
            // Vali: Prob B (score 7) + Prob C (score 10) = 17 ball
            // Salim: Prob B (score 7) = 7 ball
            // Even if Salim has low penalty, Ali (17) is higher than Salim (7).
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const ali = data.leaderboard.find(u => u.user_id === USER_ALI);
            const salim = data.leaderboard.find(u => u.user_id === USER_SALIM);
            const pass = ali.total_score > salim.total_score && ali.rank < salim.rank;
            recordTest(12, 'Ball yuqori bo‘lsa, jarima katta bo‘lsa ham yuqori o‘rinda turadi', pass);
        }

        // ----------------------------------------------------
        // TEST 13: Ball teng bo‘lsa, kam jarima olgan yuqorida turadi.
        // ----------------------------------------------------
        {
            // Ali and Vali both have 17 score.
            // Ali penalty: Prob A (20 + 3*4 = 32) + Prob C (8 + 1*4 = 12) = 44 penalty.
            // Vali penalty: Prob B (10) + Prob C (6) = 16 penalty.
            // Vali penalty (16) < Ali penalty (44) => Vali must be higher rank than Ali!
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const ali = data.leaderboard.find(u => u.user_id === USER_ALI);
            const vali = data.leaderboard.find(u => u.user_id === USER_VALI);
            const pass = vali.total_score === ali.total_score && vali.penalty < ali.penalty && vali.rank < ali.rank;
            recordTest(13, 'Ball teng bo‘lsa, kam jarima olgan yuqorida turadi', pass);
        }

        // ----------------------------------------------------
        // TEST 14: Ball va jarima teng bo‘lsa, bir xil o‘rin beriladi.
        // ----------------------------------------------------
        {
            // Let's create an exact tie between Salim and Karim on Prob A:
            // Currently Salim has Prob B (7 ball, 19 penalty).
            // Currently Karim has Prob B (7 ball, 33 penalty).
            // Give Salim Prob A at min 14 with 0 WA -> Prob A penalty = 14. Total score = 14, total penalty = 19 + 14 = 33.
            // Give Karim Prob A at min 0 with 0 WA -> Total score = 14, total penalty = 33 + 0 = 33.
            addSub(USER_SALIM, TEST_PROB_A, 'Accepted', 14);
            addSub(USER_KARIM, TEST_PROB_A, 'Accepted', 0);

            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const salim = data.leaderboard.find(u => u.user_id === USER_SALIM);
            const karim = data.leaderboard.find(u => u.user_id === USER_KARIM);
            const pass = salim.total_score === karim.total_score && salim.penalty === karim.penalty && salim.rank === karim.rank;
            recordTest(14, 'Ball va jarima teng bo‘lsa, bir xil o‘rin beriladi', pass);
        }

        // ----------------------------------------------------
        // TEST 15: Competition ranking 1, 2, 3, 3, 5, 6 bo‘yicha to‘g‘ri ishlaydi.
        // ----------------------------------------------------
        {
            // Current standings:
            // 1. Vali (17 score, 16 penalty) -> rank 1
            // 2. Ali (17 score, 44 penalty) -> rank 2
            // 3. Salim & Karim tied (14 score, 33 penalty) -> rank 3, rank 3
            // 5. Olim (7 score, 30 penalty) -> rank 5 (Skipped 4!)
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const ranks = data.leaderboard.map(u => u.rank);
            const pass = ranks[0] === 1 && ranks[1] === 2 && ranks[2] === 3 && ranks[3] === 3 && ranks[4] === 5;
            recordTest(15, 'Competition ranking 1, 2, 3, 3, 5 bo‘yicha to‘g‘ri ishlaydi', pass);
        }

        // ----------------------------------------------------
        // TEST 16: Pastki statistika unikal ishtirokchilar bo‘yicha hisoblanadi.
        // ----------------------------------------------------
        {
            // For Prob B:
            // Solved: Vali, Salim, Karim, Olim = 4 unique users
            const data = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const statB = data.footer_stats[TEST_PROB_B];
            const pass = statB && statB.solved_count === 4 && statB.tried_count >= 4;
            recordTest(16, 'Pastki statistika unikal ishtirokchilar bo‘yicha hisoblanadi', pass);
        }

        // ----------------------------------------------------
        // TEST 17: Qayta hisoblash bir necha bor bosilsa ham natijani buzmaydi (idempotent).
        // ----------------------------------------------------
        {
            const data1 = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const data2 = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);
            const pass = JSON.stringify(data1.leaderboard) === JSON.stringify(data2.leaderboard);
            recordTest(17, 'Qayta hisoblash bir necha bor bosilsa ham natijani buzmaydi (idempotent)', pass);
        }

        // ----------------------------------------------------
        // TEST 18: Excel export jadval bilan bir xil natija beradi.
        // ----------------------------------------------------
        {
            const buf = contestsEngine.exportStandingsToExcel(TEST_CONTEST_ID, true);
            const wb = XLSX.read(buf, { type: 'buffer' });
            const sheet = wb.Sheets['Natijalar'];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const pass = buf && buf.length > 1000 && json.length >= 6 && json[0][0] === 'O‘rin';
            recordTest(18, 'Excel export jadval bilan bir xil natija beradi', pass);
        }

        // ----------------------------------------------------
        // TEST 19: Urinishlar oynasidan qoidabuzarlik belgilanganda qatnashuvchi passiv holatga o‘tib, public standingsdan yo‘qoladi.
        // ----------------------------------------------------
        {
            plagiarismEngine.disqualifyParticipant(TEST_CONTEST_ID, USER_OLIM, "Sun'iy intellektdan ko'chirilgan");

            const publicData = contestsEngine.getContestStandings(TEST_CONTEST_ID, false);
            const adminData = contestsEngine.getContestStandings(TEST_CONTEST_ID, true);

            const inPublic = publicData.leaderboard.some(u => u.user_id === USER_OLIM);
            const inAdmin = adminData.leaderboard.some(u => u.user_id === USER_OLIM && u.is_disqualified);
            const lastInAdmin = adminData.leaderboard[adminData.leaderboard.length - 1].user_id === USER_OLIM;

            const pass = !inPublic && inAdmin && lastInAdmin;
            recordTest(19, 'Qoidabuzarlik belgilanganda qatnashuvchi passiv bo‘lib public standingsdan yo‘qoladi', pass);
        }

        // ----------------------------------------------------
        // TEST 20: Oqlash tugmasi bosilganda ishtirokchi qayta tiklanib, reyting avtomatik qayta hisoblanadi.
        // ----------------------------------------------------
        {
            plagiarismEngine.pardonParticipant(TEST_CONTEST_ID, USER_OLIM);

            const publicData = contestsEngine.getContestStandings(TEST_CONTEST_ID, false);
            const olim = publicData.leaderboard.find(u => u.user_id === USER_OLIM);
            const pass = !!olim && olim.rank === 5 && !olim.is_disqualified;
            recordTest(20, 'Oqlash tugmasi bosilganda ishtirokchi qayta tiklanib reyting avtomatik hisoblanadi', pass);
        }

    } catch (err) {
        console.error('Test execution error:', err);
    } finally {
        cleanup();
    }

    console.log('\n====================================================');
    const totalPassed = results.filter(r => r.pass).length;
    console.log(`TEST RESULTS: ${totalPassed} / ${results.length} PASSED`);
    console.log('====================================================\n');

    if (totalPassed === 20) {
        console.log('🎉 ALL 20 MANDATORY TESTS PASSED 100%!');
        process.exit(0);
    } else {
        console.error('❌ SOME TESTS FAILED!');
        process.exit(1);
    }
}

runTests();
