// app/api/users/route.ts
// CAPA 1 DE SEGURIDAD: Todas las operaciones verifican sesión válida + rol admin
// antes de ejecutar cualquier acción.

import { createClient } from '@supabase/supabase-js'
import { NextResponse, NextRequest } from 'next/server'
import { crearUsuarioSchema, editarUsuarioSchema, validarUsuario } from '../../../lib/usuario-schemas'

export const dynamic = 'force-dynamic'

// Cliente admin con SERVICE_ROLE_KEY — bypasa RLS intencionalmente para operaciones admin
const getAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Cliente de sesión con ANON_KEY — respeta RLS, usado para verificar identidad del llamante
const getSessionClient = (accessToken: string) => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  }
)

// ─── HELPER: Verifica que el request viene de un admin autenticado ─────────────
async function requireAdmin(request: NextRequest): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  // 1. Extraer Bearer token del header Authorization
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '').trim()

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'No autorizado — token requerido' },
        { status: 401 }
      )
    }
  }

  // 2. Verificar que el token es válido con Supabase
  const sessionClient = getSessionClient(token)
  const { data: { user }, error } = await sessionClient.auth.getUser()

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }
  }

  // 3. Verificar que el usuario tiene rol admin en profiles
  const adminClient = getAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role?.toLowerCase() !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Acceso denegado — se requiere rol admin' },
        { status: 403 }
      )
    }
  }

  return { ok: true, userId: user.id }
}

// ─── GET /api/users ───────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const supabaseAdmin = getAdminClient()
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, avatar_url, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error: any) {
    console.error('Error en GET /api/users:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// ─── POST /api/users ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const validation = validarUsuario(crearUsuarioSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    const { full_name, email, password, role, avatar_url } = validation.data!
    const supabaseAdmin = getAdminClient()

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message || 'Error al crear usuario' },
        { status: 400 }
      )
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        email,
        role,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)

    if (profileError) throw profileError

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: { id: authData.user.id, full_name, email, role }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error en POST /api/users:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear usuario' },
      { status: 500 }
    )
  }
}

// ─── PUT /api/users ───────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validation = validarUsuario(editarUsuarioSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    const { full_name, email, role, avatar_url } = validation.data!
    const supabaseAdmin = getAdminClient()

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        email,
        role,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(
      { success: true, message: 'Usuario actualizado exitosamente', data },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error en PUT /api/users:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// ─── DELETE /api/users ────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    // Prevenir auto-eliminación
    if (id === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getAdminClient()

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileError) throw profileError

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (authError && authError.status !== 404) throw authError

    return NextResponse.json(
      { success: true, message: 'Usuario eliminado exitosamente' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error en DELETE /api/users:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}