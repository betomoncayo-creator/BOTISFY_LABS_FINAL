'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  Users, UserPlus, Trash2, Mail, Shield, 
  X, Check, Copy, Zap, Key, Loader2, Search 
} from 'lucide-react'

export default function UsuariosPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', role: 'estudiante' })

  // 1. CARGA CON ELIMINACIÓN DE CACHÉ
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      // Usamos un parámetro aleatorio para forzar a Supabase a saltarse la caché
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', '00000000-0000-0000-0000-000000000000') 
        .order('created_at', { ascending: false })
      
      if (!error) setUsers(data || [])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // 2. ELIMINACIÓN CON DOBLE VALIDACIÓN
  const handleDeleteUser = async (id: string) => {
    if(!confirm('¿Eliminar este acceso de forma permanente?')) return
    
    // Borrado visual inmediato (Optimista)
    const backup = [...users]
    setUsers(prev => prev.filter(u => u.id !== id))

    try {
      // Enviamos un timestamp en la URL para evitar caché del navegador
      const response = await fetch(`/api/users?id=${id}&t=${Date.now()}`, { 
        method: 'DELETE' 
      })
      
      if (!response.ok) throw new Error('Error en servidor')
      
    } catch (err: any) { 
      setUsers(backup)
      alert("Error: " + err.message) 
    }
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    const tempPass = "BTF-" + Math.random().toString(36).substring(2, 9).toUpperCase()

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inviteForm, password: tempPass })
      })
      
      if (!response.ok) throw new Error('Fallo al crear')
      setGeneratedPassword(tempPass)
      setTimeout(() => fetchUsers(), 1000)
    } catch (err: any) { 
      alert(err.message)
      setIsInviting(false)
    }
  }

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* CABECERA ESTILIZADA */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-[#050505] p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E5FF]/5 blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={18} className="text-[#00E5FF] fill-current" />
            <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
              DIRECTORIO DE <span className="text-[#00E5FF]">USUARIOS</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.5em] uppercase ml-1">GESTIÓN DE SEGURIDAD BOTISFY</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto relative z-10">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text" 
              placeholder="BUSCAR..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-white text-[10px] font-bold uppercase tracking-widest focus:border-[#00E5FF] outline-none transition-all placeholder:text-zinc-700" 
            />
          </div>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="bg-white text-black hover:bg-[#00E5FF] px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3"
          >
             <UserPlus size={18} /> AGREGAR
          </button>
        </div>
      </div>

      {/* TABLA DE COLABORADORES */}
      <div className="bg-[#050505] border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="py-8 px-10 text-[9px] font-black text-zinc-600 tracking-[0.4em] uppercase italic">COLABORADOR</th>
                <th className="py-8 px-10 text-[9px] font-black text-zinc-600 tracking-[0.4em] uppercase italic">NIVEL</th>
                <th className="py-8 px-10 text-[9px] font-black text-zinc-600 tracking-[0.4em] uppercase italic text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && users.length === 0 ? (
                <tr><td colSpan={3} className="py-32 text-center text-zinc-700 font-black text-[10px] uppercase tracking-[0.8em] animate-pulse">Sincronizando...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={3} className="py-32 text-center text-zinc-800 font-black text-[10px] uppercase tracking-[0.4em]">Sin registros</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/[0.01] transition-all duration-300">
                    <td className="py-8 px-10">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-[1.2rem] bg-white/5 flex items-center justify-center text-lg font-black text-white border border-white/10 uppercase italic">
                          {user.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase italic tracking-tighter group-hover:text-[#00E5FF] transition-colors">{user.full_name}</p>
                          <p className="text-[10px] text-zinc-600 font-bold tracking-widest mt-1 uppercase italic">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-8 px-10">
                      <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] ${user.role === 'admin' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                        {user.role}
                      </div>
                    </td>
                    <td className="py-8 px-10 text-right">
                      <button onClick={() => handleDeleteUser(user.id)} className="p-4 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CYBERPUNK INVITACIÓN */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#050505] border border-white/10 p-12 rounded-[3.5rem] w-full max-w-md text-center relative overflow-hidden">
            <button onClick={() => { setShowInviteModal(false); setGeneratedPassword('') }} className="absolute top-10 right-10 text-zinc-700 hover:text-white transition-colors"><X size={24} /></button>
            
            {!generatedPassword ? (
              <form onSubmit={handleInviteSubmit} className="space-y-6 relative z-10 text-left">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                  <Zap size={20} className="text-[#00E5FF]" fill="currentColor" /> INVITACIÓN
                </h3>
                
                <div className="space-y-4">
                  <input required type="text" placeholder="NOMBRE COMPLETO" value={inviteForm.full_name} onChange={e => setInviteForm({...inviteForm, full_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:border-[#00E5FF] transition-all uppercase tracking-widest text-[11px]" />
                  <input required type="email" placeholder="EMAIL CORPORATIVO" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:border-[#00E5FF] transition-all uppercase tracking-widest text-[11px]" />
                  <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-2xl px-6 py-5 text-white font-black appearance-none cursor-pointer outline-none focus:border-[#00E5FF] transition-all uppercase tracking-widest text-[11px]">
                    <option value="estudiante">ESTUDIANTE</option>
                    <option value="admin">ADMINISTRADOR</option>
                  </select>
                </div>

                <button type="submit" disabled={isInviting} className="w-full bg-gradient-to-r from-[#00E5FF] to-cyan-500 text-black font-black py-6 rounded-2xl uppercase text-[11px] tracking-[0.4em] mt-8 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center">
                  {isInviting ? <Loader2 className="animate-spin" /> : 'GENERAR ACCESO'}
                </button>
              </form>
            ) : (
              <div className="space-y-10 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-[#00E5FF]/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-[#00E5FF]/20">
                   <Check className="text-[#00E5FF]" size={40} />
                </div>
                <div className="bg-white/5 border border-dashed border-white/20 p-10 rounded-[3rem] text-[#00E5FF] font-black text-4xl italic tracking-[0.3em]">
                   {generatedPassword}
                </div>
                <button 
                  onClick={() => { 
                    navigator.clipboard.writeText(`Email: ${inviteForm.email}\nPass: ${generatedPassword}`); 
                    alert("Copiado");
                  }} 
                  className="w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] bg-white text-black hover:bg-[#00E5FF] flex items-center justify-center gap-4"
                >
                  <Copy size={18}/> COPIAR CREDENCIALES
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}