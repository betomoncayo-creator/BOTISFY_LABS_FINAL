import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Forzamos a Next.js a no cachear esta API
export const dynamic = 'force-dynamic'

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

export async function POST(request: Request) {
  try {
    const { full_name, email, role, password } = await request.json()
    const supabaseAdmin = getAdminClient()

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    })

    if (authError) throw authError

    // Sincronización manual del perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, role })
      .eq('id', authData.user.id)

    if (profileError) throw profileError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const supabaseAdmin = getAdminClient()

    // 1. Borrado físico en la tabla pública
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)
    
    if (profileError) throw profileError

    // 2. Borrado en la cuenta de autenticación
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    
    if (authError && authError.status !== 404) throw authError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}