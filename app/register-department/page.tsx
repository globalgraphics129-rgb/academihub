'use client'
import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { GraduationCap, Building2, ArrowLeft, ArrowRight, Lock, BookOpen, Users, Rocket } from 'lucide-react'

interface Project { id: string; name: string; description: string | null }

function RegisterDepartmentInner() {
  const searchParams = useSearchParams()
  const projectIdParam = searchParams.get('projectId')

  const [portalClosed, setPortalClosed] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState(projectIdParam || '')
  const [selectedProjectName, setSelectedProjectName] = useState('')
  const [form, setForm] = useState({
    department: '',
    repName: '',
    repEmail: '',
    repPhone: '',
    numberOfGroups: '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/portal-settings')
      .then(r => r.json())
      .then(data => {
        if (data.closes_at && new Date(data.closes_at).getTime() < Date.now()) {
          setPortalClosed(true)
        }
      })
      .catch(() => {})
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        const list = data.projects || []
        setProjects(list)
        if (!projectIdParam && list.length > 0) {
          setSelectedProjectId(list[0].id)
          setSelectedProjectName(list[0].name)
        } else if (projectIdParam) {
          const match = list.find((p: Project) => p.id === projectIdParam)
          if (match) setSelectedProjectName(match.name)
        }
      })
      .catch(() => {})
  }, [projectIdParam])

  if (portalClosed) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Lock size={48} /></div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 12 }}>Portal Closed</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            The submission portal has been closed. Department registration is no longer available.
          </p>
          <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={14} /> Back Home</Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) { toast.error('Select a project first'); return }
    if (!form.department || !form.repName || !form.repEmail || !form.numberOfGroups) {
      toast.error('Please fill in all required fields')
      return
    }
    if (parseInt(form.numberOfGroups) < 1 || parseInt(form.numberOfGroups) > 100) {
      toast.error('Number of groups must be between 1 and 100')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/register-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projectId: selectedProjectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setDone(true)
      toast.success('Department registered!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="page">
        <Navbar />
        <div className="form-container" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div className="success-icon"><Building2 size={32} /></div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: -1 }}>
            Department Registered!
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            <strong style={{ color: 'var(--text)' }}>{form.department}</strong> is now active on the platform.
            A confirmation has been sent to <strong style={{ color: 'var(--violet-light)' }}>{form.repEmail}</strong>.
            Share the submission link with your group leaders.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/register-group?projectId=${selectedProjectId}`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Next: Register Groups <ArrowRight size={14} /></Link>
            <Link href="/" className="btn btn-secondary">Back Home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar />

      <div className="form-container">
        <div style={{ marginBottom: 36, animation: 'fade-up 0.5s ease both' }}>
          <p className="section-eyebrow">Step 1 of 3</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 10 }}>
            Register Your Department
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6 }}>
            Class reps: enter your department name so your groups can start submitting their projects.
          </p>
        </div>

        <div className="steps" style={{ animation: 'fade-up 0.5s 0.1s ease both', opacity: 0 }}>
          <div className="step">
            <div className="step-dot active">1</div>
            <span className="step-label active">Department</span>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-dot">2</div>
            <span className="step-label">Groups</span>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-dot">3</div>
            <span className="step-label">Submit</span>
          </div>
        </div>

        {!projectIdParam && projects.length > 0 && (
          <div className="card" style={{ marginBottom: 16, animation: 'fade-up 0.5s 0.15s ease both', opacity: 0 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, marginBottom: 16, color: 'var(--violet-light)', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
              Select Project
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedProjectId(p.id); setSelectedProjectName(p.name) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    borderRadius: 10, border: `2px solid ${selectedProjectId === p.id ? 'var(--primary)' : 'var(--border)'}`,
                    background: selectedProjectId === p.id ? 'rgba(5,150,105,0.08)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%',
                  }}
                >
                  <BookOpen size={20} style={{ color: selectedProjectId === p.id ? 'var(--primary)' : 'var(--text-3)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{p.description}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedProjectName && (
          <div style={{
            animation: 'fade-up 0.5s 0.2s ease both', opacity: 0,
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
            fontSize: 12, color: 'var(--primary-light)', fontWeight: 600,
          }}>
            <BookOpen size={14} /> {selectedProjectName}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ animation: 'fade-up 0.5s 0.25s ease both', opacity: 0 }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--violet-light)', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
              Department Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Department Name *</label>
                <input
                  className="input"
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Computer Science"
                  required
                />
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                  Type your department name exactly as it should appear.
                </p>
              </div>
              <div>
                <label className="label">Number of Groups *</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={100}
                  value={form.numberOfGroups}
                  onChange={e => setForm(f => ({ ...f, numberOfGroups: e.target.value }))}
                  placeholder="e.g. 15"
                  required
                />
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                  How many groups are in your class?
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, marginBottom: 20, color: 'var(--violet-light)', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
              Class Rep Info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Your Full Name *</label>
                <input
                  className="input"
                  value={form.repName}
                  onChange={e => setForm(f => ({ ...f, repName: e.target.value }))}
                  placeholder="e.g. Chukwuemeka Obi"
                  required
                />
              </div>
              <div>
                <label className="label">Your Email Address *</label>
                <input
                  className="input"
                  type="email"
                  value={form.repEmail}
                  onChange={e => setForm(f => ({ ...f, repEmail: e.target.value }))}
                  placeholder="e.g. emeka@uni.edu.ng"
                  required
                />
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                  You will receive a confirmation email here.
                </p>
              </div>
              <div>
                <label className="label">Phone Number (optional)</label>
                <input
                  className="input"
                  type="tel"
                  value={form.repPhone}
                  onChange={e => setForm(f => ({ ...f, repPhone: e.target.value }))}
                  placeholder="e.g. +234 801 234 5678"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: 15 }}
            disabled={loading || !selectedProjectId}
          >
            {loading ? <><span className="spinner" /> Registering...</> : <><Building2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Register Department</>}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function RegisterDepartmentPage() {
  return (
    <Suspense fallback={<div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>}>
      <RegisterDepartmentInner />
    </Suspense>
  )
}
