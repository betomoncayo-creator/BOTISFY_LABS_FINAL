'use client'
import { useContext } from 'react'
import { UserContext } from '@/lib/context' 
import { 
  BookOpen, 
  Trophy, 
  Zap, 
  Target,
  Loader2,
  ArrowUpRight,
  Users,
  Award,
  Clock,
  UserPlus,
  BarChart,
  CheckCircle2
} from 'lucide-react'

// ============================================================================
// 1. VISTA: DASHBOARD DEL ESTUDIANTE / COLABORADOR
// ============================================================================
function VistaEstudiante({ profile }: { profile: any }) {
  const nombreUsuario = profile?.full_name || 'USUARIO'
  const stats = [
    { label: 'CURSOS ASIGNADOS', value: '04', icon: BookOpen, color: 'text-blue-500' },
    { label: 'PUNTOS DE HABILIDAD', value: '1,250', icon: Zap, color: 'text-yellow-500' },
    { label: 'LOGROS OBTENIDOS', value: '12', icon: Trophy, color: 'text-[#00E5FF]' },
    { label: 'PROGRESO GLOBAL', value: '85%', icon: Target, color: 'text-emerald-500' },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 italic">
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00E5FF]/20 to-transparent rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
        <div className="relative bg-[#050505] border border-white/5 p-10 md:p-14 rounded-[2rem] overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E5FF]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-4 uppercase">
                HOLA, <span className="text-[#00E5FF]">{nombreUsuario.split(' ')[0]}</span>
              </h1>
              <p className="text-zinc-500 text-xs md:text-sm max-w-md leading-relaxed font-medium">
                Bienvenido a tu plataforma de aprendizaje. Aquí tienes el resumen de tus capacitaciones corporativas.
              </p>
            </div>
            <button className="flex items-center gap-2 bg-white text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00E5FF] transition-all">
              Continuar Aprendiendo <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#050505] border border-white/5 p-8 rounded-3xl hover:border-[#00E5FF]/30 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}><stat.icon size={20} /></div>
              <span className="text-zinc-500 text-[9px] font-black tracking-[0.2em] uppercase">{stat.label}</span>
            </div>
            <span className="text-3xl font-black text-white tracking-tighter">{stat.value}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

// ============================================================================
// 2. VISTA: DASHBOARD DEL ADMINISTRADOR (Con Diseño de "Usuarios")
// ============================================================================
function VistaAdmin({ profile }: { profile: any }) {
  const nombreAdmin = profile?.full_name || 'GERENTE'
  
  const adminStats = [
    { label: 'COLABORADORES ACTIVOS', value: '42', icon: Users, color: 'text-purple-500', trend: 'De 50 licencias' },
    { label: 'TASA DE FINALIZACIÓN', value: '78%', icon: Target, color: 'text-blue-500', trend: '+5% este mes' },
    { label: 'HORAS DE CAPACITACIÓN', value: '340h', icon: Clock, color: 'text-[#00E5FF]', trend: 'Acumulado mensual' },
    { label: 'CERTIFICADOS EMITIDOS', value: '115', icon: Award, color: 'text-emerald-500', trend: 'Acreditaciones' },
  ]

  // Datos de ejemplo para la tabla de Progreso
  const recentProgress = [
    { user: 'María Gómez', email: 'maria@empresa.com', action: 'Completó: Ética de Datos', time: 'Hace 10 min', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { user: 'Carlos Ruiz', email: 'carlos@empresa.com', action: 'Inició: Onboarding B2B', time: 'Hace 1 hora', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { user: 'Ana Torres', email: 'ana@empresa.com', action: 'Certificado: Ventas', time: 'Hace 3 horas', icon: Award, color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10' },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER GERENCIAL (Alineado con el estilo de la vista Usuarios) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#050505] border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E5FF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-[#00E5FF]/10 transition-colors duration-500" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-1">
            RESUMEN DE EQUIPO: <span className="text-[#00E5FF]">{nombreAdmin}</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-2 italic">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Workspace Activo — Botisfy Labs
          </p>
        </div>
      </div>

      {/* GRID DE MÉTRICAS DE EQUIPO */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, i) => (
          <div key={i} className="bg-[#050505] border border-white/5 p-8 rounded-3xl relative overflow-hidden group hover:border-[#00E5FF]/30 transition-all">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}><stat.icon size={20} /></div>
              <span className="text-[8px] font-black text-zinc-600 tracking-widest uppercase">{stat.trend}</span>
            </div>
            <div className="relative z-10">
              <p className="text-zinc-500 text-[9px] font-black tracking-[0.2em] uppercase mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </section>

      {/* GESTIÓN DE COLABORADORES Y TABLA DE ACTIVIDAD */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* BOTONES DE ACCIÓN RÁPIDA */}
        <div className="xl:col-span-1 space-y-6">
          <h2 className="text-xs font-black text-white tracking-[0.4em] uppercase italic px-2">Acciones</h2>
          <div className="flex flex-col gap-4">
            <button className="flex items-center gap-4 p-6 bg-[#050505] border border-white/5 rounded-3xl hover:border-purple-500/50 transition-all group w-full text-left">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500 group-hover:scale-110 transition-transform"><UserPlus size={24} /></div>
              <div>
                <span className="block text-[10px] font-black text-white tracking-widest uppercase">Invitar Colaborador</span>
                <span className="block text-[9px] text-zinc-500 font-medium">Añadir al workspace</span>
              </div>
            </button>
            <button className="flex items-center gap-4 p-6 bg-[#050505] border border-white/5 rounded-3xl hover:border-[#00E5FF]/50 transition-all group w-full text-left">
              <div className="p-3 bg-[#00E5FF]/10 rounded-xl text-[#00E5FF] group-hover:scale-110 transition-transform"><BookOpen size={24} /></div>
              <div>
                <span className="block text-[10px] font-black text-white tracking-widest uppercase">Asignar Capacitación</span>
                <span className="block text-[9px] text-zinc-500 font-medium">Gestionar cursos</span>
              </div>
            </button>
            <button className="flex items-center gap-4 p-6 bg-[#050505] border border-white/5 rounded-3xl hover:border-emerald-500/50 transition-all group w-full text-left">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform"><BarChart size={24} /></div>
              <div>
                <span className="block text-[10px] font-black text-white tracking-widest uppercase">Analíticas de Equipo</span>
                <span className="block text-[9px] text-zinc-500 font-medium">Ver reportes detallados</span>
              </div>
            </button>
          </div>
        </div>

        {/* TABLA DE PROGRESO AL ESTILO "USUARIOS" */}
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-xs font-black text-white tracking-[0.4em] uppercase italic px-2">Progreso Reciente</h2>
          <div className="bg-[#050505] border border-white/5 rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="py-4 px-6 text-[9px] font-black text-zinc-600 tracking-[0.3em] uppercase">Colaborador</th>
                    <th className="py-4 px-6 text-[9px] font-black text-zinc-600 tracking-[0.3em] uppercase">Última Acción</th>
                    <th className="py-4 px-6 text-[9px] font-black text-zinc-600 tracking-[0.3em] uppercase text-right">Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProgress.map((item, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors last:border-0">
                      
                      {/* COLUMNA: USUARIO (Igual a la captura de Usuarios) */}
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#00E5FF]/10 flex items-center justify-center text-sm font-black text-[#00E5FF] uppercase border border-[#00E5FF]/20 flex-shrink-0">
                            {item.user.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tighter">{item.user}</p>
                            <p className="text-[10px] text-zinc-500 font-medium">{item.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* COLUMNA: ACCIÓN */}
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-md ${item.bg} ${item.color}`}>
                            <item.icon size={12} strokeWidth={3} />
                          </div>
                          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{item.action}</span>
                        </div>
                      </td>

                      {/* COLUMNA: TIEMPO */}
                      <td className="py-5 px-6 text-right">
                        <span className="text-[10px] font-bold text-zinc-600 italic tracking-wider">{item.time}</span>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

// ============================================================================
// 3. EL CONTROLADOR PRINCIPAL
// ============================================================================
export default function DashboardPage() {
  const { profile, loadingProfile } = useContext(UserContext)

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] w-full">
        <Loader2 className="w-12 h-12 animate-spin text-[#00E5FF] mb-4" />
        <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase animate-pulse italic">
          Sincronizando Workspace...
        </p>
      </div>
    )
  }

  const role = profile?.role?.toLowerCase() || 'estudiante'

  return role === 'admin' ? <VistaAdmin profile={profile} /> : <VistaEstudiante profile={profile} />
}