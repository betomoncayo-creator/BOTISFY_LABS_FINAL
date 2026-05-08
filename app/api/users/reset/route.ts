// app/api/users/reset/route.ts
// Fuerza reset de contraseña — solo admins autenticados pueden llamar esto.

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

async function requireAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!token) return { ok: false as const, status: 401, error: 'Token requerido' }

  const { data: { user }, error } = await getSessionClient(token).auth.getUser()
  if (error || !user) return { ok: false as const, status: 401, error: 'Token inválido' }

  const { data: profile } = await getAdminClient()
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role?.toLowerCase() !== 'admin') {
    return { ok: false as const, status: 403, error: 'Se requiere rol admin' }
  }

  return { ok: true as const, userId: user.id }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'Faltan parámetros: userId y newPassword son requeridos' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Prevenir que un admin se resetee a sí mismo por esta ruta
    if (userId === auth.userId) {
      return NextResponse.json(
        { error: 'Usa la sección de configuración para cambiar tu propia contraseña' },
        { status: 400 }
      )
    }

    const { error } = await getAdminClient().auth.admin.updateUserById(userId, {
      password: newPassword,
      email_confirm: true
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno al procesar el reset' },
      { status: 500 }
    )
  }
}