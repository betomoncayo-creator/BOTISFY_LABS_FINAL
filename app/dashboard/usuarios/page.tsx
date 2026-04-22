'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  Search, Plus, X, UserPlus, Check, Copy, 
  Loader2, Shield, User, Trash2, Mail, Key
} from 'lucide-react'

export default function UsuariosPage() {
  const supabase = createClient()
  
  // ESTADOS DE LA TABLA
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // ESTADOS DEL MODAL DE INVITAR
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', role: 'estudiante' })
  const [isInviting, setIsInviting] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copied, setCopied] = useState(false)

  // ESTADOS DEL MODAL DE RESETEO DE CLAVE
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetData, setResetData] = useState({ full_name: '', email: '', password: '' })
  const [resettingId, setResettingId] = useState<string | null>(null)

  // 1. CARGAR TODOS LOS USUARIOS
  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setUsers(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [supabase])

  // 2. LÓGICA PARA INVITAR USUARIO Y GENERAR CONTRASEÑA
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    
    const newPass = "BTF-" + Math.random().toString(36).substring(2, 9).toUpperCase()

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email.toLowerCase().trim(),
          password: newPass,
          full_name: inviteForm.full_name,
          role: inviteForm.role
        })
      })
      
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Error al crear usuario')
      
      setGeneratedPassword(newPass)
      fetchUsers() 
      
    } catch (err: any) {
      alert("Error de Sistema: " + err.message)
    } finally {
      setIsInviting(false)
    }
  }

  // 3. LÓGICA PARA RESETEAR CONTRASEÑA (LLAVE)
  const handleResetPassword = async (user: any) => {
    if(!confirm(`¿Estás seguro de generar una nueva llave de acceso para ${user.full_name}? La clave anterior dejará de funcionar.`)) return;

    setResettingId(user.id)
    const newPass = "BTF-" + Math.random().toString(36).substring(2, 9).toUpperCase()

    try {
      const response = await fetch('/api/users/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, 
          newPassword: newPass
        })
      })
      
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Error al resetear contraseña')
      
      setResetData({ 
        full_name: user.full_name || 'Usuario', 
        email: user.email || '[Correo registrado]', 
        password: newPass 
      })
      setShowResetModal(true)
      
    } catch (err: any) {
      alert("Error de Sistema: " + err.message)
    } finally {
      setResettingId(null)
    }
  }

  // =========================================================
  // 4. ELIMINAR USUARIO (RESTAURADO A SU ORDEN ORIGINAL)
  // =========================================================
  const handleDeleteUser = async (id: string) => {
    if(confirm('¿Confirmar baja de sistema?')) {
      try {
        // Volvemos a tu lógica original que borraba directo en la tabla
        const { error } = await supabase.from('profiles').delete().eq('id', id)
        if (error) throw error
        
        fetchUsers() // Recarga la tabla al instante
      } catch (err: any) {
        alert("Error al eliminar: " + err.message)
      }
    }
  }

  // FILTRO DE BÚSQUEDA
  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* MODAL 1: NUEVO USUARIO */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#050505] border border-white/10 p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative text-center">
            
            <button onClick={() => { setShowInviteModal(false); setGeneratedPassword(''); setInviteForm({ full_name: '', email: '', role: 'estudiante' }); }} className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors">
              <X size={24} />
            </button>
            
            {!generatedPassword ? (
              <form onSubmit={handleInviteSubmit} className="space-y-6">
                <div className="bg-purple-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-purple-500/20 mb-6">
                  <UserPlus className="text-purple-500" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">
                    NUEVO <span className="text-purple-500">ACCESO</span>
                  </h3>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Workspace Botisfy Labs</p>
                </div>
                
                <div className="space-y-4 text-left">
                  <input required type="text" value={inviteForm.full_name} onChange={e => setInviteForm({...inviteForm, full_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors text-center font-bold tracking-wider" placeholder="Nombre Completo" />
                  <input required type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors text-center font-bold tracking-wider" placeholder="correo@empresa.com" />
                  <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors appearance-none text-center font-bold tracking-wider cursor-pointer">
                    <option value="estudiante">Nivel: Estudiante</option>
                    <option value="admin">Nivel: Administrador</option>
                  </select>
                </div>
                
                <button type="submit" disabled={isInviting} className="w-full mt-2 bg-white text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-[0.5em] hover:bg-purple-500 hover:text-white transition-all shadow-xl disabled:opacity-50 flex justify-center items-center gap-2">
                  {isInviting ? <Loader2 size={18} className="animate-spin" /> : 'GENERAR LLAVE'}
                </button>
              </form>
            ) : (
              <div className="space-y-8 animate-in zoom-in duration-500">
                <div className="bg-green-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-green-500/20">
                  <Check className="text-green-500" size={32} />
                </div>
                <div>
                  <h2 className="text-white font-black uppercase italic text-2xl tracking-tighter">Acceso Generado</h2>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-2">{inviteForm.full_name}</p>
                </div>
                
                <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-[2.5rem] text-[#00E5FF] font-mono text-3xl font-black italic tracking-[0.2em] shadow-inner">
                  {generatedPassword}
                </div>
                
                <button 
                  onClick={() => {
                    const textoCopiar = `¡Hola ${inviteForm.full_name}!\n\nTu acceso a Botisfy Labs ha sido creado de forma segura.\n\nUsuario: ${inviteForm.email}\nContraseña: ${generatedPassword}`;
                    navigator.clipboard.writeText(textoCopiar); 
                    setCopied(true); setTimeout(() => setCopied(false), 2000);
                  }} 
                  className={`w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${copied ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-[#00E5FF] text-black shadow-xl shadow-black/50 hover:bg-white'}`}
                >
                   {copied ? <Check size={18}/> : <Copy size={18}/>} 
                   {copied ? '¡CREDENCIAL COPIADA!' : 'COPIAR ACCESO'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: RESETEO DE CLAVE */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#050505] border border-white/10 p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative text-center">
            <button onClick={() => setShowResetModal(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <div className="space-y-8 animate-in zoom-in duration-500">
              <div className="bg-amber-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-amber-500/20">
                <Key className="text-amber-500" size={32} />
              </div>
              <div>
                <h2 className="text-white font-black uppercase italic text-2xl tracking-tighter">Nueva Llave Generada</h2>
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-2">{resetData.full_name}</p>
              </div>
              
              <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-[2.5rem] text-amber-500 font-mono text-3xl font-black italic tracking-[0.2em] shadow-inner">
                {resetData.password}
              </div>
              
              <button 
                onClick={() => {
                  const textoCopiar = `¡Hola ${resetData.full_name}!\n\nTu contraseña de Botisfy Labs ha sido restablecida de forma segura.\n\nUsuario: ${resetData.email}\nContraseña: ${resetData.password}`;
                  navigator.clipboard.writeText(textoCopiar); 
                  setCopied(true); setTimeout(() => setCopied(false), 2000);
                }} 
                className={`w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${copied ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-amber-500 text-black shadow-xl shadow-black/50 hover:bg-white'}`}
              >
                 {copied ? <Check size={18}/> : <Copy size={18}/>} 
                 {copied ? '¡LLAVE COPIADA!' : 'COPIAR NUEVA LLAVE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#050505] p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-purple-500/10 transition-colors" />
        
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
            DIRECTORIO DE <span className="text-purple-500">USUARIOS</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase">Gestión de accesos y credenciales</p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por correo o nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white text-[11px] font-bold tracking-widest uppercase focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <button 
            onClick={() => { setShowInviteModal(true); setGeneratedPassword(''); }}
            className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-purple-500/20 whitespace-nowrap"
          >
            <Plus size={16} /> Agregar Registro
          </button>
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="bg-[#050505] border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="py-5 px-8 text-[10px] font-black text-zinc-500 tracking-[0.3em] uppercase">Colaborador</th>
                <th className="py-5 px-8 text-[10px] font-black text-zinc-500 tracking-[0.3em] uppercase">Nivel / Rol</th>
                <th className="py-5 px-8 text-[10px] font-black text-zinc-500 tracking-[0.3em] uppercase">Fecha Ingreso</th>
                <th className="py-5 px-8 text-[10px] font-black text-zinc-500 tracking-[0.3em] uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cargando directorio...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="text-zinc-500" size={24} />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">No se encontraron resultados</span>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors last:border-0 group">
                    
                    {/* COLUMNA 1: AVATAR, NOMBRE Y CORREO */}
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-sm font-black text-purple-500 uppercase border border-purple-500/20 flex-shrink-0">
                          {user.full_name ? user.full_name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tighter mb-0.5">{user.full_name || 'Usuario Sin Nombre'}</p>
                          <p className="text-[10px] text-zinc-500 font-bold flex items-center gap-1.5">
                            <Mail size={10} /> {user.email || 'No registrado en tabla'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* COLUMNA 2: BADGE DE ROL */}
                    <td className="py-5 px-8">
                      {user.role === 'admin' ? (
                        <div className="inline-flex items-center gap-2 bg-[#00E5FF]/10 text-[#00E5FF] px-3 py-1.5 rounded-lg border border-[#00E5FF]/20">
                          <Shield size={12} strokeWidth={3} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Admin</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                          <User size={12} strokeWidth={3} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Estudiante</span>
                        </div>
                      )}
                    </td>

                    {/* COLUMNA 3: FECHA */}
                    <td className="py-5 px-8">
                      <span className="text-[10px] font-bold text-zinc-500 italic tracking-wider">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No disponible'}
                      </span>
                    </td>

                    {/* COLUMNA 4: ACCIONES */}
                    <td className="py-5 px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleResetPassword(user)}
                          disabled={resettingId === user.id}
                          className="p-2 text-zinc-600 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all inline-flex opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Generar nueva llave"
                        >
                          {resettingId === user.id ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                        </button>

                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all inline-flex opacity-0 group-hover:opacity-100"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}