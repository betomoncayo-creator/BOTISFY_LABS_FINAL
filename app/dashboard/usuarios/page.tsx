'use client'
import { useState, useEffect, useCallback, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { UserContext } from '../../../lib/context'
import db from '../../../lib/database'
import {
  UserPlus, Search, Trash2, FileSpreadsheet, Mail,
  ShieldCheck, X, Key, RefreshCcw, Copy, Lock, Send, LinkIcon
} from 'lucide-react'
import BulkUploadModal from '../../../components/BulkUploadModal'

export default function UsuariosPage() {
  const { profile, loadingProfile } = useContext(UserContext)
  const router = useRouter()

  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)

  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [tempToken, setTempToken] = useState('')
  const [keyMode, setKeyMode] = useState<'choose' | 'manual' | 'email'>('choose')
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetEmailLoading, setResetEmailLoading] = useState(false)
  const [manualPassword, setManualPassword] = useState('')
  const [manualConfirm, setManualConfirm] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)
  const [manualSuccess, setManualSuccess] = useState(false)

  // Campos del modal de invitación
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('estudiante')
  const [creating, setCreating] = useState(false)
  const [createResult, setCreateResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (loadingProfile) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role?.toLowerCase() !== 'admin') router.replace('/dashboard')
  }, [profile, loadingProfile, router])

  const getAuthHeaders = async () => {
    const session = await db.getSession()
    if (!session?.access_token) throw new Error('Sin sesión')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
  }

  const generatePassword = () => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `BTF-${rand}-2026`
  }

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const data = await db.getAllProfiles()
      setUsuarios(data)
    } catch (err) {
      console.error('Error fetching usuarios:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (profile?.role?.toLowerCase() === 'admin') fetchUsuarios()
  }, [profile, fetchUsuarios])

  const openManualModal = () => {
    setNewUserName(''); setNewUserEmail(''); setNewUserRole('estudiante')
    setCreateResult(null); setIsManualModalOpen(true)
  }

  const handleInviteUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setCreateResult({ success: false, message: 'Nombre y email son requeridos' })
      return
    }
    setCreating(true); setCreateResult(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          full_name: newUserName.trim(),
          email: newUserEmail.trim().toLowerCase(),
          role: newUserRole
        })
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setCreateResult({ success: false, message: json.error || 'Error al invitar usuario' })
        return
      }
      setCreateResult({ success: true, message: `✅ Invitación enviada a ${newUserEmail}` })
      fetchUsuarios()
    } catch (err: any) {
      setCreateResult({ success: false, message: err.message || 'Error inesperado' })
    } finally {
      setCreating(false)
    }
  }

  const openKeyModal = (user: any) => {
    setSelectedUser(user)
    setTempToken(generatePassword())
    setKeyMode('choose')
    setResetEmailSent(false)
    setResetEmailLoading(false)
    setManualPassword('')
    setManualConfirm('')
    setManualError(null)
    setManualSuccess(false)
    setIsKeyModalOpen(true)
  }

  // Opción A: aplicar contraseña manual via API
  const handleManualReset = async () => {
    setManualError(null)
    if (!manualPassword.trim() || manualPassword.length < 6) {
      setManualError('Mínimo 6 caracteres')
      return
    }
    if (manualPassword !== manualConfirm) {
      setManualError('Las contraseñas no coinciden')
      return
    }
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/users/reset', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: selectedUser.id, newPassword: manualPassword })
      })
      if (res.ok) {
        setManualSuccess(true)
      } else {
        const json = await res.json()
        setManualError('Error: ' + json.error)
      }
    } catch (err) {
      setManualError('Error inesperado')
    }
  }

  // Opción B: aplicar contraseña temporal generada
  const handleTempReset = async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/users/reset', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: selectedUser.id, newPassword: tempToken })
      })
      if (res.ok) {
        setManualSuccess(true)
      } else {
        const json = await res.json()
        setManualError('Error: ' + json.error)
      }
    } catch (err) {
      setManualError('Error inesperado')
    }
  }

  // Opción C: enviar link de reset por email
  const handleSendResetEmail = async () => {
    setResetEmailLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/users/reset', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: selectedUser.id, sendEmail: true, email: selectedUser.email })
      })
      if (res.ok) {
        setResetEmailSent(true)
      } else {
        const json = await res.json()
        setManualError('Error: ' + json.error)
      }
    } catch (err) {
      setManualError('Error inesperado')
    } finally {
      setResetEmailLoading(false)
    }
  }

  const deleteUsuario = async (id: string) => {
    if (!confirm('¿Dar de baja a este usuario?')) return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE', headers })
      const json = await res.json()
      if (json.success) fetchUsuarios()
      else alert('Error: ' + json.error)
    } catch (err) {
      console.error('Error deleting user:', err)
    }
  }

  const filteredUsuarios = usuarios.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loadingProfile) return null
  if (profile?.role?.toLowerCase() !== 'admin') return null

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">

      {/* HEADER */}
      <div className="bg-[#050505] border border-white/5 p-8 md:p-12 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00E5FF]/5 blur-[120px] -mr-40 -mt-40" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black italic text-white tracking-tighter uppercase">
              <span className="text-[#00E5FF]">⚡</span> Directorio
            </h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em]">
              Gestión de Seguridad Botisfy Labs
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#00E5FF]" size={16} />
              <input
                type="text"
                placeholder="BUSCAR..."
                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-[10px] font-bold uppercase text-white outline-none focus:border-[#00E5FF]/30 transition-all w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center gap-3 px-6 py-4 border border-[#00E5FF]/30 text-[#00E5FF] rounded-2xl text-[10px] font-black uppercase hover:bg-[#00E5FF]/10 transition-all"
            >
              <FileSpreadsheet size={16} /> Carga Masiva
            </button>
            <button
              onClick={openManualModal}
              className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all"
            >
              <UserPlus size={16} /> Agregar
            </button>
          </div>
        </div>
      </div>

      {/* LISTADO */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="py-20 text-center text-zinc-600 text-[9px] font-black uppercase tracking-widest">
            No hay usuarios registrados
          </div>
        ) : filteredUsuarios.map((user) => (
          <div key={user.id} className="group bg-[#050505] border border-white/5 p-6 rounded-[2rem] flex items-center justify-between hover:border-[#00E5FF]/20 transition-all duration-500">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[#00E5FF]/30 transition-colors">
                <span className="text-white font-black text-xl italic group-hover:text-[#00E5FF]">
                  {user.full_name?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-black uppercase italic tracking-tight text-sm flex items-center gap-2">
                  {user.full_name}
                  {user.role === 'admin' && <ShieldCheck size={14} className="text-[#00E5FF]" />}
                </h3>
                <p className="text-zinc-500 text-[10px] font-bold flex items-center gap-2">
                  <Mail size={12}/> {user.email}
                  <span className="text-[#00E5FF]/60 ml-2">Nivel: {user.role}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openKeyModal(user)} className="p-3 text-zinc-600 hover:text-[#00E5FF] hover:bg-[#00E5FF]/5 rounded-xl transition-all">
                <Key size={18} />
              </button>
              <button onClick={() => deleteUsuario(user.id)} className="p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL INVITAR USUARIO */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80 animate-in fade-in duration-300">
          <div className="bg-[#080808] border border-white/10 w-full max-w-md rounded-[3rem] p-10 relative space-y-6">
            <button onClick={() => setIsManualModalOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center mb-2">
              <div className="w-16 h-16 bg-[#00E5FF]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#00E5FF]/20">
                <Send className="text-[#00E5FF]" size={28} />
              </div>
              <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter">Nuevo Acceso</h2>
              <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest mt-1">
                Se enviará invitación por email
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-zinc-400 text-[8px] font-black uppercase">Nombre Completo</label>
                <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#00E5FF]/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-zinc-400 text-[8px] font-black uppercase">Email</label>
                <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="email@empresa.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#00E5FF]/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-zinc-400 text-[8px] font-black uppercase">Rol</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#00E5FF]/50 transition-all">
                  <option value="estudiante">Estudiante</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="bg-[#00E5FF]/5 border border-[#00E5FF]/20 rounded-2xl px-5 py-4 flex items-start gap-3">
                <Mail size={14} className="text-[#00E5FF] flex-shrink-0 mt-0.5" />
                <p className="text-zinc-400 text-[9px] leading-relaxed">
                  El usuario recibirá un email con un <span className="text-[#00E5FF] font-bold">link de activación</span>. Al hacer click, podrá establecer su propia contraseña y acceder al sistema.
                </p>
              </div>
            </div>
            {createResult && (
              <div className={`p-4 rounded-2xl text-[9px] font-bold uppercase tracking-wide flex items-start gap-2 ${
                createResult.success ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {createResult.message}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsManualModalOpen(false)}
                className="flex-1 py-4 bg-zinc-900/50 text-white rounded-2xl font-black text-[9px] uppercase hover:bg-white/5 transition-all">
                {createResult?.success ? 'Cerrar' : 'Cancelar'}
              </button>
              {!createResult?.success && (
                <button onClick={handleInviteUser} disabled={creating || !newUserName.trim() || !newUserEmail.trim()}
                  className="flex-1 py-4 bg-[#00E5FF] text-black rounded-2xl font-black text-[9px] uppercase hover:bg-[#00D4EE] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {creating ? 'Enviando...' : <><Send size={12}/> Enviar Invitación</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROTOCOLO DE ACCESO */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80 animate-in fade-in duration-300">
          <div className="bg-[#080808] border border-[#00E5FF]/20 w-full max-w-md rounded-[3rem] p-10 relative shadow-[0_0_50px_rgba(0,229,255,0.1)]">
            <button onClick={() => setIsKeyModalOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
              <X size={20}/>
            </button>

            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-[#00E5FF]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#00E5FF]/20">
                <Key className="text-[#00E5FF]" size={32} />
              </div>
              <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter">Protocolo de Acceso</h2>
              <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-[0.4em] mt-2">
                Usuario: {selectedUser?.full_name}
              </p>
            </div>

            {/* PASO 1: Elegir modo */}
            {keyMode === 'choose' && (
              <div className="space-y-4">
                <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest text-center mb-6">
                  ¿Cómo deseas cambiar la contraseña?
                </p>
                <button onClick={() => setKeyMode('manual')}
                  className="w-full py-5 bg-white/5 border border-white/10 hover:border-[#00E5FF]/40 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                  <Lock size={16} className="text-[#00E5FF]" /> Establecer contraseña manualmente
                </button>
                <button onClick={() => setKeyMode('email')}
                  className="w-full py-5 bg-white/5 border border-white/10 hover:border-[#00E5FF]/40 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                  <LinkIcon size={16} className="text-[#00E5FF]" /> Enviar link de reset por email
                </button>
              </div>
            )}

            {/* PASO 2A: Manual */}
            {keyMode === 'manual' && !manualSuccess && (
              <div className="space-y-5">
                {/* Contraseña temporal generada */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-[0.3em] mb-2">Contraseña temporal sugerida</p>
                  <code className="text-[#00E5FF] text-lg font-black tracking-[0.15em]">{tempToken}</code>
                  <div className="flex justify-center gap-3 mt-4">
                    <button onClick={() => navigator.clipboard.writeText(tempToken)}
                      className="p-2 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all">
                      <Copy size={14}/>
                    </button>
                    <button onClick={() => setTempToken(generatePassword())}
                      className="p-2 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all">
                      <RefreshCcw size={14}/>
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-zinc-600 text-[9px] uppercase font-bold">— o escribe una contraseña —</span>
                </div>

                {/* Contraseña custom */}
                <div className="space-y-3">
                  <input type="password" value={manualPassword} onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="Nueva contraseña"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#00E5FF]/50 transition-all" />
                  <input type="password" value={manualConfirm} onChange={(e) => setManualConfirm(e.target.value)}
                    placeholder="Confirmar contraseña"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#00E5FF]/50 transition-all" />
                </div>

                {manualError && (
                  <p className="text-red-400 text-[9px] font-bold uppercase bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {manualError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setKeyMode('choose')}
                    className="flex-1 py-4 bg-zinc-900/50 text-white rounded-2xl font-black text-[9px] uppercase hover:bg-white/5 transition-all">
                    Atrás
                  </button>
                  <button
                    onClick={manualPassword.trim() ? handleManualReset : handleTempReset}
                    className="flex-1 py-4 bg-[#00E5FF] text-black rounded-2xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2">
                    <Lock size={14}/> Aplicar
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2B: Email */}
            {keyMode === 'email' && !resetEmailSent && (
              <div className="space-y-6">
                <div className="bg-[#00E5FF]/5 border border-[#00E5FF]/20 rounded-2xl px-5 py-5 flex items-start gap-3">
                  <Mail size={16} className="text-[#00E5FF] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-[10px] font-black uppercase mb-1">Se enviará un email a:</p>
                    <p className="text-[#00E5FF] text-xs font-bold">{selectedUser?.email}</p>
                    <p className="text-zinc-500 text-[9px] mt-2">El usuario recibirá un link para establecer su nueva contraseña.</p>
                  </div>
                </div>

                {manualError && (
                  <p className="text-red-400 text-[9px] font-bold uppercase bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {manualError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setKeyMode('choose')}
                    className="flex-1 py-4 bg-zinc-900/50 text-white rounded-2xl font-black text-[9px] uppercase hover:bg-white/5 transition-all">
                    Atrás
                  </button>
                  <button onClick={handleSendResetEmail} disabled={resetEmailLoading}
                    className="flex-1 py-4 bg-[#00E5FF] text-black rounded-2xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {resetEmailLoading ? 'Enviando...' : <><Send size={14}/> Enviar Link</>}
                  </button>
                </div>
              </div>
            )}

            {/* SUCCESS: contraseña aplicada */}
            {manualSuccess && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <ShieldCheck className="text-[#00E5FF]" size={48} />
                <p className="text-white font-black uppercase text-sm">¡Contraseña actualizada!</p>
                <p className="text-zinc-500 text-[9px]">La contraseña de {selectedUser?.full_name} fue cambiada exitosamente.</p>
                <button onClick={() => setIsKeyModalOpen(false)}
                  className="mt-2 px-8 py-4 bg-[#00E5FF] text-black rounded-2xl font-black text-[9px] uppercase transition-all">
                  Cerrar
                </button>
              </div>
            )}

            {/* SUCCESS: email enviado */}
            {resetEmailSent && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <Mail className="text-[#00E5FF]" size={48} />
                <p className="text-white font-black uppercase text-sm">¡Email enviado!</p>
                <p className="text-zinc-500 text-[9px]">Se envió el link de reset a {selectedUser?.email}.</p>
                <button onClick={() => setIsKeyModalOpen(false)}
                  className="mt-2 px-8 py-4 bg-[#00E5FF] text-black rounded-2xl font-black text-[9px] uppercase transition-all">
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <BulkUploadModal
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => { setIsBulkModalOpen(false); fetchUsuarios() }}
        />
      )}
    </div>
  )
}