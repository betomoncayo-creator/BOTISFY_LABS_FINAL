'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message.includes('rate limit') 
          ? 'SEGURIDAD: Límite alcanzado.' 
          : 'ACCESO DENEGADO: Credenciales incorrectas')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('ERROR DE NODO')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Resplandores de marca optimizados */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00E5FF]/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#A855F7]/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center">
        
        {/* SECCIÓN LOGO: Compacta para evitar scroll */}
        <div className="flex flex-col items-center mb-6 w-full drop-shadow-[0_0_20px_rgba(0,229,255,0.2)]">
          <img 
            src="/logo-botisfy.png" 
            alt="Botisfy Labs" 
            className="w-28 h-28 md:w-36 md:h-36 object-contain mb-3 animate-pulse duration-[3000ms]" 
          />
          <div className="text-center">
            <h1 className="text-white text-xl md:text-2xl font-black italic tracking-tighter uppercase leading-none">
              Portal de Acceso
            </h1>
            <p className="text-[#00E5FF] text-[7px] md:text-[8px] font-bold uppercase tracking-[0.4em] mt-2 opacity-60">
              Sincronizando Nodo de Seguridad
            </p>
          </div>
        </div>

        {/* TARJETA DE LOGIN */}
        <div className="w-full bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] shadow-2xl relative mb-6">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/40 to-transparent" />

          <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
            <div className="space-y-3">
              <input
                type="email"
                placeholder="ID de Usuario"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 md:py-4 text-white text-sm focus:border-[#00E5FF]/50 transition-all outline-none placeholder:text-zinc-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Código de Seguridad"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 md:py-4 text-white text-sm focus:border-[#00E5FF]/50 transition-all outline-none placeholder:text-zinc-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <p className="text-red-500 text-[8px] font-black uppercase text-center tracking-widest bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 md:py-5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all relative group overflow-hidden
                ${loading 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-[#00E5FF] text-black hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:scale-[1.01] active:scale-95'}
              `}
            >
              <span className="relative z-10 font-black">
                {loading ? 'Procesando...' : 'Iniciar Conexión'}
              </span>
            </button>
          </form>
        </div>

        {/* PIE DE PÁGINA: Firma y Legales */}
        <div className="flex flex-col items-center space-y-3 opacity-40">
          <p className="text-white text-[9px] md:text-[10px] font-medium tracking-[0.2em] flex items-center gap-1">
            Hecho con <span className="text-red-500 animate-pulse text-[12px]">❤️</span> por <span className="text-[#00E5FF] font-black">Botisfy Labs</span>
          </p>
        </div>
      </div>
    </div>
  )
}