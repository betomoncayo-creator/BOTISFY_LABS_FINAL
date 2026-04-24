'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation' // 1. IMPORTAMOS EL ENRUTADOR

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const supabase = createClient()
  const router = useRouter() // 2. INICIALIZAMOS EL ENRUTADOR

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
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
      setTimeout(() => {
        // 3. LA MAGIA: Navegación suave sin destruir la memoria
        router.push('/dashboard')
      }, 400)
    }
  }

  // PANTALLA DE CARGA
  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00E5FF]/5 blur-[150px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center">
        <img 
          src="/logo-botisfy.png" 
          alt="Botisfy Logo" 
          className="w-24 h-24 mb-8 animate-pulse object-contain drop-shadow-[0_0_25px_rgba(0,229,255,0.4)]" 
        />
        <h2 className="text-white text-2xl font-black tracking-[0.3em] uppercase italic mb-2">Conectando</h2>
        <p className="text-[#00E5FF] text-[10px] font-bold uppercase tracking-[0.5em] animate-pulse">Sincronizando credenciales...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00E5FF]/5 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-[400px] bg-[#0a0a0a] border border-white/10 p-10 md:p-14 rounded-[3.5rem] shadow-2xl z-10 text-center relative">
        
        <div className="mb-10 flex justify-center">
          <img 
            src="/logo-botisfy.png" 
            alt="Botisfy Labs" 
            className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(0,229,255,0.2)]" 
          />
        </div>

        <div className="space-y-1 mb-10">
          <h1 className="text-white text-2xl font-black tracking-tighter uppercase italic">
            Botisfy <span className="text-[#00E5FF]">Labs</span>
          </h1>
          <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-[0.3em]">Acceso a Red Corporativa</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            required 
            placeholder="EMAIL@BOTISFY.COM" 
            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm text-white outline-none focus:border-[#00E5FF] font-bold placeholder:text-zinc-700" 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            required 
            placeholder="CONTRASEÑA" 
            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm text-white outline-none focus:border-[#00E5FF] font-bold placeholder:text-zinc-700" 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button 
            type="submit"
            className="w-full bg-[#00E5FF] text-black font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.4em] hover:scale-[1.02] transition-all shadow-lg shadow-[#00E5FF]/20"
          >
            INICIAR CONEXIÓN
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-2">
           <p className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em] flex items-center gap-1.5 italic">
             Hecho con <span className="text-red-500 animate-pulse text-xs">❤️</span> por Botisfy Labs
           </p>
           <p className="text-[6px] text-zinc-700 font-bold uppercase tracking-[0.4em] opacity-40">
             Botisfy Labs S.A.S. • Quito, Ecuador
           </p>
        </div>
      </div>
    </div>
  )
}