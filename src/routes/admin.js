const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AdmZip = require('adm-zip');
const vm = require('vm');
const db = require('../db');
const { requireAdmin, hashPassword } = require('../auth');
const judgeRunner = require('../judge/runner');
const contestsEngine = require('../contests');
const { processExcelImport } = require('../excel');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// All routes require Admin
router.use(requireAdmin);

// Admin dashboard statistics
router.get('/overview', (req, res) => {
    const usersCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const problemsCount = db.prepare('SELECT COUNT(*) as c FROM problems').get().c;
    const submissionsCount = db.prepare('SELECT COUNT(*) as c FROM submissions').get().c;
    const contestsCount = db.prepare('SELECT COUNT(*) as c FROM contests').get().c;

    const recentSubmissions = db.prepare(`
        SELECT s.id, s.language, s.status, s.score, s.created_at, u.username, p.title as problem_title
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        JOIN problems p ON s.problem_id = p.id
        ORDER BY s.id DESC LIMIT 10
    `).all();

    res.json({
        usersCount,
        problemsCount,
        submissionsCount,
        contestsCount,
        recentSubmissions
    });
});

// ─── PROBLEMS MANAGEMENT ─────────────────────────────────────────────────────

router.get('/problems', (req, res) => {
    const problems = db.prepare(`
        SELECT p.*, (SELECT COUNT(*) FROM testcases WHERE problem_id = p.id) as testcases_count 
        FROM problems p 
        ORDER BY p.id DESC
    `).all();
    res.json(problems);
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

// Search problems by title or code (for modal attachment)
router.get('/problems/search', (req, res) => {
    const rawQuery = req.query.q || req.query.search || req.query.query || '';
    const q = String(rawQuery).trim().toLowerCase();

    try {
        let problems;
        if (!q) {
            problems = db.prepare(`
                SELECT p.id, p.code, p.title, p.difficulty, p.category, p.author_name,
                       p.time_limit, p.memory_limit, p.score, p.visibility, p.is_secret
                FROM problems p
                WHERE p.is_active = 1
                ORDER BY p.id DESC
                LIMIT 30
            `).all();
        } else {
            const pattern = `%${q}%`;
            problems = db.prepare(`
                SELECT p.id, p.code, p.title, p.difficulty, p.category, p.author_name,
                       p.time_limit, p.memory_limit, p.score, p.visibility, p.is_secret
                FROM problems p
                WHERE p.is_active = 1 AND (LOWER(p.title) LIKE ? OR LOWER(p.code) LIKE ?)
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

router.get('/problems/:id', (req, res) => {
    const problem = db.prepare(`
        SELECT p.*, (SELECT COUNT(*) FROM testcases WHERE problem_id = p.id) as testcases_count 
        FROM problems p 
        WHERE p.id = ?
    `).get(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Masala topilmadi' });
    const samples = db.prepare('SELECT * FROM testcases WHERE problem_id = ? AND is_sample = 1 ORDER BY test_index ASC').all(req.params.id);
    res.json({ ...problem, samples });
});

function syncSubtasks(problemId, subtasksArray, isSub) {
    if (!problemId) return;
    const baseDir = path.join(__dirname, '..', '..', 'problems', String(problemId));
    if (!fs.existsSync(baseDir)) {
        try { fs.mkdirSync(baseDir, { recursive: true }); } catch (_) {}
    }

    if (!isSub) {
        const testsDir = path.join(baseDir, 'tests');
        if (!fs.existsSync(testsDir)) {
            try { fs.mkdirSync(testsDir, { recursive: true }); } catch (_) {}
        }
        return;
    }

    const subtasksDir = path.join(baseDir, 'subtasks');
    if (!fs.existsSync(subtasksDir)) {
        try { fs.mkdirSync(subtasksDir, { recursive: true }); } catch (_) {}
    }

    let list = Array.isArray(subtasksArray) ? subtasksArray : [];
    if (list.length === 0) {
        list = [{ subtask_index: 1, group: 1, score: 50, has_testcases: 0, tests_count: 0, zip_name: '' }];
    }

    const existing = db.prepare('SELECT * FROM subtasks WHERE problem_id = ?').all(problemId);
    const existingMap = {};
    existing.forEach(e => { existingMap[e.subtask_index] = e; });

    const testcaseCounts = db.prepare('SELECT subtask_group, COUNT(*) as cnt, MAX(zip_name) as zip_name FROM testcases WHERE problem_id = ? GROUP BY subtask_group').all(problemId);
    const testcaseMap = {};
    testcaseCounts.forEach(t => { testcaseMap[t.subtask_group] = t; });

    db.prepare('DELETE FROM subtasks WHERE problem_id = ?').run(problemId);
    const insSub = db.prepare(`
        INSERT INTO subtasks (problem_id, subtask_index, score, tests_path, has_testcases, tests_count, zip_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const configToSave = [];

    list.forEach((st, idx) => {
        const order = parseInt(st.subtask_index || st.group || (idx + 1)) || (idx + 1);
        const score = parseInt(st.score !== undefined ? st.score : (st.points !== undefined ? st.points : 50)) || 50;
        const subtaskFolder = path.join(subtasksDir, `subtask_${order}`);
        if (!fs.existsSync(subtaskFolder)) {
            try { fs.mkdirSync(subtaskFolder, { recursive: true }); } catch (_) {}
        }

        const prev = existingMap[order] || {};
        const tc = testcaseMap[order];
        const tcCount = (tc && tc.cnt > 0) ? tc.cnt : (st.tests_count || prev.tests_count || 0);
        const hasTests = (tcCount > 0 || st.has_testcases) ? 1 : (prev.has_testcases ? 1 : 0);
        const zipName = st.zip_name || (tc && tc.zip_name) || prev.zip_name || '';
        const testsPath = `problems/${problemId}/subtasks/subtask_${order}`;

        insSub.run(problemId, order, score, testsPath, hasTests, tcCount, zipName);

        configToSave.push({
            group: order,
            subtask_index: order,
            score: score,
            points: score,
            tests_path: testsPath,
            has_testcases: hasTests,
            tests_count: tcCount,
            zip_name: zipName
        });
    });

    db.prepare('UPDATE problems SET subtasks_config = ?, is_subtask = 1, has_subtasks = 1 WHERE id = ?').run(JSON.stringify(configToSave), problemId);
}

router.post('/problems', (req, res) => {
    const { 
        code, title, statement, input_format, output_format, note, 
        time_limit, memory_limit, difficulty, score, checker_type,
        category, is_secret, is_archived, author_name,
        checker_comparator, checker_lang, checker_code,
        validator_lang, validator_code, validator_mode, has_subtasks, is_subtask,
        is_public, visibility, subtasks
    } = req.body;

    if (!code || !title || !statement) {
        return res.status(400).json({ error: 'Kod, nom va shart to‘ldirilishi shart' });
    }

    const isSecretVal = (is_secret === 1 || is_secret === true) ? 1 : 0;
    let isPub = is_public !== undefined ? (is_public ? 1 : 0) : (visibility === 'public' ? 1 : 0);
    if (isSecretVal === 1 || visibility === 'private') {
        isPub = 0;
    }
    const visStr = isPub === 1 ? 'public' : 'private';
    const isSub = is_subtask !== undefined ? (is_subtask ? 1 : 0) : (has_subtasks ? 1 : 0);

    try {
        const ins = db.prepare(`
            INSERT INTO problems (
                code, title, statement, input_format, output_format, note, 
                time_limit, memory_limit, difficulty, score, checker_type,
                category, is_secret, is_archived, author_name,
                checker_comparator, checker_lang, checker_code,
                validator_lang, validator_code, validator_mode, has_subtasks, is_subtask,
                is_public, visibility
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            code.trim(),
            title.trim(),
            statement,
            input_format || '',
            output_format || '',
            note || '',
            parseInt(time_limit) || 1000,
            parseInt(memory_limit) || 256,
            difficulty || 'Oson',
            parseInt(score) || 100,
            checker_type || 'default',
            category || 'Boshlang‘ich',
            is_secret ? 1 : 0,
            is_archived ? 1 : 0,
            author_name || req.user.full_name || 'Hakam',
            checker_comparator || 'default',
            checker_lang || 'cpp',
            checker_code || '',
            validator_lang || 'cpp',
            validator_code || '',
            validator_mode ? 1 : 0,
            isSub,
            isSub,
            isPub,
            visStr
        );

        const newId = Number(ins.lastInsertRowid);

        if (Array.isArray(req.body.sample_tests)) {
            let sIdx = 1;
            const insSample = db.prepare('INSERT INTO testcases (problem_id, test_index, input_data, output_data, is_sample, points, subtask_group) VALUES (?, ?, ?, ?, 1, 0, 0)');
            for (const st of req.body.sample_tests) {
                if (st && (st.input_data !== undefined || st.output_data !== undefined)) {
                    insSample.run(newId, sIdx++, st.input_data || '', st.output_data || '');
                }
            }
        }

        syncSubtasks(newId, subtasks, isSub);

        res.json({ success: true, id: newId, code: code.trim() });
    } catch (err) {
        res.status(400).json({ error: 'Xatolik: Kod unikal bo‘lishi kerak (' + err.message + ')' });
    }
});

router.put('/problems/:id', (req, res) => {
    const { 
        code, title, statement, input_format, output_format, note, 
        time_limit, memory_limit, difficulty, score, checker_type, is_active,
        category, is_secret, is_archived, author_name,
        checker_comparator, checker_lang, checker_code,
        validator_lang, validator_code, validator_mode, has_subtasks, is_subtask,
        is_public, visibility, sample_tests, subtasks
    } = req.body;

    const isSecretVal = (is_secret === 1 || is_secret === true) ? 1 : 0;
    let isPub = is_public !== undefined ? (is_public ? 1 : 0) : (visibility === 'public' ? 1 : 0);
    if (isSecretVal === 1 || visibility === 'private') {
        isPub = 0;
    }
    const visStr = isPub === 1 ? 'public' : 'private';
    const isSub = is_subtask !== undefined ? (is_subtask ? 1 : 0) : (has_subtasks ? 1 : 0);

    if (code) {
        try {
            db.prepare('UPDATE problems SET code = ? WHERE id = ?').run(code.trim(), req.params.id);
        } catch (_) {}
    }

    db.prepare(`
        UPDATE problems 
        SET title = ?, statement = ?, input_format = ?, output_format = ?, note = ?, 
            time_limit = ?, memory_limit = ?, difficulty = ?, score = ?, checker_type = ?, is_active = ?,
            category = ?, is_secret = ?, is_archived = ?, author_name = ?,
            checker_comparator = ?, checker_lang = ?, checker_code = ?,
            validator_lang = ?, validator_code = ?, validator_mode = ?, has_subtasks = ?, is_subtask = ?,
            is_public = ?, visibility = ?
        WHERE id = ?
    `).run(
        title, statement, input_format, output_format, note,
        parseInt(time_limit) || 1000, parseInt(memory_limit) || 256, difficulty || 'Oson', parseInt(score) || 100,
        checker_type || 'default', is_active !== undefined ? is_active : 1,
        category || 'Boshlang‘ich', is_secret ? 1 : 0, is_archived ? 1 : 0, author_name || 'Hakam',
        checker_comparator || 'default', checker_lang || 'cpp', checker_code || '',
        validator_lang || 'cpp', validator_code || '', validator_mode ? 1 : 0, isSub, isSub,
        isPub, visStr,
        req.params.id
    );

    if (Array.isArray(sample_tests)) {
        db.prepare('DELETE FROM testcases WHERE problem_id = ? AND is_sample = 1').run(req.params.id);
        let sIdx = 1;
        const insSample = db.prepare('INSERT INTO testcases (problem_id, test_index, input_data, output_data, is_sample, points, subtask_group) VALUES (?, ?, ?, ?, 1, 0, 0)');
        for (const st of sample_tests) {
            if (st && (st.input_data !== undefined || st.output_data !== undefined)) {
                insSample.run(req.params.id, sIdx++, st.input_data || '', st.output_data || '');
            }
        }
    }

    syncSubtasks(req.params.id, subtasks, isSub);

    res.json({ success: true, code: code ? code.trim() : undefined });
});

router.delete('/problems/:id', (req, res) => {
    db.prepare('DELETE FROM problems WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Testcases for problem
router.get('/problems/:id/testcases', (req, res) => {
    const tests = db.prepare('SELECT * FROM testcases WHERE problem_id = ? ORDER BY test_index ASC').all(req.params.id);
    res.json(tests);
});

router.post('/problems/:id/testcases', (req, res) => {
    const { input_data, output_data, is_sample, points, subtask_group } = req.body;
    const maxIdx = db.prepare('SELECT MAX(test_index) as m FROM testcases WHERE problem_id = ?').get(req.params.id).m || 0;

    db.prepare(`
        INSERT INTO testcases (problem_id, test_index, input_data, output_data, is_sample, points, subtask_group)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, maxIdx + 1, input_data || '', output_data || '', is_sample ? 1 : 0, parseInt(points) || 10, parseInt(subtask_group) || 1);

    res.json({ success: true });
});

router.delete('/testcases/:id', (req, res) => {
    db.prepare('DELETE FROM testcases WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

router.delete('/problems/:id/testcases/clear', (req, res) => {
    db.prepare('DELETE FROM testcases WHERE problem_id = ?').run(req.params.id);
    res.json({ success: true, message: 'Barcha testlar tozalandi' });
});

router.get('/problems/:id/download-tests', (req, res) => {
    const tests = db.prepare('SELECT * FROM testcases WHERE problem_id = ? ORDER BY test_index ASC').all(req.params.id);
    const zip = new AdmZip();

    tests.forEach((t) => {
        const num = String(t.test_index).padStart(3, '0');
        zip.addFile(`${num}.in`, Buffer.from(t.input_data || '', 'utf-8'));
        zip.addFile(`${num}.out`, Buffer.from(t.output_data || '', 'utf-8'));
    });

    const zipBuffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="testcases_problem_${req.params.id}.zip"`);
    res.send(zipBuffer);
});

// ZIP Upload for Testcases (ICPC Format)
router.post('/problems/:id/upload-zip', upload.single('zip_file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'ZIP fayl yuklanmadi' });
    }

    try {
        const problemId = req.params.id;
        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();

        // Collect inputs and outputs
        const inputs = {};
        const outputs = {};

        for (const entry of zipEntries) {
            if (entry.isDirectory) continue;
            const name = entry.entryName.replace(/^.*[\\\/]/, ''); // basename
            const inMatch = name.match(/^(\d+|\w+)\.(in|dat|input)$/i);
            const outMatch = name.match(/^(\d+|\w+)\.(out|ans|output)$/i);

            if (inMatch) {
                inputs[inMatch[1]] = entry.getData().toString('utf-8');
            } else if (outMatch) {
                outputs[outMatch[1]] = entry.getData().toString('utf-8');
            }
        }

        const keys = Object.keys(inputs).sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
        });

        // Ensure directories on disk: problems/{id}/tests
        const probDir = path.join(__dirname, '..', '..', 'problems', String(problemId));
        const testsDir = path.join(probDir, 'tests');
        if (!fs.existsSync(testsDir)) {
            fs.mkdirSync(testsDir, { recursive: true });
        }

        // Save original zip
        const zipPath = path.join(probDir, 'testcases.zip');
        fs.writeFileSync(zipPath, req.file.buffer);

        // Delete previous non-sample tests for this problem
        db.prepare('DELETE FROM testcases WHERE problem_id = ? AND is_sample = 0').run(problemId);

        let curMaxIdx = db.prepare('SELECT MAX(test_index) as m FROM testcases WHERE problem_id = ?').get(problemId).m || 0;
        let addedCount = 0;

        for (const k of keys) {
            if (outputs[k] !== undefined) {
                curMaxIdx++;
                db.prepare(`
                    INSERT INTO testcases (problem_id, test_index, input_data, output_data, is_sample, points, subtask_group)
                    VALUES (?, ?, ?, ?, 0, 10, 1)
                `).run(problemId, curMaxIdx, inputs[k], outputs[k]);

                // Write to filesystem
                fs.writeFileSync(path.join(testsDir, `${curMaxIdx}.in`), inputs[k], 'utf-8');
                fs.writeFileSync(path.join(testsDir, `${curMaxIdx}.out`), outputs[k], 'utf-8');
                addedCount++;
            }
        }

        const relZipPath = `problems/${problemId}/testcases.zip`;
        db.prepare('UPDATE problems SET icpc_archive_path = ? WHERE id = ?').run(relZipPath, problemId);

        res.json({
            success: true,
            count: addedCount,
            icpc_archive_path: relZipPath,
            message: `${addedCount} ta test muvaffaqiyatli yuklandi`
        });
    } catch (err) {
        res.status(500).json({ error: 'ZIP faylni o‘qishda xatolik: ' + err.message });
    }
});

// Image Upload for Problem Statement and Description
router.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Rasm fayli tanlanmadi' });
    }
    try {
        const ext = path.extname(req.file.originalname) || '.png';
        const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
        const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const savePath = path.join(uploadsDir, filename);
        fs.writeFileSync(savePath, req.file.buffer);
        res.json({ success: true, url: `/uploads/${filename}` });
    } catch (err) {
        res.status(500).json({ error: 'Rasmni saqlashda xatolik: ' + err.message });
    }
});

// Subtasks Management API
router.get('/problems/:id/subtasks', (req, res) => {
    const prob = db.prepare('SELECT id, code, is_subtask, has_subtasks, subtasks_config, icpc_archive_path FROM problems WHERE id = ?').get(req.params.id);
    if (!prob) return res.status(404).json({ error: 'Masala topilmadi' });

    const isSub = !!(prob.is_subtask || prob.has_subtasks);

    let rows = db.prepare('SELECT * FROM subtasks WHERE problem_id = ? ORDER BY subtask_index ASC').all(req.params.id);

    const counts = db.prepare(`
        SELECT subtask_group, COUNT(*) as count, MAX(zip_name) as zip_name 
        FROM testcases 
        WHERE problem_id = ? 
        GROUP BY subtask_group
    `).all(req.params.id);

    const countMap = {};
    counts.forEach(c => {
        countMap[c.subtask_group] = { count: c.count, zip_name: c.zip_name || '' };
    });

    if (rows.length === 0) {
        let config = [];
        try { config = JSON.parse(prob.subtasks_config || '[]'); } catch (_) {}
        if (Array.isArray(config) && config.length > 0) {
            rows = config.map((c, i) => {
                const idx = parseInt(c.subtask_index || c.group || (i + 1)) || (i + 1);
                const tc = countMap[idx];
                const tcCount = (tc && tc.count > 0) ? tc.count : (c.tests_count || 0);
                return {
                    id: i + 1,
                    problem_id: prob.id,
                    subtask_index: idx,
                    score: c.score !== undefined ? c.score : (c.points || 50),
                    tests_path: c.tests_path || `problems/${prob.id}/subtasks/subtask_${idx}`,
                    has_testcases: tcCount > 0 || c.has_testcases ? 1 : 0,
                    tests_count: tcCount,
                    zip_name: (tc && tc.zip_name) || c.zip_name || ''
                };
            });
        } else {
            rows = [{
                id: 1,
                problem_id: prob.id,
                subtask_index: 1,
                score: 50,
                tests_path: `problems/${prob.id}/subtasks/subtask_1`,
                has_testcases: countMap[1]?.count > 0 ? 1 : 0,
                tests_count: countMap[1]?.count || 0,
                zip_name: countMap[1]?.zip_name || ''
            }];
        }
    }

    const subtasks = rows.map((r, i) => {
        const idx = r.subtask_index || (i + 1);
        const actualCount = countMap[idx]?.count || r.tests_count || 0;
        const actualZip = countMap[idx]?.zip_name || r.zip_name || '';
        const hasTests = actualCount > 0 ? 1 : (r.has_testcases ? 1 : 0);
        return {
            id: r.id || (i + 1),
            problem_id: prob.id,
            subtask_index: idx,
            group: idx,
            score: r.score !== undefined ? r.score : 50,
            points: r.score !== undefined ? r.score : 50,
            tests_path: r.tests_path || `problems/${prob.id}/subtasks/subtask_${idx}`,
            has_testcases: hasTests,
            tests_count: actualCount,
            zip_name: actualZip
        };
    });

    res.json({
        is_subtask: isSub ? 1 : 0,
        has_subtasks: isSub ? 1 : 0,
        icpc_archive_path: prob.icpc_archive_path || '',
        subtasks
    });
});

router.post('/problems/:id/subtasks/config', (req, res) => {
    const { has_subtasks, is_subtask, subtasks } = req.body;
    const isSub = (is_subtask !== undefined) ? (is_subtask ? 1 : 0) : (has_subtasks ? 1 : 0);
    syncSubtasks(req.params.id, subtasks, isSub);
    db.prepare('UPDATE problems SET has_subtasks = ?, is_subtask = ? WHERE id = ?')
        .run(isSub, isSub, req.params.id);
    res.json({ success: true });
});

router.post('/problems/:id/subtasks/:group/upload-zip', upload.single('zip_file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'ZIP fayl yuklanmadi' });
    }

    try {
        const problemId = req.params.id;
        const group = parseInt(req.params.group) || 1;
        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();

        const inputs = {};
        const outputs = {};

        for (const entry of zipEntries) {
            if (entry.isDirectory) continue;
            const name = entry.entryName.replace(/^.*[\\\/]/, '');
            const inMatch = name.match(/^(\d+|\w+)\.(in|dat|input)$/i);
            const outMatch = name.match(/^(\d+|\w+)\.(out|ans|output)$/i);

            if (inMatch) inputs[inMatch[1]] = entry.getData().toString('utf-8');
            else if (outMatch) outputs[outMatch[1]] = entry.getData().toString('utf-8');
        }

        const keys = Object.keys(inputs).sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
        });

        // Ensure subtask directory: problems/{id}/subtasks/subtask_{group}
        const probDir = path.join(__dirname, '..', '..', 'problems', String(problemId));
        const subtaskDir = path.join(probDir, 'subtasks', `subtask_${group}`);
        if (!fs.existsSync(subtaskDir)) {
            fs.mkdirSync(subtaskDir, { recursive: true });
        }

        // Delete existing tests for this subtask group from DB and directory
        db.prepare('DELETE FROM testcases WHERE problem_id = ? AND subtask_group = ?').run(problemId, group);
        try {
            const files = fs.readdirSync(subtaskDir);
            for (const f of files) fs.unlinkSync(path.join(subtaskDir, f));
        } catch (_) {}

        let curMaxIdx = db.prepare('SELECT MAX(test_index) as m FROM testcases WHERE problem_id = ?').get(problemId).m || 0;
        let addedCount = 0;
        const zipFileName = req.file.originalname || `subtask_${group}.zip`;

        for (const k of keys) {
            if (outputs[k] !== undefined) {
                curMaxIdx++;
                db.prepare(`
                    INSERT INTO testcases (problem_id, test_index, input_data, output_data, is_sample, points, subtask_group, zip_name)
                    VALUES (?, ?, ?, ?, 0, 10, ?, ?)
                `).run(problemId, curMaxIdx, inputs[k], outputs[k], group, zipFileName);

                fs.writeFileSync(path.join(subtaskDir, `${addedCount + 1}.in`), inputs[k], 'utf-8');
                fs.writeFileSync(path.join(subtaskDir, `${addedCount + 1}.out`), outputs[k], 'utf-8');
                addedCount++;
            }
        }

        const testsPath = `problems/${problemId}/subtasks/subtask_${group}`;

        // Upsert into subtasks table
        const existingRow = db.prepare('SELECT id FROM subtasks WHERE problem_id = ? AND subtask_index = ?').get(problemId, group);
        if (existingRow) {
            db.prepare(`
                UPDATE subtasks 
                SET has_testcases = 1, tests_count = ?, zip_name = ?, tests_path = ?
                WHERE id = ?
            `).run(addedCount, zipFileName, testsPath, existingRow.id);
        } else {
            db.prepare(`
                INSERT INTO subtasks (problem_id, subtask_index, score, tests_path, has_testcases, tests_count, zip_name)
                VALUES (?, ?, 50, ?, 1, ?, ?)
            `).run(problemId, group, testsPath, addedCount, zipFileName);
        }

        // Update problems.subtasks_config
        const allSubtasks = db.prepare('SELECT * FROM subtasks WHERE problem_id = ? ORDER BY subtask_index ASC').all(problemId);
        db.prepare('UPDATE problems SET subtasks_config = ?, is_subtask = 1, has_subtasks = 1 WHERE id = ?').run(JSON.stringify(allSubtasks), problemId);

        res.json({
            success: true,
            count: addedCount,
            zip_name: zipFileName,
            message: `Subtask #${group} uchun ${addedCount} ta test yuklandi`
        });
    } catch (err) {
        res.status(500).json({ error: 'ZIP faylni o‘qishda xatolik: ' + err.message });
    }
});

router.get('/problems/:id/subtasks/:group/download-zip', (req, res) => {
    const group = parseInt(req.params.group) || 1;
    const tests = db.prepare('SELECT * FROM testcases WHERE problem_id = ? AND subtask_group = ? ORDER BY test_index ASC')
        .all(req.params.id, group);

    const zip = new AdmZip();
    tests.forEach((t, i) => {
        const num = String(i + 1).padStart(3, '0');
        zip.addFile(`${num}.in`, Buffer.from(t.input_data || '', 'utf-8'));
        zip.addFile(`${num}.out`, Buffer.from(t.output_data || '', 'utf-8'));
    });

    const zipBuffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="subtask_${group}_problem_${req.params.id}.zip"`);
    res.send(zipBuffer);
});

// Delete testcases of a subtask (keeping the subtask card)
router.delete('/problems/:id/subtasks/:group/tests', (req, res) => {
    const problemId = req.params.id;
    const group = parseInt(req.params.group) || 1;

    db.prepare('DELETE FROM testcases WHERE problem_id = ? AND subtask_group = ?').run(problemId, group);

    const subtaskDir = path.join(__dirname, '..', '..', 'problems', String(problemId), 'subtasks', `subtask_${group}`);
    if (fs.existsSync(subtaskDir)) {
        try {
            const files = fs.readdirSync(subtaskDir);
            for (const f of files) fs.unlinkSync(path.join(subtaskDir, f));
        } catch (_) {}
    }

    db.prepare('UPDATE subtasks SET has_testcases = 0, tests_count = 0, zip_name = "" WHERE problem_id = ? AND subtask_index = ?')
        .run(problemId, group);

    const allSubtasks = db.prepare('SELECT * FROM subtasks WHERE problem_id = ? ORDER BY subtask_index ASC').all(problemId);
    db.prepare('UPDATE problems SET subtasks_config = ? WHERE id = ?').run(JSON.stringify(allSubtasks), problemId);

    res.json({ success: true, message: `Subtask #${group} testlari tozalandi` });
});

// Delete subtask card and renumber remaining subtasks
router.delete('/problems/:id/subtasks/:group', (req, res) => {
    const problemId = req.params.id;
    const group = parseInt(req.params.group);

    db.prepare('DELETE FROM testcases WHERE problem_id = ? AND subtask_group = ?').run(problemId, group);

    const subtaskDir = path.join(__dirname, '..', '..', 'problems', String(problemId), 'subtasks', `subtask_${group}`);
    if (fs.existsSync(subtaskDir)) {
        try { fs.rmSync(subtaskDir, { recursive: true, force: true }); } catch (_) {}
    }

    db.prepare('DELETE FROM subtasks WHERE problem_id = ? AND subtask_index = ?').run(problemId, group);

    // Re-index remaining subtasks
    const remaining = db.prepare('SELECT * FROM subtasks WHERE problem_id = ? ORDER BY subtask_index ASC').all(problemId);
    const updateSub = db.prepare('UPDATE subtasks SET subtask_index = ?, tests_path = ? WHERE id = ?');
    const updateTc = db.prepare('UPDATE testcases SET subtask_group = ? WHERE problem_id = ? AND subtask_group = ?');

    remaining.forEach((st, i) => {
        const oldIndex = st.subtask_index;
        const newIndex = i + 1;
        if (oldIndex !== newIndex) {
            updateTc.run(newIndex, problemId, oldIndex);
            const newPath = `problems/${problemId}/subtasks/subtask_${newIndex}`;
            updateSub.run(newIndex, newPath, st.id);
            st.subtask_index = newIndex;
            st.tests_path = newPath;

            // Rename directory if exists
            const oldDir = path.join(__dirname, '..', '..', 'problems', String(problemId), 'subtasks', `subtask_${oldIndex}`);
            const targetDir = path.join(__dirname, '..', '..', 'problems', String(problemId), 'subtasks', `subtask_${newIndex}`);
            if (fs.existsSync(oldDir) && !fs.existsSync(targetDir)) {
                try { fs.renameSync(oldDir, targetDir); } catch (_) {}
            }
        }
    });

    db.prepare('UPDATE problems SET subtasks_config = ? WHERE id = ?').run(JSON.stringify(remaining), problemId);

    res.json({ success: true, message: `Subtask #${group} o‘chirildi` });
});

router.post('/problems/:id/subtasks/:group/use-samples', (req, res) => {
    const group = parseInt(req.params.group);
    const samples = db.prepare('SELECT * FROM testcases WHERE problem_id = ? AND is_sample = 1').all(req.params.id);
    if (samples.length === 0) {
        return res.status(400).json({ error: 'Ushbu masalada namuna testlar topilmadi' });
    }

    db.prepare('DELETE FROM testcases WHERE problem_id = ? AND subtask_group = ?').run(req.params.id, group);
    let curMaxIdx = db.prepare('SELECT MAX(test_index) as m FROM testcases WHERE problem_id = ?').get(req.params.id).m || 0;

    for (const s of samples) {
        curMaxIdx++;
        db.prepare(`
            INSERT INTO testcases (problem_id, test_index, input_data, output_data, is_sample, points, subtask_group, zip_name)
            VALUES (?, ?, ?, ?, 1, 10, ?, 'namunaviy_testlar.zip')
        `).run(req.params.id, curMaxIdx, s.input_data, s.output_data, group);
    }

    res.json({ success: true, count: samples.length, message: `${samples.length} ta namunaviy test Subtask #${group} ga biriktirildi` });
});

// Testcase Generator (JS Sandbox execution)
router.post('/generator/run', (req, res) => {
    const code = req.body.code || req.body.generator_code || '';
    if (!code || !code.trim()) {
        return res.status(400).json({ error: 'Generator JS kodi kiritilmagan' });
    }

    try {
        const wrapped = `(function() {
            let tests = [];
            const __res = (function() {
                ${code}
            })();
            if (Array.isArray(__res)) return __res;
            if (Array.isArray(tests)) return tests;
            return [];
        })()`;

        const sandbox = {
            Math, Number, String, Array, Object, parseInt, parseFloat, JSON,
            randomInt: (min, max) => Math.floor(min + Math.random() * (max - min + 1)),
            randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)],
            randomString: (len, chars = 'abcdefghijklmnopqrstuvwxyz') => {
                let s = '';
                for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
                return s;
            }
        };

        const context = vm.createContext(sandbox);
        const script = new vm.Script(wrapped);
        const result = script.runInContext(context, { timeout: 4000 });

        if (!Array.isArray(result)) {
            return res.status(400).json({ error: 'Generator natijasi massiv (Array) bo‘lishi kerak' });
        }

        const normalized = result.map((t, idx) => {
            if (typeof t === 'string' || typeof t === 'number') {
                return { input: String(t), output: '' };
            }
            return {
                input: t && t.input !== undefined && t.input !== null ? String(t.input) : '',
                output: t && t.output !== undefined && t.output !== null ? String(t.output) : ''
            };
        });

        res.json({ success: true, count: normalized.length, tests: normalized });
    } catch (err) {
        res.status(400).json({ error: 'Generator kodini bajarishda xatolik: ' + err.message });
    }
});

// Download tests as testcases.zip
router.post('/generator/download-zip', (req, res) => {
    const rawTests = req.body.tests;
    if (!Array.isArray(rawTests) || rawTests.length === 0) {
        return res.status(400).json({ error: 'Yuklab olish uchun kamida 1 ta test bo‘lishi kerak' });
    }

    try {
        const zip = new AdmZip();
        rawTests.forEach((t, i) => {
            const pad = String(i + 1).padStart(4, '0');
            const inName = `${pad}.in`;
            const outName = `${pad}.out`;
            const inVal = t && t.input !== undefined && t.input !== null ? String(t.input) : '';
            const outVal = t && t.output !== undefined && t.output !== null ? String(t.output) : '';
            zip.addFile(inName, Buffer.from(inVal, 'utf8'));
            zip.addFile(outName, Buffer.from(outVal, 'utf8'));
        });

        const buffer = zip.toBuffer();
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="testcases.zip"',
            'Content-Length': buffer.length
        });
        return res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: 'ZIP arxiv yaratishda xatolik: ' + err.message });
    }
});

// Testcase Generator (JS logic execution - legacy)
router.post('/generate-tests', (req, res) => {
    const { problem_id, count, generator_code, solution_code } = req.body;

    if (!problem_id || !generator_code) {
        return res.status(400).json({ error: 'Masala va generator kodini kiriting' });
    }

    const testCount = Math.min(parseInt(count) || 5, 50); // limit to 50
    const generated = [];

    try {
        const sandbox = {
            randomInt: (min, max) => Math.floor(min + Math.random() * (max - min + 1)),
            randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)],
            randomString: (len, chars = 'abcdefghijklmnopqrstuvwxyz') => {
                let s = '';
                for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
                return s;
            }
        };

        const script = new vm.Script(`
            function generateOne(testIndex) {
                ${generator_code}
            }
        `);

        const context = vm.createContext(sandbox);
        script.runInContext(context);

        let curMaxIdx = db.prepare('SELECT MAX(test_index) as m FROM testcases WHERE problem_id = ?').get(problem_id).m || 0;

        for (let i = 0; i < testCount; i++) {
            const inputVal = String(context.generateOne(i + 1) || '').trim();
            if (!inputVal) continue;

            // Save test with placeholder output or user can update
            curMaxIdx++;
            db.prepare(`
                INSERT INTO testcases (problem_id, test_index, input_data, output_data, is_sample, points)
                VALUES (?, ?, ?, ?, 0, 10)
            `).run(problem_id, curMaxIdx, inputVal + '\n', 'GENERATED_OUTPUT_PENDING\n');

            generated.push({ index: curMaxIdx, input: inputVal });
        }

        res.json({ success: true, count: generated.length, tests: generated });
    } catch (err) {
        res.status(400).json({ error: 'Generator ishga tushirishda xatolik: ' + err.message });
    }
});

