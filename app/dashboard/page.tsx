'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  BookOpen, Trophy, Zap, ChevronRight, LayoutGrid, 
  UserCheck, Calendar, Rocket, ArrowRight, User, Pencil, X, CheckCircle2 
} from 'lucide-react'

export default function DashboardPage() {
  const [role, setRole] = useState('CARGANDO...')
  const [userName, setUserName] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Estados para formularios
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [editedName, setEditedName] = useState('')

  const supabase = createClient()

  const stats = [
    { label: 'CURSOS ACTIVOS', value: '04', icon: BookOpen },
    { label: 'PUNTOS POSIBLES', value: '00', icon: Zap },
    { label: 'RANGO ACTUAL', value: 'Master', icon: Trophy },
  ]

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role, onboarding_completed')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setRole(data.role.toUpperCase())
        setUserName(data.full_name || '')
        setEditedName(data.full_name || '')
        
        if (data.role === 'estudiante' && !data.onboarding_completed) {
          setShowOnboarding(true)
        }
      }
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // Guardar Onboarding Inicial
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    const fullName = `${firstName} ${lastName}`.trim()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('profiles').update({ full_name: fullName, onboarding_completed: true }).eq('id', user.id)
      if (!error) { setUserName(fullName); setShowOnboarding(false); }
    }
    setIsUpdating(false)
  }

  // Guardar Edición de Perfil posterior
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('profiles').update({ full_name: editedName }).eq('id', user.id)
      if (!error) {
        setUserName(editedName)
        setIsEditModalOpen(false)
      }
    }
    setIsUpdating(false)
  }

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).toUpperCase()

  return (
    <div className="h-full w-full animate-in fade-in duration-1000 p-0 sm:p-4 flex flex-col overflow-hidden relative">
      
      {/* 1. MODAL DE ONBOARDING (Solo primera vez) */}
      {showOnboarding && (
        <div className="absolute inset-0 z-[100] bg-black flex items-center justify-center p-4 sm:p-8 animate-in zoom-in duration-500">
          <div className="max-w-2xl w-full space-y-12 text-center">
            <div className="w-20 h-20 bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
              <Rocket className="text-[#00E5FF]" size={36} />
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">BIENVENIDO A <br/><span className="text-[#00E5FF]">BOTISFY LABS</span></h1>
            <form onSubmit={handleOnboardingSubmit} className="space-y-4 max-w-lg mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required placeholder="NOMBRE" className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-white font-bold outline-none focus:border-[#00E5FF]" value={firstName} onChange={e => setFirstName(e.target.value)} />
                <input required placeholder="APELLIDO" className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-white font-bold outline-none focus:border-[#00E5FF]" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <button disabled={isUpdating} className="w-full bg-white text-black font-black py-6 rounded-2xl uppercase text-[11px] tracking-[0.5em] hover:bg-[#00E5FF] transition-all">ENTRAR A LA ACADEMIA</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL DE EDICIÓN DE PERFIL (Opción B) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-[#050505] border border-white/10 p-10 rounded-[3rem] relative shadow-2xl">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X size={20}/></button>
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                <User className="text-[#00E5FF]" /> Editar Perfil
              </h2>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input 
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-[#00E5FF] transition-all" 
                  value={editedName} 
                  onChange={e => setEditedName(e.target.value)} 
                />
              </div>
              <button 
                onClick={handleUpdateProfile}
                disabled={isUpdating} 
                className="w-full bg-[#00E5FF] text-black font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-[#00E5FF]/10 disabled:opacity-50"
              >
                {isUpdating ? 'GUARDANDO...' : 'ACTUALIZAR IDENTIDAD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DASHBOARD PRINCIPAL */}
      <div className="flex-1 w-full bg-[#0a0a0a] border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 lg:p-14 shadow-2xl relative overflow-y-auto custom-scrollbar">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00E5FF]/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-center min-h-full space-y-10 max-w-7xl mx-auto pt-4 md:pt-0">
          <header className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
               <div className="flex items-center gap-2 bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-5 py-2.5 rounded-full">
                  <UserCheck size={14} className="text-[#00E5FF]" />
                  <span className="text-[10px] font-black text-[#00E5FF] uppercase tracking-[0.3em] italic">SESIÓN: {role}</span>
               </div>
               <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-zinc-400">
                  <Calendar size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">{fechaHoy}</span>
               </div>
            </div>
            
            <div className="group relative w-fit">
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white italic tracking-tighter uppercase leading-[0.9] break-words">
                BIENVENIDO,<br />
                <span className="text-zinc-500">{userName.split(' ')[0] || 'FREDDY'}</span>
              </h1>
              {/* BOTÓN DE EDICIÓN */}
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="absolute -right-12 top-0 md:-right-16 bg-white/5 p-3 rounded-xl border border-white/10 text-zinc-600 hover:text-[#00E5FF] hover:border-[#00E5FF]/50 transition-all opacity-0 group-hover:opacity-100"
                title="Editar Nombre"
              >
                <Pencil size={20} />
              </button>
            </div>
          </header>

          {/* GRID DE STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="group p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:border-[#00E5FF]/20 transition-all duration-500 relative overflow-hidden">
                 <stat.icon className="absolute right-6 bottom-6 text-white/5 scale-[2.5] group-hover:text-[#00E5FF]/10 transition-colors" size={40} />
                 <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3 italic">{stat.label}</p>
                 <h3 className="text-4xl font-black text-white italic tracking-tighter">{stat.value}</h3>
              </div>
            ))}
          </div>

          {/* CURSOS */}
          <div className="space-y-6">
             <div className="flex items-center gap-5">
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Cursos <span className="text-[#00E5FF]">Academy</span></h2>
                <div className="h-[1px] flex-1 bg-white/10"></div>
             </div>
             <div className="group p-6 bg-white/[0.01] border border-white/5 rounded-[2rem] flex items-center justify-between hover:bg-white/[0.03] transition-all cursor-pointer border-l-4 border-l-[#00E5FF]/40">
                <div className="flex items-center gap-6">
                   <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-[#00E5FF]/50 transition-colors">
                      <LayoutGrid className="text-[#00E5FF]" size={20} />
                   </div>
                   <div>
                      <h4 className="text-white font-bold text-base tracking-tight uppercase italic">Automatización con Inteligencia Artificial</h4>
                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-1">Botisfy Labs • Especialización Corporativa</p>
                   </div>
                </div>
                <ChevronRight className="text-zinc-700 group-hover:text-[#00E5FF] group-hover:translate-x-1 transition-all" />
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