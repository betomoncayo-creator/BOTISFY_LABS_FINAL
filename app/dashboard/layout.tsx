'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'
import { UserContext } from '@/lib/context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const checkUser = useCallback(async () => {
    setLoadingProfile(true)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      
      setProfile(data || { role: 'estudiante', full_name: session.user.email?.split('@')[0] })
      setLoadingProfile(false)
    } else {
      router.replace('/login')
    }
  }, [supabase, router])

  useEffect(() => { checkUser() }, [checkUser])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // ==========================================
  // PANTALLA DE CARGA RESTAURADA (BOTISFY LABS)
  // ==========================================
  if (loadingProfile) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden w-full">
        {/* Efecto de luz de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Logo animado con un suave pulso */}
          <div className="relative">
             <div className="absolute inset-0 bg-cyan-500/20 blur-[20px] rounded-full animate-pulse" />
             <img src="/logo-botisfy.png" alt="Botisfy Labs" className="w-28 h-28 object-contain relative z-10 animate-pulse" />
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
              Iniciando Sistema...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ profile, loadingProfile, logout }}>
      <div className="flex h-screen bg-black overflow-hidden relative w-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </UserContext.Provider>
  )
}