'use client'
import { useContext } from 'react'
import { UserContext } from '@/lib/context'
import { Users, Zap, Clock, Award, BookOpen, Activity } from 'lucide-react'

export default function DashboardPage() {
  const { profile } = useContext(UserContext)
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      
      {/* ⚡ HEADER DINÁMICO */}
      <div className="bg-[#050505] border border-white/5 p-8 md:p-12 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00E5FF]/5 blur-[120px] -mr-40 -mt-40 pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-black italic text-white tracking-tighter uppercase leading-none">
            Hola, <span className="text-[#00E5FF]">
              {profile?.full_name?.split(' ')[0] || 'Usuario'}
            </span>
          </h1>
          <div className="flex items-center gap-3 mt-4">
            <span className="w-8 h-[1px] bg-[#00E5FF]/30"></span>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em]">
              {isAdmin ? 'Panel de Control Centralizado' : 'Tu Centro de Aprendizaje Neural'}
            </p>
          </div>
        </div>
      </div>

      {/* 📊 SECCIÓN CONDICIONAL SEGÚN ROL */}
      {isAdmin ? (
        <>
          {/* VISTA: ADMIN (Métricas Globales) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Colaboradores Activos', value: '2', icon: Users, color: 'text-blue-400' },
              { label: 'Tasa de Finalización', value: '85%', icon: Zap, color: 'text-purple-400' },
              { label: 'Horas Capacitación', value: '124', icon: Clock, color: 'text-yellow-400' },
              { label: 'Certificados Emitidos', value: '12', icon: Award, color: 'text-green-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#050505] border border-white/5 p-8 rounded-[2.5rem]">
                <stat.icon className={`${stat.color} mb-6 opacity-40`} size={20} />
                <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                <p className="text-white text-3xl font-black italic tracking-tighter">{stat.value}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* VISTA: ESTUDIANTE (Progreso Individual) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#050505] border border-white/5 p-10 rounded-[3rem]">
              <h3 className="text-white text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                <BookOpen size={20} className="text-[#00E5FF]" /> Mis Cursos Activos
              </h3>
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl group hover:border-[#00E5FF]/30 transition-all cursor-pointer">
                <p className="text-white text-lg font-black italic uppercase tracking-tight">Automatización con IA 101</p>
                <div className="mt-6">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span className="text-zinc-500">Progreso del Nodo</span>
                    <span className="text-[#00E5FF]">45%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#00E5FF] h-full rounded-full w-[45%] shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#050505] border border-white/5 p-8 rounded-[2.5rem]">
              <Activity size={18} className="text-[#00E5FF] mb-4 opacity-50" />
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Próxima Lección</p>
              <p className="text-white text-xs font-bold uppercase leading-relaxed tracking-wide">
                Configuración de Agentes Autónomos
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}