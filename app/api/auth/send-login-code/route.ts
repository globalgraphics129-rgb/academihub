import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendStudentLoginCode } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, name')
    .eq('email', email)
    .eq('role', 'student')
    .single()

  if (!user) {
    return NextResponse.json({ error: 'No student found with this email' }, { status: 404 })
  }

  await supabaseAdmin.from('student_verifications').delete().eq('email', email)

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  const { error } = await supabaseAdmin.from('student_verifications').insert({
    email,
    name: user.name,
    matric: '',
    code,
    expires_at: expiresAt,
    verified: false,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to send login code' }, { status: 500 })
  }

  try {
    await sendStudentLoginCode({ email, name: user.name, code })
  } catch {
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Login code sent to your email' })
}
