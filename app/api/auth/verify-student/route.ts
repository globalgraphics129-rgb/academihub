import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, code } = await req.json()

  if (!email || !code) {
    return NextResponse.json({ error: 'Email and confirmation code are required' }, { status: 400 })
  }

  const { data: verification, error: fetchError } = await supabaseAdmin
    .from('student_verifications')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .eq('verified', false)
    .single()

  if (fetchError || !verification) {
    return NextResponse.json({ error: 'Invalid or expired confirmation code' }, { status: 400 })
  }

  if (new Date(verification.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Confirmation code has expired. Request a new one.' }, { status: 400 })
  }

  await supabaseAdmin.from('student_verifications').update({ verified: true }).eq('id', verification.id)

  const passwordHash = await hashPassword(crypto.randomUUID())

  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      email: verification.email,
      password_hash: passwordHash,
      name: verification.name,
      role: 'student',
    })
    .select()
    .single()

  if (userError) {
    return NextResponse.json({ error: 'Failed to create account', details: userError.message }, { status: 500 })
  }

  const token = await createSession(user.id)

  return NextResponse.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  })
}
