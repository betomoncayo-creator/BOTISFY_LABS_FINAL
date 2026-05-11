'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, ShieldCheck, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Supabase pone el token en el hash (#access_token=...)
    // El cliente de Supabase lo procesa automáticamente
    const supabase = createClient()

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true)
        setChecking(false)
      } else if (session) {
        setValidSession(true)
        setChecking(false)
      } else {
        setChecking(false)
      }
    })

    // Timeout por si no dispara el evento
    setTimeout(() => setChecking(false), 2000)
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password.trim() || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#000000]">

      {/* FONDO */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[120%] rounded-full bg-cyan-500/20 blur-[180px] animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[120%] h-[120%] rounded-full bg-purple-600/15 blur-[180px] animate-[pulse_6s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.04] pointer-events-none" />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center w-full px-6">
        <div className="w-full max-w-[440px]">
          <div className="flex flex-col items-center space-y-10">

            {/* LOGO */}
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400/30 blur-3xl rounded-full animate-pulse" />
              <Image
                src="/logo-botisfy.png"
                alt="Botisfy Labs"
                width={140}
                height={140}
                className="relative drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]"
              />
            </div>

            <div className="text-center">
              <h1 className="text-white text-5xl font-black italic uppercase tracking-tighter leading-none">
                Nueva Contraseña
              </h1>
            </div>

            <div className="w-full bg-white/[0.02] border border-white/10 p-10 rounded-[3.5rem] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">

              {checking ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <Loader2 className="animate-spin text-cyan-400" size={32} />
                  <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">Verificando token...</p>
                </div>

              ) : success ? (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <CheckCircle className="text-cyan-400" size={48} />
                  <p className="text-white font-black uppercase text-sm">¡Contraseña actualizada!</p>
                  <p className="text-zinc-400 text-xs">Redirigiendo al login...</p>
                </div>

              ) : !validSession ? (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <p className="text-red-400 text-[10px] font-black uppercase bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20">
                    Link inválido o expirado. Solicita uno nuevo.
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-cyan-400 hover:text-cyan-300 text-xs font-black uppercase transition-all"
                  >
                    Volver al login
                  </button>
                </div>

              ) : (
                <form onSubmit={handleReset} className="space-y-5">

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nueva contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#E8F0FE] text-zinc-900 p-5 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirmar contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#E8F0FE] text-zinc-900 p-5 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {error && (
                    <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00E5FF] hover:bg-[#00d1e6] disabled:bg-[#00E5FF]/50 text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_0_40px_rgba(0,229,255,0.3)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><Loader2 className="animate-spin" size={18} /> ACTUALIZANDO...</>
                    ) : (
                      <>Guardar Contraseña <ShieldCheck size={18} /></>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 text-center py-4 border-t border-white/5">
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
          Hecho con ❤️ por <span className="text-[#00E5FF]">Botisfy Labs</span>
        </p>
      </footer>
    </div>
  )
}