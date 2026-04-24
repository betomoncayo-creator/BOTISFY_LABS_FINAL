'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'
import { UserContext } from '@/lib/context' 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    // 🛡️ ESCUCHA REACTIVA: Supabase nos avisa en cuanto la sesión esté lista
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Evento Auth:", event, "ID:", session?.user?.id)

      if (session?.user) {
        // Buscamos el perfil real
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (data) {
          setProfile(data)
        } else {
          // Si no hay perfil, evitamos el bucle pero asignamos rol base
          setProfile({ role: 'estudiante', full_name: session.user.email?.split('@')[0] })
        }
        setLoadingProfile(false)
      } else {
        // Solo redirigimos si realmente NO hay sesión
        setLoadingProfile(false)
        router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  if (loadingProfile) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ profile, loadingProfile, logout: () => supabase.auth.signOut() }}>
      <div className="flex h-screen bg-black overflow-hidden relative w-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto w-full h-full p-4 md:p-8">
          {children}
        </main>
      </div>
    </UserContext.Provider>
  )
}