// ─── CONTESTS MANAGEMENT ─────────────────────────────────────────────────────

router.get('/contests', (req, res) => {
    const contests = db.prepare(`
        SELECT c.*, 
               (SELECT COUNT(*) FROM contest_problems WHERE contest_id = c.id) as problems_count,
               (SELECT COUNT(*) FROM contest_participants WHERE contest_id = c.id) as participants_count
        FROM contests c 
        ORDER BY c.id DESC
    `).all();
    res.json(contests);
});

router.post('/contests', (req, res) => {
    const { 
        title, description, start_time, end_time, contest_type, freeze_minutes,
        contest_mode, allowed_languages, rating_limit, submissions_limit,
        hide_authors, hide_submissions, open_registration, virtual_allowed,
        target_grades
    } = req.body;

    if (!title || !start_time || !end_time) {
        return res.status(400).json({ error: 'Sarlavha, boshlanish va tugash vaqti shart' });
    }

    const sMs = contestsEngine.parseSubDate(start_time);
    const eMs = contestsEngine.parseSubDate(end_time);
    if (sMs > 0 && eMs > 0 && eMs <= sMs) {
        return res.status(400).json({ error: 'Tugash vaqti boshlanish vaqtidan keyin bo‘lishi shart' });
    }

    const gradesJson = Array.isArray(target_grades) ? JSON.stringify(target_grades) : (typeof target_grades === 'string' ? target_grades : '[]');

    const ins = db.prepare(`
        INSERT INTO contests (
            title, description, start_time, end_time, contest_type, freeze_minutes,
            contest_mode, allowed_languages, rating_limit, submissions_limit,
            hide_authors, hide_submissions, open_registration, virtual_allowed,
            target_grades
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        title.trim(), description || '', start_time, end_time, contest_type || 'icpc', parseInt(freeze_minutes) || 60,
        contest_mode || 'public', JSON.stringify(allowed_languages || ['cpp', 'java', 'python']),
        parseInt(rating_limit) || 0, parseInt(submissions_limit) || 0,
        hide_authors ? 1 : 0, hide_submissions ? 1 : 0, open_registration !== undefined ? (open_registration ? 1 : 0) : 1,
        virtual_allowed ? 1 : 0, gradesJson
    );

    res.json({ success: true, id: Number(ins.lastInsertRowid) });
});

router.put('/contests/:id', (req, res) => {
    const { 
        title, description, start_time, end_time, contest_type, freeze_minutes,
        contest_mode, allowed_languages, rating_limit, submissions_limit,
        hide_authors, hide_submissions, open_registration, virtual_allowed, is_active,
        target_grades
    } = req.body;

    if (!title || !start_time || !end_time) {
        return res.status(400).json({ error: 'Sarlavha, boshlanish va tugash vaqti shart' });
    }

    const sMs = contestsEngine.parseSubDate(start_time);
    const eMs = contestsEngine.parseSubDate(end_time);
    if (sMs > 0 && eMs > 0 && eMs <= sMs) {
        return res.status(400).json({ error: 'Tugash vaqti boshlanish vaqtidan keyin bo‘lishi shart' });
    }

    const gradesJson = Array.isArray(target_grades) ? JSON.stringify(target_grades) : (typeof target_grades === 'string' ? target_grades : '[]');

    db.prepare(`
        UPDATE contests 
        SET title = ?, description = ?, start_time = ?, end_time = ?, contest_type = ?, freeze_minutes = ?,
            contest_mode = ?, allowed_languages = ?, rating_limit = ?, submissions_limit = ?,
            hide_authors = ?, hide_submissions = ?, open_registration = ?, virtual_allowed = ?, is_active = ?,
            target_grades = ?
        WHERE id = ?
    `).run(
        title, description, start_time, end_time, contest_type || 'icpc', parseInt(freeze_minutes) || 60,
        contest_mode || 'public', JSON.stringify(allowed_languages || ['cpp', 'java', 'python']),
        parseInt(rating_limit) || 0, parseInt(submissions_limit) || 0,
        hide_authors ? 1 : 0, hide_submissions ? 1 : 0, open_registration ? 1 : 0,
        virtual_allowed ? 1 : 0, is_active !== undefined ? (is_active ? 1 : 0) : 1,
        gradesJson,
        req.params.id
    );
    res.json({ success: true });
});

router.delete('/contests/:id', (req, res) => {
    db.prepare('DELETE FROM contests WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

router.get('/contests/:id/problems', (req, res) => {
    const contestId = req.params.id;
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
    `).all(contestId);

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
        res.json({ success: true, letter, order_num: count, score: scoreVal });
    } catch (err) {
        res.status(400).json({ error: 'Ushbu masala allaqachon biriktirilgan yoki xatolik yuz berdi' });
    }
});

