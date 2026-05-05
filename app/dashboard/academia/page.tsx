'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { RefreshCw, ChevronRight, GraduationCap } from 'lucide-react'

export default function AcademiaPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [navigatingId, setNavigatingId] = useState<string | null>(null) // Feedback de carga
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
      if (data) setCourses(data)
      setLoading(false)
    }
    fetchCourses()
  }, [supabase])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#00E5FF]">
      <RefreshCw className="animate-spin mb-4" size={30} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Cargando Academia...</p>
    </div>
  )

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-white text-6xl font-black italic uppercase tracking-tighter leading-none">
            Neural <span className="text-[#00E5FF]">Academy</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Tu centro de aprendizaje neural</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-6">
          <div className="text-right">
            <p className="text-zinc-500 text-[8px] font-black uppercase">Cursos Activos</p>
            <p className="text-white text-2xl font-black italic">TOTAL: {courses.length}</p>
          </div>
          <div className="p-3 bg-[#00E5FF]/10 rounded-2xl text-[#00E5FF]"><GraduationCap /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <div key={course.id} className="bg-[#050505] border border-white/5 p-8 rounded-[3rem] group hover:border-[#00E5FF]/30 transition-all space-y-6">
            <div className="aspect-video bg-zinc-900/50 rounded-[2rem] flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <GraduationCap size={40} className="text-zinc-800 group-hover:text-[#00E5FF] transition-colors" />
            </div>
            <h3 className="text-white text-xl font-black italic uppercase tracking-tight line-clamp-2">{course.title}</h3>
            
            <button 
              onClick={() => {
                setNavigatingId(course.id) // Feedback instantáneo
                router.push(`/dashboard/academia/${course.id}`)
              }}
              disabled={navigatingId !== null}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-3 ${
                navigatingId === course.id ? 'bg-[#00E5FF] text-black' : 'bg-zinc-900/50 text-white hover:bg-[#00E5FF] hover:text-black'
              }`}
            >
              {navigatingId === course.id ? (
                <>Sincronizando Nodo... <RefreshCw className="animate-spin" size={14} /></>
              ) : (
                <>Iniciar Curso <ChevronRight size={14} /></>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}