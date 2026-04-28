'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      })
      
      if (error) {
        alert('Error: ' + error.message)
        return
      }

      if (data?.session) {
        router.replace('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00E5FF]/5 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-[400px] bg-[#0a0a0a] border border-white/10 p-10 md:p-14 rounded-[3.5rem] shadow-2xl z-10 text-center relative">
        <div className="mb-10 flex justify-center">
          <img src="/logo-botisfy.png" alt="Botisfy Labs" className="w-24 h-24 object-contain" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            required 
            placeholder="EMAIL@BOTISFY.COM" 
            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm text-white outline-none focus:border-[#00E5FF] font-bold" 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            required 
            placeholder="CONTRASEÑA" 
            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm text-white outline-none focus:border-[#00E5FF] font-bold" 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#00E5FF] text-black font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.4em] hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? 'CONECTANDO...' : 'INICIAR CONEXIÓN'}
          </button>
        </form>
      </div>
    </div>
  )
}