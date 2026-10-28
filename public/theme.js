/**
 * algo.Xorazmiy.uz - Global Theme Provider (Dark / Light Mode)
 * Ensures smooth anti-flash loading, localStorage persistence, and backend synchronization.
 */

(function () {
    // 1. Anti-flash execution (runs immediately before DOM render)
    function getStoredTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    function resolveTheme(pref) {
        if (pref === 'dark') return 'dark';
        if (pref === 'light') return 'light';
        // 'system' or fallback
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    const initialPref = getStoredTheme();
    const resolvedInitial = resolveTheme(initialPref);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedInitial);
    document.documentElement.setAttribute('data-theme', resolvedInitial);
    if (document.body) {
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(resolvedInitial);
    }

    // 2. Global Theme Manager Object
    window.ThemeManager = {
        currentPref: initialPref,
        resolved: resolvedInitial,

        init: function () {
            if (document.body) {
                document.body.classList.remove('light', 'dark');
                document.body.classList.add(this.resolved);
            }
            this.updateUi();
            this.listenSystemChanges();
            this.syncWithUserAccount();
        },

        getTheme: function () {
            return this.currentPref;
        },

        setTheme: function (theme, saveToServer = true) {
            this.currentPref = theme;
            this.resolved = resolveTheme(theme);

            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(this.resolved);
            document.documentElement.setAttribute('data-theme', this.resolved);
            if (document.body) {
                document.body.classList.remove('light', 'dark');
                document.body.classList.add(this.resolved);
            }
            localStorage.setItem('theme', theme);

            this.updateUi();

            if (saveToServer) {
                this.persistToServer(theme);
            }
        },

        toggle: function () {
            const next = this.resolved === 'dark' ? 'light' : 'dark';
            this.setTheme(next, true);
        },

        persistToServer: async function (theme) {
            try {
                await fetch('/api/users/theme', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ theme })
                });
            } catch (_) {
                // Ignore network errors or unauthenticated state
            }
        },

        syncWithUserAccount: async function () {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();
                if (data.authenticated && data.user && data.user.theme) {
                    const serverTheme = data.user.theme;
                    const localTheme = localStorage.getItem('theme');
                    // If local storage is empty, adopt server preference
                    if (!localTheme) {
                        this.setTheme(serverTheme, false);
                    } else if (serverTheme !== localTheme) {
                        // Keep server updated if local was explicitly changed
                        this.persistToServer(localTheme);
                    }
                }
            } catch (_) {}
        },

        listenSystemChanges: function () {
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    if (this.currentPref === 'system') {
                        const newResolved = e.matches ? 'dark' : 'light';
                        this.resolved = newResolved;
                        document.documentElement.classList.remove('light', 'dark');
                        document.documentElement.classList.add(newResolved);
                        document.documentElement.setAttribute('data-theme', newResolved);
                        this.updateUi();
                    }
                });
            }
        },

        updateUi: function () {
            const isDark = this.resolved === 'dark';
            const buttons = document.querySelectorAll('.theme-toggle-btn');
            buttons.forEach(btn => {
                btn.setAttribute('title', isDark ? "Hozirgi rejim: Tungi. Kunduzgi rejimga o'tish uchun bosing" : "Hozirgi rejim: Kunduzgi. Tungi rejimga o'tish uchun bosing");
                btn.setAttribute('aria-label', isDark ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish");
                
                if (isDark) {
                    btn.innerHTML = `
                        <svg class="theme-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                        <span class="theme-toggle-label" style="font-size: 0.82rem; margin-left: 5px; font-weight: 600;">Kunduzgi</span>
                    `;
                    btn.style.color = '#fbbf24';
                    btn.style.background = '#1e293b';
                    btn.style.borderColor = '#334155';
                } else {
                    btn.innerHTML = `
                        <svg class="theme-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                        <span class="theme-toggle-label" style="font-size: 0.82rem; margin-left: 5px; font-weight: 600;">Tungi</span>
                    `;
                    btn.style.color = '#0f172a';
                    btn.style.background = '#ffffff';
                    btn.style.borderColor = '#cbd5e1';
                }
            });
        }
    };

    // Auto-mount button in navbar when DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        // Wire existing buttons
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.onclick = () => window.ThemeManager.toggle();
        });

        // If no theme toggle button exists in navbar, auto-inject into nav-user or navbar
        if (document.querySelectorAll('.theme-toggle-btn').length === 0) {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                const navUser = document.querySelector('.nav-user') || navbar;
                const toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = 'theme-toggle-btn';
                toggleBtn.onclick = () => window.ThemeManager.toggle();
                
                if (navUser !== navbar) {
                    navUser.parentNode.insertBefore(toggleBtn, navUser);
                    toggleBtn.style.marginRight = '0.75rem';
                } else {
                    navbar.appendChild(toggleBtn);
                }
            }
        }

        window.ThemeManager.init();
    });
})();
