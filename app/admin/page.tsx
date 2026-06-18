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
  rep_name: string; rep_email: string; rep_phone: string; created_at: string; active: boolean;
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

interface StudentEntry {
  submissionId: string
  memberIndex: number
  name: string
  matric: string
  groupNumber: number
  department: string
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'cos102admin'

type Tab = 'overview' | 'departments' | 'submissions' | 'students'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMembers, setEditMembers] = useState<Member[]>([])
  const [editStudentKey, setEditStudentKey] = useState<string | null>(null)
  const [editStudentName, setEditStudentName] = useState('')
  const [editStudentMatric, setEditStudentMatric] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [studentDeptFilter, setStudentDeptFilter] = useState('')
  const [studentGroupFilter, setStudentGroupFilter] = useState('')
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ department: '', rep_name: '', rep_email: '', rep_phone: '', number_of_groups: 1 })
  const [emailDept, setEmailDept] = useState<Department | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

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

  const openEditModal = (d: Department) => {
    setEditDept(d)
    setEditForm({
      department: d.department,
      rep_name: d.rep_name,
      rep_email: d.rep_email,
      rep_phone: d.rep_phone || '',
      number_of_groups: d.number_of_groups,
    })
    setShowEditModal(true)
  }

  const saveEdit = async () => {
    if (!editDept) return
    if (!editForm.department || !editForm.rep_name || !editForm.rep_email) {
      toast.error('Department, rep name, and rep email are required')
      return
    }
    try {
      const res = await fetch(`/api/admin?type=department&id=${editDept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: editForm.department,
          rep_name: editForm.rep_name,
          rep_email: editForm.rep_email,
          rep_phone: editForm.rep_phone || null,
          number_of_groups: Number(editForm.number_of_groups),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to update')
        return
      }
      const data = await res.json()
      setDepartments(prev => prev.map(d => d.id === editDept.id ? data.department : d))
      setShowEditModal(false)
      setEditDept(null)
      toast.success('Department updated')
    } catch { toast.error('Failed to update') }
  }

  const openEmailModal = (d: Department) => {
    setEmailDept(d)
    setEmailSubject(`Re: ${d.department} Registration — COS 102 Project Hub`)
    setEmailMessage(`Hi ${d.rep_name},

I'm writing regarding your registration of ${d.department} on the COS 102 Project Hub.

`)
    setShowEmailModal(true)
  }

  const sendDeptEmail = async () => {
    if (!emailDept || !emailSubject || !emailMessage) {
      toast.error('Subject and message are required')
      return
    }
    setSendingEmail(true)
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: emailDept.rep_email,
          toName: emailDept.rep_name,
          subject: emailSubject,
          message: emailMessage,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to send')
        return
      }
      toast.success('Email sent')
      setShowEmailModal(false)
      setEmailDept(null)
    } catch { toast.error('Failed to send email') }
    finally { setSendingEmail(false) }
  }

  const toggleActive = async (d: Department) => {
    const newActive = !d.active
    try {
      const res = await fetch(`/api/admin?type=department&id=${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to toggle')
        return
      }
      const data = await res.json()
      setDepartments(prev => prev.map(dept => dept.id === d.id ? data.department : dept))
      toast.success(newActive ? 'Department enabled' : 'Department disabled')
    } catch { toast.error('Failed to toggle') }
  }

  const startEdit = (s: Submission) => {
    setEditingId(s.id)
    setEditMembers(s.members.map(m => ({ ...m })))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditMembers([])
  }

  const updateMemberField = (idx: number, field: 'name' | 'matric', value: string) => {
    setEditMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m))
  }

  const addEditMember = () => {
    setEditMembers(prev => [...prev, { name: '', matric: '' }])
  }

  const removeEditMember = (idx: number) => {
    setEditMembers(prev => prev.filter((_, i) => i !== idx))
  }

  const saveMembers = async (id: string) => {
    const cleaned = editMembers.filter(m => m.name.trim())
    try {
      const res = await fetch(`/api/admin?type=submission&id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: cleaned }),
      })
      if (!res.ok) throw new Error()
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, members: cleaned } : s))
      toast.success('Members updated')
      cancelEdit()
    } catch {
      toast.error('Failed to update members')
    }
  }

  const allStudents: StudentEntry[] = submissions.flatMap(s =>
    (s.members || []).map((m, idx) => {
      let name: string, matric: string
      if (typeof m === 'string') {
        const parsed = parseMatric(m)
        name = parsed.name; matric = parsed.matric
      } else {
        name = m.name || ''; matric = m.matric || ''
        if (!matric && name) {
          const parsed = parseMatric(name)
          name = parsed.name; matric = parsed.matric
        }
      }
      return { submissionId: s.id, memberIndex: idx, name, matric, groupNumber: s.group_number, department: s.department }
    })
  )

  const filteredStudents = allStudents.filter(st => {
    const q = studentSearch.toLowerCase()
    const matchSearch = !q || st.name.toLowerCase().includes(q) || st.matric.toLowerCase().includes(q) || String(st.groupNumber).includes(q) || st.department.toLowerCase().includes(q)
    const matchDept = !studentDeptFilter || st.department === studentDeptFilter
    const matchGroup = !studentGroupFilter || st.groupNumber === Number(studentGroupFilter)
    return matchSearch && matchDept && matchGroup
  })

  const startEditStudent = (st: StudentEntry) => {
    setEditStudentKey(`${st.submissionId}-${st.memberIndex}`)
    setEditStudentName(st.name)
    setEditStudentMatric(st.matric)
  }

  const cancelEditStudent = () => {
    setEditStudentKey(null)
    setEditStudentName('')
    setEditStudentMatric('')
  }

  const saveStudent = async (st: StudentEntry) => {
    const sub = submissions.find(s => s.id === st.submissionId)
    if (!sub) return
    const updatedMembers = sub.members.map((m, idx) => {
      if (idx === st.memberIndex) return { name: editStudentName.trim(), matric: editStudentMatric.trim() }
      return m
    })
    try {
      const res = await fetch(`/api/admin?type=submission&id=${st.submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers }),
      })
      if (!res.ok) throw new Error()
      setSubmissions(prev => prev.map(s => s.id === st.submissionId ? { ...s, members: updatedMembers } : s))
      toast.success('Updated')
      cancelEditStudent()
    } catch {
      toast.error('Failed to update')
    }
  }

  const uniqueStudentDepts = Array.from(new Set(allStudents.map(st => st.department))).sort()
  const uniqueStudentGroups = Array.from(new Set(allStudents.map(st => st.groupNumber))).sort((a, b) => a - b)

  const exportPDF = () => {
    if (submissions.length === 0) {
      toast.error('No submissions to export')
      return
    }

    const doc = new jsPDF('landscape', 'mm', 'a4')
    const pw = doc.internal.pageSize.getWidth()
    const ph = doc.internal.pageSize.getHeight()

    const PURPLE_DARK: [number, number, number] = [40, 20, 80]
    const PURPLE_MID: [number, number, number] = [90, 50, 200]
    const PURPLE_LIGHT: [number, number, number] = [130, 90, 230]
    const CYAN: [number, number, number] = [0, 190, 220]
    const CARD_BG: [number, number, number] = [248, 246, 255]
    const TEXT_MUTED: [number, number, number] = [140, 140, 160]
    const TEXT_DARK: [number, number, number] = [50, 50, 60]

    const totalStudents = submissions.reduce((a, s) => a + s.members.length, 0)
    const uniqueProjects = new Set(submissions.map(s => s.project_name)).size
    const grouped = submissions.reduce<Record<string, Submission[]>>((acc, s) => {
      if (!acc[s.department]) acc[s.department] = []
      acc[s.department].push(s)
      return acc
    }, {})
    const deptNames = Object.keys(grouped).sort()

    const drawFooter = (pageNum?: number) => {
      doc.setFontSize(8)
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2])
      doc.text(`COS-102 Project Hub Report`, 16, ph - 8)
      if (pageNum) doc.text(`Page ${pageNum}`, pw - 16, ph - 8, { align: 'right' })
      doc.setDrawColor(200, 190, 220)
      doc.line(16, ph - 12, pw - 16, ph - 12)
    }

    const addSectionPage = (title: string) => {
      doc.addPage()
      doc.setFillColor(PURPLE_DARK[0], PURPLE_DARK[1], PURPLE_DARK[2])
      doc.rect(0, 0, pw, 24, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.text(title, 16, 17)
    }

    // ===== COVER PAGE =====
    doc.setFillColor(PURPLE_DARK[0], PURPLE_DARK[1], PURPLE_DARK[2])
    doc.rect(0, 0, pw, ph, 'F')
    doc.setFillColor(CYAN[0], CYAN[1], CYAN[2])
    doc.rect(0, ph / 2 - 40, pw, 2, 'F')
    doc.rect(0, ph / 2 + 36, pw, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(36)
    doc.text('COS-102 Project Hub', pw / 2, ph / 2 - 18, { align: 'center' })
    doc.setFontSize(22)
    doc.setTextColor(CYAN[0], CYAN[1], CYAN[2])
    doc.text('Submissions Report', pw / 2, ph / 2 + 10, { align: 'center' })
    doc.setFontSize(11)
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2])
    doc.text(`Generated: ${new Date().toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pw / 2, ph / 2 + 42, { align: 'center' })
    doc.text('Confidential \u2014 Lecturer/Admin Use Only', pw / 2, ph / 2 + 56, { align: 'center' })
    drawFooter()

    // ===== SUMMARY PAGE =====
    addSectionPage('Executive Summary')
    let yPos = 36

    const cardW = (pw - 56) / 4
    const metrics: [string, string, [number, number, number]][] = [
      ['Departments', `${deptNames.length}`, PURPLE_MID],
      ['Submissions', `${submissions.length}`, PURPLE_LIGHT],
      ['Students', `${totalStudents}`, CYAN],
      ['Projects', `${uniqueProjects}`, [240, 180, 50]],
    ]
    metrics.forEach(([label, value, color], i) => {
      const x = 16 + i * (cardW + 8)
      doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2])
      doc.setDrawColor(color[0], color[1], color[2])
      doc.roundedRect(x, yPos, cardW, 30, 3, 3, 'FD')
      doc.setFontSize(18)
      doc.setTextColor(color[0], color[1], color[2])
      doc.text(value, x + cardW / 2, yPos + 14, { align: 'center' })
      doc.setFontSize(9)
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
      doc.text(label, x + cardW / 2, yPos + 26, { align: 'center' })
    })
    yPos += 42

    autoTable(doc, {
      startY: yPos,
      head: [['Key Performance Indicator', 'Value']],
      body: [
        ['Departments Registered', `${departments.length}`],
        ['Departments with Submissions', `${deptNames.length}`],
        ['Total Submissions', `${submissions.length}`],
        ['Total Students', `${totalStudents}`],
        ['Unique Projects', `${uniqueProjects}`],
        ['Avg Students per Submission', `${(totalStudents / submissions.length).toFixed(1)}`],
        ['Avg Submissions per Dept', `${(submissions.length / Math.max(deptNames.length, 1)).toFixed(1)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: PURPLE_MID, fontSize: 10, halign: 'center' },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 160 }, 1: { halign: 'center', cellWidth: 50 } },
      margin: { left: 16, right: 16 },
      tableLineColor: PURPLE_LIGHT,
      tableLineWidth: 0.3,
    })
    yPos = (doc as any).lastAutoTable.finalY + 16

    // Department breakdown table
    doc.setFontSize(12)
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
    doc.text('Submissions by Department', 16, yPos)
    yPos += 8

    const deptRows = deptNames.map(dept => {
      const subs = grouped[dept]
      const deptInfo = departments.find(d => d.department === dept)
      return [
        dept,
        deptInfo?.rep_name || '\u2014',
        `${subs.length}`,
        `${subs.reduce((a, s) => a + s.members.length, 0)}`,
      ]
    })

    autoTable(doc, {
      startY: yPos,
      head: [['Department', 'Class Rep', 'Submissions', 'Students']],
      body: deptRows,
      theme: 'striped',
      headStyles: { fillColor: PURPLE_DARK, fontSize: 9, halign: 'center' },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 60 }, 2: { halign: 'center', cellWidth: 30 }, 3: { halign: 'center', cellWidth: 30 } },
      margin: { left: 16, right: 16 },
      alternateRowStyles: { fillColor: CARD_BG },
      tableLineColor: [200, 190, 220],
      tableLineWidth: 0.2,
    })

    drawFooter(2)

    // ===== DETAILED REPORT =====
    addSectionPage('Detailed Departmental Report')

    yPos = 36
    let pageNum = 3

    deptNames.forEach((dept) => {
      const deptSubs = grouped[dept]
      const deptInfo = departments.find(d => d.department === dept)

      if (yPos > ph - 70) {
        drawFooter(pageNum)
        addSectionPage('Detailed Departmental Report (cont.)')
        yPos = 36
        pageNum++
      }

      doc.setFillColor(PURPLE_MID[0], PURPLE_MID[1], PURPLE_MID[2])
      doc.roundedRect(12, yPos, pw - 24, 10, 3, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.text(`  ${dept}`, 18, yPos + 7)
      yPos += 16

      if (deptInfo) {
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2])
        doc.setFontSize(8)
        doc.text(`Class Rep: ${deptInfo.rep_name}  \u2022  ${deptInfo.rep_email}  \u2022  ${deptInfo.rep_phone || '\u2014'}`, 20, yPos)
        yPos += 8
      }

      const sortedSubs = [...deptSubs].sort((a, b) => a.group_number - b.group_number)

      sortedSubs.forEach((s) => {
        if (yPos > ph - 80) {
          drawFooter(pageNum)
          addSectionPage('Detailed Departmental Report (cont.)')
          yPos = 36
          pageNum++
        }

        doc.setFillColor(PURPLE_LIGHT[0], PURPLE_LIGHT[1], PURPLE_LIGHT[2])
        doc.roundedRect(18, yPos, pw - 36, 8, 2, 2, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.text(`Group ${s.group_number}  \u2014  ${s.project_name}`, 24, yPos + 6)
        yPos += 12

        const infoColor = [70, 70, 85]
        doc.setTextColor(infoColor[0], infoColor[1], infoColor[2])
        doc.setFontSize(8)
        doc.text(`Leader: ${s.leader_name}  \u2022  ${s.leader_email}  \u2022  ${s.leader_phone || '\u2014'}`, 24, yPos)
        yPos += 4
        doc.text(`GitHub: ${s.github_link}`, 24, yPos)
        yPos += 4
        if (s.notes) {
          doc.text(`Notes: ${s.notes}`, 24, yPos)
          yPos += 4
        }
        doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2])
        doc.text(`Submitted: ${new Date(s.submitted_at).toLocaleString()}`, 24, yPos)
        yPos += 6

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
            headStyles: { fillColor: PURPLE_DARK, fontSize: 8, halign: 'center' },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 10, halign: 'center' },
              1: { cellWidth: 100 },
              2: { cellWidth: 45, halign: 'center' },
            },
            margin: { left: 24, right: 16 },
            alternateRowStyles: { fillColor: CARD_BG },
            tableLineColor: [210, 200, 230],
            tableLineWidth: 0.15,
          })
          yPos = (doc as any).lastAutoTable.finalY + 8
        } else {
          doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2])
          doc.setFontSize(8)
          doc.text('No members listed.', 24, yPos + 4)
          yPos += 10
        }
      })
    })

    drawFooter(pageNum)

    // ===== STUDENT ROSTER =====
    addSectionPage('Complete Student Roster')
    yPos = 36
    pageNum++

    const allStudents = submissions.flatMap(s =>
      (s.members || []).map((m: any, idx: number) => {
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
        return [idx + 1, n, mat || '\u2014', `Group ${s.group_number}`, s.department]
      })
    )

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Student Name', 'Matric No.', 'Group', 'Department']],
      body: allStudents,
      theme: 'striped',
      headStyles: { fillColor: PURPLE_DARK, fontSize: 9, halign: 'center' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 24, halign: 'center' },
        4: { cellWidth: 56 },
      },
      margin: { left: 16, right: 16 },
      alternateRowStyles: { fillColor: CARD_BG },
      tableLineColor: [210, 200, 230],
      tableLineWidth: 0.15,
    })
    drawFooter(pageNum)

    // ===== PAGE NUMBERS ON ALL PAGES =====
    const totalPages = (doc as any).getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      (doc as any).setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2])
      doc.text(`Page ${i} of ${totalPages}`, pw - 16, ph - 8, { align: 'right' })
      doc.setDrawColor(200, 190, 220)
      doc.line(16, ph - 12, pw - 16, ph - 12)
      doc.text(`COS-102 Project Hub Report`, 16, ph - 8)
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
    { id: 'students', icon: '\uD83C\uDF93', label: 'Students' },
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
                { label: 'Students', value: allStudents.length, color: '#6ee7b7' },
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

          {tab === 'students' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
                  Students <span style={{ color: 'var(--text-3)', fontSize: 16, fontWeight: 400 }}>({filteredStudents.length})</span>
                </h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="input" value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Search name, matric, group..."
                    style={{ width: 200, fontSize: 12, padding: '6px 10px' }} />
                  <select className="input select" value={studentDeptFilter} onChange={e => setStudentDeptFilter(e.target.value)}
                    style={{ width: 160, fontSize: 12, padding: '6px 10px' }}>
                    <option value="">All departments</option>
                    {uniqueStudentDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className="input select" value={studentGroupFilter} onChange={e => setStudentGroupFilter(e.target.value)}
                    style={{ width: 120, fontSize: 12, padding: '6px 10px' }}>
                    <option value="">All groups</option>
                    {uniqueStudentGroups.map(g => <option key={g} value={g}>Group {g}</option>)}
                  </select>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Matric No.</th>
                      <th>Group</th>
                      <th>Department</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((st, idx) => {
                      const isEditing = editStudentKey === `${st.submissionId}-${st.memberIndex}`
                      return (
                        <tr key={`${st.submissionId}-${st.memberIndex}`}>
                          <td style={{ color: 'var(--text-3)', width: 36 }}>{idx + 1}</td>
                          <td>
                            {isEditing ? (
                              <input className="input" value={editStudentName} onChange={e => setEditStudentName(e.target.value)}
                                style={{ width: 180, fontSize: 12, padding: '3px 6px' }} />
                            ) : (
                              <span style={{ fontWeight: 500 }}>{st.name}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input className="input" value={editStudentMatric} onChange={e => setEditStudentMatric(e.target.value)}
                                style={{ width: 120, fontSize: 12, padding: '3px 6px' }} />
                            ) : (
                              <span className="mono" style={{ color: 'var(--violet-light)' }}>{st.matric || '\u2014'}</span>
                            )}
                          </td>
                          <td>Group {st.groupNumber}</td>
                          <td><span className="badge badge-violet" style={{ fontSize: 10 }}>{st.department}</span></td>
                          <td>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button onClick={() => saveStudent(st)} className="btn btn-cyan" style={{ fontSize: 10, padding: '3px 8px' }}>Save</button>
                                <button onClick={cancelEditStudent} className="btn btn-secondary" style={{ fontSize: 10, padding: '3px 8px' }}>Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => startEditStudent(st)} className="btn btn-primary" style={{ fontSize: 10, padding: '3px 8px' }}>Edit</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {filteredStudents.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No students found.</td></tr>
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
                            {' '}
                            <span style={{
                              display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                              padding: '2px 8px', borderRadius: 10, verticalAlign: 'middle',
                              background: d.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: d.active ? '#4ade80' : '#f87171',
                              border: `1px solid ${d.active ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            }}>
                              {d.active ? 'Active' : 'Disabled'}
                            </span>
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
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(d) }}
                            className="btn btn-secondary" style={{ fontSize: 10, padding: '3px 8px' }}>Edit</button>
                          <button onClick={(e) => { e.stopPropagation(); toggleActive(d) }}
                            style={{
                              fontSize: 10, padding: '3px 8px', cursor: 'pointer', borderRadius: 6,
                              fontWeight: 600, border: 'none', transition: 'opacity 0.15s',
                              background: d.active ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                              color: d.active ? '#f87171' : '#4ade80',
                            }}>{d.active ? 'Disable' : 'Enable'}</button>
                          <button onClick={(e) => { e.stopPropagation(); openEmailModal(d) }}
                            className="btn btn-cyan" style={{ fontSize: 10, padding: '3px 8px' }}>Send Email</button>
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
                                    Members ({editingId === submission?.id ? editMembers.length : (submission ? submission.members.length : 0)})
                                  </div>
                                  {submission && editingId === submission.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      {editMembers.map((m, mi) => (
                                        <div key={mi} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                          <span style={{ color: 'var(--text-3)', width: 20, textAlign: 'right', fontSize: 12 }}>{mi + 1}.</span>
                                          <input className="input" value={m.name} onChange={e => updateMemberField(mi, 'name', e.target.value)}
                                            style={{ flex: 1, fontSize: 12, padding: '3px 6px' }} placeholder="Full name" />
                                          <input className="input" value={m.matric} onChange={e => updateMemberField(mi, 'matric', e.target.value)}
                                            style={{ width: 110, fontSize: 12, padding: '3px 6px' }} placeholder="Matric" />
                                          <button onClick={() => removeEditMember(mi)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}>×</button>
                                        </div>
                                      ))}
                                      <button onClick={addEditMember} style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 4, padding: '4px', fontSize: 11, cursor: 'pointer', color: 'var(--text-3)', textAlign: 'center' }}>+ Add</button>
                                    </div>
                                  ) : submission && submission.members.length > 0 ? (
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

                                {/* Edit & Delete buttons for submission */}
                                {submission && (
                                  <div style={{ padding: '6px 14px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                                    {editingId === submission.id ? (
                                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                        <button onClick={() => saveMembers(submission.id)}
                                          className="btn btn-cyan" style={{ fontSize: 10, padding: '3px 8px' }}>Save</button>
                                        <button onClick={cancelEdit}
                                          className="btn btn-secondary" style={{ fontSize: 10, padding: '3px 8px' }}>Cancel</button>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                        <button onClick={() => startEdit(submission)}
                                          className="btn btn-primary" style={{ fontSize: 10, padding: '3px 8px' }}>Edit Members</button>
                                        <button onClick={() => deleteSubmission(submission.id)}
                                          className="btn btn-danger" style={{ fontSize: 10, padding: '3px 8px' }}>Delete</button>
                                      </div>
                                    )}
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
                          <td style={{ fontSize: 11, maxWidth: 200 }}>
                            {editingId === s.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {editMembers.map((m, mi) => (
                                  <div key={mi} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <input className="input" value={m.name} onChange={e => updateMemberField(mi, 'name', e.target.value)}
                                      style={{ width: 90, fontSize: 10, padding: '2px 4px' }} placeholder="Name" />
                                    <input className="input" value={m.matric} onChange={e => updateMemberField(mi, 'matric', e.target.value)}
                                      style={{ width: 70, fontSize: 10, padding: '2px 4px' }} placeholder="Matric" />
                                    <button onClick={() => removeEditMember(mi)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12, padding: 0 }}>×</button>
                                  </div>
                                ))}
                                <button onClick={addEditMember} style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: 10, cursor: 'pointer', color: 'var(--text-3)', marginTop: 2 }}>+ Add</button>
                              </div>
                            ) : (
                              fmtMembers(s.members)
                            )}
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
                            {editingId === s.id ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button onClick={() => saveMembers(s.id)} className="btn btn-cyan" style={{ fontSize: 10, padding: '3px 6px' }}>Save</button>
                                <button onClick={cancelEdit} className="btn btn-secondary" style={{ fontSize: 10, padding: '3px 6px' }}>Cancel</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button onClick={() => startEdit(s)} className="btn btn-primary" style={{ fontSize: 10, padding: '3px 6px' }}>Edit</button>
                                <button onClick={() => deleteSubmission(s.id)} className="btn btn-danger" style={{ fontSize: 10, padding: '3px 6px' }}>Delete</button>
                              </div>
                            )}
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
                        {editingId === s.id ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => saveMembers(s.id)} className="btn btn-cyan" style={{ fontSize: 11, padding: '5px 10px' }}>Save</button>
                            <button onClick={cancelEdit} className="btn btn-secondary" style={{ fontSize: 11, padding: '5px 10px' }}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => startEdit(s)} className="btn btn-primary" style={{ fontSize: 11, padding: '5px 10px' }}>Edit Members</button>
                            <button onClick={() => deleteSubmission(s.id)} className="btn btn-danger" style={{ fontSize: 11, padding: '5px 10px' }}>Delete</button>
                          </div>
                        )}
                      </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Members ({editingId === s.id ? editMembers.length : s.members.length})
                          </p>
                          {editingId === s.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {editMembers.map((m, mi) => (
                                <div key={mi} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                  <input className="input" value={m.name} onChange={e => updateMemberField(mi, 'name', e.target.value)}
                                    style={{ flex: 1, fontSize: 12, padding: '4px 8px' }} placeholder="Full name" />
                                  <input className="input" value={m.matric} onChange={e => updateMemberField(mi, 'matric', e.target.value)}
                                    style={{ width: 120, fontSize: 12, padding: '4px 8px' }} placeholder="Matric No." />
                                  <button onClick={() => removeEditMember(mi)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                                </div>
                              ))}
                              <button onClick={addEditMember} style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 6, padding: '6px', fontSize: 12, cursor: 'pointer', color: 'var(--text-3)', textAlign: 'center' }}>+ Add Member</button>
                            </div>
                          ) : (
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
                          )}
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

      {/* Edit Department Modal */}
      {showEditModal && editDept && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 480, margin: 24 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Edit Department</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Department Name</label>
                <input
                  className="input"
                  value={editForm.department}
                  onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Class Rep Name</label>
                <input
                  className="input"
                  value={editForm.rep_name}
                  onChange={e => setEditForm(f => ({ ...f, rep_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Rep Email</label>
                <input
                  className="input"
                  type="email"
                  value={editForm.rep_email}
                  onChange={e => setEditForm(f => ({ ...f, rep_email: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Rep Phone</label>
                <input
                  className="input"
                  value={editForm.rep_phone}
                  onChange={e => setEditForm(f => ({ ...f, rep_phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Number of Groups</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={editForm.number_of_groups}
                  onChange={e => setEditForm(f => ({ ...f, number_of_groups: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={saveEdit} className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && emailDept && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowEmailModal(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 560, margin: 24 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Send Email</h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
              To: {emailDept.rep_name} &lt;{emailDept.rep_email}&gt; — {emailDept.department}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Subject</label>
                <input
                  className="input"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea
                  className="input"
                  rows={10}
                  value={emailMessage}
                  onChange={e => setEmailMessage(e.target.value)}
                  style={{ resize: 'vertical', minHeight: 160, fontFamily: 'inherit', lineHeight: 1.6 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEmailModal(false)} className="btn btn-secondary" disabled={sendingEmail}>
                Cancel
              </button>
              <button onClick={sendDeptEmail} className="btn btn-cyan" disabled={sendingEmail}>
                {sendingEmail ? <><span className="spinner" /> Sending...</> : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
