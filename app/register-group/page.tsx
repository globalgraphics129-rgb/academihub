'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Department {
  id: string
  department: string
  number_of_groups: number
}

export default function RegisterGroup() {
  const [portalClosed, setPortalClosed] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [form, setForm] = useState({
    departmentId: '',
    groupNumber: '',
    leaderName: '',
    leaderEmail: '',
    leaderPhone: '',
    projectName: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
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
    fetch('/api/register-department')
      .then(r => r.json())
      .then(data => { setDepartments(data.departments || []); setFetching(false) })
      .catch(() => setFetching(false))
  }, [])

  const selectedDept = departments.find(d => d.id === form.departmentId)
  const groupOptions = selectedDept
    ? Array.from({ length: selectedDept.number_of_groups }, (_, i) => i + 1)
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.departmentId || !form.groupNumber || !form.leaderName || !form.leaderEmail || !form.projectName) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/register-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setDone(true)
      toast.success('Group registered!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="page">
        <nav className="nav">
          <div className="nav-inner">
            <Link href="/" className="nav-logo">
              <div className="nav-logo-icon">🎓</div>
              <span className="nav-logo-text gradient-text">COS 102</span>
            </Link>
          </div>
        </nav>
        <div className="form-container" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div className="success-icon">👥</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: -1 }}>
            Group {form.groupNumber} Registered!
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Your group has been registered under <strong style={{ color: 'var(--text)' }}>{selectedDept?.department}</strong>.
            Now go ahead and submit your project!
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/submit" className="btn btn-primary">Next: Submit Project →</Link>
            <Link href="/" className="btn btn-secondary">Back Home</Link>
          </div>
        </div>
      </div>
    )
  }

  if (portalClosed) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83D\uDD12'}</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 12 }}>Portal Closed</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            The submission portal has been closed. Group registration is no longer available.
          </p>
          <Link href="/" className="btn btn-secondary" style={{ display: 'inline-block' }}>← Back Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">🎓</div>
            <span className="nav-logo-text gradient-text">COS 102</span>
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">← Home</Link>
          </div>
        </div>
      </nav>

      <div className="form-container">
        <div style={{ marginBottom: 36, animation: 'fade-up 0.5s ease both' }}>
          <p className="section-eyebrow">Step 2 of 3</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 10 }}>
            Register Your Group
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6 }}>
            Group leaders: register your group under your department. You&apos;ll add members when you submit.
          </p>
        </div>

        <div className="steps" style={{ animation: 'fade-up 0.5s 0.1s ease both', opacity: 0 }}>
          <div className="step">
            <div className="step-dot done">✓</div>
            <span className="step-label done">Department</span>
          </div>
          <div className="step-line done" />
          <div className="step">
            <div className="step-dot active">2</div>
            <span className="step-label active">Groups</span>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-dot">3</div>
            <span className="step-label">Submit</span>
          </div>
        </div>

        {fetching ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Loading departments...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🏛️</p>
            <p style={{ color: 'var(--text-2)', marginBottom: 20 }}>No departments registered yet.</p>
            <Link href="/register-department" className="btn btn-primary">Register a Department First</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ animation: 'fade-up 0.5s 0.2s ease both', opacity: 0 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, marginBottom: 20, color: 'var(--violet-light)', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
                Group Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="label">Department *</label>
                  <select
                    className="input select"
                    value={form.departmentId}
                    onChange={e => setForm(f => ({ ...f, departmentId: e.target.value, groupNumber: '' }))}
                    required
                  >
                    <option value="">Select your department...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.department}</option>
                    ))}
                  </select>
                </div>
                {selectedDept && (
                  <div>
                    <label className="label">Group Number *</label>
                    <select
                      className="input select"
                      value={form.groupNumber}
                      onChange={e => setForm(f => ({ ...f, groupNumber: e.target.value }))}
                      required
                    >
                      <option value="">Select group number...</option>
                      {groupOptions.map(n => (
                        <option key={n} value={n}>Group {n}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="label">Project Name *</label>
                  <input
                    className="input"
                    value={form.projectName}
                    onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
                    placeholder="e.g. Campus Budget Tracker, GUI Calculator, Quiz App..."
                    required
                  />
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                    What did your group build for COS 102?
                  </p>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, marginBottom: 20, color: 'var(--violet-light)', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
                Group Leader Info
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="label">Your Full Name *</label>
                  <input
                    className="input"
                    value={form.leaderName}
                    onChange={e => setForm(f => ({ ...f, leaderName: e.target.value }))}
                    placeholder="e.g. Amina Lawal"
                    required
                  />
                </div>
                <div>
                  <label className="label">Your Email Address *</label>
                  <input
                    className="input"
                    type="email"
                    value={form.leaderEmail}
                    onChange={e => setForm(f => ({ ...f, leaderEmail: e.target.value }))}
                    placeholder="e.g. amina@uni.edu.ng"
                    required
                  />
                </div>
                <div>
                  <label className="label">Phone Number (optional)</label>
                  <input
                    className="input"
                    type="tel"
                    value={form.leaderPhone}
                    onChange={e => setForm(f => ({ ...f, leaderPhone: e.target.value }))}
                    placeholder="e.g. +234 801 234 5678"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: 15 }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Registering...</> : '👥 Register Group'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
