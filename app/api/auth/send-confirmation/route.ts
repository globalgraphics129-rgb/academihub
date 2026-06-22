import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendStudentConfirmationCode } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { name, email, matric } = await req.json()

  if (!name || !email || !matric) {
    return NextResponse.json({ error: 'Name, email, and matric number are required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  if (!matric.trim()) {
    return NextResponse.json({ error: 'Matric number is required' }, { status: 400 })
  }

  const existing = await supabaseAdmin.from('users').select('id').eq('email', email).single()
  if (existing.data) {
    return NextResponse.json({ error: 'This email is already registered' }, { status: 409 })
  }

  await supabaseAdmin.from('student_verifications').delete().eq('email', email)

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  const { error } = await supabaseAdmin.from('student_verifications').insert({
    email,
    name,
    matric: matric.trim(),
    code,
    expires_at: expiresAt,
    verified: false,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to send confirmation code' }, { status: 500 })
  }

  try {
    await sendStudentConfirmationCode({ email, name, code })
  } catch {
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Confirmation code sent to your email' })
}
