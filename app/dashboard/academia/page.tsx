'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  Plus, 
  Play, 
  Settings2, 
  Info, 
  ChevronRight
} from 'lucide-react'

export default function AcademiaPage() {
  const [courses] = useState([
    {
      id: '1',
      title: 'AUTOMATIZACIÓN CON IA 101',
      category: 'INTELIGENCIA ARTIFICIAL',
      description: 'Aprende a crear agentes inteligentes para procesos corporativos con Botisfy.',
      image: null
    }
  ])

  return (
    /* Reducimos el espacio global de space-y-8 a space-y-6 para mayor densidad visual */
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      
      {/* ⚡ HEADER COMPACTO */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#00E5FF]/10 text-[#00E5FF] text-[7px] px-2 py-0.5 rounded-md font-black uppercase tracking-[0.2em] border border-[#00E5FF]/20">
              Modo Editor Activo
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black italic text-white tracking-tighter uppercase leading-none">
            Neural <span className="text-[#00E5FF]">Academy</span>
          </h1>
          <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-2">Curriculum Management v1.0</p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 px-5 py-3 rounded-2xl border border-white/10 self-start sm:self-auto">
          <Settings2 size={14} className="text-[#00E5FF]" />
          <div className="leading-tight">
            <p className="text-zinc-600 text-[7px] font-black uppercase tracking-widest">Nodos Activos</p>
            <p className="text-white text-xs font-black uppercase tracking-tighter italic">Total: {courses.length}</p>
          </div>
        </div>
      </div>

      {/* 📘 GUÍA DE GESTIÓN (Movida hacia arriba mediante reducción de gap) */}
      <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:border-[#00E5FF]/20 transition-all">
        <div className="w-8 h-8 bg-[#00E5FF]/10 rounded-lg flex items-center justify-center text-[#00E5FF] shrink-0 border border-[#00E5FF]/20 shadow-[0_0_15px_rgba(0,229,255,0.05)]">
          <Info size={16} />
        </div>
        <p className="text-zinc-400 text-[10px] leading-snug font-medium">
          Gestiona el contenido educativo haciendo clic en <span className="text-[#00E5FF] font-bold uppercase">Gestionar Módulos</span> para editar lecciones y material de estudio.
        </p>
      </div>

      {/* 🎴 GRID DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pt-2">
        
        {courses.map((course) => (
          <div key={course.id} className="group bg-[#050505] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col transition-all hover:border-[#00E5FF]/20 hover:translate-y-[-4px]">
            {/* THUMBNAIL */}
            <div className="aspect-[16/10] bg-white/5 flex items-center justify-center relative">
              <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500">
                <Play size={18} className="text-[#00E5FF] ml-1 fill-[#00E5FF]/20" />
              </div>
              <div className="absolute top-4 left-4">
                <span className="bg-[#00E5FF] text-black text-[7px] px-2 py-1 rounded-md font-black uppercase tracking-widest">
                  {course.category}
                </span>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-white text-xl font-black italic uppercase tracking-tighter mb-3 leading-tight">
                {course.title}
              </h3>
              <p className="text-zinc-500 text-[10px] font-medium leading-relaxed mb-6">
                {course.description}
              </p>

              <button className="w-full mt-auto bg-white/5 hover:bg-[#00E5FF] text-zinc-400 hover:text-black py-4 rounded-xl font-black text-[9px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all border border-white/10 hover:border-[#00E5FF]">
                Gestionar Módulos <ChevronRight size={12} />
              </button>
            </div>
          </div>
        ))}

        {/* ➕ NUEVA ESPECIALIZACIÓN */}
        <button className="bg-transparent border-2 border-dashed border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 min-h-[320px] transition-all hover:border-[#00E5FF]/30 group hover:bg-white/[0.01]">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-zinc-700 group-hover:text-[#00E5FF] group-hover:bg-[#00E5FF]/10 transition-all border border-transparent group-hover:border-[#00E5FF]/20">
            <Plus size={24} />
          </div>
          <div className="text-center">
            <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-1">Nueva Especialización</h3>
            <p className="text-zinc-700 text-[7px] font-bold uppercase tracking-widest">Añadir Nodo Educativo</p>
          </div>
        </button>

      </div>
    </div>
  )
}