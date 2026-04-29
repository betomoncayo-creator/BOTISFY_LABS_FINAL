'use client'
import { useContext } from 'react'
import { UserContext } from '@/lib/context'
import { 
  Users, CheckCircle, Clock, Award, 
  UserPlus, BookOpen, ChevronRight, Zap
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { profile } = useContext(UserContext)
  const firstName = profile?.full_name?.split(' ')[0]?.toUpperCase() || 'FREDDY'

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* 1. MÉTRICAS HORIZONTALES (TOP) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard icon={<Users size={18}/>} label="Colaboradores Activos" value="2" color="text-cyan-400" />
        <MetricCard icon={<CheckCircle size={18}/>} label="Tasa de Finalización" value="85%" color="text-purple-400" />
        <MetricCard icon={<Clock size={18}/>} label="Horas Capacitación" value="124" color="text-amber-400" />
        <MetricCard icon={<Award size={18}/>} label="Certificados Emitidos" value="12" color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. ACCIONES RÁPIDAS (ABAJO IZQUIERDA) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-white font-black uppercase italic text-[10px] tracking-[0.3em] mb-6 opacity-50">Acciones</h3>
          
          <button className="w-full bg-[#050505] border border-white/5 p-6 rounded-[2rem] flex items-center gap-4 hover:border-cyan-500/50 transition-all group">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <UserPlus size={20} />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-[11px] uppercase italic">Invitar Colaborador</p>
              <p className="text-zinc-600 text-[9px] font-bold uppercase">Añadir nuevo acceso</p>
            </div>
          </button>

          <button className="w-full bg-[#050505] border border-white/5 p-6 rounded-[2rem] flex items-center gap-4 hover:border-purple-500/50 transition-all group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <BookOpen size={20} />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-[11px] uppercase italic">Asignar Capacitación</p>
              <p className="text-zinc-600 text-[9px] font-bold uppercase">Gestionar módulos</p>
            </div>
          </button>
        </div>

        {/* 3. REGISTROS RECIENTES (DERECHA) */}
        <div className="lg:col-span-2 bg-[#050505] border border-white/5 p-8 rounded-[3rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-[80px] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white font-black uppercase italic text-sm tracking-widest flex items-center gap-3">
              Registros Recientes
            </h3>
            <Zap size={14} className="text-cyan-500 animate-pulse" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Colaborador</th>
                  <th className="pb-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest text-right">Última Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <RecentRow name="Freddy Moncayo" level="Admin" action="Acceso al sistema" />
                <RecentRow name="Jenny" level="Estudiante" action="Completó Módulo IA" />
                <RecentRow name="Julito" level="Colaborador" action="Perfil actualizado" />
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  )
}

// Sub-componente para las métricas superiores
function MetricCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-[#050505] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.02] transition-all">
      <div className={`mb-4 ${color}`}>{icon}</div>
      <p className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
      <h4 className="text-2xl font-black text-white italic tracking-tighter">{value}</h4>
    </div>
  )
}

// Sub-componente para las filas de registros
function RecentRow({ name, level, action }: any) {
  return (
    <tr className="group">
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-[10px] font-black text-white uppercase border border-white/10 group-hover:border-cyan-500/30 transition-colors">
            {name.charAt(0)}
          </div>
          <div>
            <p className="text-[11px] font-black text-white uppercase italic">{name}</p>
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{level}</p>
          </div>
        </div>
      </td>
      <td className="py-4 text-right">
        <span className="text-[10px] font-bold text-zinc-400 uppercase">{action}</span>
      </td>
    </tr>
  )
}