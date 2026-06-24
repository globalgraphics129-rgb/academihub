'use client'
import Navbar from './components/Navbar'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GraduationCap, Users, Rocket, Building2, ChevronRight, Lock, ArrowRight, BookOpen, CheckCircle } from 'lucide-react'

interface Project {
  id: string; name: string; description: string | null; active: boolean; created_at: string;
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [portalOpen, setPortalOpen] = useState(true)
  const [closesAt, setClosesAt] = useState<string | null>(null)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  const [projects, setProjects] = useState<Project[]>([])
  const [registeredDepts, setRegisteredDepts] = useState<string[]>([])
  const [activeSimTab, setActiveSimTab] = useState<'rep' | 'group' | 'admin'>('rep')

  useEffect(() => {
    setMounted(true)
    fetch('/api/portal-settings')
      .then(r => r.json())
      .then(data => {
        if (data.closes_at) {
          setClosesAt(data.closes_at)
          setPortalOpen(new Date(data.closes_at).getTime() > Date.now())
        } else {
          setClosesAt(null)
          setPortalOpen(true)
        }
      })
      .catch(() => {})
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects((data.projects || []).filter((p: Project) => p.active)))
      .catch(() => {})
    fetch('/api/register-department')
      .then(r => r.json())
      .then(data => {
        if (data.departments) {
          setRegisteredDepts(data.departments.map((d: any) => d.department))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!closesAt) return
    const tick = () => {
      const diff = new Date(closesAt).getTime() - Date.now()
      if (diff <= 0) {
        setPortalOpen(false)
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 })
        return
      }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [closesAt])

  return (
    <div className="page" style={{ position: 'relative', zIndex: 1 }}>
      {/* Spotlight Ambient Orbs */}
      <div className="spotlight" style={{ top: '-10%', left: '20%' }} />
      <div className="spotlight" style={{ bottom: '10%', right: '10%', background: 'radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 65%)' }} />

      <Navbar />

      {!portalOpen && (
        <div style={{
          background: 'linear-gradient(135deg, #dc2626, #ea580c)',
          padding: '12px 16px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
        }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Lock size={15} />
            Submissions are now closed. The portal is no longer accepting academic projects.
          </span>
        </div>
      )}

      {/* Hero Section */}
      <section style={{
        padding: '120px 24px 80px',
        position: 'relative',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 48,
          alignItems: 'center',
        }}>
          {/* Hero Content */}
          <div style={{ textAlign: 'left', animation: mounted ? 'fade-up 0.6s ease both' : 'none' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: portalOpen ? 'rgba(16,185,129,0.1)' : 'rgba(220,38,38,0.1)',
              border: `1px solid ${portalOpen ? 'rgba(16,185,129,0.2)' : 'rgba(220,38,38,0.2)'}`,
              borderRadius: 20,
              padding: '6px 14px',
              marginBottom: 24,
            }}>
              <span className="glow-pulse" style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: portalOpen ? '#10b981' : '#ef4444',
                display: 'inline-block',
                boxShadow: `0 0 8px ${portalOpen ? '#10b981' : '#ef4444'}`
              }} />
              <span style={{ fontSize: 11, color: portalOpen ? 'var(--primary-light)' : '#fca5a5', fontWeight: 700, letterSpacing: 1 }}>
                {portalOpen ? 'ACADEMIHUB PORTAL OPEN' : 'SUBMISSIONS CLOSED'}
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 800,
              letterSpacing: '-2px',
              lineHeight: 1.05,
              marginBottom: 20,
              color: 'var(--text)',
            }}>
              Academic Project <br />
              <span className="shimmer-text">Submission Hub</span>
            </h1>

            <p style={{
              fontSize: 16,
              color: 'var(--text-2)',
              lineHeight: 1.6,
              marginBottom: 36,
              maxWidth: 520,
            }}>
              Streamline project team registration, automatically parse members lists, and submit final source files directly to lecturer repositories in seconds.
            </p>

            <div className="hero-btns">
              <Link href="/register-department" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 14 }}>
                <Building2 size={16} />
                Class Reps
              </Link>
              <Link href="/register-group" className="btn btn-cyan" style={{ padding: '14px 28px', fontSize: 14 }}>
                <Users size={16} />
                Groups Signup
              </Link>
              <Link href="/submit" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: 14 }}>
                <Rocket size={16} />
                Submit Project
              </Link>
            </div>
          </div>

          {/* Interactive Console Simulation */}
          <div style={{ animation: mounted ? 'fade-up 0.8s 0.1s ease both' : 'none' }}>
            <div className="developer-console">
              <div className="console-header">
                <div className="console-dots">
                  <div className="console-dot red" />
                  <div className="console-dot yellow" />
                  <div className="console-dot green" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setActiveSimTab('rep')}
                    className={`console-tab ${activeSimTab === 'rep' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Class Rep
                  </button>
                  <button
                    onClick={() => setActiveSimTab('group')}
                    className={`console-tab ${activeSimTab === 'group' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Group Leader
                  </button>
                  <button
                    onClick={() => setActiveSimTab('admin')}
                    className={`console-tab ${activeSimTab === 'admin' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Lecturer
                  </button>
                </div>
              </div>
              <div className="console-body">
                {activeSimTab === 'rep' && (
                  <>
                    <div className="console-line">
                      <span className="console-ln">1</span>
                      <span className="console-text white">$ academihub register --dept &quot;Software Engineering&quot; --groups 12</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">2</span>
                      <span className="console-text muted"># [09:42:01] Initializing department registration...</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">3</span>
                      <span className="console-text muted"># [09:42:02] Establishing handshake with Supabase database...</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">4</span>
                      <span className="console-text accent">&gt;&gt; DB response: SUCCESS (ID: b63e-67c265e2)</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">5</span>
                      <span className="console-text muted"># [09:42:03] Creating 12 group tokens for students... Done.</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">6</span>
                      <span className="console-text accent">&gt;&gt; Link: https://academihub.dev/register-group?dept=se</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">7</span>
                      <span className="console-text">Department &quot;Software Engineering&quot; is now ONLINE <span className="console-cursor" /></span>
                    </div>
                  </>
                )}
                {activeSimTab === 'group' && (
                  <>
                    <div className="console-line">
                      <span className="console-ln">1</span>
                      <span className="console-text white">$ academihub join --dept &quot;SE&quot; --group 4 --members ./roster.pdf</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">2</span>
                      <span className="console-text muted"># [10:11:15] Validating group registration constraints...</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">3</span>
                      <span className="console-text muted"># [10:11:16] Reading PDF member list with parser engine...</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">4</span>
                      <span className="console-text accent">&gt;&gt; Extracted 4 student members:</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">5</span>
                      <span className="console-text white">   - Alice Johnson (Matric: SCI12/0045)</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">6</span>
                      <span className="console-text white">   - Bob Smith (Matric: SCI12/0092)</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">7</span>
                      <span className="console-text accent">&gt;&gt; Group registered. Awaiting Github link submit. <span className="console-cursor" /></span>
                    </div>
                  </>
                )}
                {activeSimTab === 'admin' && (
                  <>
                    <div className="console-line">
                      <span className="console-ln">1</span>
                      <span className="console-text white">$ academihub admin --generate-report --export-pdf</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">2</span>
                      <span className="console-text muted"># [11:05:00] Initializing lecturer report generator...</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">3</span>
                      <span className="console-text muted"># [11:05:01] Authenticated via Bearer session key...</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">4</span>
                      <span className="console-text accent">&gt;&gt; Fetching submissions for all projects...</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">5</span>
                      <span className="console-text muted"># [11:05:03] Compiling PDF documents for 12 departments...</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">6</span>
                      <span className="console-text accent">&gt;&gt; Generated: AcademiHub-Report-2026.pdf (242KB)</span>
                    </div>
                    <div className="console-line">
                      <span className="console-ln">7</span>
                      <span className="console-text">Ready for download. Status: ACTIVE <span className="console-cursor" /></span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Dials / Portal Info Cards */}
      <section style={{ padding: '0 24px 60px', position: 'relative', zIndex: 2 }}>
        <div className="container">
          <div className="stats-grid">
            {/* Dept Count */}
            <div className="glow-card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ color: 'var(--primary-light)', marginBottom: 8 }}><Building2 size={24} style={{ margin: '0 auto' }} /></div>
              <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                {registeredDepts.length}
              </span>
              <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Departments Registered
              </div>
            </div>

            {/* Project Title */}
            <div className="glow-card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ color: 'var(--secondary-light)', marginBottom: 8 }}><BookOpen size={24} style={{ margin: '0 auto' }} /></div>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'block', margin: '12px 0 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {projects[0]?.name || 'Default Project'}
              </span>
              <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Active Evaluation Course
              </div>
            </div>

            {/* Portal Settings Timer */}
            <div className="glow-card" style={{ padding: 24, textAlign: 'center', gridColumn: portalOpen && closesAt ? 'span 2' : 'span 1' }}>
              {portalOpen && closesAt && (countdown.days > 0 || countdown.hours > 0 || countdown.mins > 0 || countdown.secs > 0) ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
                    {[
                      { l: 'd', v: countdown.days },
                      { l: 'h', v: countdown.hours },
                      { l: 'm', v: countdown.mins },
                      { l: 's', v: countdown.secs },
                    ].map((item) => (
                      <div key={item.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary-light)', fontFamily: 'var(--font-mono)', minWidth: 32 }}>
                          {String(item.v).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: 8, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>{item.l}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Remaining Until Closes
                  </div>
                </>
              ) : (
                <>
                  <div style={{ color: '#ef4444', marginBottom: 8 }}><Lock size={24} style={{ margin: '0 auto' }} /></div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#fca5a5' }}>
                    {portalOpen ? 'NO DEADLINE SET' : 'CLOSED'}
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Submission Deadline Status
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Walkthrough */}
      <section style={{ padding: '60px 24px 80px', borderTop: '1px solid rgba(16, 185, 129, 0.1)' }}>
        <div className="container">
          <p className="section-eyebrow" style={{ textAlign: 'center' }}>How it works</p>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 48, letterSpacing: -1 }}>
            Automated Submission Pipeline
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                step: '01', icon: Building2, title: 'Department Setup',
                desc: 'Class representatives register their course and allocate precise group quantities to prevent duplicates.',
                color: '#34d399', link: '/register-department', cta: 'Configure Department'
              },
              {
                step: '02', icon: Users, title: 'Team Roster Signup',
                desc: 'Group leaders register their number, auto-extract student details, and assign roles.',
                color: '#2dd4bf', link: '/register-group', cta: 'Assemble Team'
              },
              {
                step: '03', icon: Rocket, title: 'Project Verification',
                desc: 'Upload files and specify Github repo targets. The server runs validity checks instantly.',
                color: '#10b981', link: '/submit', cta: 'Submit Code'
              },
            ].map((item, i) => (
              <div key={i} className="glow-card" style={{ padding: 32 }}>
                <div style={{
                  position: 'absolute', top: -10, right: 10,
                  fontSize: 72, fontWeight: 900,
                  color: item.color, opacity: 0.05, lineHeight: 1, pointerEvents: 'none',
                  fontFamily: 'var(--font-mono)'
                }}>{item.step}</div>
                <div style={{ marginBottom: 20, display: 'inline-flex', padding: 12, borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <item.icon size={28} color={item.color} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 24 }}>{item.desc}</p>
                <Link href={item.link} style={{
                  fontSize: 13, fontWeight: 600,
                  color: item.color, display: 'inline-flex', alignItems: 'center', gap: 6
                }}>
                  {item.cta} <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scrolling Registered Departments Marquee */}
      <section style={{ padding: '40px 0 80px', overflow: 'hidden', borderTop: '1px solid rgba(16, 185, 129, 0.1)' }}>
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>
          Live Registered Ticker
        </p>
        {registeredDepts.length > 0 ? (
          <div className="ticker-tape">
            <div className="ticker-tape-scroll">
              {[...registeredDepts, ...registeredDepts, ...registeredDepts].map((dep, i) => (
                <div key={i} className="ticker-item">
                  <CheckCircle size={14} />
                  <span>{dep} REGISTERED</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
            Awaiting first course registration...
          </p>
        )}
      </section>
    </div>
  )
}
