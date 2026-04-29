'use client'
import { useState, useEffect, useContext } from 'react'
import { createClient } from '@/lib/supabase'
import { UserContext } from '@/lib/context'
import { 
  Play, 
  BookOpen, 
  Settings, 
  Plus, 
  Trophy, 
  LayoutGrid, 
  FileEdit,
  Eye
} from 'lucide-react'
import Link from 'next/link'

export default function AcademiaPage() {
  const { profile } = useContext(UserContext)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    async function fetchCourses() {
      const { data } = await supabase.from('courses').select('*')
      if (data) setCourses(data)
      setLoading(false)
    }
    fetchCourses()
  }, [supabase])

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER DINÁMICO SEGÚN ROL */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter uppercase leading-none">
            Neural <span className="text-[#00E5FF]">Academy</span>
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] ml-1">
              {isAdmin ? "PANEL DE CONTROL DE CURRICULUM" : "HUB DE ESPECIALIZACIÓN CORPORATIVA"}
            </p>
            {isAdmin && (
              <span className="bg-[#00E5FF]/10 text-[#00E5FF] px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-[#00E5FF]/20">
                MODO EDITOR ACTIVO
              </span>
            )}
          </div>
        </div>

        {/* CONTADOR DE CURSOS */}
        <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl flex items-center gap-4">
          <LayoutGrid size={16} className="text-[#00E5FF]" />
          <span className="text-white text-[11px] font-black uppercase tracking-widest">
            CURSOS: {courses.length}
          </span>
        </div>
      </div>

      {/* GUÍA RÁPIDA PARA ADMIN (No Técnico) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-[#00E5FF]/10 to-transparent border-l-4 border-[#00E5FF] p-6 rounded-r-3xl">
          <h3 className="text-white text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
            <Settings size={14} /> Guía de Gestión
          </h3>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
            Desde aquí puedes gestionar el contenido educativo. Haz clic en <span className="text-[#00E5FF] font-bold">GESTIONAR MÓDULOS</span> para editar lecciones, cambiar videos o actualizar el material de estudio de cada especialización.
          </p>
        </div>
      )}

      {/* GRID DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <div key={course.id} className="group bg-[#050505] border border-white/5 rounded-[3rem] overflow-hidden hover:border-[#00E5FF]/20 transition-all duration-500 flex flex-col shadow-2xl relative">
            
            {/* MINIATURA CON OVERLAY */}
            <div className="aspect-video bg-zinc-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                <Play size={48} className="text-[#00E5FF] opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute top-6 left-6 z-20">
                <span className="bg-[#00E5FF]/20 backdrop-blur-md text-[#00E5FF] px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-[#00E5FF]/30">
                  {course.category || 'ESPECIALIZACIÓN'}
                </span>
              </div>
            </div>

            {/* CUERPO DEL CURSO */}
            <div className="p-10 flex-1 flex flex-col">
              <div className="flex-1 space-y-4 mb-8">
                <h2 className="text-white text-2xl font-black italic tracking-tighter uppercase leading-tight">
                  {course.title}
                </h2>
                <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3">
                  {course.description}
                </p>
              </div>

              {/* BOTÓN DINÁMICO */}
              <Link href={`/dashboard/academia/${course.id}`} className="w-full">
                <button className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 group 
                  ${isAdmin 
                    ? 'bg-[#00E5FF] text-black shadow-lg shadow-[#00E5FF]/20 hover:scale-[1.02]' 
                    : 'bg-white/5 hover:bg-white/10 text-white'}`}>
                  {isAdmin ? (
                    <>GESTIONAR MÓDULOS <FileEdit size={16} /></>
                  ) : (
                    <>COMENZAR APRENDIZAJE <BookOpen size={16} /></>
                  )}
                </button>
              </Link>
            </div>
          </div>
        ))}

        {/* TARJETA DE AGREGAR (SOLO ADMIN) */}
        {isAdmin && (
          <button className="border-2 border-dashed border-white/5 rounded-[3rem] p-10 flex flex-col items-center justify-center gap-6 hover:border-[#00E5FF]/30 hover:bg-[#00E5FF]/5 transition-all group">
            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={32} className="text-[#00E5FF]" />
            </div>
            <div className="text-center">
              <p className="text-white text-[11px] font-black uppercase tracking-[0.3em]">Nueva Especialización</p>
              <p className="text-zinc-600 text-[8px] mt-2 font-bold uppercase">Añadir nodo educativo</p>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}