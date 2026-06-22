import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendBulkNotification, sendPortalClosedReportToAdmin } from '@/lib/email'

export async function POST() {
  // Check if already notified
  const { data: settings } = await supabaseAdmin
    .from('portal_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (!settings) return NextResponse.json({ error: 'No settings' }, { status: 400 })
  if (settings.closed_notified) return NextResponse.json({ already_notified: true })

  try {
    // Collect all unique users
    const { data: depts } = await supabaseAdmin.from('departments').select('rep_email, rep_name')
    const { data: groups } = await supabaseAdmin.from('groups').select('leader_email, leader_name')

    const recipients: { email: string; name: string }[] = []
    const seen = new Set<string>()

    if (depts) {
      for (const d of depts) {
        if (!seen.has(d.rep_email)) {
          seen.add(d.rep_email)
          recipients.push({ email: d.rep_email, name: d.rep_name })
        }
      }
    }
    if (groups) {
      for (const g of groups) {
        if (!seen.has(g.leader_email)) {
          seen.add(g.leader_email)
          recipients.push({ email: g.leader_email, name: g.leader_name })
        }
      }
    }

    // Email all users
    await sendBulkNotification({
      recipients,
      subject: `🔒 Portal Closed — AcademiHub`,
      message: `The project submission portal is now closed.\n\nAll submissions have been finalized. Thank you to everyone who participated.\n\nIf you have any questions, please contact the admin.`,
      emoji: '🔒',
    })

    // Build summary for admin
    const { data: submissions } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .order('department', { ascending: true })

    const { data: allDepts } = await supabaseAdmin
      .from('departments')
      .select('*')
      .order('department', { ascending: true })

    const totalStudents = submissions?.reduce((a, s) => a + (s.members?.length || 0), 0) || 0
    const deptBreakdown = allDepts?.map(d => {
      const deptSubs = submissions?.filter(s => s.department === d.department) || []
      const students = deptSubs.reduce((a, s) => a + (s.members?.length || 0), 0)
      return `  • ${d.department}: ${deptSubs.length} submissions, ${students} students`
    }).join('\n') || ''

    const summary = [
      `Total Departments: ${allDepts?.length || 0}`,
      `Total Submissions: ${submissions?.length || 0}`,
      `Total Students: ${totalStudents}`,
      `Unique Projects: ${new Set(submissions?.map(s => s.project_name)).size || 0}`,
      '',
      'Breakdown by Department:',
      deptBreakdown,
    ].join('\n')

    // Email admin with report
    await sendPortalClosedReportToAdmin({ summary })

    // Mark as notified
    await supabaseAdmin.from('portal_settings').update({ closed_notified: true }).eq('id', 1)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Portal close notification failed:', e)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}
