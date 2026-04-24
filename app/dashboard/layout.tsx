'use client'
import { useState, useEffect, createContext, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

export const UserContext = createContext<any>(null)

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      setProfile(data || { role: 'estudiante', full_name: 'Usuario' })
    }
    setLoadingProfile(false)
  }, [supabase])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    window.location.href = '/login'
  }

  return (
    <UserContext.Provider value={{ profile, loadingProfile, logout }}>
      <div className="flex h-screen bg-black overflow-hidden relative w-full">
        <div className="md:hidden absolute top-0 left-0 right-0 h-20 bg-[#050505] border-b border-white/5 flex items-center justify-between px-6 z-40">
          <Image src="/logo-botisfy.png" alt="Logo" width={40} height={40} />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <div className={`fixed md:relative z-50 transition-transform md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto pt-24 md:pt-8 p-4 md:p-8">
          {children}
        </main>
      </div>
    </UserContext.Provider>
  )
}