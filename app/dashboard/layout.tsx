'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'
import { UserContext } from '@/lib/context' // <--- Importación clave

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const checkUser = useCallback(async () => {
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

  // Mientras carga, no renderizamos el Sidebar para evitar que intente leer el contexto vacío
  if (loadingProfile) {
    return <div className="h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
    </div>
  }

  return (
    <UserContext.Provider value={{ profile, loadingProfile, logout }}>
      <div className="flex h-screen bg-black overflow-hidden w-full">
        <Sidebar /> 
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </UserContext.Provider>
  )
}