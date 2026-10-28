import React, { useState, useEffect, useMemo } from 'react';

export interface ContestItem {
  id: string | number;
  title: string;
  type: 'PUBLIC' | 'PRIVATE' | string;
  status?: string;
  start_time: string;
  end_time: string;
  duration?: string;
  start_time_ms?: number;
  end_time_ms?: number;
  is_live?: boolean;
  is_upcoming?: boolean;
  is_finished?: boolean;
  is_registered?: boolean;
  participant_count?: number;
  problem_count?: number;
  description?: string;
}

export interface ContestListProps {
  initialContests?: ContestItem[];
  currentUser?: { id: number; username: string; role: string } | null;
  onCreateContestClick?: () => void;
}

export const ContestList: React.FC<ContestListProps> = ({
  initialContests = [],
  currentUser = null,
  onCreateContestClick
}) => {
  const [contests, setContests] = useState<ContestItem[]>(initialContests);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'finished'>('live');
  const [loading, setLoading] = useState<boolean>(initialContests.length === 0);

  useEffect(() => {
    if (initialContests.length > 0) return;
    setLoading(true);
    fetch('/api/contests')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.contests || [];
        setContests(list);
      })
      .catch((err) => console.error('Error fetching contests:', err))
      .finally(() => setLoading(false));
  }, [initialContests]);

  const isStaff = currentUser && ['admin', 'judge', 'superadmin'].includes(String(currentUser.role).toLowerCase());

  // Categorize contests into Live, Upcoming, Finished using normalized timestamps
  const categorized = useMemo(() => {
    const now = Date.now();
    const live: ContestItem[] = [];
    const upcoming: ContestItem[] = [];
    const finished: ContestItem[] = [];

    contests.forEach((c) => {
      const s = c.start_time_ms || new Date(c.start_time).getTime();
      const e = c.end_time_ms || new Date(c.end_time).getTime();

      if (now >= s && now <= e) {
        live.push(c);
      } else if (now < s) {
        upcoming.push(c);
      } else {
        finished.push(c);
      }
    });

    return { live, upcoming, finished };
  }, [contests]);

  const currentList = categorized[activeTab];

  const handleRegister = async (contestId: string | number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      alert('Musobaqada qatnashish uchun avval tizimga kiring!');
      window.location.href = '/login';
      return;
    }
    try {
      const res = await fetch(`/api/contests/${contestId}/register`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Siz muvaffaqiyatli ro‘yxatdan o‘tdingiz!');
        setContests((prev) =>
          prev.map((c) => (c.id === contestId ? { ...c, is_registered: true } : c))
        );
      } else {
        alert(data.error || 'Ro‘yxatdan o‘tishda xatolik yuz berdi');
      }
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    }
  };

  return (
    <div className="contest-list-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Top Header & Actions (Notice: Top hero banner removed as required) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Segmented Status Tabs */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-surface, #101929)',
            border: '1px solid var(--border, #1e293b)',
            borderRadius: '10px',
            padding: '4px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'live' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: activeTab === 'live' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🔴 Davom etayotgan (LIVE)</span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                background: activeTab === 'live' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)'
              }}
            >
              {categorized.live.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'upcoming' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: activeTab === 'upcoming' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>⏳ Kutilayotgan</span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                background: activeTab === 'upcoming' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)'
              }}
            >
              {categorized.upcoming.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finished')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'finished' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: activeTab === 'finished' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🏁 Tugallangan</span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                background: activeTab === 'finished' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)'
              }}
            >
              {categorized.finished.length}
            </span>
          </button>
        </div>

        {/* Staff Only: Create Contest Button */}
        {isStaff && (
          <button
            type="button"
            onClick={onCreateContestClick || (() => { window.location.href = '/contests?action=create'; })}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
            }}
          >
            + Yangi olimpiada yaratish
          </button>
        )}
      </div>

      {/* Contests Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary, #94a3b8)' }}>
          Olimpiadalar ro‘yxati yuklanmoqda...
        </div>
      ) : currentList.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            background: 'var(--bg-surface, #101929)',
            border: '1px solid var(--border, #1e293b)',
            borderRadius: '12px',
            color: 'var(--text-secondary, #94a3b8)'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏆</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main, #f8fafc)' }}>
            Bu bo‘limda olimpiadalar mavjud emas
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            {activeTab === 'live'
              ? 'Hozirda davom etayotgan jonli musobaqalar yo‘q.'
              : activeTab === 'upcoming'
              ? 'Yaqin orada rejalashtirilgan musobaqalar yo‘q.'
              : 'Tugallangan musobaqalar topilmadi.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {currentList.map((c) => {
            const isReg = Boolean(c.is_registered);
            return (
              <div
                key={c.id}
                className="contest-card"
                style={{
                  background: 'var(--bg-surface, #101929)',
                  border: '1px solid var(--border, #1e293b)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
              >
                <div>
                  {/* Badges Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background: c.type === 'PUBLIC' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: c.type === 'PUBLIC' ? '#818cf8' : '#f43f5e',
                        border: `1px solid ${c.type === 'PUBLIC' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                      }}
                    >
                      {c.type === 'PUBLIC' ? 'OCHIQ OLIMPIADA' : 'MAXFIY (SARALASH)'}
                    </span>

                    {isReg ? (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        ✓ Ro‘yxatdan o‘tgansiz
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)' }}>
                        👥 {c.participant_count || 0} qatnashuvchi
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main, #f8fafc)' }}>
                    <a
                      href={`/contests?open=${c.id}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {c.title}
                    </a>
                  </h3>

                  {/* Details */}
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6, marginBottom: '1rem' }}>
                    <div>📅 Boshlanishi: {new Date(c.start_time).toLocaleString()}</div>
                    <div>⏱ Tugashi: {new Date(c.end_time).toLocaleString()}</div>
                    {c.duration && <div>⌛ Davomiyligi: {c.duration}</div>}
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border, #1e293b)' }}>
                  <a
                    href={`/contests?open=${c.id}`}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      padding: '0.45rem',
                      borderRadius: '6px'
                    }}
                  >
                    Musobaqaga kirish ➔
                  </a>

                  {!isReg && activeTab !== 'finished' && (
                    <button
                      type="button"
                      onClick={(e) => handleRegister(c.id, e)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
                        border: '1px solid #10b981',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      Ro‘yxatdan o‘tish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ContestList;