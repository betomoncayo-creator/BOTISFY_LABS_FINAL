'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  Search, Plus, X, UserPlus, Check, Copy, 
  Loader2, Shield, User, Trash2, Mail, Key, Users
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
  const [resettingId, setResettingId] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) setUsers(data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

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
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      
      setGeneratedPassword(newPass)
      fetchUsers() 
    } catch (err: any) { alert("Error: " + err.message) }
    finally { setIsInviting(false) }
  }

  const handleResetPassword = async (user: any) => {
    if(!confirm(`¿Resetear llave para ${user.full_name}?`)) return
    setResettingId(user.id)
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
    finally { setResettingId(null) }
  }

  // =========================================================
  // ELIMINAR USUARIO: ENVIANDO EL ID POR LA URL
  // =========================================================
  const handleDeleteUser = async (id: string) => {
    if(!confirm('¿Eliminar este registro de forma permanente?')) return
    
    try {
      // 🔥 Mandamos el ID por la URL para que Next.js no borre el cuerpo de la petición
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      })
      
      const rawText = await response.text()
      
      if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}.`
        if (rawText) {
          try {
            const parsed = JSON.parse(rawText)
            errorMessage = parsed.error || errorMessage
          } catch(e) {
            errorMessage = `El servidor devolvió un error: ${rawText}`
          }
        }
        throw new Error(errorMessage)
      }
      
      fetchUsers()
    } catch (err: any) { 
      alert("Error al eliminar: " + err.message) 
    }
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
          <div className="bg-[#050505] border border-white/10 p-10 rounded-[3rem] w-full max-w-md text-center relative">
            <button onClick={() => { setShowInviteModal(false); setGeneratedPassword('') }} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X size={24} /></button>
            {!generatedPassword ? (
              <form onSubmit={handleInviteSubmit} className="space-y-6">
                <div className="bg-purple-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><UserPlus className="text-purple-500" size={32} /></div>
                <h3 className="text-2xl font-black text-white italic uppercase mb-2">NUEVO <span className="text-purple-500">ACCESO</span></h3>
                <div className="space-y-4">
                  <input required type="text" value={inviteForm.full_name} onChange={e => setInviteForm({...inviteForm, full_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-center font-bold" placeholder="Nombre Completo" />
                  <input required type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-center font-bold" placeholder="correo@empresa.com" />
                  <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-2xl px-5 py-4 text-white text-center font-bold appearance-none cursor-pointer">
                    <option value="estudiante">Estudiante</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <button type="submit" disabled={isInviting} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-[0.5em] hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50">
                  {isInviting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'GENERAR LLAVE'}
                </button>
              </form>
            ) : (
              <div className="space-y-8 animate-in zoom-in">
                <div className="bg-green-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto"><Check className="text-green-500" size={32} /></div>
                <h2 className="text-white font-black uppercase italic text-2xl">Acceso Listo</h2>
                <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-[2.5rem] text-[#00E5FF] font-mono text-3xl font-black italic tracking-[0.2em]">{generatedPassword}</div>
                <button onClick={() => { navigator.clipboard.writeText(`Usuario: ${inviteForm.email}\nContraseña: ${generatedPassword}`); setCopied(true); setTimeout(()=>setCopied(false), 2000) }} className={`w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${copied ? 'bg-green-600 text-white' : 'bg-[#00E5FF] text-black'}`}>
                  {copied ? <Check size={18}/> : <Copy size={18}/>} {copied ? 'COPIADO' : 'COPIAR ACCESO'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL RESETEO DE CLAVE */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#050505] border border-white/10 p-10 rounded-[3rem] w-full max-w-md text-center relative">
            <button onClick={() => setShowResetModal(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X size={24} /></button>
            <div className="space-y-8 animate-in zoom-in">
              <div className="bg-amber-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto"><Key className="text-amber-500" size={32} /></div>
              <h2 className="text-white font-black uppercase italic text-2xl">Nueva Llave</h2>
              <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-[2.5rem] text-amber-500 font-mono text-3xl font-black italic tracking-[0.2em]">{resetData.password}</div>
              <button onClick={() => { navigator.clipboard.writeText(`Usuario: ${resetData.email}\nContraseña: ${resetData.password}`); setCopied(true); setTimeout(()=>setCopied(false), 2000) }} className={`w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${copied ? 'bg-green-600 text-white' : 'bg-amber-500 text-black'}`}>
                {copied ? <Check size={18}/> : <Copy size={18}/>} {copied ? 'COPIADA' : 'COPIAR LLAVE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-[#050505] p-8 rounded-[2rem] border border-white/5">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">DIRECTORIO DE <span className="text-purple-500">USUARIOS</span></h1>
          <p className="text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase">Control Maestro de Accesos</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input type="text" placeholder="BUSCAR POR NOMBRE O CORREO..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white text-[11px] font-bold uppercase tracking-widest focus:border-purple-500 outline-none transition-colors" />
          </div>
          <button onClick={()=>setShowInviteModal(true)} className="bg-purple-500 hover:bg-purple-400 text-white px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"><Plus size={16}/> AGREGAR USUARIO</button>
        </div>
      </div>

      {/* TABLA DE COLABORADORES */}
      <div className="bg-[#050505] border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
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
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" /><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sincronizando base de datos...</span></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center"><Users className="text-zinc-500 mx-auto mb-4" size={24} /><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">No se encontraron registros</span></td></tr>
              ) : (
                filteredUsers.map((user, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors last:border-0 group">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-sm font-black text-purple-500 uppercase border border-purple-500/20">{user.full_name?.charAt(0) || 'U'}</div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tighter">{user.full_name || 'Sin Nombre'}</p>
                          <p className="text-[10px] text-zinc-500 font-bold flex items-center gap-1.5"><Mail size={10} /> {user.email || 'Email no disponible'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                        {user.role === 'admin' ? <Shield size={12}/> : <User size={12}/>} {user.role || 'estudiante'}
                      </div>
                    </td>
                    <td className="py-5 px-8"><span className="text-[10px] font-bold text-zinc-500 italic uppercase">{user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '---'}</span></td>
                    <td className="py-5 px-8 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>handleResetPassword(user)} className="p-2 text-zinc-600 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all" title="Resetear Llave"><Key size={16}/></button>
                        <button onClick={()=>handleDeleteUser(user.id)} className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all" title="Eliminar Colaborador"><Trash2 size={16}/></button>
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