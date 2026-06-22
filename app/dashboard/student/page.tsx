'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import ThemeToggle from '../../components/ThemeToggle'

interface SubmissionInfo {
  id: string; group_number: number; project_name: string;
  leader_name: string; leader_email: string;
  github_link: string; members: any[]; submitted_at: string;
  department: string;
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [searchMatric, setSearchMatric] = useState('')
  const [submission, setSubmission] = useState<SubmissionInfo | null>(null)
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)

  const findSubmission = async () => {
    if (!searchMatric.trim()) return
    setSearching(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/portal-settings`)
      // We need to search by matric across all submissions
      // Since there's no API for this, let's load submissions and filter client-side
      const sRes = await fetch('/api/admin?type=submissions')
      const data = await sRes.json()
      const subs = data.submissions || []
      const found = subs.find((s: any) =>
        (s.members || []).some((m: any) => {
          if (typeof m === 'string') return m.toLowerCase().includes(searchMatric.toLowerCase())
          return (m.matric || '').toLowerCase() === searchMatric.toLowerCase()
        })
      )
      setSubmission(found || null)
    } catch {
      setSubmission(null)
    } finally {
      setSearching(false)
    }
  }

  if (loading) {
    return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <span className="spinner" />
    </div>
  }

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">{'\uD83C\uDF93'}</div>
            <span className="nav-logo-text gradient-text">AcademiHub</span>
          </Link>
          <div className="nav-links">
            <ThemeToggle />
            {user && (
              <button onClick={logout} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
                Sign Out
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 60, paddingBottom: 60, maxWidth: 640 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>
            {'\uD83C\uDF93'} Student Dashboard
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            Enter your matric number to view your submission status
          </p>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="input"
              value={searchMatric}
              onChange={e => setSearchMatric(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && findSubmission()}
              placeholder="e.g. 2023/1/12345CS"
              style={{ flex: 1 }}
            />
            <button onClick={findSubmission} className="btn btn-primary" disabled={searching} style={{ whiteSpace: 'nowrap' }}>
              {searching ? <span className="spinner" /> : 'Search'}
            </button>
          </div>
        </div>

        {searched && !searching && (
          <>
            {submission ? (
              <div className="card">
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span className="badge badge-violet">{submission.department}</span>
                  <span className="badge badge-cyan">Group {submission.group_number}</span>
                  <span className="badge badge-green">{'\u2713'} Submitted</span>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{submission.project_name}</h2>

                <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6 }}>
                  <p><strong>Group Leader:</strong> {submission.leader_name} ({submission.leader_email})</p>
                  <p><strong>GitHub:</strong> <a href={submission.github_link} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--primary-light)' }}>{submission.github_link}</a></p>
                  <p><strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
                </div>

                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Group Members ({submission.members.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {submission.members.map((m: any, idx: number) => {
                      const name = typeof m === 'string' ? m : m.name
                      const matric = typeof m === 'string' ? '' : m.matric
                      return (
                        <span key={idx} className="member-tag">
                          {name}
                          {matric && <span className="mono" style={{ fontSize: 10 }}>{matric}</span>}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>{'\uD83D\uDD0D'}</p>
                <p>No submission found for this matric number.</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Make sure you enter it exactly as registered by your group leader.</p>
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link href="/" className="btn btn-secondary" style={{ fontSize: 13 }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
