'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import Navbar from '../../components/Navbar'
import {
  GraduationCap, Search, CheckCircle, Clock, Users, Github, Calendar,
  ArrowLeft, LogOut, BookOpen, Mail, User, TriangleAlert, XCircle, RefreshCw
} from 'lucide-react'

interface SubmissionInfo {
  id: string; group_number: number; project_name: string;
  leader_name: string; leader_email: string;
  github_link: string; members: any[]; submitted_at: string;
  department: string;
}
interface ProjectOption {
  id: string; name: string; active: boolean;
}
interface PortalSettings {
  submission_deadline?: string;
}
interface StudentProfile {
  id: string; email: string; name: string;
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [searchMatric, setSearchMatric] = useState('')
  const [submission, setSubmission] = useState<SubmissionInfo | null>(null)
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [filterProject, setFilterProject] = useState('')
  const [loadingSub, setLoadingSub] = useState(true)
  const [settings, setSettings] = useState<PortalSettings | null>(null)
  const [countdown, setCountdown] = useState('')
  const [profile, setProfile] = useState<StudentProfile | null>(null)

  useEffect(() => {
    fetch('/api/admin/projects').then(r => r.json()).then(d => {
      setProjects(d.projects || [])
    }).catch(() => {})
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      setSettings(d.settings || null)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setProfile(JSON.parse(stored)) } catch {}
    }
  }, [])

  useEffect(() => {
    if (profile?.email && !authLoading) {
      findSubmissionsForEmail(profile.email)
    } else if (!authLoading) {
      setLoadingSub(false)
    }
  }, [profile, authLoading])

  useEffect(() => {
    if (!settings?.submission_deadline) return
    const deadline = settings.submission_deadline
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) { setCountdown('Deadline passed'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${d}d ${h}h ${m}m ${s}s`)
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [settings])

  const findSubmissionsForEmail = async (email: string) => {
    setLoadingSub(true)
    try {
      const res = await fetch('/api/admin?type=submissions')
      const data = await res.json()
      const subs = data.submissions || []
      const found = subs.find((s: any) =>
        s.leader_email?.toLowerCase() === email.toLowerCase() ||
        (s.members || []).some((m: any) => {
          if (typeof m === 'string') return false
          return m.email?.toLowerCase() === email.toLowerCase()
        })
      )
      if (found) {
        setSubmission(found)
        setSearched(true)
      }
    } catch {} finally {
      setLoadingSub(false)
    }
  }

  const findSubmission = async () => {
    if (!searchMatric.trim()) return
    setSearching(true)
    setSearched(true)
    try {
      const pid = filterProject || undefined
      const url = pid ? `/api/admin?type=submissions&projectId=${pid}` : '/api/admin?type=submissions'
      const sRes = await fetch(url)
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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST'
  }

  if (authLoading) {
    return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <span className="spinner" />
    </div>
  }

  return (
    <div className="page">
      <Navbar />

      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 900 }}>
        {profile && (
          <div className="card fade-in" style={{
            padding: 24, marginBottom: 24,
            background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--bg-1) 100%)',
            border: '1px solid var(--border)',
            borderRadius: 16, position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: '#fff',
              }}>
                {getInitials(profile.name)}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{profile.name}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Mail size={12} /> {profile.email}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 12 }}>
                    <GraduationCap size={12} /> Student
                  </span>
                </p>
              </div>
              {submission && (
                <div style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: 'rgba(5,150,105,0.1)', color: '#34d399',
                  border: '1px solid rgba(5,150,105,0.2)',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <CheckCircle size={14} /> Submitted
                </div>
              )}
            </div>
          </div>
        )}

        {countdown && (
          <div className="card slide-up" style={{
            padding: 16, marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(5,150,105,0.05), rgba(13,148,136,0.05))',
            border: '1px solid rgba(5,150,105,0.15)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Clock size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {settings?.submission_deadline && new Date(settings.submission_deadline) > new Date()
                ? <>Submission deadline: <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: 15 }}>{countdown}</strong></>
                : <>Submission deadline has passed</>
              }
            </span>
          </div>
        )}

        {!loadingSub && !submission && profile && (
          <div className="card slide-up" style={{
            padding: 20, marginBottom: 24,
            border: '1px solid rgba(251,191,36,0.2)',
            background: 'rgba(251,191,36,0.03)',
            borderRadius: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <TriangleAlert size={20} style={{ color: '#f59e0b', marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#f59e0b' }}>No submission found</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  Your account doesn&apos;t have a submission yet. Your group leader needs to add your email or matric number when registering the group submission. 
                  Contact your class rep or group leader if you believe this is a mistake.
                </p>
              </div>
            </div>
          </div>
        )}

        {submission && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="card scale-in" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
                background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle size={22} style={{ color: '#34d399' }} />
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#34d399' }}>Submitted</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Status</p>
            </div>
            <div className="card scale-in" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
                background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users size={22} style={{ color: '#818cf8' }} />
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#818cf8' }}>{submission.members.length}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Group Members</p>
            </div>
            <div className="card scale-in" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
                background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Calendar size={22} style={{ color: '#f59e0b' }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                {new Date(submission.submitted_at).toLocaleDateString()}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Submitted On</p>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <input
              className="input"
              value={searchMatric}
              onChange={e => setSearchMatric(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && findSubmission()}
              placeholder="Search by matric number e.g. 2023/1/12345CS"
              style={{ flex: 1 }}
            />
            <button onClick={findSubmission} className="btn btn-primary" disabled={searching} style={{ whiteSpace: 'nowrap' }}>
              {searching ? <span className="spinner" /> : <><Search size={14} /> Search</>}
            </button>
          </div>
          {projects.length > 0 && (
            <div>
              <select
                className="input select"
                value={filterProject}
                onChange={e => setFilterProject(e.target.value)}
                style={{ width: '100%', fontSize: 12, padding: '6px 10px' }}
              >
                <option value="">All projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loadingSub && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <span className="spinner" />
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-3)' }}>Loading your submission...</p>
          </div>
        )}

        {searched && !searching && !loadingSub && (
          <>
            {submission ? (
              <div className="card slide-up" style={{
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid var(--border)',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(13,148,136,0.04))',
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span className="badge badge-violet">{submission.department}</span>
                    <span className="badge badge-cyan">Group {submission.group_number}</span>
                    <span className="badge badge-green">
                      <CheckCircle size={12} style={{ marginRight: 4 }} /> Submitted
                    </span>
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
                    <BookOpen size={20} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--primary)' }} />
                    {submission.project_name}
                  </h2>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div style={{
                      padding: 12, borderRadius: 10,
                      background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)',
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                        <User size={11} style={{ marginRight: 4 }} /> Group Leader
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{submission.leader_name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{submission.leader_email}</p>
                    </div>
                    <div style={{
                      padding: 12, borderRadius: 10,
                      background: 'rgba(5,150,105,0.04)', border: '1px solid rgba(5,150,105,0.1)',
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                        <Github size={11} style={{ marginRight: 4 }} /> GitHub
                      </p>
                      <a href={submission.github_link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, color: 'var(--primary-light)', wordBreak: 'break-all' }}>
                        {submission.github_link.replace('https://github.com/', '')}
                      </a>
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                      <Users size={12} style={{ marginRight: 4 }} /> Group Members ({submission.members.length})
                    </p>
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6
                    }}>
                      {submission.members.map((m: any, idx: number) => {
                        const name = typeof m === 'string' ? m : m.name
                        const matric = typeof m === 'string' ? '' : m.matric
                        const isLeader = typeof m !== 'string' && m.email?.toLowerCase() === submission.leader_email?.toLowerCase()
                        return (
                          <div key={idx} className="member-tag" style={{
                            padding: '8px 12px', borderRadius: 8,
                            border: isLeader ? '1px solid rgba(5,150,105,0.3)' : '1px solid var(--border)',
                            background: isLeader ? 'rgba(5,150,105,0.04)' : 'transparent',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{
                                width: 24, height: 24, borderRadius: 6,
                                background: isLeader ? 'var(--primary)' : 'var(--bg-2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 700, color: isLeader ? '#fff' : 'var(--text-3)',
                              }}>
                                {name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 500 }}>
                                  {name}
                                  {isLeader && <span style={{ fontSize: 10, color: '#34d399', marginLeft: 4 }}>Leader</span>}
                                </p>
                                {matric && <p className="mono" style={{ fontSize: 10, color: 'var(--text-3)' }}>{matric}</p>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'rgba(251,191,36,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Search size={28} style={{ color: '#f59e0b' }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No submission found</h3>
                <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
                  No submission matches this matric number.
                  {profile && ' If you were added by your group leader, make sure your matric number matches exactly.'}
                </p>
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-secondary" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
          {profile && submission && (
            <button onClick={() => findSubmissionsForEmail(profile.email)}
              className="btn btn-secondary" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={14} /> Refresh
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
