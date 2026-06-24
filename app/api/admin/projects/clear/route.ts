import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/auth'

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (!(await verifyAdmin(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: groups } = await supabaseAdmin.from('groups').select('id').eq('project_id', id)
  if (groups?.length) {
    const groupIds = groups.map(g => g.id)
    await supabaseAdmin.from('submissions').delete().in('group_id', groupIds)
    await supabaseAdmin.from('groups').delete().eq('project_id', id)
  }
  await supabaseAdmin.from('departments').delete().eq('project_id', id)

  return NextResponse.json({ success: true })
}
