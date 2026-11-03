/**
 * VortexJudge Client-Side Time Synchronization & Anti-Clock-Tampering Engine
 *
 * Synchronizes client timer with backend server time (/api/time).
 * Uses monotonic high-resolution timer (performance.now()) so that even if
 * a user changes their local computer clock or timezone, the contest timer
 * and state never drift or jump.
 */
(function(window) {
  'use strict';

  let _serverBaseTime = Date.now();
  let _perfBase = (typeof performance !== 'undefined' && typeof performance.now === 'function')
    ? performance.now()
    : null;
  let _clockOffset = 0;
  let _isSynced = false;
  let _syncPromise = null;
  const _listeners = [];

  function syncWithServer() {
    if (_syncPromise) return _syncPromise;

    const t0 = (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();

    _syncPromise = fetch('/api/time', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Time sync HTTP ' + res.status);
        return res.json();
      })
      .then(data => {
        const t1 = (typeof performance !== 'undefined' && typeof performance.now === 'function')
          ? performance.now()
          : Date.now();
        const rtt = Math.max(0, t1 - t0);

        if (data && typeof data.timestamp === 'number') {
          // Half RTT adjustment for latency compensation
          _serverBaseTime = data.timestamp + Math.round(rtt / 2);
          _perfBase = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? performance.now()
            : null;
          _clockOffset = _serverBaseTime - Date.now();
          _isSynced = true;

          _listeners.forEach(fn => {
            try { fn(_serverBaseTime); } catch (e) { console.error(e); }
          });
        }
        _syncPromise = null;
        return _serverBaseTime;
      })
      .catch(err => {
        console.warn('[TimeSync]: Failed to sync with /api/time, using local clock fallback.', err);
        _syncPromise = null;
        return Date.now();
      });

    return _syncPromise;
  }

  /**
   * Returns authoritative server timestamp in milliseconds.
   * Completely immune to local clock manipulation.
   */
  function now() {
    if (_isSynced && _perfBase !== null && typeof performance !== 'undefined') {
      const elapsed = performance.now() - _perfBase;
      return _serverBaseTime + Math.round(elapsed);
    }
    return Date.now() + _clockOffset;
  }

  /**
   * Parses contest time string (ISO or timestamp) to UTC milliseconds.
   */
  function parseContestTime(dt, ms) {
    if (typeof ms === 'number' && ms > 0) return ms;
    if (!dt) return 0;
    if (typeof dt === 'number') return dt;
    const str = String(dt).trim();
    if (!str) return 0;

    // If SQLite CURRENT_TIMESTAMP e.g. "2026-10-22 08:50:00"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(str)) {
      return new Date(str.replace(' ', 'T') + 'Z').getTime();
    }
    // If has timezone
    if (str.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(str)) {
      return new Date(str).getTime();
    }
    // If ISO datetime-local without timezone e.g. "2026-11-03T09:00"
    // Treat as Asia/Tashkent (UTC+5)
    const isoM = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (isoM) {
      const utc = Date.UTC(
        parseInt(isoM[1], 10),
        parseInt(isoM[2], 10) - 1,
        parseInt(isoM[3], 10),
        parseInt(isoM[4], 10),
        parseInt(isoM[5], 10),
        parseInt(isoM[6] || '0', 10)
      );
      return utc - (5 * 3600 * 1000);
    }
    return new Date(str).getTime();
  }

  function formatRemaining(ms) {
    if (ms <= 0) return '00:00:00';
    const totalSec = Math.floor(ms / 1000);
    const sec = totalSec % 60;
    const min = Math.floor(totalSec / 60) % 60;
    const hrs = Math.floor(totalSec / 3600) % 24;
    const days = Math.floor(totalSec / 86400);
    const pad = (n) => String(n).padStart(2, '0');
    if (days > 0) return `${days}k ${pad(hrs)}:${pad(min)}:${pad(sec)}`;
    return `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
  }

  function onSync(callback) {
    if (typeof callback === 'function') {
      _listeners.push(callback);
      if (_isSynced) callback(_serverBaseTime);
    }
  }

  // Initial sync immediately when running in a browser
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    syncWithServer();
    // Re-sync on tab focus or visibility change to ensure zero drift
    window.addEventListener('focus', () => syncWithServer());
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) syncWithServer();
      });
    }
    // Periodic background sync every 60 seconds
    setInterval(syncWithServer, 60000);
  }

  const exported = {
    syncWithServer,
    now,
    parseContestTime,
    formatRemaining,
    onSync,
    isSynced: () => _isSynced,
    getOffset: () => _clockOffset
  };

  const target = (typeof window !== 'undefined' && window) || (typeof global !== 'undefined' && global) || this;
  target.TimeSync = exported;
  target.getServerNow = now;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
