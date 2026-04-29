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
    // Protocolo de seguridad para evitar ráfagas de peticiones
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

        setProfile(profileData || { role: 'estudiante' })
      } catch (err) {
        router.replace('/login')
      } finally {
        // Mantenemos el loading un momento extra para que la transición no sea brusca
        setTimeout(() => setLoadingProfile(false), 800)
      }
    }

    checkSession()

    // Sincronización de salida de seguridad
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login'
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  // ⚡ PANTALLA DE CARGA OFICIAL "BOTISFY LABS" (RESTAURADA)
  if (loadingProfile) {
    return (
      <div className="h-screen bg-[#020202] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Resplandor Neón de fondo */}
        <div className="absolute w-[500px] h-[500px] bg-[#00E5FF]/10 blur-[120px] rounded-full animate-pulse" />
        
        <div className="relative z-10 flex flex-col items-center">
          <img 
            src="/logo-botisfy.png" 
            alt="Botisfy Labs" 
            className="w-24 h-24 md:w-32 md:h-32 animate-pulse mb-10 drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]" 
          />
          
          <div className="space-y-4 text-center">
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-bounce" />
            </div>
            <p className="text-[#00E5FF] text-[10px] font-black uppercase tracking-[1em] ml-[1em]">
              Sincronizando Nodo
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ profile, loadingProfile }}>
      <div className="flex h-screen bg-[#020202] text-white overflow-hidden relative">
        
        {/* SIDEBAR RESPONSIVO[cite: 1] */}
        <div className={`
          fixed inset-y-0 left-0 z-[100] transform transition-transform duration-300 lg:relative lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          w-72 bg-[#020202] border-r border-white/5
        `}>
          <Sidebar />
        </div>

        {/* CONTENEDOR PRINCIPAL[cite: 1] */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* HEADER MÓVIL CON BRANDING OFICIAL[cite: 1] */}
          <header className="lg:hidden flex items-center justify-between p-6 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md z-[50]">
            <div className="flex items-center gap-4">
              <img src="/logo-botisfy.png" alt="Botisfy Labs" className="h-8 w-auto" />
              <p className="text-white text-[11px] font-black uppercase tracking-widest italic leading-none">
                Botisfy Labs
              </p>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-[#00E5FF] active:scale-90 transition-transform"
            >
              <Menu size={28} />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 relative">
            {/* Resplandor ambiental suave en el fondo[cite: 1] */}
            <div className="absolute top-0 right-0 w-full h-64 bg-[#00E5FF]/[0.02] blur-[120px] pointer-events-none" />
            
            <div className="max-w-[1400px] mx-auto w-full">
              {children}
            </div>
          </main>
        </div>

        {/* OVERLAY TÁCTIL PARA MÓVIL[cite: 1] */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in duration-300" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

      </div>
    </UserContext.Provider>
  )
}