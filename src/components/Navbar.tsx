import React, { useState, useEffect } from 'react';
import { apiFetch } from './apiClient';

export interface User {
  id: number;
  username: string;
  full_name?: string;
  role: 'admin' | 'judge' | 'student' | 'user' | string;
  rating?: number;
  avatar_url?: string;
}

export interface NavbarProps {
  currentUser?: User | null;
  currentPath?: string;
  statusBadgeText?: string;
  onLogout?: () => Promise<void> | void;
  onThemeToggle?: () => void;
  theme?: 'dark' | 'light';
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser: initialUser = null,
  currentPath = '/',
  statusBadgeText = 'OFLAYN SERVER',
  onLogout,
  onThemeToggle,
  theme = 'dark',
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser);
      return;
    }
    // Auto-fetch if not provided as prop
    apiFetch<any>('/api/auth/me')
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [initialUser]);

  const navLinks = [
    { label: 'Bosh sahifa', href: '/' },
    { label: 'Masalalar', href: '/problems' },
    { label: 'Urinishlar', href: '/submissions' },
    { label: 'Olimpiadalar', href: '/contests' },
    { label: 'Foydalanuvchilar', href: '/users' },
    { label: 'Qanday ishlaydi', href: '/how-it-works' },
  ];

  const handleLogoutClick = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  };

  const isStaff = user && ['admin', 'judge', 'superadmin'].includes(String(user.role).toLowerCase());

  return (
    <nav className="navbar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.65rem 1.75rem',
      background: 'var(--bg-surface, #0d162a)',
      borderBottom: '1px solid var(--border, #1e293b)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      gap: '1rem'
    }}>
      {/* Brand & Status Badge */}
      <a href="/" className="nav-brand" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        textDecoration: 'none',
        flex: '0 0 auto',
        userSelect: 'none'
      }}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
        <span
          className="nav-brand-text"
          style={{
            fontWeight: 800,
            fontSize: '1.15rem',
            letterSpacing: '-0.02em',
            textTransform: 'lowercase',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}
        >
          algo.xorazmiy.uz
        </span>
        <span
          className="badge-offline"
          style={{
            fontSize: '0.68rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '9999px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            background: 'rgba(99, 102, 241, 0.12)',
            color: '#818cf8',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          {statusBadgeText}
        </span>
      </a>

      {/* Center Unified Navigation Links */}
      <ul
        className="nav-links"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          listStyle: 'none',
          margin: '0 auto',
          padding: 0,
          flex: '1 1 auto'
        }}
      >
        {navLinks.map((link) => {
          const isActive = currentPath === link.href || (link.href !== '/' && currentPath.startsWith(link.href));
          return (
            <li key={link.href}>
              <a
                href={link.href}
                className={isActive ? 'active' : ''}
                style={{
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#6366f1' : 'var(--text-secondary, #94a3b8)',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px',
                  transition: 'color 0.15s ease, background-color 0.15s ease',
                  background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                }}
              >
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>

      {/* Right User Actions & Theme Toggle */}
      <div
        className="nav-user"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flex: '0 0 auto'
        }}
      >
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onThemeToggle || (() => {
            if (typeof window !== 'undefined' && (window as any).ThemeManager) {
              (window as any).ThemeManager.toggle();
            }
          })}
          className="theme-toggle-btn"
          title="Mavzuni almashtirish (Kunduzgi / Tungi)"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border, #1e293b)',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            color: 'var(--text-main, #f8fafc)'
          }}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

        {user ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border, #1e293b)',
                borderRadius: '8px',
                padding: '0.35rem 0.75rem',
                cursor: 'pointer',
                color: 'var(--text-main, #f8fafc)'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#ffffff'
                }}
              >
                {(user.full_name || user.username || 'U')[0].toUpperCase()}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>
                  {user.full_name || user.username}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 700 }}>
                  {user.rating || 1200} pts
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #94a3b8)', marginLeft: '2px' }}>
                ▾
              </span>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  minWidth: '200px',
                  background: 'var(--bg-surface, #101929)',
                  border: '1px solid var(--border, #1e293b)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  padding: '0.5rem 0',
                  zIndex: 200
                }}
              >
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border, #1e293b)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                    @{user.username}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    Rol: {user.role.toUpperCase()}
                  </div>
                </div>

                {isStaff && (
                  <a
                    href="/admin"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 1rem',
                      fontSize: '0.85rem',
                      color: '#a855f7',
                      textDecoration: 'none',
                      fontWeight: 600
                    }}
                  >
                    ⚙️ Admin Panel
                  </a>
                )}

                <a
                  href="/submissions"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-main, #f8fafc)',
                    textDecoration: 'none'
                  }}
                >
                  📊 Mening urinishlarim
                </a>

                <button
                  type="button"
                  onClick={handleLogoutClick}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '0.6rem 1rem',
                    fontSize: '0.85rem',
                    color: '#f43f5e',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderTop: '1px solid var(--border, #1e293b)'
                  }}
                >
                  🚪 Chiqish
                </button>
              </div>
            )}
          </div>
        ) : (
          <a
            href="/login"
            className="btn btn-primary btn-sm"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            Kirish ➔
          </a>
        )}
      </div>
    </nav>
  );
};
export default Navbar;