'use client'
import { useState, useEffect, useContext } from 'react'
import { UserContext } from '@/lib/context'
import { createClient } from '@/lib/supabase'
import { 
  Users, UserPlus, Search, MoreVertical, Key, Shield, 
  Mail, RefreshCw, Copy, Check, ShieldCheck, X, Activity 
} from 'lucide-react'

// --- COMPONENTE: MODAL DE PROTOCOLO DE ACCESO (ADMIN ONLY) ---
const ProtocoloAccesoModal = ({ selectedUser, onClose }) => {
  if (!selectedUser) return null; 

  const [token, setToken] = useState(`BTF-${Math.random().toString(36).substring(2, 10).toUpperCase()}-2026`)
  const [loading, setLoading] = useState(false)
  const [synced, setSynced] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSyncDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, newPassword: token }),
      })
      if (response.ok) setSynced(true)
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const copyFullAccess = () => {
    navigator.clipboard.writeText(`USUARIO: ${selectedUser?.email}\nCLAVE: ${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-[#050505] border border-[#00E5FF]/20 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl relative animate-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20} /></button>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#00E5FF]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#00E5FF]/20">
            <ShieldCheck size={32} className="text-[#00E5FF]" />
          </div>
          <h2 className="text-white text-2xl font-black italic tracking-tighter uppercase mb-1">Protocolo de Acceso</h2>
          <p className="text-zinc-500 text-[9px] font-bold uppercase mb-8">Usuario: {selectedUser?.full_name}</p>
          <div className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl mb-8">
            <div className="flex items-center justify-between">
              <p className="text-[#00E5FF] font-mono text-lg font-bold">{token}</p>
              <button onClick={copyFullAccess} className="p-2 text-zinc-500">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
            </div>
          </div>
          <button onClick={handleSyncDatabase} disabled={loading} className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-[0.4em] uppercase transition-all ${synced ? 'bg-green-500/20 text-green-400' : 'bg-[#00E5FF] text-black'}`}>
            {loading ? 'SINCRONIZANDO...' : synced ? 'ACCESO VALIDADO' : 'VALIDAR Y CONECTAR'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- PÁGINA PRINCIPAL: DIRECTORIO / COMUNIDAD ---
export default function UsuariosPage() {
  const { profile } = useContext(UserContext)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()
  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      setUsers(data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  // 🛡️ VISTA DE COMUNIDAD PARA EL ESTUDIANTE[cite: 2]
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-[#00E5FF]/10 rounded-[2rem] flex items-center justify-center border border-[#00E5FF]/20">
          <Users size={40} className="text-[#00E5FF]" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">Comunidad <span className="text-[#00E5FF]">Botisfy</span></h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em]">Nodo de Red Activo</p>
        </div>
        <div className="bg-[#050505] border border-white/5 p-10 rounded-[3rem] w-full max-w-sm text-center">
          <Activity size={20} className="text-[#00E5FF] mx-auto mb-4 opacity-50" />
          <p className="text-zinc-500 text-[9px] font-black uppercase mb-2 tracking-widest">Total de Nodos en la Red</p>
          <p className="text-white text-5xl font-black italic tracking-tighter">{loading ? '...' : users.length}</p>
        </div>
      </div>
    )
  }

  // 🛡️ VISTA DE GESTIÓN PARA EL ADMIN[cite: 2]
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic text-white tracking-tighter uppercase leading-none">Directorio de <span className="text-[#00E5FF]">Nodos</span></h1>
        </div>
        <button className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl flex items-center gap-4 self-start">
          <UserPlus size={18} className="text-[#00E5FF]" />
          <span className="text-white text-[10px] font-black uppercase">Nuevo Registro</span>
        </button>
      </div>

      <div className="bg-[#050505] border border-white/5 rounded-[3rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-8 text-zinc-600 text-[9px] font-black uppercase">Colaborador</th>
                <th className="p-8 text-zinc-600 text-[9px] font-black uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {users.map((u) => (
                <tr key={u.id} className="group hover:bg-white/[0.01]">
                  <td className="p-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 font-black italic">{u.full_name?.substring(0,2).toUpperCase()}</div>
                      <div>
                        <p className="text-white text-[11px] font-bold uppercase">{u.full_name}</p>
                        <p className="text-zinc-600 text-[9px] lowercase mt-1">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <button onClick={() => { setSelectedUser(u); setIsModalOpen(true); }} className="p-3 bg-white/5 hover:text-[#00E5FF] rounded-xl"><Key size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && <ProtocoloAccesoModal selectedUser={selectedUser} onClose={() => setIsModalOpen(false)} />}
    </div>
  )
}