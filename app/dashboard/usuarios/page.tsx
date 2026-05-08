'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../../lib/supabase'
import { 
  UserPlus, Search, Trash2, FileSpreadsheet, Mail,
  ShieldCheck, X, Key, RefreshCcw, Copy, Eye, EyeOff, Check
} from 'lucide-react'
import BulkUploadModal from '../../../components/BulkUploadModal'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [tempToken, setTempToken] = useState('')

  // Nuevo usuario
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('estudiante')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createResult, setCreateResult] = useState<{ success: boolean; message: string } | null>(null)

  const generatePassword = () => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `BTF-${rand}-2026`
  }

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setUsuarios(data)
    } catch (err) {
      console.error('Error fetching usuarios:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  const openManualModal = () => {
    setNewUserName('')
    setNewUserEmail('')
    setNewUserRole('estudiante')
    setNewUserPassword(generatePassword())
    setShowPassword(false)
    setCreateResult(null)
    setIsManualModalOpen(true)
  }

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setCreateResult({ success: false, message: 'Todos los campos son requeridos' })
      return
    }

    setCreating(true)
    setCreateResult(null)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newUserName.trim(),
          email: newUserEmail.trim().toLowerCase(),
          password: newUserPassword,
          role: newUserRole
        })
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setCreateResult({ success: false, message: json.error || 'Error al crear usuario' })
        return
      }

      setCreateResult({ 
        success: true, 
        message: `✅ Usuario creado. Contraseña temporal: ${newUserPassword}` 
      })
      fetchUsuarios()

    } catch (err: any) {
      setCreateResult({ success: false, message: err.message || 'Error inesperado' })
    } finally {
      setCreating(false)
    }
  }

  const openKeyModal = (user: any) => {
    setSelectedUser(user)
    const rand = Math.random().toString(36).substring(2, 10).toUpperCase()
    setTempToken(`BTF-${rand}-2026`)
    setIsKeyModalOpen(true)
  }

  const handleResetProtocol = async () => {
    if (!selectedUser) return
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      if (!error) {
        alert('Enviado al correo del nodo.')
        setIsKeyModalOpen(false)
      }
    } catch (err) {
      console.error('Error resetting password:', err)
    }
  }

  const deleteUsuario = async (id: string) => {
    if (!confirm('¿Dar de baja a este usuario?')) return
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
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
              <button
                onClick={() => openKeyModal(user)}
                className="p-3 text-zinc-600 hover:text-[#00E5FF] hover:bg-[#00E5FF]/5 rounded-xl transition-all"
              >
                <Key size={18} />
              </button>
              <button
                onClick={() => deleteUsuario(user.id)}
                className="p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREAR USUARIO */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80 animate-in fade-in duration-300">
          <div className="bg-[#080808] border border-white/10 w-full max-w-md rounded-[3rem] p-10 relative space-y-6">
            <button onClick={() => setIsManualModalOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
              <X size={20} />
            </button>

            <div>
              <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter">Nuevo Acceso</h2>
              <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest mt-1">
                Se creará el usuario en Auth + Directorio
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-zinc-400 text-[8px] font-black uppercase">Nombre Completo</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#00E5FF]/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-zinc-400 text-[8px] font-black uppercase">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="email@empresa.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#00E5FF]/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-zinc-400 text-[8px] font-black uppercase">Rol</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#00E5FF]/50 transition-all"
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-400 text-[8px] font-black uppercase">Contraseña Temporal</label>
                  <button
                    onClick={() => setNewUserPassword(generatePassword())}
                    className="text-[#00E5FF] text-[8px] font-black uppercase flex items-center gap-1 hover:opacity-70 transition-all"
                  >
                    <RefreshCcw size={10} /> Regenerar
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-mono outline-none focus:border-[#00E5FF]/50 transition-all pr-12"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-all"
                  >
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(newUserPassword) }}
                  className="flex items-center gap-2 text-zinc-500 text-[8px] font-bold uppercase hover:text-white transition-all"
                >
                  <Copy size={10}/> Copiar contraseña
                </button>
              </div>
            </div>

            {createResult && (
              <div className={`p-4 rounded-2xl text-[9px] font-bold uppercase tracking-wide flex items-start gap-2 ${
                createResult.success
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {createResult.success ? <Check size={14} className="flex-shrink-0 mt-0.5"/> : <X size={14} className="flex-shrink-0 mt-0.5"/>}
                {createResult.message}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="flex-1 py-4 bg-zinc-900/50 text-white rounded-2xl font-black text-[9px] uppercase hover:bg-white/5 transition-all"
              >
                {createResult?.success ? 'Cerrar' : 'Cancelar'}
              </button>
              {!createResult?.success && (
                <button
                  onClick={handleCreateUser}
                  disabled={creating || !newUserName.trim() || !newUserEmail.trim()}
                  className="flex-1 py-4 bg-[#00E5FF] text-black rounded-2xl font-black text-[9px] uppercase hover:bg-[#00D4EE] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creando...' : 'Crear Usuario'}
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
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-[#00E5FF]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#00E5FF]/20">
                <Key className="text-[#00E5FF]" size={32} />
              </div>
              <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter">Protocolo de Acceso</h2>
              <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-[0.4em] mt-2">
                Usuario: {selectedUser?.full_name}
              </p>
            </div>
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-[0.3em] mb-3">Token de Seguridad Temporal</p>
                <code className="text-[#00E5FF] text-xl font-black tracking-[0.2em]">{tempToken}</code>
                <div className="flex justify-center gap-4 mt-6">
                  <button onClick={() => navigator.clipboard.writeText(tempToken)} className="p-3 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all">
                    <Copy size={16}/>
                  </button>
                  <button onClick={() => openKeyModal(selectedUser)} className="p-3 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all">
                    <RefreshCcw size={16}/>
                  </button>
                </div>
              </div>
              <button
                onClick={handleResetProtocol}
                className="w-full py-5 bg-[#00E5FF] text-black font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl transition-all"
              >
                Enviar Link de Reseteo
              </button>
            </div>
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