'use client'
import { useState } from 'react'
import Link from 'next/link'
import { 
  Plus, Play, Settings2, Info, ChevronRight, X, Save
} from 'lucide-react'

export default function AcademiaPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
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
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* HEADER (Se mantiene igual) */}
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

      {/* GUÍA (Se mantiene igual) */}
      <div className="bg-[#050505] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
        <Info size={16} className="text-[#00E5FF]" />
        <p className="text-zinc-400 text-[10px] leading-snug font-medium">
          Gestiona el contenido educativo haciendo clic en <span className="text-[#00E5FF] font-bold uppercase">Gestionar Módulos</span>.
        </p>
      </div>

      {/* GRID DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pt-2">
        {courses.map((course) => (
          <div key={course.id} className="group bg-[#050505] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col transition-all hover:border-[#00E5FF]/20 hover:translate-y-[-4px]">
            <div className="aspect-[16/10] bg-white/5 flex items-center justify-center relative">
              <Play size={18} className="text-[#00E5FF] ml-1 fill-[#00E5FF]/20" />
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-white text-xl font-black italic uppercase tracking-tighter mb-3 leading-tight">{course.title}</h3>
              <p className="text-zinc-500 text-[10px] font-medium leading-relaxed mb-6">{course.description}</p>
              <Link 
                href={`/dashboard/academia/${course.id}`}
                className="w-full mt-auto bg-white/5 hover:bg-[#00E5FF] text-zinc-400 hover:text-black py-4 rounded-xl font-black text-[9px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all border border-white/10"
              >
                Gestionar Módulos <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        ))}

        {/* ➕ NUEVO CURSO: Dispara el Modal */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-transparent border-2 border-dashed border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 min-h-[320px] transition-all hover:border-[#00E5FF]/30 group hover:bg-white/[0.01]"
        >
          <Plus size={24} className="text-zinc-700 group-hover:text-[#00E5FF]" />
          <div className="text-center">
            <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-1">Nuevo Curso</h3>
            <p className="text-zinc-700 text-[7px] font-bold uppercase tracking-widest">Añadir Nodo Educativo</p>
          </div>
        </button>
      </div>

      {/* 🛡️ MODAL: REGISTRO DE NUEVO CURSO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#050505] border border-white/10 p-10 rounded-[3rem] w-full max-w-xl shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X size={20} /></button>
            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-8">
              Crear <span className="text-[#00E5FF]">Nuevo Nodo</span>
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest ml-4">Nombre del Curso</label>
                <input type="text" placeholder="EJ: MASTER EN IA..." className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-xs font-bold focus:border-[#00E5FF] outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest ml-4">Descripción Breve</label>
                <textarea rows={3} placeholder="RESUMEN DEL CURRÍCULO..." className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-xs font-bold focus:border-[#00E5FF] outline-none transition-all resize-none" />
              </div>
              <button className="w-full bg-[#00E5FF] text-black py-5 rounded-2xl font-black text-[10px] tracking-[0.4em] uppercase flex items-center justify-center gap-3 hover:scale-[1.02] transition-all">
                <Save size={18} /> Registrar Curso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}