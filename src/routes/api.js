const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const db = require('../db');
const { requireAuth } = require('../auth');
const judgeRunner = require('../judge/runner');
const contestsEngine = require('../contests');
const plagiarismEngine = require('../plagiarism');

function sanitizePdfText(str) {
    if (!str) return '';
    return String(str)
        .replace(/[\u2018\u2019\u02BB\u02BC`]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/≤/g, '<=')
        .replace(/≥/g, '>=')
        .replace(/≠/g, '!=')
        .replace(/×/g, '*')
        .replace(/—/g, '-');
}

function normalizeSubmissionRow(s) {
    if (!s) return s;
    let dt = s.created_at;
    if (dt && typeof dt === 'string') {
        if (!dt.endsWith('Z') && !dt.includes('+')) {
            dt = dt.replace(' ', 'T') + 'Z';
        }
    }
    const timeSpent = (s.time_spent !== undefined && s.time_spent !== null) ? Number(s.time_spent) : ((s.time_ms !== undefined && s.time_ms !== null) ? Number(s.time_ms) : 0);
    const memUsed = (s.memory_used !== undefined && s.memory_used !== null) ? Number(s.memory_used) : ((s.memory_kb !== undefined && s.memory_kb !== null) ? Number(s.memory_kb) : 0);
    return {
        ...s,
        created_at: dt,
        time_spent: timeSpent,
        time_ms: timeSpent,
        execution_time_ms: timeSpent,
        memory_used: memUsed,
        memory_kb: memUsed,
        is_upsolve: !!s.is_upsolve
    };
}

// Site statistics
router.get('/stats', (req, res) => {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalProblems = db.prepare(`
        SELECT COUNT(*) as count FROM problems 
        WHERE is_active = 1 AND is_public = 1 AND (is_secret = 0 OR is_secret IS NULL) AND (visibility = 'public' OR visibility IS NULL)
    `).get().count;
    const totalSubmissions = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;
    const allContestsForStats = db.prepare('SELECT start_time, end_time, is_active FROM contests WHERE is_active = 1 OR is_active IS NULL').all();
    const nowForStats = Date.now();
    const activeContests = allContestsForStats.filter(c => {
        const s = contestsEngine.parseSubDate(c.start_time);
        const e = contestsEngine.parseSubDate(c.end_time);
        return nowForStats >= s && nowForStats <= e;
    }).length;

    const topUsers = db.prepare(`
        SELECT id, username, full_name, rating, solved_count 
        FROM users 
        WHERE role != 'admin' 
        ORDER BY solved_count DESC, rating DESC 
        LIMIT 5
    `).all();

    res.json({
        totalUsers,
        totalProblems,
        totalSubmissions,
        activeContests,
        topUsers
    });
});

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

// Search problems endpoint (for modals and live autocomplete)
router.get('/problems/search', (req, res) => {
    const rawQuery = req.query.q || req.query.search || req.query.query || '';
    const q = String(rawQuery).trim().toLowerCase();
    const isAdmin = req.user && req.user.role === 'admin';
    const publicFilter = "p.is_public = 1 AND (p.is_secret = 0 OR p.is_secret IS NULL) AND (p.visibility = 'public' OR p.visibility IS NULL)";
    const whereBase = isAdmin ? 'p.is_active = 1' : `p.is_active = 1 AND ${publicFilter}`;

    try {
        let problems;
        if (!q) {
            problems = db.prepare(`
                SELECT p.id, p.code, p.title, p.difficulty, p.category, p.author_name,
                       p.time_limit, p.memory_limit, p.score, p.visibility, p.is_secret
                FROM problems p
                WHERE ${whereBase}
                ORDER BY p.id DESC
                LIMIT 30
            `).all();
        } else {
            const pattern = `%${q}%`;
            problems = db.prepare(`
                SELECT p.id, p.code, p.title, p.difficulty, p.category, p.author_name,
                       p.time_limit, p.memory_limit, p.score, p.visibility, p.is_secret
                FROM problems p
                WHERE ${whereBase} AND (LOWER(p.title) LIKE ? OR LOWER(p.code) LIKE ?)
                ORDER BY 
                    CASE 
                        WHEN LOWER(p.code) = ? THEN 1
                        WHEN LOWER(p.title) = ? THEN 2
                        WHEN LOWER(p.code) LIKE ? THEN 3
                        WHEN LOWER(p.title) LIKE ? THEN 4
                        ELSE 5
                    END,
                    p.id DESC
                LIMIT 30
            `).all(pattern, pattern, q, q, `${q}%`, `${q}%`);
        }

        res.json({ success: true, problems });
    } catch (err) {
        res.status(500).json({ error: 'Qidiruvda xatolik: ' + err.message, problems: [] });
    }
});

// Problems list
router.get('/problems', (req, res) => {
    const isAdmin = req.user && req.user.role === 'admin';
    const publicFilter = "p.is_public = 1 AND (p.is_secret = 0 OR p.is_secret IS NULL) AND (p.visibility = 'public' OR p.visibility IS NULL)";
    let whereClause = isAdmin ? 'WHERE p.is_active = 1' : `WHERE p.is_active = 1 AND ${publicFilter}`;
    const params = [];

    const searchQuery = (req.query.search || req.query.q || '').trim().toLowerCase();
    if (searchQuery) {
        whereClause += ' AND (LOWER(p.title) LIKE ? OR LOWER(p.code) LIKE ?)';
        params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    const problems = db.prepare(`
        SELECT p.id, p.code, p.title, p.difficulty, p.category, p.author_name, p.time_limit, p.memory_limit, p.score, p.is_secret, p.is_archived, p.is_public, p.visibility,
               (SELECT COUNT(*) FROM submissions WHERE problem_id = p.id AND status = 'Accepted') as accepted_count,
               (SELECT COUNT(*) FROM submissions WHERE problem_id = p.id) as total_count
        FROM problems p
        ${whereClause}
        ORDER BY p.code ASC
    `).all(...params);

    let userSolved = new Set();
    let userFavs = new Set();

    if (req.user) {
        const solved = db.prepare(`
            SELECT DISTINCT problem_id 
            FROM submissions 
            WHERE user_id = ? AND status = 'Accepted'
        `).all(req.user.id);
        solved.forEach(s => userSolved.add(s.problem_id));

        const userRow = db.prepare('SELECT favorites FROM users WHERE id = ?').get(req.user.id);
        try {
            const favArr = JSON.parse(userRow?.favorites || '[]');
            favArr.forEach(c => userFavs.add(String(c)));
        } catch (_) {}
    }

    const result = problems.map(p => ({
        ...p,
        category: p.category || 'Boshlang‘ich',
        is_solved: userSolved.has(p.id),
        is_favorite: userFavs.has(String(p.code)),
        acceptance_rate: p.total_count > 0 ? Math.round((p.accepted_count / p.total_count) * 100) : 0
    }));

    res.json(result);
});

// Custom test runner (Run without submitting)
router.post('/test-custom', async (req, res) => {
    const { language, code, input } = req.body;
    if (!language || !code) {
        return res.status(400).json({ error: 'Til va kodni kiriting' });
    }
    try {
        const result = await judgeRunner.runCustomTest(language, code, input || '');
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sample tests runner (Run against all problem sample testcases)
router.post('/test-samples', async (req, res) => {
    const { problem_id, language, code, samples: customSamples } = req.body;
    if (!language || !code) {
        return res.status(400).json({ error: "Dasturlash tili va kod yuborilishi shart" });
    }

    let samples = [];
    let checkerType = 'default';
    let timeLimit = 2000;

    if (customSamples && Array.isArray(customSamples) && customSamples.length > 0) {
        samples = customSamples.map((s, i) => ({
            test_index: s.test_index || s.index || (i + 1),
            input_data: s.input_data || s.input || '',
            output_data: s.output_data || s.output || ''
        }));
    } else if (problem_id) {
        const problem = db.prepare('SELECT id, checker_type, time_limit, memory_limit FROM problems WHERE id = ? OR code = ?').get(problem_id, problem_id);
        if (!problem) {
            return res.status(404).json({ error: 'Masala topilmadi' });
        }
        checkerType = problem.checker_type || 'default';
        timeLimit = problem.time_limit || 2000;

        samples = db.prepare('SELECT test_index, input_data, output_data FROM testcases WHERE problem_id = ? AND is_sample = 1 ORDER BY test_index ASC').all(problem.id);
        if (samples.length === 0) {
            samples = db.prepare('SELECT test_index, input_data, output_data FROM testcases WHERE problem_id = ? ORDER BY test_index ASC LIMIT 2').all(problem.id);
        }
    } else {
        return res.status(400).json({ error: "Masala kodi/ID yoki namunaviy testlar ro‘yxati talab qilinadi" });
    }

    if (samples.length === 0) {
        return res.status(400).json({ error: 'Ushbu masalada namunaviy testlar mavjud emas' });
    }

    try {
        const result = await judgeRunner.runSampleTests(language, code, samples, checkerType, timeLimit);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle favorite problem
router.post('/problems/:code/favorite', requireAuth, (req, res) => {
    const userRow = db.prepare('SELECT favorites FROM users WHERE id = ?').get(req.user.id);
    let favs = [];
    try { favs = JSON.parse(userRow?.favorites || '[]'); } catch (_) {}

    const code = String(req.params.code);
    const idx = favs.indexOf(code);
    if (idx >= 0) {
        favs.splice(idx, 1);
    } else {
        favs.push(code);
    }

    db.prepare('UPDATE users SET favorites = ? WHERE id = ?').run(JSON.stringify(favs), req.user.id);
    res.json({ success: true, is_favorite: favs.includes(code) });
});

// Remove from favorite problem
router.delete('/problems/:code/favorite', requireAuth, (req, res) => {
    const userRow = db.prepare('SELECT favorites FROM users WHERE id = ?').get(req.user.id);
    let favs = [];
    try { favs = JSON.parse(userRow?.favorites || '[]'); } catch (_) {}

    const code = String(req.params.code);
    favs = favs.filter(c => c !== code);

    db.prepare('UPDATE users SET favorites = ? WHERE id = ?').run(JSON.stringify(favs), req.user.id);
    res.json({ success: true, is_favorite: false });
});

// Single problem by code
router.get('/problems/:code', (req, res) => {
    const prob = db.prepare('SELECT * FROM problems WHERE (code = ? OR id = ?) AND is_active = 1').get(req.params.code, req.params.code);
    if (!prob) {
        return res.status(404).json({ error: 'Masala topilmadi' });
    }

    const isAdmin = req.user && req.user.role === 'admin';
    const isPublic = prob.is_public === 1 && (prob.is_secret === 0 || prob.is_secret === null) && (prob.visibility === 'public' || prob.visibility === null);

    if (!isPublic && !isAdmin) {
        return res.status(403).json({ 
            error: 'Ushbu masala maxfiy hisoblanadi va faqat tegishli olimpiada doirasida yechilishi mumkin.',
            is_private: true 
        });
    }

    const samples = db.prepare(`
        SELECT test_index, input_data, output_data 
        FROM testcases 
        WHERE problem_id = ? AND is_sample = 1 
        ORDER BY test_index ASC
    `).all(prob.id);

    let userSubmissions = [];
    if (req.user) {
        userSubmissions = db.prepare(`
            SELECT id, language, status, score, time_spent, memory_used, created_at 
            FROM submissions 
            WHERE problem_id = ? AND user_id = ? AND contest_id IS NULL
            ORDER BY id DESC 
            LIMIT 10
        `).all(prob.id, req.user.id).map(normalizeSubmissionRow);
    }

    res.json({
        problem: prob,
        samples,
        my_submissions: userSubmissions
    });
});

// Submit solution
router.post('/submissions', requireAuth, (req, res) => {
    const { problem_id, contest_id, language, code } = req.body;

    if (!problem_id || !language || !code) {
        return res.status(400).json({ error: 'Barcha maydonlarni to‘ldiring' });
    }

    if (!['cpp', 'java', 'python'].includes(language)) {
        return res.status(400).json({ error: 'Faqat C++, Java va Python 3 tillari qo‘llab-quvvatlanadi' });
    }

    if (code.trim().length === 0) {
        return res.status(400).json({ error: 'Kod bo‘sh bo‘lishi mumkin emas' });
    }

    // Retrieve problem
    const prob = db.prepare('SELECT id, code, is_public, is_secret, visibility FROM problems WHERE (id = ? OR code = ?) AND is_active = 1').get(problem_id, problem_id);
    if (!prob) {
        return res.status(404).json({ error: 'Masala topilmadi' });
    }

    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    const isPublic = prob.is_public === 1 && (prob.is_secret === 0 || prob.is_secret === null) && (prob.visibility === 'public' || prob.visibility === null);

    // Private problem access control
    if (!isPublic && !isStaff) {
        if (!contest_id) {
            return res.status(403).json({
                error: 'Ushbu masala maxfiy hisoblanadi va unga faqat tegishli olimpiada doirasida yechim yuborish mumkin.'
            });
        }
    }

    let attemptNumber = 1;
    let isUpsolve = 0;
    if (contest_id) {
        const contest = db.prepare('SELECT * FROM contests WHERE id = ?').get(contest_id);
        if (!contest) return res.status(404).json({ error: 'Olimpiada topilmadi' });

        const isJudge = isStaff || !!db.prepare('SELECT id FROM contest_judges WHERE contest_id = ? AND user_id = ?').get(contest_id, req.user.id);

        // Check if problem is in this contest
        const cp = db.prepare('SELECT id FROM contest_problems WHERE contest_id = ? AND problem_id = ?').get(contest_id, prob.id);
        if (!cp && !isJudge) {
            return res.status(400).json({ error: 'Ushbu masala mazkur olimpiadaga biriktirilmagan' });
        }

        const now = new Date().getTime();
        const start = new Date(contest.start_time).getTime();
        const end = new Date(contest.end_time).getTime();

        if (now < start && !isJudge) {
            return res.status(400).json({ error: 'Olimpiada hali boshlanmagan' });
        }

        // Contest participant check
        if (!isJudge) {
            const reg = db.prepare('SELECT id FROM contest_participants WHERE contest_id = ? AND user_id = ? AND (is_disqualified = 0 OR is_disqualified IS NULL)').get(contest_id, req.user.id);
            if (!reg) {
                return res.status(403).json({ error: 'Siz ushbu olimpiadada ro‘yxatdan o‘tmagansiz' });
            }
        }

        if (now > end) {
            if (contest.show_problems_after_contest === 0 && !isJudge) {
                return res.status(400).json({ error: 'Olimpiada vaqti tugagan' });
            }
            isUpsolve = 1;
        }

        const prevCount = db.prepare(`
            SELECT COUNT(*) as c 
            FROM submissions 
            WHERE contest_id = ? AND user_id = ? AND problem_id = ?
        `).get(contest_id, req.user.id, prob.id).c;

        if (contest.max_attempts_per_problem && prevCount >= contest.max_attempts_per_problem && !isJudge) {
            return res.status(400).json({ error: `Ushbu masala uchun maksimal urinishlar soni (${contest.max_attempts_per_problem}) ga yetdi` });
        }

        attemptNumber = prevCount + 1;
    }

    const createdAtIso = new Date().toISOString();
    const insRes = db.prepare(`
        INSERT INTO submissions (user_id, problem_id, contest_id, attempt_number, language, code, status, created_at, is_upsolve)
        VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
    `).run(req.user.id, prob.id, contest_id || null, attemptNumber, language, code, createdAtIso, isUpsolve);

    const submissionId = Number(insRes.lastInsertRowid);
    judgeRunner.enqueueSubmission(submissionId);

    res.json({
        success: true,
        submission_id: submissionId,
        attempt_number: attemptNumber,
        is_upsolve: !!isUpsolve,
        message: isUpsolve ? 'Kodingiz navbatga joylashtirildi (Upsolve)' : 'Kodingiz navbatga joylashtirildi'
    });
});

// Submissions list (Strict permissions: student sees ONLY their own submissions, admin/judge sees all)
router.get('/submissions', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { user, user_id, problem_id, status } = req.query;

    let filterSql = '';
    const params = [];

    if (user_id) {
        filterSql += ' AND s.user_id = ?';
        params.push(user_id);
    } else if (user && user.trim()) {
        filterSql += ' AND (LOWER(u.username) LIKE ? OR LOWER(u.full_name) LIKE ?)';
        params.push(`%${user.trim().toLowerCase()}%`, `%${user.trim().toLowerCase()}%`);
    }

    if (problem_id && problem_id !== 'all') {
        filterSql += ' AND (s.problem_id = ? OR p.code = ?)';
        params.push(problem_id, problem_id);
    }

    if (status && status !== 'all') {
        filterSql += ' AND s.status LIKE ?';
        params.push(`%${status}%`);
    }

    const whereClause = filterSql ? `WHERE 1=1 ${filterSql}` : '';

    const submissions = db.prepare(`
        SELECT s.id, s.user_id, s.problem_id, s.contest_id, s.language, s.status, s.score, 
               s.time_spent, s.memory_used, s.created_at,
               u.username, u.full_name,
               p.code as problem_code, p.title as problem_title
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        JOIN problems p ON s.problem_id = p.id
        ${whereClause}
        ORDER BY s.id DESC
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset).map(normalizeSubmissionRow);

    const total = db.prepare(`
        SELECT COUNT(*) as count 
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        JOIN problems p ON s.problem_id = p.id
        ${whereClause}
    `).get(...params).count;

    res.json({
        submissions,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
    });
});

