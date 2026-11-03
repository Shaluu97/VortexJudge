/**
 * public/presence.js
 * Real-time User Presence & Activity Tracker for VortexJudge
 *
 * Detects online/away/offline states, dispatches periodic heartbeats (every 30s),
 * listens to window focus/blur, visibility changes, and beforeunload beacons.
 */

(function (global) {
  'use strict';

  let lastInteractionTime = Date.now();
  let currentPresenceState = 'online';
  let heartbeatTimer = null;
  let isSending = false;
  let lastSentTime = 0;
  let authFailed = false;

  // Throttle helper
  function throttle(func, wait) {
    let timeout = null;
    let previous = 0;
    return function () {
      const now = Date.now();
      const remaining = wait - (now - previous);
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        func.apply(this, arguments);
      } else if (!timeout) {
        timeout = setTimeout(() => {
          previous = Date.now();
          timeout = null;
          func.apply(this, arguments);
        }, remaining);
      }
    };
  }

  // Determine user presence state based on visibility, focus and user interaction
  function determineState() {
    // 1. If tab is hidden
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return 'away';
    }
    // 2. If window does not have focus
    if (typeof document !== 'undefined' && typeof document.hasFocus === 'function' && !document.hasFocus()) {
      return 'away';
    }
    // 3. If idle for >= 120 seconds (2 minutes)
    const idleSeconds = Math.floor((Date.now() - lastInteractionTime) / 1000);
    if (idleSeconds >= 120) {
      return 'away';
    }
    return 'online';
  }

  function sendHeartbeat(forcedState) {
    if (authFailed && forcedState !== 'online') return;

    const state = forcedState || determineState();
    currentPresenceState = state;

    const now = Date.now();
    // Prevent duplicate event storming (minimum 2.5s between normal pings)
    if (forcedState !== 'offline' && (now - lastSentTime < 2500)) {
      return;
    }
    lastSentTime = now;

    const payload = JSON.stringify({
      state: state,
      page: (typeof window !== 'undefined' && window.location) ? (window.location.pathname + window.location.search) : '',
      idle_seconds: Math.floor((Date.now() - lastInteractionTime) / 1000)
    });

    if (forcedState === 'offline') {
      // Tab is closing: use sendBeacon with fallback to keepalive fetch
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/presence/heartbeat', blob);
      } else if (typeof fetch === 'function') {
        try {
          fetch('/api/presence/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          });
        } catch (_) {}
      }
      return;
    }

    if (isSending || typeof fetch !== 'function') return;
    isSending = true;

    fetch('/api/presence/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    })
      .then(res => {
        isSending = false;
        if (res.status === 401) {
          // User not logged in, avoid spamming
          authFailed = true;
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            // Check once every 60s in case user logs in in another tab
            heartbeatTimer = setInterval(sendHeartbeat, 60000);
          }
        } else if (res.ok) {
          authFailed = false;
        }
      })
      .catch(() => {
        isSending = false;
      });
  }

  // Record user interaction to reset idle timer
  const recordActivity = throttle(() => {
    lastInteractionTime = Date.now();
    if (authFailed) {
      authFailed = false; // Retry after user action
    }
    if (currentPresenceState === 'away' && typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()) {
      // Switched from idle back to active
      sendHeartbeat('online');
    }
  }, 3000);

  // Initialize listeners if running in browser
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, recordActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendHeartbeat('away');
      } else {
        lastInteractionTime = Date.now();
        sendHeartbeat('online');
      }
    });

    window.addEventListener('focus', () => {
      lastInteractionTime = Date.now();
      sendHeartbeat('online');
    });

    window.addEventListener('blur', () => {
      sendHeartbeat('away');
    });

    window.addEventListener('pagehide', () => {
      sendHeartbeat('offline');
    });

    window.addEventListener('beforeunload', () => {
      sendHeartbeat('offline');
    });

    // Start immediate ping & 30-second interval
    sendHeartbeat('online');
    heartbeatTimer = setInterval(() => {
      sendHeartbeat();
    }, 30000);
  }

  const exported = {
    getState: () => currentPresenceState,
    determineState: determineState,
    sendHeartbeat: sendHeartbeat,
    recordActivity: recordActivity
  };

  const target = (typeof window !== 'undefined' && window) || (typeof global !== 'undefined' && global) || this;
  target.PresenceTracker = exported;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
