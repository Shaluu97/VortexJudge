import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from './apiClient';

export interface UserRankItem {
  id: number;
  username: string;
  full_name: string;
  school?: string;
  grade?: string | number;
  rating: number;
  contest_rating?: number;
  karma?: number;
  last_visit?: string;
  created_at?: string;
}

export interface UsersListProps {
  initialUsers?: UserRankItem[];
}

export const UsersList: React.FC<UsersListProps> = ({ initialUsers = [] }) => {
  const [users, setUsers] = useState<UserRankItem[]>(initialUsers);
  const [loading, setLoading] = useState<boolean>(initialUsers.length === 0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (initialUsers.length > 0) return;
    setLoading(true);
    apiFetch<UserRankItem[]>('/api/users')
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Error fetching users:', err))
      .finally(() => setLoading(false));
  }, [initialUsers]);

  // Rank title and color calculator
  const getRankInfo = (rating: number) => {
    if (rating >= 2400) return { title: 'Grandmaster', color: '#f43f5e' };
    if (rating >= 2100) return { title: 'Master', color: '#f59e0b' };
    if (rating >= 1900) return { title: 'Candidate Master', color: '#a855f7' };
    if (rating >= 1600) return { title: 'Expert', color: '#3b82f6' };
    if (rating >= 1400) return { title: 'Specialist', color: '#06b6d4' };
    if (rating >= 1200) return { title: 'Pupil', color: '#10b981' };
    return { title: 'Newbie', color: '#94a3b8' };
  };

  // Search filter across username, full name, and school
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cleanQ = q.replace(/^@/, '');
    if (!q) return users;

    return users.filter((u) => {
      const uName = (u.username || '').toLowerCase();
      const fName = (u.full_name || '').toLowerCase();
      const school = (u.school || '').toLowerCase();
      return uName.includes(cleanQ) || fName.includes(q) || school.includes(q);
    });
  }, [users, searchQuery]);

  return (
    <div className="users-list-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.75rem 1rem' }}>
      
      {/* Seamless Search Bar (Requirement 2: transparent bg, compact h-9/h-10, neon glow) */}
      <div
        className="users-search-panel"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flex: 1, maxWidth: '640px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Foydalanuvchilarni qidirish (ism, familiya, @username)..."
                className="h-9 md:h-10 py-1.5 px-3 border border-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.45)] focus:shadow-[0_0_16px_rgba(59,130,246,0.65)] focus:border-blue-500 outline-none text-white placeholder:text-slate-400 rounded-lg w-full bg-[#070d1a]"
                style={{
                  width: '100%',
                  height: '38px',
                  paddingLeft: '2.25rem',
                  paddingRight: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #2563eb',
                  boxShadow: '0 0 12px rgba(37, 99, 235, 0.45)',
                  background: 'var(--bg-input, #070d1a)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none',
                  fontSize: '0.9rem'
                }}
              >
                🔍
              </span>
            </div>

            <button
              type="button"
              onClick={() => {}}
              className="h-9 md:h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all shadow-[0_0_10px_rgba(37,99,235,0.4)]"
              style={{
                height: '38px',
                padding: '0 1.25rem',
                fontWeight: 600,
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 10px rgba(37, 99, 235, 0.4)'
              }}
            >
              🔍 Qidirish
            </button>
          </div>

          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#6366f1' }}>
            {filteredUsers.length} ta foydalanuvchi
          </span>
        </div>
      </div>

      {/* Users Ranking Table (Title Banner Removed as required by UI Cleanup) */}
      <div
        className="card"
        style={{
          background: 'var(--bg-surface, #101929)',
          border: '1px solid var(--border, #1e293b)',
          borderRadius: '12px',
          overflow: 'hidden',
          padding: 0
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #1e293b)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '0.85rem 1rem', width: '70px' }}>O‘rin</th>
                <th style={{ padding: '0.85rem 1rem' }}>Ism va Familiya</th>
                <th style={{ padding: '0.85rem 1rem' }}>Maktab / Sinf</th>
                <th style={{ padding: '0.85rem 1rem' }}>RoboReyting</th>
                <th style={{ padding: '0.85rem 1rem' }}>Olimpiada reytingi</th>
                <th style={{ padding: '0.85rem 1rem' }}>Karma</th>
                <th style={{ padding: '0.85rem 1rem' }}>Oxirgi tashrif</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    Foydalanuvchilar yuklanmoqda...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    Foydalanuvchilar topilmadi.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, i) => {
                  const rankInfo = getRankInfo(u.rating || 1200);
                  const lastVisitDate = u.last_visit
                    ? new Date(u.last_visit).toLocaleDateString()
                    : u.created_at
                    ? new Date(u.created_at).toLocaleDateString()
                    : 'Yaqinda';
                  const schoolInfo = u.school
                    ? `${u.school}${u.grade ? ' (' + u.grade + '-sinf)' : ''}`
                    : '-';

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--border, #1e293b)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong
                          style={{
                            color: i < 3 ? '#f59e0b' : 'var(--text-secondary, #94a3b8)',
                            fontSize: '1.05rem'
                          }}
                        >
                          #{i + 1}
                        </strong>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main, #f8fafc)', fontSize: '0.95rem' }}>
                          {u.full_name || u.username}
                        </div>
                        <small style={{ color: 'var(--text-secondary, #64748b)' }}>@{u.username}</small>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem' }}>
                        {schoolInfo}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: rankInfo.color, fontSize: '1rem' }}>{u.rating || 1200}</strong>
                        <span
                          style={{
                            display: 'inline-block',
                            marginLeft: '0.4rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: `${rankInfo.color}15`,
                            color: rankInfo.color,
                            border: `1px solid ${rankInfo.color}40`
                          }}
                        >
                          {rankInfo.title}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#60a5fa' }}>{u.contest_rating || 0}</strong>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong
                          style={{
                            color: (u.karma || 0) >= 0 ? '#10b981' : '#ef4444'
                          }}
                        >
                          {(u.karma || 0) >= 0 ? `+${u.karma || 0}` : u.karma}
                        </strong>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary, #64748b)', fontSize: '0.85rem' }}>
                        {lastVisitDate}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default UsersList;