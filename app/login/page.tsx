'use client'
import { useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, ShieldCheck, Eye, EyeOff, ChevronLeft } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      router.push('/dashboard')
    } catch (err: any) {
      setLoading(false)
      setError(err.message || 'Error al intentar conectar con el nodo.')
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (!email) throw new Error('Ingresa tu email')
      
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      if (error) throw error
      
      setSuccess('✅ Email de recuperación enviado. Revisa tu bandeja.')
      setEmail('')
      
      setTimeout(() => {
        setMode('login')
        setSuccess(null)
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Error al enviar email')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#000000]">
      
      {/* 🌌 FONDO DINÁMICO */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[120%] rounded-full bg-cyan-500/20 blur-[180px] animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[120%] h-[120%] rounded-full bg-purple-600/15 blur-[180px] animate-[pulse_6s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.04] pointer-events-none" />
      </div>

      {/* CONTENIDO PRINCIPAL - CENTRADO */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full px-6">
        <div className="w-full max-w-[440px]">
          <div className="flex flex-col items-center space-y-10">
            
            {/* LOGO CON GLOW PERSISTENTE */}
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-400/30 blur-3xl rounded-full animate-pulse" />
              <Image 
                src="/logo-botisfy.png" 
                alt="Botisfy Labs" 
                width={140} 
                height={140} 
                className="relative drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]"
              />
            </div>

            {/* TÍTULO PRINCIPAL */}
            <div className="text-center">
              <h1 className="text-white text-5xl font-black italic uppercase tracking-tighter leading-none">
                {mode === 'login' ? 'Portal de Acceso' : 'Recuperar Acceso'}
              </h1>
            </div>

            {/* FORMULARIO GLASSMORPHIC */}
            <div className="w-full bg-white/[0.02] border border-white/10 p-10 rounded-[3.5rem] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
              
              {/* Botón volver (solo en forgot) */}
              {mode === 'forgot' && (
                <button
                  onClick={() => {
                    setMode('login')
                    setError(null)
                    setSuccess(null)
                    setEmail('')
                    setPassword('')
                  }}
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase mb-6 transition-all"
                >
                  <ChevronLeft size={16} /> Volver al login
                </button>
              )}

              {mode === 'login' ? (
                // FORMULARIO LOGIN
                <form onSubmit={handleLogin} className="space-y-5">
                  
                  <div className="space-y-4">
                    <input
                      type="email"
                      placeholder="freddy.moncayo@hotmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#E8F0FE] text-zinc-900 p-5 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all placeholder:text-zinc-400"
                      required
                      disabled={loading}
                    />
                    
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#E8F0FE] text-zinc-900 p-5 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00E5FF] hover:bg-[#00d1e6] text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_0_40px_rgba(0,229,255,0.3)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>Iniciar Conexión <ShieldCheck size={18} /></>
                    )}
                  </button>

                  {/* Link Forgot Password */}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot')
                      setPassword('')
                      setError(null)
                    }}
                    className="w-full text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase transition-all pt-2"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </form>
              ) : (
                // FORMULARIO FORGOT PASSWORD
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  
                  <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
                    Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                  </p>

                  <input
                    type="email"
                    placeholder="freddy.moncayo@hotmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#E8F0FE] text-zinc-900 p-5 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all placeholder:text-zinc-400"
                    required
                    disabled={loading}
                  />

                  {error && (
                    <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20">
                      {error}
                    </p>
                  )}

                  {success && (
                    <p className="text-green-400 text-[10px] font-black uppercase text-center bg-green-500/10 py-3 rounded-xl border border-green-500/20">
                      {success}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00E5FF] hover:bg-[#00d1e6] text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_0_40px_rgba(0,229,255,0.3)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>Enviar Enlace <ShieldCheck size={18} /></>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER - FIJO AL FINAL */}
      <footer className="relative z-10 text-center py-4 border-t border-white/5">
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
          Hecho con ❤️ por <span className="text-[#00E5FF]">Botisfy Labs</span>
        </p>
      </footer>
    </div>
  )
}