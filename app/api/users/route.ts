import { createClient } from '@supabase/supabase-js'
import { NextResponse, NextRequest } from 'next/server'
import { crearUsuarioSchema, editarUsuarioSchema, validarUsuario } from '../../../lib/usuario-schemas'

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

// GET /api/users - Listar todos los usuarios
export async function GET(request: NextRequest) {
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

// POST /api/users - Crear nuevo usuario
export async function POST(request: NextRequest) {
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

// PUT /api/users - Editar usuario
export async function PUT(request: NextRequest) {
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

// DELETE /api/users - Eliminar usuario
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario requerido' },
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