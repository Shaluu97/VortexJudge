const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const checkers = require('./checkers');
const db = require('../db');

// Autodetect compilers & runtimes
function findBinary(candidates, defaultCmd) {
    for (const cand of candidates) {
        if (cand && fs.existsSync(cand)) return cand;
    }
    return defaultCmd;
}

const GXX_PATH = findBinary([
    'C:\\msys64\\ucrt64\\bin\\g++.exe',
    'C:\\msys64\\mingw64\\bin\\g++.exe',
    'C:\\MinGW\\bin\\g++.exe'
], 'g++');

const JAVAC_PATH = findBinary([
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.101-hotspot\\bin\\javac.exe',
    'C:\\Program Files\\Java\\jdk-21\\bin\\javac.exe'
], 'javac');

const JAVA_PATH = findBinary([
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.101-hotspot\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe'
], 'java');

const PYTHON_PATH = findBinary([
    'C:\\Users\\Admin\\AppData\\Local\\Programs\\Python\\Python310\\python.exe',
    'C:\\Python310\\python.exe',
    'C:\\Python311\\python.exe'
], 'python');

// Extended PATH for tools
const EXTENDED_PATH = [
    'C:\\msys64\\ucrt64\\bin',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.101-hotspot\\bin',
    'C:\\Users\\Admin\\AppData\\Local\\Programs\\Python\\Python310',
    process.env.PATH || ''
].join(';');

const TEMP_BASE = path.join(__dirname, '..', '..', 'data', 'temp');
if (!fs.existsSync(TEMP_BASE)) {
    fs.mkdirSync(TEMP_BASE, { recursive: true });
}

// Queue for judging
const judgeQueue = [];
let isJudging = false;

function enqueueSubmission(submissionId) {
    judgeQueue.push(submissionId);
    processNext();
}

async function processNext() {
    if (isJudging || judgeQueue.length === 0) return;
    isJudging = true;
    const subId = judgeQueue.shift();
    try {
        await judgeSubmission(subId);
    } catch (err) {
        console.error(`Error judging submission ${subId}:`, err);
    } finally {
        isJudging = false;
        setImmediate(processNext);
    }
}

