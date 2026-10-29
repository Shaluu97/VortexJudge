import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch } from './apiClient';

export interface SubmissionItem {
  id: number;
  user_id: number;
  username: string;
  full_name?: string;
  problem_code: string | number;
  problem_title: string;
  language: string;
  status: string;
  score?: number | null;
  time_spent?: number;
  memory_used?: number;
  created_at: string;
  is_upsolve?: boolean;
}

export interface SubmissionsListProps {
  initialSubmissions?: SubmissionItem[];
  currentUser?: { id: number; username: string; role: string } | null;
  autoRefreshInterval?: number; // ms, default 4000
  onViewDetail?: (id: number) => void;
}

export const SubmissionsList: React.FC<SubmissionsListProps> = ({
  initialSubmissions = [],
  currentUser = null,
  autoRefreshInterval = 4000,
  onViewDetail
}) => {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions);
  const [loading, setLoading] = useState<boolean>(initialSubmissions.length === 0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchSubmissions = useCallback(async () => {
    try {
      const data = await apiFetch<any>('/api/submissions');
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
    if (autoRefreshInterval > 0) {
      const interval = setInterval(fetchSubmissions, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchSubmissions, autoRefreshInterval]);

  // Client filter
  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return submissions;

    return submissions.filter((s) => {
      const sId = String(s.id);
      const pCode = String(s.problem_code || '').toLowerCase();
      const pTitle = (s.problem_title || '').toLowerCase();
      const uName = (s.username || '').toLowerCase();
      const fName = (s.full_name || '').toLowerCase();
      return (
        sId.includes(q) ||
        pCode.includes(q) ||
        pTitle.includes(q) ||
        uName.includes(q) ||
        fName.includes(q)
      );
    });
  }, [submissions, searchQuery]);

  return (
    <div className="submissions-list-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.75rem 1rem' }}>
      
      {/* Compact Search Bar with Neon Glow (Title Header Removed as required) */}
      <div
        style={{
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', maxWidth: '380px', width: '100%' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Masala yoki ID bo‘yicha qidirish..."
            className="h-9 md:h-10 py-1.5 px-3 border border-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.45)] focus:shadow-[0_0_16px_rgba(59,130,246,0.65)] focus:border-blue-500 outline-none text-white placeholder:text-slate-400 rounded-lg w-full bg-[#070d1a]"
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '2.25rem',
              paddingRight: '1rem',
              borderRadius: '8px',
              border: '1px solid #2563eb',
              boxShadow: '0 0 12px rgba(37,99,235,0.45)',
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

        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', fontWeight: 600 }}>
          {filteredSubmissions.length} ta urinish
        </span>
      </div>

      {/* Submissions Table */}
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
                <th style={{ padding: '0.85rem 1rem', width: '70px' }}>#</th>
                <th style={{ padding: '0.85rem 1rem' }}>Foydalanuvchi</th>
                <th style={{ padding: '0.85rem 1rem' }}>Masala</th>
                <th style={{ padding: '0.85rem 1rem' }}>Til</th>
                <th style={{ padding: '0.85rem 1rem' }}>Holati</th>
                <th style={{ padding: '0.85rem 1rem' }}>Ball</th>
                <th style={{ padding: '0.85rem 1rem' }}>Vaqt</th>
                <th style={{ padding: '0.85rem 1rem' }}>Xotira</th>
                <th style={{ padding: '0.85rem 1rem' }}>Yuborilgan vaqt</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Batafsil</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    Urinishlar yuklanmoqda...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    Urinishlar topilmadi.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((s) => {
                  const isAc = s.status === 'Accepted';
                  const isPending = s.status === 'Pending' || s.status === 'Running';
                  const badgeColor = isAc
                    ? '#10b981'
                    : isPending
                    ? '#3b82f6'
                    : s.status.startsWith('Time Limit')
                    ? '#f59e0b'
                    : s.status.startsWith('Memory Limit')
                    ? '#ec4899'
                    : '#ef4444';

                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid var(--border, #1e293b)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <a
                          href={`/submissions/${s.id}`}
                          onClick={(e) => {
                            if (onViewDetail) {
                              e.preventDefault();
                              onViewDetail(s.id);
                            }
                          }}
                          style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}
                        >
                          #{s.id}
                        </a>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                          {s.full_name || s.username}
                        </div>
                        <small style={{ color: 'var(--text-secondary, #64748b)' }}>@{s.username}</small>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <a
                          href={`/problems/${s.problem_code}`}
                          style={{ color: 'var(--text-main, #f8fafc)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          #{s.problem_code} - {s.problem_title}
                        </a>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#a855f7' }}>{s.language.toUpperCase()}</strong>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: `${badgeColor}18`,
                            color: badgeColor,
                            border: `1px solid ${badgeColor}40`
                          }}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong>{s.score !== null && s.score !== undefined ? s.score : '-'}</strong>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isPending ? '...' : <strong>{s.time_spent || 0} ms</strong>}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isPending ? '...' : <strong>{s.memory_used || 0} KB</strong>}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem' }}>
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <a
                          href={`/submissions/${s.id}`}
                          onClick={(e) => {
                            if (onViewDetail) {
                              e.preventDefault();
                              onViewDetail(s.id);
                            }
                          }}
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--border, #1e293b)',
                            color: 'var(--text-main, #f8fafc)',
                            textDecoration: 'none',
                            background: 'rgba(255, 255, 255, 0.04)'
                          }}
                        >
                          Ko‘rish
                        </a>
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
export default SubmissionsList;