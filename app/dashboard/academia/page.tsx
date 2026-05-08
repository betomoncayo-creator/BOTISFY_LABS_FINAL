'use client'
import { useState, useEffect, useCallback } from 'react'
import db from '../../../lib/database'
import { useRouter } from 'next/navigation'
import { RefreshCw, ChevronRight, GraduationCap, Upload, X, Plus, Edit, Clock } from 'lucide-react'

export default function AcademiaPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const session = await db.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        const userData = await db.getProfile(session.user.id)
        const realIsAdmin = userData?.role?.toLowerCase() === 'admin'
        setIsAdmin(realIsAdmin)

        const coursesData = await db.getCoursesByRole(session.user.id, userData?.role)
        setCourses(coursesData)
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [router])

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* HEADER */}
      <div className="bg-[#050505] border border-white/5 p-8 md:p-12 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00E5FF]/5 blur-[120px] -mr-40 -mt-40 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black italic text-white tracking-tighter uppercase">
              <span className="text-[#00E5FF]">🎓</span> Academia
            </h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em]">
              {isAdmin ? 'Gestión de Cursos' : 'Mis Cursos'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => router.push('/dashboard/academia/new')}
              className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all w-fit"
            >
              <Plus size={16} /> Nuevo Curso
            </button>
          )}
        </div>
      </div>

      {/* GRID DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <RefreshCw className="animate-spin text-[#00E5FF] mx-auto" size={32} />
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-20 text-center text-zinc-600 text-[9px] font-black uppercase tracking-widest">
            {isAdmin ? 'No hay cursos. Crea uno para empezar.' : 'No tienes cursos asignados aún.'}
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              onClick={() => router.push(`/dashboard/academia/${course.id}`)}
              className="group bg-[#050505] border border-white/5 rounded-[2rem] overflow-hidden hover:border-[#00E5FF]/30 transition-all cursor-pointer"
            >
              {/* IMAGEN DEL CURSO */}
              <div className="w-full h-40 bg-gradient-to-br from-[#00E5FF]/10 to-purple-600/10 flex items-center justify-center relative overflow-hidden">
                {course.image_url ? (
                  <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                ) : (
                  <GraduationCap size={48} className="text-[#00E5FF]/40" />
                )}
              </div>

              {/* CONTENIDO */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-white font-black uppercase italic text-sm tracking-tight mb-2 group-hover:text-[#00E5FF] transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-zinc-600 text-[9px] font-bold line-clamp-2">
                    {course.description || 'Sin descripción'}
                  </p>
                </div>

                {course.duration_minutes && (
                  <div className="flex items-center gap-2 text-[#00E5FF] text-[10px] font-black uppercase">
                    <Clock size={14} />
                    {Math.round(course.duration_minutes / 60)} horas
                  </div>
                )}

                <button className="w-full py-3 bg-[#00E5FF] text-black rounded-xl font-black uppercase text-[10px] hover:bg-[#00D4EE] transition-all flex items-center justify-center gap-2 group-hover:gap-3">
                  Ver Curso <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}