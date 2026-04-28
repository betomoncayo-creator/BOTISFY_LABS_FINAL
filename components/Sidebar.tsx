'use client'
import { useContext } from 'react'
import { UserContext } from '@/lib/context'
import { 
  LayoutDashboard, Users, BookOpen, 
  Settings, LogOut, ChevronRight 
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const context = useContext(UserContext)

  if (!context || !context.profile) return null

  const { profile, logout } = context
  
  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Users size={18} />, label: 'Directorio', href: '/dashboard/usuarios' },
    { icon: <BookOpen size={18} />, label: 'Academia', href: '/dashboard/academia' },
    { icon: <Settings size={18} />, label: 'Configuración', href: '/dashboard/settings' },
  ]

  return (
    <aside className="h-full bg-[#050505] border-r border-white/5 flex flex-col w-72 shadow-2xl relative font-sans">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#00E5FF]/5 to-transparent pointer-events-none" />

      {/* HEADER CON LOGO OFICIAL */}
      <div className="p-10 relative z-10">
        <div className="flex items-center gap-4 mb-2">
          {/* Contenedor del Logo */}
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(0,229,255,0.05)] overflow-hidden">
            <img 
              src="/logo-botisfy.png" 
              alt="Botisfy Logo" 
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <span className="text-white font-black italic text-xl tracking-tighter uppercase leading-none block">
              BOTISFY
            </span>
            <span className="text-[#00E5FF] font-black italic text-lg tracking-tighter uppercase leading-none">
              LABS
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 ml-1">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.5em]">System v2.0 Stable</p>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-3 mt-2 relative z-10">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`
                group flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300
                ${isActive 
                  ? 'bg-[#00E5FF] text-black shadow-lg shadow-[#00E5FF]/20 translate-x-2' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5 hover:translate-x-1'}
              `}
            >
              <div className="flex items-center gap-4">
                {item.icon}
                {item.label}
              </div>
              {isActive && <ChevronRight size={14} className="animate-in slide-in-from-left-2" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-8 border-t border-white/5 relative z-10">
        <div className="bg-white/5 border border-white/5 p-5 rounded-[2.5rem] mb-6 group hover:border-[#00E5FF]/20 transition-colors">
          <p className="text-white text-[10px] font-black uppercase italic truncate mb-1">{profile?.full_name}</p>
          <p className="text-[#00E5FF] text-[8px] font-bold uppercase tracking-[0.3em] opacity-60">Nivel: {profile?.role}</p>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-4 px-6 py-4 text-red-500/40 hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.3em] italic"
        >
          Desconectar
        </button>
      </div>
    </aside>
  )
}