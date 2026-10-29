import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from './apiClient';

export interface ProblemItem {
  id: number;
  code: string | number;
  title: string;
  difficulty: 'Oson' | 'O‘rta' | 'O‘rtacha' | 'Qiyin' | 'Ekspert' | string;
  category?: string;
  score: number;
  accepted_count: number;
  total_count: number;
  acceptance_rate: number;
  is_solved?: boolean;
  is_favorite?: boolean;
  is_secret?: boolean;
  visibility?: 'public' | 'private' | string;
  is_public?: boolean;
}

export interface ProblemsListProps {
  initialProblems?: ProblemItem[];
  currentUser?: { id: number; username: string; role: string } | null;
  itemsPerPage?: number;
}

export const ProblemsList: React.FC<ProblemsListProps> = ({
  initialProblems = [],
  currentUser = null,
  itemsPerPage = 10
}) => {
  const [problems, setProblems] = useState<ProblemItem[]>(initialProblems);
  const [loading, setLoading] = useState<boolean>(initialProblems.length === 0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDiff, setSelectedDiff] = useState<string>('');
  const [onlyUnsolved, setOnlyUnsolved] = useState<boolean>(false);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [onlyUnofficial, setOnlyUnofficial] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (initialProblems.length > 0) return;
    setLoading(true);
    apiFetch<ProblemItem[]>('/api/problems')
      .then((data) => {
        setProblems(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Error fetching problems:', err))
      .finally(() => setLoading(false));
  }, [initialProblems]);

  // Dynamically extract unique categories from problems
  const categories = useMemo(() => {
    const set = new Set<string>();
    problems.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [problems]);

  // Filter problems according to user inputs & privacy rules
  const filteredProblems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const isAdmin = currentUser && currentUser.role === 'admin';

    return problems.filter((p) => {
      // Privacy Guard: exclude private problems for regular users
      const isPrivate = Boolean(p.is_secret || p.visibility === 'private' || p.is_public === false);
      if (isPrivate && !isAdmin) return false;

      // Query Search
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        String(p.code).toLowerCase().includes(q);

      // Category Combobox
      const matchesCategory =
        !selectedCategory ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

      // Difficulty Button Group
      const matchesDiff =
        !selectedDiff ||
        p.difficulty === selectedDiff ||
        (selectedDiff === 'O‘rtacha' && (p.difficulty === 'O‘rta' || p.difficulty === 'O‘rtacha'));

      // Checkboxes
      if (onlyUnsolved && p.is_solved) return false;
      if (onlyFavorites && !p.is_favorite) return false;
      if (onlyUnofficial && !(p.score < 100 || p.difficulty === 'Oson')) return false;

      return matchesQuery && matchesCategory && matchesDiff;
    });
  }, [
    problems,
    searchQuery,
    selectedCategory,
    selectedDiff,
    onlyUnsolved,
    onlyFavorites,
    onlyUnofficial,
    currentUser,
  ]);

  // Pagination slice
  const totalPages = Math.ceil(filteredProblems.length / itemsPerPage) || 1;
  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProblems.slice(start, start + itemsPerPage);
  }, [filteredProblems, currentPage, itemsPerPage]);

  const toggleFavorite = async (code: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      alert('Sevimlilar ro‘yxatidan foydalanish uchun tizimga kiring!');
      return;
    }

    const targetProblem = problems.find((p) => String(p.code) === String(code));
    const isCurrentlyFav = Boolean(targetProblem?.is_favorite);
    const method = isCurrentlyFav ? 'DELETE' : 'POST';

    try {
      const data = await apiFetch<any>(`/api/problems/${code}/favorite`, { method });
      if (data && data.success) {
        setProblems((prev) =>
          prev.map((p) =>
            String(p.code) === String(code)
              ? { ...p, is_favorite: data.is_favorite }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
    }
  };

  const difficultyLevels = ['Barchasi', 'Oson', 'O‘rtacha', 'Qiyin', 'Ekspert'];

  return (
    <div className="problems-list-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.75rem 1rem' }}>
      
      {/* Top Filter Card (Title Header Removed as required by UI Cleanup) */}
      <div
        className="card"
        style={{
          background: 'var(--bg-surface, #101929)',
          border: '1px solid var(--border, #1e293b)',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            {/* Search Input with Neon Glow (Requirement 2) */}
            <div style={{ position: 'relative', minWidth: '260px', maxWidth: '380px', flex: 1 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Masala nomi yoki kodi (Enter)..."
                className="search-neon-glow"
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

            {/* Category Combobox */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '200px',
                height: '38px',
                padding: '0 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border, #1e293b)',
                background: 'var(--bg-input, #070d1a)',
                color: 'var(--text-main, #f8fafc)',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <option value="">Barcha mavzular</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#6366f1' }}>
            {filteredProblems.length} ta masala
          </span>
        </div>

        {/* Second Row: Difficulty Buttons & Checkboxes */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            borderTop: '1px solid var(--border, #1e293b)',
            paddingTop: '0.75rem'
          }}
        >
          {/* Difficulty Button Group */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #94a3b8)', marginRight: '0.35rem', fontWeight: 600 }}>
              Qiyinchilik:
            </span>
            {difficultyLevels.map((lvl) => {
              const isActive = (lvl === 'Barchasi' && !selectedDiff) || selectedDiff === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setSelectedDiff(lvl === 'Barchasi' ? '' : lvl);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border, #1e293b)',
                    background: isActive ? '#6366f1' : 'var(--bg-card, #0d162a)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {lvl}
                </button>
              );
            })}
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-main, #f8fafc)', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={onlyUnsolved}
                onChange={(e) => {
                  setOnlyUnsolved(e.target.checked);
                  setCurrentPage(1);
                }}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              Yechilmaganlar
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-main, #f8fafc)', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={onlyFavorites}
                onChange={(e) => {
                  setOnlyFavorites(e.target.checked);
                  setCurrentPage(1);
                }}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              Sevimlilar ⭐
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-main, #f8fafc)', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={onlyUnofficial}
                onChange={(e) => {
                  setOnlyUnofficial(e.target.checked);
                  setCurrentPage(1);
                }}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              Norasmiy masalalar
            </label>
          </div>
        </div>
      </div>

      {/* Problems Table */}
      <div
        className="card"
        style={{
          background: 'var(--bg-surface, #101929)',
          border: '1px solid var(--border, #1e293b)',
          borderRadius: '10px',
          overflow: 'hidden',
          padding: 0
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #1e293b)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '0.75rem 1rem', width: '60px' }}>№</th>
                <th style={{ padding: '0.75rem', width: '80px', textAlign: 'center' }}>Yechim</th>
                <th style={{ padding: '0.75rem', width: '60px', textAlign: 'center' }}>Holat</th>
                <th style={{ padding: '0.75rem', width: '60px', textAlign: 'center' }}>Sevimli</th>
                <th style={{ padding: '0.75rem 1rem' }}>Nomi</th>
                <th style={{ padding: '0.75rem' }}>Qiyinchilik</th>
                <th style={{ padding: '0.75rem' }}>Turkum</th>
                <th style={{ padding: '0.75rem' }}>Reyting</th>
                <th style={{ padding: '0.75rem' }}>Yechganlar</th>
                <th style={{ padding: '0.75rem' }}>Qabul qilingan</th>
                <th style={{ padding: '0.75rem' }}>Jami</th>
                <th style={{ padding: '0.75rem 1rem' }}>Muvaffaqiyat %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    Masalalar yuklanmoqda...
                  </td>
                </tr>
              ) : paginatedProblems.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    Masalalar topilmadi.
                  </td>
                </tr>
              ) : (
                paginatedProblems.map((p) => {
                  const diffColor =
                    p.difficulty === 'Oson'
                      ? '#10b981'
                      : p.difficulty === 'O‘rta' || p.difficulty === 'O‘rtacha'
                      ? '#f59e0b'
                      : p.difficulty === 'Qiyin'
                      ? '#ef4444'
                      : '#a855f7';

                  return (
                    <tr
                      key={p.code}
                      style={{
                        borderBottom: '1px solid var(--border, #1e293b)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <strong style={{ color: '#6366f1' }}>#{p.code}</strong>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <a
                          href={`/problems/${p.code}`}
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '4px',
                            border: '1px solid #6366f1',
                            color: '#6366f1',
                            textDecoration: 'none'
                          }}
                        >
                          Yechish
                        </a>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {p.is_solved ? (
                          <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1.1rem' }} title="Qabul qilingan">
                            ✓
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary, #64748b)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span
                          onClick={(e) => toggleFavorite(p.code, e)}
                          title="Sevimlilarga qo‘shish/o‘chirish"
                          style={{
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            userSelect: 'none',
                            color: p.is_favorite ? '#f59e0b' : 'var(--text-secondary, #64748b)',
                            textShadow: p.is_favorite ? '0 0 6px rgba(245, 158, 11, 0.5)' : 'none'
                          }}
                        >
                          {p.is_favorite ? '★' : '☆'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <a
                          href={`/problems/${p.code}`}
                          style={{
                            color: 'var(--text-main, #f8fafc)',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          {p.title}
                        </a>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: `${diffColor}18`,
                            color: diffColor,
                            border: `1px solid ${diffColor}40`
                          }}
                        >
                          {p.difficulty}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem' }}>
                        {p.category || 'Boshlang‘ich'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <strong>{p.score || 100}</strong>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#60a5fa', fontWeight: 600 }}>
                        {p.accepted_count}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                        {p.accepted_count}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem' }}>
                        {p.total_count}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              flex: 1,
                              height: '6px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                              minWidth: '60px'
                            }}
                          >
                            <div
                              style={{
                                width: `${p.acceptance_rate || 0}%`,
                                height: '100%',
                                background: '#10b981'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
                            {p.acceptance_rate || 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strict Dark Mode Pagination (Requirement 3: geometry h-9 w-9 gap-1.5 my-6) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 my-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', margin: '1.5rem 0' }}>
          {/* First & Prev */}
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            title="Birinchi sahifa"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              width: '36px',
              height: '36px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              fontSize: '0.875rem',
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#cbd5e1',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.4 : 1
            }}
          >
            «
          </button>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="Oldingi sahifa"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              width: '36px',
              height: '36px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              fontSize: '0.875rem',
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#cbd5e1',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.4 : 1
            }}
          >
            ‹
          </button>

          {/* Number buttons */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
            .map((page, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && page - prev > 1;
              const isActive = page === currentPage;

              return (
                <React.Fragment key={page}>
                  {showEllipsis && (
                    <span style={{ padding: '0 0.25rem', color: '#64748b', fontSize: '0.875rem' }}>...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={
                      isActive
                        ? 'h-9 w-9 flex items-center justify-center rounded-lg text-sm bg-blue-600 text-white font-semibold border-blue-500 shadow-sm shadow-blue-500/50'
                        : 'h-9 w-9 flex items-center justify-center rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                    style={{
                      width: '36px',
                      height: '36px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      background: isActive ? '#2563eb' : '#1e293b',
                      border: `1px solid ${isActive ? '#3b82f6' : '#334155'}`,
                      color: isActive ? '#ffffff' : '#cbd5e1',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 1px 4px rgba(59, 130, 246, 0.5)' : 'none'
                    }}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}

          {/* Next & Last */}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            title="Keyingi sahifa"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              width: '36px',
              height: '36px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              fontSize: '0.875rem',
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#cbd5e1',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.4 : 1
            }}
          >
            ›
          </button>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            title="Oxirgi sahifa"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              width: '36px',
              height: '36px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              fontSize: '0.875rem',
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#cbd5e1',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.4 : 1
            }}
          >
            »
          </button>
        </div>
      )}

    </div>
  );
};
export default ProblemsList;