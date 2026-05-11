'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, ShieldCheck, Eye, EyeOff, CheckCircle, AlertCircle, Bug } from 'lucide-react'

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
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const router = useRouter()

  const addDebug = (msg: string) => {
    const ts = new Date().toLocaleTimeString('es-EC', { hour12: false })
    setDebugInfo(prev => [...prev, `[${ts}] ${msg}`])
    console.log('[BOTISFY-DEBUG]', msg)
  }

  useEffect(() => {
    const supabase = createClient()

    addDebug('Página cargada')
    addDebug(`URL: ${window.location.href}`)
    addDebug(`Hash: ${window.location.hash || '(vacío)'}`)
    addDebug(`Search: ${window.location.search || '(vacío)'}`)

    // ── Paso 1: verificar si ya hay sesión activa (flujo PKCE server-side) ──
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) addDebug(`getSession error: ${sessionError.message}`)
      
      if (session) {
        addDebug(`✅ Sesión activa encontrada: ${session.user.email}`)
        setValidSession(true)
        setChecking(false)
        return
      }
      addDebug('No hay sesión activa aún, escuchando eventos...')
    })

    // ── Paso 2: escuchar eventos de auth (flujo hash / PASSWORD_RECOVERY) ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addDebug(`Evento auth: ${event} | sesión: ${session ? session.user.email : 'null'}`)

      if (event === 'PASSWORD_RECOVERY') {
        addDebug('✅ PASSWORD_RECOVERY recibido - sesión válida para reset')
        setValidSession(true)
        setChecking(false)
        return
      }

      if (event === 'SIGNED_IN' && session) {
        addDebug('✅ SIGNED_IN recibido - sesión válida')
        setValidSession(true)
        setChecking(false)
        return
      }

      if (event === 'INITIAL_SESSION') {
        if (session) {
          addDebug('✅ INITIAL_SESSION con sesión - válido')
          setValidSession(true)
        } else {
          addDebug('⚠️ INITIAL_SESSION sin sesión')
        }
        setChecking(false)
      }

      if (event === 'SIGNED_OUT') {
        addDebug('❌ SIGNED_OUT - sin sesión')
        setValidSession(false)
        setChecking(false)
      }
    })

    // ── Paso 3: timeout de seguridad ──
    const timer = setTimeout(() => {
      addDebug('⏱️ Timeout 5s alcanzado - finalizando verificación')
      setChecking(false)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
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
    addDebug('Intentando actualizar contraseña...')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      addDebug('✅ Contraseña actualizada exitosamente')
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      const msg = err.message || 'Error al actualizar la contraseña'
      addDebug(`❌ Error updateUser: ${msg}`)
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#000000]">

      {/* FONDO */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[120%] rounded-full bg-cyan-500/20 blur-[180px] animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[120%] h-[120%] rounded-full bg-purple-600/15 blur-[180px] animate-[pulse_6s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center w-full px-6 py-10">
        <div className="w-full max-w-[480px] space-y-6">

          {/* LOGO + TÍTULO */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400/30 blur-3xl rounded-full animate-pulse" />
              <Image
                src="/logo-botisfy.png"
                alt="Botisfy Labs"
                width={110}
                height={110}
                className="relative drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]"
              />
            </div>
            <h1 className="text-white text-4xl font-black italic uppercase tracking-tighter">
              Nueva Contraseña
            </h1>
          </div>

          {/* CARD PRINCIPAL */}
          <div className="w-full bg-white/[0.02] border border-white/10 p-8 rounded-[3rem] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
            {checking ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 className="animate-spin text-cyan-400" size={32} />
                <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">Verificando sesión...</p>
              </div>

            ) : success ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <CheckCircle className="text-cyan-400" size={48} />
                <p className="text-white font-black uppercase text-sm">¡Contraseña actualizada!</p>
                <p className="text-zinc-400 text-xs">Redirigiendo al login...</p>
              </div>

            ) : !validSession ? (
              <div className="flex flex-col items-center gap-6 py-4 text-center">
                <AlertCircle className="text-red-400" size={40} />
                <p className="text-red-400 text-[10px] font-black uppercase bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20">
                  Link inválido o expirado. Solicita uno nuevo desde el login.
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
                    placeholder="Nueva contraseña (mín. 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#E8F0FE] text-zinc-900 p-5 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                    disabled={loading}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition">
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
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && (
                  <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-[#00E5FF] hover:bg-[#00d1e6] disabled:bg-[#00E5FF]/50 text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_0_40px_rgba(0,229,255,0.3)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 disabled:opacity-75 disabled:cursor-not-allowed">
                  {loading ? (
                    <><Loader2 className="animate-spin" size={18} /> ACTUALIZANDO...</>
                  ) : (
                    <>Guardar Contraseña <ShieldCheck size={18} /></>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* DEBUG PANEL — TEMPORAL, eliminar cuando funcione */}
          <div className="w-full bg-black/80 border border-cyan-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bug size={14} className="text-cyan-400" />
              <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">Debug Panel (temporal)</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {debugInfo.length === 0 ? (
                <p className="text-zinc-600 text-[10px] font-mono">Esperando eventos...</p>
              ) : (
                debugInfo.map((line, i) => (
                  <p key={i} className="text-zinc-400 text-[10px] font-mono leading-relaxed">{line}</p>
                ))
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
