'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  Users, UserPlus, Trash2, Mail, Shield, 
  X, Check, Copy, Zap, Key, Loader2, Search 
} from 'lucide-react'

// Forzamos dinamismo en el cliente
export const dynamic = 'force-dynamic'

export default function UsuariosPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', role: 'estudiante' })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      // Forzamos a la base de datos a responder sin caché
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error) setUsers(data || [])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleDeleteUser = async (id: string) => {
    if(!confirm('¿Eliminar este acceso de forma permanente?')) return
    
    const backup = [...users]
    setUsers(prev => prev.filter(u => u.id !== id))

    try {
      const response = await fetch(`/api/users?id=${id}&t=${Date.now()}`, { 
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) throw new Error('Error en servidor')
      
      // Confirmamos que se borró refrescando silenciosamente
      fetchUsers()
      
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
      
      // Delay para que Supabase propague el cambio
      setTimeout(() => fetchUsers(), 1500)
    } catch (err: any) { 
      alert(err.message)
      setIsInviting(false)
    }
  }

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Renderizado (El mismo diseño Cyberpunk que ya tienes)
  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* ... Tu diseño de Header, Tabla y Modales aquí ... */}
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
            <input type="text" placeholder="BUSCAR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-white text-[10px] font-bold uppercase tracking-widest focus:border-[#00E5FF] outline-none transition-all placeholder:text-zinc-700" />
          </div>
          <button onClick={() => setShowInviteModal(true)} className="bg-white text-black hover:bg-[#00E5FF] px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3">
             <UserPlus size={18} /> AGREGAR
          </button>
        </div>
      </div>

      <div className="bg-[#050505] border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="py-8 px-10 text-[9px] font-black text-zinc-600 tracking-[0.4em] uppercase italic">COLABORADOR</th>
              <th className="py-8 px-10 text-[9px] font-black text-zinc-600 tracking-[0.4em] uppercase italic text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && users.length === 0 ? (
              <tr><td colSpan={2} className="py-20 text-center animate-pulse text-zinc-700 uppercase font-black text-[10px]">Cargando...</td></tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.id} className="group hover:bg-white/[0.01]">
                <td className="py-8 px-10">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-lg font-black text-white italic">{user.full_name?.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-black text-white uppercase italic tracking-tighter group-hover:text-[#00E5FF] transition-colors">{user.full_name}</p>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase italic">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-8 px-10 text-right">
                  <button onClick={() => handleDeleteUser(user.id)} className="p-4 text-zinc-700 hover:text-red-500 transition-all">
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE INVITACIÓN (REPETIR TU DISEÑO ANTERIOR) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#050505] border border-white/10 p-12 rounded-[3.5rem] w-full max-w-md text-center relative overflow-hidden">
            <button onClick={() => { setShowInviteModal(false); setGeneratedPassword('') }} className="absolute top-10 right-10 text-zinc-700 hover:text-white"><X size={24} /></button>
            {!generatedPassword ? (
              <form onSubmit={handleInviteSubmit} className="space-y-6 text-left">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8">INVITACIÓN</h3>
                <input required type="text" placeholder="NOMBRE" value={inviteForm.full_name} onChange={e => setInviteForm({...inviteForm, full_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold uppercase text-[11px]" />
                <input required type="email" placeholder="EMAIL" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold uppercase text-[11px]" />
                <button type="submit" className="w-full bg-[#00E5FF] text-black font-black py-6 rounded-2xl uppercase text-[11px] tracking-[0.4em]">
                  {isInviting ? <Loader2 className="animate-spin mx-auto" /> : 'GENERAR ACCESO'}
                </button>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="bg-white/5 border border-dashed border-white/20 p-10 rounded-[3rem] text-[#00E5FF] font-black text-4xl italic tracking-[0.3em]">{generatedPassword}</div>
                <button onClick={() => { navigator.clipboard.writeText(`Email: ${inviteForm.email}\nPass: ${generatedPassword}`); alert("Copiado"); }} className="w-full py-6 rounded-2xl bg-white text-black font-black uppercase text-[11px]">COPIAR</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}