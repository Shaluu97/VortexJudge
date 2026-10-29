const db = require('./db');
const { hashPassword, ensureAdminUser } = require('./auth');

console.log('Seeding database with initial data...');

// 1. Admin & Test Users (Dynamic admin credentials via environment variables)
ensureAdminUser(db);

const sampleUsers = [
    { username: 'user1', name: 'Sadullayev Shoxrux', pass: 'user123', rating: 1500 },
    { username: 'anvar_ali', name: 'Anvar Aliyev', pass: '123456', rating: 1450 },
    { username: 'nodira_k', name: 'Nodira Karimova', pass: '123456', rating: 1620 },
    { username: 'jasur_dev', name: 'Jasur Shokirov', pass: '123456', rating: 1380 }
];

for (const u of sampleUsers) {
    const ex = db.prepare('SELECT id FROM users WHERE username = ?').get(u.username);
    if (!ex) {
        db.prepare(`
            INSERT INTO users (username, password_hash, plain_password, full_name, role, rating)
            VALUES (?, ?, '', ?, ?, ?)
        `).run(u.username, hashPassword(u.pass || '123456'), u.name, 'user', u.rating);
    }
}

// 2. 5 Starter Problems
const problemsData = [
    {
        code: '1001',
        title: 'A + B',
        statement: 'Sizga ikkita butun son $A$ va $B$ beriladi. Ularning yig‘indisini hisoblang.',
        input_format: 'Yagona qatorda ikkita butun son $A$ va $B$ beriladi ($1 \\le A, B \\le 10^9$).',
        output_format: 'Bitta butun son — $A + B$ qiymatini chiqaring.',
        note: 'Namunada 2 va 3 sonlarining yig‘indisi 5 ga teng.',
        time_limit: 1000,
        memory_limit: 256,
        difficulty: 'Oson',
        score: 100,
        checker_type: 'default',
        tests: [
            { in: '2 3\n', out: '5\n', is_sample: 1 },
            { in: '10 20\n', out: '30\n', is_sample: 1 },
            { in: '1 1\n', out: '2\n', is_sample: 0 },
            { in: '1000000000 1000000000\n', out: '2000000000\n', is_sample: 0 },
            { in: '123456789 987654321\n', out: '1111111110\n', is_sample: 0 },
            { in: '45 55\n', out: '100\n', is_sample: 0 },
            { in: '999999999 1\n', out: '1000000000\n', is_sample: 0 },
            { in: '500 500\n', out: '1000\n', is_sample: 0 },
            { in: '7 13\n', out: '20\n', is_sample: 0 },
            { in: '888888 111112\n', out: '1000000\n', is_sample: 0 }
        ]
    },
    {
        code: '1002',
        title: 'Katta-kichik',
        statement: 'Ikkita butun son $A$ va $B$ berilgan. Ularni taqqoslang va mos belgini chiqaring:\n- Agar $A > B$ bo‘lsa, `>`\n- Agar $A < B$ bo‘lsa, `<`\n- Agar $A = B$ bo‘lsa, `=`',
        input_format: 'Bitta qatorda ikkita butun son $A$ va $B$ beriladi ($-10^9 \\le A, B \\le 10^9$).',
        output_format: 'Bitta belgi — `>`, `<` yoki `=` chiqaring.',
        note: '10 soni 5 dan katta, shuning uchun javob >.',
        time_limit: 1000,
        memory_limit: 256,
        difficulty: 'Oson',
        score: 100,
        checker_type: 'default',
        tests: [
            { in: '10 5\n', out: '>\n', is_sample: 1 },
            { in: '3 7\n', out: '<\n', is_sample: 1 },
            { in: '4 4\n', out: '=\n', is_sample: 1 },
            { in: '-5 0\n', out: '<\n', is_sample: 0 },
            { in: '0 -10\n', out: '>\n', is_sample: 0 },
            { in: '-100 -100\n', out: '=\n', is_sample: 0 },
            { in: '1000000000 999999999\n', out: '>\n', is_sample: 0 },
            { in: '999999999 1000000000\n', out: '<\n', is_sample: 0 },
            { in: '-1000000000 -1000000000\n', out: '=\n', is_sample: 0 },
            { in: '50 -50\n', out: '>\n', is_sample: 0 }
        ]
    },
    {
        code: '1003',
        title: 'Massiv yig‘indisi',
        statement: 'Sizga $N$ ta butun sondan iborat massiv berilgan. Massiv elementlarining yig‘indisini toping.',
        input_format: 'Birinchi qatorda $N$ soni ($1 \\le N \\le 10^5$).\nIkkinchi qatorda probel bilan ajratilgan $N$ ta butun son $A_i$ beriladi ($1 \\le A_i \\le 10^9$).',
        output_format: 'Bitta butun son — massivdagi barcha sonlar yig‘indisini chiqaring.',
        note: 'Javob 64-bitli butun son turiga sig‘ishiga e’tibor bering.',
        time_limit: 1500,
        memory_limit: 256,
        difficulty: 'O‘rta',
        score: 100,
        checker_type: 'default',
        tests: [
            { in: '3\n1 2 3\n', out: '6\n', is_sample: 1 },
            { in: '5\n10 20 30 40 50\n', out: '150\n', is_sample: 1 },
            { in: '1\n100\n', out: '100\n', is_sample: 0 },
            { in: '4\n1000000000 1000000000 1000000000 1000000000\n', out: '4000000000\n', is_sample: 0 },
            { in: '6\n5 5 5 5 5 5\n', out: '30\n', is_sample: 0 },
            { in: '5\n1 1 1 1 1\n', out: '5\n', is_sample: 0 },
            { in: '2\n999999999 1\n', out: '1000000000\n', is_sample: 0 },
            { in: '7\n10 10 10 10 10 10 10\n', out: '70\n', is_sample: 0 },
            { in: '3\n100000000 200000000 300000000\n', out: '600000000\n', is_sample: 0 },
            { in: '8\n2 4 6 8 10 12 14 16\n', out: '72\n', is_sample: 0 }
        ]
    },
    {
        code: '1004',
        title: 'Palindrom son',
        statement: 'Berilgan $N$ butun soni palindrom ekanligini aniqlang. Palindrom son chapdan o‘ngga va o‘ngdan chapga bir xil o‘qiladi. Agar palindrom bo‘lsa `YES`, aks holda `NO` chiqaring.',
        input_format: 'Bitta qatorda bitta butun son $N$ beriladi ($1 \\le N \\le 10^9$).',
        output_format: 'Agar son palindrom bo‘lsa `YES`, aks holda `NO` chiqaring.',
        note: '121 soni chapdan ham, o‘ngdan ham 121 deb o‘qiladi.',
        time_limit: 1000,
        memory_limit: 256,
        difficulty: 'Oson',
        score: 100,
        checker_type: 'case_insensitive',
        tests: [
            { in: '121\n', out: 'YES\n', is_sample: 1 },
            { in: '123\n', out: 'NO\n', is_sample: 1 },
            { in: '7\n', out: 'YES\n', is_sample: 0 },
            { in: '10\n', out: 'NO\n', is_sample: 0 },
            { in: '1001\n', out: 'YES\n', is_sample: 0 },
            { in: '12321\n', out: 'YES\n', is_sample: 0 },
            { in: '123456\n', out: 'NO\n', is_sample: 0 },
            { in: '999999999\n', out: 'YES\n', is_sample: 0 },
            { in: '1000000001\n', out: 'YES\n', is_sample: 0 },
            { in: '123321\n', out: 'YES\n', is_sample: 0 }
        ]
    },
    {
        code: '1005',
        title: 'Bo‘luvchilar soni',
        statement: 'Sizga natural $N$ soni berilgan. Ushbu sonning barcha natural bo‘luvchilari sonini toping.',
        input_format: 'Bitta qatorda natural son $N$ beriladi ($1 \\le N \\le 10^9$).',
        output_format: 'Bitta butun son — $N$ ning natural bo‘luvchilari sonini chiqaring.',
        note: '12 sonining bo‘luvchilari: 1, 2, 3, 4, 6, 12 (jami 6 ta).',
        time_limit: 1500,
        memory_limit: 256,
        difficulty: 'O‘rta',
        score: 100,
        checker_type: 'default',
        tests: [
            { in: '12\n', out: '6\n', is_sample: 1 },
            { in: '7\n', out: '2\n', is_sample: 1 },
            { in: '1\n', out: '1\n', is_sample: 0 },
            { in: '16\n', out: '5\n', is_sample: 0 },
            { in: '100\n', out: '9\n', is_sample: 0 },
            { in: '36\n', out: '9\n', is_sample: 0 },
            { in: '999983\n', out: '2\n', is_sample: 0 },
            { in: '1000000\n', out: '49\n', is_sample: 0 },
            { in: '24\n', out: '8\n', is_sample: 0 },
            { in: '1000000000\n', out: '100\n', is_sample: 0 }
        ]
    }
];

