import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendDepartmentRegistrationEmail } from '@/lib/email'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('departments')
    .select('*')
    .eq('active', true)
    .order('department', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ departments: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { department, repName, repEmail, repPhone, numberOfGroups } = body

  if (!department || !repName || !repEmail || !numberOfGroups) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check if department already exists
  const { data: existing } = await supabaseAdmin
    .from('departments')
    .select('id')
    .eq('department', department)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'This department is already registered. Contact the admin if you need to update it.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('departments')
    .insert({
      department,
      rep_name: repName,
      rep_email: repEmail,
      rep_phone: repPhone || null,
      number_of_groups: parseInt(numberOfGroups),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send confirmation email
  try {
    await sendDepartmentRegistrationEmail({
      repEmail,
      repName,
      department,
      numberOfGroups: parseInt(numberOfGroups),
    })
  } catch (emailErr) {
    console.error('Email failed:', emailErr)
    // Don't fail the request if email fails
  }

  return NextResponse.json({ department: data })
}