function handleAdminContestProblemsReorder(req, res) {
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
        res.json({ success: true, count: items.length });
    } catch (err) {
        res.status(500).json({ error: 'Tartibni saqlashda xatolik: ' + err.message });
    }
}

router.put('/contests/:id/problems/reorder', handleAdminContestProblemsReorder);
router.post('/contests/:id/problems/reorder', handleAdminContestProblemsReorder);

router.delete('/contests/:id/problems/:probId', (req, res) => {
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

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Masalani o‘chirishda xatolik: ' + err.message });
    }
});

// Contest Participants
router.get('/contests/:id/participants', (req, res) => {
    const parts = db.prepare(`
        SELECT cp.*, u.username, u.full_name, u.school, u.grade, u.rating
        FROM contest_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.contest_id = ?
        ORDER BY cp.registered_at DESC
    `).all(req.params.id);
    res.json(parts);
});

router.post('/contests/:id/participants', (req, res) => {
    const { username } = req.body;
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username?.trim());
    if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    try {
        db.prepare(`
            INSERT INTO contest_participants (contest_id, user_id, is_official, is_registered, status) 
            VALUES (?, ?, 1, 1, 'REGISTERED')
            ON CONFLICT(contest_id, user_id) DO UPDATE SET 
                is_registered = 1, 
                status = 'REGISTERED', 
                is_disqualified = 0
        `).run(req.params.id, user.id);
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ error: 'Foydalanuvchi allaqachon ro‘yxatda' });
    }
});

