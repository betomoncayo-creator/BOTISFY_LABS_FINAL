'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Auto-cierre: Cierra el menú móvil automáticamente al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Bloquear el scroll del fondo cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <div className="flex h-screen bg-black overflow-hidden relative w-full">
      
      {/* 1. BARRA SUPERIOR MÓVIL (Solo visible en celulares) */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-20 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-40 shadow-2xl">
        
        {/* BRANDING CORPORATIVO RESPONSIVO (LOGO + TEXTO) */}
        <div className="flex items-center gap-3">
          {/* Logo más grande */}
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image 
              src="/logo-botisfy.png" 
              alt="Botisfy Labs Logo" 
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
          {/* Título de la empresa */}
          <span className="text-white font-black italic tracking-tighter text-xl leading-none pt-1">
            BOTISFY<span className="text-[#00E5FF]">LABS</span>
          </span>
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-[#00E5FF] hover:text-black transition-all active:scale-95 flex-shrink-0"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 2. OVERLAY OSCURO (Para cerrar haciendo clic fuera del menú) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 3. CONTENEDOR DEL SIDEBAR (Flotante en móvil, Fijo en PC) */}
      <div className={`
        fixed md:relative top-0 left-0 h-full z-50 transform transition-transform duration-500 ease-in-out
        md:translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)] md:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>

      {/* 4. CONTENIDO PRINCIPAL (Con padding extra arriba para móviles) */}
      <main className="flex-1 overflow-y-auto w-full h-full pt-28 md:pt-8 p-4 md:p-8 scroll-smooth">
        {children}
      </main>

    </div>
  )
}