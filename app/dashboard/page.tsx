'use client'
import { useContext } from 'react'
import { UserContext } from '@/lib/context'
import { 
  Users, 
  Zap, 
  Clock, 
  Award, 
  UserPlus, 
  BookOpen,
  Activity,
  ShieldCheck
} from 'lucide-react'

export default function DashboardPage() {
  const { profile } = useContext(UserContext)

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* ⚡ CABECERA ESTILO DIRECTORIO (ESTANDARIZADA) */}
      <div className="bg-[#050505] border border-white/5 p-8 md:p-12 rounded-[3rem] relative overflow-hidden">
        {/* Resplandor ambiental de fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00E5FF]/5 blur-[120px] -mr-40 -mt-40 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="space-y-2">
            {/* TÍTULO PRINCIPAL: Itálico, Black, Tracking Tighter */}
            <h1 className="text-4xl md:text-6xl font-black italic text-white tracking-tighter uppercase leading-none">
              Hola, <span className="text-[#00E5FF] drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                {profile?.full_name?.split(' ')[0] || 'Freddy'}
              </span>
            </h1>
            
            {/* SUBTÍTULO: Zinc, Negrita, Tracking Extendido (0.5em) */}
            <div className="flex items-center gap-3 mt-4">
              <span className="w-8 h-[1px] bg-[#00E5FF]/30"></span>
              <p className="text-zinc-500 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.5em] ml-1">
                Panel de Control Centralizado
              </p>
            </div>
          </div>

          {/* Badge de Nivel de Acceso en el lado derecho */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl self-start lg:self-center">
            <ShieldCheck size={18} className="text-[#00E5FF]" />
            <div className="text-left">
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">Nivel de Acceso</p>
              <p className="text-white text-[10px] font-bold uppercase tracking-widest">{profile?.role || 'Admin'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 GRID DE ESTADÍSTICAS (MANTENIENDO EL ESTILO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Colaboradores Activos', value: '2', icon: Users, color: 'text-blue-400' },
          { label: 'Tasa de Finalización', value: '85%', icon: Zap, color: 'text-purple-400' },
          { label: 'Horas Capacitación', value: '124', icon: Clock, color: 'text-yellow-400' },
          { label: 'Certificados Emitidos', value: '12', icon: Award, color: 'text-green-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#050505] border border-white/5 p-8 rounded-[2.5rem] hover:border-white/10 transition-all group">
            <stat.icon className={`${stat.color} mb-6 opacity-40 group-hover:opacity-100 transition-opacity`} size={20} />
            <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-2">{stat.label}</p>
            <p className="text-white text-3xl font-black italic tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* SECCIÓN DE ACCIONES Y REGISTROS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna de Acceso Rápido */}
        <div className="space-y-6">
          <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] ml-4 mb-6">Acciones</h3>
          
          <button className="w-full bg-white/5 border border-white/5 hover:border-[#00E5FF]/30 p-6 rounded-[2rem] flex items-center gap-6 group transition-all">
            <div className="w-12 h-12 bg-[#00E5FF]/10 rounded-2xl flex items-center justify-center text-[#00E5FF]">
              <UserPlus size={20} />
            </div>
            <div className="text-left">
              <p className="text-white text-[11px] font-black uppercase tracking-widest">Invitar Colaborador</p>
              <p className="text-zinc-600 text-[9px] font-medium uppercase mt-1">Añadir nuevo acceso</p>
            </div>
          </button>

          <button className="w-full bg-white/5 border border-white/5 hover:border-[#A855F7]/30 p-6 rounded-[2rem] flex items-center gap-6 group transition-all">
            <div className="w-12 h-12 bg-[#A855F7]/10 rounded-2xl flex items-center justify-center text-[#A855F7]">
              <BookOpen size={20} />
            </div>
            <div className="text-left">
              <p className="text-white text-[11px] font-black uppercase tracking-widest">Asignar Capacitación</p>
              <p className="text-zinc-600 text-[9px] font-medium uppercase mt-1">Gestionar módulos</p>
            </div>
          </button>
        </div>

        {/* Tabla de Registros Recientes */}
        <div className="lg:col-span-2 bg-[#050505] border border-white/5 rounded-[3rem] p-8 md:p-10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-white text-xl font-black italic tracking-tighter uppercase">Registros Recientes</h3>
            <Activity size={18} className="text-[#00E5FF] opacity-50" />
          </div>

          <div className="space-y-4">
            {[
              { name: 'Freddy Moncayo', role: 'Admin', action: 'Acceso al Sistema', time: 'Ahora' },
              { name: 'Jenny', role: 'Estudiante', action: 'Completó Módulo IA', time: 'Hace 2h' },
              { name: 'Julito', role: 'Colaborador', action: 'Perfil Actualizado', time: 'Ayer' },
            ].map((reg, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[10px] font-black text-zinc-500 uppercase">
                    {reg.name[0]}
                  </div>
                  <div>
                    <p className="text-white text-[11px] font-bold uppercase tracking-tight">{reg.name}</p>
                    <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">{reg.role}</p>
                  </div>
                </div>
                <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">{reg.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}