import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ============================================================================
// 1. CREAR USUARIO (Y GUARDAR SU CORREO EN EL PERFIL)
// ============================================================================
export async function POST(request: Request) {
  try {
    const { email, password, full_name, role } = await request.json()

    // Llave maestra para saltar reglas de seguridad
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // A. Creamos el núcleo en la Bóveda de Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) throw authError

    // B. Guardamos el Perfil Público (¡AHORA INCLUYENDO EL CORREO!)
    if (authData?.user) {
      await supabaseAdmin.from('profiles').update({
        full_name: full_name,
        role: role,
        email: email // <- Aquí conectamos el correo a la tabla visible
      }).eq('id', authData.user.id)
    }

    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente.' })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear usuario' }, { status: 400 })
  }
}

// ============================================================================
// 2. ELIMINAR USUARIO (DOBLE BORRADO ANTI-ERRORES)
// ============================================================================
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) throw new Error('ID de usuario no proporcionado')

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // A. Borramos el perfil público primero (Evita el bloqueo de la base de datos)
    await supabaseAdmin.from('profiles').delete().eq('id', id)

    // B. Borramos el núcleo de la Bóveda de Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Usuario eliminado por completo.' })
    
  } catch (error: any) {
    // Si falla, enviamos el error limpio al frontend en lugar de un "null"
    return NextResponse.json({ error: error.message || 'Error desconocido del servidor' }, { status: 400 })
  }
}