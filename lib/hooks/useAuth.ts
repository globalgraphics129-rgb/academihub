'use client'
import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
  department_id?: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ah-token')
    if (!token) {
      setLoading(false)
      return
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user)
        else localStorage.removeItem('ah-token')
      })
      .catch(() => localStorage.removeItem('ah-token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    localStorage.setItem('ah-token', data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (opts: { email: string; password: string; name: string; role?: string; department_id?: string }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    localStorage.setItem('ah-token', data.token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    const token = localStorage.getItem('ah-token')
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    localStorage.removeItem('ah-token')
    setUser(null)
  }

  return { user, loading, login, register, logout }
}
