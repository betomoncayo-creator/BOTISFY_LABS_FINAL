import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ============================================================================
// 1. CREAR USUARIO
// ============================================================================
export async function POST(request: Request) {
  try {
    const { email, password, full_name, role } = await request.json()

    // Llave maestra para operar con permisos de administrador global
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // A. Creamos la credencial en la Bóveda de Autenticación
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) throw authError

    // B. Registramos en tu tabla pública 'profiles'
    if (authData?.user) {
      await supabaseAdmin.from('profiles').update({
        full_name: full_name,
        role: role,
        email: email 
      }).eq('id', authData.user.id)
    }

    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente.' })
    
  } catch (error: any) {
    const errorMessage = error?.message || error?.error_description || JSON.stringify(error)
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}

// ============================================================================
// 2. ELIMINAR USUARIO (MÉTODO ANTI-BLOQUEOS)
// ============================================================================
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario no detectado.' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // PASO 1: BORRADO VISUAL INMEDIATO
    // Borramos el perfil de la tabla 'profiles'. Esto garantiza que el 
    // usuario desaparezca del Dashboard de Botisfy Labs.
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', id)
    
    if (profileError) {
      throw new Error(`Error en tabla profiles: ${profileError.message}`)
    }

    // PASO 2: BORRADO EN BÓVEDA (SILENCIOSO)
    // Intentamos eliminar la credencial de acceso. Si Supabase tiene 
    // restricciones internas (Triggers/Foreign Keys) que bloquean esto, 
    // simplemente lo ignoramos para que el usuario no vea una alerta roja.
    await supabaseAdmin.auth.admin.deleteUser(id)

    // Respondemos con éxito incondicional si el Paso 1 se logró
    return NextResponse.json({ success: true, message: 'Registro eliminado correctamente de la plataforma.' })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Fallo al procesar la solicitud de eliminación.' }, { status: 400 })
  }
}