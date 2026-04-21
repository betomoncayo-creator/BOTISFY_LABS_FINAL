'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Loader2, UserPlus, Trash2, X, Check, Copy, AlertCircle, KeyRound, ShieldAlert } from 'lucide-react'

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Estados para el Reseteo de Contraseña
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const supabase = createClient()

  // Sincronización real con Supabase
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) setUsers(data)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // =====================================
  // CREACIÓN DE USUARIOS
  // =====================================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setErrorMsg(null)
    
    const newPass = "BTF-" + Math.random().toString(36).substring(2, 9).toUpperCase()
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: newPass, 
          fullName: 'Pendiente Onboarding',
          role: 'estudiante'
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Error al crear usuario")

      setTempPassword(newPass)
      fetchUsers()
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  // =====================================
  // RESETEO DE CONTRASEÑA
  // =====================================
  const openResetModal = (user: any) => {
    setSelectedUser(user)
    setResetPassword('')
    setIsResetModalOpen(true)
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return
    setIsResetting(true)
    setErrorMsg(null)

    const newPass = "BTF-" + Math.random().toString(36).substring(2, 9).toUpperCase()

    try {
      const response = await fetch('/api/users/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newPass
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Error al resetear contraseña")

      setResetPassword(newPass)
    } catch (error: any) {
      setErrorMsg(error.message)
      setIsResetModalOpen(false)
    } finally {
      setIsResetting(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="animate-spin text-[#00E5FF]" size={40} />
      <p className="text-zinc-500 font-black text-[10px] tracking-[0.5em] uppercase italic">
        Sincronizando Directorio...
      </p>
    </div>
  )

  return (
    <div className="animate-in fade-in duration-700">
      
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden space-y-12">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00E5FF]/5 blur-[120px] pointer-events-none" />

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase">
              Directorio <span className="text-[#00E5FF]">Neural</span>
            </h1>
            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em] italic opacity-60">
              Botisfy Labs | Gestión de Colaboradores
            </p>
          </div>
          
          <button 
            onClick={() => {setIsModalOpen(true); setTempPassword(''); setErrorMsg(null);}} 
            className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#00E5FF] transition-all shadow-xl shadow-black/40 active:scale-95"
          >
            + Vincular Usuario
          </button>
        </header>

        {errorMsg && (
          <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500 text-[10px] font-black uppercase tracking-widest relative z-10 animate-pulse">
            <AlertCircle size={18} /> Error de Sistema: {errorMsg}
          </div>
        )}

        {/* TABLA ESTILIZADA */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 text-[10px] uppercase font-black text-zinc-500 tracking-[0.3em] italic">
                <tr>
                  <th className="p-8 md:p-10 border-b border-white/5">Colaborador</th>
                  <th className="p-8 md:p-10 border-b border-white/5">Rango</th>
                  <th className="p-8 md:p-10 border-b border-white/5 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="p-8 md:p-10">
                      <div className="flex flex-col">
                        <span className="font-bold text-base md:text-lg tracking-tight group-hover:text-[#00E5FF] transition-colors">
                          {u.full_name || 'Pendiente Onboarding'}
                        </span>
                        <span className="text-[10px] md:text-[11px] text-zinc-600 font-mono italic mt-1">{u.email}</span>
                      </div>
                    </td>
                    <td className="p-8 md:p-10">
                      <span className="px-4 py-1.5 md:px-5 md:py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase border border-[#00E5FF]/20 text-[#00E5FF] bg-[#00E5FF]/5 shadow-[0_0_15px_rgba(0,229,255,0.05)]">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-8 md:p-10 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openResetModal(u)}
                          title="Resetear Contraseña"
                          className="text-zinc-500 hover:text-orange-500 transition-all p-3 bg-white/5 rounded-xl hover:bg-orange-500/10"
                        >
                          <KeyRound size={18} />
                        </button>
                        <button 
                          onClick={async () => { if(confirm('¿Confirmar baja de sistema?')){ await supabase.from('profiles').delete().eq('id', u.id); fetchUsers(); } }} 
                          title="Eliminar Usuario"
                          className="text-zinc-500 hover:text-red-500 transition-all p-3 bg-white/5 rounded-xl hover:bg-red-500/10"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE CREACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#050505] border border-white/10 p-12 rounded-[4rem] text-center shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 text-zinc-600 hover:text-white transition-colors">
              <X size={24}/>
            </button>
            
            {!tempPassword ? (
              <form onSubmit={handleCreateUser} className="space-y-10">
                <div className="bg-[#00E5FF]/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-[#00E5FF]/20">
                  <UserPlus className="text-[#00E5FF]" size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-white font-black uppercase italic text-2xl tracking-tighter">Vincular Acceso</h2>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Generar credencial temporal</p>
                </div>
                <input required type="email" placeholder="EMAIL@EMPRESA.COM" className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-center text-sm text-white outline-none focus:border-[#00E5FF] font-bold tracking-widest transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button disabled={isCreating} className="w-full bg-white text-black font-black py-6 rounded-2xl uppercase text-[11px] tracking-[0.5em] hover:bg-[#00E5FF] transition-all shadow-xl shadow-black/50 disabled:opacity-50">
                  {isCreating ? 'SINCRO EN CURSO...' : 'GENERAR LLAVE'}
                </button>
              </form>
            ) : (
              <div className="space-y-10 animate-in zoom-in duration-500">
                <div className="bg-green-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-green-500/20">
                  <Check className="text-green-500" size={32} />
                </div>
                <h2 className="text-white font-black uppercase italic text-2xl tracking-tighter">Acceso Generado</h2>
                <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-[2.5rem] text-[#00E5FF] font-mono text-3xl font-black italic tracking-[0.2em] shadow-inner">
                  {tempPassword}
                </div>
                <button onClick={() => {navigator.clipboard.writeText(`Acceso Academia:\nEmail: ${email}\nClave: ${tempPassword}`); setCopied(true); setTimeout(() => setCopied(false), 2000);}} className={`w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${copied ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-[#00E5FF] text-black shadow-xl shadow-black/50'}`}>
                   {copied ? <Check size={18}/> : <Copy size={18}/>} 
                   {copied ? '¡CREDENCIAL COPIADA!' : 'COPIAR ACCESO'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE RESETEO DE CONTRASEÑA */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#050505] border border-white/10 p-12 rounded-[4rem] text-center shadow-2xl relative">
            <button onClick={() => setIsResetModalOpen(false)} className="absolute top-10 right-10 text-zinc-600 hover:text-white transition-colors">
              <X size={24}/>
            </button>
            
            {!resetPassword ? (
              <div className="space-y-10">
                <div className="bg-orange-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-orange-500/20">
                  <ShieldAlert className="text-orange-500" size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-white font-black uppercase italic text-2xl tracking-tighter">Resetear Clave</h2>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    Se generará una nueva contraseña para:<br/>
                    <span className="text-white">{selectedUser?.email}</span>
                  </p>
                </div>
                <button onClick={handleResetPassword} disabled={isResetting} className="w-full bg-orange-500 text-white font-black py-6 rounded-2xl uppercase text-[11px] tracking-[0.4em] hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50">
                  {isResetting ? 'RESETEANDO...' : 'FORZAR RESETEO'}
                </button>
              </div>
            ) : (
              <div className="space-y-10 animate-in zoom-in duration-500">
                <div className="bg-green-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-green-500/20">
                  <Check className="text-green-500" size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-white font-black uppercase italic text-2xl tracking-tighter">Reseteo Exitoso</h2>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Entrega esta nueva clave al usuario</p>
                </div>
                <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-[2.5rem] text-orange-400 font-mono text-3xl font-black italic tracking-[0.2em] shadow-inner">
                  {resetPassword}
                </div>
                <button onClick={() => {navigator.clipboard.writeText(`Nueva clave Academia:\nEmail: ${selectedUser?.email}\nClave: ${resetPassword}`); setCopied(true); setTimeout(() => setCopied(false), 2000);}} className={`w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${copied ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-orange-500 text-white shadow-xl shadow-orange-500/20'}`}>
                   {copied ? <Check size={18}/> : <Copy size={18}/>} 
                   {copied ? '¡CLAVE COPIADA!' : 'COPIAR NUEVA CLAVE'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}