'use client'
import { useContext } from 'react'
import { UserContext } from '@/lib/context'
import { 
  Users, Zap, Clock, Award, BookOpen, Activity, 
  UserPlus, BookMarked, Shield 
} from 'lucide-react'

export default function DashboardPage() {
  const { profile } = useContext(UserContext)
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      
      {/* ⚡ HEADER DINÁMICO CON BLINDAJE DE ROL */}
      <div className="bg-[#050505] border border-white/5 p-8 md:p-12 rounded-[3rem] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00E5FF]/5 blur-[120px] -mr-40 -mt-40 pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-black italic text-white tracking-tighter uppercase leading-none">
            Hola, <span className="text-[#00E5FF]">{profile?.full_name?.split(' ')[0] || 'Usuario'}</span>
          </h1>
          <div className="flex items-center gap-3 mt-4">
            <span className="w-8 h-[1px] bg-[#00E5FF]/30"></span>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em]">
              {isAdmin ? 'Panel de Control Centralizado' : 'Tu Centro de Aprendizaje Neural'}
            </p>
          </div>
        </div>

        {/* 🛡️ BADGE DE NIVEL DE ACCESO DINÁMICO */}
        <div className="relative z-10 bg-white/5 border border-white/10 px-8 py-6 rounded-[2rem] flex items-center gap-4 backdrop-blur-md self-start md:self-center">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            isAdmin ? 'bg-[#00E5FF]/10 border-[#00E5FF]/20 text-[#00E5FF]' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
          }`}>
            <Shield size={20} className={isAdmin ? 'animate-pulse' : ''} />
          </div>
          <div>
            <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">Nivel de Acceso</p>
            <p className="text-white text-sm font-black uppercase tracking-tighter italic">
              {isAdmin ? 'Admin' : 'Estudiante'}
            </p>
          </div>
        </div>
      </div>

      {/* 📊 SECCIÓN DE MÉTRICAS SEGÚN ROL[cite: 4] */}
      {isAdmin ? (
        <>
          {/* VISTA ADMINISTRADOR: ANALÍTICA Y GESTIÓN[cite: 4] */}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] ml-4">Acciones</p>
              <div className="space-y-4">
                <button className="w-full bg-[#050505] border border-white/5 p-6 rounded-3xl flex items-center gap-6 group hover:border-[#00E5FF]/30 transition-all text-left">
                  <div className="w-12 h-12 bg-[#00E5FF]/10 rounded-2xl flex items-center justify-center text-[#00E5FF]"><UserPlus size={20} /></div>
                  <div>
                    <p className="text-white text-[11px] font-black uppercase tracking-widest">Invitar Colaborador</p>
                    <p className="text-zinc-600 text-[9px] font-bold uppercase mt-1">Añadir nuevo acceso</p>
                  </div>
                </button>
                <button className="w-full bg-[#050505] border border-white/5 p-6 rounded-3xl flex items-center gap-6 group hover:border-[#00E5FF]/30 transition-all text-left">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400"><BookMarked size={20} /></div>
                  <div>
                    <p className="text-white text-[11px] font-black uppercase tracking-widest">Asignar Capacitación</p>
                    <p className="text-zinc-600 text-[9px] font-bold uppercase mt-1">Gestionar módulos</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] ml-4">Registros Recientes</p>
              <div className="bg-[#050505] border border-white/5 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="p-6 text-zinc-700 text-[8px] font-black uppercase tracking-widest">Colaborador</th>
                      <th className="p-6 text-zinc-700 text-[8px] font-black uppercase tracking-widest text-right">Última Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {[
                      { name: 'Freddy Moncayo', role: 'Admin', action: 'Acceso al Sistema' },
                      { name: 'Jenny', role: 'Estudiante', action: 'Completó Módulo IA' }
                    ].map((reg, i) => (
                      <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="p-6 flex items-center gap-4">
                          <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-[10px] font-black text-zinc-500">{reg.name[0]}</div>
                          <div><p className="text-white text-[10px] font-black uppercase tracking-tight">{reg.name}</p></div>
                        </td>
                        <td className="p-6 text-right"><span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">{reg.action}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* 🎓 VISTA ESTUDIANTE: FOCO EN APRENDIZAJE[cite: 4] */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    <div className="bg-[#00E5FF] h-full rounded-full w-[45%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#050505] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
              <Activity size={18} className="text-[#00E5FF] mb-4 opacity-50" />
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Próxima Lección</p>
              <p className="text-white text-xs font-bold uppercase leading-relaxed tracking-wide">Configuración de Agentes Autónomos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}