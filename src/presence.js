/**
 * VortexJudge User Presence & Activity Tracking Manager
 *
 * Tracks real-time presence (Online, Away, Offline) for all registered users,
 * providing heartbeat ingestion, monotonic idle/away detection,
 * Uzbek relative time ago formatting, and admin monitoring statistics.
 */

const db = require('./db');

// Presence threshold constants
const ONLINE_WINDOW_SEC = 75; // Ping within last 75s is considered active/away
const AWAY_IDLE_SEC = 120;     // 2 minutes of inactivity or tab in background = away

// In-Memory Presence Cache
// Map<userId, { lastSeenMs, state: 'online'|'away'|'offline', isActiveTab: 0|1, page: string, ip: string }>
const activePresenceMap = new Map();

/**
 * Format timestamp or ISO string into human-readable Uzbek relative time.
 * e.g. "Hozir", "5 daqiqa oldin", "2 soat oldin", "3 kun oldin", "Hech qachon kirmagan"
 * @param {string|number|Date} dateInput
 * @param {number} nowMs
 * @returns {string}
 */
function formatTimeAgoUz(dateInput, nowMs = Date.now()) {
    if (!dateInput) return 'Hech qachon kirmagan';
    const timeMs = typeof dateInput === 'number' ? dateInput : new Date(dateInput).getTime();
    if (isNaN(timeMs) || timeMs <= 0) return 'Hech qachon kirmagan';

    const diffSec = Math.max(0, Math.floor((nowMs - timeMs) / 1000));
    if (diffSec < 45) return 'Hozir';

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} daqiqa oldin`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} soat oldin`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} kun oldin`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} oy oldin`;

    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} yil oldin`;
}

/**
 * Record a user heartbeat ping.
 * @param {number|string} userId
 * @param {Object} options
 * @param {string} options.state 'online'|'away'|'offline'
 * @param {string} options.page current pathname
 * @param {string} options.ip client IP
 * @param {number} [options.timestampMs]
 */
function recordHeartbeat(userId, options = {}) {
    if (!userId) return;
    const uid = Number(userId);
    const nowMs = options.timestampMs || Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const rawState = (options.state || 'online').toLowerCase();
    const state = ['online', 'away', 'offline'].includes(rawState) ? rawState : 'online';
    const page = options.page ? String(options.page).substring(0, 255) : '';
    const ip = options.ip ? String(options.ip).substring(0, 100) : '';
    const isActiveTab = (state === 'online') ? 1 : 0;

    activePresenceMap.set(uid, {
        lastSeenMs: nowMs,
        state,
        isActiveTab,
        page,
        ip
    });

    try {
        db.prepare(`
            UPDATE users 
            SET last_seen_at = ?,
                is_active_tab = ?,
                presence_state = ?,
                current_page = ?,
                last_ip = ?,
                last_visit = COALESCE(last_visit, ?)
            WHERE id = ?
        `).run(nowIso, isActiveTab, state, page, ip, nowIso, uid);
    } catch (e) {
        // Safe catch for runtime resilience
    }
}

/**
 * Computes real-time presence attributes for a given user record.
 * @param {Object} user user row from database
 * @param {number} nowMs current server timestamp
 * @returns {Object} { status, label, indicator, last_seen_at, last_seen_time_ago, is_active_tab, current_page }
 */
function computeUserPresence(user, nowMs = Date.now()) {
    if (!user || !user.id) {
        return {
            status: 'offline',
            label: 'Oflayn',
            indicator: '⚫',
            last_seen_at: null,
            last_seen_time_ago: 'Hech qachon kirmagan',
            is_active_tab: 0,
            current_page: ''
        };
    }

    const uid = Number(user.id);
    const cached = activePresenceMap.get(uid);

    let lastSeenMs = cached ? cached.lastSeenMs : null;
    let state = cached ? cached.state : user.presence_state;
    let isActiveTab = cached ? cached.isActiveTab : (user.is_active_tab ? 1 : 0);
    let page = cached ? cached.page : (user.current_page || '');

    if (!lastSeenMs && user.last_seen_at) {
        lastSeenMs = new Date(user.last_seen_at).getTime();
    }

    let status = 'offline';
    let label = 'Oflayn';
    let indicator = '⚫';

    if (lastSeenMs && !isNaN(lastSeenMs)) {
        const diffSec = Math.floor((nowMs - lastSeenMs) / 1000);

        // Ping must be within ONLINE_WINDOW_SEC to be considered online or away
        if (diffSec <= ONLINE_WINDOW_SEC && state !== 'offline') {
            if (state === 'away' || isActiveTab === 0) {
                status = 'away';
                label = 'Boshqa oynada';
                indicator = '🟡';
            } else {
                status = 'online';
                label = 'Faol (Saytda)';
                indicator = '🟢';
            }
        }
    }

    let timeAgo = formatTimeAgoUz(lastSeenMs, nowMs);
    if (status === 'online') {
        timeAgo = 'Hozir faol';
    } else if (status === 'away') {
        timeAgo = 'Hozir (nofaol)';
    }

    return {
        status, // 'online' | 'away' | 'offline'
        label,  // 'Faol (Saytda)' | 'Boshqa oynada' | 'Oflayn'
        indicator, // '🟢' | '🟡' | '⚫'
        last_seen_at: lastSeenMs ? new Date(lastSeenMs).toISOString() : null,
        last_seen_time_ago: timeAgo,
        is_active_tab: status === 'online' ? 1 : 0,
        current_page: page
    };
}

/**
 * Retrieves presence data and statistics for all registered users.
 * @param {number} nowMs
 * @returns {Object} { stats: { total, online, away, offline }, users: Array }
 */
function getAllUsersPresence(nowMs = Date.now()) {
    const users = db.prepare(`
        SELECT id, username, full_name, role, school, grade, rating, solved_count,
               last_seen_at, is_active_tab, presence_state, current_page, created_at
        FROM users
        ORDER BY id DESC
    `).all();

    let onlineCount = 0;
    let awayCount = 0;
    let offlineCount = 0;

    const enriched = users.map(u => {
        const pres = computeUserPresence(u, nowMs);
        if (pres.status === 'online') onlineCount++;
        else if (pres.status === 'away') awayCount++;
        else offlineCount++;

        return {
            ...u,
            plain_password: '',
            presence_status: pres.status,
            presence_label: pres.label,
            presence_indicator: pres.indicator,
            last_seen_at: pres.last_seen_at,
            last_seen_time_ago: pres.last_seen_time_ago,
            is_active_tab: pres.is_active_tab,
            current_page: pres.current_page
        };
    });

    return {
        stats: {
            total: users.length,
            online: onlineCount,
            away: awayCount,
            offline: offlineCount
        },
        users: enriched
    };
}

/**
 * Resets presence state (for testing / mocking).
 */
function resetPresenceCache() {
    activePresenceMap.clear();
}

module.exports = {
    ONLINE_WINDOW_SEC,
    AWAY_IDLE_SEC,
    formatTimeAgoUz,
    recordHeartbeat,
    computeUserPresence,
    getAllUsersPresence,
    resetPresenceCache,
    _cache: activePresenceMap
};
