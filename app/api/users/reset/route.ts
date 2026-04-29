import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json()

    // 1. Verificación de parámetros
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "Faltan parámetros de identidad (userId/password)." },
        { status: 400 }
      )
    }

    // 2. Inicialización del Cliente Admin (Privilegios elevados)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Llave maestra del servidor
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 3. Ejecución del "God Mode": Actualización forzosa de credenciales
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { 
        password: newPassword,
        email_confirm: true // Confirmamos el email automáticamente para evitar bloqueos
      }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Nodo de seguridad actualizado. Acceso concedido." 
    })

  } catch (err) {
    return NextResponse.json(
      { error: "Fallo crítico en el protocolo de reseteo." },
      { status: 500 }
    )
  }
}