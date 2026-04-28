import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 1. EL MOTOR MAESTRO: Esta función crea el acceso con privilegios totales (Bypass RLS)
const getAdminClient = () => {
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
// POST: CREACIÓN DE USUARIO (AGREGAR)
// ============================================================================
export async function POST(request: Request) {
  try {
    const { full_name, email, role, password } = await request.json()
    const supabaseAdmin = getAdminClient()

    // A. Creamos el usuario en la bóveda de autenticación (auth.users)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    })

    if (authError) throw authError

    // B. Sincronizamos los datos extra en la tabla de perfiles (public.profiles)
    // Nota: El ID debe coincidir con el de la cuenta recién creada
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, role })
      .eq('id', authData.user.id)

    if (profileError) throw profileError

    return NextResponse.json({ success: true, user: authData.user })

  } catch (error: any) {
    console.error("Error en POST API:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ============================================================================
// DELETE: ELIMINACIÓN DE USUARIO
// ============================================================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado en la URL' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // Atacamos directo a la bóveda. Las llaves foráneas con CASCADE
    // se encargarán de borrar el perfil automáticamente.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    
    if (authError && authError.status !== 404) {
      throw new Error(authError.message)
    }

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error("Error en DELETE API:", error.message)
    return NextResponse.json({ error: error.message || 'Fallo interno en el servidor' }, { status: 500 })
  }
}