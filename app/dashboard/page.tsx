'use client'
import { useContext } from 'react'
import { UserContext } from '@/app/dashboard/layout'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  // 1. Nos conectamos al cerebro y pedimos el perfil Y el estado de carga
  const { profile, loadingProfile } = useContext(UserContext)

  // 2. EL TRUCO: Si está cargando, mostramos una pantalla de espera elegante
  // Esto evita el "parpadeo" del nombre de Admin
  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <Loader2 className="w-10 h-10 animate-spin text-[#00E5FF] mb-4" />
        <p className="text-zinc-500 text-sm font-black tracking-widest uppercase animate-pulse">
          Cargando Espacio de Trabajo...
        </p>
      </div>
    )
  }

  // 3. Una vez que termina de cargar, mostramos el Dashboard real
  // Usamos un fallback seguro por si algo falta
  const nombreUsuario = profile?.full_name || 'Usuario'
  const rolUsuario = profile?.role || 'Estudiante'

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* TARJETA DE BIENVENIDA */}
      <div className="bg-[#050505] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E5FF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-[#00E5FF]/10 transition-colors duration-500" />
        
        <div className="relative z-10 flex items-end justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-2">
              HOLA, <span className="text-[#00E5FF] uppercase">{nombreUsuario}</span>
            </h1>
            <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sesión Iniciada — Nivel: {rolUsuario}
            </p>
          </div>
        </div>
      </div>

      {/* AQUÍ ABAJO VA EL RESTO DE TUS ESTADÍSTICAS Y TARJETAS */}
      {/* ... (Puedes pegar el resto de tu diseño de Dashboard aquí) ... */}

    </div>
  )
}