'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Shield, Bell, User, Lock, CheckCircle2, Server, Activity, Building, MailWarning, Users, ArrowRightLeft } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // ID de la configuración base
  const [settingsId, setSettingsId] = useState<string | null>(null)

  // Estados: Seguridad
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [transferEmail, setTransferEmail] = useState('')

  // Estados: Notificaciones
  const [deadlineDays, setDeadlineDays] = useState(3)
  const [inactivityDays, setInactivityDays] = useState(7)

  // Estados: Marca Blanca
  const [clientName, setClientName] = useState('Botisfy Labs')

  // Estados: Auditoría (Real)
  const [dbStats, setDbStats] = useState({ users: 0, courses: 0, modules: 0 })

  // 1. CARGAR DATOS REALES AL INICIAR
  useEffect(() => {
    const fetchInitialData = async () => {
      // Traer configuración de empresa
      const { data: settings } = await supabase.from('company_settings').select('*').limit(1).single()
      if (settings) {
        setSettingsId(settings.id)
        setClientName(settings.company_name)
        setDeadlineDays(settings.deadline_days)
        setInactivityDays(settings.inactivity_days)
        setTransferEmail(settings.transfer_email || '')
      }

      // Traer nombre de admin actual
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
        if (profile) setNewName(profile.full_name || '')
      }
    }
    fetchInitialData()
  }, [])

  // 2. CARGAR RADAR DE AUDITORÍA (Solo cuando se abre la pestaña)
  useEffect(() => {
    if (activeTab === 'auditoria') {
      const fetchDbStats = async () => {
        const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'estudiante')
        const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true })
        const { count: modulesCount } = await supabase.from('course_modules').select('*', { count: 'exact', head: true })
        
        setDbStats({
          users: usersCount || 0,
          courses: coursesCount || 0,
          modules: modulesCount || 0
        })
      }
      fetchDbStats()
    }
  }, [activeTab])

  // ==========================================
  // FUNCIONES DE GUARDADO EN BASE DE DATOS
  // ==========================================

  // A. Guardar Seguridad (Perfiles + Auth + Settings)
  const handleSecuritySave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Sesión no encontrada")

      // Cambiar Nombre en tabla perfiles
      if (newName) await supabase.from('profiles').update({ full_name: newName }).eq('id', user.id)
      
      // Cambiar Contraseña en Auth (Bóveda)
      if (newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
      }

      // Guardar email de traspaso en Settings
      if (settingsId) await supabase.from('company_settings').update({ transfer_email: transferEmail }).eq('id', settingsId)

      setSuccessMsg("Seguridad de Bóveda actualizada.")
      setNewPassword('')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // B. Guardar Configuración Corporativa (Settings)
  const handleCorporateSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMsg(null)
    try {
      if (!settingsId) throw new Error("Base de datos no inicializada.")
      
      const { error } = await supabase.from('company_settings').update({
        company_name: clientName,
        deadline_days: deadlineDays,
        inactivity_days: inactivityDays
      }).eq('id', settingsId)

      if (error) throw error

      setSuccessMsg("Reglas corporativas inyectadas a la DB.")
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'seguridad':
        return (
          <form onSubmit={handleSecuritySave} className="space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <header>
              <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                <Shield className="text-[#00E5FF]" /> Seguridad y Mando
              </h3>
              <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-widest font-bold mt-1">Gestión de credenciales y traspaso de administración.</p>
            </header>
            
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={16} className="text-zinc-600" /></div>
                <input type="text" placeholder="Actualizar Nombre del Admin Actual" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 rounded-xl text-sm text-white outline-none focus:border-[#00E5FF] transition-all" />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={16} className="text-zinc-600" /></div>
                <input type="password" placeholder="Nueva Contraseña Maestra (Opcional)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 rounded-xl text-sm text-white outline-none focus:border-[#00E5FF] transition-all font-mono" />
              </div>
            </div>

            <div className="p-5 md:p-6 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
               <h4 className="text-red-500 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                 <ArrowRightLeft size={14}/> Traspaso de Poderes (Admin Handoff)
               </h4>
               <p className="text-zinc-400 text-xs font-medium">Si cambias de rol o abandonas la empresa, ingresa el correo del empleado que heredará los privilegios de Administrador Global.</p>
               <input type="email" placeholder="correo.del.nuevo.admin@empresa.com" value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} className="w-full bg-black/50 border border-red-500/20 py-3 px-4 rounded-xl text-sm text-white outline-none focus:border-red-500 transition-all" />
            </div>
            
            <button disabled={isLoading} className="w-full bg-[#00E5FF] text-black font-black py-4 rounded-xl uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-[#00E5FF]/20 disabled:opacity-50">
              {isLoading ? 'GUARDANDO EN BÓVEDA...' : 'ACTUALIZAR SEGURIDAD'}
            </button>
            {successMsg && <p className="text-[#00E5FF] text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 mt-2"><CheckCircle2 size={14}/> {successMsg}</p>}
          </form>
        )

      case 'notificaciones':
        return (
          <form onSubmit={handleCorporateSave} className="space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <header>
              <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                <Bell className="text-orange-500" /> Reglas de Notificación
              </h3>
              <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-widest font-bold mt-1">Configura las alertas automáticas por correo para empleados.</p>
            </header>
            
            <div className="space-y-4 pt-4 border-t border-white/5">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-white/5 border border-white/10 rounded-xl gap-4 sm:gap-0">
                 <div>
                   <h4 className="text-white font-bold text-sm">Alerta de Vencimiento de Curso</h4>
                   <p className="text-zinc-500 text-[9px] uppercase tracking-widest mt-1 max-w-xs">Enviar recordatorio urgente a estudiantes antes del cierre.</p>
                 </div>
                 <div className="flex items-center gap-3 bg-black/50 p-2 rounded-lg border border-white/5 w-fit">
                    <span className="text-xs font-black text-zinc-500 uppercase">Avisar</span>
                    <input type="number" min="1" max="15" value={deadlineDays} onChange={(e) => setDeadlineDays(Number(e.target.value))} className="w-12 bg-transparent text-orange-500 font-black text-center outline-none" />
                    <span className="text-xs font-black text-zinc-500 uppercase">Días antes</span>
                 </div>
               </div>
               
               <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-white/5 border border-white/10 rounded-xl gap-4 sm:gap-0">
                 <div>
                   <h4 className="text-white font-bold text-sm">Alerta de Inactividad (Fantasmas)</h4>
                   <p className="text-zinc-500 text-[9px] uppercase tracking-widest mt-1 max-w-xs">Notificar a empleados que no han entrado a la academia.</p>
                 </div>
                 <div className="flex items-center gap-3 bg-black/50 p-2 rounded-lg border border-white/5 w-fit">
                    <span className="text-xs font-black text-zinc-500 uppercase">Tras</span>
                    <input type="number" min="3" max="30" value={inactivityDays} onChange={(e) => setInactivityDays(Number(e.target.value))} className="w-12 bg-transparent text-orange-500 font-black text-center outline-none" />
                    <span className="text-xs font-black text-zinc-500 uppercase">Días inactivo</span>
                 </div>
               </div>
            </div>
            
            <button disabled={isLoading} className="w-full bg-orange-500 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50">
              {isLoading ? 'GUARDANDO EN DB...' : 'GUARDAR REGLAS DE ALERTA'}
            </button>
            {successMsg && <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 mt-2"><CheckCircle2 size={14}/> {successMsg}</p>}
          </form>
        )

      case 'auditoria':
        return (
          <div className="space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <header>
              <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                <Activity className="text-emerald-500" /> Radar de Actividad
              </h3>
              <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-widest font-bold mt-1">Status en tiempo real de la base de datos corporativa.</p>
            </header>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
               <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 md:p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                 <Users className="text-emerald-500 mb-2 md:mb-3" size={28} />
                 <h4 className="text-3xl md:text-4xl font-black text-white italic">{dbStats.users}</h4>
                 <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1">Estudiantes Registrados</p>
               </div>
               <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 md:p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                 <Server className="text-emerald-500 mb-2 md:mb-3" size={28} />
                 <h4 className="text-3xl md:text-4xl font-black text-white italic">{dbStats.courses} / {dbStats.modules}</h4>
                 <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1">Cursos / Materiales</p>
               </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs font-bold text-white">Sincronización en vivo con Supabase Cloud</span>
               </div>
            </div>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-center italic">
              *Las analíticas profundas de notas y progreso se encuentran en el Dashboard Principal.
            </p>
          </div>
        )

      case 'empresa':
        return (
          <form onSubmit={handleCorporateSave} className="space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <header>
              <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                <Building className="text-purple-500" /> Marca Blanca
              </h3>
              <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-widest font-bold mt-1">Personaliza el entorno para el cliente final.</p>
            </header>
            
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nombre de la Empresa / Cliente</label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Building size={16} className="text-zinc-600" /></div>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 rounded-xl text-sm text-white outline-none focus:border-purple-500 transition-all font-bold" />
                </div>
              </div>
            </div>
            
            <button disabled={isLoading} className="w-full bg-purple-500 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50">
              {isLoading ? 'APLICANDO MARCA EN DB...' : 'GUARDAR CONFIGURACIÓN DE EMPRESA'}
            </button>
            {successMsg && <p className="text-purple-400 text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 mt-2"><CheckCircle2 size={14}/> {successMsg}</p>}
          </form>
        )
      
      default:
        return (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 p-6 md:p-10">
            <Server size={40} className="text-zinc-700 md:w-12 md:h-12" />
            <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] font-black">Selecciona un panel<br/>para configurar el entorno.</p>
          </div>
        )
    }
  }

  return (
    <div className="h-full w-full animate-in fade-in duration-1000 p-0 sm:p-4 flex flex-col overflow-hidden">
      <div className="flex-1 w-full bg-[#0a0a0a] border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 lg:p-14 shadow-2xl relative overflow-y-auto custom-scrollbar flex flex-col">
        <div className="absolute top-0 right-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-[#00E5FF]/5 blur-[80px] sm:blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col min-h-full space-y-8 max-w-7xl mx-auto w-full pt-2 md:pt-0">
          
          <header className="space-y-2 md:space-y-4">
            <h1 className="text-[2rem] sm:text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-[0.9]">
              SETTINGS <span className="text-zinc-600">B2B</span>
            </h1>
            <p className="text-zinc-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em]">Configuración Maestra Corporativa</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 flex-1">
            
            {/* TARJETAS DE NAVEGACIÓN */}
            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-2 gap-3 md:gap-4 h-fit">
              <button onClick={() => setActiveTab('seguridad')} className={`text-left p-4 md:p-8 border rounded-[1.2rem] md:rounded-[2rem] transition-all duration-300 ${activeTab === 'seguridad' ? 'bg-[#00E5FF]/10 border-[#00E5FF]/50 shadow-[0_0_30px_rgba(0,229,255,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                <Shield className={`${activeTab === 'seguridad' ? 'text-[#00E5FF]' : 'text-[#00E5FF]/70'} mb-3 md:mb-4 w-6 h-6 md:w-7 md:h-7`} />
                <h3 className="text-sm md:text-xl font-black text-white italic tracking-tight">Seguridad</h3>
                <p className="text-[6px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1 md:mt-2">Mando y Claves</p>
              </button>
              <button onClick={() => setActiveTab('notificaciones')} className={`text-left p-4 md:p-8 border rounded-[1.2rem] md:rounded-[2rem] transition-all duration-300 ${activeTab === 'notificaciones' ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                <Bell className={`${activeTab === 'notificaciones' ? 'text-orange-500' : 'text-orange-500/70'} mb-3 md:mb-4 w-6 h-6 md:w-7 md:h-7`} />
                <h3 className="text-sm md:text-xl font-black text-white italic tracking-tight">Alertas</h3>
                <p className="text-[6px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1 md:mt-2">Reglas de Email</p>
              </button>
              <button onClick={() => setActiveTab('auditoria')} className={`text-left p-4 md:p-8 border rounded-[1.2rem] md:rounded-[2rem] transition-all duration-300 ${activeTab === 'auditoria' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                <Activity className={`${activeTab === 'auditoria' ? 'text-emerald-500' : 'text-emerald-500/70'} mb-3 md:mb-4 w-6 h-6 md:w-7 md:h-7`} />
                <h3 className="text-sm md:text-xl font-black text-white italic tracking-tight">Status</h3>
                <p className="text-[6px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1 md:mt-2">Radar de Inactivos</p>
              </button>
              <button onClick={() => setActiveTab('empresa')} className={`text-left p-4 md:p-8 border rounded-[1.2rem] md:rounded-[2rem] transition-all duration-300 ${activeTab === 'empresa' ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                <Building className={`${activeTab === 'empresa' ? 'text-purple-500' : 'text-purple-500/70'} mb-3 md:mb-4 w-6 h-6 md:w-7 md:h-7`} />
                <h3 className="text-sm md:text-xl font-black text-white italic tracking-tight">Cliente</h3>
                <p className="text-[6px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1 md:mt-2">Marca Blanca</p>
              </button>
            </div>

            {/* PANEL DE CONFIGURACIÓN ACTIVO */}
            <div className="lg:col-span-7 bg-[#050505] border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-10 shadow-inner min-h-[350px] md:min-h-[400px]">
              {renderActiveTab()}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
      `}} />
    </div>
  )
}