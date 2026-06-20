import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('portal_settings')
    .select('closes_at')
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ closes_at: null })
  return NextResponse.json({ closes_at: data.closes_at })
}
