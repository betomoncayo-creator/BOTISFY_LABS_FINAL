'use client'
import { useContext, useEffect, useState } from 'react'
import { UserContext } from '../../lib/context'
import { createClient } from '../../lib/supabase'
import { 
  Users, Zap, Clock, Award, BookOpen, Activity, 
  UserPlus, BookMarked, Shield, RefreshCw 
} from 'lucide-react'

export default function DashboardPage() {
  const { profile } = useContext(UserContext)
  const [stats, setStats] = useState({
    activeUsers: 0,
    completionRate: 0,
    trainingHours: 0,
    certificates: 0,
    loading: true
  })
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [myProgress, setMyProgress] = useState<any[]>([])

  const userRole = profile?.role?.toLowerCase().trim() || 'estudiante'
  const isAdmin = userRole === 'admin'

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient()

      if (isAdmin) {
        try {
          const { count: usersCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })

          const { count: totalProgress } = await supabase
            .from('student_progress')
            .select('*', { count: 'exact', head: true })

          const { count: completedCount } = await supabase
            .from('student_progress')
            .select('*', { count: 'exact', head: true })
            .eq('is_completed', true)

          const completionRate = totalProgress && totalProgress > 0
            ? Math.round((completedCount || 0) * 100 / totalProgress)
            : 0

          let trainingHours = 0
          const { data: completedRows } = await supabase
            .from('student_progress')
            .select('course_id')
            .eq('is_completed', true)

          if (completedRows && completedRows.length > 0) {
            const { data: allCourses } = await supabase
              .from('courses')
              .select('id, duration_minutes')

            if (allCourses) {
              const completedIds = completedRows.map((r: any) => String(r.course_id))
              const matched = allCourses.filter((c: any) =>
                completedIds.includes(String(c.id))
              )
              const totalMinutes = matched.reduce(
                (acc: number, c: any) => acc + (c.duration_minutes || 0), 0
              )
              trainingHours = Math.round(totalMinutes / 60)
            }
          }

          const { data: logs } = await supabase
            .from('profiles')
            .select('full_name, role, updated_at')
            .order('updated_at', { ascending: false })
            .limit(3)

          setStats({
            activeUsers: usersCount || 0,
            completionRate,
            trainingHours,
            certificates: completedCount || 0,
            loading: false
          })
          setRecentLogs(logs || [])

        } catch (err) {
          console.error('Error fetching admin data:', err)
          setStats(s => ({ ...s, loading: false }))
        }

      } else {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) return

          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('profile_id', session.user.id)

          if (!enrollments || enrollments.length === 0) {
            setMyProgress([])
            setStats(s => ({ ...s, loading: false }))
            return
          }

          const enrolledCourseIds = enrollments.map((e: any) => String(e.course_id))

          const { data: progressRows } = await supabase
            .from('student_progress')
            .select('*')
            .eq('profile_id', session.user.id)

          const { data: allCourses } = await supabase
            .from('courses')
            .select('id, title, duration_minutes, image_url')

          const enrolledCourses = (allCourses || []).filter((c: any) =>
            enrolledCourseIds.includes(String(c.id))
          )

          const merged = enrolledCourses.map((course: any) => {
            const progress = (progressRows || []).find(
              (p: any) => String(p.course_id) === String(course.id)
            )
            return {
              course_id: course.id,
              current_score: progress?.current_score || 0,
              is_completed: progress?.is_completed || false,
              completed_at: progress?.completed_at || null,
              courses: course
            }
          })

          setMyProgress(merged)
          setStats(s => ({ ...s, loading: false }))

        } catch (err) {
          console.error('Error fetching student data:', err)
          setStats(s => ({ ...s, loading: false }))
        }
      }
    }

    if (profile) fetchDashboardData()
  }, [isAdmin, profile])

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">

      {/* HEADER */}
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
        <div className="relative z-10 bg-white/5 border border-white/10 px-8 py-6 rounded-[2rem] flex items-center gap-4 backdrop-blur-md self-start md:self-center">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            isAdmin 
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
              : 'bg-green-500/10 border-green-500/20 text-green-400'
          }`}>
            <Shield size={18} />
          </div>
          <div>
            <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest">Rol</p>
            <p className="text-white text-[11px] font-black uppercase tracking-tighter">
              {isAdmin ? 'Admin' : 'Estudiante'}
            </p>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <>
          {/* MÉTRICAS ADMIN */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Colaboradores Activos', value: stats.activeUsers, icon: Users, color: 'text-blue-400' },
              { label: 'Tasa de Finalización', value: `${stats.completionRate}%`, icon: Zap, color: 'text-purple-400' },
              { label: 'Horas Capacitación', value: stats.trainingHours, icon: Clock, color: 'text-yellow-400' },
              { label: 'Certificados Emitidos', value: stats.certificates, icon: Award, color: 'text-green-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#050505] border border-white/5 p-8 rounded-[2.5rem]">
                <stat.icon className={`${stat.color} mb-6 opacity-40`} size={20} />
                <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                <p className="text-white text-3xl font-black italic tracking-tighter">
                  {stats.loading
                    ? <RefreshCw className="animate-spin" size={20} />
                    : stat.value
                  }
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ACCIONES */}
            <div className="space-y-6">
              <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] ml-4">Acciones</p>
              <div className="space-y-4">
                <button
                  onClick={() => window.location.href = '/dashboard/usuarios'}
                  className="w-full bg-[#050505] border border-white/5 p-6 rounded-3xl flex items-center gap-6 group hover:border-[#00E5FF]/30 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-[#00E5FF]/10 rounded-2xl flex items-center justify-center text-[#00E5FF] group-hover:scale-110 transition-transform">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <p className="text-white text-[11px] font-black uppercase tracking-widest">Invitar Colaborador</p>
                    <p className="text-zinc-600 text-[9px] font-bold uppercase mt-1">Añadir nuevo acceso</p>
                  </div>
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard/academia'}
                  className="w-full bg-[#050505] border border-white/5 p-6 rounded-3xl flex items-center gap-6 group hover:border-purple-500/30 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <BookMarked size={20} />
                  </div>
                  <div>
                    <p className="text-white text-[11px] font-black uppercase tracking-widest">Gestionar Cursos</p>
                    <p className="text-zinc-600 text-[9px] font-bold uppercase mt-1">Administrar academia</p>
                  </div>
                </button>
              </div>
            </div>

            {/* REGISTROS RECIENTES */}
            <div className="lg:col-span-2 space-y-6">
              <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] ml-4">Registros Recientes</p>
              <div className="bg-[#050505] border border-white/5 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="p-6 text-zinc-700 text-[8px] font-black uppercase tracking-widest">Colaborador</th>
                      <th className="p-6 text-zinc-700 text-[8px] font-black uppercase tracking-widest text-right">Última Actividad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {recentLogs.length > 0 ? recentLogs.map((reg, i) => (
                      <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="p-6 flex items-center gap-4">
                          <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-[10px] font-black text-zinc-500 border border-white/5 group-hover:border-[#00E5FF]/20 transition-all">
                            {reg.full_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-[10px] font-black uppercase tracking-tight">{reg.full_name}</p>
                            <p className="text-zinc-600 text-[8px] font-bold uppercase">{reg.role}</p>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">
                            {new Date(reg.updated_at).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={2} className="p-10 text-center text-zinc-600 text-[9px] uppercase font-bold tracking-widest">
                          No hay registros aún
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* VISTA ESTUDIANTE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#050505] border border-white/5 p-10 rounded-[3rem]">
              <h3 className="text-white text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                <BookOpen size={20} className="text-[#00E5FF]" /> Mis Cursos Activos
              </h3>
              {stats.loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="animate-spin text-[#00E5FF]" size={24} />
                </div>
              ) : myProgress.length > 0 ? (
                <div className="space-y-4">
                  {myProgress.map((item, i) => {
                    const pct = item.is_completed ? 100 : Math.min(item.current_score || 0, 100)
                    return (
                      <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-[#00E5FF]/30 transition-all cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/academia/${item.course_id}`}>
                        <p className="text-white text-sm font-black italic uppercase tracking-tight">
                          {item.courses?.title || 'Curso'}
                        </p>
                        <div className="mt-4">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                            <span className="text-zinc-500">Progreso</span>
                            <span className="text-[#00E5FF]">{pct}%</span>
                          </div>
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#00E5FF] h-full rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest text-center py-8">
                  No tienes cursos asignados aún
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#050505] border border-white/5 p-8 rounded-[2.5rem]">
              <Activity size={18} className="text-[#00E5FF] mb-4 opacity-50" />
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Cursos Completados</p>
              <p className="text-white text-3xl font-black italic tracking-tighter">
                {myProgress.filter(p => p.is_completed).length}
              </p>
            </div>
            <div className="bg-[#050505] border border-white/5 p-8 rounded-[2.5rem]">
              <Award size={18} className="text-green-400 mb-4 opacity-50" />
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Certificados</p>
              <p className="text-white text-3xl font-black italic tracking-tighter">
                {myProgress.filter(p => p.is_completed).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}