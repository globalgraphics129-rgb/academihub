'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { parseMemberEntry } from '@/lib/matric'

interface Department { id: string; department: string; number_of_groups: number }
interface Group { id: string; group_number: number; leader_name: string; project_name: string; submitted: boolean }
interface Member { name: string; matric: string }

type InputMode = 'manual' | 'bulk' | 'upload'

export default function SubmitProject() {
  const [portalClosed, setPortalClosed] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [inputMode, setInputMode] = useState<InputMode>('manual')
  const [memberName, setMemberName] = useState('')
  const [memberMatric, setMemberMatric] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [githubLink, setGithubLink] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/portal-settings')
      .then(r => r.json())
      .then(data => {
        if (data.closes_at && new Date(data.closes_at).getTime() < Date.now()) {
          setPortalClosed(true)
        }
      })
      .catch(() => {})
    fetch('/api/register-department')
      .then(r => r.json())
      .then(data => setDepartments(data.departments || []))
  }, [])

  useEffect(() => {
    if (!selectedDept) { setGroups([]); setSelectedGroup(''); return }
    fetch(`/api/register-group?departmentId=${selectedDept}`)
      .then(r => r.json())
      .then(data => setGroups(data.groups || []))
  }, [selectedDept])

  const addMember = () => {
    const raw = memberName.trim()
    if (!raw) { toast.error('Enter a member name'); return }
    let name = raw
    let matric = memberMatric.trim()
    if (!matric) {
      const parsed = parseMemberEntry(raw)
      name = parsed.name
      matric = parsed.matric
    }
    if (members.some(m => m.name.toLowerCase() === name.toLowerCase() && m.matric === matric)) {
      toast.error('Member already added'); return
    }
    setMembers(prev => [...prev, { name, matric }])
    setMemberName('')
    setMemberMatric('')
    nameRef.current?.focus()
  }

  const removeMember = (name: string) => setMembers(prev => prev.filter(m => m.name !== name))

  const onNameChange = (val: string) => {
    setMemberName(val)
    if (!memberMatric) {
      const parsed = parseMemberEntry(val)
      if (parsed.matric) {
        setMemberName(parsed.name)
        setMemberMatric(parsed.matric)
      }
    }
  }

  const parseBulk = () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    const parsed: Member[] = []
    for (const line of lines) {
      const result = parseMemberEntry(line)
      if (result.name) parsed.push(result)
    }
    if (parsed.length === 0) { toast.error('No valid entries found'); return }
    const existing = new Set(members.map(m => m.name + '|' + m.matric))
    const newMembers = parsed.filter(m => !existing.has(m.name + '|' + m.matric))
    setMembers(prev => [...prev, ...newMembers])
    setBulkText('')
    setInputMode('manual')
    toast.success(`${newMembers.length} members added`)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload-members', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to parse file')
      const existing = new Set(members.map(m => m.name + '|' + m.matric))
      const newMembers = data.members.filter((m: Member) => !existing.has(m.name + '|' + m.matric))
      setMembers(prev => [...prev, ...newMembers])
      toast.success(`${newMembers.length} members loaded from file`)
      setInputMode('manual')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const selectedGroupData = groups.find(g => g.id === selectedGroup)
  const deptData = departments.find(d => d.id === selectedDept)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDept || !selectedGroup) { toast.error('Select department and group'); return }
    if (members.length === 0) { toast.error('Add at least one group member'); return }
    if (!githubLink.startsWith('https://github.com')) { toast.error('Please enter a valid GitHub link'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/submit-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: selectedGroup, members, githubLink, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setSubmittedData(data)
      setDone(true)
      toast.success('Project submitted! 🎉')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done && submittedData) {
    return (
      <div className="page">
        <nav className="nav">
          <div className="nav-inner">
            <Link href="/" className="nav-logo">
              <div className="nav-logo-icon">🎓</div>
              <span className="nav-logo-text gradient-text">AcademiHub</span>
            </Link>
          </div>
        </nav>
        <div className="form-container" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div className="success-icon">🚀</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: -1 }}>
            Project Submitted!
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Confirmation emails have been sent. Your lecturer can view everything from the admin panel.
          </p>
          <div className="card" style={{ textAlign: 'left', marginBottom: 24 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, marginBottom: 16, color: 'var(--violet-light)', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
              Submission Summary
            </h3>
            {[
              ['Project', selectedGroupData?.project_name],
              ['Department', deptData?.department],
              ['Group', `Group ${selectedGroupData?.group_number}`],
              ['Leader', selectedGroupData?.leader_name],
              ['Members', `${members.length} students`],
              ['GitHub', githubLink],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{label}</span>
                <span style={{ color: 'var(--text)', fontWeight: 500, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>
                  {label === 'GitHub' ? (
                    <a href={value as string} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan-light)' }}>{value}</a>
                  ) : value}
                </span>
              </div>
            ))}
            {members.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Members</p>
                {members.map(m => (
                  <div key={m.name + m.matric} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px solid rgba(124,58,237,0.06)' }}>
                    <span style={{ color: 'var(--text-2)' }}>{m.name}</span>
                    <span className="mono">{m.matric || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-primary">Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  const modes: { id: InputMode; icon: string; label: string }[] = [
    { id: 'manual', icon: '✏️', label: 'One by one' },
    { id: 'bulk', icon: '📋', label: 'Paste list' },
    { id: 'upload', icon: '📄', label: 'Upload file' },
  ]

  if (portalClosed) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83D\uDD12'}</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 12 }}>Portal Closed</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            The submission portal has been closed. Project submissions are no longer available.
          </p>
          <Link href="/" className="btn btn-secondary" style={{ display: 'inline-block' }}>← Back Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">🎓</div>
            <span className="nav-logo-text gradient-text">AcademiHub</span>
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">← Home</Link>
          </div>
        </div>
      </nav>

      <div className="form-container">
        <div style={{ marginBottom: 36, animation: 'fade-up 0.5s ease both' }}>
          <p className="section-eyebrow">Step 3 of 3</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 10 }}>
            Submit Your Project
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6 }}>
            Final step! Add your group members and GitHub project link.
          </p>
        </div>

        <div className="steps" style={{ animation: 'fade-up 0.5s 0.1s ease both', opacity: 0 }}>
          <div className="step">
            <div className="step-dot done">✓</div>
            <span className="step-label done">Department</span>
          </div>
          <div className="step-line done" />
          <div className="step">
            <div className="step-dot done">✓</div>
            <span className="step-label done">Groups</span>
          </div>
          <div className="step-line done" />
          <div className="step">
            <div className="step-dot active">3</div>
            <span className="step-label active">Submit</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ animation: 'fade-up 0.5s 0.2s ease both', opacity: 0 }}>
          {/* Department & Group */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, marginBottom: 20, color: 'var(--violet-light)', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
              Find Your Group
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Department *</label>
                <select
                  className="input select"
                  value={selectedDept}
                  onChange={e => { setSelectedDept(e.target.value); setSelectedGroup('') }}
                  required
                >
                  <option value="">Select your department...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.department}</option>)}
                </select>
              </div>
              {selectedDept && (
                <div>
                  <label className="label">Your Group *</label>
                  {groups.length === 0 ? (
                    <div style={{ padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-3)' }}>
                      No groups registered yet. <Link href="/register-group" style={{ color: 'var(--violet-light)' }}>Register your group first →</Link>
                    </div>
                  ) : (
                    <select
                      className="input select"
                      value={selectedGroup}
                      onChange={e => setSelectedGroup(e.target.value)}
                      required
                    >
                      <option value="">Select your group...</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id} disabled={g.submitted}>
                          Group {g.group_number} — {g.project_name} — {g.leader_name}
                          {g.submitted ? ' (Submitted)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet-light)', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
                Group Members ({members.length})
              </h3>
            </div>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {modes.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setInputMode(m.id)}
                  className={`btn ${inputMode === m.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: 11, padding: '6px 12px', flex: 1 }}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {inputMode === 'manual' && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    ref={nameRef}
                    className="input"
                    value={memberName}
                    onChange={e => onNameChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMember() } }}
                    placeholder="Full name..."
                    style={{ flex: 1 }}
                  />
                  <input
                    className="input"
                    value={memberMatric}
                    onChange={e => setMemberMatric(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMember() } }}
                    placeholder="Matric No."
                    style={{ width: 140 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addMember}
                    style={{ padding: '12px 16px', flexShrink: 0 }}
                  >
                    Add
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Enter name and matric number, then press Enter or click Add</p>
              </div>
            )}

            {inputMode === 'bulk' && (
              <div>
                <label className="label">Paste members (Name, Matric — one per line)</label>
                <textarea
                  className="input textarea"
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder={"Chukwuemeka Obi, 2023/1234\nAmina Lawal, 2023/5678\nTunde Adebayo, 2023/9012\n..."}
                  style={{ minHeight: 140, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
                />
                <button
                  type="button"
                  className="btn btn-cyan"
                  style={{ marginTop: 10, width: '100%' }}
                  onClick={parseBulk}
                  disabled={!bulkText.trim()}
                >
                  Add Members →
                </button>
              </div>
            )}

            {inputMode === 'upload' && (
              <div>
                <label className="label">Upload CSV or PDF</label>
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 12,
                  padding: 32,
                  textAlign: 'center',
                  transition: 'border-color 0.2s',
                  position: 'relative',
                }}>
                  <input
                    type="file"
                    accept=".csv,.pdf"
                    onChange={handleFileUpload}
                    style={{
                      position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer',
                    }}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div>
                      <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Parsing file...</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: 28, marginBottom: 8 }}>📄</p>
                      <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>
                        Drop a <strong>.csv</strong> or <strong>.pdf</strong> file here
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        CSV format: <span className="mono">Name, MatricNumber</span> (one per row)
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        PDF: names and matric numbers extracted automatically
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {members.length > 0 && (
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(6,182,212,0.05)', borderRadius: 10, border: '1px solid rgba(6,182,212,0.15)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {members.map(m => (
                    <div key={m.name + m.matric} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 10px', background: 'rgba(6,182,212,0.08)', borderRadius: 8,
                      border: '1px solid rgba(6,182,212,0.12)',
                    }}>
                      <div>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{m.name}</span>
                        {m.matric && <span className="mono" style={{ marginLeft: 8, fontSize: 11 }}>{m.matric}</span>}
                      </div>
                      <button type="button" onClick={() => removeMember(m.name)}
                        style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GitHub */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, marginBottom: 16, color: 'var(--violet-light)', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
              Project Repository
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">GitHub Repository Link *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 12, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    github.com/
                  </span>
                  <input
                    className="input"
                    type="url"
                    value={githubLink}
                    onChange={e => setGithubLink(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    style={{ paddingLeft: 100 }}
                    required
                  />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                  Must be a valid public GitHub repository
                </p>
              </div>
              <div>
                <label className="label">Additional Notes (optional)</label>
                <textarea
                  className="input textarea"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any extra info for the lecturer..."
                  style={{ minHeight: 80 }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Submitting...</> : '🚀 Submit Project'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 12 }}>
            A confirmation email will be sent after submission.
          </p>
        </form>
      </div>
    </div>
  )
}
