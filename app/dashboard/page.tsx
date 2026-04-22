'use client'
import { useContext, useEffect, useState } from 'react'
import { UserContext } from '@/lib/context' 
import { createClient } from '@/lib/supabase' 
import { 
  BookOpen, Trophy, Zap, Target, Loader2, ArrowUpRight, Users, 
  Award, Clock, UserPlus, BarChart, CheckCircle2, X, Check, Copy
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
// 2. VISTA: DASHBOARD DEL ADMINISTRADOR
// ============================================================================
function VistaAdmin({ profile }: { profile: any }) {
  const nombreAdmin = profile?.full_name || 'GERENTE'
  const supabase = createClient() 

  // ESTADOS DE LA BASE DE DATOS
  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // ESTADOS PARA EL MODAL HÍBRIDO (El mejor de los dos mundos)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', role: 'estudiante' })
  const [isInviting, setIsInviting] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copied, setCopied] = useState(false)

  // LECTURA INICIAL DE DATOS
  useEffect(() => {
    async function fetchDashboardData() {
      setLoadingData(true)
      try {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        if (count !== null) setTotalUsers(count)

        const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(3)
        if (usersData) setRecentUsers(usersData)
      } catch (error) {
        console.error("Error fetching data", error)
      } finally {
        setLoadingData(false)
      }
    }
    fetchDashboardData()
  }, [supabase])

  // FUNCIÓN PARA ENVIAR Y GENERAR LA CONTRASEÑA AUTOMÁTICA
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    
    // Generamos la contraseña segura tipo "BTF-XXXXXXX"
    const newPass = "BTF-" + Math.random().toString(36).substring(2, 9).toUpperCase()

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email.toLowerCase().trim(),
          password: newPass,
          full_name: inviteForm.full_name,
          role: inviteForm.role
        })
      })
      
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Error al crear usuario')
      
      // Si fue exitoso, mostramos la contraseña generada en la UI
      setGeneratedPassword(newPass)
      
    } catch (err: any) {
      alert("Error de Sistema: " + err.message)
    } finally {
      setIsInviting(false)
    }
  }

  // CERRAR MODAL Y RECARGAR TABLA
  const handleCloseModal = () => {
    setShowInviteModal(false)
    setGeneratedPassword('')
    setInviteForm({ full_name: '', email: '', role: 'estudiante' })
    window.location.reload()
  }

  const adminStats = [
    { label: 'COLABORADORES ACTIVOS', value: totalUsers.toString(), icon: Users, color: 'text-purple-500', trend: 'Usuarios en DB' },
    { label: 'TASA DE FINALIZACIÓN', value: '78%', icon: Target, color: 'text-blue-500', trend: '+5% este mes' },
    { label: 'HORAS DE CAPACITACIÓN', value: '340h', icon: Clock, color: 'text-[#00E5FF]', trend: 'Acumulado mensual' },
    { label: 'CERTIFICADOS EMITIDOS', value: '115', icon: Award, color: 'text-emerald-500', trend: 'Acreditaciones' },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      
      {/* MODAL HÍBRIDO EMERGENTE */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#050505] border border-white/10 p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative text-center">
            
            <button onClick={handleCloseModal} className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors">
              <X size={24} />
            </button>
            
            {/* PANTALLA 1: FORMULARIO */}
            {!generatedPassword ? (
              <form onSubmit={handleInviteSubmit} className="space-y-6">
                <div className="bg-purple-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-purple-500/20 mb-6">
                  <UserPlus className="text-purple-500" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">
                    VINCULAR <span className="text-purple-500">ACCESO</span>
                  </h3>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Generación automática de clave</p>
                </div>
                
                <div className="space-y-4 text-left">
                  <input required type="text" value={inviteForm.full_name} onChange={e => setInviteForm({...inviteForm, full_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors text-center font-bold tracking-wider" placeholder="Nombre Completo" />
                  
                  <input required type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors text-center font-bold tracking-wider" placeholder="correo@empresa.com" />
                  
                  <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors appearance-none text-center font-bold tracking-wider cursor-pointer">
                    <option value="estudiante">Nivel: Estudiante</option>
                    <option value="admin">Nivel: Administrador</option>
                  </select>
                </div>
                
                <button type="submit" disabled={isInviting} className="w-full mt-2 bg-white text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-[0.5em] hover:bg-purple-500 hover:text-white transition-all shadow-xl disabled:opacity-50 flex justify-center items-center gap-2">
                  {isInviting ? <Loader2 size={18} className="animate-spin" /> : 'GENERAR LLAVE'}
                </button>
              </form>

            /* PANTALLA 2: ÉXITO Y COPIAR CONTRASEÑA */
            ) : (
              <div className="space-y-8 animate-in zoom-in duration-500">
                <div className="bg-green-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-green-500/20">
                  <Check className="text-green-500" size={32} />
                </div>
                <div>
                  <h2 className="text-white font-black uppercase italic text-2xl tracking-tighter">Acceso Generado</h2>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-2">{inviteForm.full_name}</p>
                </div>
                
                <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-[2.5rem] text-[#00E5FF] font-mono text-3xl font-black italic tracking-[0.2em] shadow-inner">
                  {generatedPassword}
                </div>
                
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`¡Hola ${inviteForm.full_name}!\n\nTu acceso a Botisfy Labs ha sido creado:\nEmail: ${inviteForm.email}\nClave: ${generatedPassword}`); 
                    setCopied(true); 
                    setTimeout(() => setCopied(false), 2000);
                  }} 
                  className={`w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${copied ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-[#00E5FF] text-black shadow-xl shadow-black/50 hover:bg-white'}`}
                >
                   {copied ? <Check size={18}/> : <Copy size={18}/>} 
                   {copied ? '¡CREDENCIAL COPIADA!' : 'COPIAR ACCESO'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HEADER GERENCIAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#050505] border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E5FF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-[#00E5FF]/10 transition-colors duration-500" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-1">
            RESUMEN DE EQUIPO: <span className="text-[#00E5FF]">{nombreAdmin}</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-2 italic">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Conectado a Base de Datos
          </p>
        </div>
      </div>

      {/* GRID DE MÉTRICAS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, i) => (
          <div key={i} className="bg-[#050505] border border-white/5 p-8 rounded-3xl relative overflow-hidden group hover:border-[#00E5FF]/30 transition-all">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}><stat.icon size={20} /></div>
              <span className="text-[8px] font-black text-zinc-600 tracking-widest uppercase">{stat.trend}</span>
            </div>
            <div className="relative z-10">
              <p className="text-zinc-500 text-[9px] font-black tracking-[0.2em] uppercase mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">
                {loadingData && i === 0 ? <Loader2 size={32} className="animate-spin text-zinc-600" /> : stat.value}
              </h3>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* BOTONES LATERALES */}
        <div className="xl:col-span-1 space-y-6">
          <h2 className="text-xs font-black text-white tracking-[0.4em] uppercase italic px-2">Acciones</h2>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => { setShowInviteModal(true); setGeneratedPassword(''); }}
              className="flex items-center gap-4 p-6 bg-[#050505] border border-white/5 rounded-3xl hover:border-purple-500/50 transition-all group w-full text-left"
            >
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

        {/* TABLA DINÁMICA CON USUARIOS REALES */}
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-xs font-black text-white tracking-[0.4em] uppercase italic px-2">Registros Recientes</h2>
          <div className="bg-[#050505] border border-white/5 rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="py-4 px-6 text-[9px] font-black text-zinc-600 tracking-[0.3em] uppercase">Colaborador</th>
                    <th className="py-4 px-6 text-[9px] font-black text-zinc-600 tracking-[0.3em] uppercase">Última Acción</th>
                    <th className="py-4 px-6 text-[9px] font-black text-zinc-600 tracking-[0.3em] uppercase text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingData ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00E5FF] mx-auto mb-2" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sincronizando...</span>
                      </td>
                    </tr>
                  ) : recentUsers.map((user, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors last:border-0">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#00E5FF]/10 flex items-center justify-center text-sm font-black text-[#00E5FF] uppercase border border-[#00E5FF]/20 flex-shrink-0">
                            {user.full_name ? user.full_name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tighter">{user.full_name || 'Usuario'}</p>
                            <p className="text-[10px] text-zinc-500 font-medium">Nivel: {user.role || 'estudiante'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
                            <UserPlus size={12} strokeWidth={3} />
                          </div>
                          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Nuevo Registro</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <span className="text-[10px] font-bold text-zinc-600 italic tracking-wider">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Reciente'}
                        </span>
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