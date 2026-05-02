'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  UserPlus, 
  Search, 
  Trash2, 
  FileSpreadsheet, 
  Mail,
  ShieldCheck,
  User as UserIcon,
  X,
  Key,
  RefreshCcw,
  Copy
} from 'lucide-react'
import BulkUploadModal from '@/components/BulkUploadModal'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modales
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  
  // Datos de usuario seleccionado
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [tempToken, setTempToken] = useState('')

  // Registro Manual
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('estudiante')

  const supabase = createClient()

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsuarios(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  // 🔑 GENERADOR DE PROTOCOLO DE ACCESO
  const openKeyModal = (user: any) => {
    setSelectedUser(user)
    // Generamos un "Token" ficticio para el dashboard (o puedes usar la lógica de Supabase)
    const randomToken = Math.random().toString(36).substring(2, 10).toUpperCase()
    setTempToken(`BTF-${randomToken}-2026`)
    setIsKeyModalOpen(true)
  }

  const handleResetProtocol = async () => {
    if (!selectedUser) return
    const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    
    if (!error) {
      alert("Enviado al correo del nodo.")
      setIsKeyModalOpen(false)
    }
  }

  const deleteUsuario = async (id: string) => {
    if (!confirm('¿Dar de baja?')) return
    await supabase.from('profiles').delete().eq('id', id)
    fetchUsuarios()
  }

  const filteredUsuarios = usuarios.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 font-sans">
      
      {/* HEADER DE GESTIÓN */}
      <div className="bg-[#050505] border border-white/5 p-8 md:p-12 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00E5FF]/5 blur-[120px] -mr-40 -mt-40" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black italic text-white tracking-tighter uppercase">
              <span className="text-[#00E5FF]">⚡</span> Directorio
            </h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em]">Gestión de Seguridad Botisfy Labs</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#00E5FF]" size={16} />
              <input type="text" placeholder="BUSCAR..." className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-[10px] font-bold uppercase text-white outline-none focus:border-[#00E5FF]/30 transition-all w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-3 px-6 py-4 border border-[#00E5FF]/30 text-[#00E5FF] rounded-2xl text-[10px] font-black uppercase hover:bg-[#00E5FF]/10 transition-all active:scale-95"><FileSpreadsheet size={16} /> Carga Masiva</button>
            <button onClick={() => setIsManualModalOpen(true)} className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all active:scale-95"><UserPlus size={16} /> Agregar</button>
          </div>
        </div>
      </div>

      {/* LISTADO DE COLABORADORES */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center"><div className="w-10 h-10 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filteredUsuarios.map((user) => (
          <div key={user.id} className="group bg-[#050505] border border-white/5 p-6 rounded-[2rem] flex items-center justify-between hover:border-[#00E5FF]/20 transition-all duration-500">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[#00E5FF]/30 transition-colors">
                <span className="text-white font-black text-xl italic group-hover:text-[#00E5FF]">{user.full_name?.[0]}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-black uppercase italic tracking-tight text-sm flex items-center gap-2">{user.full_name} {user.role === 'admin' && <ShieldCheck size={14} className="text-[#00E5FF]" />}</h3>
                <p className="text-zinc-500 text-[10px] font-bold flex items-center gap-2"><Mail size={12}/> {user.email} <span className="text-[#00E5FF]/60 ml-2">Nivel: {user.role}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openKeyModal(user)} className="p-3 text-zinc-600 hover:text-[#00E5FF] hover:bg-[#00E5FF]/5 rounded-xl transition-all"><Key size={18} /></button>
              <button onClick={() => deleteUsuario(user.id)} className="p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* 🛡️ MODAL DE SEGURIDAD (TOKEN LLAVE) */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80 animate-in fade-in duration-300">
          <div className="bg-[#080808] border border-[#00E5FF]/20 w-full max-w-md rounded-[3rem] p-10 relative shadow-[0_0_50px_rgba(0,229,255,0.1)]">
            <button onClick={() => setIsKeyModalOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><X /></button>
            
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-[#00E5FF]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#00E5FF]/20">
                <Key className="text-[#00E5FF]" size={32} />
              </div>
              <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter">Protocolo de Acceso</h2>
              <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-[0.4em] mt-2">Usuario: {selectedUser?.full_name}</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center group">
                <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-[0.3em] mb-3">Token de Seguridad Temporal</p>
                <code className="text-[#00E5FF] text-xl font-black tracking-[0.2em]">{tempToken}</code>
                <div className="flex justify-center gap-4 mt-6">
                  <button onClick={() => navigator.clipboard.writeText(tempToken)} className="p-3 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all"><Copy size={16}/></button>
                  <button onClick={() => openKeyModal(selectedUser)} className="p-3 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all"><RefreshCcw size={16}/></button>
                </div>
              </div>
              
              <button onClick={handleResetProtocol} className="w-full py-5 bg-[#00E5FF] text-black font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl shadow-lg shadow-[#00E5FF]/20 active:scale-95 transition-all">
                Enviar Link de Reseteo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTROS MODALES (Manual y Bulk) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80">
          <div className="bg-[#080808] border border-white/10 w-full max-w-md rounded-[3rem] p-10 relative">
            <button onClick={() => setIsManualModalOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X /></button>
            <h2 className="text-white text-2xl font-black uppercase italic mb-8">Nuevo Acceso</h2>
            <form onSubmit={(e) => { e.preventDefault(); /* Tu lógica manual aquí */ setIsManualModalOpen(false); fetchUsuarios(); }} className="space-y-6">
              <input type="text" placeholder="NOMBRE COMPLETO" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-[10px] font-bold outline-none focus:border-[#00E5FF]/50" required />
              <input type="email" placeholder="EMAIL" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-[10px] font-bold outline-none focus:border-[#00E5FF]/50" required />
              <button type="submit" className="w-full py-5 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl">Sincronizar</button>
            </form>
          </div>
        </div>
      )}

      {isBulkModalOpen && <BulkUploadModal onClose={() => setIsBulkModalOpen(false)} onSuccess={() => { setIsBulkModalOpen(false); fetchUsuarios(); }} />}
    </div>
  )
}