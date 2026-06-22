'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState<{ id: string; department: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingDepts, setLoadingDepts] = useState(true)

  useState(() => {
    fetch('/api/admin?type=departments')
      .then(r => r.json())
      .then(data => setDepartments(data.departments || []))
      .catch(() => {})
      .finally(() => setLoadingDepts(false))
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error('All fields are required')
      return
    }
    setLoading(true)
    try {
      await register({
        email,
        password,
        name,
        role: 'rep',
        department_id: departmentId || undefined,
      })
      toast.success('Account created!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: 440, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" className="nav-logo" style={{ justifyContent: 'center', marginBottom: 16 }}>
            <div className="nav-logo-icon">{'\uD83C\uDF93'}</div>
            <span className="nav-logo-text gradient-text">AcademiHub</span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Create Account</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Register as a class rep or team member</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your full name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="label">Link to Department (optional)</label>
              <select className="input select" value={departmentId} onChange={e => setDepartmentId(e.target.value)}
                disabled={loadingDepts}>
                <option value="">Select department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.department}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 24 }} disabled={loading}>
            {loading ? <><span className="spinner" /> Creating...</> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-3)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign in</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
          <Link href="/" style={{ color: 'var(--text-3)' }}>← Back to Home</Link>
        </p>
      </div>
    </div>
  )
}
