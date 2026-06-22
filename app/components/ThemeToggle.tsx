'use client'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('ah-theme')
    const isDark = stored !== 'light'
    setDark(isDark)
    document.documentElement.classList.toggle('light', !isDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('light', !next)
    localStorage.setItem('ah-theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: 'pointer',
        fontSize: 16,
        lineHeight: 1,
        color: 'var(--text-2)',
        transition: 'all 0.2s',
      }}
    >
      {dark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
    </button>
  )
}
