const db = require('./db');
const contestsEngine = require('./contests');

/**
 * Normalizes code for similarity comparison (strips comments and whitespace).
 */
function normalizeCode(rawCode) {
    if (!rawCode) return '';
    return String(rawCode)
        .replace(/\/\*[\s\S]*?\*\//g, '') // multi-line comments
        .replace(/\/\/.*/g, '')           // single-line comments
        .replace(/#.*/g, '')             // python comments
        .replace(/\s+/g, '')             // all whitespace
        .toLowerCase();
}

/**
 * Computes Levenshtein/N-gram similarity percentage (0 - 100).
 */
function calculateSimilarity(code1, code2) {
    const s1 = normalizeCode(code1);
    const s2 = normalizeCode(code2);

    if (!s1 || !s2) return 0;
    if (s1 === s2) return 100;

    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 100;

    // Use 3-gram dice coefficient for fast and accurate similarity
    const n = 3;
    if (s1.length < n || s2.length < n) {
        let same = 0;
        const minLen = Math.min(s1.length, s2.length);
        for (let i = 0; i < minLen; i++) {
            if (s1[i] === s2[i]) same++;
        }
        return Math.round((same / maxLen) * 100);
    }

    const ngrams1 = new Map();
    for (let i = 0; i <= s1.length - n; i++) {
        const gram = s1.substring(i, i + n);
        ngrams1.set(gram, (ngrams1.get(gram) || 0) + 1);
    }

    let intersection = 0;
    for (let i = 0; i <= s2.length - n; i++) {
        const gram = s2.substring(i, i + n);
        const count = ngrams1.get(gram) || 0;
        if (count > 0) {
            intersection++;
            ngrams1.set(gram, count - 1);
        }
    }

    const totalGrams = (s1.length - n + 1) + (s2.length - n + 1);
    const dice = (2 * intersection) / totalGrams;
    return Math.round(dice * 100);
}

/**
 * Runs anti-cheat scan for a contest.
 */
function runAntiCheatScan(contestId, options = {}) {
    const {
        problem_ids = [],
        min_code_length = 200,
        similarity_threshold = 75,
        auto_disqualify = false,
        clear_previous = false
    } = options;

    if (clear_previous) {
        db.prepare('DELETE FROM contest_plagiarism WHERE contest_id = ?').run(contestId);
    }

    let problemFilter = '';
    const params = [contestId];
    if (Array.isArray(problem_ids) && problem_ids.length > 0) {
        const placeholders = problem_ids.map(() => '?').join(',');
        problemFilter = ` AND s.problem_id IN (${placeholders})`;
        params.push(...problem_ids);
    }

    // Get all Accepted and candidate submissions
    const submissions = db.prepare(`
        SELECT s.id, s.user_id, s.problem_id, s.code, s.language, s.status, s.score,
               u.username, u.full_name
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        WHERE s.contest_id = ? ${problemFilter}
        ORDER BY s.problem_id ASC, s.id ASC
    `).all(...params);

    const matches = [];

    // Group submissions by problem
    const probGroups = {};
    for (const sub of submissions) {
        if (!probGroups[sub.problem_id]) probGroups[sub.problem_id] = [];
        probGroups[sub.problem_id].push(sub);
    }

    const insertStmt = db.prepare(`
        INSERT INTO contest_plagiarism (
            contest_id, problem_id, submission_id, suspect_user_id,
            similarity_percentage, code_snippet, admin_note, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const [probId, subs] of Object.entries(probGroups)) {
        for (let i = 0; i < subs.length; i++) {
            const subA = subs[i];
            if ((subA.code || '').length < min_code_length) continue;

            for (let j = i + 1; j < subs.length; j++) {
                const subB = subs[j];
                if (subA.user_id === subB.user_id) continue;
                if ((subB.code || '').length < min_code_length) continue;

                const similarity = calculateSimilarity(subA.code, subB.code);
                if (similarity >= similarity_threshold) {
                    const snippet = `O‘xshashlik: ${similarity}%\nUrinish #${subA.id} (@${subA.username}) va Urinish #${subB.id} (@${subB.username})\n\nKOD KESMASI:\n${(subB.code || '').substring(0, 400)}`;
                    const adminNote = `Anticheat: #${subA.id} (@${subA.username}) bilan ${similarity}% o‘xshash`;

                    // Check if already logged
                    const existing = db.prepare(`
                        SELECT id FROM contest_plagiarism 
                        WHERE contest_id = ? AND submission_id = ?
                    `).get(contestId, subB.id);

                    if (!existing) {
                        insertStmt.run(
                            contestId, probId, subB.id, subB.user_id,
                            similarity, snippet, adminNote,
                            auto_disqualify ? 'CONFIRMED_VIOLATION' : 'PENDING'
                        );
                    }

                    if (auto_disqualify) {
                        disqualifyParticipant(contestId, subB.user_id, adminNote);
                    }

                    matches.push({
                        problem_id: probId,
                        submission_a: subA.id,
                        user_a: subA.username,
                        submission_b: subB.id,
                        user_b: subB.username,
                        similarity
                    });
                }
            }
        }
    }

    contestsEngine.broadcastContestUpdate(contestId);

    return {
        total_scanned: submissions.length,
        matches_found: matches.length,
        matches
    };
}

/**
 * Disqualifies a participant in a contest.
 */
function disqualifyParticipant(contestId, userId, reason) {
    db.prepare(`
        UPDATE contest_participants 
        SET is_disqualified = 1, disqualification_reason = ?
        WHERE contest_id = ? AND user_id = ?
    `).run(reason || "Chetlatilgan: Qoidabuzarlik aniqlandi", contestId, userId);

    contestsEngine.broadcastContestUpdate(contestId);
}

/**
 * Pardons a participant and recalculates standings.
 */
function pardonParticipant(contestId, userId) {
    db.prepare(`
        UPDATE contest_participants 
        SET is_disqualified = 0, disqualification_reason = NULL
        WHERE contest_id = ? AND user_id = ?
    `).run(contestId, userId);

    db.prepare(`
        UPDATE contest_plagiarism 
        SET status = 'PARDONED'
        WHERE contest_id = ? AND suspect_user_id = ?
    `).run(contestId, userId);

    contestsEngine.broadcastContestUpdate(contestId);
}

module.exports = {
    normalizeCode,
    calculateSimilarity,
    runAntiCheatScan,
    disqualifyParticipant,
    pardonParticipant
};
