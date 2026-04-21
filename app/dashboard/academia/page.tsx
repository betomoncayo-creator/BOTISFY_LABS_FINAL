'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import {
  Play,
  BookOpen,
  Plus,
  X,
  Loader2,
  Trophy,
  MoreVertical,
  Edit2,
  EyeOff,
  Eye,
  Trash2,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

export default function AcademiaPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Estados para el Modal (Crear y Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Estado para el menú de 3 puntitos
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchInitialData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let userIsAdmin = false;

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile && profile.role === 'admin') {
          userIsAdmin = true;
          setIsAdmin(true);
        }
      }

      // Si es admin ve todo. Si es estudiante, solo ve los que no están ocultos.
      let query = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      if (!userIsAdmin) {
        query = query.eq('is_hidden', false);
      }

      const { data: coursesData } = await query;
      if (coursesData) setCourses(coursesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // ==========================================
  // FUNCIONES DE GESTIÓN (ADMIN)
  // ==========================================

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      if (editingCourseId) {
        // MODO EDICIÓN
        await supabase
          .from('courses')
          .update({ title: newTitle, description: newDescription })
          .eq('id', editingCourseId);
      } else {
        // MODO CREACIÓN
        await supabase
          .from('courses')
          .insert([{ title: newTitle, description: newDescription }]);
      }

      closeModal();
      fetchInitialData();
    } catch (error) {
      alert('Error al procesar el curso');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('🛑 ¿CUIDADO: Eliminar este curso y todo su contenido?'))
      return;
    try {
      await supabase.from('courses').delete().eq('id', id);
      fetchInitialData();
    } catch (error) {
      alert('Error al eliminar el curso');
    }
  };

  const handleToggleHide = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('courses')
        .update({ is_hidden: !currentStatus })
        .eq('id', id);
      fetchInitialData();
    } catch (error) {
      alert('Error al cambiar visibilidad');
    }
    setMenuOpenId(null);
  };

  // ==========================================
  // UTILIDADES
  // ==========================================

  const openEditModal = (course: any) => {
    setEditingCourseId(course.id);
    setNewTitle(course.title);
    setNewDescription(course.description || '');
    setIsModalOpen(true);
    setMenuOpenId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourseId(null);
    setNewTitle('');
    setNewDescription('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString)
      .toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .toUpperCase();
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-[#00E5FF]" size={40} />
        <p className="text-zinc-500 font-black text-[10px] tracking-[0.5em] uppercase italic">
          Cargando Hub...
        </p>
      </div>
    );

  return (
    <div className="animate-in fade-in duration-700 space-y-12 pb-10">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase">
            Neural <span className="text-[#00E5FF]">Academy</span>
          </h1>
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em] italic opacity-60">
            Botisfy Labs | Hub de Especialización Corporativa
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-zinc-400">
            <Trophy size={14} className="text-[#00E5FF]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Cursos: {courses.length}
            </span>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                closeModal();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-[#00E5FF] transition-all shadow-xl shadow-black/40 active:scale-95"
            >
              <Plus size={14} /> Crear Curso
            </button>
          )}
        </div>
      </header>

      {/* GRID DE CURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 relative z-10">
        {courses.map((course) => (
          <div
            key={course.id}
            className={`bg-[#050505] border border-white/5 rounded-[2.5rem] overflow-visible group hover:border-[#00E5FF]/20 transition-all flex flex-col relative ${
              course.is_hidden ? 'opacity-70 grayscale-[0.3]' : ''
            }`}
          >
            {/* ETIQUETA DE OCULTO (Solo visible para Admin) */}
            {course.is_hidden && isAdmin && (
              <span className="absolute top-4 left-4 z-20 px-4 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 shadow-xl">
                <EyeOff size={12} /> Oculto al público
              </span>
            )}

            {/* MENÚ DE 3 PUNTITOS (Solo Admin) */}
            {isAdmin && (
              <div className="absolute top-4 right-4 z-30">
                <button
                  onClick={() =>
                    setMenuOpenId(menuOpenId === course.id ? null : course.id)
                  }
                  className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white/50 hover:text-white border border-white/10 hover:border-white/30 transition-all shadow-xl"
                >
                  <MoreVertical size={18} />
                </button>

                {/* Dropdown Menu */}
                {menuOpenId === course.id && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setMenuOpenId(null)}
                    ></div>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-30 animate-in zoom-in-95 duration-200">
                      <button
                        onClick={() => openEditModal(course)}
                        className="w-full text-left px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                      >
                        <Edit2 size={14} /> Editar Detalles
                      </button>
                      <button
                        onClick={() =>
                          handleToggleHide(course.id, course.is_hidden)
                        }
                        className="w-full text-left px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                      >
                        {course.is_hidden ? (
                          <>
                            <Eye size={14} /> Publicar
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} /> Ocultar
                          </>
                        )}
                      </button>
                      <div className="h-[1px] bg-white/5 my-1"></div>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="w-full text-left px-5 py-3 text-[10px] uppercase tracking-widest font-black text-red-500/80 hover:text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Cabecera visual del Card */}
            <div className="h-48 bg-gradient-to-br from-white/[0.02] to-white/[0.05] flex items-center justify-center relative overflow-hidden rounded-t-[2.5rem]">
              <div className="absolute inset-0 bg-[#00E5FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-16 h-16 bg-[#0a0a0a] rounded-full border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-[#00E5FF]/50 transition-all z-10 shadow-xl">
                <Play
                  className="text-[#00E5FF] ml-1"
                  size={24}
                  fill="currentColor"
                />
              </div>
            </div>

            {/* Contenido del Card */}
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                  ESPECIALIZACIÓN
                </span>
                {/* FECHA DE CREACIÓN */}
                <span className="text-[8px] text-zinc-500 font-black tracking-widest uppercase flex items-center gap-1.5">
                  <Calendar size={10} /> {formatDate(course.created_at)}
                </span>
              </div>
              <h3 className="text-xl font-black text-white italic tracking-tight mb-3 line-clamp-2">
                {course.title}
              </h3>
              <p className="text-xs text-zinc-500 font-medium mb-8 line-clamp-3">
                {course.description ||
                  'Aprende los procesos corporativos y herramientas con Botisfy Labs.'}
              </p>

              <Link
                href={`/dashboard/academia/${course.id}`}
                className="mt-auto w-full py-4 rounded-2xl bg-white/5 text-white font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#00E5FF] hover:text-black hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all border border-white/5 hover:border-[#00E5FF]"
              >
                {isAdmin ? 'GESTIONAR CURSO' : 'COMENZAR'}{' '}
                <BookOpen size={16} />
              </Link>
            </div>
          </div>
        ))}

        {courses.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center">
            <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">
              Aún no hay cursos en la academia.
            </p>
          </div>
        )}
      </div>

      {/* MODAL PARA AÑADIR / EDITAR CURSO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#050505] border border-white/10 p-12 rounded-[4rem] shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-10 right-10 text-zinc-600 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <form onSubmit={handleSubmitCourse} className="space-y-8">
              <div className="space-y-2 text-center">
                <div className="bg-[#00E5FF]/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto border border-[#00E5FF]/20 mb-6">
                  {editingCourseId ? (
                    <Edit2 className="text-[#00E5FF]" size={28} />
                  ) : (
                    <BookOpen className="text-[#00E5FF]" size={28} />
                  )}
                </div>
                <h2 className="text-white font-black uppercase italic text-2xl tracking-tighter">
                  {editingCourseId ? 'Editar Curso' : 'Nuevo Curso'}
                </h2>
                <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">
                  {editingCourseId
                    ? 'Modificar Detalles del Hub'
                    : 'Añadir al Hub Corporativo'}
                </p>
              </div>

              <div className="space-y-4">
                <input
                  required
                  type="text"
                  placeholder="NOMBRE DEL CURSO"
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm text-white outline-none focus:border-[#00E5FF] font-bold tracking-wider transition-all"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <textarea
                  required
                  placeholder="DESCRIPCIÓN DEL CONTENIDO..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm text-white outline-none focus:border-[#00E5FF] font-medium transition-all resize-none"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <button
                disabled={isCreating}
                className="w-full bg-[#00E5FF] text-black font-black py-5 rounded-2xl uppercase text-[10px] tracking-[0.4em] hover:scale-[1.02] transition-all shadow-xl shadow-[#00E5FF]/20 disabled:opacity-50"
              >
                {isCreating
                  ? 'PROCESANDO...'
                  : editingCourseId
                  ? 'GUARDAR CAMBIOS'
                  : 'CONFIRMAR CREACIÓN'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
