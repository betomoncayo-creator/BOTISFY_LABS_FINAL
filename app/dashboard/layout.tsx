'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { UserContext } from '@/lib/context'
import Sidebar from '@/components/Sidebar'
import { Menu } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          router.replace('/login')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        // Si no hay perfil, asignamos uno genérico para no romper el renderizado
        setProfile(profileData || { full_name: 'Freddy', role: 'admin' })
      } catch (err) {
        console.error("Error en nodo empresa:", err)
      } finally {
        // Delay para el logo bonito que recuperamos
        setTimeout(() => setLoadingProfile(false), 800)
      }
    }

    checkSession()
  }, [supabase, router])

  // PANTALLA DE CARGA OFICIAL (Logo Pulsante)
  if (loadingProfile) {
    return (
      <div className="h-screen bg-[#020202] flex flex-col items-center justify-center">
        <div className="absolute w-80 h-80 bg-[#00E5FF]/10 blur-[120px] rounded-full animate-pulse" />
        <img src="/logo-botisfy.png" alt="Botisfy" className="w-24 h-24 animate-pulse relative z-10" />
        <p className="text-[#00E5FF] text-[10px] font-black uppercase tracking-[1em] mt-8 animate-pulse">Sincronizando...</p>
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ profile, loadingProfile }}>
      <div className="flex h-screen bg-[#020202] text-white overflow-hidden">
        
        {/* SIDEBAR: Con ancho fijo forzado para evitar el estiramiento de image_c13345.png */}
        <div className={`
          fixed inset-y-0 left-0 z-[100] transform transition-transform duration-300 lg:relative lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          w-72 min-w-[288px] max-w-[288px] bg-[#050505] border-r border-white/5
        `}>
          <Sidebar />
        </div>

        {/* CONTENEDOR DE CONTENIDO */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          
          {/* HEADER MÓVIL (Solo LG hidden) */}
          <header className="lg:hidden flex items-center justify-between p-6 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
            <img src="/logo-botisfy.png" alt="Botisfy" className="h-8 w-auto" />
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#00E5FF]"><Menu size={28} /></button>
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
            <div className="max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}
      </div>
    </UserContext.Provider>
  )
}