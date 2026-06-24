import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const departmentId = searchParams.get('departmentId')

  if (!departmentId) return NextResponse.json({ error: 'departmentId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('groups')
    .select('id, group_number, leader_name, project_name, submitted')
    .eq('department_id', departmentId)
    .order('group_number', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ groups: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { departmentId, groupNumber, leaderName, leaderEmail, leaderPhone, projectName } = body

  if (!departmentId || !groupNumber || !leaderName || !leaderEmail || !projectName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check if group already registered
  const { data: existing } = await supabaseAdmin
    .from('groups')
    .select('id')
    .eq('department_id', departmentId)
    .eq('group_number', parseInt(groupNumber))
    .single()

  if (existing) {
    return NextResponse.json({ error: `Group ${groupNumber} is already registered in this department.` }, { status: 400 })
  }

  // Get department to retrieve its project_id
  const { data: dept, error: deptErr } = await supabaseAdmin
    .from('departments')
    .select('project_id')
    .eq('id', departmentId)
    .single()

  if (deptErr || !dept) {
    return NextResponse.json({ error: 'Department not found' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .from('groups')
    .insert({
      project_id: dept.project_id,
      department_id: departmentId,
      group_number: parseInt(groupNumber),
      leader_name: leaderName,
      leader_email: leaderEmail,
      leader_phone: leaderPhone || null,
      project_name: projectName,
      submitted: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ group: data })
}
