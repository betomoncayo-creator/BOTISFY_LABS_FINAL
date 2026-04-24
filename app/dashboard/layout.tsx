'use client'
import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { UserContext } from '@/lib/context' 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Consultamos el perfil real
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        
        if (error) console.error("Error al obtener perfil:", error)

        // Si el registro existe, lo usamos. Si no, forzamos estudiante por seguridad.
        if (data) {
          console.log("Perfil cargado:", data.full_name, "Rol:", data.role)
          setProfile(data)
        } else {
          console.warn("No se encontró registro en 'profiles' para este ID. Usando default.")
          setProfile({ role: 'estudiante', full_name: user.email?.split('@')[0] })
        }
      } else {
        router.replace('/login')
      }
    } catch (err) {
      console.error("Fallo crítico en Layout:", err)
    } finally {
      setLoadingProfile(false)
    }
  }, [supabase, router])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    window.location.href = '/login'
  }

  // ... resto del componente igual (Sidebar, Main, etc.)
  return (
    <UserContext.Provider value={{ profile, loadingProfile, logout }}>
      <div className="flex h-screen bg-black overflow-hidden relative w-full">
        <div className={`fixed md:relative top-0 left-0 h-full z-50 transform transition-transform duration-500 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto w-full h-full pt-28 md:pt-8 p-4 md:p-8">
          {children}
        </main>
      </div>
    </UserContext.Provider>
  )
}