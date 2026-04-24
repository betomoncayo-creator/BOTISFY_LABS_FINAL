// ============================================================================
// DELETE: ELIMINACIÓN DE USUARIO (Dejando que actúe la Cascada SQL)
// ============================================================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado en la URL' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // 🔥 ELIMINACIÓN MAESTRA:
    // Ya NO intentamos borrar en 'profiles'. 
    // Atacamos directo a la bóveda. Las llaves foráneas (Triggers RI) 
    // se encargarán de destruir el perfil en cascada automáticamente.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    
    if (authError && authError.status !== 404) {
      throw new Error(authError.message)
    }

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error("Error en DELETE:", error.message)
    return NextResponse.json({ error: error.message || 'Fallo interno en el servidor' }, { status: 500 })
  }
}