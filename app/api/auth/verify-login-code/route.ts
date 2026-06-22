import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, code } = await req.json()

  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
  }

  const { data: verification, error: fetchError } = await supabaseAdmin
    .from('student_verifications')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .eq('verified', false)
    .single()

  if (fetchError || !verification) {
    return NextResponse.json({ error: 'Invalid or expired login code' }, { status: 400 })
  }

  if (new Date(verification.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Login code has expired. Request a new one.' }, { status: 400 })
  }

  await supabaseAdmin.from('student_verifications').update({ verified: true }).eq('id', verification.id)

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('role', 'student')
    .single()

  if (!user) {
    return NextResponse.json({ error: 'Student account not found' }, { status: 404 })
  }

  const token = await createSession(user.id)

  return NextResponse.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  })
}
