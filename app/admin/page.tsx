'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { parseMatric, parseMemberEntry, fmtMembers } from '@/lib/matric'

interface Member {
  name: string; matric: string;
}
interface Department {
  id: string; department: string; number_of_groups: number;
  rep_name: string; rep_email: string; rep_phone: string; created_at: string;
}
interface GroupInfo {
  id: string; group_number: number; leader_name: string; leader_email: string;
  leader_phone: string; project_name: string; submitted: boolean; created_at: string;
}
interface Submission {
  id: string; group_number: number; project_name: string;
  leader_name: string; leader_email: string; leader_phone: string;
  github_link: string; members: Member[]; notes: string;
  submitted_at: string; department: string;
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'cos102admin'



type Tab = 'overview' | 'departments' | 'submissions'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [departments, setDepartments] = useState<Department[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [expandedDept, setExpandedDept] = useState<string | null>(null)
  const [deptGroups, setDeptGroups] = useState<Record<string, GroupInfo[]>>({})
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')

  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); loadData() }
    else toast.error('Incorrect password')
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [dRes, sRes] = await Promise.all([
        fetch('/api/admin?type=departments'),
        fetch('/api/admin?type=submissions'),
      ])
      const dData = await dRes.json()
      const sData = await sRes.json()
      setDepartments(dData.departments || [])
      setSubmissions(sData.submissions || [])
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadDeptGroups = async (deptId: string) => {
    if (deptGroups[deptId]) return
    setLoadingGroups(true)
    try {
      const res = await fetch(`/api/register-group?departmentId=${deptId}`)
      const data = await res.json()
      setDeptGroups(prev => ({ ...prev, [deptId]: data.groups || [] }))
    } catch {
      toast.error('Failed to load groups')
    } finally {
      setLoadingGroups(false)
    }
  }

  const toggleDeptExpand = (deptId: string) => {
    if (expandedDept === deptId) {
      setExpandedDept(null)
    } else {
      setExpandedDept(deptId)
      loadDeptGroups(deptId)
    }
  }

  const deleteSubmission = async (id: string) => {
    if (!confirm('Delete this submission?')) return
    try {
      await fetch(`/api/admin?type=submission&id=${id}`, { method: 'DELETE' })
      setSubmissions(prev => prev.filter(s => s.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const deleteDepartment = async (id: string) => {
    if (!confirm('Delete this department and all its groups/submissions?')) return
    try {
      await fetch(`/api/admin?type=department&id=${id}`, { method: 'DELETE' })
      setDepartments(prev => prev.filter(d => d.id !== id))
      setDeptGroups(prev => { const n = { ...prev }; delete n[id]; return n })
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const exportPDF = () => {
    if (submissions.length === 0) {
      toast.error('No submissions to export')
      return
    }

    const doc = new jsPDF('landscape', 'mm', 'a4')
    const pw = doc.internal.pageSize.getWidth()
    const ph = doc.internal.pageSize.getHeight()

    // ==================== THEME COLORS ====================
    const PURPLE_DARK: [number, number, number] = [40, 20, 80]
    const PURPLE_MID: [number, number, number] = [90, 50, 200]
    const PURPLE_LIGHT: [number, number, number] = [130, 90, 230]
    const CYAN: [number, number, number] = [0, 190, 220]
    const DARK_BG: [number, number, number] = [22, 22, 32]
    const CARD_BG: [number, number, number] = [245, 243, 255]
    const TEXT_MUTED: [number, number, number] = [140, 140, 160]
    const TEXT_DARK: [number, number, number] = [50, 50, 60]

    // ==================== TITLE PAGE ====================
    // Gradient-like background (solid dark purple)
    doc.setFillColor(PURPLE_DARK[0], PURPLE_DARK[1], PURPLE_DARK[2])
    doc.rect(0, 0, pw, ph, 'F')
    // Decorative accent bar
    doc.setFillColor(CYAN[0], CYAN[1], CYAN[2])
    doc.rect(0, ph / 2 - 55, pw, 2, 'F')
    doc.rect(0, ph / 2 + 45, pw, 1, 'F')
    // Title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(34)
    doc.text('COS-102 Project Hub', pw / 2, ph / 2 - 28, { align: 'center' })
    doc.setFontSize(20)
    doc.setTextColor(CYAN[0], CYAN[1], CYAN[2])
    doc.text('Submissions Report', pw / 2, ph / 2, { align: 'center' })
    doc.setFontSize(12)
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2])
    doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, ph / 2 + 30, { align: 'center' })
    doc.text('Confidential \u2014 Lecturer/Admin Use Only', pw / 2, ph / 2 + 44, { align: 'center' })
    doc.setFontSize(9)
    doc.text('COS 102 \u2014 Computer Science Course Project', pw / 2, ph - 20, { align: 'center' })

    // ==================== EXECUTIVE SUMMARY ====================
    doc.addPage()
    doc.setFillColor(PURPLE_DARK[0], PURPLE_DARK[1], PURPLE_DARK[2])
    doc.rect(0, 0, pw, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text('Executive Summary', 16, 19)

    const totalStudents = submissions.reduce((a, s) => a + s.members.length, 0)
    const uniqueProjects = new Set(submissions.map(s => s.project_name)).size
    const grouped = submissions.reduce<Record<string, Submission[]>>((acc, s) => {
      if (!acc[s.department]) acc[s.department] = []
      acc[s.department].push(s)
      return acc
    }, {})
    const deptNames = Object.keys(grouped).sort()

    // Metric cards visual
    const metrics: [string, string, [number, number, number]][] = [
      ['Departments', `${deptNames.length}`, PURPLE_MID],
      ['Submissions', `${submissions.length}`, PURPLE_LIGHT],
      ['Students', `${totalStudents}`, CYAN],
      ['Projects', `${uniqueProjects}`, [240, 180, 50]],
    ]
    const cardW = (pw - 48) / 4
    metrics.forEach(([label, value, color], i) => {
      const x = 16 + i * (cardW + 6)
      doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2])
      doc.setDrawColor(color[0], color[1], color[2])
      doc.roundedRect(x, 36, cardW, 32, 3, 3, 'FD')
      doc.setTextColor(color[0], color[1], color[2])
      doc.setFontSize(18)
      doc.text(value as string, x + cardW / 2, 52, { align: 'center' })
      doc.setFontSize(9)
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
      doc.text(label as string, x + cardW / 2, 64, { align: 'center' })
    })

    // Key stats table
    const stats = [
      ['Total Departments Registered', `${departments.length}`],
      ['Departments that Submitted', `${deptNames.length}`],
      ['Total Submissions Received', `${submissions.length}`],
      ['Total Students Enrolled', `${totalStudents}`],
      ['Unique Project Titles', `${uniqueProjects}`],
      ['Average Students / Submission', `${(totalStudents / submissions.length).toFixed(1)}`],
    ]
    autoTable(doc, {
      startY: 80,
      head: [['Key Performance Indicators', 'Value']],
      body: stats,
      theme: 'striped',
      headStyles: { fillColor: PURPLE_MID, fontSize: 12, halign: 'center' },
      bodyStyles: { fontSize: 11 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 160 }, 1: { halign: 'center', cellWidth: 60 } },
      margin: { left: 16, right: 16 },
      tableLineColor: PURPLE_LIGHT,
      tableLineWidth: 0.5,
    })

    // ==================== FULL HIERARCHICAL REPORT ====================
    doc.addPage()
    doc.setFillColor(PURPLE_DARK[0], PURPLE_DARK[1], PURPLE_DARK[2])
    doc.rect(0, 0, pw, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text('Full Departmental Report', 16, 19)

    let yPos = 36

    deptNames.forEach((dept) => {
      const deptSubs = grouped[dept]
      const deptInfo = departments.find(d => d.department === dept)

      // Check page break
      if (yPos > ph - 80) {
        doc.setFontSize(8)
        doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2])
        doc.text(`COS-102 Project Hub Report \u2014 Page ${(doc as any).getNumberOfPages()}`, pw / 2, ph - 10, { align: 'center' })
        doc.addPage()
        yPos = 16
      }

      // Department header bar
      doc.setFillColor(PURPLE_MID[0], PURPLE_MID[1], PURPLE_MID[2])
      doc.roundedRect(12, yPos, pw - 24, 12, 3, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(13)
      doc.text(dept, 18, yPos + 8)
      yPos += 18

      if (deptInfo) {
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
        doc.setFontSize(9)
        doc.text(`Class Rep: ${deptInfo.rep_name}  |  ${deptInfo.rep_email}  |  ${deptInfo.rep_phone || '\u2014'}`, 18, yPos)
        yPos += 10
      }

      // Sort submissions by group number
      const sortedSubs = [...deptSubs].sort((a, b) => a.group_number - b.group_number)

      sortedSubs.forEach((s) => {
        if (yPos > ph - 90) {
          doc.setFontSize(8)
          doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2])
          doc.text(`COS-102 Project Hub Report \u2014 Page ${(doc as any).getNumberOfPages()}`, pw / 2, ph - 10, { align: 'center' })
          doc.addPage()
          yPos = 16
        }

        // Group header
        doc.setFillColor(PURPLE_LIGHT[0], PURPLE_LIGHT[1], PURPLE_LIGHT[2])
        doc.roundedRect(18, yPos, pw - 36, 10, 2, 2, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(11)
        doc.text(`Group ${s.group_number} \u2014 ${s.project_name}`, 24, yPos + 7)
        yPos += 15

        // Leader and project details
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
        doc.setFontSize(9)
        doc.text(`Leader: ${s.leader_name}  |  ${s.leader_email}  |  ${s.leader_phone || '\u2014'}`, 24, yPos)
        yPos += 5
        doc.setFontSize(8)
        doc.setTextColor(80, 80, 100)
        doc.text(`GitHub: ${s.github_link}`, 24, yPos)
        yPos += 4
        if (s.notes) {
          doc.text(`Notes: ${s.notes}`, 24, yPos)
          yPos += 4
        }
        doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2])
        doc.text(`Submitted: ${new Date(s.submitted_at).toLocaleString()}`, 24, yPos)
        yPos += 7

        // Members table
        const members = Array.isArray(s.members) ? s.members : []
        if (members.length > 0) {
          const memberRows: any[][] = []
          members.forEach((m: any, mi: number) => {
            let n: string, mat: string
            if (typeof m === 'string') {
              const parsed = parseMatric(m)
              n = parsed.name; mat = parsed.matric
            } else {
              n = m.name || ''; mat = m.matric || ''
              if (!mat && n) {
                const parsed = parseMatric(n)
                n = parsed.name; mat = parsed.matric
              }
            }
            memberRows.push([mi + 1, n, mat || '\u2014'])
          })

          autoTable(doc, {
            startY: yPos,
            head: [['#', 'Student Name', 'Matric No.']],
            body: memberRows,
            theme: 'striped',
            headStyles: { fillColor: PURPLE_DARK, fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 12, halign: 'center' },
              1: { cellWidth: 100 },
              2: { cellWidth: 50, halign: 'center' },
            },
            margin: { left: 24, right: 16 },
            alternateRowStyles: { fillColor: [248, 245, 255] },
            tableLineColor: [200, 190, 220],
            tableLineWidth: 0.2,
          })
          yPos = (doc as any).lastAutoTable.finalY + 12
        } else {
          doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2])
          doc.setFontSize(9)
          doc.text('No members listed for this group.', 24, yPos + 4)
          yPos += 14
        }
      })
    })

    // ==================== PAGE FOOTER (all pages) ====================
    const pageCount = (doc as any).getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      (doc as any).setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2])
      doc.text(
        `COS-102 Project Hub Report \u2014 Page ${i} of ${pageCount}`,
        pw / 2,
        ph - 10,
        { align: 'center' }
      )
    }

    doc.save(`COS102-Project-Hub-Report-${Date.now()}.pdf`)
    toast.success('PDF exported!')
  }

  const filteredSubmissions = submissions.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.department.toLowerCase().includes(q) || s.project_name.toLowerCase().includes(q) || s.leader_name.toLowerCase().includes(q)
    const matchDept = !filterDept || s.department === filterDept
    return matchSearch && matchDept
  })

  const uniqueDepts = Array.from(new Set(submissions.map(s => s.department)))

  if (!authed) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 400, padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="emoji-lg">{'\uD83D\uDD10'}</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>Admin Access</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>COS 102 Project Hub — Lecturer/Admin Only</p>
          </div>
          <div className="card">
            <label className="label">Admin Password</label>
            <input
              className="input"
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="Enter admin password..."
              style={{ marginBottom: 16 }}
            />
            <button onClick={login} className="btn btn-primary" style={{ width: '100%' }}>
              Enter Admin Panel →
            </button>
          </div>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-3)' }}>
            <Link href="/" style={{ color: 'var(--violet-light)' }}>← Back to Home</Link>
          </p>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'overview', icon: '\uD83D\uDCCA', label: 'Overview' },
    { id: 'departments', icon: '\uD83C\uDFDB\uFE0F', label: 'Departments' },
    { id: 'submissions', icon: '\uD83D\uDCE6', label: 'Submissions' },
  ]

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">{'\uD83C\uDF93'}</div>
            <span className="nav-logo-text gradient-text">COS 102</span>
          </Link>
          <div className="nav-links">
            <span className="badge badge-violet">Admin Panel</span>
            <button onClick={loadData} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
              {loading ? <span className="spinner" /> : '\u21BB'} Refresh
            </button>
            <button onClick={exportPDF} className="btn btn-cyan" style={{ fontSize: 12, padding: '6px 12px' }}>
              {'\u2B07'} Export PDF Report
            </button>
          </div>
        </div>
      </nav>

      <div className="admin-layout">
        <aside className="sidebar">
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Navigation
            </p>
            {tabs.map(t => (
              <div
                key={t.id}
                className={`sidebar-item ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span>{t.icon}</span> {t.label}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <p style={{ fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Stats
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Departments', value: departments.length, color: 'var(--violet-light)' },
                { label: 'Submissions', value: submissions.length, color: 'var(--cyan-light)' },
                { label: 'Total Students', value: submissions.reduce((a, s) => a + s.members.length, 0), color: '#6ee7b7' },
              ].map(stat => (
                <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-3)' }}>{stat.label}</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main style={{ padding: '32px 24px', minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 13, padding: '8px 16px', flexShrink: 0 }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 24 }}>Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
                {[
                  { label: 'Registered Depts', value: departments.length, icon: '\uD83C\uDFDB\uFE0F', color: 'var(--violet)' },
                  { label: 'Project Submissions', value: submissions.length, icon: '\uD83D\uDCE6', color: 'var(--cyan)' },
                  { label: 'Total Students', value: submissions.reduce((a, s) => a + s.members.length, 0), icon: '\uD83D\uDC65', color: '#10b981' },
                  { label: 'Unique Projects', value: new Set(submissions.map(s => s.project_name)).size, icon: '\uD83D\uDCA1', color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
                    <div className="stat-number" style={{ color: s.color }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Submissions by Department</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                {Object.entries(
                  submissions.reduce<Record<string, number>>((acc, s) => {
                    acc[s.department] = (acc[s.department] || 0) + 1
                    return acc
                  }, {})
                ).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
                  <div key={dept} className="card" style={{ padding: '12px 16px', flex: '1 1 180px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{dept}</p>
                    <p style={{ fontSize: 24, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'var(--cyan)' }}>
                      {count} <span style={{ fontSize: 12, color: 'var(--text-3)' }}>submission{count !== 1 ? 's' : ''}</span>
                    </p>
                  </div>
                ))}
                {submissions.length === 0 && (
                  <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No submissions yet</p>
                )}
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>All Submissions</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Dept</th>
                      <th>Group</th>
                      <th>Project</th>
                      <th>Leader</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Members</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(s => (
                      <tr key={s.id}>
                        <td><span className="badge badge-violet">{s.department}</span></td>
                        <td>Group {s.group_number}</td>
                        <td style={{ color: 'var(--text)', fontWeight: 500 }}>{s.project_name}</td>
                        <td>{s.leader_name}</td>
                        <td><span className="mono" style={{ fontSize: 12 }}>{s.leader_email}</span></td>
                        <td style={{ fontSize: 12 }}>{s.leader_phone || '\u2014'}</td>
                        <td><span className="badge badge-cyan">{s.members.length} members</span></td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-3)' }}>
                          {new Date(s.submitted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {submissions.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No submissions yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'departments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Departments</h2>
                <Link href="/register-department" className="btn btn-primary" style={{ fontSize: 13 }}>+ Add Department</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {departments.map(d => {
                  const isExpanded = expandedDept === d.id
                  const deptSubs = submissions.filter(s => s.department === d.department)
                  return (
                    <div key={d.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      {/* Department Header */}
                      <div
                        style={{
                          padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                          background: isExpanded ? 'rgba(100,60,210,0.06)' : 'transparent',
                          borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                        }}
                        onClick={() => toggleDeptExpand(d.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 16, color: 'var(--violet)' }}>{isExpanded ? '\u25BC' : '\u25B6'}</span>
                          <div>
                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--violet-light)' }}>{d.department}</span>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                              Rep: {d.rep_name} &middot; {d.rep_email} &middot; {d.rep_phone || '\u2014'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className="badge badge-violet">{d.number_of_groups} groups</span>
                          <span className="badge badge-cyan">{deptSubs.length} submitted</span>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            {new Date(d.created_at).toLocaleDateString()}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); deleteDepartment(d.id) }}
                            className="btn btn-danger" style={{ fontSize: 10, padding: '3px 8px' }}>Delete</button>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div style={{ padding: '16px 20px 20px 40px' }}>
                          {(deptGroups[d.id]?.length || 0) === 0 && loadingGroups && (
                            <p style={{ color: 'var(--text-3)', fontSize: 13 }}><span className="spinner" /> Loading groups...</p>
                          )}
                          {!loadingGroups && (!deptGroups[d.id] || deptGroups[d.id]!.length === 0) && (
                            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-3)' }}>
                              <p style={{ fontSize: 28, marginBottom: 8 }}>{'\uD83D\uDCCB'}</p>
                              <p>No groups registered yet for this department.</p>
                            </div>
                          )}

                          {/* Groups */}
                          {deptGroups[d.id]?.map(g => {
                            const submission = submissions.find(s => s.group_number === g.group_number && s.department === d.department)
                            return (
                              <div key={g.id} style={{
                                marginBottom: 16, border: '1px solid rgba(100,60,210,0.12)',
                                borderRadius: 10, overflow: 'hidden',
                              }}>
                                {/* Group Header */}
                                <div style={{
                                  padding: '10px 14px', background: 'rgba(100,60,210,0.05)',
                                  borderBottom: '1px solid rgba(100,60,210,0.1)',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                                }}>
                                  <div>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>Group {g.group_number}</span>
                                    <span style={{ margin: '0 10px', color: 'var(--text-3)' }}>&middot;</span>
                                    <span style={{ fontSize: 13 }}>{g.project_name}</span>
                                  </div>
                                  <span className={`badge ${g.submitted ? 'badge-green' : 'badge-violet'}`}>
                                    {g.submitted ? '\u2713 Submitted' : 'Pending'}
                                  </span>
                                </div>

                                {/* Group Leader */}
                                <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                                  <strong>Leader:</strong> {g.leader_name}
                                  <span style={{ margin: '0 8px', color: 'var(--text-3)' }}>&middot;</span>
                                  <span className="mono">{g.leader_email}</span>
                                  {g.leader_phone && <span style={{ marginLeft: 8 }}>&middot; {g.leader_phone}</span>}
                                </div>

                                {/* Submitted Project Details */}
                                {submission && (
                                  <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, background: 'rgba(6,182,212,0.03)' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                      <span><strong>GitHub:</strong> <a href={submission.github_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan-light)' }}>{submission.github_link.replace('https://github.com/', '')}</a></span>
                                      {submission.notes && <span><strong>Notes:</strong> {submission.notes}</span>}
                                      <span style={{ color: 'var(--text-3)', marginLeft: 'auto' }}>
                                        Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Members */}
                                <div style={{ padding: '10px 14px', fontSize: 13 }}>
                                  <div style={{ fontWeight: 600, color: 'var(--cyan)', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Members ({submission ? submission.members.length : 0})
                                  </div>
                                  {submission && submission.members.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      {submission.members.map((m: any, mi: number) => {
                                        let n: string, mat: string
                                        if (typeof m === 'string') {
                                          const parsed = parseMatric(m)
                                          n = parsed.name; mat = parsed.matric
                                        } else {
                                          n = m.name || ''; mat = m.matric || ''
                                          if (!mat && n) {
                                            const parsed = parseMatric(n)
                                            n = parsed.name; mat = parsed.matric
                                          }
                                        }
                                        return (
                                          <div key={mi} style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
                                            <span style={{ color: 'var(--text-3)', width: 24, textAlign: 'right' }}>{mi + 1}.</span>
                                            <span style={{ flex: 1 }}>{n}</span>
                                            {mat && <span className="mono" style={{ color: 'var(--violet-light)', fontSize: 12 }}>{mat}</span>}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <p style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>No members listed yet</p>
                                  )}
                                </div>

                                {/* Delete button for submission */}
                                {submission && (
                                  <div style={{ padding: '6px 14px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                                    <button onClick={() => deleteSubmission(submission.id)}
                                      className="btn btn-danger" style={{ fontSize: 10, padding: '3px 8px' }}>Delete Submission</button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
                {departments.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
                    <p style={{ fontSize: 32, marginBottom: 12 }}>{'\uD83C\uDFDB\uFE0F'}</p>
                    <p>No departments registered yet.</p>
                    <Link href="/register-department" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>Add Department</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'submissions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
                  Submissions <span style={{ color: 'var(--text-3)', fontSize: 16, fontWeight: 400 }}>({filteredSubmissions.length})</span>
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 11, padding: '6px 12px' }}
                  >
                    {'\uD83D\uDCCB'} Table
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 11, padding: '6px 12px' }}
                  >
                    {'\uD83D\uDCC3'} Cards
                  </button>
                  <button onClick={exportPDF} className="btn btn-cyan" style={{ fontSize: 12 }}>
                    {'\u2B07'} Export PDF
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <input
                  className="input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by department, project, leader..."
                  style={{ flex: 1, minWidth: 200 }}
                />
                <select
                  className="input select"
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  style={{ width: 200 }}
                >
                  <option value="">All departments</option>
                  {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {viewMode === 'table' ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Dept</th>
                        <th>Group</th>
                        <th>Project</th>
                        <th>Leader</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Members (Name & Matric)</th>
                        <th>GitHub</th>
                        <th>Notes</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map(s => (
                        <tr key={s.id}>
                          <td><span className="badge badge-violet" style={{ fontSize: 10 }}>{s.department}</span></td>
                          <td>Group {s.group_number}</td>
                          <td style={{ fontWeight: 500, fontSize: 12 }}>{s.project_name}</td>
                          <td style={{ fontSize: 12 }}>{s.leader_name}</td>
                          <td><span className="mono" style={{ fontSize: 11 }}>{s.leader_email}</span></td>
                          <td style={{ fontSize: 11 }}>{s.leader_phone || '\u2014'}</td>
                          <td style={{ fontSize: 11 }}>
                            {fmtMembers(s.members)}
                          </td>
                          <td style={{ fontSize: 11 }}>
                            <a href={s.github_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan-light)' }}>
                              {s.github_link.replace('https://github.com/', '')}
                            </a>
                          </td>
                          <td style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-3)' }}>
                            {s.notes || '\u2014'}
                          </td>
                          <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: 'var(--text-3)' }}>
                            {new Date(s.submitted_at).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              onClick={() => deleteSubmission(s.id)}
                              className="btn btn-danger"
                              style={{ fontSize: 10, padding: '3px 8px' }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredSubmissions.length === 0 && (
                        <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No submissions match your search.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {filteredSubmissions.map(s => (
                    <div key={s.id} className="card" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                        <div>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span className="badge badge-violet">{s.department}</span>
                            <span className="badge badge-cyan">Group {s.group_number}</span>
                            <span className="badge badge-green">{'\u2713'} Submitted</span>
                          </div>
                          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{s.project_name}</h3>
                          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
                            Led by <strong style={{ color: 'var(--text-2)' }}>{s.leader_name}</strong>
                            <span style={{ margin: '0 6px' }}>·</span>
                            <span className="mono">{s.leader_email}</span>
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                            Phone: {s.leader_phone || '\u2014'}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteSubmission(s.id)}
                          className="btn btn-danger"
                          style={{ fontSize: 11, padding: '5px 12px', flexShrink: 0 }}
                        >
                          Delete
                        </button>
                      </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Members ({s.members.length})
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {s.members.map((m, idx) => {
                              let n: string, mat: string
                              if (typeof m === 'string') {
                                const parsed = parseMatric(m)
                                n = parsed.name; mat = parsed.matric
                              } else {
                                n = m.name || ''; mat = m.matric || ''
                                if (!mat && n) {
                                  const parsed = parseMatric(n)
                                  n = parsed.name; mat = parsed.matric
                                }
                              }
                              return (
                                <span key={n + mat || idx} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)',
                                  padding: '3px 10px', borderRadius: 8, fontSize: 12,
                                }}>
                                  <span style={{ color: 'var(--text)' }}>{n}</span>
                                  {mat && <span className="mono" style={{ fontSize: 10 }}>{mat}</span>}
                                </span>
                              )
                            })}
                          </div>
                        </div>

                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <a
                          href={s.github_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ fontSize: 12, padding: '6px 14px' }}
                        >
                          {'\uD83D\uDD17'} GitHub →
                        </a>
                        {s.notes && (
                          <p style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>
                            Note: {s.notes}
                          </p>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>
                          {new Date(s.submitted_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredSubmissions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
                      <p style={{ fontSize: 32, marginBottom: 12 }}>{'\uD83D\uDCED'}</p>
                      <p>No submissions match your search.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
