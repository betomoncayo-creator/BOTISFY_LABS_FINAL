import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ============================================================================
// 1. CREAR USUARIO (AHORA SÍ GUARDANDO EL CORREO EN TU COLUMNA)
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

    // B. Registramos en tu tabla pública 'profiles' asegurando el campo email
    if (authData?.user) {
      const { error: profileError } = await supabaseAdmin.from('profiles').update({
        full_name: full_name,
        role: role,
        email: email // <- El puente que faltaba para tu columna
      }).eq('id', authData.user.id)

      if (profileError) {
        console.error("Error de Supabase al actualizar perfil:", profileError)
      }
    }

    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente.' })
    
  } catch (error: any) {
    // Extraemos el mensaje real o mandamos el objeto crudo para debug
    const errorMessage = error?.message || error?.error_description || JSON.stringify(error)
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}

// ============================================================================
// 2. ELIMINAR USUARIO (LIMPIEZA LETAL Y SEGURA)
// ============================================================================
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) throw new Error('El sistema no detectó el ID del usuario.')

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // A. Forzamos primero la eliminación en la tabla visible (profiles)
    // Esto evita bloqueos de Foreign Key
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', id)
    if (profileError) {
      console.error("Detalle del error en profiles:", profileError)
      throw new Error(`Fallo en profiles: ${profileError.message || profileError.code}`)
    }

    // B. Eliminamos el acceso maestro en auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    
    // Si da error 404 significa que ya no existía (quizás lo borraste a mano).
    // Lo ignoramos para no asustar al usuario y damos el borrado por bueno.
    if (authError && authError.status !== 404) {
      console.error("Detalle del error en auth.users:", authError)
      throw new Error(`Fallo en Auth: ${authError.message}`)
    }

    return NextResponse.json({ success: true, message: 'Registro purgado de la base de datos.' })
    
  } catch (error: any) {
    // Ahora si falla, la alerta de tu pantalla te dirá EXACTAMENTE por qué.
    const errorMessage = error?.message || JSON.stringify(error) || 'Fallo crítico no identificado.'
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}