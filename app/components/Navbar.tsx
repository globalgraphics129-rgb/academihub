'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import ThemeToggle from './ThemeToggle'
import { GraduationCap, Menu, X, ArrowRight, ArrowLeft, LogOut, Search, Building2, Users, Rocket } from 'lucide-react'

interface NavbarProps {
  isAdmin?: boolean;
  adminControls?: React.ReactNode;
  menuTabs?: { id: string; icon: string; label: string }[];
  currentTab?: string;
  onTabChange?: (tab: any) => void;
}

export default function Navbar({
  isAdmin = false,
  adminControls,
  menuTabs,
  currentTab,
  onTabChange
}: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [localProfile, setLocalProfile] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem('ah-user') || localStorage.getItem('user')
    if (stored) {
      try {
        setLocalProfile(JSON.parse(stored))
      } catch {}
    }
  }, [user])

  const handleSignOut = async () => {
    localStorage.removeItem('ah-token')
    localStorage.removeItem('ah-user')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await logout()
    router.push('/login')
  }

  // Active link helper
  const isActive = (path: string) => pathname === path

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">
              <GraduationCap size={20} />
            </div>
            <span className="nav-logo-text gradient-text">AcademiHub</span>
          </Link>

          {/* Desktop Controls & Links */}
          <div className="nav-links">
            {/* Custom Admin controls placed inline on desktop */}
            {isAdmin && adminControls}

            {/* Standard Links for non-admin pages */}
            {!isAdmin && (
              <>
                <Link 
                  href="/register-department" 
                  className={`nav-link ${isActive('/register-department') ? 'active-link' : ''}`}
                >
                  Class Reps
                </Link>
                <Link 
                  href="/register-group" 
                  className={`nav-link ${isActive('/register-group') ? 'active-link' : ''}`}
                >
                  Groups
                </Link>
                <Link 
                  href="/submit" 
                  className={`nav-link ${isActive('/submit') ? 'active-link' : ''}`}
                >
                  Submit
                </Link>
                <Link 
                  href="/dashboard/student" 
                  className={`nav-link ${isActive('/dashboard/student') ? 'active-link' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Search size={14} /> Search
                </Link>
              </>
            )}

            <ThemeToggle />

            {/* Auth State Button */}
            {!loading && (
              user ? (
                <button onClick={handleSignOut} className="btn btn-secondary" style={{ fontSize: 13, padding: '7px 14px' }}>
                  <LogOut size={14} /> Sign Out
                </button>
              ) : (
                !isAdmin && (
                  <>
                    <Link href="/login" className="nav-link">Sign In</Link>
                    <Link href="/admin" className="btn btn-secondary" style={{ fontSize: 13, padding: '7px 14px' }}>
                      Admin <ArrowRight size={14} />
                    </Link>
                  </>
                )
              )
            )}

            {/* Mobile Drawer Trigger */}
            <button onClick={() => setMenuOpen(true)} className="mobile-menu-btn" aria-label="Open menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {menuOpen && (
        <div className="mobile-overlay">
          <div className="mobile-overlay-header">
            <Link href="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
              <div className="nav-logo-icon">
                <GraduationCap size={20} />
              </div>
              <span className="nav-logo-text gradient-text">AcademiHub</span>
            </Link>
            <button onClick={() => setMenuOpen(false)} className="mobile-menu-btn" aria-label="Close menu">
              <X size={20} />
            </button>
          </div>

          <div className="mobile-overlay-body">
            {/* Custom Admin Navigation Menu */}
            {isAdmin && menuTabs && onTabChange ? (
              <>
                <span className="badge badge-violet" style={{ alignSelf: 'center', marginBottom: 12 }}>
                  Admin Controls
                </span>
                {menuTabs.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => { onTabChange(t.id); setMenuOpen(false) }}
                    className="mobile-overlay-link" 
                    style={{ color: currentTab === t.id ? 'var(--primary-light)' : undefined }}
                  >
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </>
            ) : (
              /* Public / Student Navigation Menu */
              <>
                <Link href="/" className="mobile-overlay-link" onClick={() => setMenuOpen(false)}>
                  <ArrowLeft size={18} /> Home
                </Link>
                <Link href="/register-department" className="mobile-overlay-link" onClick={() => setMenuOpen(false)}>
                  <Building2 size={18} /> Class Reps
                </Link>
                <Link href="/register-group" className="mobile-overlay-link" onClick={() => setMenuOpen(false)}>
                  <Users size={18} /> Groups
                </Link>
                <Link href="/submit" className="mobile-overlay-link" onClick={() => setMenuOpen(false)}>
                  <Rocket size={18} /> Submit
                </Link>
                <Link href="/dashboard/student" className="mobile-overlay-link" onClick={() => setMenuOpen(false)}>
                  <Search size={18} /> Search Submissions
                </Link>
              </>
            )}

            <div className="mobile-overlay-divider" />

            {/* Auth States on Mobile */}
            {user ? (
              <button 
                onClick={() => { handleSignOut(); setMenuOpen(false) }} 
                className="mobile-overlay-link mobile-danger-btn"
                style={{ color: '#ef4444' }}
              >
                <LogOut size={18} /> Sign Out
              </button>
            ) : (
              <>
                <Link href="/login" className="mobile-overlay-link" onClick={() => setMenuOpen(false)}>
                  Sign In
                </Link>
                <Link href="/admin" className="mobile-overlay-link mobile-primary" onClick={() => setMenuOpen(false)}>
                  Admin Panel
                </Link>
              </>
            )}
          </div>

          <div className="mobile-overlay-footer">
            AcademiHub &middot; Project Submission System
          </div>
        </div>
      )}
    </>
  )
}
