'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Zap } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    
    setLoading(true) 
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    })
    
    if (error) {
      alert('Error de acceso: ' + error.message)
      setLoading(false)
      return
    }

    if (data?.session) {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* FONDOS DINÁMICOS (LUCES CYBERPUNK) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#00E5FF]/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-500/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-in zoom-in-95 duration-700">
        <div className="bg-[#050505]/80 backdrop-blur-2xl border border-white/10 p-10 md:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
          
          {/* LÍNEA DE BRILLO SUPERIOR */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-transparent" />

          {/* CABECERA Y LOGO */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-28 h-28 mb-6 relative">
              <div className="absolute inset-0 bg-[#00E5FF]/20 blur-xl rounded-full group-hover:bg-[#00E5FF]/30 transition-colors duration-500" />
              <img src="/logo-botisfy.png" alt="Botisfy Labs" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
            </div>
            
            <p className="text-[#00E5FF] text-[9px] font-black uppercase tracking-[0.5em] mb-2 flex items-center gap-1.5">
              <Zap size={12} fill="currentColor" /> Portal de Acceso
            </p>
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
              Botisfy <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-purple-500">Labs</span>
            </h1>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="email" 
                required 
                placeholder="CORREO ELECTRÓNICO" 
                className="w-full bg-white/5 border border-white/10 pl-14 pr-5 py-5 rounded-2xl text-[11px] text-white outline-none focus:border-[#00E5FF] focus:bg-white/10 font-bold placeholder:text-zinc-600 uppercase tracking-widest transition-all" 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            
            <div className="relative">
              <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="password" 
                required 
                placeholder="CONTRASEÑA" 
                className="w-full bg-white/5 border border-white/10 pl-14 pr-5 py-5 rounded-2xl text-[11px] text-white outline-none focus:border-[#00E5FF] focus:bg-white/10 font-bold placeholder:text-zinc-600 uppercase tracking-widest transition-all" 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00E5FF] to-cyan-400 text-black font-black py-5 mt-4 rounded-2xl text-[11px] uppercase tracking-[0.4em] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Sincronizando...
                </>
              ) : (
                'INICIAR CONEXIÓN'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}