// Single submission details
router.get('/submissions/:id', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Iltimos, avval tizimga kiring' });
    }

    const sub = db.prepare(`
        SELECT s.*, u.username, u.full_name, u.role as user_role, p.code as problem_code, p.title as problem_title, p.time_limit
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        JOIN problems p ON s.problem_id = p.id
        WHERE s.id = ?
    `).get(req.params.id);

    if (!sub) {
        return res.status(404).json({ error: 'Urinish topilmadi' });
    }

    const isOwner = req.user.id === sub.user_id;
    const isStaff = ['admin', 'superadmin', 'judge'].includes(String(req.user.role).toLowerCase());
    let isContestJudge = false;
    if (sub.contest_id) {
        const judgeRow = db.prepare('SELECT id FROM contest_judges WHERE contest_id = ? AND user_id = ?').get(sub.contest_id, req.user.id);
        isContestJudge = Boolean(judgeRow);
    }

    if (!isStaff && !isOwner && !isContestJudge) {
        return res.status(403).json({ 
            error: "Siz boshqa foydalanuvchilarning kodini ko'ra olmaysiz!",
            forbidden: true
        });
    }

    const normSub = normalizeSubmissionRow(sub);

    res.json({
        submission: {
            ...normSub,
            test_details: normSub.test_details ? JSON.parse(normSub.test_details) : []
        }
    });
});

// Single submission code only (with strict RBAC check)
router.get('/submissions/:id/code', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Iltimos, avval tizimga kiring' });
    }

    const sub = db.prepare('SELECT id, user_id, contest_id, code, language FROM submissions WHERE id = ?').get(req.params.id);
    if (!sub) {
        return res.status(404).json({ error: 'Urinish topilmadi' });
    }

    const isOwner = req.user.id === sub.user_id;
    const isStaff = ['admin', 'superadmin', 'judge'].includes(String(req.user.role).toLowerCase());
    let isContestJudge = false;
    if (sub.contest_id) {
        const judgeRow = db.prepare('SELECT id FROM contest_judges WHERE contest_id = ? AND user_id = ?').get(sub.contest_id, req.user.id);
        isContestJudge = Boolean(judgeRow);
    }

    if (!isStaff && !isOwner && !isContestJudge) {
        return res.status(403).json({ 
            error: "Siz boshqa foydalanuvchilarning kodini ko'ra olmaysiz!",
            forbidden: true
        });
    }

    res.json({
        id: sub.id,
        language: sub.language,
        code: sub.code
    });
});

