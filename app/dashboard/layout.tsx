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

  // Función de recuperación de perfil (con blindaje de error)
  const loadProfile = useCallback(async (userId: string) => {
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
      // Pase lo que pase, liberamos la carga
      setLoadingProfile(false)
    }
  }, [supabase])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // 🛡️ REGLA DE ORO: Usamos onAuthStateChange para TODO (Initial Session + Cambios)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event)

      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        // Si no hay sesión tras el chequeo inicial o logout, al login
        setLoadingProfile(false)
        router.replace('/login')
      }
    })

    // Timeout de emergencia (3 segundos es suficiente para un ingeniero)
    const safetyTimer = setTimeout(() => {
      setLoadingProfile(false)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(safetyTimer)
    }
  }, [supabase, router, loadProfile])

  // Logout ultra-rápido sin bloqueos
  const logout = async () => {
    setLoadingProfile(true)
    await supabase.auth.signOut()
    window.location.href = '/login' // Limpieza total de memoria y estado
  }

  // PANTALLA DE CARGA (DISEÑO MINIMALISTA BOTISFY)
  if (loadingProfile) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center w-full relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00E5FF]/5 blur-[150px] pointer-events-none" />
        <div className="flex flex-col items-center gap-12 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00E5FF]/20 blur-3xl rounded-full scale-110 animate-pulse" />
            <img 
              src="/logo-botisfy.png" 
              alt="Botisfy Labs" 
              className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10 animate-pulse duration-[2000ms]"
            />
          </div>
          <div className="space-y-4 text-center">
            <p className="text-white text-[12px] md:text-[14px] font-black uppercase tracking-[1em] ml-[1em] animate-pulse">
              cargando...
            </p>
            <div className="w-48 h-[1px] bg-white/10 mx-auto overflow-hidden rounded-full">
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
        {/* Botón Hamburguesa Móvil */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed top-6 right-6 z-[60] p-4 bg-[#00E5FF] text-black rounded-2xl shadow-xl shadow-[#00E5FF]/20 active:scale-95 transition-all"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar />
        </div>

        {/* Overlay Móvil */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14 w-full pt-24 lg:pt-14 selection:bg-[#00E5FF] selection:text-black">
          {children}
        </main>
      </div>
    </UserContext.Provider>
  )
}