router.delete('/contests/:id/participants/:userId', (req, res) => {
    db.prepare('DELETE FROM contest_participants WHERE contest_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
    res.json({ success: true });
});

// Contest Judges
router.get('/contests/:id/judges', (req, res) => {
    const contest = db.prepare('SELECT judges FROM contests WHERE id = ?').get(req.params.id);
    let judges = [];
    try { judges = JSON.parse(contest.judges || '[]'); } catch (_) {}
    res.json(judges);
});

router.post('/contests/:id/judges', (req, res) => {
    const { username, role } = req.body;
    const user = db.prepare('SELECT id, username, full_name FROM users WHERE username = ?').get(username?.trim());
    if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    const contest = db.prepare('SELECT judges FROM contests WHERE id = ?').get(req.params.id);
    let judges = [];
    try { judges = JSON.parse(contest.judges || '[]'); } catch (_) {}

    if (!judges.some(j => j.username === user.username)) {
        judges.push({ username: user.username, full_name: user.full_name, role: role || 'judge' });
        db.prepare('UPDATE contests SET judges = ? WHERE id = ?').run(JSON.stringify(judges), req.params.id);
    }
    res.json({ success: true, judges });
});

router.delete('/contests/:id/judges/:username', (req, res) => {
    const contest = db.prepare('SELECT judges FROM contests WHERE id = ?').get(req.params.id);
    let judges = [];
    try { judges = JSON.parse(contest.judges || '[]'); } catch (_) {}
    judges = judges.filter(j => j.username !== req.params.username);
    db.prepare('UPDATE contests SET judges = ? WHERE id = ?').run(JSON.stringify(judges), req.params.id);
    res.json({ success: true, judges });
});

// Plagiarism Check (Chiterlikka tekshirish)
router.get('/contests/:id/plagiarism-check', (req, res) => {
    const subs = db.prepare(`
        SELECT s.id, s.user_id, s.problem_id, s.code, s.language, s.status, s.score, u.username, u.full_name
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        WHERE s.contest_id = ? AND s.status = 'Accepted'
        ORDER BY s.problem_id ASC, s.id ASC
    `).all(req.params.id);

    const matches = [];

    // Compare pairs within same problem
    for (let i = 0; i < subs.length; i++) {
        for (let j = i + 1; j < subs.length; j++) {
            if (subs[i].problem_id !== subs[j].problem_id) continue;
            if (subs[i].user_id === subs[j].user_id) continue;

            const c1 = (subs[i].code || '').replace(/\s+/g, '');
            const c2 = (subs[j].code || '').replace(/\s+/g, '');

            let similarity = 0;
            if (c1 === c2 && c1.length > 20) {
                similarity = 100;
            } else if (c1.length > 30 && c2.length > 30) {
                const minLen = Math.min(c1.length, c2.length);
                let sameCount = 0;
                for (let k = 0; k < minLen; k++) {
                    if (c1[k] === c2[k]) sameCount++;
                }
                similarity = Math.round((sameCount / Math.max(c1.length, c2.length)) * 100);
            }

            if (similarity >= 80) {
                matches.push({
                    submission1: subs[i],
                    submission2: subs[j],
                    similarity
                });
            }
        }
    }

    res.json({ totalChecked: subs.length, matches });
});

// ─── USERS & EXCEL IMPORT ────────────────────────────────────────────────────

router.get('/users', (req, res) => {
    const users = db.prepare('SELECT id, username, plain_password, full_name, school, grade, role, rating, solved_count, created_at FROM users ORDER BY id DESC').all();
    res.json(users);
});

router.post('/users', (req, res) => {
    const { username, password, full_name, role, school, grade } = req.body;
    if (!username || !password || !full_name) {
        return res.status(400).json({ error: 'Barcha maydonlar to‘ldirilishi shart' });
    }

    try {
        db.prepare(`
            INSERT INTO users (username, password_hash, plain_password, full_name, role, school, grade, rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1200)
        `).run(username.trim(), hashPassword(password), password, full_name.trim(), role || 'user', school || 'Aniqlanmagan', grade || '');
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: 'Bunday login allaqachon mavjud' });
    }
});