function checkGradeEligibility(targetGradesJson, userGradeRaw, isStaff = false) {
    if (isStaff) return true;
    let targetGrades = [];
    try {
        targetGrades = JSON.parse(targetGradesJson || '[]');
    } catch (_) {}
    if (!Array.isArray(targetGrades) || targetGrades.length === 0 || targetGrades.includes('all') || targetGrades.length >= 7) {
        return true; // Open to all grades
    }
    const uGrade = (userGradeRaw || '').trim();
    if (!uGrade) return false;
    const uNum = uGrade.replace(/[^0-9]/g, '');
    return targetGrades.some(g => {
        const gNum = g.replace(/[^0-9]/g, '');
        return (gNum && uNum && gNum === uNum) || g.toLowerCase() === uGrade.toLowerCase();
    });
}

// Contests list
router.get('/contests', (req, res) => {
    const userId = req.user ? req.user.id : null;
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    const userGrade = req.user?.grade || '';
    const contests = db.prepare(`
        SELECT c.*, 
               (SELECT COUNT(*) FROM contest_problems WHERE contest_id = c.id) as problems_count,
               (SELECT COUNT(*) FROM contest_participants cp JOIN users u ON cp.user_id = u.id WHERE cp.contest_id = c.id AND LOWER(u.role) NOT IN ('admin', 'judge')) as participants_count
        FROM contests c
        WHERE (c.is_active = 1 OR c.is_active IS NULL)
        ORDER BY c.start_time DESC
    `).all();

    let userRegisteredContests = new Set();
    if (userId) {
        const rows = db.prepare(`
            SELECT contest_id 
            FROM contest_participants 
            WHERE user_id = ? AND (is_disqualified = 0 OR is_disqualified IS NULL)
        `).all(userId);
        rows.forEach(r => userRegisteredContests.add(r.contest_id));
    }

    const now = Date.now();
    const result = contests
        .filter(c => {
            const isPrivate = ['PRIVATE', 'YOPIQ'].includes(String(c.type || '').trim().toUpperCase()) || 
                              ['private', 'yopiq'].includes(String(c.contest_mode || '').trim().toLowerCase());
            if (isPrivate && !isStaff) {
                // Private olympiads are hidden from ordinary users unless they are in contest_participants
                return userRegisteredContests.has(c.id);
            }
            return true;
        })
        .map(c => {
            const startMs = contestsEngine.parseSubDate(c.start_time);
            const endMs = contestsEngine.parseSubDate(c.end_time);
            const isLive = now >= startMs && now <= endMs;
            const isUpcoming = now < startMs;
            const isFinished = now > endMs;

            let status = 'Yakunlangan';
            let statusLabel = '🏁 Tugallangan';
            if (isUpcoming) {
                status = 'Kutilmoqda';
                statusLabel = '⏳ Kutilmoqda';
            } else if (isLive) {
                status = 'Faol';
                statusLabel = '🔴 Davom etmoqda';
            }

            let targetGrades = [];
            try { targetGrades = JSON.parse(c.target_grades || '[]'); } catch (_) {}
            const isGradeEligible = checkGradeEligibility(c.target_grades, userGrade, isStaff);
            const isRegistered = userRegisteredContests.has(c.id);

            return { 
                ...c, 
                target_grades: targetGrades,
                is_grade_eligible: isGradeEligible,
                status,
                status_label: statusLabel,
                is_live: isLive,
                is_upcoming: isUpcoming,
                is_finished: isFinished,
                start_time_ms: startMs,
                end_time_ms: endMs,
                is_registered: isRegistered
            };
        });

    res.json(result);
});

// Contest details & problems
router.get('/contests/:id', (req, res) => {
    let contest = db.prepare('SELECT * FROM contests WHERE id = ?').get(req.params.id);
    if (!contest) {
        contest = db.prepare('SELECT * FROM contests WHERE title = ?').get(req.params.id);
    }
    if (!contest) {
        return res.status(404).json({ error: 'Olimpiada topilmadi' });
    }

    const now = Date.now();
    const startTime = contestsEngine.parseSubDate(contest.start_time);
    const endTime = contestsEngine.parseSubDate(contest.end_time);
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'judge');
    const isStarted = now >= startTime;
    const isFinished = now > endTime;

    let isRegistered = false;
    if (req.user) {
        const reg = db.prepare('SELECT id FROM contest_participants WHERE contest_id = ? AND user_id = ? AND (is_disqualified = 0 OR is_disqualified IS NULL)').get(contest.id, req.user.id);
        isRegistered = Boolean(reg);
    }

    const isPrivate = ['PRIVATE', 'YOPIQ'].includes(String(contest.type || '').trim().toUpperCase()) || 
                      ['private', 'yopiq'].includes(String(contest.contest_mode || '').trim().toLowerCase());
    if (isPrivate && !isAdmin && !isRegistered) {
        return res.status(403).json({ error: 'Ushbu olimpiada yopiq (maxfiy) va siz ro‘yxatga olinmagansiz' });
    }

    const partRow = db.prepare(`
        SELECT COUNT(*) as count 
        FROM contest_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.contest_id = ? AND LOWER(u.role) NOT IN ('admin', 'judge')
    `).get(contest.id);
    const participantsCount = partRow ? partRow.count : 0;

    let problems = [];
    if ((isStarted && (isRegistered || isAdmin)) || isAdmin) {
        problems = db.prepare(`
            SELECT cp.letter, cp.score, cp.problem_order, p.id, p.code, p.title, p.difficulty 
            FROM contest_problems cp
            JOIN problems p ON cp.problem_id = p.id
            WHERE cp.contest_id = ?
            ORDER BY cp.problem_order ASC
        `).all(contest.id);
    }

    let targetGrades = [];
    try { targetGrades = JSON.parse(contest.target_grades || '[]'); } catch (_) {}
    const isGradeEligible = checkGradeEligibility(contest.target_grades, req.user?.grade || '', isAdmin);

    res.json({
        contest: {
            ...contest,
            target_grades: targetGrades,
            is_grade_eligible: isGradeEligible,
            is_started: isStarted,
            is_finished: isFinished,
            start_time_ms: startTime,
            end_time_ms: endTime,
            time_to_start: Math.max(0, startTime - now),
            time_to_end: Math.max(0, endTime - now),
            is_registered: isRegistered,
            participants_count: participantsCount
        },
        problems
    });
});

// Single problem inside contest
router.get(['/contests/:contestId/problems/:problemId', '/olympiads/:contestId/problems/:problemId'], (req, res) => {
    const { contestId, problemId } = req.params;
    let contest = db.prepare('SELECT * FROM contests WHERE id = ?').get(contestId);
    if (!contest) {
        contest = db.prepare('SELECT * FROM contests WHERE title = ?').get(contestId);
    }
    if (!contest) return res.status(404).json({ error: 'Olimpiada topilmadi' });

    const now = Date.now();
    const startTime = contestsEngine.parseSubDate(contest.start_time);
    const endTime = contestsEngine.parseSubDate(contest.end_time);
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    const isJudge = isStaff || (req.user && !!db.prepare('SELECT id FROM contest_judges WHERE contest_id = ? AND user_id = ?').get(contest.id, req.user.id));

    if (now < startTime && !isJudge) {
        return res.status(403).json({ error: 'Musobaqa hali boshlanmadi!' });
    }

    let isParticipant = false;
    if (req.user) {
        const reg = db.prepare('SELECT id FROM contest_participants WHERE contest_id = ? AND user_id = ? AND (is_disqualified = 0 OR is_disqualified IS NULL)').get(contest.id, req.user.id);
        isParticipant = Boolean(reg);
    }

    const isPublic = ['PUBLIC', 'OCHIQ'].includes(String(contest.type || '').trim().toUpperCase()) ||
                     ['public', 'ochiq'].includes(String(contest.contest_mode || '').trim().toLowerCase());

    if (isPublic && req.user && !isParticipant) {
        try {
            db.prepare("INSERT OR IGNORE INTO contest_participants (contest_id, user_id, is_official, is_registered, status) VALUES (?, ?, 1, 1, 'REGISTERED')")
                .run(contest.id, req.user.id);
            isParticipant = true;
        } catch (_) {}
    }

    const isFinished = now > endTime;
    const canView = isJudge || isParticipant || (isPublic && now >= startTime) || isFinished;

    if (!canView) {
        return res.status(403).json({ error: 'Ushbu masalani ko‘rish uchun olimpiadadan ro‘yxatdan o‘tgan bo‘lishingiz kerak.' });
    }

    const item = db.prepare(`
        SELECT cp.letter, cp.score as contest_score, p.*
        FROM contest_problems cp
        JOIN problems p ON cp.problem_id = p.id
        WHERE cp.contest_id = ? AND (p.id = ? OR p.code = ?)
    `).get(contest.id, problemId, problemId);

    if (!item) {
        return res.status(404).json({ error: 'Ushbu masala mazkur olimpiadaga biriktirilmagan' });
    }

    // All problem letters in contest for quick switching
    const allLetters = db.prepare(`
        SELECT cp.letter, cp.letter_index, cp.problem_id as id, p.code
        FROM contest_problems cp
        JOIN problems p ON cp.problem_id = p.id
        WHERE cp.contest_id = ?
        ORDER BY CASE WHEN cp.problem_order > 0 THEN cp.problem_order ELSE cp.order_num END ASC, cp.id ASC
    `).all(contest.id).map((cp, idx) => {
        const autoLetter = getLetterIndex(idx);
        const letter = (cp.letter && cp.letter.trim().length > 1) ? cp.letter.trim() : autoLetter;
        return {
            id: cp.id,
            code: cp.code,
            letter
        };
    });

    const currentMatched = allLetters.find(x => x.id === item.id);
    if (currentMatched) {
        item.letter = currentMatched.letter;
    }

    const samples = db.prepare(`
        SELECT test_index, input_data, output_data 
        FROM testcases 
        WHERE problem_id = ? AND is_sample = 1 
        ORDER BY test_index ASC
    `).all(item.id);

    let myContestSubmissions = [];
    if (req.user) {
        myContestSubmissions = db.prepare(`
            SELECT id, attempt_number, language, status, score, time_spent, memory_used, created_at 
            FROM submissions 
            WHERE contest_id = ? AND problem_id = ? AND user_id = ?
            ORDER BY id DESC
        `).all(contestId, item.id, req.user.id).map(normalizeSubmissionRow);
    }

    res.json({
        contest: {
            id: contest.id,
            title: contest.title,
            contest_type: contest.contest_type,
            end_time: contest.end_time,
            allowed_languages: JSON.parse(contest.allowed_languages || '["cpp","java","python"]')
        },
        problem: item,
        contest_letters: allLetters,
        samples,
        my_submissions: myContestSubmissions
    });
});

