'use client'
import { useContext } from 'react'
import { UserContext } from '@/lib/context'
import db from '@/lib/database'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BookOpen, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function Sidebar() {
  const { profile } = useContext(UserContext)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await db.signOut()
    router.replace('/login')
  }

  const menuItems = [
    { name: 'Dashboard',     icon: LayoutDashboard, path: '/dashboard' },
    ...(profile?.role === 'admin' ? [{ name: 'Directorio', icon: Users, path: '/dashboard/usuarios' }] : []),
    { name: 'Academia',      icon: BookOpen,         path: '/dashboard/academia' },
    { name: 'Configuración', icon: Settings,          path: '/dashboard/settings' },
  ]

  return (
    <aside className="w-full h-full flex flex-col p-8 bg-[#050505] overflow-hidden">
      <div className="flex items-center gap-4 mb-16 px-2">
        <img src="/logo-botisfy.png" alt="Botisfy Labs" className="w-10 h-10 object-contain" />
        <div className="truncate">
          <h2 className="text-white font-black italic tracking-tighter text-xl uppercase leading-none">Botisfy</h2>
          <p className="text-[#00E5FF] font-black italic tracking-tighter text-sm uppercase leading-none">Labs</p>
        </div>
      </div>

      <nav className="flex-1 space-y-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link key={item.path} href={item.path} className="block">
              <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group
                ${isActive ? 'bg-[#00E5FF] text-black shadow-[0_0_20px_rgba(0,229,255,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                <item.icon size={20} />
                <span className="font-black uppercase text-[11px] tracking-wide">{item.name}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="space-y-4 border-t border-white/10 pt-6">
        <div className="px-4 space-y-1">
          <p className="text-[#00E5FF] font-black uppercase text-[9px] tracking-wider">Usuario</p>
          <p className="text-white font-black uppercase text-[11px] truncate">{profile?.full_name || 'Usuario'}</p>
          <p className="text-zinc-500 text-[9px] truncate">{profile?.email || 'email@example.com'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all group font-black uppercase text-[10px]"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}