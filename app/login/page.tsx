'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'
import { GraduationCap, ArrowLeft, User, Mail, KeyRound } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [tab, setTab] = useState<'admin' | 'student'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email and password are required')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sendLoginCode = async () => {
    if (!email) { toast.error('Enter your email first'); return }
    setSendingCode(true)
    try {
      const res = await fetch('/api/auth/send-login-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCodeSent(true)
      toast.success('Login code sent to your email')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSendingCode(false)
    }
  }

  const verifyLoginCode = async () => {
    if (!code) { toast.error('Enter the code from your email'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-login-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success('Welcome back!')
      router.push('/dashboard/student')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" className="nav-logo" style={{ justifyContent: 'center', marginBottom: 16 }}>
            <div className="nav-logo-icon"><GraduationCap size={20} /></div>
            <span className="nav-logo-text gradient-text">AcademiHub</span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Sign in to your dashboard</p>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-2)', borderRadius: 10, padding: 4 }}>
          <button onClick={() => { setTab('admin'); setCodeSent(false); setCode('') }}
            className="btn" style={{
              flex: 1, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: tab === 'admin' ? 'var(--bg-1)' : 'transparent',
              color: tab === 'admin' ? 'var(--text-1)' : 'var(--text-3)',
              boxShadow: tab === 'admin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            <User size={14} /> Admin
          </button>
          <button onClick={() => { setTab('student'); setPassword('') }}
            className="btn" style={{
              flex: 1, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: tab === 'student' ? 'var(--bg-1)' : 'transparent',
              color: tab === 'student' ? 'var(--text-1)' : 'var(--text-3)',
              boxShadow: tab === 'student' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            <GraduationCap size={14} /> Student
          </button>
        </div>

        {tab === 'admin' ? (
          <form onSubmit={handleAdminLogin} className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@university.edu" />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 24 }} disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        ) : (
          <div className="card" style={{ padding: 28 }}>
            {!codeSent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@university.edu" />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  We&apos;ll send a one-time login code to your email. No password needed.
                </p>
                <button onClick={sendLoginCode} className="btn btn-primary" style={{ width: '100%' }} disabled={sendingCode}>
                  {sendingCode ? <><span className="spinner" /> Sending...</> : <><Mail size={14} /> Send Login Code</>}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <KeyRound size={28} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Enter the 6-digit code sent to <strong>{email}</strong></p>
                </div>
                <div>
                  <label className="label">Confirmation Code</label>
                  <input className="input" type="text" value={code} onChange={e => setCode(e.target.value)}
                    placeholder="000000" maxLength={6} style={{ textAlign: 'center', fontSize: 20, letterSpacing: 8, fontFamily: 'monospace' }}
                    onKeyDown={e => e.key === 'Enter' && verifyLoginCode()} />
                </div>
                <button onClick={verifyLoginCode} className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? <><span className="spinner" /> Verifying...</> : 'Verify & Sign In'}
                </button>
                <button onClick={() => { setCodeSent(false); setCode('') }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontSize: 13 }}>
                  Use a different email
                </button>
                <button onClick={sendLoginCode} disabled={sendingCode}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12 }}>
                  {sendingCode ? 'Sending...' : 'Resend code'}
                </button>
              </div>
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-3)' }}>
          No account? <Link href="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Create one</Link>
        </p>
        {tab === 'student' && (
          <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
            New student? <Link href="/register-student" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Register here</Link>
          </p>
        )}
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
          <Link href="/" style={{ color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><ArrowLeft size={14} /> Back to Home</Link>
        </p>
      </div>
    </div>
  )
}
