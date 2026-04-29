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
        // Manejo amigable de límites de peticiones o errores de credenciales
        setError(authError.message.includes('rate limit') 
          ? 'Demasiados intentos. Espera 60 segundos.' 
          : 'Credenciales de acceso no válidas')
        setLoading(false)
        return
      }

      // Redirección inmediata tras éxito
      router.push('/dashboard')
    } catch (err) {
      setError('Error de conexión con el nodo de seguridad')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#050505] border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00E5FF]/20 to-transparent" />
        
        <div className="flex flex-col items-center mb-10">
          <img src="/logo-botisfy.png" alt="Botisfy Labs" className="w-20 h-20 mb-6 object-contain" />
          <h1 className="text-white text-2xl font-black italic tracking-tighter uppercase">Portal de Acceso</h1>
          <p className="text-[#00E5FF] text-[8px] font-bold uppercase tracking-[0.4em] mt-2 opacity-50 text-center leading-relaxed italic">
            Sincronizando Nodo de Seguridad
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            placeholder="Credencial de Usuario"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-[#00E5FF]/50 transition-all outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Código de Seguridad"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-[#00E5FF]/50 transition-all outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center tracking-widest animate-pulse">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all
              ${loading 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-[#00E5FF] text-black shadow-lg shadow-[#00E5FF]/20 hover:scale-[1.02] active:scale-95'}
            `}
          >
            {loading ? 'Validando...' : 'Iniciar Conexión'}
          </button>
        </form>
      </div>
    </div>
  )
}