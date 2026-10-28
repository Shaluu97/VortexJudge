/**
 * user_profile.js - Global User Profile Dropdown & Settings Modal
 * algo.Xorazmiy.uz
 */

(function () {
  function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Inject modal into document body if not present
  function ensureProfileModal() {
    if (document.getElementById('profileSettingsModal')) return;

    const modalHtml = `
      <div id="profileSettingsModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99999; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(4px);">
        <div style="background: var(--bg-card, #1e293b); border: 1px solid var(--border, #334155); border-radius: 12px; max-width: 500px; width: 100%; box-shadow: 0 16px 40px rgba(0,0,0,0.5); max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; animation: profFadeIn 0.2s ease-out;">
          <div style="padding: 1.1rem 1.5rem; border-bottom: 1px solid var(--border, #334155); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-main, #f8fafc);">
              <span>⚙️</span> Profil Sozlamalari
            </h3>
            <button type="button" onclick="closeProfileSettingsModal()" style="background: none; border: none; font-size: 1.5rem; line-height: 1; cursor: pointer; color: var(--text-muted, #94a3b8);">&times;</button>
          </div>

          <form id="profileSettingsForm" onsubmit="handleSaveProfileSettings(event)" style="padding: 1.25rem 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.9rem; margin: 0;">
            <div id="profileSettingsAlert" style="display: none; padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.88rem; line-height: 1.4;"></div>

            <div>
              <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-muted, #94a3b8);">To‘liq ism (F.I.Sh):</label>
              <input type="text" id="profFullName" class="input" style="width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;" required placeholder="Ism Familiya">
            </div>

            <div>
              <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-muted, #94a3b8);">Foydalanuvchi nomi (Login / Username):</label>
              <input type="text" id="profUsername" class="input" style="width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;" required placeholder="username">
              <small style="color: var(--text-dim, #64748b); font-size: 0.75rem;">Tizimga kirish uchun login nomi</small>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div>
                <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-muted, #94a3b8);">Sinfi:</label>
                <select id="profGrade" class="input" style="width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;">
                  <option value="">Tanlanmagan</option>
                  <option value="5-sinf">5-sinf</option>
                  <option value="6-sinf">6-sinf</option>
                  <option value="7-sinf">7-sinf</option>
                  <option value="8-sinf">8-sinf</option>
                  <option value="9-sinf">9-sinf</option>
                  <option value="10-sinf">10-sinf</option>
                  <option value="11-sinf">11-sinf</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-muted, #94a3b8);">Maktabi:</label>
                <input type="text" id="profSchool" class="input" style="width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;" placeholder="Masalan: 1-IDUM yoki Al-Xorazmiy">
              </div>
            </div>

            <div style="border-top: 1px solid var(--border, #334155); margin-top: 0.25rem; padding-top: 0.75rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main, #f8fafc); display: block; margin-bottom: 0.5rem;">🔒 Parolni o‘zgartirish (ixtiyoriy)</span>
              
              <div style="margin-bottom: 0.65rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 500; margin-bottom: 0.3rem; color: var(--text-muted, #94a3b8);">Yangi parol:</label>
                <input type="password" id="profNewPassword" class="input" style="width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;" placeholder="O‘zgartirmaslik uchun bo‘sh qoldiring" autocomplete="new-password">
              </div>

              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 500; margin-bottom: 0.3rem; color: var(--text-muted, #94a3b8);">Yangi parolni tasdiqlash:</label>
                <input type="password" id="profConfirmPassword" class="input" style="width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;" placeholder="Yangi parolni qayta kiriting" autocomplete="new-password">
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--border, #334155);">
              <button type="button" onclick="closeProfileSettingsModal()" class="btn btn-outline" style="padding: 0.5rem 1rem;">Bekor qilish</button>
              <button type="submit" id="profSaveBtn" class="btn btn-primary" style="padding: 0.5rem 1.25rem; font-weight: 600;">Saqlash</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  // Toggle user dropdown menu
  window.toggleUserProfileDropdown = function (e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('userProfileDropdownMenu');
    if (!menu) return;
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
  };

  // Close dropdown when clicked outside
  document.addEventListener('click', function (e) {
    const menu = document.getElementById('userProfileDropdownMenu');
    const btn = document.getElementById('userProfileDropdownBtn');
    if (menu && menu.style.display === 'block') {
      if (btn && btn.contains(e.target)) return;
      if (!menu.contains(e.target)) {
        menu.style.display = 'none';
      }
    }
  });

  // Open profile modal
  window.openProfileSettingsModal = async function () {
    ensureProfileModal();
    const menu = document.getElementById('userProfileDropdownMenu');
    if (menu) menu.style.display = 'none';

    const alertBox = document.getElementById('profileSettingsAlert');
    alertBox.style.display = 'none';
    alertBox.textContent = '';

    const modal = document.getElementById('profileSettingsModal');
    modal.style.display = 'flex';

    try {
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const data = await res.json();
        const user = data.user || {};
        document.getElementById('profFullName').value = user.full_name || '';
        document.getElementById('profUsername').value = user.username || '';
        document.getElementById('profSchool').value = user.school || '';
        document.getElementById('profGrade').value = user.grade || '';
        document.getElementById('profNewPassword').value = '';
        document.getElementById('profConfirmPassword').value = '';
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  window.closeProfileSettingsModal = function () {
    const modal = document.getElementById('profileSettingsModal');
    if (modal) modal.style.display = 'none';
  };

  window.handleSaveProfileSettings = async function (e) {
    e.preventDefault();
    const alertBox = document.getElementById('profileSettingsAlert');
    const saveBtn = document.getElementById('profSaveBtn');

    const fullName = document.getElementById('profFullName').value.trim();
    const username = document.getElementById('profUsername').value.trim();
    const grade = document.getElementById('profGrade').value;
    const school = document.getElementById('profSchool').value.trim();
    const password = document.getElementById('profNewPassword').value;
    const confirmPassword = document.getElementById('profConfirmPassword').value;

    if (!fullName || !username) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
      alertBox.style.color = '#ef4444';
      alertBox.style.border = '1px solid #ef4444';
      alertBox.textContent = 'To‘liq ism va foydalanuvchi nomi to‘ldirilishi shart!';
      return;
    }

    if (password && password.length < 4) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
      alertBox.style.color = '#ef4444';
      alertBox.style.border = '1px solid #ef4444';
      alertBox.textContent = 'Yangi parol kamida 4 ta belgidan iborat bo‘lishi kerak!';
      return;
    }

    if (password && password !== confirmPassword) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
      alertBox.style.color = '#ef4444';
      alertBox.style.border = '1px solid #ef4444';
      alertBox.textContent = 'Kiritilgan yangi parollar bir-biriga mos kelmadi!';
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saqlanmoqda...';

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          username: username,
          grade: grade,
          school: school,
          password: password || undefined,
          confirm_password: confirmPassword || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Profilni saqlashda xatolik yuz berdi');
      }

      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(34, 197, 94, 0.15)';
      alertBox.style.color = '#22c55e';
      alertBox.style.border = '1px solid #22c55e';
      alertBox.textContent = data.message || 'Profilingiz muvaffaqiyatli yangilandi!';

      // Update navbar in real-time
      const displayNameEl = document.getElementById('navUserDisplayName');
      if (displayNameEl) {
        displayNameEl.textContent = '👤 ' + (data.user?.full_name || data.user?.username || fullName);
      }
      if (window.currentUser) {
        Object.assign(window.currentUser, data.user);
      }

      setTimeout(() => {
        closeProfileSettingsModal();
        saveBtn.disabled = false;
        saveBtn.textContent = 'Saqlash';
      }, 1000);
    } catch (err) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
      alertBox.style.color = '#ef4444';
      alertBox.style.border = '1px solid #ef4444';
      alertBox.textContent = err.message;
      saveBtn.disabled = false;
      saveBtn.textContent = 'Saqlash';
    }
  };

  window.handleGlobalLogout = async function () {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {}
    window.location.reload();
  };

  // Main render user navigation function
  window.renderUserNav = function (userData, containerId = 'navUserArea') {
    ensureProfileModal();
    const container = document.getElementById(containerId);
    if (!container) return;

    const user = (userData && userData.user) ? userData.user : userData;
    if (!user || !user.id) {
      container.innerHTML = `<a href="/login" class="btn btn-primary btn-sm">Kirish</a>`;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.65rem;">
        ${user.role === 'admin' ? '<a href="/admin" class="btn btn-danger btn-sm" style="font-weight: 600;">Admin</a>' : ''}
        <div class="user-profile-menu-container" style="position: relative; display: inline-block;">
          <button id="userProfileDropdownBtn" class="btn btn-outline btn-sm" onclick="toggleUserProfileDropdown(event)" style="display: inline-flex; align-items: center; gap: 0.45rem; font-weight: 600; cursor: pointer; border-radius: 6px;">
            <span style="color: #60a5fa;" id="navUserDisplayName">👤 ${escapeHtml(user.full_name || user.username)}</span>
            <span style="font-size: 0.72rem; color: var(--text-muted, #94a3b8); margin-left: 2px;">▼</span>
          </button>
          <div id="userProfileDropdownMenu" style="display: none; position: absolute; right: 0; top: calc(100% + 6px); background: var(--bg-card, #1e293b); border: 1px solid var(--border, #334155); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); min-width: 210px; z-index: 99999; overflow: hidden;">
            <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border, #334155); font-size: 0.82rem; background: rgba(255,255,255,0.02);">
              <div style="font-weight: 700; color: var(--text-main, #f8fafc); font-size: 0.9rem;">${escapeHtml(user.full_name || user.username)}</div>
              <div style="color: var(--text-dim, #94a3b8); margin-top: 3px;">@${escapeHtml(user.username)} ${user.grade ? `&bull; <span style="color: #60a5fa;">${escapeHtml(user.grade)}</span>` : ''}</div>
              ${user.school ? `<div style="color: var(--text-muted, #64748b); font-size: 0.78rem; margin-top: 2px;">🏫 ${escapeHtml(user.school)}</div>` : ''}
            </div>
            <a href="javascript:void(0)" onclick="openProfileSettingsModal()" style="display: flex; align-items: center; gap: 0.65rem; padding: 0.7rem 1rem; color: var(--text-main, #f8fafc); text-decoration: none; font-size: 0.88rem; transition: background 0.15s;" onmouseover="this.style.background='var(--bg-input, #334155)'" onmouseout="this.style.background='transparent'">
              <span style="font-size: 1rem;">⚙️</span> <span>Sozlamalar</span>
            </a>
            <a href="javascript:void(0)" onclick="handleGlobalLogout()" style="display: flex; align-items: center; gap: 0.65rem; padding: 0.7rem 1rem; color: #ef4444; text-decoration: none; font-size: 0.88rem; border-top: 1px solid var(--border, #334155); transition: background 0.15s;" onmouseover="this.style.background='var(--bg-input, #334155)'" onmouseout="this.style.background='transparent'">
              <span style="font-size: 1rem;">🚪</span> <span>Chiqish</span>
            </a>
          </div>
        </div>
      </div>
    `;
  };

  // Auto-init on load if container exists and not yet initialized
  document.addEventListener('DOMContentLoaded', async () => {
    const userArea = document.getElementById('navUserArea');
    if (userArea && !userArea.hasChildNodes()) {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            window.currentUser = data.user;
            window.renderUserNav(data.user);
          } else {
            window.renderUserNav(null);
          }
        }
      } catch (_) {}
    }
  });
})();
