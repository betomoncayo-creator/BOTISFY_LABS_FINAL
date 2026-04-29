'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'
import { UserContext } from '@/lib/context'
import { Menu, X } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const initialized = useRef(false)

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) throw error
      setProfile(data || { role: 'estudiante' })
    } catch (err) {
      console.error("Error Perfil:", err)
    } finally {
      setLoadingProfile(false)
    }
  }, [supabase])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const syncAuth = async () => {
      try {
        // 1. Chequeo manual inmediato para romper el bloqueo inicial
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          await loadUserData(session.user.id)
        } else {
          setLoadingProfile(false)
          router.replace('/login')
        }
      } catch (e) {
        setLoadingProfile(false)
        router.replace('/login')
      }
    }

    syncAuth()

    // 2. Listener para cambios de estado futuros
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setLoadingProfile(false)
        router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router, loadUserData])

  const logout = async () => {
    setLoadingProfile(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loadingProfile) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center w-full relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#00E5FF]/5 blur-[120px] pointer-events-none" />
        <div className="flex flex-col items-center gap-10 relative z-10">
          <img src="/logo-botisfy.png" alt="Botisfy Labs" className="w-48 h-48 object-contain animate-pulse duration-[2000ms]" />
          <div className="space-y-3 text-center">
            <p className="text-white text-[10px] font-black uppercase tracking-[1em] ml-[1em] animate-pulse italic">
              Sincronizando...
            </p>
            <div className="w-40 h-[1px] bg-white/10 mx-auto overflow-hidden rounded-full">
              <div className="w-full h-full bg-[#00E5FF] -translate-x-full animate-progress" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ profile, loadingProfile, logout }}>
      <div className="flex h-screen bg-black overflow-hidden relative w-full font-sans">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden fixed top-6 right-6 z-[60] p-4 bg-[#00E5FF] text-black rounded-2xl shadow-xl shadow-[#00E5FF]/20 active:scale-95 transition-all">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-500 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </div>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14 w-full pt-24 lg:pt-14 selection:bg-[#00E5FF] selection:text-black">
          {children}
        </main>
      </div>
    </UserContext.Provider>
  )
}