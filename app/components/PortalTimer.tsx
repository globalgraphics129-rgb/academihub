'use client'
import { useState, useEffect } from 'react'

export default function PortalTimer() {
  const [closesAt, setClosesAt] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number>(0)
  const [closed, setClosed] = useState(false)
  const [notifiedClose, setNotifiedClose] = useState(false)

  useEffect(() => {
    fetch('/api/portal-settings')
      .then(r => r.json())
      .then(data => setClosesAt(data.closes_at))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!closesAt) return

    const tick = () => {
      const diff = new Date(closesAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining(0)
        setClosed(true)
        // Trigger portal close notification once
        if (!notifiedClose) {
          setNotifiedClose(true)
          fetch('/api/admin/portal-close', { method: 'POST' }).catch(() => {})
        }
      } else {
        setRemaining(diff)
        setClosed(false)
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [closesAt, notifiedClose])

  if (!closesAt || remaining <= 0) return null

  const days = Math.floor(remaining / 86400000)
  const hours = Math.floor((remaining % 86400000) / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div style={{
      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%)',
      padding: '8px 16px',
      textAlign: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 999,
      boxShadow: '0 2px 20px rgba(124,58,237,0.3)',
      fontFamily: "'Syne', sans-serif",
    }}>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
        Portal Closes in{' '}
      </span>
      <span style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginLeft: 6, fontVariantNumeric: 'tabular-nums' }}>
        {days > 0 ? `${days}d ` : ''}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  )
}
