'use client'
import { useContext } from 'react'
import { UserContext } from '@/lib/context'
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, logout } = useContext(UserContext)
  
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Users size={20} />, label: 'Usuarios', href: '/dashboard/usuarios' },
    { icon: <BookOpen size={20} />, label: 'Academia', href: '/dashboard/academia' },
    { icon: <Settings size={20} />, label: 'Configuración', href: '/dashboard/settings' },
  ]

  return (
    <aside className="h-full bg-[#050505] border-r border-white/5 flex flex-col w-72">
      {/* LOGO AREA */}
      <div className="p-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="text-cyan-400 fill-current" size={20} />
          <span className="text-white font-black italic text-xl tracking-tighter">BOTISFY <span className="text-cyan-400">LABS</span></span>
        </div>
        <p className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.4em]">v2.0 Stable Build</p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`
                flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                ${isActive ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}
              `}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* USER & LOGOUT */}
      <div className="p-6 border-t border-white/5">
        <div className="bg-white/5 p-4 rounded-[2rem] mb-4">
          <p className="text-white text-[10px] font-black uppercase italic truncate">{profile?.full_name}</p>
          <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest">{profile?.role}</p>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-4 px-6 py-4 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <LogOut size={20} /> Salir del Sistema
        </button>
      </div>
    </aside>
  )
}