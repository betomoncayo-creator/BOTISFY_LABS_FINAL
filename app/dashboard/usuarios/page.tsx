'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  Search, Plus, X, UserPlus, Check, Copy, 
  Loader2, Shield, User, Trash2, Mail, Key, Users, Zap
} from 'lucide-react'

export default function UsuariosPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', role: 'estudiante' })
  const [isInviting, setIsInviting] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const [showResetModal, setShowResetModal] = useState(false)
  const [resetData, setResetData] = useState({ full_name: '', email: '', password: '' })

  // 1. FUNCIÓN DE CARGA PURA
  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) setUsers(data)
    setLoading(false)
  }, [supabase])

  // 2. REGLA DE CONEXIÓN EN TIEMPO REAL (ELIMINA EL "EFECTO GRABADO")
  useEffect(() => {
    fetchUsers()

    // Creamos un canal de escucha para la tabla 'profiles'
    const channel = supabase
      .channel('realtime_profiles')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => {
          // En cuanto pase CUALQUIER cosa (Insert, Update, Delete), refrescamos la lista
          fetchUsers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchUsers])

  // 3. LÓGICA DE INVITACIÓN
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    const newPass = "BTF-" + Math.random().toString(36).substring(2, 9).toUpperCase()

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inviteForm, password: newPass })
      })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error)
      }
      setGeneratedPassword(newPass)
      // No llamamos a fetchUsers() aquí, el Realtime se encarga solo
    } catch (err: any) { alert("Error: " + err.message) }
    finally { setIsInviting(false) }
  }

  // 4. ELIMINACIÓN CON ACTUALIZACIÓN OPTIMISTA
  const handleDeleteUser = async (id: string) => {
    if(!confirm('¿Eliminar este registro de forma permanente?')) return
    
    // Eliminación visual inmediata (Optimistic Update)
    const backup = [...users]
    setUsers(prev => prev.filter(u => u.id !== id))

    try {
      const response = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Fallo en el servidor')
    } catch (err: any) { 
      setUsers(backup) // Si falla la API, devolvemos al usuario a la lista
      alert("Error al eliminar: " + err.message) 
    }
  }

  // Resto de la lógica (Reset, Filter, Render)...
  const handleResetPassword = async (user: any) => {
    if(!confirm(`¿Resetear llave para ${user.full_name}?`)) return
    const newPass = "BTF-" + Math.random().toString(36).substring(2, 9).toUpperCase()
    try {
      const response = await fetch('/api/users/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newPassword: newPass })
      })
      if (!response.ok) throw new Error('Error en reseteo')
      setResetData({ full_name: user.full_name, email: user.email, password: newPass })
      setShowResetModal(true)
    } catch (err: any) { alert(err.message) }
  }

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* MODAL NUEVO ACCESO */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#050505] border border-white/10 p-10 rounded-[3.5rem] w-full max-w-md text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] pointer-events-none" />
            <button onClick={() => { setShowInviteModal(false); setGeneratedPassword('') }} className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors"><X size={24} /></button>
            {!generatedPassword ? (
              <form onSubmit={handleInviteSubmit} className="space-y-6 relative z-10">
                <div className="bg-purple-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-purple-500/20"><UserPlus className="text-purple-500" size={32} /></div>
                <h3 className="text-2xl font-black text-white italic uppercase mb-2 tracking-tighter">NUEVO <span className="text-purple-500">ACCESO</span></h3>
                <div className="space-y-4">
                  <input required type="text" value={inviteForm.full_name} onChange={e => setInviteForm({...inviteForm, full_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-center font-bold outline-none focus:border-purple-500 transition-colors uppercase tracking-widest text-[10px]" placeholder="Nombre Completo" />
                  <input required type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-center font-bold outline-none focus:border-purple-500 transition-colors uppercase tracking-widest text-[10px]" placeholder="correo@empresa.com" />
                  <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-2xl px-5 py-4 text-white text-center font-bold appearance-none cursor-pointer outline-none focus:border-purple-500 transition-colors uppercase tracking-widest text-[10px]">
                    <option value="estudiante">Estudiante</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <button type="submit" disabled={isInviting} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-[0.5em] hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50">
                  {isInviting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'GENERAR LLAVE'}
                </button>
              </form>
            ) : (
              <div className="space-y-8 animate-in zoom-in relative z-10">
                <div className="bg-emerald-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-emerald-500/20"><Check className="text-emerald-500" size={32} /></div>
                <h2 className="text-white font-black uppercase italic text-2xl tracking-tighter">Acceso Listo</h2>
                <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-[2.5rem] text-[#00E5FF] font-mono text-3xl font-black italic tracking-[0.2em] shadow-[0_0_30px_rgba(0,229,255,0.1)]">{generatedPassword}</div>
                <button onClick={() => { navigator.clipboard.writeText(`Usuario: ${inviteForm.email}\nContraseña: ${generatedPassword}`); setCopied(true); setTimeout(()=>setCopied(false), 2000) }} className={`w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-[#00E5FF] text-black hover:scale-[1.02]'}`}>
                  {copied ? <Check size={18}/> : <Copy size={18}/>} {copied ? 'COPIADO' : 'COPIAR ACCESO'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL RESETEO (Igual de estilizado) */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#050505] border border-white/10 p-10 rounded-[3rem] w-full max-w-md text-center relative">
            <button onClick={() => setShowResetModal(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X size={24} /></button>
            <div className="space-y-8 animate-in zoom-in">
              <div className="bg-amber-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-amber-500/20"><Key className="text-amber-500" size={32} /></div>
              <h2 className="text-white font-black uppercase italic text-2xl tracking-tighter">Nueva Llave</h2>
              <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-[2.5rem] text-amber-500 font-mono text-3xl font-black italic tracking-[0.2em]">{resetData.password}</div>
              <button onClick={() => { navigator.clipboard.writeText(`Usuario: ${resetData.email}\nContraseña: ${resetData.password}`); setCopied(true); setTimeout(()=>setCopied(false), 2000) }} className={`w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-black hover:scale-[1.02]'}`}>
                {copied ? <Check size={18}/> : <Copy size={18}/>} {copied ? 'COPIADA' : 'COPIAR LLAVE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CABECERA (Con Zap Icon) */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-[#050505] p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 blur-[60px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-purple-500 fill-current" />
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">DIRECTORIO DE <span className="text-purple-500">USUARIOS</span></h1>
          </div>
          <p className="text-zinc-500 text-[10px] font-bold tracking-[0.4em] uppercase ml-1">Control Maestro de Accesos</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto relative z-10">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-purple-500 transition-colors" size={16} />
            <input type="text" placeholder="BUSCAR COLABORADOR..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white text-[10px] font-bold uppercase tracking-[0.2em] focus:border-purple-500 outline-none transition-all placeholder:text-zinc-700" />
          </div>
          <button onClick={()=>setShowInviteModal(true)} className="bg-white text-black hover:bg-purple-500 hover:text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-white/5">
             AGREGAR
          </button>
        </div>
      </div>

      {/* TABLA SINCRO EN TIEMPO REAL */}
      <div className="bg-[#050505] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="py-6 px-10 text-[9px] font-black text-zinc-600 tracking-[0.4em] uppercase italic">Colaborador</th>
                <th className="py-6 px-10 text-[9px] font-black text-zinc-600 tracking-[0.4em] uppercase italic">Nivel / Rol</th>
                <th className="py-6 px-10 text-[9px] font-black text-zinc-600 tracking-[0.4em] uppercase italic text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="py-24 text-center">
                  <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-6" />
                  <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.6em]">Sincronizando...</span>
                </td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="py-24 text-center">
                  <Users className="text-zinc-800 mx-auto mb-4" size={32} />
                  <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em]">Sin registros activos</span>
                </td></tr>
              ) : (
                filteredUsers.map((user, i) => (
                  <tr key={user.id || i} className="border-b border-white/5 hover:bg-white/[0.02] transition-all last:border-0 group">
                    <td className="py-6 px-10">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-sm font-black text-white border border-white/10 group-hover:border-purple-500/50 transition-all uppercase italic">
                          {user.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase italic tracking-tighter group-hover:text-purple-400 transition-colors">{user.full_name || 'Sin Nombre'}</p>
                          <p className="text-[9px] text-zinc-600 font-black tracking-widest flex items-center gap-2 mt-1 uppercase"><Mail size={10} className="text-zinc-800" /> {user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-10">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[8px] font-black uppercase tracking-[0.2em] ${user.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_20px_rgba(0,229,255,0.05)]' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                        {user.role === 'admin' ? <Shield size={10}/> : <User size={10}/>} {user.role || 'estudiante'}
                      </div>
                    </td>
                    <td className="py-6 px-10 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button onClick={()=>handleResetPassword(user)} className="p-3 text-zinc-600 hover:text-amber-500 hover:bg-amber-500/10 rounded-2xl transition-all" title="Resetear Llave"><Key size={18}/></button>
                        <button onClick={()=>handleDeleteUser(user.id)} className="p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all" title="Eliminar Colaborador"><Trash2 size={18}/></button>
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