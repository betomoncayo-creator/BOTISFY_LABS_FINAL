'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'
import { UserContext } from '@/lib/context'
import { Menu, X, Zap } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Estado para el móvil

  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      setProfile(data || { role: 'estudiante', full_name: session.user.email?.split('@')[0] })
      setLoadingProfile(false)
    } else {
      router.replace('/login')
    }
  }, [supabase, router])

  useEffect(() => { checkUser() }, [checkUser])

  // Cerrar sidebar automáticamente al cambiar de ruta en móvil
  useEffect(() => { setIsSidebarOpen(false) }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loadingProfile) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center w-full">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
        <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Sincronizando...</p>
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ profile, loadingProfile, logout }}>
      <div className="flex h-screen bg-black overflow-hidden relative w-full">
        
        {/* BOTÓN HAMBURGUESA (Solo visible en Móvil) */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed top-6 right-6 z-[60] p-3 bg-cyan-500 text-black rounded-2xl shadow-lg shadow-cyan-500/20"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* SIDEBAR CON LÓGICA RESPONSIVA */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar />
        </div>

        {/* OVERLAY PARA CERRAR (Móvil) */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 w-full pt-20 lg:pt-8">
          {children}
        </main>
      </div>
    </UserContext.Provider>
  )
}