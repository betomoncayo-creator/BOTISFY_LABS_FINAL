'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Plus, ArrowLeft, Video, FileText, HelpCircle, Layout, Trash2, Link as LinkIcon, MonitorPlay, X, UploadCloud, CheckCircle2, Edit2, Award } from 'lucide-react'
import Link from 'next/link'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('video') 
  const [newUrl, setNewUrl] = useState('') 
  
  // Archivos
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Constructor de Quizzes
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])

  const supabase = createClient()

  const fetchCourseData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') setIsAdmin(true)
      }

      const { data: courseData, error: courseError } = await supabase.from('courses').select('*').eq('id', courseId).single()
      if (courseError) throw courseError
      setCourse(courseData)

      const { data: modulesData } = await supabase.from('course_modules').select('*').eq('course_id', courseId).order('order_index', { ascending: true })
      if (modulesData) setModules(modulesData)

    } catch (error) {
      router.push('/dashboard/academia')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  // ==============================
  // LOGICA DEL QUIZ BUILDER
  // ==============================
  const addQuestion = (type: 'multiple' | 'boolean') => {
    setQuizQuestions([...quizQuestions, {
      id: Date.now(),
      type,
      text: '',
      options: type === 'multiple' ? ['', '', ''] : ['Verdadero', 'Falso'],
      correctIndex: 0,
      points: 10
    }])
  }

  const updateQuestion = (id: number, field: string, value: any) => {
    setQuizQuestions(quizQuestions.map(q => q.id === id ? { ...q, [field]: value } : q))
  }

  const updateOption = (qId: number, optIndex: number, value: string) => {
    setQuizQuestions(quizQuestions.map(q => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions }
      }
      return q;
    }))
  }

  const removeQuestion = (id: number) => {
    setQuizQuestions(quizQuestions.filter(q => q.id !== id))
  }

  const totalPoints = quizQuestions.reduce((sum, q) => sum + Number(q.points || 0), 0)

  // ==============================
  // GESTIÓN DE MÓDULOS (CREAR/EDITAR)
  // ==============================
  const openCreateModal = () => {
    setEditingModuleId(null)
    setNewTitle('')
    setNewUrl('')
    setSelectedFile(null)
    setQuizQuestions([])
    setNewType('video')
    setIsModalOpen(true)
  }

  const openEditModal = (mod: any) => {
    setEditingModuleId(mod.id)
    setNewTitle(mod.title)
    setNewType(mod.module_type)
    
    if (mod.module_type === 'video') setNewUrl(mod.video_url || '')
    else if (mod.module_type === 'genially') setNewUrl(mod.quiz_embed_url || '')
    else if (mod.module_type === 'file' || mod.module_type === 'certificate') setNewUrl(mod.pdf_url || '')
    
    if (mod.module_type === 'quiz') setQuizQuestions(mod.quiz_data || [])
    else setQuizQuestions([])

    setSelectedFile(null)
    setIsModalOpen(true)
  }

  const resetModal = () => {
    setIsModalOpen(false)
    setEditingModuleId(null)
    setNewTitle('')
    setNewUrl('')
    setSelectedFile(null)
    setQuizQuestions([])
    setNewType('video')
  }

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      let finalVideoUrl = newType === 'video' ? newUrl : null;
      let finalPdfUrl = (newType === 'file' || newType === 'certificate') ? newUrl : null;
      let finalEmbedUrl = newType === 'genially' ? newUrl : null;
      let finalQuizData = null;

      if ((newType === 'video' || newType === 'file' || newType === 'certificate') && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`
        const filePath = `${courseId}/${fileName}`

        const { error: uploadError } = await supabase.storage.from('course_materials').upload(filePath, selectedFile)
        if (uploadError) throw new Error("Error al subir el archivo al servidor.")

        const { data: { publicUrl } } = supabase.storage.from('course_materials').getPublicUrl(filePath)
        
        if (newType === 'video') finalVideoUrl = publicUrl;
        if (newType === 'file' || newType === 'certificate') finalPdfUrl = publicUrl;
      }

      if (newType === 'quiz') {
        if (quizQuestions.length === 0) throw new Error("Añade al menos una pregunta al cuestionario.")
        finalQuizData = quizQuestions; 
      }

      const moduleData = {
        title: newTitle,
        module_type: newType,
        video_url: finalVideoUrl,
        pdf_url: finalPdfUrl,
        quiz_embed_url: finalEmbedUrl,
        quiz_data: finalQuizData,
      }

      if (editingModuleId) {
        const { error } = await supabase.from('course_modules').update(moduleData).eq('id', editingModuleId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('course_modules').insert([{
          ...moduleData,
          course_id: courseId,
          order_index: modules.length + 1
        }])
        if (error) throw error
      }

      resetModal()
      fetchCourseData()
    } catch (error: any) {
      alert(error.message || "Error al procesar el material.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteModule = async (id: string) => {
    if (!confirm('🛑 ¿Eliminar este material?')) return;
    try {
      await supabase.from('course_modules').delete().eq('id', id)
      fetchCourseData()
    } catch (error) {
      alert("Error al eliminar")
    }
  }

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={20} className="text-[#00E5FF]" />
      case 'genially': return <MonitorPlay size={20} className="text-purple-400" />
      case 'quiz': return <HelpCircle size={20} className="text-green-400" />
      case 'file': return <FileText size={20} className="text-orange-400" />
      case 'certificate': return <Award size={20} className="text-yellow-400" />
      default: return <Layout size={20} className="text-zinc-400" />
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="animate-spin text-[#00E5FF]" size={40} />
      <p className="text-zinc-500 font-black text-[10px] tracking-[0.5em] uppercase italic">Descifrando Módulos...</p>
    </div>
  )

  return (
    <div className="animate-in fade-in duration-700 space-y-6 md:space-y-8 pb-10">
      
      <Link href="/dashboard/academia" className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#00E5FF] transition-colors text-[10px] font-black uppercase tracking-[0.3em] mb-2">
        <ArrowLeft size={14} /> Volver al Hub
      </Link>

      {/* HEADER RESPONSIVO */}
      <header className="bg-[#050505] border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-14 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-[#00E5FF]/5 blur-[80px] pointer-events-none" />
        <div className="space-y-3 md:space-y-4 relative z-10 w-full md:w-auto">
          <span className="px-4 py-1.5 bg-white/5 text-zinc-400 border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest inline-block">
            ENTORNO DE APRENDIZAJE
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-tight">{course?.title}</h1>
          <p className="text-zinc-500 text-xs md:text-sm font-medium max-w-2xl">{course?.description}</p>
        </div>
        {isAdmin && (
          <button onClick={openCreateModal} className="w-full md:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-[#00E5FF] text-black px-6 md:px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:scale-[1.02] transition-all shadow-xl shadow-[#00E5FF]/20 relative z-10">
            <Plus size={16} /> Añadir Material
          </button>
        )}
      </header>

      <div className="space-y-4">
        <h3 className="text-zinc-400 font-black text-[10px] uppercase tracking-[0.4em] italic pl-2 md:pl-4">Contenido del Curso ({modules.length})</h3>
        {modules.length === 0 ? (
          <div className="border border-dashed border-white/10 bg-white/[0.01] rounded-[2rem] md:rounded-[2.5rem] p-10 md:p-16 flex flex-col items-center text-center">
            <Layout size={40} className="text-zinc-800 mb-4 md:mb-6" />
            <h3 className="text-lg md:text-xl font-black text-white italic tracking-tight mb-2">Módulo Vacío</h3>
            <p className="text-zinc-600 text-[9px] md:text-[10px] font-bold tracking-widest uppercase">Añade videos, geniallys o cuestionarios para empezar.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4">
            {modules.map((mod, index) => (
              <div key={mod.id} className="bg-[#0a0a0a] border border-white/5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 md:w-12 h-10 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/10 shrink-0">{getModuleIcon(mod.module_type)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-base md:text-lg truncate">{mod.title}</h4>
                    <p className="text-zinc-600 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">Módulo {index + 1} • {mod.module_type}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end border-t border-white/5 sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                    <button onClick={() => openEditModal(mod)} className="flex-1 sm:flex-none p-2 md:p-3 text-zinc-400 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 rounded-xl transition-all flex justify-center">
                      <Edit2 size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    <button onClick={() => handleDeleteModule(mod.id)} className="flex-1 sm:flex-none p-2 md:p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all flex justify-center">
                      <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MEGA MODAL DINÁMICO RESPONSIVO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-3 sm:p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#050505] border border-white/10 p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl relative custom-scrollbar">
            <button type="button" onClick={resetModal} className="absolute top-6 md:top-8 right-6 md:right-8 text-zinc-600 hover:text-white transition-colors bg-black/50 p-2 rounded-full md:p-0 md:bg-transparent z-50"><X size={20} className="md:w-6 md:h-6"/></button>
            
            <form onSubmit={handleSaveModule} className="space-y-6 md:space-y-8 mt-4 md:mt-0">
              <div className="space-y-1 md:space-y-2">
                <h2 className="text-white font-black uppercase italic text-xl md:text-2xl tracking-tighter pr-8">{editingModuleId ? 'Editar Material' : 'Nuevo Material'}</h2>
                <p className="text-zinc-600 text-[8px] md:text-[9px] font-bold uppercase tracking-widest">{editingModuleId ? 'Ajustar configuraciones' : 'Inyectar contenido al Hub'}</p>
              </div>

              {/* SELECTOR DE TIPO RESPONSIVO */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                {[
                  { id: 'video', label: 'Video', icon: Video },
                  { id: 'genially', label: 'Genially URL', icon: MonitorPlay },
                  { id: 'quiz', label: 'Cuestionario', icon: HelpCircle },
                  { id: 'file', label: 'Archivo (PDF)', icon: FileText },
                  { id: 'certificate', label: 'Certificado', icon: Award }
                ].map((type) => (
                  <button key={type.id} type="button" onClick={() => {setNewType(type.id); setSelectedFile(null)}} className={`flex flex-col items-center justify-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all ${newType === type.id ? 'bg-[#00E5FF]/10 border-[#00E5FF]/50 text-[#00E5FF]' : 'bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10'}`}>
                    <type.icon size={16} className="md:w-[18px] md:h-[18px]" />
                    <span className="text-[6px] md:text-[7px] font-black uppercase tracking-widest text-center">{type.label}</span>
                  </button>
                ))}
              </div>

              {/* TÍTULO GLOBAL */}
              <input required type="text" placeholder="TÍTULO DEL MÓDULO" className="w-full bg-white/5 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl text-xs md:text-sm text-white outline-none focus:border-[#00E5FF] font-bold tracking-wider transition-all" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />

              {/* 1. VIDEO */}
              {newType === 'video' && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 md:pl-5 flex items-center pointer-events-none"><LinkIcon size={14} className="text-zinc-600 md:w-4 md:h-4" /></div>
                    <input type="url" placeholder="URL del Video (YouTube, Vimeo...)" className="w-full bg-white/5 border border-white/10 py-4 md:py-5 pl-10 md:pl-12 pr-4 md:pr-5 rounded-xl md:rounded-2xl text-xs md:text-sm text-white outline-none focus:border-[#00E5FF] font-mono transition-all" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="h-[1px] flex-1 bg-white/10"></div>
                    <span className="text-zinc-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-center">O SUBIR ARCHIVO MP4</span>
                    <div className="h-[1px] flex-1 bg-white/10"></div>
                  </div>
                  <div className="border-2 border-dashed border-white/10 bg-white/5 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 text-center hover:border-[#00E5FF]/50 transition-all relative">
                    <input type="file" accept="video/mp4" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center pointer-events-none">
                      {selectedFile ? <CheckCircle2 className="text-[#00E5FF] mb-2 md:mb-3" size={24} className="md:w-8 md:h-8" /> : <UploadCloud className="text-zinc-500 mb-2 md:mb-3" size={24} className="md:w-8 md:h-8" />}
                      <span className="text-white font-bold text-xs md:text-sm px-2">{selectedFile ? selectedFile.name : (newUrl && editingModuleId ? 'Ya hay video. Sube para reemplazar.' : 'Clic o arrastra tu archivo aquí')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ARCHIVO Y GENIALLY */}
              {(newType === 'file' || newType === 'genially') && (
                <div className="space-y-4">
                   <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 md:pl-5 flex items-center pointer-events-none"><LinkIcon size={14} className="text-zinc-600 md:w-4 md:h-4" /></div>
                    <input type={newType === 'genially' ? 'url' : 'text'} required={newType==='genially'} placeholder={newType === 'genially' ? 'URL de Genially' : 'URL de Drive/OneDrive'} className="w-full bg-white/5 border border-white/10 py-4 md:py-5 pl-10 md:pl-12 pr-4 md:pr-5 rounded-xl md:rounded-2xl text-xs md:text-sm text-white outline-none focus:border-[#00E5FF] font-mono transition-all" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
                  </div>
                  {newType === 'file' && (
                    <>
                    <div className="flex items-center gap-3 md:gap-4"><div className="h-[1px] flex-1 bg-white/10"></div><span className="text-zinc-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-center">O SUBIR ARCHIVO PDF</span><div className="h-[1px] flex-1 bg-white/10"></div></div>
                    <div className="border-2 border-dashed border-white/10 bg-white/5 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 text-center hover:border-[#00E5FF]/50 transition-all relative">
                      <input type="file" accept=".pdf,.ppt,.pptx" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="flex flex-col items-center pointer-events-none">
                        {selectedFile ? <CheckCircle2 className="text-[#00E5FF] mb-2 md:mb-3" size={24} className="md:w-8 md:h-8" /> : <UploadCloud className="text-zinc-500 mb-2 md:mb-3" size={24} className="md:w-8 md:h-8" />}
                        <span className="text-white font-bold text-xs md:text-sm">{selectedFile ? selectedFile.name : (newUrl && editingModuleId ? 'Sube para reemplazar.' : 'Subir archivo físico')}</span>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              )}

              {/* 3. CERTIFICADO */}
              {newType === 'certificate' && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <div className="border-2 border-dashed border-yellow-500/30 bg-yellow-500/5 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 text-center relative">
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center pointer-events-none">
                      {selectedFile ? <CheckCircle2 className="text-yellow-400 mb-2 md:mb-3" size={24} className="md:w-8 md:h-8" /> : <Award className="text-yellow-500 mb-2 md:mb-3" size={24} className="md:w-8 md:h-8" />}
                      <span className="text-white font-bold text-xs md:text-sm">{selectedFile ? selectedFile.name : (newUrl && editingModuleId ? 'Ya hay un certificado. Sube otro.' : 'Sube la plantilla del Certificado')}</span>
                      <span className="text-zinc-500 text-[8px] md:text-[9px] uppercase tracking-widest mt-2">Formatos: PDF, JPG, PNG</span>
                    </div>
                  </div>
                  <p className="text-[7px] md:text-[9px] text-yellow-500/80 font-bold uppercase tracking-widest text-center px-2 md:px-4">
                    *Regla de sistema: Este material estará bloqueado para el estudiante hasta que complete todos los módulos y apruebe con mínimo 7/10.
                  </p>
                </div>
              )}

              {/* 4. CONSTRUCTOR DE CUESTIONARIOS (Quiz) */}
              {newType === 'quiz' && (
                <div className="space-y-5 md:space-y-6 border-t border-white/10 pt-5 md:pt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[#00E5FF] font-black text-[10px] md:text-xs uppercase tracking-widest">Preguntas ({quizQuestions.length})</h3>
                    <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] md:text-xs font-black text-white">Puntaje Total: {totalPoints}</span>
                  </div>
                  
                  <div className="space-y-4">
                    {quizQuestions.map((q, index) => (
                      <div key={q.id} className="bg-white/5 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl space-y-4 relative">
                        <button type="button" onClick={() => removeQuestion(q.id)} className="absolute top-3 right-3 md:top-4 md:right-4 text-zinc-500 hover:text-red-500"><Trash2 size={14} className="md:w-4 md:h-4"/></button>
                        
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                          <span className="bg-black text-[#00E5FF] w-7 md:w-8 h-7 md:h-8 rounded-full flex items-center justify-center font-black text-xs md:text-sm shrink-0">{index + 1}</span>
                          <div className="flex-1 space-y-3 md:space-y-4 w-full">
                            <input required type="text" placeholder="Escribe la pregunta..." value={q.text} onChange={(e) => updateQuestion(q.id, 'text', e.target.value)} className="w-full bg-transparent border-b border-white/20 pb-2 text-sm md:text-base text-white outline-none focus:border-[#00E5FF] font-bold" />
                            
                            <div className="space-y-2">
                              {q.options.map((opt: string, oIdx: number) => (
                                <div key={oIdx} className="flex items-center gap-2 md:gap-3">
                                  <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === oIdx} onChange={() => updateQuestion(q.id, 'correctIndex', oIdx)} className="accent-[#00E5FF] w-3 md:w-4 h-3 md:h-4 cursor-pointer" />
                                  {q.type === 'multiple' ? (
                                    <input required type="text" placeholder={`Opción ${['A','B','C'][oIdx]}`} value={opt} onChange={(e) => updateOption(q.id, oIdx, e.target.value)} className="flex-1 bg-black/50 border border-white/10 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm text-zinc-300 outline-none focus:border-[#00E5FF]" />
                                  ) : (
                                    <span className="text-zinc-300 text-xs md:text-sm font-bold">{opt}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex items-center justify-end sm:justify-start gap-2 md:gap-3 pt-2">
                              <span className="text-[10px] md:text-xs text-zinc-500 uppercase font-black">Puntos:</span>
                              <input type="number" min="1" value={q.points} onChange={(e) => updateQuestion(q.id, 'points', e.target.value)} className="w-16 md:w-20 bg-black/50 border border-white/10 px-2 md:px-3 py-1 rounded-md md:rounded-lg text-xs md:text-sm text-[#00E5FF] font-black outline-none text-center" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button type="button" onClick={() => addQuestion('multiple')} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 md:py-3 rounded-xl text-[9px] md:text-[10px] uppercase tracking-widest transition-colors">+ Opción Múltiple</button>
                    <button type="button" onClick={() => addQuestion('boolean')} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 md:py-3 rounded-xl text-[9px] md:text-[10px] uppercase tracking-widest transition-colors">+ Verdadero/Falso</button>
                  </div>
                </div>
              )}

              <button disabled={isCreating} className="w-full bg-[#00E5FF] text-black font-black py-4 md:py-5 rounded-xl md:rounded-2xl uppercase text-[9px] md:text-[10px] tracking-[0.3em] md:tracking-[0.4em] hover:scale-[1.02] transition-all shadow-xl shadow-[#00E5FF]/20 disabled:opacity-50">
                {isCreating ? 'GUARDANDO...' : (editingModuleId ? 'ACTUALIZAR MATERIAL' : 'GUARDAR MATERIAL')}
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        @media (min-width: 768px) { .custom-scrollbar::-webkit-scrollbar { width: 6px; } }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 229, 255, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 229, 255, 0.5); }
      `}} />
    </div>
  )
}