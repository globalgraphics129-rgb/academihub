import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (type === 'departments') {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ departments: data })
  }

  if (type === 'submissions') {
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ submissions: data })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (type === 'submission') {
    const body = await req.json()
    const updateData: Record<string, any> = {}
    if (body.members) updateData.members = body.members
    if (body.github_link) updateData.github_link = body.github_link
    if (body.notes !== undefined) updateData.notes = body.notes

    const { error } = await supabaseAdmin.from('submissions').update(updateData).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (type === 'department') {
    const body = await req.json()
    const { active } = body
    if (active === undefined) {
      return NextResponse.json({ error: 'active field required' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('departments')
      .update({ active })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ department: data })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (type === 'submission') {
    const { error } = await supabaseAdmin.from('submissions').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (type === 'group') {
    // Delete submission first, then the group
    await supabaseAdmin.from('submissions').delete().eq('group_id', id)
    const { error } = await supabaseAdmin.from('groups').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (type === 'department') {
    // Cascade: delete submissions and groups first
    const { data: groups } = await supabaseAdmin.from('groups').select('id').eq('department_id', id)
    if (groups?.length) {
      const groupIds = groups.map(g => g.id)
      await supabaseAdmin.from('submissions').delete().in('group_id', groupIds)
      await supabaseAdmin.from('groups').delete().eq('department_id', id)
    }
    const { error } = await supabaseAdmin.from('departments').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  if (type === 'group') {
    const body = await req.json()
    const { group_number, leader_name, leader_email, leader_phone, project_name } = body

    const updates: Record<string, unknown> = {}
    if (group_number !== undefined) updates.group_number = group_number
    if (leader_name !== undefined) updates.leader_name = leader_name
    if (leader_email !== undefined) updates.leader_email = leader_email
    if (leader_phone !== undefined) updates.leader_phone = leader_phone
    if (project_name !== undefined) updates.project_name = project_name

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ group: data })
  }

  if (type !== 'department') {
    return NextResponse.json({ error: 'type=department or type=group required' }, { status: 400 })
  }

  const body = await req.json()
  const { department, rep_name, rep_email, rep_phone, number_of_groups } = body

  const updates: Record<string, unknown> = {}
  if (department !== undefined) updates.department = department
  if (rep_name !== undefined) updates.rep_name = rep_name
  if (rep_email !== undefined) updates.rep_email = rep_email
  if (rep_phone !== undefined) updates.rep_phone = rep_phone
  if (number_of_groups !== undefined) updates.number_of_groups = number_of_groups

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ department: data })
}
