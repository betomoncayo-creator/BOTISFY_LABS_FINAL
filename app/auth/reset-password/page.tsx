'use client'
import { useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, Check } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      if (!newPassword || !confirmPassword) {
        throw new Error('Completa ambos campos')
      }
      
      if (newPassword.length < 6) {
        throw new Error('La contraseña debe tener mínimo 6 caracteres')
      }
      
      if (newPassword !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden')
      }

      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setSuccess(true)
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Error al restablecer contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001a1a] to-[#020202] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        
        {/* LOGO */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl">
            <span className="text-3xl font-black text-white">🔐</span>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Restablecer Contraseña
          </h1>
          <p className="text-cyan-400 text-sm mt-2 font-bold">Crea una nueva contraseña segura</p>
        </div>

        {/* TARJETA */}
        <div className="bg-[#050505]/80 backdrop-blur border border-white/10 rounded-3xl p-8 shadow-2xl">
          
          {success ? (
            // ÉXITO
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full">
                <Check className="text-green-400" size={32} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase mb-2">¡Éxito!</h2>
                <p className="text-zinc-400 text-sm">
                  Tu contraseña ha sido restablecida. Redirigiendo al login...
                </p>
              </div>
            </div>
          ) : (
            // FORMULARIO
            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-cyan-400 uppercase block mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-cyan-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder:text-zinc-500 text-sm focus:border-cyan-400 focus:outline-none transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-3.5 text-zinc-500 hover:text-cyan-400 transition disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-cyan-400 uppercase block mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-cyan-400" size={20} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repetir contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder:text-zinc-500 text-sm focus:border-cyan-400 focus:outline-none transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    disabled={loading}
                    className="absolute right-3 top-3.5 text-zinc-500 hover:text-cyan-400 transition disabled:opacity-50"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 text-black py-3 rounded-xl font-black uppercase text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Restableciendo...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Restablecer Contraseña
                  </>
                )}
              </button>

              <p className="text-center text-zinc-400 text-xs">
                El enlace de recuperación caduca en 24 horas
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}