for (const p of problemsData) {
    let prob = db.prepare('SELECT id FROM problems WHERE code = ?').get(p.code);
    if (!prob) {
        const res = db.prepare(`
            INSERT INTO problems (code, title, statement, input_format, output_format, note, time_limit, memory_limit, difficulty, score, checker_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(p.code, p.title, p.statement, p.input_format, p.output_format, p.note, p.time_limit, p.memory_limit, p.difficulty, p.score, p.checker_type);
        const probId = Number(res.lastInsertRowid);

        for (let i = 0; i < p.tests.length; i++) {
            const t = p.tests[i];
            db.prepare(`
                INSERT INTO testcases (problem_id, test_index, input_data, output_data, is_sample, points)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(probId, i + 1, t.in, t.out, t.is_sample, 10);
        }
    }
}

// 3. Sample Contest
const existingContest = db.prepare("SELECT id FROM contests WHERE title LIKE 'Dasturlash bo%bo%yicha%'").get();
if (!existingContest) {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 1); // Started 1 hour ago
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 4); // Ends in 4 hours

    const cRes = db.prepare(`
        INSERT INTO contests (title, description, start_time, end_time, contest_type, freeze_minutes)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        'Dasturlash bo‘yicha maktab saralash olimpiadasi',
        'Offline intranet muhitidagi barcha o‘quvchilar uchun ICPC qoidalariga asoslangan musobaqa.',
        startTime.toISOString(),
        endTime.toISOString(),
        'icpc',
        60
    );

    const contestId = Number(cRes.lastInsertRowid);
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const allProbs = db.prepare('SELECT id FROM problems ORDER BY code ASC LIMIT 5').all();

    for (let i = 0; i < allProbs.length; i++) {
        db.prepare(`
            INSERT INTO contest_problems (contest_id, problem_id, problem_order, letter, score)
            VALUES (?, ?, ?, ?, ?)
        `).run(contestId, allProbs[i].id, i + 1, letters[i], 100);
    }
}

console.log('Seeding completed successfully!');
