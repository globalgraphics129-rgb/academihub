import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import PortalTimer from './components/PortalTimer'

export const metadata: Metadata = {
  title: 'COS 102 Project Hub',
  description: 'Project submission portal for COS 102 — Computer Science',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="grid-bg" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <PortalTimer />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#12122a',
              color: '#f1f5f9',
              border: '1px solid rgba(124,58,237,0.3)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#0d0d1f' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0d0d1f' },
            },
          }}
        />
      </body>
    </html>
  )
}
