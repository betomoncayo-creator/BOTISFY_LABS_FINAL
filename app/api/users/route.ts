// app/api/users/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse, NextRequest } from 'next/server'
import { editarUsuarioSchema, validarUsuario } from '../../../lib/usuario-schemas'

export const dynamic = 'force-dynamic'

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

type AdminResult = { ok: true; userId: string } | { ok: false; response: NextResponse }

async function requireAdmin(request: NextRequest): Promise<AdminResult> {
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
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// ─── POST /api/users — inviteUserByEmail (sin contraseña) ────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { full_name, email, role } = body

    if (!full_name?.trim() || !email?.trim() || !role?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nombre, email y rol son requeridos' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getAdminClient()

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.trim().toLowerCase(),
      {
        data: { full_name: full_name.trim(), role },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=invite`,
      }
    )

    if (inviteError) {
      return NextResponse.json(
        { success: false, error: inviteError.message || 'Error al invitar usuario' },
        { status: 400 }
      )
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', inviteData.user.id)

    if (profileError) throw profileError

    return NextResponse.json({
      success: true,
      message: 'Invitación enviada exitosamente',
      data: { id: inviteData.user.id, full_name, email, role }
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al invitar usuario' },
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
        updated_at: new Date().toISOString()
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
    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}