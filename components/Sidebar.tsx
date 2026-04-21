'use client'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 1. Obtener el rol del usuario al cargar
  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setRole(data?.role || 'estudiante')
      }
      setLoading(false)
    }
    getRole()
  }, [])

  // 2. Definición maestra de rutas
  const navItems = [
    { name: 'DASHBOARD', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'estudiante'] },
    { name: 'USUARIOS', href: '/dashboard/usuarios', icon: Users, roles: ['admin'] },
    { name: 'ACADEMIA', href: '/dashboard/academia', icon: BookOpen, roles: ['admin', 'estudiante'] },
    { name: 'AJUSTES', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
  ]

  // 3. Filtrar items según el rol actual
  const filteredItems = navItems.filter(item => role && item.roles.includes(role))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Limpieza profunda de seguridad
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    localStorage.clear();
    sessionStorage.clear();
    router.replace('/login');
  };

  return (
    <aside className="w-72 border-r border-white/5 bg-black p-8 flex flex-col h-screen sticky top-0 z-[99]">
      
      <div className="flex-1 space-y-12">
        {/* LOGO Y TÍTULO */}
        <div className="flex items-center gap-4 px-2 mb-12 group">
          <div className="w-12 h-12 flex items-center justify-center">
            <img 
              src="/logo-botisfy.png" 
              alt="Botisfy Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="font-black text-xl italic text-white uppercase leading-[0.8] tracking-tighter">
              Botisfy
            </h2>
            <span className="text-[9px] text-[#00E5FF] font-black tracking-[0.2em] uppercase mt-1 italic">
              Labs
            </span>
          </div>
        </div>

        {/* NAVEGACIÓN INTELIGENTE */}
        <nav className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-zinc-800" size={20} />
            </div>
          ) : (
            filteredItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  pathname === item.href 
                  ? 'bg-[#00E5FF] text-black shadow-lg shadow-[#00E5FF]/20 scale-105' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} /> {item.name}
              </Link>
            ))
          )}
        </nav>
      </div>

      {/* CONTENEDOR INFERIOR */}
      <div className="border-t border-white/5 pt-10 mt-auto">
        {/* Indicador de Rol (Opcional, muy útil para debug) */}
        {!loading && (
          <div className="mb-4 px-6 py-2 bg-white/5 rounded-lg border border-white/5">
             <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Sesión: {role}</p>
          </div>
        )}
        <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 text-red-500/60 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-[0.2em] group hover:bg-red-500/10 rounded-2xl">
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          <span>Finalizar Sesión</span>
        </button>
      </div>
      
    </aside>
  )
}