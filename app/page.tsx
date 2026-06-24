'use client'
import Navbar from './components/Navbar'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GraduationCap, Users, Rocket, Building2, ChevronRight, Lock, ArrowRight, BookOpen } from 'lucide-react'

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
      {/* Floating background particles */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)',
          top: '10%', left: '-5%',
          animation: 'blob-drift 20s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 70%)',
          bottom: '20%', right: '-5%',
          animation: 'blob-drift-2 25s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(5,150,105,0.05) 0%, transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          animation: 'breathe 8s ease-in-out infinite',
        }} />
        {/* Floating geometric shapes */}
        <div style={{
          position: 'absolute', width: 12, height: 12, borderRadius: 2,
          background: 'rgba(5,150,105,0.15)', top: '15%', left: '20%',
          animation: 'float-slow 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 8, height: 8, borderRadius: '50%',
          background: 'rgba(13,148,136,0.2)', top: '30%', right: '25%',
          animation: 'float-slow 8s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', width: 6, height: 6, borderRadius: '50%',
          background: 'rgba(5,150,105,0.15)', bottom: '25%', left: '30%',
          animation: 'float-slow 7s ease-in-out 1s infinite',
        }} />
        <div style={{
          position: 'absolute', width: 10, height: 10, borderRadius: 2,
          background: 'rgba(13,148,136,0.12)', bottom: '35%', right: '15%',
          animation: 'float-slow 9s ease-in-out 0.5s infinite',
        }} />
        <div style={{
          position: 'absolute', width: 16, height: 16, borderRadius: '50%',
          background: 'rgba(5,150,105,0.06)', top: '60%', left: '10%',
          animation: 'float-slow 11s ease-in-out 2s infinite',
        }} />
        <div style={{
          position: 'absolute', width: 7, height: 7, borderRadius: 1,
          background: 'rgba(13,148,136,0.15)', top: '20%', right: '40%',
          animation: 'float-slow 5s ease-in-out 0.3s infinite',
        }} />
      </div>

      <Navbar />

      {!portalOpen && (
        <div style={{
          background: 'linear-gradient(135deg, #dc2626, #ea580c)',
          padding: '10px 16px',
          textAlign: 'center',
        }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
            <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            Submissions are now closed. The portal is no longer accepting projects.
          </span>
        </div>
      )}

      <section style={{
        padding: '100px 24px 60px', textAlign: 'center',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(5,150,105,0.03) 0%, transparent 60%, transparent 100%)',
          backgroundSize: '200% 200%',
          animation: 'hero-gradient 15s ease infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: portalOpen ? 'rgba(5,150,105,0.12)' : 'rgba(220,38,38,0.12)',
          border: `1px solid ${portalOpen ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.3)'}`,
          borderRadius: 20, padding: '6px 16px', marginBottom: 24,
          animation: mounted ? 'fade-up 0.5s ease forwards' : 'none',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: portalOpen ? '#10b981' : '#ef4444',
            display: 'inline-block',
            boxShadow: `0 0 8px ${portalOpen ? '#10b981' : '#ef4444'}`
          }} />
          <span style={{ fontSize: 12, color: portalOpen ? 'var(--primary-light)' : '#fca5a5', fontWeight: 600, letterSpacing: 1 }}>
            {portalOpen ? 'SUBMISSIONS OPEN' : 'SUBMISSIONS CLOSED'}
          </span>
        </div>

        {portalOpen && closesAt && (countdown.days > 0 || countdown.hours > 0 || countdown.mins > 0 || countdown.secs > 0) && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            marginBottom: 28,
            animation: mounted ? 'fade-up 0.5s 0.05s ease both' : 'none',
          }}>
            {[
              { label: 'Days', value: countdown.days },
              { label: 'Hours', value: countdown.hours },
              { label: 'Mins', value: countdown.mins },
              { label: 'Secs', value: countdown.secs },
            ].map((item, i) => (
              <div key={item.label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: 'rgba(5,150,105,0.08)',
                border: '1px solid rgba(5,150,105,0.2)',
                borderRadius: 12, padding: '10px 16px', minWidth: 72,
              }}>
                <span style={{
                  fontSize: 24, fontWeight: 800, color: 'var(--primary-light)',
                  lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                }}>
                  {String(item.value).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                  {item.label}
                </span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, maxWidth: 140, textAlign: 'left', lineHeight: 1.4 }}>
              remaining until portal closes
            </div>
          </div>
        )}

        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 60px)', fontWeight: 800, letterSpacing: '-2px',
          lineHeight: 1.1, maxWidth: 700, margin: '0 auto 16px',
          animation: mounted ? 'fade-up 0.6s 0.1s ease both' : 'none', opacity: 0
        }}>
          Academic Project <span className="shimmer-text">Submission Hub</span>
        </h1>

        <p style={{
          fontSize: 16, color: 'var(--text-2)', maxWidth: 500, margin: '0 auto 40px',
          lineHeight: 1.7,
          animation: mounted ? 'fade-up 0.6s 0.2s ease both' : 'none', opacity: 0
        }}>
          One place for every department, every group. Register, collaborate, and submit your projects.
        </p>

        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
          animation: mounted ? 'fade-up 0.6s 0.3s ease both' : 'none', opacity: 0
        }}>
          <Link href="/register-department" className="btn btn-primary" style={{ fontSize: 15, padding: '14px 28px' }}>
            <Building2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Class Reps
          </Link>
          <Link href="/register-group" className="btn btn-cyan" style={{ fontSize: 15, padding: '14px 28px' }}>
            <Users size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Groups
          </Link>
          <Link href="/submit" className="btn btn-secondary" style={{ fontSize: 15, padding: '14px 28px' }}>
            <Rocket size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Submit
          </Link>
        </div>
      </section>

      <section style={{ padding: '40px 24px 60px' }}>
        <div className="container">
          <p className="section-eyebrow" style={{ textAlign: 'center' }}>How it works</p>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 40, letterSpacing: -1 }}>
            Three simple steps
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              {
                step: '01', icon: Building2, title: 'Class Rep Registers',
                desc: 'Class rep registers the department and specifies how many groups are in the class.',
                color: 'var(--primary)', link: '/register-department', cta: 'Register Department'
              },
              {
                step: '02', icon: Users, title: 'Groups Sign Up',
                desc: 'Group leaders select their department, pick their group number, and list all members.',
                color: 'var(--secondary)', link: '/register-group', cta: 'Register Group'
              },
              {
                step: '03', icon: Rocket, title: 'Submit Project',
                desc: 'Leaders submit the project name, GitHub repo link, and final details. Everyone gets a confirmation.',
                color: '#10b981', link: '/submit', cta: 'Submit Now'
              },
            ].map((item, i) => (
              <div key={i} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: -20, right: -10,
                  fontSize: 80, fontWeight: 800,
                  color: item.color, opacity: 0.06, lineHeight: 1, pointerEvents: 'none'
                }}>{item.step}</div>
                <div style={{ marginBottom: 16 }}>
                  <item.icon size={36} color={item.color} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 20 }}>{item.desc}</p>
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

      <section style={{ padding: '40px 0 80px', overflow: 'hidden' }}>
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>
          Registered Departments
        </p>
        {registeredDepts.length > 0 ? (
          <div style={{
            display: 'flex', gap: 12, width: 'max-content',
            animation: 'marquee 20s linear infinite'
          }}>
            <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
            {[...registeredDepts, ...registeredDepts].map((dep, i) => (
              <span key={i} className="badge badge-violet" style={{ fontSize: 12, padding: '6px 16px', whiteSpace: 'nowrap' }}>
                {dep}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-3)' }}>
            No departments registered yet. Be the first!
          </p>
        )}
      </section>
    </div>
  )
}
