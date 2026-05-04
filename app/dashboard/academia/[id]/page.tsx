'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { jsPDF } from 'jspdf'
import { 
  ChevronLeft, Video, FileCode, FileText, 
  Save, Trash2, CheckCircle2, ArrowUp, ArrowDown, 
  UploadCloud, RefreshCw, Plus, User, Edit3, ChevronRight, Lock, Download, Square, CheckSquare, XCircle, Eye
} from 'lucide-react'

export default function CourseEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('modulos')
  const [selectedModId, setSelectedModId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  
  // 🔐 PERFILES Y SEGURIDAD
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isStudentMode, setIsStudentMode] = useState(true) 
  
  // 📝 EVALUACIÓN
  const [isUnlocked, setIsUnlocked] = useState(false) 
  const [userAnswers, setUserAnswers] = useState<Record<number, string[]>>({}) 
  const [simulationResult, setSimulationResult] = useState<{score: number, passed: boolean} | null>(null)
  
  const [courseData, setCourseData] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])

  // 🎨 CONFIGURACIÓN DEL CERTIFICADO (DRAG & DROP + ESTILOS)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [certSettings, setCertSettings] = useState<any>({
    bgImage: null,
    elements: {
      name: { top: 45, left: 50, fontSize: 40, color: '#000000', visible: true, label: 'Nombre Estudiante' },
      course: { top: 60, left: 50, fontSize: 25, color: '#00E5FF', visible: true, label: 'Nombre del Curso' },
      date: { top: 80, left: 50, fontSize: 12, color: '#94a3b8', visible: true, label: 'Fecha de Emisión' }
    }
  })

  useEffect(() => {
    const fetchInitData = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return; }

      const { data: userData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (userData) {
        setCurrentUser(userData)
        const userIsAdmin = userData.role?.toLowerCase() === 'admin'
        setIsAdmin(userIsAdmin)
        setIsStudentMode(!userIsAdmin) 
      }

      const { data: course } = await supabase.from('courses').select('*').eq('id', id).single()
      if (course) {
        setCourseData(course)
        setModules(course.modules || [])
        if (course.certificate_config?.elements) setCertSettings(course.certificate_config)
        if (course.modules?.length > 0) setSelectedModId(course.modules[0].id)
      }
      setLoading(false)
    }
    if (id) fetchInitData()
  }, [id, supabase, router])

  const selectedModule = modules.find(m => m.id === selectedModId)

  // 🛠️ FIX YOUTUBE
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  }

  // 🖱️ LÓGICA DRAG & DROP CERTIFICADO
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current || isStudentMode) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setCertSettings((prev: any) => ({
      ...prev,
      elements: { ...prev.elements, [draggingId]: { ...prev.elements[draggingId], left: x, top: y } }
    }))
  }

  // 📝 MOTOR DE CALIFICACIÓN (70%)
  const runSimulation = () => {
    if (!selectedModule?.questions) return
    const objectiveQs = selectedModule.questions.filter((q: any) => q.type !== 'open')
    let correctCount = 0
    objectiveQs.forEach((q: any) => {
      const uAns = (userAnswers[q.id] || []).sort().join(',')
      const cAns = (q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : [])).sort().join(',')
      if (uAns === cAns && uAns !== "") correctCount++
    })
    const finalScore = Math.round((correctCount / (objectiveQs.length || 1)) * (selectedModule.totalPoints || 10) * 10) / 10
    setSimulationResult({ score: finalScore, passed: finalScore >= (selectedModule.totalPoints || 10) * 0.7 })
    if (finalScore >= (selectedModule.totalPoints || 10) * 0.7) setIsUnlocked(true) 
  }

  const updateModule = (field: string, value: any) => {
    if (isStudentMode && field !== 'questions') return
    setModules(modules.map(m => m.id === selectedModId ? { ...m, [field]: value } : m))
  }

  const handleFileUpload = async (e: any, type: 'content' | 'cert') => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true)
    const { data } = await supabase.storage.from('course_materials').upload(`${Date.now()}-${file.name}`, file)
    if (data) {
      const url = supabase.storage.from('course_materials').getPublicUrl(data.path).data.publicUrl
      if (type === 'cert') setCertSettings({...certSettings, bgImage: url})
      else updateModule('content', url)
    }
    setUploading(false)
  }

  const generatePDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1358] })
    if (certSettings.bgImage) {
      const img = new Image(); img.crossOrigin = "anonymous"; img.src = certSettings.bgImage
      await new Promise((resolve) => { img.onload = resolve })
      doc.addImage(img, 'PNG', 0, 0, 1920, 1358)
    }
    Object.entries(certSettings.elements).forEach(([key, el]: [string, any]) => {
      if (el.visible) {
        doc.setFontSize(el.fontSize * 2.4); doc.setTextColor(el.color); doc.setFont("helvetica", "bolditalic")
        let val = key === 'name' ? (currentUser?.full_name || 'ESTUDIANTE') : key === 'course' ? (courseData?.title || 'CURSO') : new Date().toLocaleDateString('es-ES')
        doc.text(val.toUpperCase(), (el.left / 100) * 1920, (el.top / 100) * 1358, { align: 'center' })
      }
    })
    return doc
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-[#00E5FF]"><RefreshCw className="animate-spin" /></div>

  return (
    <div className="w-full space-y-8 pb-20 text-white animate-in fade-in" onMouseMove={handleMouseMove} onMouseUp={() => setDraggingId(null)}>
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-xl border border-white/5"><ChevronLeft size={20} /></button>
          <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">{courseData?.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={() => { setIsStudentMode(!isStudentMode); setSimulationResult(null); }} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${isStudentMode ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-zinc-500'}`}>
              {isStudentMode ? <Edit3 size={14}/> : <User size={14}/>} {isStudentMode ? 'MODO DOCENTE' : 'VISTA ESTUDIANTE'}
            </button>
          )}
          <button onClick={() => supabase.from('courses').update({ modules, certificate_config: certSettings }).eq('id', id).then(() => alert("✅ Cambios Publicados"))} className="bg-[#00E5FF] text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-[0_0_20px_rgba(0,229,255,0.2)]">Publicar</button>
        </div>
      </div>

      <div className="flex gap-8 border-b border-white/5">
        <button onClick={() => setActiveTab('modulos')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'modulos' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]' : 'text-zinc-600'}`}>1. Contenidos</button>
        <button onClick={() => { if(!isStudentMode || isUnlocked) setActiveTab('certificado') }} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'certificado' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]' : (isUnlocked || !isStudentMode ? 'text-zinc-400' : 'text-zinc-800 cursor-not-allowed')}`}>2. Certificación {isStudentMode && !isUnlocked && <Lock size={10} className="inline ml-1" />}</button>
      </div>

      {activeTab === 'modulos' ? (
        /* VISTA DE CONTENIDOS (VIDEO/PDF/QUIZ) */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-4 space-y-4">
            {modules.map((mod) => (
              <div key={mod.id} onClick={() => { setSelectedModId(mod.id); setSimulationResult(null); }} className={`p-5 rounded-2xl flex items-center justify-between group border cursor-pointer transition-all ${selectedModId === mod.id ? 'bg-[#00E5FF]/5 border-[#00E5FF]/40' : 'bg-[#050505] border-white/5'}`}>
                <div className="flex items-center gap-4">
                  {mod.type === 'video' ? <Video size={18} /> : mod.type === 'pdf' ? <FileText size={18} /> : mod.type === 'quiz' ? <CheckSquare size={18} /> : <FileCode size={18} />}
                  <p className="text-[11px] font-black uppercase tracking-tight">{mod.title}</p>
                </div>
                {!isStudentMode && <button onClick={(e) => {e.stopPropagation(); setModules(modules.filter(m=>m.id!==mod.id))}}><Trash2 size={14} className="text-red-500 opacity-0 group-hover:opacity-100"/></button>}
              </div>
            ))}
            {!isStudentMode && (
              <div className="grid grid-cols-2 gap-3 mt-6 p-4 bg-white/[0.02] rounded-[2rem] border border-white/5">
                {[ {t:'video', i:Video, l:'VIDEO'}, {t:'embed', i:FileCode, l:'EMBED'}, {t:'pdf', i:FileText, l:'PDF'}, {t:'quiz', i:CheckSquare, l:'QUIZ'} ].map(item => (
                  <button key={item.t} onClick={() => setModules([...modules, { id: Date.now(), title: `NUEVO ${item.l}`, type: item.t, content: '', questions: [] }])} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#00E5FF]/20 group transition-all text-center">
                    <item.i size={18} className="text-zinc-600 group-hover:text-[#00E5FF]" />
                    <span className="text-[7px] font-black uppercase text-zinc-700">{item.l}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-8">
            {selectedModule && (
              <div className="bg-[#050505] border border-white/5 p-10 rounded-[3rem] space-y-8 animate-in slide-in-from-right-4">
                {selectedModule.type === 'quiz' ? (
                  /* MOTOR DE QUIZ */
                  <div className="space-y-12">
                    {simulationResult ? (
                      <div className="text-center p-12 bg-white/[0.01] rounded-[2.5rem] border border-white/5">
                        <p className="text-6xl font-black italic">{simulationResult.score}/{selectedModule.totalPoints || 10}</p>
                        <p className={`mt-4 font-black ${simulationResult.passed ? 'text-green-500' : 'text-red-500'}`}>{simulationResult.passed ? 'APROBADO' : 'FALLIDO'}</p>
                        <button onClick={() => {setSimulationResult(null); setUserAnswers({});}} className="mt-8 px-8 py-3 bg-white/5 rounded-xl text-[9px] font-black uppercase">Reintentar</button>
                      </div>
                    ) : (
                      <>
                        {selectedModule.questions?.map((q: any, idx: number) => (
                          <div key={q.id} className="space-y-6">
                            <p className="text-lg font-bold">{idx+1}. {q.text}</p>
                            <div className="grid gap-3 ml-6">
                              {q.options?.map((opt: string) => {
                                const active = !isStudentMode ? (q.correctAnswers || []).includes(opt) : (userAnswers[q.id] || []).includes(opt);
                                return (
                                  <button key={opt} onClick={() => {
                                    const list = !isStudentMode ? (q.correctAnswers || []) : (userAnswers[q.id] || []);
                                    const next = q.type === 'multiple' ? (list.includes(opt) ? list.filter((x:any)=>x!==opt) : [...list, opt]) : [opt];
                                    if(!isStudentMode) { const nqs = [...selectedModule.questions]; nqs[idx].correctAnswers = next; updateModule('questions', nqs); }
                                    else { setUserAnswers({...userAnswers, [q.id]: next}); }
                                  }} className={`p-5 rounded-2xl border text-left text-[11px] flex items-center justify-between ${active ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                                    {opt} {active ? <CheckSquare size={18} /> : <Square size={18} className="opacity-20" />}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        {isStudentMode && <button onClick={runSimulation} className="w-full bg-[#00E5FF] text-black py-7 rounded-[2rem] font-black uppercase text-[10px]">Finalizar Evaluación</button>}
                      </>
                    )}
                  </div>
                ) : (
                  /* REPRODUCTOR VIDEO/PDF/EMBED */
                  <div className="space-y-8">
                     {!isStudentMode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative"><input type="file" onChange={(e) => handleFileUpload(e, 'content')} className="absolute inset-0 opacity-0 cursor-pointer" /><div className="bg-white/5 p-8 rounded-2xl border-2 border-dashed border-white/10 text-center"><UploadCloud className="mx-auto mb-2 text-zinc-700" /><p className="text-[8px] font-black text-zinc-500 uppercase">Subir Archivo</p></div></div>
                          <textarea value={selectedModule.content} onChange={(e) => updateModule('content', e.target.value)} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-[#00E5FF] text-xs font-mono" placeholder="Link YouTube o iFrame..." rows={3} />
                        </div>
                     )}
                     <div className="bg-black rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl min-h-[400px] flex items-center justify-center">
                        {selectedModule.content ? (
                          <>
                            {selectedModule.type === 'video' && (
                              selectedModule.content.includes('youtube.com') || selectedModule.content.includes('youtu.be') 
                              ? <iframe className="w-full aspect-video" src={getEmbedUrl(selectedModule.content)} allowFullScreen />
                              : <video className="w-full aspect-video" src={selectedModule.content} controls />
                            )}
                            {selectedModule.type === 'pdf' && <iframe src={selectedModule.content} className="w-full h-[600px]" />}
                            {selectedModule.type === 'embed' && <div className="w-full h-full p-4" dangerouslySetInnerHTML={{ __html: selectedModule.content }} />}
                          </>
                        ) : <p className="text-zinc-800 uppercase font-black text-[10px]">Sin contenido</p>}
                     </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 🖼️ EDITOR DE CERTIFICACIÓN (FUNCIONALIDADES DEVUELTAS) */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-8">
            <div ref={containerRef} className="relative w-full aspect-[1.414/1] bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/10">
               {certSettings.bgImage && <img src={certSettings.bgImage} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />}
               {Object.entries(certSettings.elements).map(([eid, el]: [string, any]) => el.visible && (
                 <div 
                  key={eid} 
                  onMouseDown={() => !isStudentMode && setDraggingId(eid)}
                  style={{ top: `${el.top}%`, left: `${el.left}%`, fontSize: `${el.fontSize}px`, color: el.color }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 font-bold italic select-none transition-all ${!isStudentMode ? 'cursor-move ring-2 ring-[#00E5FF]/20 hover:ring-[#00E5FF] px-2' : ''}`}
                 >
                   {eid === 'name' ? (currentUser?.full_name || el.label) : eid === 'course' ? (courseData?.title || el.label) : el.label}
                 </div>
               ))}
            </div>
          </div>
          <div className="xl:col-span-4 space-y-6">
            {!isStudentMode ? (
              /* PANEL DE EDICIÓN ADMIN */
              <div className="bg-[#050505] p-8 rounded-[2rem] border border-white/5 space-y-8">
                <div className="space-y-4">
                   <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Plantilla de Fondo</label>
                   <input type="file" onChange={(e) => handleFileUpload(e, 'cert')} className="text-[10px] text-zinc-500" />
                </div>
                {Object.entries(certSettings.elements).map(([eid, el]: [string, any]) => (
                  <div key={eid} className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-[#00E5FF]">{eid}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[7px] text-zinc-600 uppercase">Tamaño</label>
                        <input type="number" value={el.fontSize} onChange={(e) => setCertSettings({...certSettings, elements: {...certSettings.elements, [eid]: {...el, fontSize: Number(e.target.value)}}})} className="w-full bg-black p-2 rounded text-[10px]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[7px] text-zinc-600 uppercase">Color</label>
                        <input type="color" value={el.color} onChange={(e) => setCertSettings({...certSettings, elements: {...certSettings.elements, [eid]: {...el, color: e.target.value}}})} className="w-full h-8 bg-black rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* BOTÓN DESCARGA ESTUDIANTE */
              <button onClick={async () => (await generatePDF()).save('Certificado-Botisfy.pdf')} className="w-full bg-[#00E5FF] text-black py-6 rounded-3xl font-black text-xs uppercase shadow-[0_0_40px_rgba(0,229,255,0.3)] flex items-center justify-center gap-3"><Download size={20}/> Descargar Diploma</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}