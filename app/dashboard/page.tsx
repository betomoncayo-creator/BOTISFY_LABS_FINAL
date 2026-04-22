'use client'
import { useContext } from 'react'

// AQUI ESTA LA MAGIA DEL PASO 3: Importamos desde la misma casa neutral
import { UserContext } from '@/lib/context' 

import { 
  BookOpen, 
  Trophy, 
  Zap, 
  Target,
  Loader2,
  ArrowUpRight
} from 'lucide-react'

export default function DashboardPage() {
  // 1. CONEXIÓN AL CEREBRO CENTRAL
  // Obtenemos el perfil real y el estado de carga
  const { profile, loadingProfile } = useContext(UserContext)

  // 2. PANTALLA DE CARGA (PROTECCIÓN ANTI-PARPADEO)
  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] w-full">
        <Loader2 className="w-12 h-12 animate-spin text-[#00E5FF] mb-4" />
        <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase animate-pulse italic">
          Sincronizando con Botisfy Labs...
        </p>
      </div>
    )
  }

  // 3. VARIABLES DE DATOS (Con fallbacks de seguridad)
  const nombreUsuario = profile?.full_name || 'USUARIO'
  const rolUsuario = profile?.role || 'estudiante'

  // Datos de ejemplo para las tarjetas (Luego los conectaremos a la DB)
  const stats = [
    { label: 'CURSOS ACTIVOS', value: '04', icon: BookOpen, color: 'text-blue-500' },
    { label: 'PUNTOS TOTALES', value: '1,250', icon: Zap, color: 'text-yellow-500' },
    { label: 'LOGROS EXTRA', value: '12', icon: Trophy, color: 'text-[#00E5FF]' },
    { label: 'META MENSUAL', value: '85%', icon: Target, color: 'text-emerald-500' },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 italic">
      
      {/* SECCIÓN DE BIENVENIDA */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00E5FF]/20 to-transparent rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
        <div className="relative bg-[#050505] border border-white/5 p-10 md:p-14 rounded-[2rem] overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E5FF]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded-full text-[8px] font-black text-[#00E5FF] tracking-[0.2em] uppercase">
                  {rolUsuario}
                </span>
                <span className="text-zinc-600 text-[8px] font-black tracking-[0.2em] uppercase">
                  System Status: Online
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-4">
                HOLA, <span className="text-[#00E5FF] uppercase">{nombreUsuario.split(' ')[0]}</span>
              </h1>
              <p className="text-zinc-500 text-xs md:text-sm max-w-md leading-relaxed font-medium">
                Bienvenido a tu centro de mando en Botisfy Labs. Aquí tienes el resumen de tu progreso académico y métricas de rendimiento.
              </p>
            </div>
            
            <button className="flex items-center gap-2 bg-white text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00E5FF] transition-all active:scale-95">
              Continuar Aprendiendo <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* GRID DE ESTADÍSTICAS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="bg-[#050505] border border-white/5 p-8 rounded-3xl hover:border-[#00E5FF]/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={80} strokeWidth={1} />
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-zinc-500 text-[9px] font-black tracking-[0.2em] uppercase">
                {stat.label}
              </span>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white tracking-tighter">
                {stat.value}
              </span>
              {index === 3 && <span className="text-[10px] text-emerald-500 font-bold">+5%</span>}
            </div>
          </div>
        ))}
      </section>

      {/* FOOTER INFORMATIVO */}
      <footer className="pt-10 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5">
        <p className="text-zinc-600 text-[9px] font-black tracking-[0.2em] uppercase">
          &copy; 2026 BOTISFY LABS S.A.S. — ECUADOR
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-zinc-600 hover:text-white text-[9px] font-black tracking-[0.2em] uppercase transition-colors">Soporte Técnico</a>
          <a href="#" className="text-zinc-600 hover:text-white text-[9px] font-black tracking-[0.2em] uppercase transition-colors">Documentación</a>
        </div>
      </footer>

    </div>
  )
}