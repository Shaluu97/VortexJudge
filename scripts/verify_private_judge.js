const path = require('path');
const fs = require('fs');
const db = require('../src/db');
const runner = require('../src/judge/runner');

async function waitSubmission(id) {
    while (true) {
        const sub = db.prepare('SELECT id, status, score, time_spent, memory_used, test_details, compiler_output FROM submissions WHERE id = ?').get(id);
        if (sub && sub.status !== 'Pending' && sub.status !== 'Running') {
            return sub;
        }
        await new Promise(r => setTimeout(r, 150));
    }
}

async function main() {
    const codes = ['3001', '3002', '3003', '3004', '3005'];
    const results = [];

    for (const code of codes) {
        const prob = db.prepare('SELECT id, code, title, visibility, is_public, is_secret FROM problems WHERE code = ?').get(code);
        if (!prob) {
            console.error(`Problem ${code} not found!`);
            continue;
        }

        let folder = '';
        if (code === '3001') folder = 'priv_a_bunyod_friends';
        else if (code === '3002') folder = 'priv_b_magnetic_numbers';
        else if (code === '3003') folder = 'priv_c_coca_cola_rota';
        else if (code === '3004') folder = 'priv_d_game_15';
        else if (code === '3005') folder = 'priv_e_arithmetic_ones';

        const solPath = path.join(__dirname, '..', 'problems', folder, 'solution.cpp');
        const codeText = fs.readFileSync(solPath, 'utf-8');

        const insRes = db.prepare(`
            INSERT INTO submissions (user_id, problem_id, contest_id, language, code, status, created_at)
            VALUES (1, ?, 5, 'cpp', ?, 'Pending', CURRENT_TIMESTAMP)
        `).run(prob.id, codeText);

        const subId = Number(insRes.lastInsertRowid);
        runner.enqueueSubmission(subId);

        const res = await waitSubmission(subId);
        results.push({
            id: prob.id,
            code: prob.code,
            title: prob.title,
            visibility: prob.visibility,
            is_public: prob.is_public,
            is_secret: prob.is_secret,
            status: res.status,
            score: res.score,
            time_spent: res.time_spent,
            memory_used: res.memory_used,
            compiler_output: res.compiler_output
        });
    }

    console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
