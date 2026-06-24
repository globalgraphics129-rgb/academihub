'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { parseMatric, parseMemberEntry, fmtMembers } from '@/lib/matric'
import Navbar from '../components/Navbar'
import { GraduationCap, Building2, Users, Package, Send, Timer, LayoutDashboard, BarChart3, Lock, ArrowLeft, ArrowRight, Download, RefreshCw, ExternalLink, Plus, ChevronDown, ChevronRight, Mail, Edit, Trash2, X, Check, User, Search, Globe, FileText, Rocket, BookOpen, List, Grid3X3, Settings, Bell, ClipboardList, UserPlus, TriangleAlert } from 'lucide-react'

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
  id: string; group_id: string; group_number: number; project_name: string;
  leader_name: string; leader_email: string; leader_phone: string;
  github_link: string; members: Member[]; notes: string;
  submitted_at: string; department: string;
  project_id?: string;
}

interface ProjectInfo {
  id: string; name: string; description: string | null;
  submission_type: string;
  active: boolean; created_at: string;
}
interface StudentEntry {
  submissionId: string
  memberIndex: number
  name: string
  matric: string
  groupNumber: number
  department: string
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'academihubadmin'

const adminFetch = async (url: string, init: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('ah-token') || localStorage.getItem('token') || '') : ''
  const headers = {
    ...init.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  }
  return fetch(url, { ...init, headers })
}