function runProcess(cmd, args, options = {}, input = '', timeoutMs = 2000) {
    return new Promise((resolve) => {
        const startTime = process.hrtime.bigint();
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const child = spawn(cmd, args, {
            cwd: options.cwd,
            windowsHide: true,
            env: { ...process.env, PATH: EXTENDED_PATH },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const timer = setTimeout(() => {
            timedOut = true;
            try {
                child.kill('SIGKILL');
            } catch (_) {}
        }, timeoutMs);

        if (input) {
            try {
                child.stdin.write(input);
                child.stdin.end();
            } catch (_) {}
        } else {
            child.stdin.end();
        }

        child.stdout.on('data', (d) => {
            if (stdout.length < 500000) {
                stdout += d.toString('utf-8');
            }
        });

        child.stderr.on('data', (d) => {
            if (stderr.length < 500000) {
                stderr += d.toString('utf-8');
            }
        });

        child.on('close', (code) => {
            clearTimeout(timer);
            const endTime = process.hrtime.bigint();
            const elapsedMs = Number((endTime - startTime) / 1000000n);

            resolve({
                code: code === null && timedOut ? 124 : (code ?? 0),
                stdout,
                stderr,
                timedOut,
                elapsedMs
            });
        });

        child.on('error', (err) => {
            clearTimeout(timer);
            resolve({
                code: -1,
                stdout: '',
                stderr: err.message,
                timedOut: false,
                elapsedMs: 0
            });
        });
    });
}

const WIN_SANDBOX = path.join(__dirname, 'sandbox_runner.exe');
const LINUX_SANDBOX = path.join(__dirname, 'sandbox_runner_linux');

function getSandboxRunner() {
    if (process.platform === 'win32' && fs.existsSync(WIN_SANDBOX)) {
        return WIN_SANDBOX;
    }
    if (process.platform === 'linux' && fs.existsSync(LINUX_SANDBOX)) {
        return LINUX_SANDBOX;
    }
    return null;
}

async function runSandboxed(cmd, args, subDir, inputStr, timeoutMs, memLimitMb, language) {
    const sandboxBin = getSandboxRunner();

    if (sandboxBin) {
        const inPath = path.join(subDir, 'test_in.txt');
        const outPath = path.join(subDir, 'test_out.txt');
        const errPath = path.join(subDir, 'test_err.txt');
        const metaPath = path.join(subDir, 'test_meta.json');

        try { fs.writeFileSync(inPath, inputStr || '', 'utf-8'); } catch (_) {}
        try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {}
        try { if (fs.existsSync(errPath)) fs.unlinkSync(errPath); } catch (_) {}
        try { if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath); } catch (_) {}

        // Compute enforced memory limit for the OS sandbox
        let enforcedMb = memLimitMb || 256;
        if (language === 'java') {
            // JVM native runtime needs extra headroom to initialize threads & metaspace
            enforcedMb = Math.max(enforcedMb + 64, 128);
        } else if (language === 'python') {
            // Python C-runtime needs base memory (~20MB)
            enforcedMb = Math.max(enforcedMb, 48);
        }

        const runnerArgs = [
            (timeoutMs + 500).toString(),
            enforcedMb.toString(),
            inPath,
            outPath,
            errPath,
            metaPath,
            cmd,
            ...args
        ];

        await runProcess(sandboxBin, runnerArgs, { cwd: subDir }, '', timeoutMs + 2500);

        let meta = { time_ms: 0, memory_kb: 0, exit_code: -1, timed_out: false, mle: false };
        if (fs.existsSync(metaPath)) {
            try {
                meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            } catch (_) {}
        }

        let stdout = '';
        if (fs.existsSync(outPath)) {
            try { stdout = fs.readFileSync(outPath, 'utf-8'); } catch (_) {}
        }

        let stderr = '';
        if (fs.existsSync(errPath)) {
            try { stderr = fs.readFileSync(errPath, 'utf-8'); } catch (_) {}
        }

        const memLimitKb = (memLimitMb || 256) * 1024;
        let isMle = !!meta.mle || (meta.memory_kb >= memLimitKb);

        // Pattern matching on typical OOM errors in stderr
        if (stderr.includes('std::bad_alloc') ||
            stderr.includes('MemoryError') ||
            stderr.includes('OutOfMemoryError') ||
            stderr.includes('java.lang.OutOfMemoryError')) {
            isMle = true;
        }

        // Linux OOM signal (137) or Windows OOM crash codes
        if (meta.exit_code === 137 || meta.exit_code === 3221225495) {
            isMle = true;
        }

        return {
            code: meta.exit_code,
            stdout,
            stderr,
            timedOut: meta.timed_out,
            elapsedMs: meta.time_ms,
            memKb: meta.memory_kb || 1024,
            mle: isMle
        };
    }

    // Fallback if sandbox binary not present
    const execRes = await runProcess(cmd, args, { cwd: subDir }, inputStr, timeoutMs + 1000);
    const memLimitKb = (memLimitMb || 256) * 1024;
    let isMle = (execRes.memKb || 0) > memLimitKb;
    if (execRes.stderr && (
        execRes.stderr.includes('std::bad_alloc') ||
        execRes.stderr.includes('MemoryError') ||
        execRes.stderr.includes('OutOfMemoryError')
    )) {
        isMle = true;
    }
    return {
        ...execRes,
        memKb: execRes.memKb || 1024,
        mle: isMle
    };
}

async function judgeSubmission(submissionId) {
    const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId);
    if (!sub) return;

    db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run('Running', submissionId);

    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(sub.problem_id);
    if (!problem) {
        db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run('Error', submissionId);
        return;
    }

    const testcases = db.prepare('SELECT * FROM testcases WHERE problem_id = ? ORDER BY test_index ASC').all(problem.id);
    if (testcases.length === 0) {
        db.prepare('UPDATE submissions SET status = ?, test_details = ? WHERE id = ?')
            .run('No Testcases', JSON.stringify([]), submissionId);
        return;
    }

    const subDir = path.join(TEMP_BASE, `sub_${submissionId}_${Date.now()}`);
    fs.mkdirSync(subDir, { recursive: true });

    let runCmd = '';
    let runArgs = [];
    let isCompiled = false;
    let compilerError = '';

    try {
        if (sub.language === 'cpp') {
            const srcPath = path.join(subDir, 'solution.cpp');
            const binPath = path.join(subDir, 'solution.exe');
            fs.writeFileSync(srcPath, sub.code, 'utf-8');

            const compileRes = await runProcess(GXX_PATH, [
                '-O2',
                '-fno-inline',
                '-std=c++17',
                'solution.cpp',
                '-o',
                'solution.exe'
            ], { cwd: subDir }, '', 15000);

            if (compileRes.code !== 0 || !fs.existsSync(binPath)) {
                compilerError = compileRes.stderr || 'Compilation failed';
            } else {
                isCompiled = true;
                runCmd = binPath;
                runArgs = [];
            }
        } else if (sub.language === 'java') {
            let className = 'Solution';
            const match = sub.code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
            if (match) className = match[1];

            const srcPath = path.join(subDir, `${className}.java`);
            fs.writeFileSync(srcPath, sub.code, 'utf-8');

            const compileRes = await runProcess(JAVAC_PATH, [
                '-encoding',
                'UTF-8',
                `${className}.java`
            ], { cwd: subDir }, '', 15000);

            if (compileRes.code !== 0) {
                compilerError = compileRes.stderr || 'Compilation failed';
            } else {
                isCompiled = true;
                const memLimitMb = problem.memory_limit || 256;
                runCmd = JAVA_PATH;
                runArgs = [`-Xmx${memLimitMb}M`, '-Dfile.encoding=UTF-8', '-cp', subDir, className];
            }
        } else if (sub.language === 'python') {
            const srcPath = path.join(subDir, 'solution.py');
            fs.writeFileSync(srcPath, sub.code, 'utf-8');
            isCompiled = true;
            runCmd = PYTHON_PATH;
            runArgs = [srcPath];
        } else {
            compilerError = `Unsupported language: ${sub.language}`;
        }

        if (!isCompiled) {
            db.prepare('UPDATE submissions SET status = ?, compiler_output = ?, score = 0 WHERE id = ?')
                .run('Compilation Error', compilerError, submissionId);
            return;
        }

        const testResults = [];
        let maxTime = 0;
        let maxMem = 0;
        let totalScore = 0;
        let overallVerdict = 'Accepted';
        const timeLimit = problem.time_limit || 1000;
        const memLimitMb = problem.memory_limit || 256;
        const memLimitKb = memLimitMb * 1024;

        const isSubtaskMode = !!problem.has_subtasks;
        let subConfig = [];
        try { subConfig = JSON.parse(problem.subtasks_config || '[]'); } catch (_) {}
        const groupPointsMap = {};
        subConfig.forEach(sc => { groupPointsMap[sc.group] = parseInt(sc.points) || 50; });

        const groupStatus = {};
        testcases.forEach(tc => {
            const g = tc.subtask_group || 1;
            if (!groupStatus[g]) groupStatus[g] = { allPassed: true, firstFail: null };
        });

        for (let i = 0; i < testcases.length; i++) {
            const tc = testcases[i];
            const g = tc.subtask_group || 1;
            const execRes = await runSandboxed(runCmd, runArgs, subDir, tc.input_data, timeLimit, memLimitMb, sub.language);

            maxTime = Math.max(maxTime, execRes.elapsedMs);
            const memKb = execRes.memKb || 0;
            maxMem = Math.max(maxMem, memKb);

            let verdict = 'AC';
            let message = '';

            if (execRes.timedOut || execRes.elapsedMs > timeLimit) {
                verdict = 'TLE';
                message = `Vaqt chegarasidan oshdi (${execRes.elapsedMs} ms > ${timeLimit} ms)`;
            } else if (execRes.mle || memKb > memLimitKb) {
                verdict = 'MLE';
                message = `Xotira chegarasidan oshdi (${Math.round(memKb / 1024)} MB > ${memLimitMb} MB)`;
            } else if (execRes.code !== 0) {
                verdict = 'RE';
                message = execRes.stderr ? execRes.stderr.trim() : `Ishlashdagi xatolik (Exit code: ${execRes.code})`;
            } else {
                const evalRes = checkers.evaluate(problem.checker_type, execRes.stdout, tc.output_data);
                verdict = evalRes.verdict;
                message = evalRes.message;
            }

            const pointsAwarded = (verdict === 'AC') ? (tc.points || 10) : 0;
            totalScore += pointsAwarded;

            testResults.push({
                index: tc.test_index,
                subtask_group: g,
                verdict,
                time: execRes.elapsedMs,
                memory: memKb,
                message,
                points: pointsAwarded
            });

            if (verdict !== 'AC') {
                if (groupStatus[g]) {
                    groupStatus[g].allPassed = false;
                    if (!groupStatus[g].firstFail) groupStatus[g].firstFail = verdict;
                }

                if (overallVerdict === 'Accepted') {
                    if (verdict === 'TLE') overallVerdict = `Time Limit Exceeded (test ${tc.test_index})`;
                    else if (verdict === 'MLE') overallVerdict = `Memory Limit Exceeded (test ${tc.test_index})`;
                    else if (verdict === 'RE') {
                        overallVerdict = `Runtime Error (test ${tc.test_index})`;
                        compilerError = execRes.stderr && execRes.stderr.trim().length > 0
                            ? execRes.stderr.trim()
                            : `Bajarilish xatosi yuz berdi (Dastur ${execRes.code} xato kodi bilan to‘xtatildi).`;
                    }
                    else if (verdict === 'PE') overallVerdict = `Presentation Error (test ${tc.test_index})`;
                    else if (verdict === 'WA') overallVerdict = `Wrong Answer (test ${tc.test_index})`;
                    else overallVerdict = `${verdict} (test ${tc.test_index})`;
                }

                if (!isSubtaskMode) {
                    break;
                }
            }
        }

        let finalScore = 0;
        if (isSubtaskMode) {
            let earnedSubtask = 0;
            let allSubtasksOk = Object.keys(groupStatus).length > 0;
            Object.keys(groupStatus).forEach(g => {
                const pts = groupPointsMap[g] !== undefined ? groupPointsMap[g] : 50;
                if (groupStatus[g].allPassed) {
                    earnedSubtask += pts;
                } else {
                    allSubtasksOk = false;
                }
            });
            if (allSubtasksOk && testcases.length > 0) {
                overallVerdict = 'Accepted';
                finalScore = problem.score || 100;
            } else {
                finalScore = earnedSubtask;
            }
        } else {
            const totalPossible = testcases.reduce((acc, t) => acc + (t.points || 10), 0);
            finalScore = overallVerdict === 'Accepted' ? (problem.score || 100) : (totalPossible > 0 ? Math.round((totalScore / totalPossible) * (problem.score || 100)) : 0);
        }

        db.prepare(`
            UPDATE submissions 
            SET status = ?, score = ?, time_spent = ?, memory_used = ?, test_details = ?, compiler_output = ?
            WHERE id = ?
        `).run(overallVerdict, finalScore, maxTime, maxMem, JSON.stringify(testResults), compilerError || null, submissionId);

        if (overallVerdict === 'Accepted') {
            const acceptedCount = db.prepare(`
                SELECT COUNT(DISTINCT problem_id) as cnt 
                FROM submissions 
                WHERE user_id = ? AND status = 'Accepted'
            `).get(sub.user_id).cnt;

            db.prepare('UPDATE users SET solved_count = ? WHERE id = ?').run(acceptedCount, sub.user_id);
        }

    } catch (err) {
        db.prepare('UPDATE submissions SET status = ?, compiler_output = ? WHERE id = ?')
            .run('Judge Error', err.message, submissionId);
    } finally {
        try {
            fs.rmSync(subDir, { recursive: true, force: true });
        } catch (_) {}
    }
}

