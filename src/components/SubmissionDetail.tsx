import React, { useState, useEffect } from 'react';
import { apiFetch } from './apiClient';

export interface TestResult {
  test_number: number;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit' | 'Memory Limit' | 'Runtime Error' | 'Presentation Error' | string;
  time_spent?: number;
  memory_used?: number;
}

export interface SubmissionData {
  id: number;
  user_id: number;
  username: string;
  full_name?: string;
  problem_id: number;
  problem_code: string | number;
  problem_title: string;
  contest_id?: number | null;
  language: string;
  status: string;
  score?: number | null;
  time_spent?: number;
  memory_used?: number;
  created_at: string;
  code?: string;
  compiler_output?: string;
  test_details?: TestResult[];
}

export interface SubmissionDetailProps {
  submissionId: number | string;
  initialData?: SubmissionData | null;
  currentUser?: { id: number; username: string; role: string } | null;
}

export const SubmissionDetail: React.FC<SubmissionDetailProps> = ({
  submissionId,
  initialData = null,
  currentUser = null
}) => {
  const [submission, setSubmission] = useState<SubmissionData | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setSubmission(initialData);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiFetch<any>(`/api/submissions/${submissionId}`)
      .then((data) => {
        setSubmission(data.submission || null);
        setLoading(false);
      })
      .catch((err: any) => {
        setErrorStatus(err.status || 500);
        setErrorMessage(err.message || 'Urinish ma‘lumotlarini yuklashda xatolik yuz berdi');
        setLoading(false);
      });
  }, [submissionId, initialData]);

  const handleCopyCode = () => {
    if (!submission?.code) return;
    navigator.clipboard.writeText(submission.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 403 Forbidden State (Code Privacy)
  if (errorStatus === 403) {
    return (
      <div
        className="card"
        style={{
          maxWidth: '650px',
          margin: '3rem auto',
          padding: '3rem 2rem',
          textAlign: 'center',
          background: 'var(--bg-surface, #101929)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px'
        }}
      >
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ color: '#ef4444', fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Ruxsat berilmadi (403 Forbidden)
        </h2>
        <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          {errorMessage || 'Siz faqat o‘zingiz yuborgan urinishlarning kodi va testlarini ko‘ra olasiz. Boshqa foydalanuvchilar kodlari maxfiy hisoblanadi.'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a
            href="/submissions"
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border, #1e293b)',
              color: 'var(--text-main, #f8fafc)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            ← Urinishlar ro‘yxati
          </a>
          <a
            href="/problems"
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              background: '#6366f1',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            Masalalar arxivi
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary, #94a3b8)' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Urinish tafsilotlari yuklanmoqda...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary, #94a3b8)' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{errorMessage || 'Urinish topilmadi.'}</div>
      </div>
    );
  }

  const isAccepted = submission.status === 'Accepted';
  const isCompilationError = submission.status.startsWith('Compilation Error');
  const codeLines = (submission.code || '').split('\n');

  return (
    <div className="submission-detail-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* Top Header Card (Metadata) */}
      <div
        className="card"
        style={{
          background: 'var(--bg-surface, #101929)',
          border: '1px solid var(--border, #1e293b)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #f8fafc)' }}>
              Urinish #{submission.id}
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>
              Yuborilgan sana: {new Date(submission.created_at).toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                background: isAccepted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isAccepted ? '#34d399' : '#f87171',
                border: `1px solid ${isAccepted ? '#10b981' : '#ef4444'}`
              }}
            >
              {submission.status}
            </span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border, #1e293b)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', display: 'block' }}>Masala</span>
            <a
              href={`/problems/${submission.problem_code}`}
              style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}
            >
              #{submission.problem_code} - {submission.problem_title}
            </a>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', display: 'block' }}>Foydalanuvchi</span>
            <strong style={{ color: 'var(--text-main, #f8fafc)', fontSize: '0.95rem' }}>
              {submission.full_name || submission.username} (@{submission.username})
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', display: 'block' }}>Dasturlash tili</span>
            <code style={{ fontSize: '0.9rem', color: '#a855f7' }}>{submission.language}</code>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', display: 'block' }}>CPU Vaqt / RAM Xotira</span>
            <strong style={{ color: 'var(--text-main, #f8fafc)', fontSize: '0.95rem' }}>
              {submission.time_spent || 0} ms / {submission.memory_used || 0} KB
            </strong>
          </div>
        </div>
      </div>

      {/* Compilation Error Block if applicable */}
      {isCompilationError && submission.compiler_output && (
        <div
          style={{
            background: '#190a0f',
            border: '1px solid #991b1b',
            borderRadius: '10px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ color: '#f87171', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            ⚠️ Kompilyatsiya Xatosi (Stderr)
          </div>
          <pre style={{ margin: 0, fontFamily: 'Consolas, monospace', fontSize: '0.85rem', color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {submission.compiler_output}
          </pre>
        </div>
      )}

      {/* Code Viewer Box */}
      {submission.code ? (
        <div
          style={{
            background: '#090d16',
            border: '1px solid var(--border, #1e293b)',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '1.5rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.65rem 1rem',
              background: '#0f172a',
              borderBottom: '1px solid var(--border, #1e293b)'
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)' }}>
              Manba kodi ({submission.language})
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '0.3rem 0.75rem',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {copied ? '✓ Nusxalandi' : '📋 Nusxa olish'}
            </button>
          </div>

          <div style={{ display: 'flex', fontFamily: 'Consolas, monospace', fontSize: '0.9rem', lineHeight: 1.6, overflowX: 'auto' }}>
            {/* Gutter */}
            <div
              style={{
                userSelect: 'none',
                color: '#475569',
                textAlign: 'right',
                padding: '0.75rem 0.75rem 0.75rem 0.5rem',
                borderRight: '1px solid #1e293b',
                minWidth: '3.5rem',
                background: '#070b12'
              }}
            >
              {codeLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Body */}
            <pre style={{ margin: 0, padding: '0.75rem 1rem', color: '#f8fafc', whiteSpace: 'pre', tabSize: 4, flex: 1 }}>
              {submission.code}
            </pre>
          </div>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)' }}>
          Kodni ko‘rish huquqi cheklangan.
        </div>
      )}

      {/* Test Results Badges */}
      {submission.test_details && submission.test_details.length > 0 && (
        <div
          className="card"
          style={{
            background: 'var(--bg-surface, #101929)',
            border: '1px solid var(--border, #1e293b)',
            borderRadius: '10px',
            padding: '1.25rem'
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-main, #f8fafc)' }}>
            Test natijalari ({submission.test_details.length} ta test)
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {submission.test_details.map((t, idx) => {
              const isTestAc = t.status === 'Accepted';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: isTestAc ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.18)',
                    color: isTestAc ? '#34d399' : '#f87171',
                    border: `1px solid ${isTestAc ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.5)'}`
                  }}
                >
                  <span>#{t.test_number || idx + 1}: {t.status}</span>
                  {t.time_spent !== undefined && (
                    <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>({t.time_spent} ms)</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
export default SubmissionDetail;