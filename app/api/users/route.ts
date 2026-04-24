import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ============================================================================
// FUNCIÓN MAESTRA: Crea un cliente que NO busca sesiones
// ============================================================================
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// ============================================================================
// POST: CREAR / SINCRONIZAR USUARIO
// ============================================================================
export async function POST(request: Request) {
  try {
    const { email, password, full_name, role } = await request.json()
    const supabaseAdmin = getAdminClient()

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) throw new Error(authError.message)

    if (authData?.user) {
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        full_name: full_name,
        role: role,
        email: email
      })

      if (profileError) throw new Error(profileError.message)
    }

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// ============================================================================
// DELETE: ELIMINACIÓN DE USUARIOS (ID por URL)
// ============================================================================
export async function DELETE(request: Request) {
  try {
    // 🔥 Extraemos el ID directamente desde la URL (ej: /api/users?id=123)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado en la URL' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // 1. Borramos el perfil público
    await supabaseAdmin.from('profiles').delete().eq('id', id)

    // 2. Borramos la cuenta de acceso de la bóveda
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    
    if (authError && authError.status !== 404) {
      throw new Error(authError.message)
    }

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Fallo interno en el servidor' }, { status: 500 })
  }
}