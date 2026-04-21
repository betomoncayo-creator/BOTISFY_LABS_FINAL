import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json()

    // Iniciamos Supabase con la Llave Maestra
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Forzamos el cambio de contraseña en la Bóveda Segura
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Contraseña reseteada.' })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}