import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendProjectSubmissionEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { groupId, members, githubLink, notes } = body

  const membersJson = (members || []).map((m: any) => {
    if (typeof m === 'string') return { name: m, matric: '' }
    return { name: m.name || '', matric: m.matric || '' }
  })

  if (!groupId || !membersJson.length || !githubLink) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: group, error: gErr } = await supabaseAdmin
    .from('groups')
    .select('*, departments(department, rep_name, rep_email)')
    .eq('id', groupId)
    .single()

  if (gErr || !group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  if (group.submitted) return NextResponse.json({ error: 'This group has already submitted.' }, { status: 400 })

  const department = (group.departments as any)?.department || 'Unknown'

  const { data: submission, error: sErr } = await supabaseAdmin
    .from('submissions')
    .insert({
      project_id: group.project_id,
      group_id: groupId,
      department,
      group_number: group.group_number,
      project_name: group.project_name,
      leader_name: group.leader_name,
      leader_email: group.leader_email,
      leader_phone: group.leader_phone,
      members: membersJson,
      github_link: githubLink,
      notes: notes || null,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })

  await supabaseAdmin
    .from('groups')
    .update({ submitted: true })
    .eq('id', groupId)

  try {
    await sendProjectSubmissionEmail({
      leaderEmail: group.leader_email,
      leaderName: group.leader_name,
      department,
      groupNumber: group.group_number,
      projectName: group.project_name,
      githubLink,
      members: membersJson,
    })
  } catch (emailErr) {
    console.error('Email failed:', emailErr)
  }

  return NextResponse.json({ submission })
}
