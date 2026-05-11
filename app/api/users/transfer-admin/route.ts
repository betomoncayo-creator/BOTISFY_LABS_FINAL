import { createClient } from '@supabase/supabase-js'
import { NextResponse, NextRequest } from 'next/server'

const getAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const getSessionClient = (accessToken: string) => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  }
)

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 401 })

  const { data: { user }, error: authError } = await getSessionClient(token).auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const admin = getAdminClient()

  const { data: currentProfile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()

  if (currentProfile?.role?.toLowerCase() !== 'admin') {
    return NextResponse.json({ error: 'Se requiere rol admin' }, { status: 403 })
  }

  try {
    const { newAdminId, currentAdminId } = await request.json()

    if (!newAdminId || !currentAdminId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    if (newAdminId === currentAdminId) {
      return NextResponse.json({ error: 'No puedes transferirte a ti mismo' }, { status: 400 })
    }

    // Promover nuevo admin
    const { error: e1 } = await admin
      .from('profiles').update({ role: 'admin' }).eq('id', newAdminId)
    if (e1) throw e1

    // Degradar admin actual a estudiante
    const { error: e2 } = await admin
      .from('profiles').update({ role: 'estudiante' }).eq('id', currentAdminId)
    if (e2) throw e2

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}