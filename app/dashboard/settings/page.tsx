'use client'
import { useState, useContext, useEffect } from 'react'
import { UserContext } from '../../../lib/context'
import db from '../../../lib/database'
import { Loader2, Check, X, Lock, Mail, User as UserIcon, LogOut, Eye, EyeOff, Crown, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

export default function SettingsPage() {
  const { profile } = useContext(UserContext)
  const router = useRouter()

  // Contraseña
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Nombre
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [loadingName, setLoadingName] = useState(false)
  const [nameMessage, setNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Transferir admin
  const [showTransfer, setShowTransfer] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedNewAdmin, setSelectedNewAdmin] = useState('')
  const [transferPassword, setTransferPassword] = useState('')
  const [showTransferPassword, setShowTransferPassword] = useState(false)
  const [loadingTransfer, setLoadingTransfer] = useState(false)
  const [transferMessage, setTransferMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [transferDone, setTransferDone] = useState(false)

  useEffect(() => {
    if (showTransfer && profile?.role === 'admin') {
      db.getAllProfiles().then((data) => {
        setAllUsers(data.filter((u: any) => u.id !== profile.id))
      })
    }
  }, [showTransfer, profile])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingPassword(true)
    setPasswordMessage(null)
    try {
      if (!currentPassword) throw new Error('Ingresa tu contraseña actual')
      if (!newPassword) throw new Error('Ingresa la nueva contraseña')
      if (newPassword.length < 6) throw new Error('Mínimo 6 caracteres')
      if (newPassword !== confirmPassword) throw new Error('Las contraseñas no coinciden')

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: currentPassword,
      })
      if (signInError) throw new Error('Contraseña actual incorrecta')

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      setPasswordMessage({ type: 'success', text: '✅ Contraseña actualizada correctamente' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setPasswordMessage(null), 5000)
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: `❌ ${err.message}` })
    } finally {
      setLoadingPassword(false)
    }
  }

  const handleChangeName = async () => {
    if (!newName.trim()) return
    setLoadingName(true)
    setNameMessage(null)
    try {
      const session = await db.getSession()
      if (!session?.access_token) throw new Error('Sin sesión')

      const { createClient: createAdmin } = await import('@supabase/supabase-js')
      const supabase = createClient()
      const { error } = await supabase.from('profiles').update({ full_name: newName.trim() }).eq('id', profile?.id)
      if (error) throw error

      setNameMessage({ type: 'success', text: '✅ Nombre actualizado' })
      setEditingName(false)
      setTimeout(() => setNameMessage(null), 4000)
    } catch (err: any) {
      setNameMessage({ type: 'error', text: `❌ ${err.message}` })
    } finally {
      setLoadingName(false)
    }
  }

  const handleTransferAdmin = async () => {
    if (!selectedNewAdmin || !transferPassword) return
    setLoadingTransfer(true)
    setTransferMessage(null)
    try {
      // Verificar contraseña del admin actual
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: transferPassword,
      })
      if (signInError) throw new Error('Contraseña incorrecta')

      // Llamar API para cambiar roles
      const session = await db.getSession()
      if (!session?.access_token) throw new Error('Sin sesión')

      const res = await fetch('/api/users/transfer-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          newAdminId: selectedNewAdmin,
          currentAdminId: profile?.id
        })
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Error al transferir')

      setTransferDone(true)
      setTransferMessage({ type: 'success', text: '✅ Poderes transferidos. Tu rol cambió a estudiante.' })
      setTimeout(() => {
        db.signOut().then(() => router.replace('/login'))
      }, 3000)
    } catch (err: any) {
      setTransferMessage({ type: 'error', text: `❌ ${err.message}` })
    } finally {
      setLoadingTransfer(false)
    }
  }

  const handleLogout = async () => {
    try {
      await db.signOut()
      router.replace('/login')
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">

      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-black text-white uppercase">Configuración</h1>
        <p className="text-cyan-400 text-sm mt-2">Personaliza tu perfil y seguridad</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">

        {/* PERFIL */}
        <div className="bg-[#050505] border border-white/10 p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <UserIcon size={24} className="text-cyan-400" />
            <h2 className="text-xl font-black text-white uppercase">Perfil</h2>
          </div>
          <div className="space-y-4">

            {/* Nombre editable */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-zinc-500 text-xs uppercase font-bold">Nombre Completo</p>
                {!editingName && (
                  <button onClick={() => { setEditingName(true); setNewName(profile?.full_name || '') }}
                    className="text-zinc-500 hover:text-cyan-400 transition-colors">
                    <Pencil size={14} />
                  </button>
                )}
              </div>
              {editingName ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white/[0.05] border border-cyan-400/30 rounded-lg p-3 text-white text-sm focus:border-cyan-400 focus:outline-none transition-all"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingName(false)}
                      className="flex-1 py-2 bg-zinc-900 text-zinc-400 rounded-lg text-xs font-bold uppercase hover:bg-white/5 transition-all">
                      Cancelar
                    </button>
                    <button onClick={handleChangeName} disabled={loadingName || !newName.trim()}
                      className="flex-1 py-2 bg-cyan-400 text-black rounded-lg text-xs font-bold uppercase hover:bg-cyan-300 transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                      {loadingName ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-white text-sm bg-white/[0.02] p-3 rounded-lg border border-white/5">
                  {profile?.full_name || 'No definido'}
                </p>
              )}
              {nameMessage && (
                <p className={`text-xs mt-2 font-bold ${nameMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {nameMessage.text}
                </p>
              )}
            </div>

            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Email</p>
              <p className="text-white text-sm bg-white/[0.02] p-3 rounded-lg border border-white/5 flex items-center gap-2">
                <Mail size={16} className="text-cyan-400" />
                {profile?.email || 'No definido'}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Rol</p>
              <p className={`text-sm font-bold uppercase p-3 rounded-lg border ${
                profile?.role === 'admin'
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
              }`}>
                {profile?.role === 'admin' ? '🛡️ Administrador' : '👤 Estudiante'}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Estado</p>
              <p className="text-green-400 text-sm bg-green-500/10 p-3 rounded-lg border border-green-500/20 flex items-center gap-2">
                <Check size={16} /> Cuenta activa
              </p>
            </div>
          </div>
        </div>

        {/* SEGURIDAD */}
        <div className="bg-[#050505] border border-white/10 p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Lock size={24} className="text-cyan-400" />
            <h2 className="text-xl font-black text-white uppercase">Seguridad</h2>
          </div>

          {passwordMessage && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              passwordMessage.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {passwordMessage.type === 'success' ? <Check size={20} /> : <X size={20} />}
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-cyan-400 uppercase block mb-2">Contraseña Actual</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} placeholder="••••••••" value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg p-3 pr-12 text-white placeholder:text-zinc-500 text-sm focus:border-cyan-400 focus:outline-none transition-all"
                  required disabled={loadingPassword} />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-cyan-400 uppercase block mb-2">Nueva Contraseña</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg p-3 pr-12 text-white placeholder:text-zinc-500 text-sm focus:border-cyan-400 focus:outline-none transition-all"
                  required disabled={loadingPassword} />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-cyan-400 uppercase block mb-2">Confirmar Contraseña</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} placeholder="Repetir contraseña" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg p-3 pr-12 text-white placeholder:text-zinc-500 text-sm focus:border-cyan-400 focus:outline-none transition-all"
                  required disabled={loadingPassword} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loadingPassword}
              className="w-full bg-cyan-400 hover:bg-cyan-300 text-black py-3 rounded-lg font-black uppercase text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {loadingPassword ? (
                <><Loader2 className="animate-spin" size={18} /> Actualizando...</>
              ) : (
                <><Lock size={18} /> Cambiar Contraseña</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* TRANSFERIR ADMIN — solo visible para admins */}
      {profile?.role === 'admin' && (
        <div className="bg-[#050505] border border-yellow-500/20 p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Crown size={24} className="text-yellow-400" />
            <h2 className="text-xl font-black text-white uppercase">Transferir Administración</h2>
          </div>
          <p className="text-zinc-500 text-xs mb-6">
            Pasa los poderes de admin a otro usuario. Tu cuenta pasará a ser estudiante y se cerrará la sesión automáticamente.
          </p>

          {!showTransfer ? (
            <button onClick={() => setShowTransfer(true)}
              className="flex items-center gap-2 px-6 py-3 border border-yellow-500/30 text-yellow-400 rounded-lg text-xs font-black uppercase hover:bg-yellow-500/10 transition-all">
              <Crown size={16} /> Iniciar transferencia
            </button>
          ) : transferDone ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-green-400 text-sm font-bold">
              ✅ Transferencia completada. Cerrando sesión...
            </div>
          ) : (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-zinc-400 text-xs uppercase font-bold block mb-2">Nuevo Administrador</label>
                <select value={selectedNewAdmin} onChange={(e) => setSelectedNewAdmin(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-yellow-400/50 transition-all">
                  <option value="">— Selecciona un usuario —</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-zinc-400 text-xs uppercase font-bold block mb-2">Confirma tu contraseña</label>
                <div className="relative">
                  <input type={showTransferPassword ? 'text' : 'password'} value={transferPassword}
                    onChange={(e) => setTransferPassword(e.target.value)}
                    placeholder="Tu contraseña actual"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white text-sm outline-none focus:border-yellow-400/50 transition-all" />
                  <button type="button" onClick={() => setShowTransferPassword(!showTransferPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                    {showTransferPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {transferMessage && (
                <p className={`text-xs font-bold ${transferMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {transferMessage.text}
                </p>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setShowTransfer(false); setTransferPassword(''); setSelectedNewAdmin('') }}
                  className="flex-1 py-3 bg-zinc-900 text-zinc-400 rounded-lg text-xs font-black uppercase hover:bg-white/5 transition-all">
                  Cancelar
                </button>
                <button onClick={handleTransferAdmin}
                  disabled={loadingTransfer || !selectedNewAdmin || !transferPassword}
                  className="flex-1 py-3 bg-yellow-500 text-black rounded-lg text-xs font-black uppercase hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loadingTransfer ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
                  Transferir
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACCIONES */}
      <div className="bg-[#050505] border border-white/10 p-8 rounded-2xl">
        <h2 className="text-xl font-black text-white uppercase mb-6">Acciones</h2>
        <button onClick={handleLogout}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-3 rounded-lg font-black uppercase text-sm transition-all flex items-center justify-center gap-2">
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl text-center">
        <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider">
          ¿Problemas de seguridad? Contáctanos en support@botisfy.com
        </p>
      </div>
    </div>
  )
}