type Tab = 'overview' | 'departments' | 'submissions' | 'students' | 'announcements' | 'projects' | 'settings'

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
  const [editGroup, setEditGroup] = useState<GroupInfo | null>(null)
  const [showEditGroupModal, setShowEditGroupModal] = useState(false)
  const [editGroupForm, setEditGroupForm] = useState({
    group_number: 1, leader_name: '', leader_email: '', leader_phone: '', project_name: ''
  })
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<GroupInfo | null>(null)
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState(false)
  const [timerClosesAt, setTimerClosesAt] = useState('')
  const [timerDate, setTimerDate] = useState('')
  const [timerTime, setTimerTime] = useState('')
  const [savingTimer, setSavingTimer] = useState(false)
  const [existingTimer, setExistingTimer] = useState<string | null>(null)
  const [announceSubject, setAnnounceSubject] = useState('')
  const [announceMessage, setAnnounceMessage] = useState('')
  const [sendingAnnounce, setSendingAnnounce] = useState(false)
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newProjectSubmissionType, setNewProjectSubmissionType] = useState('github')
  const [creatingProject, setCreatingProject] = useState(false)
  const [clearingProject, setClearingProject] = useState<string | null>(null)
  const [deletingProject, setDeletingProject] = useState<string | null>(null)
  const [notifyProjectId, setNotifyProjectId] = useState<string>('')
  const [filterProject, setFilterProject] = useState('')
  const [showPdfOptions, setShowPdfOptions] = useState(false)
  const [pdfSelectedProjects, setPdfSelectedProjects] = useState<string[]>([])
  const [exportPdfLoading, setExportPdfLoading] = useState(false)
  

  const login = () => {
    if (pw === ADMIN_PASSWORD) {
      localStorage.setItem('ah-token', pw)
      setAuthed(true)
    }
    else toast.error('Incorrect password')
  }

  useEffect(() => {
    const token = localStorage.getItem('ah-token') || localStorage.getItem('token')
    if (!token) return
    
    if (token === ADMIN_PASSWORD) {
      setAuthed(true)
      return
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.user?.role === 'admin') {
          setAuthed(true)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (authed) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, filterProject])

  const loadData = async () => {
    setLoading(true)
    try {
      const pid = filterProject || undefined
      const deptUrl = pid ? `/api/admin?type=departments&projectId=${pid}` : '/api/admin?type=departments'
      const subUrl = pid ? `/api/admin?type=submissions&projectId=${pid}` : '/api/admin?type=submissions'
      const [dRes, sRes] = await Promise.all([
        adminFetch(deptUrl),
        adminFetch(subUrl),
      ])
      const dData = await dRes.json()
      const sData = await sRes.json()
      setDepartments(dData.departments || [])
      setSubmissions(sData.submissions || [])
      loadTimerSettings()
      loadProjects()
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const res = await adminFetch('/api/admin/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch {}
  }

  const loadDeptGroups = async (deptId: string) => {
    if (deptGroups[deptId]) return
    setLoadingGroups(true)
    try {
      const res = await adminFetch(`/api/register-group?departmentId=${deptId}`)
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
      await adminFetch(`/api/admin?type=submission&id=${id}`, { method: 'DELETE' })
      setSubmissions(prev => prev.filter(s => s.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const deleteDepartment = async (id: string) => {
    if (!confirm('Delete this department and all its groups/submissions?')) return
    try {
      await adminFetch(`/api/admin?type=department&id=${id}`, { method: 'DELETE' })
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
      const res = await adminFetch(`/api/admin?type=department&id=${editDept.id}`, {
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
    setEmailSubject(`Re: ${d.department} Registration — AcademiHub`)
    setEmailMessage(`Hi ${d.rep_name},

I'm writing regarding your registration of ${d.department} on AcademiHub.

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
      const res = await adminFetch('/api/admin/send-email', {
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
      const res = await adminFetch(`/api/admin?type=department&id=${d.id}`, {
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

  const openEditGroupModal = (g: GroupInfo) => {
    setEditGroup(g)
    setEditGroupForm({
      group_number: g.group_number,
      leader_name: g.leader_name,
      leader_email: g.leader_email,
      leader_phone: g.leader_phone || '',
      project_name: g.project_name,
    })
    setShowEditGroupModal(true)
  }

  const saveGroup = async () => {
    if (!editGroup) return
    if (!editGroupForm.leader_name || !editGroupForm.leader_email || !editGroupForm.project_name) {
      toast.error('Leader name, email, and project name are required')
      return
    }
    try {
      const res = await adminFetch(`/api/admin?type=group&id=${editGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_number: Number(editGroupForm.group_number),
          leader_name: editGroupForm.leader_name,
          leader_email: editGroupForm.leader_email,
          leader_phone: editGroupForm.leader_phone || null,
          project_name: editGroupForm.project_name,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to update')
        return
      }
      const data = await res.json()
      const updated = data.group
      // Refresh groups in the expanded department
      const deptId = departments.find(d =>
        deptGroups[Object.keys(deptGroups).find(k => k === d.id) || '']
      )?.id
      setDeptGroups(prev => {
        const next = { ...prev }
        for (const deptKey of Object.keys(next)) {
          next[deptKey] = next[deptKey].map(g => g.id === editGroup.id ? updated : g)
        }
        return next
      })
      setShowEditGroupModal(false)
      setEditGroup(null)
      toast.success('Group updated')
    } catch { toast.error('Failed to update') }
  }

  const confirmDeleteGroup = (g: GroupInfo) => {
    setDeleteGroupTarget(g)
    setShowDeleteGroupConfirm(true)
  }

  const executeDeleteGroup = async () => {
    if (!deleteGroupTarget) return
    setDeletingGroup(true)
    try {
      const res = await adminFetch(`/api/admin?type=group&id=${deleteGroupTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete')
        return
      }
      setDeptGroups(prev => {
        const next = { ...prev }
        for (const deptKey of Object.keys(next)) {
          next[deptKey] = next[deptKey].filter(g => g.id !== deleteGroupTarget.id)
        }
        return next
      })
      setSubmissions(prev => prev.filter(s => s.group_id !== deleteGroupTarget.id))
      setShowDeleteGroupConfirm(false)
      setDeleteGroupTarget(null)
      toast.success('Group and submission deleted')
    } catch { toast.error('Failed to delete') }
    finally { setDeletingGroup(false) }
  }

  const loadTimerSettings = async () => {
    try {
      const res = await adminFetch('/api/admin/portal-settings')
      if (!res.ok) return
      const data = await res.json()
      if (data.closes_at) {
        setExistingTimer(data.closes_at)
        const d = new Date(data.closes_at)
        setTimerDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
        setTimerTime(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`)
      } else {
        setExistingTimer(null)
      }
    } catch {}
  }

  const saveTimer = async (projectId?: string, skipNotify?: boolean) => {
    if (!timerDate || !timerTime) {
      toast.error('Select both date and time')
      return
    }
    const closesAt = new Date(`${timerDate}T${timerTime}:00`).toISOString()
    setSavingTimer(true)
    try {
      const res = await adminFetch('/api/admin/portal-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closes_at: closesAt, projectId: projectId || null, skipNotify: skipNotify || false }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to save')
        return
      }
      await loadTimerSettings()
      if (skipNotify) toast.success('Timer saved — no notifications sent')
      else if (projectId) {
        const proj = projects.find(p => p.id === projectId)
        toast.success(proj ? `Timer saved — ${proj.name} notified` : 'Timer saved — project notified')
      } else {
        toast.success('Timer saved — all users notified')
      }
    } catch { toast.error('Failed to save timer') }
    finally { setSavingTimer(false) }
  }

  const clearTimer = async () => {
    if (!confirm('Remove the portal timer?')) return
    setSavingTimer(true)
    try {
      const res = await adminFetch('/api/admin/portal-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closes_at: null }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to clear')
        return
      }
      setExistingTimer(null)
      setTimerDate('')
      setTimerTime('')
      toast.success('Timer cleared')
    } catch { toast.error('Failed to clear timer') }
    finally { setSavingTimer(false) }
  }

  const openPortal = async () => {
    setSavingTimer(true)
    try {
      const res = await adminFetch('/api/admin/portal-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closes_at: null }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Failed'); return }
      setExistingTimer(null)
      setTimerDate('')
      setTimerTime('')
      toast.success('Portal is now open')
    } catch { toast.error('Failed to open portal') }
    finally { setSavingTimer(false) }
  }

  const closePortal = async () => {
    if (!confirm('Close the portal now? Submissions will stop immediately.')) return
    setSavingTimer(true)
    try {
      const now = new Date().toISOString()
      const res = await adminFetch('/api/admin/portal-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closes_at: now, skipNotify: true }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Failed'); return }
      setExistingTimer(now)
      toast.success('Portal is now closed')
    } catch { toast.error('Failed to close portal') }
    finally { setSavingTimer(false) }
  }

  const createProject = async () => {
    if (!newProjectName.trim()) { toast.error('Project name is required'); return }
    setCreatingProject(true)
    try {
      const res = await adminFetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim() || null,
          submission_type: newProjectSubmissionType
        }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Failed'); return }
      toast.success('Project created!')
      setShowCreateProject(false)
      setNewProjectName('')
      setNewProjectDesc('')
      setNewProjectSubmissionType('github')
      loadProjects()
    } catch { toast.error('Failed to create project') }
    finally { setCreatingProject(false) }
  }

  const activateProject = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/projects?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Failed'); return }
      toast.success('Project activated')
      loadProjects()
    } catch { toast.error('Failed to activate') }
  }

  const clearProjectData = async (id: string) => {
    if (!confirm('This will permanently delete all departments, groups, and submissions for this project. Are you sure?')) return
    setClearingProject(id)
    try {
      const res = await adminFetch(`/api/admin/projects/clear?id=${id}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Failed'); return }
      toast.success('Project data cleared')
      loadProjects()
    } catch { toast.error('Failed to clear data') }
    finally { setClearingProject(null) }
  }

  const deleteProject = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}" and all its departments, groups, and submissions? This cannot be undone.`)) return
    setDeletingProject(id)
    try {
      const res = await adminFetch(`/api/admin/projects?id=${id}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Failed'); return }
      setProjects(prev => prev.filter(p => p.id !== id))
      if (filterProject === id) setFilterProject('')
      toast.success(`"${name}" deleted`)
    } catch { toast.error('Failed to delete project') }
    finally { setDeletingProject(null) }
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
      const res = await adminFetch(`/api/admin?type=submission&id=${id}`, {
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
      const res = await adminFetch(`/api/admin?type=submission&id=${st.submissionId}`, {
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

  const exportPDF = (fromSubmissions?: Submission[], fromDepartments?: Department[]) => {
    const subs = fromSubmissions || submissions
    const depts = fromDepartments || departments
    if (subs.length === 0) {
      toast.error('No submissions to export')
      return
    }

    const doc = new jsPDF('landscape', 'mm', 'a4')
    const pw = doc.internal.pageSize.getWidth()
    const ph = doc.internal.pageSize.getHeight()

    const DARK: [number, number, number] = [5, 80, 70]
    const MID: [number, number, number] = [5, 150, 105]
    const LIGHT: [number, number, number] = [13, 148, 136]
    const ACCENT: [number, number, number] = [20, 200, 190]
    const CARD_BG: [number, number, number] = [236, 253, 245]
    const TEXT_MUTED: [number, number, number] = [100, 130, 120]
    const TEXT_DARK: [number, number, number] = [30, 50, 40]

    const totalStudents = subs.reduce((a, s) => a + s.members.length, 0)
    const uniqueProjects = new Set(subs.map(s => s.project_name)).size
    const grouped = subs.reduce<Record<string, Submission[]>>((acc, s) => {
      if (!acc[s.department]) acc[s.department] = []
      acc[s.department].push(s)
      return acc
    }, {})
    const deptNames = Object.keys(grouped).sort()

    const drawFooter = (pageNum?: number) => {
      doc.setFontSize(8)
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2])
      doc.text(`AcademiHub Report`, 16, ph - 8)
      if (pageNum) doc.text(`Page ${pageNum}`, pw - 16, ph - 8, { align: 'right' })
      doc.setDrawColor(200, 190, 220)
      doc.line(16, ph - 12, pw - 16, ph - 12)
    }

    const addSectionPage = (title: string) => {
      doc.addPage()
      doc.setFillColor(DARK[0], DARK[1], DARK[2])
      doc.rect(0, 0, pw, 24, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.text(title, 16, 17)
    }

    // ===== COVER PAGE =====
    doc.setFillColor(DARK[0], DARK[1], DARK[2])
    doc.rect(0, 0, pw, ph, 'F')
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2])
    doc.rect(0, ph / 2 - 40, pw, 2, 'F')
    doc.rect(0, ph / 2 + 36, pw, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(36)
    doc.text('AcademiHub', pw / 2, ph / 2 - 18, { align: 'center' })
    doc.setFontSize(22)
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2])
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
      ['Departments', `${deptNames.length}`, MID],
      ['Submissions', `${subs.length}`, LIGHT],
      ['Students', `${totalStudents}`, ACCENT],
      ['Projects', `${uniqueProjects}`, [245, 180, 50]],
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
        ['Departments Registered', `${depts.length}`],
        ['Departments with Submissions', `${deptNames.length}`],
        ['Total Submissions', `${subs.length}`],
        ['Total Students', `${totalStudents}`],
        ['Unique Projects', `${uniqueProjects}`],
        ['Avg Students per Submission', `${(totalStudents / subs.length).toFixed(1)}`],
        ['Avg Submissions per Dept', `${(subs.length / Math.max(deptNames.length, 1)).toFixed(1)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: MID, fontSize: 10, halign: 'center' },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 160 }, 1: { halign: 'center', cellWidth: 50 } },
      margin: { left: 16, right: 16 },
      tableLineColor: LIGHT,
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
      const deptInfo = depts.find(d => d.department === dept)
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
      headStyles: { fillColor: DARK, fontSize: 9, halign: 'center' },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 60 }, 2: { halign: 'center', cellWidth: 30 }, 3: { halign: 'center', cellWidth: 30 } },
      margin: { left: 16, right: 16 },
      alternateRowStyles: { fillColor: CARD_BG },
      tableLineColor: [5, 150, 105],
      tableLineWidth: 0.2,
    })

    drawFooter(2)

    // ===== DETAILED REPORT =====
    addSectionPage('Detailed Departmental Report')

    yPos = 36
    let pageNum = 3

    deptNames.forEach((dept) => {
      const deptSubs = grouped[dept]
      const deptInfo = depts.find(d => d.department === dept)

      if (yPos > ph - 70) {
        drawFooter(pageNum)
        addSectionPage('Detailed Departmental Report (cont.)')
        yPos = 36
        pageNum++
      }

      doc.setFillColor(MID[0], MID[1], MID[2])
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

        doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2])
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
            headStyles: { fillColor: DARK, fontSize: 8, halign: 'center' },
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

    const allStudents = subs.flatMap(s =>
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
      headStyles: { fillColor: DARK, fontSize: 9, halign: 'center' },
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
      doc.text(`AcademiHub Report`, 16, ph - 8)
    }

    doc.save(`AcademiHub-Report-${Date.now()}.pdf`)
    toast.success('PDF exported!')
  }

  const handlePdfExport = async () => {
    const selected = pdfSelectedProjects
    if (selected.length === 0 || selected.length === projects.length) {
      exportPDF()
      return
    }
    setExportPdfLoading(true)
    try {
      const results = await Promise.all(selected.map(async (pid) => {
        const [dRes, sRes] = await Promise.all([
          adminFetch(`/api/admin?type=departments&projectId=${pid}`),
          adminFetch(`/api/admin?type=submissions&projectId=${pid}`),
        ])
        return {
          depts: ((await dRes.json()).departments || []) as Department[],
          subs: ((await sRes.json()).submissions || []) as Submission[],
        }
      }))
      const mergedSubs = results.flatMap(r => r.subs)
      const mergedDepts = results.flatMap(r => r.depts)
      setShowPdfOptions(false)
      exportPDF(mergedSubs, mergedDepts)
    } catch {
      toast.error('Failed to load data for PDF')
    } finally {
      setExportPdfLoading(false)
    }
  }

  const togglePdfProject = (id: string) => {
    setPdfSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
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
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative' }}>
        <div className="spotlight" style={{ top: '20%', left: '30%' }} />
        <div style={{ width: '100%', maxWidth: 420, padding: 24, position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ display: 'inline-flex', padding: 14, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: 16 }}>
              <Lock size={32} style={{ color: 'var(--primary-light)' }} />
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>Admin Access</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>AcademiHub — Lecturer & Admin Gateway</p>
          </div>
          <div className="glow-card" style={{ padding: 32 }}>
            <label className="label" style={{ fontSize: 11, letterSpacing: '1px' }}>System Password</label>
            <input
              className="input"
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="Enter system access code..."
              style={{ marginBottom: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(16,185,129,0.2)' }}
            />
            <button onClick={login} className="btn btn-primary" style={{ width: '100%', height: 46 }}>
              Enter Console <ArrowRight size={16} />
            </button>
          </div>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13 }}>
            <Link href="/" style={{ color: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}><ArrowLeft size={14} /> Return to Main Terminal</Link>
          </p>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'overview', icon: 'OV', label: 'Overview' },
    { id: 'students', icon: 'ST', label: 'Students' },
    { id: 'departments', icon: 'DP', label: 'Departments' },
    { id: 'submissions', icon: 'SB', label: 'Submissions' },
    { id: 'announcements', icon: 'AN', label: 'Announce' },
    { id: 'projects', icon: 'PJ', label: 'Projects' },
    { id: 'settings', icon: 'TM', label: 'Timer' },
  ]

  return (
    <div className="page">
      <Navbar
        isAdmin={true}
        adminControls={
          <div className="admin-nav-controls">
            <span className="badge badge-violet">Admin Panel</span>
            {projects.length > 0 && (
              <select
                className="input select"
                value={filterProject}
                onChange={e => { setFilterProject(e.target.value); setPdfSelectedProjects([]); }}
                style={{ width: 200, fontSize: 12, padding: '6px 10px' }}
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            <button onClick={loadData} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {loading ? <span className="spinner" /> : <RefreshCw size={14} />} Refresh
            </button>
            <button onClick={() => { setPdfSelectedProjects(filterProject ? [filterProject] : []); setShowPdfOptions(true); }} className="btn btn-cyan" style={{ fontSize: 12, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Download size={14} /> Export PDF Report
            </button>
          </div>
        }
        menuTabs={tabs}
        currentTab={tab}
        onTabChange={setTab}
      />

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
          <div className="admin-tabs-bar">
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

          {/* Mobile Admin Controls Toolbar (visible only on mobile) */}
          <div className="mobile-admin-toolbar">
            {projects.length > 0 && (
              <select
                className="input select"
                value={filterProject}
                onChange={e => { setFilterProject(e.target.value); setPdfSelectedProjects([]); }}
                style={{ flex: 1, minWidth: 150, fontSize: 12, padding: '8px 12px' }}
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button onClick={loadData} className="btn btn-secondary" style={{ flex: 1, fontSize: 12, padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {loading ? <span className="spinner" /> : <RefreshCw size={14} />} Refresh
              </button>
              <button onClick={() => { setPdfSelectedProjects(filterProject ? [filterProject] : []); setShowPdfOptions(true); }} className="btn btn-cyan" style={{ flex: 1, fontSize: 12, padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Download size={14} /> Export PDF
              </button>
            </div>
          </div>

          {tab === 'overview' && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 24 }}>Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 36 }}>
                {[
                  { label: 'Registered Depts', value: departments.length, icon: <Building2 size={24} />, color: 'var(--primary-light)' },
                  { label: 'Project Submissions', value: submissions.length, icon: <Rocket size={24} />, color: 'var(--secondary-light)' },
                  { label: 'Total Students', value: submissions.reduce((a, s) => a + s.members.length, 0), icon: <Users size={24} />, color: '#10b981' },
                  { label: 'Unique Projects', value: new Set(submissions.map(s => s.project_name)).size, icon: <BookOpen size={24} />, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="glow-card" style={{ padding: 24, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span style={{ color: s.color }}>{s.icon}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: 0.5 }}>LIVE</span>
                    </div>
                    <div className="stat-number" style={{ color: s.color, fontSize: 32, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                    <div className="stat-label" style={{ fontSize: 11, marginTop: 4 }}>{s.label}</div>
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
                <div className="filter-row">
                  <input className="input" value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Search name, matric, group..."
                    style={{ flex: 1, minWidth: 180, fontSize: 12, padding: '6px 10px' }} />
                  <select className="input select" value={studentDeptFilter} onChange={e => setStudentDeptFilter(e.target.value)}
                    style={{ flex: 1, minWidth: 140, fontSize: 12, padding: '6px 10px' }}>
                    <option value="">All departments</option>
                    {uniqueStudentDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className="input select" value={studentGroupFilter} onChange={e => setStudentGroupFilter(e.target.value)}
                    style={{ flex: 1, minWidth: 100, fontSize: 12, padding: '6px 10px' }}>
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
                              <ClipboardList size={28} style={{ marginBottom: 8 }} />
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
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span className={`badge ${g.submitted ? 'badge-green' : 'badge-violet'}`}>
                                      {g.submitted ? 'Submitted' : 'Pending'}
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); openEditGroupModal(g) }}
                                      className="btn btn-secondary" style={{ fontSize: 10, padding: '2px 7px' }}>Edit</button>
                                    <button onClick={(e) => { e.stopPropagation(); confirmDeleteGroup(g) }}
                                      className="btn btn-danger" style={{ fontSize: 10, padding: '2px 7px' }}>Delete</button>
                                  </div>
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
                    <p style={{ fontSize: 32, marginBottom: 12 }}><Building2 size={32} /></p>
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
                    List Table
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 11, padding: '6px 12px' }}
                  >
                    Grid Cards
                  </button>
                  <button onClick={() => { setPdfSelectedProjects(filterProject ? [filterProject] : []); setShowPdfOptions(true); }} className="btn btn-cyan" style={{ fontSize: 12 }}>
                    <Download size={14} /> Export PDF
                  </button>
                </div>
              </div>

              <div className="filter-row" style={{ marginBottom: 20 }}>
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
                  style={{ flex: 1, minWidth: 150 }}
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
                            <span className="badge badge-green">Submitted</span>
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
                          {(() => {
                            const proj = projects.find(p => p.id === s.project_id)
                            const subType = proj?.submission_type || 'github'
                            if (subType === 'github') {
                              return <><ExternalLink size={14} style={{ marginRight: 6 }} /> GitHub <ArrowRight size={14} style={{ marginLeft: 4 }} /></>
                            } else if (subType === 'file_link') {
                              return <><ExternalLink size={14} style={{ marginRight: 6 }} /> View File <ArrowRight size={14} style={{ marginLeft: 4 }} /></>
                            } else {
                              return <><ExternalLink size={14} style={{ marginRight: 6 }} /> View Link <ArrowRight size={14} style={{ marginLeft: 4 }} /></>
                            }
                          })()}
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
                      <p style={{ fontSize: 32, marginBottom: 12 }}><Mail size={32} /></p>
                      <p>No submissions match your search.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'announcements' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Announcements</h2>
              </div>

              <div className="card" style={{ maxWidth: 600, padding: 24 }}>
                <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>
                  Send an email announcement to all registered class reps and group leaders.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="label">Subject</label>
                    <input
                      className="input"
                      value={announceSubject}
                      onChange={e => setAnnounceSubject(e.target.value)}
                      placeholder="e.g. Important Update: Submission Guidelines"
                    />
                  </div>
                  <div>
                    <label className="label">Message</label>
                    <textarea
                      className="input"
                      rows={10}
                      value={announceMessage}
                      onChange={e => setAnnounceMessage(e.target.value)}
                      placeholder="Write your announcement message here..."
                      style={{ resize: 'vertical', minHeight: 200, fontFamily: 'inherit', lineHeight: 1.6 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <button
                    onClick={async () => {
                      if (!announceSubject || !announceMessage) {
                        toast.error('Subject and message are required')
                        return
                      }
                      setSendingAnnounce(true)
                      try {
                        const res = await adminFetch('/api/admin/announce', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            subject: announceSubject,
                            message: announceMessage,
                          }),
                        })
                        if (!res.ok) {
                          const err = await res.json()
                          toast.error(err.error || 'Failed to send')
                          return
                        }
                        toast.success('Announcement sent to all users!')
                        setAnnounceSubject('')
                        setAnnounceMessage('')
                      } catch {
                        toast.error('Failed to send announcement')
                      } finally {
                        setSendingAnnounce(false)
                      }
                    }}
                    className="btn btn-primary"
                    disabled={sendingAnnounce}
                  >
                    {sendingAnnounce ? <><span className="spinner" /> Sending...</> : 'Send Announcement to All'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'projects' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Projects</h2>
                <button onClick={() => setShowCreateProject(true)} className="btn btn-primary" style={{ fontSize: 13 }}>
                  + New Project
                </button>
              </div>

              {showCreateProject && (
                <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Create New Project</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label className="label">Project / Course Name *</label>
                      <input className="input" value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                        placeholder="e.g. COS 201 Data Structures" />
                    </div>
                    <div>
                      <label className="label">Description (optional)</label>
                      <textarea className="input" value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)}
                        placeholder="Brief description of this project..."
                        style={{ minHeight: 80, resize: 'vertical' }} />
                    </div>
                    <div>
                      <label className="label">Submission / Entry Type *</label>
                      <select className="input select" value={newProjectSubmissionType} onChange={e => setNewProjectSubmissionType(e.target.value)}>
                        <option value="github">GitHub Repository Link</option>
                        <option value="file_link">Document / File Link (Google Drive, OneDrive, etc.)</option>
                        <option value="any_link">General Link (Figma, Website, Video, doc link, etc.)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                    <button onClick={() => { setShowCreateProject(false); setNewProjectName(''); setNewProjectDesc(''); setNewProjectSubmissionType('github') }}
                      className="btn btn-secondary">Cancel</button>
                    <button onClick={createProject} className="btn btn-primary" disabled={creatingProject}>
                      {creatingProject ? <><span className="spinner" /> Creating...</> : 'Create Project'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {projects.map(p => {
                  const isActive = p.active
                  return (
                    <div key={p.id} className="card" style={{
                      padding: '16px 20px',
                      border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</span>
                          {isActive && <span className="badge badge-violet">Active</span>}
                          {p.submission_type && (
                            <span className="badge badge-cyan" style={{ textTransform: 'capitalize' }}>
                              {p.submission_type.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        {p.description && <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.description}</p>}
                        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                          Created: {new Date(p.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {!isActive && (
                          <button onClick={() => activateProject(p.id)} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                            Activate
                          </button>
                        )}
                        <button onClick={() => clearProjectData(p.id)} className="btn btn-danger" style={{ fontSize: 12, padding: '6px 12px' }}
                          disabled={clearingProject === p.id}>
                          {clearingProject === p.id ? <><span className="spinner" /> Clearing...</> : 'Clear Data'}
                        </button>
                        <button onClick={() => deleteProject(p.id, p.name)} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                          disabled={deletingProject === p.id}>
                          {deletingProject === p.id ? <><span className="spinner" /> Deleting...</> : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )
                })}
                {projects.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                    <p>No projects yet. Create your first project to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Portal Timer</h2>
              </div>

              <div className="card" style={{ maxWidth: 500, padding: 24 }}>
                <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>
                  Set a date and time for the portal to automatically close. Times are in Africa/Lagos (WAT).
                  All users will be emailed the deadline. When the timer reaches zero, users will be notified
                  and you&apos;ll receive the final submission report.
                </p>

                {existingTimer && (
                  <div style={{
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                      Current Timer
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--text)' }}>
                      {new Date(existingTimer).toLocaleString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                        timeZone: 'Africa/Lagos',
                      })} <span style={{ fontSize: 11, color: 'var(--text-3)' }}>(WAT)</span>
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label className="label">Date</label>
                    <input
                      className="input"
                      type="date"
                      value={timerDate}
                      onChange={e => setTimerDate(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <label className="label">Time</label>
                    <input
                      className="input"
                      type="time"
                      value={timerTime}
                      onChange={e => setTimerTime(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => saveTimer()} className="btn btn-primary" disabled={savingTimer}>
                    {savingTimer ? <><span className="spinner" /> Saving...</> : 'Set Timer & Notify All'}
                  </button>
                  <button onClick={() => saveTimer(notifyProjectId || undefined)} className="btn btn-cyan" disabled={savingTimer || !notifyProjectId}>
                    {savingTimer ? <><span className="spinner" /> Saving...</> : 'Set Timer & Notify Project'}
                  </button>
                  <button onClick={() => saveTimer(undefined, true)} className="btn btn-secondary" disabled={savingTimer}>
                    {savingTimer ? <><span className="spinner" /> Saving...</> : 'Set Timer (No Notification)'}
                  </button>
                  {existingTimer && (
                    <button onClick={clearTimer} className="btn btn-danger" disabled={savingTimer}>
                      Clear Timer
                    </button>
                  )}
                </div>

                {projects.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <label className="label">Notify a specific project (optional)</label>
                    <select
                      className="input select"
                      value={notifyProjectId}
                      onChange={e => setNotifyProjectId(e.target.value)}
                    >
                      <option value="">-- Notify all --</option>
                      {projects.filter(p => p.active).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="card" style={{ maxWidth: 500, padding: 24, marginTop: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Portal Status</h3>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', display: 'inline-block',
                    background: existingTimer && new Date(existingTimer).getTime() <= Date.now() ? '#ef4444' : '#10b981',
                    boxShadow: existingTimer && new Date(existingTimer).getTime() <= Date.now() ? '0 0 8px #ef4444' : '0 0 8px #10b981',
                  }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: existingTimer && new Date(existingTimer).getTime() <= Date.now() ? '#fca5a5' : 'var(--primary-light)' }}>
                    {existingTimer && new Date(existingTimer).getTime() > Date.now() ? 'Closing Soon (Timer Set)' : existingTimer ? 'Closed' : 'Open'}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6 }}>
                  {existingTimer && new Date(existingTimer).getTime() > Date.now()
                    ? `Scheduled to close at ${new Date(existingTimer).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })} (WAT)`
                    : existingTimer ? 'The portal is closed. Submissions are not being accepted.'
                    : 'The portal is open. Submissions are being accepted.'}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(existingTimer && new Date(existingTimer).getTime() <= Date.now()) || (!existingTimer) ? (
                    <button onClick={openPortal} className="btn btn-cyan" disabled={savingTimer}>
                      {savingTimer ? <><span className="spinner" /> Opening...</> : 'Open Portal Now'}
                    </button>
                  ) : null}
                  {(!existingTimer || (existingTimer && new Date(existingTimer).getTime() > Date.now())) ? (
                    <button onClick={closePortal} className="btn btn-danger" disabled={savingTimer}>
                      {savingTimer ? <><span className="spinner" /> Closing...</> : 'Close Portal Now'}
                    </button>
                  ) : null}
                  {existingTimer && (
                    <button onClick={clearTimer} className="btn btn-secondary" disabled={savingTimer}>
                      Clear Timer
                    </button>
                  )}
                </div>
              </div>
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
      {/* Edit Group Modal */}
      {showEditGroupModal && editGroup && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowEditGroupModal(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 480, margin: 24 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Edit Group</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Group Number</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={editGroupForm.group_number}
                  onChange={e => setEditGroupForm(f => ({ ...f, group_number: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="label">Project Name</label>
                <input
                  className="input"
                  value={editGroupForm.project_name}
                  onChange={e => setEditGroupForm(f => ({ ...f, project_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Leader Name</label>
                <input
                  className="input"
                  value={editGroupForm.leader_name}
                  onChange={e => setEditGroupForm(f => ({ ...f, leader_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Leader Email</label>
                <input
                  className="input"
                  type="email"
                  value={editGroupForm.leader_email}
                  onChange={e => setEditGroupForm(f => ({ ...f, leader_email: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Leader Phone</label>
                <input
                  className="input"
                  value={editGroupForm.leader_phone}
                  onChange={e => setEditGroupForm(f => ({ ...f, leader_phone: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditGroupModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={saveGroup} className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation */}
      {showDeleteGroupConfirm && deleteGroupTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => !deletingGroup && setShowDeleteGroupConfirm(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 400, margin: 24, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ fontSize: 40, marginBottom: 12 }}><TriangleAlert size={40} /></p>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Delete Group?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 20 }}>
              This will permanently delete Group {deleteGroupTarget.group_number}
              ({deleteGroupTarget.project_name}) and its submission.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteGroupConfirm(false)}
                className="btn btn-secondary"
                disabled={deletingGroup}
              >
                Cancel
              </button>
              <button onClick={executeDeleteGroup} className="btn btn-danger" disabled={deletingGroup}>
                {deletingGroup ? <><span className="spinner" /> Deleting...</> : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Options Modal */}
      {showPdfOptions && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => !exportPdfLoading && setShowPdfOptions(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 460, margin: 24 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Export PDF Report</h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
              Select one or more projects to include in the report.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  background: pdfSelectedProjects.length === projects.length ? 'rgba(6,182,212,0.08)' : 'transparent',
                  border: `1px solid ${pdfSelectedProjects.length === projects.length ? 'var(--cyan-light)' : 'var(--border)'}`,
                  marginBottom: 8,
                }}
                onClick={() => {
                  if (pdfSelectedProjects.length === projects.length) {
                    setPdfSelectedProjects([])
                  } else {
                    setPdfSelectedProjects(projects.map(p => p.id))
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={pdfSelectedProjects.length === projects.length}
                  readOnly
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>All Projects ({projects.length})</span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
                {projects.map(p => (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px',
                      borderRadius: 6, cursor: 'pointer', fontSize: 13,
                      background: pdfSelectedProjects.includes(p.id) ? 'rgba(5,150,105,0.06)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onClick={() => togglePdfProject(p.id)}
                  >
                    <input
                      type="checkbox"
                      checked={pdfSelectedProjects.includes(p.id)}
                      readOnly
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>{p.name}</span>
                    {p.active && <span className="badge badge-violet" style={{ fontSize: 9 }}>Active</span>}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button onClick={() => setShowPdfOptions(false)} className="btn btn-secondary" disabled={exportPdfLoading}>
                Cancel
              </button>
              <button onClick={handlePdfExport} className="btn btn-cyan" disabled={exportPdfLoading}>
                {exportPdfLoading ? <><span className="spinner" /> Generating...</> : `Generate PDF (${pdfSelectedProjects.length || 'All'} project${pdfSelectedProjects.length !== 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
