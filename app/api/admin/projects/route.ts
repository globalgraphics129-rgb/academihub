import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projects: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description } = body
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ name: name.trim(), description: description?.trim() || null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data })
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await req.json()

  if (body.active === true) {
    await supabaseAdmin.from('projects').update({ active: false }).neq('active', null)
  }

  const updates: Record<string, unknown> = {}
  if (body.active !== undefined) updates.active = body.active
  if (body.name !== undefined) updates.name = body.name

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
