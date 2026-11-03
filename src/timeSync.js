/**
 * VortexJudge Server Time Synchronization & Date Normalization Module
 *
 * Provides authoritative server time in Asia/Tashkent timezone (UTC+5),
 * anti-clock-tampering parsing, and unambiguous ISO conversions.
 */

const TASHKENT_OFFSET_HOURS = 5;
const TASHKENT_OFFSET_MS = TASHKENT_OFFSET_HOURS * 3600 * 1000;
const TASHKENT_TZ_NAME = 'Asia/Tashkent';

/**
 * Returns current UTC timestamp in milliseconds.
 * @returns {number}
 */
function getNowUtcMs() {
    return Date.now();
}

/**
 * Returns current ISO string in UTC.
 * @returns {string}
 */
function getNowUtcIso() {
    return new Date().toISOString();
}

/**
 * Formats a millisecond timestamp to Asia/Tashkent ISO string with +05:00 offset.
 * e.g. "2026-11-03T09:00:00+05:00"
 * @param {number} ms
 * @returns {string}
 */
function formatMsToTashkentIso(ms) {
    if (!ms || isNaN(ms)) return '';
    const d = new Date(ms + TASHKENT_OFFSET_MS);
    const pad = (n) => String(n).padStart(2, '0');
    const y = d.getUTCFullYear();
    const m = pad(d.getUTCMonth() + 1);
    const day = pad(d.getUTCDate());
    const h = pad(d.getUTCHours());
    const min = pad(d.getUTCMinutes());
    const sec = pad(d.getUTCSeconds());
    return `${y}-${m}-${day}T${h}:${min}:${sec}+05:00`;
}

/**
 * Returns current time as Asia/Tashkent ISO string.
 * @returns {string}
 */
function getNowTashkentIso() {
    return formatMsToTashkentIso(Date.now());
}

/**
 * Robustly parses any date representation (ISO, datetime-local, MM/DD/YYYY, DD/MM/YYYY)
 * into exact UTC millisecond timestamp.
 * If no timezone is provided, assumes Asia/Tashkent (+05:00).
 *
 * @param {string|number|Date} input
 * @returns {number} UTC ms, or 0 if invalid
 */
function parseToMs(input) {
    if (!input) return 0;
    if (typeof input === 'number') return input;
    if (input instanceof Date) return isNaN(input.getTime()) ? 0 : input.getTime();

    const str = String(input).trim();
    if (!str) return 0;

    // 1. If SQLite CURRENT_TIMESTAMP e.g. "2026-10-22 08:50:00" -> UTC
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(str)) {
        return new Date(str.replace(' ', 'T') + 'Z').getTime();
    }

    // 2. Already has explicit timezone offset (+HH:MM, -HH:MM or Z)
    if (str.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(str)) {
        const ms = new Date(str).getTime();
        return isNaN(ms) ? 0 : ms;
    }

    // 3. ISO YYYY-MM-DD[T ]HH:mm(:ss) without timezone -> treat as Tashkent (+05:00)
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (isoMatch) {
        const y = parseInt(isoMatch[1], 10);
        const m = parseInt(isoMatch[2], 10) - 1;
        const d = parseInt(isoMatch[3], 10);
        const h = parseInt(isoMatch[4], 10);
        const min = parseInt(isoMatch[5], 10);
        const sec = parseInt(isoMatch[6] || '0', 10);
        // Treat as UTC then subtract Tashkent offset:
        const utcMs = Date.UTC(y, m, d, h, min, sec);
        return utcMs - TASHKENT_OFFSET_MS;
    }

    // 4. Slash/dot formats e.g. "11/03/2026 09:00 AM" or "03/11/2026 09:00"
    const slashMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(AM|PM))?)?/i);
    if (slashMatch) {
        let part1 = parseInt(slashMatch[1], 10);
        let part2 = parseInt(slashMatch[2], 10);
        const y = parseInt(slashMatch[3], 10);
        let h = slashMatch[4] ? parseInt(slashMatch[4], 10) : 0;
        const min = slashMatch[5] ? parseInt(slashMatch[5], 10) : 0;
        const sec = slashMatch[6] ? parseInt(slashMatch[6], 10) : 0;
        const ampm = slashMatch[7] ? slashMatch[7].toUpperCase() : null;

        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;

        let month, day;
        if (part1 > 12) {
            day = part1;
            month = part2;
        } else if (part2 > 12) {
            month = part1;
            day = part2;
        } else {
            // Default: month = part1, day = part2 ("11/03/2026")
            month = part1;
            day = part2;
        }

        const utcMs = Date.UTC(y, month - 1, day, h, min, sec);
        return utcMs - TASHKENT_OFFSET_MS;
    }

    const fallback = new Date(str).getTime();
    return isNaN(fallback) ? 0 : fallback;
}

/**
 * Normalizes any date string into standard Asia/Tashkent ISO representation (+05:00).
 * e.g. "2026-11-03T09:00:00+05:00"
 * @param {string|number|Date} input
 * @returns {string}
 */
function normalizeToTashkentIso(input) {
    if (!input) return null;
    const ms = parseToMs(input);
    if (!ms || isNaN(ms)) return String(input);
    return formatMsToTashkentIso(ms);
}

module.exports = {
    TASHKENT_OFFSET_HOURS,
    TASHKENT_OFFSET_MS,
    TASHKENT_TZ_NAME,
    getNowUtcMs,
    getNowUtcIso,
    getNowTashkentIso,
    formatMsToTashkentIso,
    parseToMs,
    normalizeToTashkentIso
};
