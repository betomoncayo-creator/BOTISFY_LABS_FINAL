'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, Check, Lock } from 'lucide-react'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const router = useRouter()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    // Verificar que hay un token en la URL
    const verifyToken = async () => {
      try {
        const supabase = createClient()
        
        // Obtener la sesión actual (debería existir si el email link funcionó)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          // Verificar si hay token en hash (formato: #access_token=...)
          const hash = window.location.hash
          if (!hash || !hash.includes('access_token')) {
            setTokenValid(false)
          } else {
            setTokenValid(true)
          }
        }
      } catch (err) {
        console.error('Error verificando token:', err)
      } finally {
        setPageLoading(false)
      }
    }

    verifyToken()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
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
      
      // Cerrar sesión después de cambiar contraseña
      await supabase.auth.signOut()
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Error al restablecer contraseña')
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#000000]">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[120%] rounded-full bg-cyan-500/20 blur-[180px] animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[120%] h-[120%] rounded-full bg-purple-600/15 blur-[180px] animate-[pulse_6s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
        </div>
        <div className="relative z-10">
          <Loader2 className="animate-spin text-cyan-400" size={40} />
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#000000] p-4">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[120%] rounded-full bg-cyan-500/20 blur-[180px] animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[120%] h-[120%] rounded-full bg-purple-600/15 blur-[180px] animate-[pulse_6s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.04] pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center justify-center flex-1">
          <div className="text-center">
            <h1 className="text-white text-3xl md:text-4xl font-black uppercase mb-6 tracking-tighter">Enlace Inválido</h1>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">El enlace de recuperación ha expirado o no es válido. Por favor, solicita uno nuevo.</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-[#00E5FF] hover:bg-[#00d1e6] text-black py-3 px-8 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all"
            >
              Volver al Login
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="relative z-10 text-center pt-6 pb-4">
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
            Hecho con ❤️ por <span className="text-[#00E5FF]">Botisfy Labs</span>
          </p>
        </footer>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#000000] p-4">
      
      {/* FONDO */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[120%] rounded-full bg-cyan-500/20 blur-[180px] animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[120%] h-[120%] rounded-full bg-purple-600/15 blur-[180px] animate-[pulse_6s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.04] pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] flex flex-col flex-1 justify-center">
        <div className="flex flex-col items-center space-y-8 md:space-y-10">
          
          {/* LOGO */}
          <div className="relative group">
            <div className="absolute inset-0 bg-cyan-400/30 blur-3xl rounded-full animate-pulse" />
            <Image 
              src="/logo-botisfy.png" 
              alt="Botisfy Labs" 
              width={120} 
              height={120}
              className="relative drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]"
            />
          </div>

          {/* TÍTULO */}
          <div className="text-center">
            <h1 className="text-white text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">
              Nueva Contraseña
            </h1>
          </div>

          {/* FORMULARIO */}
          <div className="w-full bg-white/[0.02] border border-white/10 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
            
            {success ? (
              // ÉXITO
              <div className="flex flex-col items-center space-y-6 text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full">
                  <Check className="text-green-400" size={40} />
                </div>
                <div>
                  <h2 className="text-white text-2xl font-black uppercase mb-2">¡Éxito!</h2>
                  <p className="text-zinc-400 text-sm">
                    Tu contraseña ha sido restablecida correctamente.
                  </p>
                  <p className="text-zinc-500 text-xs mt-2">Redirigiendo al login...</p>
                </div>
              </div>
            ) : (
              // FORMULARIO
              <form onSubmit={handleResetPassword} className="space-y-5">
                
                {error && (
                  <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20">
                    {error}
                  </p>
                )}

                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#E8F0FE] text-zinc-900 p-4 md:p-5 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all placeholder:text-zinc-400"
                    required
                    disabled={loading}
                  />
                  
                  <input
                    type="password"
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#E8F0FE] text-zinc-900 p-4 md:p-5 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00E5FF] hover:bg-[#00d1e6] text-black py-4 md:py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_0_40px_rgba(0,229,255,0.3)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>Restablecer Contraseña <Lock size={18} /></>
                  )}
                </button>

                <p className="text-zinc-500 text-[10px] text-center uppercase font-bold">
                  Mínimo 6 caracteres
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER - SIEMPRE VISIBLE */}
      <footer className="relative z-10 text-center pt-6 pb-4 w-full">
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
          Hecho con ❤️ por <span className="text-[#00E5FF]">Botisfy Labs</span>
        </p>
      </footer>
    </div>
  )
}