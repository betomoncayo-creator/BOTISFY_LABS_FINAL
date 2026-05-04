'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Rocket, ChevronRight, Brain, RefreshCw, AlertCircle, Plus } from 'lucide-react'

export default function AcademiaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [courses, setCourse] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login'); return; }

        // CAMBIO CRÍTICO: Usar la tabla 'profiles'
        const { data: userData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (userData) {
          setIsAdmin(userData.role?.toLowerCase() === 'admin')
        }

        const { data: coursesData } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
        if (coursesData) setCourse(coursesData)
      } catch (err) { console.error(err) } finally { setLoading(false) }
    }
    fetchInitialData()
  }, [supabase, router])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-[#00E5FF]"><RefreshCw className="animate-spin" /></div>

  return (
    <div className="w-full space-y-10 pb-20 text-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          {isAdmin && <div className="bg-[#00E5FF]/10 text-[#00E5FF] text-[8px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full w-fit border border-[#00E5FF]/20 mb-4">Panel Administrativo</div>}
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">Neural <span className="text-[#00E5FF]">Academy</span></h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] ml-1">{isAdmin ? 'Gestión de Contenidos' : 'Tu centro de aprendizaje neural'}</p>
        </div>
        <div className="bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl flex items-center gap-6">
           <div className="flex flex-col items-end"><span className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Cursos Activos</span><span className="text-white font-black italic text-xl">TOTAL: {courses.length}</span></div>
           <div className="w-10 h-10 bg-[#00E5FF]/10 rounded-xl flex items-center justify-center text-[#00E5FF]"><Brain size={20} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {courses.map((course) => (
          <div key={course.id} className="bg-[#050505] border border-white/5 p-8 rounded-[3rem] flex flex-col justify-between hover:border-white/10 transition-all">
            <div className="space-y-6">
              <div className="w-full aspect-video bg-white/5 rounded-[2rem] flex items-center justify-center relative border border-white/5 overflow-hidden">
                 <Rocket className="text-[#00E5FF]/20 absolute" size={80} />
                 <div className="w-16 h-16 bg-[#00E5FF]/10 rounded-full flex items-center justify-center text-[#00E5FF] z-10"><Rocket size={32} /></div>
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{course.title}</h3>
            </div>
            <button 
              onClick={() => router.push(`/dashboard/academia/${course.id}`)}
              className="w-full mt-8 bg-white/5 border border-white/5 hover:bg-[#00E5FF] hover:text-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 group"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isAdmin ? 'Gestionar Módulos' : 'Iniciar Curso'}</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}
        {isAdmin && (
          <button className="border-2 border-dashed border-white/5 rounded-[3rem] p-12 flex flex-col items-center justify-center gap-4 text-zinc-700 hover:border-[#00E5FF]/40 hover:text-[#00E5FF] transition-all"><Plus size={32} /><p className="font-black italic uppercase text-xl text-white">Nuevo Curso</p></button>
        )}
      </div>
    </div>
  )
}