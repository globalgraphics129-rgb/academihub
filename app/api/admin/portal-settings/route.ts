import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendBulkNotification } from '@/lib/email'
import { verifyAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (!(await verifyAdmin(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('portal_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (!(await verifyAdmin(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { closes_at, projectId } = body

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (closes_at === null) {
    updates.closes_at = null
    updates.closing_soon_notified = false
    updates.closed_notified = false
  } else if (closes_at) {
    updates.closes_at = closes_at
    updates.closing_soon_notified = false
    updates.closed_notified = false
  } else {
    return NextResponse.json({ error: 'closes_at is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('portal_settings')
    .update(updates)
    .eq('id', 1)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (closes_at && !body.skipNotify) {
    const closeDate = new Date(closes_at)
    const formattedDate = closeDate.toLocaleString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Africa/Lagos',
    })

    try {
      let deptQuery = supabaseAdmin.from('departments').select('rep_email, rep_name')
      let groupQuery = supabaseAdmin.from('groups').select('leader_email, leader_name')

      if (projectId) {
        deptQuery = deptQuery.eq('project_id', projectId)
        groupQuery = groupQuery.eq('project_id', projectId)
      }

      const { data: depts } = await deptQuery
      const { data: groups } = await groupQuery

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

      if (recipients.length > 0) {
        const projectSuffix = projectId ? ' for this project' : ''
        await sendBulkNotification({
          recipients,
          subject: `Portal Closes ${formattedDate} — AcademiHub`,
          message: `The project submission portal will close on ${formattedDate}.${projectSuffix}\n\nPlease ensure all your group's projects are submitted before this deadline. After the portal closes, no further submissions will be accepted.\n\nIf you have any issues, contact the admin.`,
        })
      }

      await supabaseAdmin.from('portal_settings').update({ closing_soon_notified: true }).eq('id', 1)
    } catch (e) {
      console.error('Failed to send notification emails:', e)
    }
  }

  return NextResponse.json(data)
}
