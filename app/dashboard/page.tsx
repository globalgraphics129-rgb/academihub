'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import ThemeToggle from '../components/ThemeToggle'

interface GroupInfo {
  id: string; group_number: number; leader_name: string; leader_email: string;
  leader_phone: string; project_name: string; submitted: boolean; created_at: string;
}

interface DepartmentInfo {
  id: string; department: string; number_of_groups: number;
  rep_name: string; rep_email: string; rep_phone: string;
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [department, setDepartment] = useState<DepartmentInfo | null>(null)
  const [groups, setGroups] = useState<GroupInfo[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [aiReply, setAiReply] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }

    if (user.department_id) {
      Promise.all([
        fetch(`/api/admin?type=departments`).then(r => r.json()),
        fetch(`/api/register-group?departmentId=${user.department_id}`).then(r => r.json()),
      ]).then(([deptData, groupsData]) => {
        const found = (deptData.departments || []).find((d: any) => d.id === user.department_id)
        setDepartment(found || null)
        setGroups(groupsData.groups || [])
      }).catch(() => {}).finally(() => setLoadingData(false))
    } else {
      setLoadingData(false)
    }
  }, [user, loading, router])

  const askAI = async () => {
    if (!aiMessage.trim()) return
    setAiLoading(true)
    setAiReply('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: aiMessage }),
      })
      const data = await res.json()
      setAiReply(data.reply || 'No response')
    } catch {
      setAiReply('Sorry, AI service is unavailable.')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <span className="spinner" />
    </div>
  }

  const submittedCount = groups.filter(g => g.submitted).length

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">{'\uD83C\uDF93'}</div>
            <span className="nav-logo-text gradient-text">AcademiHub</span>
          </Link>
          <div className="nav-links">
            <span className="badge badge-violet" style={{ fontSize: 11 }}>
              {user?.role === 'admin' ? 'Admin' : 'Class Rep'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{user?.name}</span>
            <ThemeToggle />
            <button onClick={logout} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>
              {department ? department.department : 'My Dashboard'}
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
              Welcome back, {user?.name}
            </p>
          </div>
          {!user?.department_id && (
            <Link href="/register-department" className="btn btn-primary" style={{ fontSize: 13 }}>
              {'\uD83C\uDFDB\uFE0F'} Register Department
            </Link>
          )}
        </div>

        {department && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Groups', value: department.number_of_groups, icon: '\uD83D\uDC65', color: 'var(--primary)' },
                { label: 'Submitted', value: submittedCount, icon: '\u2713', color: '#10b981' },
                { label: 'Pending', value: department.number_of_groups - submittedCount, icon: '\u23F3', color: '#f59e0b' },
                { label: 'Completion', value: `${department.number_of_groups > 0 ? Math.round(submittedCount / department.number_of_groups * 100) : 0}%`, icon: '\uD83D\uDCCA', color: 'var(--secondary)' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                  <div className="stat-number" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Groups</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {groups.map(g => (
                <div key={g.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700 }}>Group {g.group_number}</span>
                      <span className={`badge ${g.submitted ? 'badge-green' : 'badge-violet'}`}>
                        {g.submitted ? '\u2713 Submitted' : 'Pending'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
                      {g.project_name} &middot; Lead: {g.leader_name}
                    </p>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'right' }}>
                    {g.leader_email}
                  </div>
                </div>
              ))}
              {groups.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>{'\uD83D\uDCCB'}</p>
                  <p>No groups registered yet.</p>
                </div>
              )}
            </div>
          </>
        )}

        {!department && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>{'\uD83C\uDFDB\uFE0F'}</p>
            <p style={{ fontSize: 16, marginBottom: 8 }}>No department linked to your account yet.</p>
            <p style={{ fontSize: 13, marginBottom: 20 }}>Register a department or ask an admin to link your account.</p>
            <Link href="/register-department" className="btn btn-primary">Register Department</Link>
          </div>
        )}

        {/* AI Assistant FAB */}
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
          {aiOpen && (
            <div className="card" style={{
              position: 'absolute', bottom: 56, right: 0, width: 340, padding: 0,
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)', overflow: 'hidden',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                  {'\uD83E\uDD16'} AcademiBot
                </span>
                <button onClick={() => setAiOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, padding: 0 }}>
                  &times;
                </button>
              </div>
              <div style={{ padding: 16, maxHeight: 260, overflowY: 'auto' }}>
                {aiReply && (
                  <div style={{
                    background: 'rgba(5,150,105,0.08)', borderRadius: 10,
                    padding: '10px 14px', marginBottom: 12, fontSize: 13, lineHeight: 1.5,
                  }}>
                    {aiReply}
                  </div>
                )}
                {aiLoading && <p style={{ fontSize: 12, color: 'var(--text-3)' }}><span className="spinner" /> Thinking...</p>}
              </div>
              <div style={{ padding: '8px 12px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  value={aiMessage}
                  onChange={e => setAiMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askAI()}
                  placeholder="Ask anything..."
                  style={{ fontSize: 12, padding: '8px 12px' }}
                />
                <button onClick={askAI} disabled={aiLoading}
                  style={{
                    background: 'var(--primary)', border: 'none', color: '#fff',
                    borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 14,
                  }}>
                  {'\u27A1'}
                </button>
              </div>
            </div>
          )}
          <button onClick={() => setAiOpen(!aiOpen)}
            style={{
              width: 48, height: 48, borderRadius: '50%', border: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff', fontSize: 22, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(5,150,105,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {'\uD83E\uDD16'}
          </button>
        </div>
      </div>
    </div>
  )
}
