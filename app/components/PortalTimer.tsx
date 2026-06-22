'use client'
import { useState, useEffect } from 'react'

const TZ = 'Africa/Lagos'

function formatInTimezone(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: TZ,
    })
  } catch {
    return dateStr
  }
}

export default function PortalTimer() {
  const [closesAt, setClosesAt] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number>(-1)

  useEffect(() => {
    fetch('/api/portal-settings')
      .then(r => r.json())
      .then(data => {
        setClosesAt(data.closes_at)
        if (data.closes_at) {
          const diff = new Date(data.closes_at).getTime() - Date.now()
          setRemaining(diff > 0 ? diff : 0)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!closesAt) return

    const tick = () => {
      const diff = new Date(closesAt).getTime() - Date.now()
      setRemaining(diff > 0 ? diff : 0)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [closesAt])

  if (!closesAt || remaining <= 0) return null

  const days = Math.floor(remaining / 86400000)
  const hours = Math.floor((remaining % 86400000) / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div style={{
      background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #14b8a6 100%)',
      padding: '8px 16px',
      textAlign: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 999,
      boxShadow: '0 2px 20px rgba(5,150,105,0.3)',
    }}>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
        Portal Closes in{' '}
      </span>
      <span style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginLeft: 6, fontVariantNumeric: 'tabular-nums' }}>
        {days > 0 ? `${days}d ` : ''}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginLeft: 10 }}>
        &middot; {closesAt && formatInTimezone(closesAt)}
      </span>
    </div>
  )
}