router.put('/users/:id', (req, res) => {
    const { username, password, full_name, school, grade, role } = req.body;
    const userId = parseInt(req.params.id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    if (!username || !full_name) {
        return res.status(400).json({ error: 'Login va F.I.SH maydonlari to‘ldirilishi shart' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username.trim(), userId);
    if (existing) {
        return res.status(400).json({ error: 'Ushbu login boshqa foydalanuvchi tomonidan band qilingan' });
    }

    let newHash = user.password_hash;
    let newPlain = user.plain_password;
    if (password && password.trim().length > 0) {
        newHash = hashPassword(password.trim());
        newPlain = password.trim();
    }

    try {
        db.prepare(`
            UPDATE users 
            SET username = ?, password_hash = ?, plain_password = ?, full_name = ?, school = ?, grade = ?, role = ?
            WHERE id = ?
        `).run(username.trim(), newHash, newPlain, full_name.trim(), school || 'Aniqlanmagan', grade || '', role || user.role, userId);

        res.json({ success: true, message: 'Foydalanuvchi ma‘lumotlari muvaffaqiyatli yangilandi' });
    } catch (err) {
        res.status(500).json({ error: 'Saqlashda xatolik: ' + err.message });
    }
});

router.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);

    if (req.user && req.user.id === userId) {
        return res.status(400).json({ error: 'Siz joriy admin hisobingizni o‘chira olmaysiz' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    try {
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM submissions WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM contest_participants WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);

        res.json({ success: true, message: 'Foydalanuvchi muvaffaqiyatli o‘chirildi' });
    } catch (err) {
        res.status(500).json({ error: 'O‘chirishda xatolik: ' + err.message });
    }
});

router.get('/users/download-template', (req, res) => {
    const { generateExcelTemplate } = require('../excel');
    const buffer = generateExcelTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="oquvchilar_shablon.xlsx"');
    res.send(buffer);
});

router.post('/users/import-excel-json', upload.single('excel_file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Excel (.xlsx) fayl yuklanmadi' });
    }

    try {
        const importRes = processExcelImport(req.file.buffer);
        res.json({
            success: true,
            count: importRes.count,
            users: importRes.users
        });
    } catch (err) {
        res.status(400).json({ error: 'Excel importida xatolik: ' + err.message });
    }
});

