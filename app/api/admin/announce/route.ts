import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendAnnouncementEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { subject, message } = await req.json()

  if (!subject || !message) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
  }

  try {
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

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
    }

    await sendAnnouncementEmail({ recipients, subject, message })

    return NextResponse.json({ success: true, recipientsCount: recipients.length })
  } catch (e) {
    console.error('Announcement failed:', e)
    return NextResponse.json({ error: 'Failed to send announcement' }, { status: 500 })
  }
}
