const db = require('./db');
const XLSX = require('xlsx');
const EventEmitter = require('events');

const contestEmitter = new EventEmitter();

function parseSubDate(dt) {
    if (!dt) return 0;
    if (typeof dt === 'number') return dt;
    if (typeof dt === 'string') {
        const trimmed = dt.trim();
        // If it's SQLite CURRENT_TIMESTAMP e.g. "2026-10-22 08:50:00" (space between date and time) -> UTC
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed)) {
            return new Date(trimmed.replace(' ', 'T') + 'Z').getTime();
        }
        // If it already ends with Z or has timezone offset (+HH:MM or -HH:MM)
        if (trimmed.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
            return new Date(trimmed).getTime();
        }
        // If it's datetime-local from HTML input e.g. "2026-10-22T13:50" -> parses as local time
        const parsed = new Date(trimmed).getTime();
        return isNaN(parsed) ? 0 : parsed;
    }
    const parsed = new Date(dt).getTime();
    return isNaN(parsed) ? 0 : parsed;
}

function formatElapsedTime(elapsedSec) {
    const s = Math.max(0, Math.floor(elapsedSec));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Calculates contest standings strictly following the 4-point penalty and first-to-solve rules.
 * @param {number|string} contestId
 * @param {boolean} isUserAdmin
 */
function getContestStandings(contestId, isUserAdmin = false) {
    const contest = db.prepare('SELECT * FROM contests WHERE id = ?').get(contestId);
    if (!contest) return null;

    const rawProblems = db.prepare(`
        SELECT cp.id as item_id, cp.letter, cp.letter_index, cp.score, cp.problem_order,
               p.id, p.title, p.code, p.difficulty
        FROM contest_problems cp
        JOIN problems p ON cp.problem_id = p.id
        WHERE cp.contest_id = ?
        ORDER BY cp.problem_order ASC, cp.id ASC
    `).all(contestId);

    const problems = rawProblems.map((p, idx) => {
        const autoLetter = String.fromCharCode(65 + idx);
        const letter = (p.letter && p.letter.trim().length > 1) ? p.letter.trim() : autoLetter;
        const score = p.score !== undefined && p.score !== null ? Number(p.score) : 10;
        return {
            ...p,
            letter,
            letter_index: letter,
            score
        };
    });

    const problemScoreMap = {};
    for (const p of problems) {
        problemScoreMap[p.id] = p.score;
    }

    const contestStartTime = parseSubDate(contest.start_time);
    const contestEndTime = parseSubDate(contest.end_time);

    // Fetch judges to exclude them from standings
    const judgeRows = db.prepare('SELECT user_id FROM contest_judges WHERE contest_id = ?').all(contestId);
    const judgeUserIds = new Set(judgeRows.map(j => j.user_id));
    if (contest.judges) {
        try {
            const judgesArr = JSON.parse(contest.judges);
            judgesArr.forEach(j => {
                const u = db.prepare('SELECT id FROM users WHERE username = ?').get(j.username);
                if (u) judgeUserIds.add(u.id);
            });
        } catch (_) {}
    }

    // Submissions for this contest within contest time
    const rawSubmissions = db.prepare(`
        SELECT s.id, s.user_id, s.problem_id, s.status, s.score, s.created_at,
               u.username, u.full_name, u.role
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        WHERE s.contest_id = ?
        ORDER BY s.created_at ASC, s.id ASC
    `).all(contestId);

    // Filter out submissions after contest end or from admin/judges
    const validSubmissions = rawSubmissions.filter(s => {
        if (judgeUserIds.has(s.user_id)) return false;
        if (LOWER(s.role) === 'admin' || LOWER(s.role) === 'judge') return false;
        const subTime = parseSubDate(s.created_at);
        return subTime <= contestEndTime;
    });

    // Registered participants
    const registered = db.prepare(`
        SELECT cp.id as participant_id, cp.user_id, cp.is_official, cp.is_disqualified, cp.disqualification_reason,
               u.username, u.full_name, u.school, u.grade, u.rating, u.role
        FROM contest_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.contest_id = ?
        ORDER BY cp.registered_at ASC, u.full_name ASC
    `).all(contestId);

    const participantsMap = new Map();

    for (const r of registered) {
        if (judgeUserIds.has(r.user_id) || LOWER(r.role) === 'admin' || LOWER(r.role) === 'judge') {
            continue; // Exclude judges/admins from scoreboard
        }
        participantsMap.set(r.user_id, {
            user_id: r.user_id,
            username: r.username,
            full_name: r.full_name || r.username,
            school: r.school || 'Aniqlanmagan',
            grade: r.grade || '',
            rating: r.rating || 1200,
            is_official: r.is_official !== 0,
            is_disqualified: !!r.is_disqualified,
            disqualification_reason: r.disqualification_reason || '',
            solved: 0,
            penalty: 0,
            total_score: 0,
            problemStats: {}
        });
    }

    // Also include any user who submitted in this contest but wasn't explicitly in contest_participants
    for (const s of validSubmissions) {
        if (!participantsMap.has(s.user_id)) {
            const u = db.prepare('SELECT id, username, full_name, school, grade, rating, role FROM users WHERE id = ?').get(s.user_id);
            if (u && !judgeUserIds.has(u.id) && LOWER(u.role) !== 'admin' && LOWER(u.role) !== 'judge') {
                participantsMap.set(s.user_id, {
                    user_id: u.id,
                    username: u.username,
                    full_name: u.full_name || u.username,
                    school: u.school || 'Aniqlanmagan',
                    grade: u.grade || '',
                    rating: u.rating || 1200,
                    is_official: true,
                    is_disqualified: false,
                    disqualification_reason: '',
                    solved: 0,
                    penalty: 0,
                    total_score: 0,
                    problemStats: {}
                });
            }
        }
    }

    // Initialize problemStats for all participants
    for (const p of participantsMap.values()) {
        for (const prob of problems) {
            p.problemStats[prob.id] = {
                solved: false,
                attempts: 0,
                failed_attempts: 0,
                time: 0,
                time_formatted: '',
                display: '',
                first_to_solve: false,
                penalty: 0
            };
        }
    }

    // Track First to Solve per problem: { [problem_id]: { user_id, time, sub_id } }
    const firstSolverMap = {};

    // Process submissions in chronological order
    for (const s of validSubmissions) {
        const p = participantsMap.get(s.user_id);
        if (!p) continue;
        if (!problemScoreMap.hasOwnProperty(s.problem_id)) continue;

        const stat = p.problemStats[s.problem_id];
        if (!stat) continue;
        if (stat.solved) {
            // Rule 8: Subsequent submissions after AC do NOT modify the cell or penalty!
            continue;
        }

        const subTime = parseSubDate(s.created_at);
        const elapsedSec = Math.max(0, Math.floor((subTime - contestStartTime) / 1000));
        const minutesFromStart = Math.floor(elapsedSec / 60);

        if (s.status === 'Accepted') {
            stat.solved = true;
            const K = stat.failed_attempts || 0; // counted wrong attempts prior to AC
            stat.attempts = K + 1;
            stat.time = minutesFromStart;
            stat.time_formatted = formatElapsedTime(elapsedSec);

            // Special 4-point penalty rule: Penalty = T + (4 * K)
            const probPenalty = minutesFromStart + (4 * K);
            stat.penalty = probPenalty;

            stat.display = (K === 0) ? '+' : `+${K}`;

            p.solved += 1;
            p.total_score += (problemScoreMap[s.problem_id] || 10);
            p.penalty += probPenalty;

            // Check First to Solve for this problem
            if (!firstSolverMap[s.problem_id]) {
                firstSolverMap[s.problem_id] = { user_id: s.user_id, time: subTime, sub_id: s.id };
            } else if (subTime < firstSolverMap[s.problem_id].time ||
                      (subTime === firstSolverMap[s.problem_id].time && s.id < firstSolverMap[s.problem_id].sub_id)) {
                firstSolverMap[s.problem_id] = { user_id: s.user_id, time: subTime, sub_id: s.id };
            }
        } else if (s.status !== 'Compilation Error') {
            // Any rejected verdict (WA, TLE, MLE, RE, PE) counts as failed attempt
            stat.failed_attempts = (stat.failed_attempts || 0) + 1;
            stat.attempts = stat.failed_attempts;
            stat.display = `-${stat.failed_attempts}`;
        }
    }

    // Mark First to Solve strictly for the earliest solver
    for (const [probId, solver] of Object.entries(firstSolverMap)) {
        const p = participantsMap.get(solver.user_id);
        if (p && p.problemStats[probId] && p.problemStats[probId].solved) {
            p.problemStats[probId].first_to_solve = true;
        }
    }

    // Split active vs disqualified participants
    const allParticipants = Array.from(participantsMap.values());
    
    // Only official participants in public standings; unofficial participants don't show in leaderboard
    const officialParticipants = allParticipants.filter(p => p.is_official);

    const normalList = [];
    const disqualifiedList = [];

    for (const p of officialParticipants) {
        if (p.is_disqualified) {
            disqualifiedList.push(p);
        } else {
            normalList.push(p);
        }
    }

    // Competition Ranking sort for normal participants:
    // 1. Total score DESC
    // 2. Penalty ASC
    normalList.sort((a, b) => {
        if (b.total_score !== a.total_score) return b.total_score - a.total_score;
        return a.penalty - b.penalty;
    });

    // Assign standard competition ranks (1, 2, 3, 3, 5, 6...)
    let rank = 1;
    for (let i = 0; i < normalList.length; i++) {
        if (i > 0) {
            const prev = normalList[i - 1];
            const curr = normalList[i];
            if (curr.total_score === prev.total_score && curr.penalty === prev.penalty) {
                curr.rank = prev.rank;
            } else {
                curr.rank = i + 1;
            }
        } else {
            normalList[i].rank = 1;
        }
    }

    // For disqualified participants: in admin view they are at bottom with rank '-'
    for (const d of disqualifiedList) {
        d.rank = 'Chetlatilgan';
    }

    // Public view hides disqualified participants completely; Admin view appends them at the bottom
    const finalLeaderboard = isUserAdmin ? [...normalList, ...disqualifiedList] : normalList;

    // Calculate footer statistics for each problem
    const problemFooterStats = {};
    for (const prob of problems) {
        let solvedCount = 0;
        let triedCount = 0;
        let acCount = 0;
        let waCount = 0;
        let totalCount = 0;

        for (const p of normalList) {
            const stat = p.problemStats[prob.id];
            if (stat) {
                if (stat.solved) solvedCount++;
                if (stat.attempts > 0) triedCount++;
            }
        }

        for (const s of validSubmissions) {
            if (s.problem_id === prob.id) {
                totalCount++;
                if (s.status === 'Accepted') acCount++;
                else waCount++;
            }
        }

        problemFooterStats[prob.id] = {
            solved_count: solvedCount,
            tried_count: triedCount,
            ac_count: acCount,
            wa_count: waCount,
            total_submissions: totalCount,
            ratio: `${acCount} / ${waCount} / ${totalCount}`
        };
    }

    return {
        contest,
        problems,
        leaderboard: finalLeaderboard,
        footer_stats: problemFooterStats
    };
}

/**
 * Generates an Excel (.xlsx) file buffer of the standings.
 * @param {number|string} contestId
 * @param {boolean} isUserAdmin
 * @returns {Buffer}
 */
function exportStandingsToExcel(contestId, isUserAdmin = false) {
    const data = getContestStandings(contestId, isUserAdmin);
    if (!data) return null;

    const { contest, problems, leaderboard, footer_stats } = data;

    // Build headers
    const headerRow = ['O‘rin', 'Ishtirokchi', 'Foydalanuvchi', 'Maktab', 'Reyting', 'Ball', 'Topshirilgan', 'Jarima'];
    for (const p of problems) {
        headerRow.push(`${p.letter} (${p.score} ball)`);
    }

    const rows = [headerRow];

    // Build participant rows
    for (const u of leaderboard) {
        const row = [
            u.rank,
            u.full_name,
            `@${u.username}`,
            u.school,
            u.rating,
            u.total_score,
            u.solved,
            u.penalty
        ];

        for (const p of problems) {
            const stat = u.problemStats[p.id];
            if (!stat || !stat.display) {
                row.push('—');
            } else if (stat.solved) {
                row.push(`${stat.display} (${stat.time_formatted})`);
            } else {
                row.push(stat.display);
            }
        }
        rows.push(row);
    }

    // Build footer stats rows
    const footerYechgan = ['Statistika', 'Yechganlar soni', '', '', '', '', '', ''];
    const footerUringan = ['Statistika', 'Urinib ko‘rganlar soni', '', '', '', '', '', ''];
    const footerNisbat = ['Statistika', 'Urinishlar (AC / WA / Jami)', '', '', '', '', '', ''];

    for (const p of problems) {
        const st = footer_stats[p.id] || { solved_count: 0, tried_count: 0, ratio: '0 / 0 / 0' };
        footerYechgan.push(st.solved_count);
        footerUringan.push(st.tried_count);
        footerNisbat.push(st.ratio);
    }

    rows.push([]);
    rows.push(footerYechgan);
    rows.push(footerUringan);
    rows.push(footerNisbat);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Auto-fit column widths
    const colWidths = headerRow.map((_, i) => ({ wch: i === 1 ? 25 : (i === 3 ? 20 : 12) }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Natijalar');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function LOWER(str) {
    return String(str || '').toLowerCase();
}

function broadcastContestUpdate(contestId) {
    contestEmitter.emit('standings_updated', { contestId: Number(contestId), timestamp: Date.now() });
}

module.exports = {
    getContestStandings,
    exportStandingsToExcel,
    broadcastContestUpdate,
    contestEmitter,
    parseSubDate
};
