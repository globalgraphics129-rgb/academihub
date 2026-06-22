'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ThemeToggle from '../components/ThemeToggle'
import { GraduationCap, Mail, ArrowLeft, CheckCircle, User, UserPlus, Menu, X } from 'lucide-react'

export default function RegisterStudentPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [matric, setMatric] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const sendCode = async () => {
    if (!name.trim() || !email.trim() || !matric.trim()) {
      toast.error('All fields are required')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/auth/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), matric: matric.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to send code'); return }
      toast.success('Confirmation code sent to your email!')
      setStep('code')
    } catch {
      toast.error('Failed to send confirmation code')
    } finally {
      setSending(false)
    }
  }

  const verifyCode = async () => {
    if (!code.trim()) { toast.error('Enter the confirmation code'); return }
    setVerifying(true)
    try {
      const res = await fetch('/api/auth/verify-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Invalid code'); return }

      if (data.token && data.user) {
        localStorage.setItem('ah-token', data.token)
        window.dispatchEvent(new Event('auth-change'))
      }

      toast.success('Email verified! Welcome to AcademiHub.')
      router.push('/dashboard/student')
    } catch {
      toast.error('Failed to verify code')
    } finally {
      setVerifying(false)
    }
  }

  const resendCode = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/auth/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), matric: matric.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to resend'); return }
      toast.success('New code sent!')
    } catch {
      toast.error('Failed to resend code')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon"><GraduationCap size={20} /></div>
            <span className="nav-logo-text gradient-text">AcademiHub</span>
          </Link>
          <div className="nav-links">
            <Link href="/login" className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>Sign In</Link>
            <ThemeToggle />
            <button onClick={() => setMenuOpen(true)} className="mobile-menu-btn" aria-label="Open menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-overlay">
          <div className="mobile-overlay-header">
            <Link href="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
              <div className="nav-logo-icon"><GraduationCap size={20} /></div>
              <span className="nav-logo-text gradient-text">AcademiHub</span>
            </Link>
            <button onClick={() => setMenuOpen(false)} className="mobile-menu-btn">
              <X size={20} />
            </button>
          </div>
          <div className="mobile-overlay-body">
            <Link href="/" className="mobile-overlay-link" onClick={() => setMenuOpen(false)}>
              <ArrowLeft size={18} /> Home
            </Link>
            <Link href="/register-department" className="mobile-overlay-link" onClick={() => setMenuOpen(false)}>
              Class Reps
            </Link>
            <Link href="/register-group" className="mobile-overlay-link" onClick={() => setMenuOpen(false)}>
              Groups
            </Link>
            <Link href="/submit" className="mobile-overlay-link" onClick={() => setMenuOpen(false)}>
              Submit Project
            </Link>
            <Link href="/dashboard/student" className="mobile-overlay-link" onClick={() => setMenuOpen(false)}>
              Search Submission
            </Link>
            <div className="mobile-overlay-divider" />
            <Link href="/login" className="mobile-overlay-link" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          </div>
          <div className="mobile-overlay-footer">
            AcademiHub &middot; Student Registration
          </div>
        </div>
      )}

      <div className="form-container">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="success-icon" style={{ margin: '0 auto 16px' }}>
            <User size={28} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>
            Student Registration
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            {step === 'form' ? 'Enter your details to get started' : 'Enter the confirmation code sent to your email'}
          </p>
        </div>

        {step === 'form' ? (
          <div className="card stagger-1" style={{ padding: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="label">
                  <User size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Full Name
                </label>
                <input
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendCode()}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="label">
                  <Mail size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Email Address
                </label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendCode()}
                  placeholder="e.g. john@example.com"
                />
              </div>
              <div>
                <label className="label">
                  <UserPlus size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Matric Number
                </label>
                <input
                  className="input"
                  value={matric}
                  onChange={e => setMatric(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendCode()}
                  placeholder="e.g. 2023/1/12345CS"
                />
              </div>
              <button onClick={sendCode} className="btn btn-primary" disabled={sending}
                style={{ width: '100%', marginTop: 8 }}>
                {sending ? <><span className="spinner" /> Sending Code...</> : 'Send Confirmation Code'}
              </button>
            </div>
          </div>
        ) : (
          <div className="card stagger-1" style={{ padding: 28 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <CheckCircle size={48} style={{ color: 'var(--primary-light)', marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>
                A 6-digit code was sent to
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{email}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label" style={{ textAlign: 'center' }}>Confirmation Code</label>
                <input
                  className="input"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && verifyCode()}
                  placeholder="000000"
                  style={{
                    textAlign: 'center', fontSize: 24, fontWeight: 700, letterSpacing: 8,
                    fontFamily: 'var(--font-mono)',
                  }}
                  maxLength={6}
                  autoFocus
                />
              </div>
              <button onClick={verifyCode} className="btn btn-primary" disabled={verifying || code.length < 6}
                style={{ width: '100%' }}>
                {verifying ? <><span className="spinner" /> Verifying...</> : 'Verify & Complete Registration'}
              </button>
              <button onClick={resendCode} className="btn btn-secondary" disabled={sending}
                style={{ width: '100%' }}>
                {sending ? 'Sending...' : 'Resend Code'}
              </button>
              <button onClick={() => { setStep('form'); setCode('') }} className="btn btn-secondary"
                style={{ width: '100%', fontSize: 12 }}>
                <ArrowLeft size={14} /> Change Email or Name
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-3)' }}>
          Already registered? <Link href="/dashboard/student" style={{ color: 'var(--primary-light)' }}>Search your submission</Link>
        </p>
      </div>
    </div>
  )
}
