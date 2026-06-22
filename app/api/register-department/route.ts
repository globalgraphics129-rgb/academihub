import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendDepartmentRegistrationEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  let query = supabaseAdmin
    .from('departments')
    .select('*')
    .eq('active', true)

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query.order('department', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ departments: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { department, repName, repEmail, repPhone, numberOfGroups, projectId } = body

  if (!department || !repName || !repEmail || !numberOfGroups) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // If no projectId given, use the active project
  let targetProjectId = projectId
  if (!targetProjectId) {
    const { data: defaultProj } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('active', true)
      .limit(1)
      .single()
    if (defaultProj) targetProjectId = defaultProj.id
  }

  // Check if department already exists for this project
  let query = supabaseAdmin
    .from('departments')
    .select('id')

  if (targetProjectId) {
    query = query.eq('project_id', targetProjectId)
  }

  const { data: existing } = await query
    .eq('department', department)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'This department is already registered. Contact the admin if you need to update it.' }, { status: 400 })
  }

  const insertData: any = {
    department,
    rep_name: repName,
    rep_email: repEmail,
    rep_phone: repPhone || null,
    number_of_groups: parseInt(numberOfGroups),
  }
  if (targetProjectId) insertData.project_id = targetProjectId

  const { data, error } = await supabaseAdmin
    .from('departments')
    .insert(insertData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get project name for email
  let projectName: string | undefined
  if (targetProjectId) {
    const { data: proj } = await supabaseAdmin
      .from('projects')
      .select('name')
      .eq('id', targetProjectId)
      .single()
    if (proj) projectName = proj.name
  }

  // Send confirmation email
  try {
    await sendDepartmentRegistrationEmail({
      repEmail,
      repName,
      department,
      numberOfGroups: parseInt(numberOfGroups),
      projectName,
    })
  } catch (emailErr) {
    console.error('Email failed:', emailErr)
  }

  return NextResponse.json({ department: data })
}