router.post('/users/import-excel', upload.single('excel_file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Excel (.xlsx) fayl yuklanmadi' });
    }

    try {
        const importRes = processExcelImport(req.file.buffer);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="talabalar_login_parol.xlsx"');
        res.send(importRes.excelBuffer);
    } catch (err) {
        res.status(400).json({ error: 'Excel importida xatolik: ' + err.message });
    }
});

router.get('/users/export-excel', (req, res) => {
    const { exportUsersListToExcel } = require('../excel');
    const users = db.prepare('SELECT * FROM users ORDER BY id DESC').all();
    const buffer = exportUsersListToExcel(users);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="barcha_foydalanuvchilar.xlsx"');
    res.send(buffer);
});

// ─── REJUDGE SERVICES ────────────────────────────────────────────────────────

router.post('/rejudge/submission/:id', (req, res) => {
    judgeRunner.rejudgeSubmission(req.params.id);
    res.json({ success: true, message: 'Qayta tekshiruvga yuborildi' });
});

router.post('/rejudge/problem/:id', (req, res) => {
    judgeRunner.rejudgeProblem(req.params.id);
    res.json({ success: true, message: 'Masalaning barcha urinishlari qayta tekshiruvga yuborildi' });
});

router.post('/rejudge/contest/:id', (req, res) => {
    judgeRunner.rejudgeContest(req.params.id);
    res.json({ success: true, message: 'Musobaqaning barcha urinishlari qayta tekshiruvga yuborildi' });
});

router.post('/rejudge/all', (req, res) => {
    judgeRunner.rejudgeAll();
    res.json({ success: true, message: 'Tizimdagi barcha urinishlar qayta tekshiruvga yuborildi' });
});

module.exports = router;
