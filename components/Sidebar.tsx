'use client'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut 
} from 'lucide-react'
import Link from 'next/link'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // ⚡ PROTOCOLO DE SALIDA ORIGINAL (RESTAURADO)
  const handleLogout = async () => {
    await supabase.auth.signOut() //
    router.push('/login') // Redirección directa y garantizada[cite: 1]
  }

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Directorio', icon: Users, path: '/dashboard/usuarios' },
    { name: 'Academia', icon: BookOpen, path: '/dashboard/academia' },
    { name: 'Configuración', icon: Settings, path: '/dashboard/settings' },
  ]

  return (
    <aside className="w-full h-full flex flex-col p-8 bg-[#050505]">
      {/* BRANDING */}
      <div className="flex items-center gap-4 mb-16 px-2">
        <img src="/logo-botisfy.png" alt="Botisfy Labs" className="w-10 h-10 object-contain" />
        <div>
          <h2 className="text-white font-black italic tracking-tighter text-xl leading-none uppercase">Botisfy</h2>
          <p className="text-[#00E5FF] font-black italic tracking-tighter text-sm uppercase leading-none">Labs</p>
        </div>
      </div>

      {/* MENÚ */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group
                ${isActive ? 'bg-[#00E5FF] text-black shadow-[0_0_20px_rgba(0,229,255,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                <item.icon size={20} className={isActive ? 'text-black' : 'group-hover:text-[#00E5FF]'} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.name}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* BOTÓN DESCONECTAR (FUNCIONALIDAD RECUPERADA) */}
      <div className="mt-auto pt-8">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl transition-all group"
        >
          <LogOut size={18} className="text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          <span className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em]">Desconectar</span>
        </button>
      </div>
    </aside>
  )
}