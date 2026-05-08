'use client'
import { useState, useContext } from 'react'
import { UserContext } from '../../../lib/context'
import { createClient } from '../../../lib/supabase'
import { Loader2, Check, X, Lock, Mail, User as UserIcon, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { profile } = useContext(UserContext)
  const router = useRouter()
  
  // Estado para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
      
      // Verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: currentPassword,
      })
      
      if (signInError) throw new Error('Contraseña actual incorrecta')
      
      // Cambiar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (updateError) throw updateError
      
      setPasswordMessage({ type: 'success', text: '✅ Contraseña actualizada correctamente' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      setTimeout(() => setPasswordMessage(null), 5000)
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: `❌ ${err.message}` })
    } finally {
      setLoadingPassword(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
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
        
        {/* SECCIÓN: INFORMACIÓN DE PERFIL */}
        <div className="bg-[#050505] border border-white/10 p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <UserIcon size={24} className="text-cyan-400" />
            <h2 className="text-xl font-black text-white uppercase">Perfil</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Nombre Completo</p>
              <p className="text-white text-sm bg-white/[0.02] p-3 rounded-lg border border-white/5">
                {profile?.full_name || 'No definido'}
              </p>
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
              <p className={`text-sm font-bold uppercase p-3 rounded-lg border $
                profile?.role === 'admin' 
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' 
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
              `}>
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

        {/* SECCIÓN: CAMBIAR CONTRASEÑA */}
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
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg p-3 text-white placeholder:text-zinc-500 text-sm focus:border-cyan-400 focus:outline-none transition-all"
                required
                disabled={loadingPassword}
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-cyan-400 uppercase block mb-2">Nueva Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg p-3 text-white placeholder:text-zinc-500 text-sm focus:border-cyan-400 focus:outline-none transition-all"
                required
                disabled={loadingPassword}
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-cyan-400 uppercase block mb-2">Confirmar Contraseña</label>
              <input
                type="password"
                placeholder="Repetir contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg p-3 text-white placeholder:text-zinc-500 text-sm focus:border-cyan-400 focus:outline-none transition-all"
                required
                disabled={loadingPassword}
              />
            </div>
            
            <button
              type="submit"
              disabled={loadingPassword}
              className="w-full bg-cyan-400 hover:bg-cyan-300 text-black py-3 rounded-lg font-black uppercase text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loadingPassword ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Actualizando...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Cambiar Contraseña
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* SECCIÓN: ACCIONES GENERALES */}
      <div className="bg-[#050505] border border-white/10 p-8 rounded-2xl">
        <h2 className="text-xl font-black text-white uppercase mb-6">Acciones</h2>
        
        <button
          onClick={handleLogout}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-3 rounded-lg font-black uppercase text-sm transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>

      {/* INFORMACIÓN ADICIONAL */}
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl text-center">
        <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider">
          ¿Problemas de seguridad? Contáctanos en support@botisfy.com
        </p>
      </div>
    </div>
  )
}