// Contest standings / scoreboard (Requirement 4 & 6)
const handleStandings = (req, res) => {
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'judge');
    const standings = contestsEngine.getContestStandings(req.params.id, isAdmin);
    if (!standings) {
        return res.status(404).json({ error: 'Olimpiada topilmadi' });
    }
    res.json(standings);
};
router.get('/contests/:id/standings', handleStandings);
router.get('/contests/:id/scoreboard', handleStandings);

// Register for contest (Requirement 1 & Requirement 4)
router.post('/contests/:id/register', requireAuth, (req, res) => {
    const contest = db.prepare('SELECT * FROM contests WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!contest) {
        return res.status(404).json({ error: 'Olimpiada topilmadi' });
    }

    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    const userRow = db.prepare('SELECT grade FROM users WHERE id = ?').get(req.user.id);
    const userGrade = userRow?.grade || req.user?.grade || '';

    let targetGrades = [];
    try { targetGrades = JSON.parse(contest.target_grades || '[]'); } catch (_) {}
    const isEligible = checkGradeEligibility(contest.target_grades, userGrade, isStaff);

    if (!isEligible) {
        return res.status(403).json({
            error: `Kechirasiz, bu olimpiada faqat ${targetGrades.join(', ')} o'quvchilari uchun mo'ljallangan.`
        });
    }

    try {
        db.prepare(`
            INSERT INTO contest_participants (contest_id, user_id, is_official, is_registered, status) 
            VALUES (?, ?, 1, 1, 'REGISTERED')
            ON CONFLICT(contest_id, user_id) DO UPDATE SET 
                is_registered = 1, 
                status = 'REGISTERED', 
                is_disqualified = 0
        `).run(contest.id, req.user.id);
        res.json({ success: true, message: 'Musobaqaga muvaffaqiyatli ro‘yxatdan o‘tdingiz' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Unregister from contest (Requirement 1)
router.post('/contests/:id/unregister', requireAuth, (req, res) => {
    const contest = db.prepare('SELECT * FROM contests WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!contest) {
        return res.status(404).json({ error: 'Olimpiada topilmadi' });
    }

    try {
        db.prepare('DELETE FROM contest_participants WHERE contest_id = ? AND user_id = ?')
            .run(contest.id, req.user.id);
        res.json({ success: true, message: 'Musobaqa ro‘yxatidan muvaffaqiyatli chiqdingiz' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Contest participants list (Requirement 6: strictly excluding ADMIN / JUDGE)
router.get('/contests/:id/participants', (req, res) => {
    const contest = db.prepare('SELECT id, title FROM contests WHERE id = ?').get(req.params.id);
    if (!contest) {
        return res.status(404).json({ error: 'Olimpiada topilmadi' });
    }

    const participants = db.prepare(`
        SELECT u.id as user_id, u.username, u.full_name, u.school, u.grade, cp.registered_at, cp.is_official
        FROM contest_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.contest_id = ? AND LOWER(u.role) NOT IN ('admin', 'judge')
        ORDER BY cp.registered_at ASC, u.full_name ASC
    `).all(contest.id);

    res.json({
        contest,
        total: participants.length,
        participants
    });
});

// Contest submissions list (with filters: user, problem_id, status, upsolve)
router.get('/contests/:id/submissions', (req, res) => {
    const contestId = req.params.id;
    const contest = db.prepare('SELECT id, end_time, hide_submissions FROM contests WHERE id = ?').get(contestId);
    if (!contest) return res.status(404).json({ error: 'Olimpiada topilmadi' });

    const isStaff = req.user && ['admin', 'superadmin', 'judge'].includes(String(req.user.role).toLowerCase());
    let isContestJudge = false;
    if (req.user) {
        const judgeRow = db.prepare('SELECT id FROM contest_judges WHERE contest_id = ? AND user_id = ?').get(contestId, req.user.id);
        isContestJudge = Boolean(judgeRow);
    }
    const canSeeAll = isStaff || isContestJudge;

    const { user, problem_id, status, upsolve } = req.query;

    let filterSql = '';
    const params = [contestId];

    if (!canSeeAll) {
        if (!req.user) {
            return res.json({ submissions: [], total: 0 });
        }
        filterSql += ' AND s.user_id = ?';
        params.push(req.user.id);
    } else if (user && user.trim()) {
        filterSql += ' AND (LOWER(u.username) LIKE ? OR LOWER(u.full_name) LIKE ?)';
        params.push(`%${user.trim().toLowerCase()}%`, `%${user.trim().toLowerCase()}%`);
    }

    if (problem_id && problem_id !== 'all') {
        filterSql += ' AND (s.problem_id = ? OR p.code = ? OR cp.letter = ?)';
        params.push(problem_id, problem_id, problem_id);
    }

    if (status && status !== 'all') {
        filterSql += ' AND s.status LIKE ?';
        params.push(`%${status}%`);
    }

    if (upsolve === 'contest') {
        filterSql += ' AND (s.is_upsolve = 0 OR s.is_upsolve IS NULL)';
    } else if (upsolve === 'upsolve') {
        filterSql += ' AND s.is_upsolve = 1';
    }

    const submissions = db.prepare(`
        SELECT s.id, s.user_id, s.problem_id, s.contest_id, s.language, s.status, s.score,
               s.time_spent, s.memory_used, s.created_at, s.is_upsolve, s.code, s.compiler_output, s.test_details,
               u.username, u.full_name,
               cp.letter, p.code as problem_code, p.title as problem_title
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        JOIN problems p ON s.problem_id = p.id
        LEFT JOIN contest_problems cp ON cp.contest_id = s.contest_id AND cp.problem_id = s.problem_id
        WHERE s.contest_id = ? ${filterSql}
        ORDER BY s.id DESC
    `).all(...params).map(normalizeSubmissionRow);

    const cleanedSubmissions = submissions.map(s => {
        const canView = canSeeAll || (req.user && req.user.id === s.user_id);
        if (!canView) {
            const { code, compiler_output, test_details, ...rest } = s;
            return rest;
        }
        return s;
    });

    res.json({ submissions: cleanedSubmissions, total: cleanedSubmissions.length });
});

// Flag submission violation from inspection modal
router.post('/contests/:id/submissions/:subId/violation', (req, res) => {
    if (!req.user || !['admin', 'judge'].includes(String(req.user.role).toLowerCase())) {
        return res.status(403).json({ error: 'Faqat hakamlar yoki adminlar uchun' });
    }
    const { note } = req.body;
    const sub = db.prepare('SELECT * FROM submissions WHERE id = ? AND contest_id = ?').get(req.params.subId, req.params.id);
    if (!sub) return res.status(404).json({ error: 'Urinish topilmadi' });

    const adminNote = note || "Sun'iy intellektdan ko'chirilgan";
    const snippet = (sub.code || '').substring(0, 500);

    try {
        db.prepare(`
            INSERT INTO contest_plagiarism (contest_id, problem_id, submission_id, suspect_user_id, similarity_percentage, code_snippet, admin_note, status)
            VALUES (?, ?, ?, ?, 100, ?, ?, 'CONFIRMED_VIOLATION')
        `).run(req.params.id, sub.problem_id, sub.id, sub.user_id, snippet, adminNote);
    } catch (_) {}

    plagiarismEngine.disqualifyParticipant(req.params.id, sub.user_id, `Chetlandi: ${adminNote}`);
    contestsEngine.broadcastContestUpdate(req.params.id);

    res.json({ success: true, message: 'Qoidabuzarlik belgilandi va qatnashuvchi chetlatildi' });
});

// Standings Excel Export
router.get('/contests/:id/export-standings', (req, res) => {
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'judge');
    const buffer = contestsEngine.exportStandingsToExcel(req.params.id, isAdmin);
    if (!buffer) return res.status(404).json({ error: 'Olimpiada topilmadi' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="contest_${req.params.id}_standings.xlsx"`);
    res.send(buffer);
});

// Standings recalculate (Idempotent)
router.post('/contests/:id/recalculate', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    contestsEngine.broadcastContestUpdate(req.params.id);
    const standings = contestsEngine.getContestStandings(req.params.id, true);
    res.json({ success: true, standings });
});

// Live Updates SSE Stream
router.get('/contests/:id/live-updates', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (res.flushHeaders) res.flushHeaders();

    const contestId = Number(req.params.id);
    const handler = (data) => {
        if (data.contestId === contestId) {
            res.write(`data: ${JSON.stringify({ event: 'standings_updated', timestamp: data.timestamp })}\n\n`);
        }
    };

    contestsEngine.contestEmitter.on('standings_updated', handler);

    // Initial heartbeat
    res.write(`data: ${JSON.stringify({ event: 'connected', contestId })}\n\n`);

    req.on('close', () => {
        contestsEngine.contestEmitter.removeListener('standings_updated', handler);
    });
});

// Plagiarism endpoints (Tab 8)
router.get('/contests/:id/plagiarism', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const subtab = req.query.tab || 'all';
    let sql = `
        SELECT cp.*, u.username, u.full_name, p.title as problem_title, p.code as problem_code
        FROM contest_plagiarism cp
        JOIN users u ON cp.suspect_user_id = u.id
        JOIN problems p ON cp.problem_id = p.id
        WHERE cp.contest_id = ?
    `;
    const params = [req.params.id];

    if (subtab === 'auto') {
        sql += ` AND cp.admin_note LIKE '%Anticheat%'`;
    } else if (subtab === 'admin') {
        sql += ` AND cp.status = 'CONFIRMED_VIOLATION' AND cp.admin_note NOT LIKE '%Anticheat%'`;
    } else if (subtab === 'appeal') {
        sql += ` AND cp.status = 'PENDING'`;
    }

    sql += ' ORDER BY cp.id DESC';
    const items = db.prepare(sql).all(...params);
    res.json({ items });
});

router.post(['/contests/:id/plagiarism-scan', '/contests/:id/run-anti-cheat'], (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const result = plagiarismEngine.runAntiCheatScan(req.params.id, req.body);
    res.json(result);
});

const clearPlagiarismHandler = (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    db.prepare('DELETE FROM contest_plagiarism WHERE contest_id = ?').run(req.params.id);
    db.prepare('UPDATE contest_participants SET is_disqualified = 0, disqualification_reason = NULL WHERE contest_id = ?').run(req.params.id);
    contestsEngine.broadcastContestUpdate(req.params.id);
    res.json({ success: true, message: 'Natijalar tozalandi va barcha chetlatishlar bekor qilindi' });
};
router.post(['/contests/:id/plagiarism-clear', '/contests/:id/anticheat/clear'], clearPlagiarismHandler);
router.delete('/contests/:id/plagiarism', clearPlagiarismHandler);

router.post('/contests/:id/plagiarism/:plagId/confirm', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const row = db.prepare('SELECT * FROM contest_plagiarism WHERE id = ? AND contest_id = ?').get(req.params.plagId, req.params.id);
    if (!row) return res.status(404).json({ error: 'Yozuv topilmadi' });

    const note = req.body.note || row.admin_note || 'Qoidabuzarlik tasdiqlandi';
    db.prepare('UPDATE contest_plagiarism SET status = ?, admin_note = ? WHERE id = ?').run('CONFIRMED_VIOLATION', note, row.id);
    plagiarismEngine.disqualifyParticipant(req.params.id, row.suspect_user_id, `Chetlandi: ${note}`);
    res.json({ success: true });
});

router.post('/contests/:id/plagiarism/:plagId/pardon', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const row = db.prepare('SELECT * FROM contest_plagiarism WHERE id = ? AND contest_id = ?').get(req.params.plagId, req.params.id);
    if (!row) return res.status(404).json({ error: 'Yozuv topilmadi' });

    db.prepare('UPDATE contest_plagiarism SET status = ? WHERE id = ?').run('PARDONED', row.id);
    plagiarismEngine.pardonParticipant(req.params.id, row.suspect_user_id);
    res.json({ success: true });
});

// Contest Participants management
router.put('/contests/:id/participants/:userId/toggle-official', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const part = db.prepare('SELECT is_official FROM contest_participants WHERE contest_id = ? AND user_id = ?').get(req.params.id, req.params.userId);
    if (!part) return res.status(404).json({ error: 'Qatnashuvchi topilmadi' });

    const nextOfficial = part.is_official ? 0 : 1;
    db.prepare('UPDATE contest_participants SET is_official = ? WHERE contest_id = ? AND user_id = ?').run(nextOfficial, req.params.id, req.params.userId);
    contestsEngine.broadcastContestUpdate(req.params.id);
    res.json({ success: true, is_official: Boolean(nextOfficial) });
});

router.post('/contests/:id/participants/:userId/disqualify', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    plagiarismEngine.disqualifyParticipant(req.params.id, req.params.userId, req.body.reason || "Chetlatilgan");
    res.json({ success: true });
});

router.post(['/contests/:id/participants/:userId/pardon', '/contests/:id/participants/:userId/restore'], (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    plagiarismEngine.pardonParticipant(req.params.id, req.params.userId);
    res.json({ success: true, message: 'Ishtirokchi oqlandi va natijasi tiklandi' });
});

router.delete('/contests/:id/participants/:userId', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    db.prepare('DELETE FROM contest_participants WHERE contest_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
    contestsEngine.broadcastContestUpdate(req.params.id);
    res.json({ success: true });
});

// Search users for contest participant / judge addition
router.get(['/admin/users/search', '/users/search'], (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const includeStaff = req.query.include_staff === 'true' || req.query.for_judge === 'true';
    const roleFilter = includeStaff ? '1=1' : "LOWER(role) NOT IN ('admin', 'judge')";
    const q = (req.query.q || '').trim().replace(/^@/, '');
    if (!q) {
        const users = db.prepare(`
            SELECT id, username, full_name, school, grade, rating, role
            FROM users
            WHERE ${roleFilter}
            ORDER BY rating DESC, full_name ASC
            LIMIT 25
        `).all();
        return res.json(users);
    }

    const pattern = `%${q}%`;
    const users = db.prepare(`
        SELECT id, username, full_name, school, grade, rating, role
        FROM users
        WHERE ${roleFilter}
          AND (
            username LIKE ? OR
            full_name LIKE ? OR
            school LIKE ?
          )
        ORDER BY rating DESC, full_name ASC
        LIMIT 30
    `).all(pattern, pattern, pattern);

    res.json(users);
});

router.post('/contests/:id/participants', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const { username, userId } = req.body;
    let user;
    if (userId) {
        user = db.prepare('SELECT id, username, full_name, school, rating FROM users WHERE id = ?').get(userId);
    } else if (username) {
        const clean = username.trim().replace(/^@/, '');
        user = db.prepare('SELECT id, username, full_name, school, rating FROM users WHERE username = ? OR username = ?').get(clean, username.trim());
    }
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    // Check duplicate
    const existing = db.prepare('SELECT id FROM contest_participants WHERE contest_id = ? AND user_id = ?').get(req.params.id, user.id);
    if (existing) {
        db.prepare("UPDATE contest_participants SET is_official = 1, is_registered = 1, status = 'REGISTERED', is_disqualified = 0 WHERE contest_id = ? AND user_id = ?")
            .run(req.params.id, user.id);
        contestsEngine.broadcastContestUpdate(req.params.id);
        return res.json({ success: true, user, message: 'Qatnashuvchi allaqachon biriktirilgan va qayta faollashtirildi' });
    }

    try {
        db.prepare("INSERT INTO contest_participants (contest_id, user_id, is_official, is_registered, status) VALUES (?, ?, 1, 1, 'REGISTERED')")
            .run(req.params.id, user.id);
        contestsEngine.broadcastContestUpdate(req.params.id);
        res.json({ success: true, user, message: 'Qatnashuvchi muvaffaqiyatli ro‘yxatga qo‘shildi' });
    } catch (e) {
        res.status(400).json({ error: 'Foydalanuvchi allaqachon ro‘yxatda' });
    }
});

// Contest Problems management
router.get(['/contests/:id/problems', '/olympiads/:id/problems'], (req, res) => {
    const contestId = req.params.id;
    let contest = db.prepare('SELECT * FROM contests WHERE id = ?').get(contestId);
    if (!contest) {
        contest = db.prepare('SELECT * FROM contests WHERE title = ?').get(contestId);
    }
    if (!contest) return res.status(404).json({ error: 'Olimpiada topilmadi' });

    const now = Date.now();
    const startTime = contestsEngine.parseSubDate(contest.start_time);
    const endTime = contestsEngine.parseSubDate(contest.end_time);
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    const isJudge = isStaff || (req.user && !!db.prepare('SELECT id FROM contest_judges WHERE contest_id = ? AND user_id = ?').get(contest.id, req.user.id));

    if (now < startTime && !isJudge) {
        return res.status(403).json({ error: 'Musobaqa hali boshlanmadi!' });
    }

    let isParticipant = false;
    if (req.user) {
        const reg = db.prepare('SELECT id FROM contest_participants WHERE contest_id = ? AND user_id = ? AND (is_disqualified = 0 OR is_disqualified IS NULL)').get(contest.id, req.user.id);
        isParticipant = Boolean(reg);
    }

    const isPublic = ['PUBLIC', 'OCHIQ'].includes(String(contest.type || '').trim().toUpperCase()) ||
                     ['public', 'ochiq'].includes(String(contest.contest_mode || '').trim().toLowerCase());

    if (isPublic && req.user && !isParticipant) {
        try {
            db.prepare("INSERT OR IGNORE INTO contest_participants (contest_id, user_id, is_official, is_registered, status) VALUES (?, ?, 1, 1, 'REGISTERED')")
                .run(contest.id, req.user.id);
            isParticipant = true;
        } catch (_) {}
    }

    const isFinished = now > endTime;
    const canView = isJudge || isParticipant || (isPublic && now >= startTime) || isFinished;

    if (!canView) {
        return res.status(403).json({ error: 'Ushbu olimpiada masalalarini ko‘rish uchun ro‘yxatdan o‘tgan bo‘lishingiz lozim.' });
    }

    const problems = db.prepare(`
        SELECT cp.id as item_id, cp.letter, cp.letter_index, cp.score, cp.problem_order, cp.order_num,
               p.id, p.code, p.title, p.difficulty, p.category, p.author_name, p.time_limit, p.memory_limit,
               p.score as global_score,
               (SELECT COUNT(*) FROM submissions WHERE problem_id = p.id AND status = 'Accepted') as ac_cnt,
               (SELECT COUNT(*) FROM submissions WHERE problem_id = p.id) as tot_cnt
        FROM contest_problems cp
        JOIN problems p ON cp.problem_id = p.id
        WHERE cp.contest_id = ?
        ORDER BY CASE WHEN cp.problem_order > 0 THEN cp.problem_order ELSE cp.order_num END ASC, cp.id ASC
    `).all(contest.id);

    const mapped = problems.map((p, idx) => {
        const rate = p.tot_cnt > 0 ? Math.round((p.ac_cnt / p.tot_cnt) * 100) : 0;
        const autoLetter = getLetterIndex(idx);
        const resolvedLetter = (p.letter && p.letter.trim().length > 1) ? p.letter.trim() : autoLetter;
        return {
            ...p,
            order_num: idx,
            problem_order: idx + 1,
            letter: resolvedLetter,
            letter_index: resolvedLetter,
            accepted_rate: rate
        };
    });

    res.json(mapped);
});

router.post('/contests/:id/problems', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const contestId = req.params.id;
    const { problem_id, score } = req.body;
    if (!problem_id) {
        return res.status(400).json({ error: 'problem_id kiritilishi shart' });
    }

    const count = db.prepare('SELECT COUNT(*) as c FROM contest_problems WHERE contest_id = ?').get(contestId).c || 0;
    const letter = getLetterIndex(count);
    const scoreVal = parseInt(score, 10) || 100;

    try {
        db.prepare(`
            INSERT INTO contest_problems (contest_id, problem_id, problem_order, order_num, letter, letter_index, score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(contestId, problem_id, count, count, letter, letter, scoreVal);
        contestsEngine.broadcastContestUpdate(contestId);
        res.json({ success: true, letter, order_num: count, score: scoreVal });
    } catch (e) {
        res.status(400).json({ error: 'Ushbu masala allaqachon biriktirilgan yoki xatolik yuz berdi' });
    }
});

function handleApiContestProblemsReorder(req, res) {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const contestId = req.params.id;
    let items = [];

    if (Array.isArray(req.body.problems)) {
        items = req.body.problems;
    } else if (Array.isArray(req.body.problem_ids)) {
        const scores = req.body.scores || {};
        items = req.body.problem_ids.map(pid => ({
            problem_id: pid,
            score: scores[pid] !== undefined ? scores[pid] : 100
        }));
    } else if (Array.isArray(req.body)) {
        items = req.body;
    }

    if (!items || items.length === 0) {
        return res.json({ success: true, count: 0 });
    }

    try {
        const updateStmt = db.prepare(`
            UPDATE contest_problems
            SET problem_order = ?, order_num = ?, letter = ?, letter_index = ?, score = ?
            WHERE contest_id = ? AND problem_id = ?
        `);

        const updateTx = db.transaction((cId, list) => {
            for (let i = 0; i < list.length; i++) {
                const p = list[i];
                const letter = getLetterIndex(i);
                const score = parseInt(p.score, 10) || 100;
                updateStmt.run(i, i, letter, letter, score, cId, p.problem_id || p.id);
            }
        });

        updateTx(contestId, items);
        contestsEngine.broadcastContestUpdate(contestId);
        res.json({ success: true, count: items.length });
    } catch (err) {
        res.status(500).json({ error: 'Tartibni saqlashda xatolik: ' + err.message });
    }
}

router.put('/contests/:id/problems/reorder', handleApiContestProblemsReorder);
router.post('/contests/:id/problems/reorder', handleApiContestProblemsReorder);

router.put('/contests/:id/problems/sort-difficulty', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const contestId = req.params.id;
    const cpRows = db.prepare(`
        SELECT cp.problem_id, cp.score,
               (SELECT COUNT(*) FROM submissions WHERE problem_id = p.id AND status = 'Accepted') as ac_cnt,
               (SELECT COUNT(*) FROM submissions WHERE problem_id = p.id) as tot_cnt
        FROM contest_problems cp
        JOIN problems p ON cp.problem_id = p.id
        WHERE cp.contest_id = ?
    `).all(contestId);

    // Sort: highest accepted percentage = easiest = A, B, C...
    cpRows.sort((a, b) => {
        const rateA = a.tot_cnt > 0 ? (a.ac_cnt / a.tot_cnt) : 0;
        const rateB = b.tot_cnt > 0 ? (b.ac_cnt / b.tot_cnt) : 0;
        if (rateB !== rateA) return rateB - rateA;
        return a.score - b.score;
    });

    const updateStmt = db.prepare(`
        UPDATE contest_problems
        SET problem_order = ?, order_num = ?, letter = ?, letter_index = ?
        WHERE contest_id = ? AND problem_id = ?
    `);

    const tx = db.transaction((cId, rows) => {
        rows.forEach((r, i) => {
            const letter = getLetterIndex(i);
            updateStmt.run(i, i, letter, letter, cId, r.problem_id);
        });
    });
    tx(contestId, cpRows);

    contestsEngine.broadcastContestUpdate(contestId);
    res.json({ success: true });
});

router.delete('/contests/:id/problems/:probId', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const contestId = req.params.id;
    const probId = req.params.probId;

    try {
        db.prepare('DELETE FROM contest_problems WHERE contest_id = ? AND problem_id = ?').run(contestId, probId);

        const remaining = db.prepare(`
            SELECT problem_id 
            FROM contest_problems 
            WHERE contest_id = ? 
            ORDER BY COALESCE(order_num, problem_order, 0) ASC, id ASC
        `).all(contestId);

        const reindexStmt = db.prepare(`
            UPDATE contest_problems 
            SET problem_order = ?, order_num = ?, letter = ?, letter_index = ? 
            WHERE contest_id = ? AND problem_id = ?
        `);

        const tx = db.transaction((cId, rows) => {
            rows.forEach((r, i) => {
                const letter = getLetterIndex(i);
                reindexStmt.run(i, i, letter, letter, cId, r.problem_id);
            });
        });
        tx(contestId, remaining);

        contestsEngine.broadcastContestUpdate(contestId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Masalani o‘chirishda xatolik: ' + err.message });
    }
});

// Contest Judges management
router.get('/contests/:id/judges', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const rows = db.prepare(`
        SELECT cj.id, cj.user_id, cj.role, cj.status, u.username, u.full_name, u.rating
        FROM contest_judges cj
        JOIN users u ON cj.user_id = u.id
        WHERE cj.contest_id = ?
        ORDER BY cj.id ASC
    `).all(req.params.id);
    res.json(rows);
});

router.post('/contests/:id/judges', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const { username, userId, role } = req.body;
    let user;
    if (userId) {
        user = db.prepare('SELECT id, username, full_name FROM users WHERE id = ?').get(userId);
    } else if (username) {
        const clean = username.trim().replace(/^@/, '');
        user = db.prepare('SELECT id, username, full_name FROM users WHERE username = ? OR username = ?').get(clean, username.trim());
    }
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    try {
        db.prepare('INSERT INTO contest_judges (contest_id, user_id, role, status) VALUES (?, ?, ?, ?)')
            .run(req.params.id, user.id, role || 'judge', 'ACCEPTED');
        res.json({ success: true, user });
    } catch (e) {
        res.status(400).json({ error: 'Hakam allaqachon biriktirilgan' });
    }
});

router.delete('/contests/:id/judges/:userId', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    db.prepare('DELETE FROM contest_judges WHERE contest_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
    res.json({ success: true });
});

// Create / Save Contest (Draft -> Saved lifecycle)
router.post('/contests', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const {
        title, type, default_language, allowed_programming_languages, description, editorial,
        rules, participation_mode, participation_type, start_time, end_time, duration,
        registration_end_time, min_rating, max_rating, rules_url, max_attempts_per_problem,
        penalty_per_wrong_attempt, hide_problem_authors, hide_results, hide_submissions,
        open_standings, open_registration, show_problems_after_contest, allow_virtual_participation,
        target_grades
    } = req.body;

    if (!title || title.trim().length < 5) {
        return res.status(400).json({ error: 'Olimpiada nomi kamida 5 ta belgidan iborat bo‘lishi shart' });
    }
    if (!start_time || !end_time) {
        return res.status(400).json({ error: 'Boshlanish va tugash vaqtlari kiritilishi shart' });
    }

    const targetGradesVal = Array.isArray(target_grades) 
        ? JSON.stringify(target_grades) 
        : (typeof target_grades === 'string' ? target_grades : '[]');

    const ins = db.prepare(`
        INSERT INTO contests (
            title, type, contest_mode, default_language, allowed_programming_languages, allowed_languages,
            description, editorial, rules, contest_type, participation_mode, participation_type,
            start_time, end_time, duration, registration_end_time, min_rating, max_rating,
            rules_url, max_attempts_per_problem, penalty_per_wrong_attempt, hide_problem_authors,
            hide_authors, hide_results, hide_submissions, open_standings, open_registration,
            show_problems_after_contest, allow_virtual_participation, virtual_allowed, target_grades
        )
        VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?
        )
    `).run(
        title.trim(),
        type || 'PUBLIC',
        (type || 'PUBLIC').toLowerCase(),
        default_language || 'uz',
        JSON.stringify(allowed_programming_languages || ['python3', 'pypy', 'cpp17', 'java']),
        JSON.stringify(['cpp', 'java', 'python']),
        description || '',
        editorial || '',
        rules || 'ICPC_CUSTOM',
        'icpc',
        participation_mode || 'NORMAL',
        participation_type || 'INDIVIDUAL',
        start_time,
        end_time,
        duration || '02:00',
        registration_end_time || null,
        parseInt(min_rating) || 1000,
        parseInt(max_rating) || 5000,
        rules_url || '',
        max_attempts_per_problem ? parseInt(max_attempts_per_problem) : null,
        4, // Qat'iy 4 ballik jarima
        hide_problem_authors ? 1 : 0,
        hide_problem_authors ? 1 : 0,
        hide_results ? 1 : 0,
        hide_submissions ? 1 : 0,
        open_standings ? 1 : 0,
        open_registration !== undefined ? (open_registration ? 1 : 0) : 1,
        show_problems_after_contest !== undefined ? (show_problems_after_contest ? 1 : 0) : 1,
        allow_virtual_participation ? 1 : 0,
        allow_virtual_participation ? 1 : 0,
        targetGradesVal
    );

    const newId = Number(ins.lastInsertRowid);
    res.json({ success: true, id: newId, message: 'Olimpiada muvaffaqiyatli yaratildi' });
});

// Update Contest
router.put('/contests/:id', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    const {
        title, type, default_language, allowed_programming_languages, description, editorial,
        rules, participation_mode, participation_type, start_time, end_time, duration,
        registration_end_time, min_rating, max_rating, rules_url, max_attempts_per_problem,
        penalty_per_wrong_attempt, hide_problem_authors, hide_results, hide_submissions,
        open_standings, open_registration, show_problems_after_contest, allow_virtual_participation,
        target_grades
    } = req.body;

    if (!title || title.trim().length < 5) {
        return res.status(400).json({ error: 'Olimpiada nomi kamida 5 ta belgidan iborat bo‘lishi shart' });
    }

    const targetGradesVal = Array.isArray(target_grades) 
        ? JSON.stringify(target_grades) 
        : (typeof target_grades === 'string' ? target_grades : '[]');

    db.prepare(`
        UPDATE contests
        SET title = ?, type = ?, contest_mode = ?, default_language = ?, allowed_programming_languages = ?,
            description = ?, editorial = ?, rules = ?, participation_mode = ?, participation_type = ?,
            start_time = ?, end_time = ?, duration = ?, registration_end_time = ?, min_rating = ?, max_rating = ?,
            rules_url = ?, max_attempts_per_problem = ?, penalty_per_wrong_attempt = 4, hide_problem_authors = ?,
            hide_authors = ?, hide_results = ?, hide_submissions = ?, open_standings = ?, open_registration = ?,
            show_problems_after_contest = ?, allow_virtual_participation = ?, virtual_allowed = ?, target_grades = ?
        WHERE id = ?
    `).run(
        title.trim(),
        type || 'PUBLIC',
        (type || 'PUBLIC').toLowerCase(),
        default_language || 'uz',
        JSON.stringify(allowed_programming_languages || ['python3', 'pypy', 'cpp17', 'java']),
        description || '',
        editorial || '',
        rules || 'ICPC_CUSTOM',
        participation_mode || 'NORMAL',
        participation_type || 'INDIVIDUAL',
        start_time,
        end_time,
        duration || '02:00',
        registration_end_time || null,
        parseInt(min_rating) || 1000,
        parseInt(max_rating) || 5000,
        rules_url || '',
        max_attempts_per_problem ? parseInt(max_attempts_per_problem) : null,
        hide_problem_authors ? 1 : 0,
        hide_problem_authors ? 1 : 0,
        hide_results ? 1 : 0,
        hide_submissions ? 1 : 0,
        open_standings ? 1 : 0,
        open_registration !== undefined ? (open_registration ? 1 : 0) : 1,
        show_problems_after_contest !== undefined ? (show_problems_after_contest ? 1 : 0) : 1,
        allow_virtual_participation ? 1 : 0,
        allow_virtual_participation ? 1 : 0,
        targetGradesVal,
        req.params.id
    );

    contestsEngine.broadcastContestUpdate(req.params.id);
    res.json({ success: true, message: 'Olimpiada sozlamalari saqlandi' });
});

router.delete('/contests/:id', (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) return res.status(403).json({ error: 'Ruxsat berilmadi' });

    db.prepare('DELETE FROM contests WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Olimpiada o‘chirildi' });
});

// Download all contest problems as single PDF (Requirement 2)
router.get('/contests/:id/download-pdf', (req, res) => {
    const contest = db.prepare('SELECT * FROM contests WHERE id = ?').get(req.params.id);
    if (!contest) return res.status(404).json({ error: 'Olimpiada topilmadi' });

    const now = new Date().getTime();
    const startTime = new Date(contest.start_time).getTime();
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'judge');

    if (now < startTime && !isAdmin) {
        return res.status(403).json({ error: 'Musobaqa hali boshlanmadi!' });
    }

    const problems = db.prepare(`
        SELECT cp.letter, cp.score as contest_score, p.*
        FROM contest_problems cp
        JOIN problems p ON cp.problem_id = p.id
        WHERE cp.contest_id = ?
        ORDER BY cp.problem_order ASC
    `).all(contest.id);

    for (const p of problems) {
        p.samples = db.prepare(`
            SELECT test_index, input_data, output_data 
            FROM testcases 
            WHERE problem_id = ? AND is_sample = 1 
            ORDER BY test_index ASC
        `).all(p.id);
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contest_${contest.id}_problems.pdf"`);
    doc.pipe(res);

    // Title Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0f172a').text(sanitizePdfText(contest.title), { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Tizim: ${contest.contest_type.toUpperCase()}  |  Boshlanish: ${new Date(contest.start_time).toLocaleString()}  |  Tugash: ${new Date(contest.end_time).toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.2);
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    if (problems.length === 0) {
        doc.fontSize(12).font('Helvetica').fillColor('#64748b').text('Ushbu olimpiadada hali masalalar biriktirilmagan.', { align: 'center' });
    } else {
        problems.forEach((p, index) => {
            if (index > 0) doc.addPage();

            // Problem Title
            doc.fontSize(16).font('Helvetica-Bold').fillColor('#1d4ed8').text(`Masala ${p.letter}. ${sanitizePdfText(p.title)}`);
            doc.moveDown(0.2);
            doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748b').text(`Vaqt chegarasi: ${p.time_limit} ms   |   Xotira chegarasi: ${p.memory_limit} MB   |   Ball: ${p.contest_score || p.score || 100} ball`);
            doc.moveDown(0.8);

            // Statement
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Masala sharti:');
            doc.moveDown(0.2);
            doc.fontSize(10).font('Helvetica').fillColor('#334155').text(sanitizePdfText(p.statement));
            doc.moveDown(0.8);

            // Input
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Kiruvchi ma\'lumotlar:');
            doc.moveDown(0.2);
            doc.fontSize(10).font('Helvetica').fillColor('#334155').text(sanitizePdfText(p.input_format || '-'));
            doc.moveDown(0.8);

            // Output
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Chiquvchi ma\'lumotlar:');
            doc.moveDown(0.2);
            doc.fontSize(10).font('Helvetica').fillColor('#334155').text(sanitizePdfText(p.output_format || '-'));
            doc.moveDown(0.8);

            // Samples
            if (p.samples && p.samples.length > 0) {
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Namunaviy testlar:');
                doc.moveDown(0.4);
                p.samples.forEach(s => {
                    doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text(`Namuna #${s.test_index}:`);
                    doc.font('Courier').fontSize(9).fillColor('#1e293b');
                    doc.text('Kirish:');
                    doc.text(sanitizePdfText((s.input_data || '').trim()));
                    doc.text('Chiqish:');
                    doc.text(sanitizePdfText((s.output_data || '').trim()));
                    doc.moveDown(0.4);
                });
            }

            // Note
            if (p.note && p.note.trim()) {
                doc.moveDown(0.4);
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#b45309').text('Izoh:');
                doc.moveDown(0.2);
                doc.fontSize(10).font('Helvetica').fillColor('#334155').text(sanitizePdfText(p.note));
            }
        });
    }

    doc.end();
});

// Users leaderboard
router.get('/users', (req, res) => {
    const users = db.prepare(`
        SELECT id, username, full_name, school, grade, rating, contest_rating, karma, last_visit, solved_count, created_at 
        FROM users 
        WHERE role != 'admin'
        ORDER BY rating DESC, solved_count DESC 
        LIMIT 100
    `).all();

    res.json(users);
});

const VERDICTS_LIST = [
    {
        code: 'AC',
        name: 'Accepted',
        fullNameUz: 'Qabul qilindi',
        badgeClass: 'badge-ac',
        color: '#10b981',
        description: 'Yechim barcha testlardan to‘g‘ri o‘tdi va belgilangan vaqt hamda xotira chegaralariga to‘liq mos keldi. Masala uchun to‘liq ball berildi.',
        causes: ['Barcha test holatlari to‘liq va aniq qanoatlantirilgan.']
    },
    {
        code: 'MLE',
        name: 'Memory Limit Exceeded',
        fullNameUz: 'Xotira chegarasidan oshib ketish',
        badgeClass: 'badge-mle',
        color: '#8b5cf6',
        description: 'Dastur masalada belgilangan maksimal operativ xotira (RAM) miqdoridan (masalan, 64 MB, 128 MB yoki 256 MB) ko‘proq xotira egallashga uringanda yuzaga keladi. Odatda haddan tashqari ulkan massivlar yaratish, to‘xtovsiz dinamik xotira ajratish yoki cheksiz rekursiya oqibatida sodir bo‘ladi.',
        causes: [
            'Haddan tashqari ulkan massivlar yoki kolleksiyalar yaratish (masalan, 10^7 dan katta massivlar);',
            'To‘xtovsiz dinamik xotira ajratish (xotira sizib chiqishi / Memory Leak);',
            'Cheksiz yoki haddan tashqari chuqur rekursiya oqibatida stekning to‘lib ketishi.'
        ]
    },
    {
        code: 'PE',
        name: 'Presentation Error',
        fullNameUz: 'Formatlash / Ko‘rinish xatoligi',
        badgeClass: 'badge-pe',
        color: '#f59e0b',
        description: 'Yechim mantiqan to‘g‘ri javob chiqargan, biroq javob formati masala talabiga mos kelmaganda yuzaga keladi. Masalan: so‘zlar orasida yoki qator oxirida ortiqcha bo‘shliqlar (probellar), keraksiz bo‘sh qatorlar (\\n) yoki katta-kichik harflar (registr) farqi mavjud bo‘lganda beriladi.',
        causes: [
            'So‘zlar yoki sonlar orasida, yoki qator oxirida ortiqcha bo‘shliqlar (probellar, tabulyatsiya);',
            'Chiqish oxirida yoki orasida keraksiz qo‘shimcha bo‘sh qatorlar (\\n);',
            'Katta-kichik harflar (registr) farqi mavjud bo‘lganda (masalan, "YES" o‘rniga "yes").'
        ]
    },
    {
        code: 'WA',
        name: 'Wrong Answer',
        fullNameUz: 'Noto‘g‘ri javob',
        badgeClass: 'badge-wa',
        color: '#ef4444',
        description: 'Kamida bitta testda dastur chiqargan natija masala hakamining kutilgan javobi bilan mazmunan mos kelmadi.',
        causes: [
            'Algoritmik xatolik yoki chekka holatlar (edge cases) inobatga olinmaganligi;',
            'Butun sonlarning to‘lib ketishi (Integer Overflow - 32-bit o‘rniga 64-bit int ishlatilmaganligi);',
            'Masala shartini to‘liq tushunmasdan yechish.'
        ]
    },
    {
        code: 'TLE',
        name: 'Time Limit Exceeded',
        fullNameUz: 'Vaqt chegarasidan oshib ketish',
        badgeClass: 'badge-tle',
        color: '#f59e0b',
        description: 'Dasturning ishlash vaqti masala uchun belgilangan vaqt chegarasidan (masalan, 1000 ms yoki 2000 ms) oshib ketdi.',
        causes: [
            'Nooptimal asimptotik murakkablik (masalan, O(N^2) o‘rniga O(N log N) talab qilinganda);',
            'Cheksiz tsikl (Infinite loop);',
            'Sekin kirish/chiqish oqimlari (Fast I/O ishlatilmaganligi).'
        ]
    },
    {
        code: 'RE',
        name: 'Runtime Error',
        fullNameUz: 'Dastur bajarilishidagi xatolik',
        badgeClass: 'badge-re',
        color: '#f43f5e',
        description: 'Kod muvaffaqiyatli kompilyatsiya bo‘lgan, biroq test jarayonida dasturning o‘zida kutilmagan favqulodda to‘xtash yuz berganda beriladi. Odatda nolga bo‘lish, mavjud bo‘lmagan massiv indeksiga murojaat qilish (Index out of range), ruxsat etilmagan xotira manzili (Segmentation fault) yoki stekning to‘lib ketishi sababli sodir bo‘ladi.',
        causes: [
            'Nolga bo‘lish (Division by zero);',
            'Mavjud bo‘lmagan massiv indeksiga murojaat qilish (Index out of range / Segmentation fault);',
            'Bo‘sh ko‘rsatkichga murojaat (Null pointer dereference) yoki ruxsat etilmagan xotira manzili.'
        ]
    },
    {
        code: 'CE',
        name: 'Compilation Error',
        fullNameUz: 'Kompilyatsiya xatosi',
        badgeClass: 'badge-ce',
        color: '#94a3b8',
        description: 'Dastur kodini kompilyatsiya qilishda sintaktik yoki semantik xatolik yuz berdi.',
        causes: [
            'Sintaktik xatolar, qavslar yoki nuqta-vergul qolib ketishi;',
            'Noto‘g‘ri kutubxona nomi yoki mavjud bo‘lmagan funksiyalarni chaqirish;',
            'Tillar versiyalari (C++17, Java 21, Python 3) mos kelmasligi.'
        ]
    }
];

// Get verdicts list (JSON configuration)
router.get('/verdicts', (req, res) => {
    res.json(VERDICTS_LIST);
});

// Update user theme preference
router.patch('/users/theme', requireAuth, (req, res) => {
    const { theme } = req.body;
    const validThemes = ['light', 'dark', 'system'];
    if (!validThemes.includes(theme)) {
        return res.status(400).json({ error: "Yaroqsiz rejim tanlandi. Ruxsat etilganlar: 'light', 'dark', 'system'" });
    }
    try {
        db.prepare('UPDATE users SET theme = ? WHERE id = ?').run(theme, req.user.id);
        req.user.theme = theme;
        res.json({ success: true, theme });
    } catch (err) {
        res.status(500).json({ error: 'Rejimni saqlashda xatolik: ' + err.message });
    }
});

// ─── CONTEST EDITORIAL ENDPOINTS ──────────────────────────────────────────

// GET /api/contests/:id/editorial
router.get(['/contests/:id/editorial', '/olympiads/:id/editorial'], (req, res) => {
    const contestId = req.params.id;
    let contest = db.prepare('SELECT * FROM contests WHERE id = ?').get(contestId);
    if (!contest) {
        contest = db.prepare('SELECT * FROM contests WHERE title = ?').get(contestId);
    }
    if (!contest) return res.status(404).json({ error: 'Olimpiada topilmadi' });

    const now = Date.now();
    const endTime = contestsEngine.parseSubDate(contest.end_time);
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    const isJudge = isStaff || (req.user && !!db.prepare('SELECT id FROM contest_judges WHERE contest_id = ? AND user_id = ?').get(contest.id, req.user.id));
    
    // Status condition: ended/finished
    const isEnded = (now > endTime) || (contest.is_active === 0);
    // Setting condition: editorial_enabled (must be enabled by admin)
    const editorialEnabled = (contest.editorial_enabled === 1 || contest.editorial_published === 1);

    // Strict student visibility rule: ONLY IF enabled == true AND status == Ended
    const canPublicView = Boolean(editorialEnabled && isEnded);

    if (!isJudge && !canPublicView) {
        let errorMsg = 'Tahlillar mavjud emas yoki yopiq';
        if (!isEnded) {
            errorMsg = 'Musobaqa davom etmoqda. Tahlillar faqat musobaqa to‘liq yakunlangach (Status: Ended) taqdim etiladi.';
        } else if (!editorialEnabled) {
            errorMsg = 'Ushbu musobaqa uchun tahlillar ma‘muriyat tomonidan o‘quvchilarga ko‘rsatilmaydigan qilib sozlangan.';
        }
        return res.status(403).json({
            error: errorMsg,
            locked: true,
            is_ended: isEnded,
            editorial_enabled: editorialEnabled,
            start_time: contest.start_time,
            end_time: contest.end_time
        });
    }

    // Retrieve all contest problems and their editorial data
    const problems = db.prepare(`
        SELECT cp.letter, cp.score, cp.problem_order,
               p.id as problem_id, p.code, p.title, p.difficulty, p.time_limit, p.memory_limit,
               ce.id as editorial_id, ce.explanation, ce.code_cpp, ce.code_python, ce.code_java, ce.is_published, ce.updated_at
        FROM contest_problems cp
        JOIN problems p ON cp.problem_id = p.id
        LEFT JOIN contest_editorials ce ON ce.contest_id = cp.contest_id AND ce.problem_id = cp.problem_id
        WHERE cp.contest_id = ?
        ORDER BY cp.problem_order ASC, cp.letter ASC
    `).all(contest.id);

    // Get samples for problems so editorial can display them nicely
    for (const prob of problems) {
        const samples = db.prepare(`
            SELECT test_index, input_data, output_data 
            FROM testcases 
            WHERE problem_id = ? AND is_sample = 1 
            ORDER BY test_index ASC
        `).all(prob.problem_id);
        prob.samples = samples;
    }

    res.json({
        contest: {
            id: contest.id,
            title: contest.title,
            start_time: contest.start_time,
            end_time: contest.end_time,
            is_active: contest.is_active,
            editorial_enabled: editorialEnabled ? 1 : 0,
            editorial_published: editorialEnabled ? 1 : 0,
            is_finished: isEnded,
            is_ended: isEnded
        },
        problems,
        is_staff: Boolean(isJudge),
        is_ended: Boolean(isEnded),
        editorial_enabled: Boolean(editorialEnabled)
    });
});

// PUT /api/contests/:id/editorial/:problemId (Admin / Judge only)
router.put(['/contests/:id/editorial/:problemId', '/olympiads/:id/editorial/:problemId'], requireAuth, (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) {
        return res.status(403).json({ error: 'Ushbu amal faqat administrator yoki hakamlar uchun ruxsat etilgan' });
    }

    const contestId = req.params.id;
    const problemId = req.params.problemId;
    let contest = db.prepare('SELECT id FROM contests WHERE id = ? OR title = ?').get(contestId, contestId);
    if (!contest) return res.status(404).json({ error: 'Olimpiada topilmadi' });

    const { explanation, code_cpp, code_python, code_java, is_published } = req.body;

    try {
        db.prepare(`
            INSERT INTO contest_editorials (
                contest_id, problem_id, explanation, code_cpp, code_python, code_java, is_published, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(contest_id, problem_id) DO UPDATE SET
                explanation = excluded.explanation,
                code_cpp = excluded.code_cpp,
                code_python = excluded.code_python,
                code_java = excluded.code_java,
                is_published = excluded.is_published,
                updated_at = CURRENT_TIMESTAMP
        `).run(
            contest.id,
            problemId,
            explanation !== undefined ? String(explanation) : '',
            code_cpp !== undefined ? String(code_cpp) : '',
            code_python !== undefined ? String(code_python) : '',
            code_java !== undefined ? String(code_java) : '',
            is_published !== undefined ? (is_published ? 1 : 0) : 1
        );

        res.json({ success: true, message: 'Tahlil muvaffaqiyatli saqlandi' });
    } catch (err) {
        res.status(500).json({ error: 'Tahlilni saqlashda xatolik: ' + err.message });
    }
});

// DELETE /api/contests/:id/editorial/:problemId (Admin / Judge only)
router.delete(['/contests/:id/editorial/:problemId', '/olympiads/:id/editorial/:problemId'], requireAuth, (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) {
        return res.status(403).json({ error: 'Ushbu amal faqat administrator yoki hakamlar uchun ruxsat etilgan' });
    }

    const contestId = req.params.id;
    const problemId = req.params.problemId;
    let contest = db.prepare('SELECT id FROM contests WHERE id = ? OR title = ?').get(contestId, contestId);
    if (!contest) return res.status(404).json({ error: 'Olimpiada topilmadi' });

    try {
        db.prepare('DELETE FROM contest_editorials WHERE contest_id = ? AND problem_id = ?').run(contest.id, problemId);
        res.json({ success: true, message: 'Masala tahlili muvaffaqiyatli o‘chirildi' });
    } catch (err) {
        res.status(500).json({ error: 'O‘chirishda xatolik: ' + err.message });
    }
});

