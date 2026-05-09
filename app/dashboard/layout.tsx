'use client'
import { useContext, useState } from 'react'
import { UserContext } from '../../lib/context'
import { UserContextProvider } from './UserContextProvider'
import Sidebar from '../../components/Sidebar'
import { Menu, X } from 'lucide-react'

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, loadingProfile } = useContext(UserContext)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Loading screen
  if (loadingProfile) {
    return (
      <div className="h-screen bg-[#020202] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-[#00E5FF]/10 blur-[120px] rounded-full animate-pulse" />
        
        <div className="relative z-10 flex flex-col items-center">
          <img 
            src="/logo-botisfy.png" 
            alt="Botisfy Labs" 
            className="w-24 h-24 md:w-32 md:h-32 animate-pulse mb-10 drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]" 
          />
          
          <div className="space-y-4 text-center">
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-bounce" />
            </div>
            <p className="text-[#00E5FF] text-[10px] font-black uppercase tracking-[1em] ml-[1em]">
              CARGANDO
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#020202] text-white overflow-hidden relative">

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR DESKTOP */}
      <div className="hidden lg:flex lg:w-72 bg-[#020202] border-r border-white/5">
        <Sidebar />
      </div>

      {/* SIDEBAR MOBILE (drawer) */}
      <div className={`
        fixed top-0 left-0 h-full w-72 z-50 bg-[#050505] border-r border-white/5
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP BAR MÓVIL */}
        <div className="lg:hidden h-16 bg-[#020202] border-b border-white/5 flex items-center px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 md:p-12">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserContextProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </UserContextProvider>
  )
}