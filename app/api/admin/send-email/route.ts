import { NextRequest, NextResponse } from 'next/server'
import { sendCustomAdminEmail } from '@/lib/email'
import { verifyAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (!(await verifyAdmin(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { toEmail, toName, subject, message } = body

  if (!toEmail || !toName || !subject || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    await sendCustomAdminEmail({ toEmail, toName, subject, message })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send email failed:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