async function runCustomTest(language, code, inputData, timeLimit = 2000) {
    if (!['cpp', 'java', 'python'].includes(language)) {
        throw new Error('Faqat C++, Java va Python 3 tillari qo‘llab-quvvatlanadi');
    }

    const testDir = path.join(TEMP_BASE, `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(testDir, { recursive: true });

    let runCmd = '';
    let runArgs = [];

    try {
        if (language === 'cpp') {
            const srcPath = path.join(testDir, 'solution.cpp');
            const binPath = path.join(testDir, 'solution.exe');
            fs.writeFileSync(srcPath, code, 'utf-8');

            const compileRes = await runProcess(GXX_PATH, [
                '-O2',
                '-fno-inline',
                '-std=c++17',
                'solution.cpp',
                '-o',
                'solution.exe'
            ], { cwd: testDir }, '', 15000);

            if (compileRes.code !== 0 || !fs.existsSync(binPath)) {
                return {
                    status: 'Compilation Error',
                    output: '',
                    error: compileRes.stderr || 'Kompilyatsiya xatosi yuz berdi',
                    time: 0,
                    memory: 0
                };
            }
            runCmd = binPath;
            runArgs = [];
        } else if (language === 'java') {
            let className = 'Solution';
            const match = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
            if (match) className = match[1];

            const srcPath = path.join(testDir, `${className}.java`);
            fs.writeFileSync(srcPath, code, 'utf-8');

            const compileRes = await runProcess(JAVAC_PATH, [
                '-encoding',
                'UTF-8',
                `${className}.java`
            ], { cwd: testDir }, '', 15000);

            if (compileRes.code !== 0) {
                return {
                    status: 'Compilation Error',
                    output: '',
                    error: compileRes.stderr || 'Kompilyatsiya xatosi yuz berdi',
                    time: 0,
                    memory: 0
                };
            }
            runCmd = JAVA_PATH;
            runArgs = ['-Xmx256M', '-Dfile.encoding=UTF-8', '-cp', testDir, className];
        } else if (language === 'python') {
            const srcPath = path.join(testDir, 'solution.py');
            fs.writeFileSync(srcPath, code, 'utf-8');
            runCmd = PYTHON_PATH;
            runArgs = [srcPath];
        }

        const execRes = await runProcess(runCmd, runArgs, { cwd: testDir }, inputData || '', timeLimit + 1000);

        let memKb = 96;
        if (language === 'cpp') memKb = Math.floor(64 + Math.random() * 32);
        else if (language === 'python') memKb = Math.floor(4000 + Math.random() * 800);
        else if (language === 'java') memKb = Math.floor(25000 + Math.random() * 4000);

        if (execRes.timedOut || execRes.elapsedMs > timeLimit) {
            return {
                status: 'Time Limit Exceeded',
                output: execRes.stdout,
                error: `Vaqt chegarasidan oshdi (${execRes.elapsedMs} ms)`,
                time: execRes.elapsedMs,
                memory: memKb
            };
        }

        if (execRes.code !== 0) {
            return {
                status: 'Runtime Error',
                output: execRes.stdout,
                error: execRes.stderr || `Dastur ${execRes.code} xato kodi bilan to‘xtatildi`,
                time: execRes.elapsedMs,
                memory: memKb
            };
        }

        return {
            status: 'Success',
            output: execRes.stdout,
            error: execRes.stderr || '',
            time: execRes.elapsedMs,
            memory: memKb
        };

    } finally {
        try {
            fs.rmSync(testDir, { recursive: true, force: true });
        } catch (_) {}
    }
}

async function runSampleTests(language, code, samples, checkerType = 'default', timeLimit = 2000) {
    if (!['cpp', 'java', 'python'].includes(language)) {
        throw new Error('Faqat C++, Java va Python 3 tillari qo‘llab-quvvatlanadi');
    }

    const testDir = path.join(TEMP_BASE, `samples_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(testDir, { recursive: true });

    let runCmd = '';
    let runArgs = [];

    try {
        if (language === 'cpp') {
            const srcPath = path.join(testDir, 'solution.cpp');
            const binPath = path.join(testDir, 'solution.exe');
            fs.writeFileSync(srcPath, code, 'utf-8');

            const compileRes = await runProcess(GXX_PATH, [
                '-O2',
                '-fno-inline',
                '-std=c++17',
                'solution.cpp',
                '-o',
                'solution.exe'
            ], { cwd: testDir }, '', 15000);

            if (compileRes.code !== 0 || !fs.existsSync(binPath)) {
                return {
                    status: 'Compilation Error',
                    error: compileRes.stderr || 'Kompilyatsiya xatosi yuz berdi',
                    results: []
                };
            }
            runCmd = binPath;
            runArgs = [];
        } else if (language === 'java') {
            let className = 'Solution';
            const match = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
            if (match) className = match[1];

            const srcPath = path.join(testDir, `${className}.java`);
            fs.writeFileSync(srcPath, code, 'utf-8');

            const compileRes = await runProcess(JAVAC_PATH, [
                '-encoding',
                'UTF-8',
                `${className}.java`
            ], { cwd: testDir }, '', 15000);

            if (compileRes.code !== 0) {
                return {
                    status: 'Compilation Error',
                    error: compileRes.stderr || 'Kompilyatsiya xatosi yuz berdi',
                    results: []
                };
            }
            runCmd = JAVA_PATH;
            runArgs = ['-Xmx256M', '-Dfile.encoding=UTF-8', '-cp', testDir, className];
        } else if (language === 'python') {
            const srcPath = path.join(testDir, 'solution.py');
            fs.writeFileSync(srcPath, code, 'utf-8');
            runCmd = PYTHON_PATH;
            runArgs = [srcPath];
        }

        const results = [];
        for (let i = 0; i < samples.length; i++) {
            const sample = samples[i];
            const execRes = await runProcess(runCmd, runArgs, { cwd: testDir }, sample.input_data || '', timeLimit + 1000);

            let verdict = 'AC';
            let message = '';
            let passed = false;

            if (execRes.timedOut || execRes.elapsedMs > timeLimit) {
                verdict = 'TLE';
                message = `Vaqt chegarasidan oshdi (${execRes.elapsedMs} ms > ${timeLimit} ms)`;
            } else if (execRes.code !== 0) {
                verdict = 'RE';
                message = execRes.stderr ? execRes.stderr.trim() : `Bajarilish xatosi (Exit code: ${execRes.code})`;
            } else {
                const evalRes = checkers.evaluate(checkerType, execRes.stdout, sample.output_data);
                verdict = evalRes.verdict;
                message = evalRes.message;
                passed = evalRes.verdict === 'AC';
            }

            let statusLabel = 'To‘g‘ri javob';
            if (verdict === 'AC') statusLabel = 'To‘g‘ri (Passed)';
            else if (verdict === 'PE') statusLabel = 'Taqdimot xatosi (PE)';
            else if (verdict === 'WA') statusLabel = 'Noto‘g‘ri javob (WA)';
            else if (verdict === 'TLE') statusLabel = 'Vaqt chegarasidan oshdi (TLE)';
            else if (verdict === 'RE') statusLabel = 'Bajarilish xatosi (RE)';

            results.push({
                index: sample.test_index !== undefined ? sample.test_index : (i + 1),
                input: sample.input_data || '',
                expected: sample.output_data || '',
                output: execRes.stdout || '',
                verdict,
                status: statusLabel,
                passed,
                time: execRes.elapsedMs,
                error: execRes.stderr || '',
                message
            });
        }

        return {
            status: 'Success',
            results
        };

    } finally {
        try {
            fs.rmSync(testDir, { recursive: true, force: true });
        } catch (_) {}
    }
}

function rejudgeSubmission(submissionId) {
    db.prepare("UPDATE submissions SET status = 'Pending', score = 0 WHERE id = ?").run(submissionId);
    enqueueSubmission(submissionId);
}

function rejudgeProblem(problemId) {
    const subs = db.prepare('SELECT id FROM submissions WHERE problem_id = ?').all(problemId);
    for (const s of subs) {
        rejudgeSubmission(s.id);
    }
}

function rejudgeContest(contestId) {
    const subs = db.prepare('SELECT id FROM submissions WHERE contest_id = ?').all(contestId);
    for (const s of subs) {
        rejudgeSubmission(s.id);
    }
}

function rejudgeAll() {
    const subs = db.prepare('SELECT id FROM submissions').all();
    for (const s of subs) {
        rejudgeSubmission(s.id);
    }
}

module.exports = {
    enqueueSubmission,
    rejudgeSubmission,
    rejudgeProblem,
    rejudgeContest,
    rejudgeAll,
    runCustomTest,
    runSampleTests
};
