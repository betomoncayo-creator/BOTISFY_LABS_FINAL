'use client'
import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Menu, X, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { UserContext } from '@/lib/context' 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  // Mantenemos una sola instancia de Supabase para evitar colisiones de memoria
  const [supabase] = useState(() => createClient())

  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [debugError, setDebugError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true)
    console.log("🔍 [DIAGNÓSTICO] Iniciando validación de usuario...");
    
    try {
      // Intentamos obtener el usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error("🚨 [ERROR AUTH] Supabase rechazó la petición:", authError.message)
        setDebugError(authError.message)
      }

      if (user) {
        console.log("✅ [USUARIO DETECTADO] ID:", user.id);
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        
        if (profileError) {
          console.error("🚨 [ERROR PERFIL] No se pudo leer la tabla profiles:", profileError.message)
        }

        setProfile(data || { role: 'estudiante', full_name: 'Usuario' })
        setDebugError(null)
      } else {
        // --- LA TRAMPA DE DIAGNÓSTICO ---
        console.error("⚠️ [PÁNICO] El guardia no encontró sesión activa ni cookies.");
        setDebugError("Sesión no encontrada en este navegador/iframe.");
        
        // COMENTADO PARA QUE NO TE EXPULSE:
        // router.replace('/login') 
      }
    } catch (err: any) {
      console.error("💥 [CRASH] Error inesperado en el layout:", err.message);
      setDebugError(err.message);
    } finally {
      setLoadingProfile(false)
    }
  }, [supabase])

  useEffect(() => { 
    fetchProfile() 
  }, [fetchProfile])

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    window.location.href = '/login'
  }

  return (
    <UserContext.Provider value={{ profile, loadingProfile, logout }}>
      <div className="flex h-screen bg-black overflow-hidden relative w-full">
        
        {/* BANNER DE DIAGNÓSTICO (Solo aparece si el guardia te iba a expulsar) */}
        {debugError && (
          <div className="absolute top-4 right-4 z-[100] bg-red-600/90 text-white p-4 rounded-2xl flex items-center gap-3 animate-bounce shadow-2xl border border-red-400">
            <AlertCircle size={20} />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest">Error de Sesión Detectado</p>
              <p className="text-[8px] font-bold opacity-80">{debugError}</p>
            </div>
          </div>
        )}

        {/* SIDEBAR */}
        <div className={`fixed md:relative top-0 left-0 h-full z-50 transform transition-transform duration-500 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto w-full h-full pt-28 md:pt-8 p-4 md:p-8">
          {loadingProfile ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-12 h-12 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Verificando Credenciales...</p>
            </div>
          ) : (
            children
          )}
        </main>

      </div>
    </UserContext.Provider>
  )
}