// POST /api/contests/:id/editorial/visibility & toggle-publish (Admin / Judge only)
router.post(['/contests/:id/editorial/visibility', '/contests/:id/editorial/toggle-publish', '/olympiads/:id/editorial/visibility', '/olympiads/:id/editorial/toggle-publish'], requireAuth, (req, res) => {
    const isStaff = req.user && ['admin', 'judge'].includes(String(req.user.role).toLowerCase());
    if (!isStaff) {
        return res.status(403).json({ error: 'Faqat administrator uchun ruxsat etilgan' });
    }

    const contestId = req.params.id;
    let contest = db.prepare('SELECT id, editorial_enabled, editorial_published FROM contests WHERE id = ? OR title = ?').get(contestId, contestId);
    if (!contest) return res.status(404).json({ error: 'Olimpiada topilmadi' });

    let newStatus;
    if (req.body && req.body.enabled !== undefined) {
        newStatus = req.body.enabled ? 1 : 0;
    } else {
        const cur = (contest.editorial_enabled === 1 || contest.editorial_published === 1) ? 1 : 0;
        newStatus = cur === 1 ? 0 : 1;
    }

    db.prepare('UPDATE contests SET editorial_enabled = ?, editorial_published = ? WHERE id = ?').run(newStatus, newStatus, contest.id);

    const msg = newStatus === 1
        ? "Editorial ko'rsatish yoqildi (musobaqa tugagach o'quvchilarga ko'rinadi)"
        : "Editorial ko'rinmasin deb sozlandi (o'quvchilarga ko'rinmaydi)";

    res.json({
        success: true,
        editorial_enabled: newStatus,
        editorial_published: newStatus,
        message: msg
    });
});

module.exports = router;

