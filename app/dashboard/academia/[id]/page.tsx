'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { jsPDF } from 'jspdf'
import { 
  ChevronLeft, Video, FileCode, FileText, HelpCircle, 
  Save, Trash2, CheckCircle2, ArrowUp, ArrowDown, 
  UploadCloud, RefreshCw, Eye, Plus, Settings, 
  Layout, ClipboardCheck, MessageSquare, ToggleLeft, Play, XCircle, Square, CheckSquare, Type, Move, Maximize, Palette, User, Edit3, ChevronRight, Lock, Download
} from 'lucide-react'

export default function CourseEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('modulos')
  const [selectedModId, setSelectedModId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  
  // 🔐 ESTADOS DE SEGURIDAD Y ROLES
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [isStudentMode, setIsStudentMode] = useState(true) // Por defecto es estudiante por seguridad
  const [isUnlocked, setIsUnlocked] = useState(false) 
  const [userAnswers, setUserAnswers] = useState<Record<number, string[]>>({}) 
  const [simulationResult, setSimulationResult] = useState<{score: number, passed: boolean} | null>(null)
  
  const [courseData, setCourseData] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)

  const [certSettings, setCertSettings] = useState<any>({
    bgImage: null,
    elements: {
      name: { top: 45, left: 50, fontSize: 40, color: '#000000', visible: true, label: 'Nombre Estudiante' },
      course: { top: 60, left: 50, fontSize: 25, color: '#00E5FF', visible: true, label: 'Nombre del Curso' },
      date: { top: 80, left: 50, fontSize: 12, color: '#94a3b8', visible: true, label: 'Fecha de Emisión' }
    }
  })
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // 1️⃣ CARGA DE DATOS Y VERIFICACIÓN DE ROL[cite: 3]
  useEffect(() => {
    const fetchInitData = async () => {
      setLoading(true)
      
      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return; }

      // Obtener rol del usuario
      const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      setCurrentUser(userData)
      
      const userIsAdmin = userData?.role === 'admin'
      setIsAdmin(userIsAdmin)
      // Si es admin, inicia en modo edición. Si es estudiante, se clava en true.
      setIsStudentMode(!userIsAdmin)

      // Obtener datos del curso
      const { data: course } = await supabase.from('courses').select('*').eq('id', id).single()
      if (course) {
        setCourseData(course)
        if (course.modules) setModules(course.modules)
        if (course.certificate_config?.elements) setCertSettings(course.certificate_config)
        if (course.modules?.length > 0) setSelectedModId(course.modules[0].id)
      }
      setLoading(false)
    }
    
    if (id) fetchInitData()
  }, [id, supabase, router])

  const selectedModule = modules.find(m => m.id === selectedModId)
  const currentIndex = modules.findIndex(m => m.id === selectedModId)

  // 2️⃣ GENERADOR PDF NATIVO CON DATOS REALES[cite: 3]
  const generatePDFDocument = async () => {
    const pdfWidth = 1920; 
    const pdfHeight = 1358;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [pdfWidth, pdfHeight] });

    if (certSettings.bgImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = certSettings.bgImage;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      doc.addImage(img, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    Object.entries(certSettings.elements).forEach(([key, el]: [string, any]) => {
      if (el.visible) {
        const xPos = (el.left / 100) * pdfWidth;
        const yPos = (el.top / 100) * pdfHeight;
        
        doc.setFontSize(el.fontSize * 2.4);
        doc.setTextColor(el.color);
        doc.setFont("helvetica", "bolditalic"); 
        
        let textValue = '';
        // Aquí inyectamos el nombre REAL de la base de datos (o un fallback si no hay)
        if (key === 'name') textValue = currentUser?.full_name || 'Estudiante Botisfy';
        else if (key === 'course') textValue = courseData?.title || 'Curso de Especialización';
        else {
          // Fecha actual dinámica
          const today = new Date();
          const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
          textValue = today.toLocaleDateString('es-ES', options).toUpperCase();
        }

        doc.text(textValue, xPos, yPos, { align: 'center', baseline: 'middle' });
      }
    });

    return doc;
  };

  const loadPDFPreview = async () => {
    try {
      const doc = await generatePDFDocument();
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(url);
    } catch (error) { console.error("Error preview PDF:", error); }
  };

  const downloadPDF = async () => {
    setIsSaving(true);
    try {
      const doc = await generatePDFDocument();
      doc.save(`Certificado-${courseData?.title?.replace(/\s+/g, '_') || 'Botisfy'}.pdf`);
    } catch (error) { alert("Error al descargar el documento."); } 
    finally { setIsSaving(false); }
  };

  useEffect(() => {
    if (isStudentMode && isUnlocked && activeTab === 'certificado') {
      loadPDFPreview();
    }
  }, [isStudentMode, isUnlocked, activeTab, certSettings]);

  // --- FUNCIONES DE MÓDULOS ---
  const updateModule = (field: string, value: any) => {
    if (isStudentMode) return
    setModules(modules.map(m => m.id === selectedModId ? { ...m, [field]: value } : m))
  }

  const addModule = (type: string) => {
    const newMod: any = { id: Date.now(), type, title: `NUEVO NODO ${type.toUpperCase()}`, content: '', videoSource: 'url', questions: type === 'quiz' ? [] : undefined, passingScore: 7, totalPoints: 10 }
    setModules([...modules, newMod]); setSelectedModId(newMod.id);
  }

  const deleteModule = (modId: number) => {
    setModules(modules.filter(m => m.id !== modId))
    if (selectedModId === modId) setSelectedModId(modules.filter(m => m.id !== modId)[0]?.id || null)
  }

  const moveModule = (index: number, direction: 'up' | 'down') => {
    const newModules = [...modules]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newModules.length) return
    [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]]
    setModules(newModules)
  }

  const addQuestion = (type: 'multiple' | 'boolean' | 'open') => {
    const newQ = { id: Date.now(), type, text: 'Nueva Pregunta', options: type === 'multiple' ? ['Opción 1', 'Opción 2'] : type === 'boolean' ? ['Verdadero', 'Falso'] : [], correctAnswers: [], correctAnswer: type === 'boolean' ? 'Verdadero' : '' }
    updateModule('questions', [...(selectedModule.questions || []), newQ])
  }

  const toggleAnswer = (qId: number, option: string, multi: boolean) => {
    const current = userAnswers[qId] || []
    const next = multi ? (current.includes(option) ? current.filter(i => i !== option) : [...current, option]) : [option]
    setUserAnswers({...userAnswers, [qId]: next})
  }

  const runSimulation = () => {
    if (!selectedModule?.questions?.length) return
    const objectiveQs = selectedModule.questions.filter((q: any) => q.type !== 'open')
    if (objectiveQs.length === 0) { setIsUnlocked(true); return; }
    let totalScore = 0
    const puntosPorPregunta = (selectedModule.totalPoints || 10) / objectiveQs.length
    objectiveQs.forEach((q: any) => {
      const sel = userAnswers[q.id] || []; const cor = q.type === 'boolean' ? [q.correctAnswer] : (q.correctAnswers || [])
      if (cor.length === 0) return;
      const aciertos = sel.filter(a => cor.includes(a)).length; const errores = sel.filter(a => !cor.includes(a)).length
      totalScore += Math.max(0, (aciertos - errores) / cor.length) * puntosPorPregunta
    })
    const passed = Math.round(totalScore) >= (selectedModule.passingScore || 7)
    setSimulationResult({ score: Math.round(totalScore), passed }); if (passed) setIsUnlocked(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current || isStudentMode) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setCertSettings((prev: any) => ({ ...prev, elements: { ...prev.elements, [draggingId]: { ...prev.elements[draggingId], left: Math.min(Math.max(0, x), 100), top: Math.min(Math.max(0, y), 100) } } }))
  }

  const handleFileUpload = async (e: any, isCert: boolean = false) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    const { error } = await supabase.storage.from('course_materials').upload(fileName, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('course_materials').getPublicUrl(fileName)
      if (isCert) setCertSettings({ ...certSettings, bgImage: publicUrl })
      else updateModule('content', publicUrl)
    }
    setUploading(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-[#00E5FF]"><RefreshCw className="animate-spin" /></div>

  return (
    <div className="w-full space-y-8 pb-20 text-white animate-in fade-in" onMouseUp={() => setDraggingId(null)} onMouseLeave={() => setDraggingId(null)} onMouseMove={handleMouseMove}>
      
      {/* 3️⃣ HEADER PROTEGIDO[cite: 3] */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-xl border border-white/5"><ChevronLeft size={20} /></button>
          <div>
            <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">{courseData?.title || 'Curso'}</h1>
            {isStudentMode && <p className="text-amber-500 text-[8px] font-black uppercase mt-1 tracking-widest">{isAdmin ? 'Simulación de Estudiante' : `Estudiante: ${currentUser?.full_name}`}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* El botón de simulación SOLO se renderiza si eres Admin[cite: 3] */}
          {isAdmin && (
            <button onClick={() => { setIsStudentMode(!isStudentMode); setActiveTab('modulos'); setSimulationResult(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${isStudentMode ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-zinc-500'}`}>
              {isStudentMode ? <Edit3 size={14}/> : <User size={14}/>} {isStudentMode ? 'Volver al Editor' : 'Simular Estudiante'}
            </button>
          )}

          {/* Los botones de pestañas solo los ve el admin (El estudiante sigue el flujo lineal)[cite: 3] */}
          {isAdmin && !isStudentMode && (
            <>
              <button onClick={() => setActiveTab('modulos')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeTab === 'modulos' ? 'bg-white/10' : 'text-zinc-500'}`}>Nodos</button>
              <button onClick={() => setActiveTab('certificado')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeTab === 'certificado' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-zinc-500'}`}>Certificado</button>
              <button onClick={() => supabase.from('courses').update({ modules, certificate_config: certSettings }).eq('id', id).then(() => alert("✅ SINCRONIZADO"))} className="bg-[#00E5FF] text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.2)]"><Save size={16} /> Publicar</button>
            </>
          )}

          {/* El estudiante solo ve el botón de certificado condicionado[cite: 3] */}
          {(!isAdmin || isStudentMode) && (
             <button onClick={() => { if (isUnlocked) setActiveTab('certificado'); }} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'certificado' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : (isUnlocked ? 'bg-white/5 text-white' : 'text-zinc-800 cursor-not-allowed')}`}>
               {!isUnlocked ? <Lock size={12}/> : <CheckCircle2 size={12}/>} Certificado Oficial
             </button>
          )}
        </div>
      </div>

      {activeTab === 'modulos' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* SIDEBAR DE NODOS */}
          <div className="xl:col-span-4 space-y-4">
             <h3 className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-[0.3em]">Red de Aprendizaje</h3>
             {modules.map((mod, index) => (
              <div key={mod.id} onClick={() => { setSelectedModId(mod.id); if (isStudentMode) setSimulationResult(null); }} className={`p-5 rounded-2xl flex items-center justify-between group border cursor-pointer transition-all ${selectedModId === mod.id ? 'bg-white/5 border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.05)]' : 'bg-[#050505] border-white/5'}`}>
                <div className="flex items-center gap-4">
                  {mod.type === 'video' ? <Video size={18} /> : mod.type === 'pdf' ? <FileText size={18} /> : mod.type === 'quiz' ? <ClipboardCheck size={18} /> : <FileCode size={18} />}
                  <p className={`text-[11px] font-black uppercase tracking-tight ${selectedModId === mod.id ? 'text-white' : 'text-zinc-500'}`}>{mod.title}</p>
                </div>
                {!isStudentMode && isAdmin && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); moveModule(index, 'up'); }}><ArrowUp size={14}/></button>
                    <button onClick={(e) => { e.stopPropagation(); moveModule(index, 'down'); }}><ArrowDown size={14}/></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteModule(mod.id); }} className="text-red-500"><Trash2 size={14}/></button>
                  </div>
                )}
              </div>
            ))}
            
            {!isStudentMode && isAdmin && (
              <div className="grid grid-cols-2 gap-3 mt-6 p-4 bg-white/[0.02] rounded-[2rem] border border-white/5">
                {[ {t: 'video', i: Video}, {t: 'embed', i: FileCode}, {t: 'pdf', i: FileText}, {t: 'quiz', i: ClipboardCheck} ].map(item => (
                  <button key={item.t} onClick={() => addModule(item.t)} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#00E5FF]/20 group transition-all">
                    <item.i size={18} className="text-zinc-600 group-hover:text-[#00E5FF]" />
                    <span className="text-[8px] font-black uppercase text-zinc-700 group-hover:text-white">{item.t}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-8">
            {selectedModule ? (
              <div className="bg-[#050505] border border-white/5 p-10 rounded-[3rem] space-y-8 animate-in slide-in-from-right-4 duration-500">
                {isStudentMode ? <h2 className="text-white text-3xl font-black italic uppercase">{selectedModule.title}</h2> : 
                <input type="text" value={selectedModule.title} onChange={(e) => updateModule('title', e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-xs font-bold outline-none" />}

                <div className="min-h-[400px]">
                  {/* EDITORES ADMIN */}
                  {!isStudentMode && isAdmin && (
                    <div className="space-y-6">
                      {selectedModule.type === 'video' && (
                        <div className="flex flex-col gap-4">
                           <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                             <button onClick={() => updateModule('videoSource', 'url')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase ${selectedModule.videoSource === 'url' ? 'bg-[#00E5FF] text-black' : 'text-zinc-500'}`}>Link</button>
                             <button onClick={() => updateModule('videoSource', 'file')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase ${selectedModule.videoSource === 'file' ? 'bg-[#00E5FF] text-black' : 'text-zinc-500'}`}>Archivo Local</button>
                           </div>
                           {selectedModule.videoSource === 'url' ? (
                             <input type="text" placeholder="URL de YouTube..." value={selectedModule.content} onChange={(e) => updateModule('content', e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs" />
                           ) : (
                             <div className="relative group">
                               <input type="file" accept="video/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                               <div className="w-full bg-white/5 border-2 border-dashed border-white/10 p-10 rounded-2xl text-center group-hover:border-[#00E5FF]/40 transition-all"><UploadCloud className="mx-auto mb-2 text-zinc-700" size={30} /><p className="text-zinc-500 text-[8px] font-black uppercase">Subir Video (MP4)</p></div>
                             </div>
                           )}
                        </div>
                      )}
                      {selectedModule.type === 'pdf' && (
                        <div className="relative group">
                          <input type="file" accept="application/pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          <div className="w-full bg-white/5 border-2 border-dashed border-white/10 p-10 rounded-2xl text-center group-hover:border-[#00E5FF]/40 transition-all"><FileText className="mx-auto mb-2 text-zinc-700" size={30} /><p className="text-zinc-500 text-[8px] font-black uppercase">Cargar Nuevo PDF</p></div>
                        </div>
                      )}
                      {selectedModule.type === 'embed' && (
                        <div className="space-y-2">
                           <label className="text-zinc-600 text-[8px] font-black uppercase ml-2">Código de Inserción (Iframe)</label>
                           <textarea rows={6} placeholder="<iframe>...</iframe>" value={selectedModule.content} onChange={(e) => updateModule('content', e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[#00E5FF] text-xs font-mono outline-none resize-none" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* VISUALIZADORES DINÁMICOS */}
                  <div className={!isStudentMode && selectedModule.type !== 'quiz' ? "mt-10" : ""}>
                    {selectedModule.type === 'video' && selectedModule.content && (
                      <div className="bg-black rounded-3xl overflow-hidden aspect-video shadow-2xl">
                        {selectedModule.content.includes('youtube') ? <iframe className="w-full h-full" src={selectedModule.content.replace('watch?v=', 'embed/')} /> : <video controls className="w-full h-full" key={selectedModule.content}><source src={selectedModule.content}/></video>}
                      </div>
                    )}
                    {selectedModule.type === 'pdf' && selectedModule.content && <iframe src={`${selectedModule.content}#toolbar=0`} className="w-full h-[600px] rounded-3xl border border-white/10 shadow-2xl" />}
                    {selectedModule.type === 'embed' && selectedModule.content && <div className="bg-black rounded-3xl overflow-hidden aspect-video border border-white/5 shadow-2xl"><div className="w-full h-full" dangerouslySetInnerHTML={{ __html: selectedModule.content }} /></div>}
                    
                    {selectedModule.type === 'quiz' && (
                      <div className="space-y-8 mt-6">
                        {!isStudentMode && isAdmin ? (
                          /* EDITOR QUIZ ADMIN */
                          <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                              <div className="space-y-2"><label className="text-[8px] font-black text-zinc-600 uppercase">Puntaje Máximo</label><input type="number" value={selectedModule.totalPoints} onChange={(e) => updateModule('totalPoints', Number(e.target.value))} className="w-full bg-black/50 p-3 rounded-xl text-[#00E5FF] font-bold" /></div>
                              <div className="space-y-2"><label className="text-[8px] font-black text-zinc-600 uppercase">Mínimo para Aprobar</label><input type="number" value={selectedModule.passingScore} onChange={(e) => updateModule('passingScore', Number(e.target.value))} className="w-full bg-black/50 p-3 rounded-xl text-[#00E5FF] font-bold" /></div>
                            </div>
                            {selectedModule.questions?.map((q: any, idx: number) => (
                              <div key={q.id} className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                                <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase"><span>Pregunta {idx+1} — {q.type === 'open' ? 'ABIERTA' : q.type}</span><button onClick={() => updateModule('questions', selectedModule.questions.filter((_,i)=>i!==idx))} className="text-red-500"><Trash2 size={14}/></button></div>
                                <input value={q.text} onChange={(e) => { const nq = [...selectedModule.questions]; nq[idx].text = e.target.value; updateModule('questions', nq); }} className="w-full bg-transparent border-b border-white/10 py-2 text-white outline-none font-bold" placeholder="Escribe la consigna..." />
                                
                                {q.type !== 'open' ? (
                                  <div className="grid grid-cols-2 gap-3 mt-4">
                                    {q.options.map((o:string, i:number) => {
                                      const isCor = q.type === 'boolean' ? q.correctAnswer === o : (q.correctAnswers || []).includes(o);
                                      return (
                                        <div key={i} className="relative">
                                          <input value={o} onChange={(e) => { const nq = [...selectedModule.questions]; nq[idx].options[i] = e.target.value; updateModule('questions', nq); }} className={`w-full p-3 rounded-xl text-[10px] border bg-[#050505] transition-all ${isCor ? 'border-[#00E5FF] text-[#00E5FF]' : 'border-white/5 text-zinc-500'}`} />
                                          <button onClick={() => { 
                                            const nq = [...selectedModule.questions]; if (q.type === 'boolean') nq[idx].correctAnswer = o;
                                            else { const cur = nq[idx].correctAnswers || []; nq[idx].correctAnswers = cur.includes(o) ? cur.filter((a:any)=>a!==o) : [...cur, o]; }
                                            updateModule('questions', nq);
                                          }} className="absolute right-3 top-3 text-zinc-800 hover:text-[#00E5FF]"><CheckCircle2 size={14}/></button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="mt-4"><textarea disabled className="w-full bg-black/20 border border-white/5 p-4 rounded-xl text-zinc-600 text-[10px] font-bold italic resize-none" placeholder="El estudiante verá un área libre para responder..." /></div>
                                )}
                              </div>
                            ))}
                            <div className="flex gap-4 justify-center">
                              <button onClick={() => addQuestion('multiple')} className="text-[8px] font-black uppercase bg-white/5 px-4 py-2 rounded-lg hover:text-[#00E5FF] transition-all">+ Opción Múltiple</button>
                              <button onClick={() => addQuestion('boolean')} className="text-[8px] font-black uppercase bg-white/5 px-4 py-2 rounded-lg hover:text-[#00E5FF] transition-all">+ V / F</button>
                              <button onClick={() => addQuestion('open')} className="text-[8px] font-black uppercase bg-white/5 px-4 py-2 rounded-lg hover:text-[#00E5FF] transition-all">+ Abierta</button>
                            </div>
                          </div>
                        ) : (
                          /* VISTA ESTUDIANTE QUIZ */
                          <div className="space-y-8 bg-white/[0.01] p-10 rounded-[2rem] border border-white/5">
                            {simulationResult ? (
                              <div className={`p-8 rounded-3xl text-center border animate-in zoom-in-95 ${simulationResult.passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                 <p className="text-5xl font-black italic">{simulationResult.score} / {selectedModule.totalPoints}</p>
                                 <p className={`text-[10px] font-black uppercase mt-3 ${simulationResult.passed ? 'text-green-500' : 'text-red-500'}`}>{simulationResult.passed ? '✅ APROBADO - CERTIFICADO DESBLOQUEADO' : '❌ NO ALCANZASTE EL MÍNIMO'}</p>
                                 <button onClick={() => {setSimulationResult(null); setUserAnswers({});}} className="mt-8 px-8 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase hover:bg-white/10">Reiniciar Evaluación</button>
                              </div>
                            ) : (
                              <>
                                {selectedModule.questions?.map((q: any, idx: number) => {
                                  const isSel = (opt: string) => (userAnswers[q.id] || []).includes(opt);
                                  return (
                                    <div key={q.id} className="space-y-4">
                                      <div className="flex items-center gap-4"><div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#00E5FF]/10 text-[#00E5FF] font-black text-xs">{idx + 1}</div><p className="text-lg font-bold">{q.text}</p></div>
                                      <div className="grid grid-cols-1 gap-3 ml-10">
                                        {q.type === 'open' ? (
                                          <textarea value={userAnswers[q.id]?.[0] || ''} onChange={(e) => setUserAnswers({...userAnswers, [q.id]: [e.target.value]})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none text-white focus:border-[#00E5FF]/50 transition-all" placeholder="Escribe tu respuesta cualitativa..." />
                                        ) : q.options.map((opt: string, i: number) => (
                                          <button key={i} onClick={() => toggleAnswer(q.id, opt, q.type === 'multiple')} className={`p-5 rounded-2xl border text-left text-[11px] font-bold transition-all flex items-center justify-between ${isSel(opt) ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'}`}>
                                            {opt} {q.type === 'multiple' && (isSel(opt) ? <CheckSquare size={16}/> : <Square size={16} className="opacity-20"/>)}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                                <button onClick={runSimulation} className="w-full bg-[#00E5FF] text-black py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(0,229,255,0.2)] hover:scale-[1.01] transition-all">Finalizar Evaluación</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* NAVEGACIÓN SECUENCIAL */}
                <div className="flex items-center justify-between border-t border-white/5 pt-8 mt-10">
                  <button onClick={() => { if(currentIndex>0) setSelectedModId(modules[currentIndex-1].id); }} disabled={currentIndex===0} className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${currentIndex===0?'opacity-20 cursor-not-allowed':'bg-white/5 text-white hover:bg-white/10'}`}><ChevronLeft size={16}/> Anterior</button>
                  <p className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.5em]">Nodo {currentIndex+1} de {modules.length}</p>
                  <button onClick={() => { if(currentIndex<modules.length-1) setSelectedModId(modules[currentIndex+1].id); }} disabled={currentIndex===modules.length-1} className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${currentIndex===modules.length-1?'opacity-20 cursor-not-allowed':'bg-[#00E5FF] text-black shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:scale-105'}`}>Siguiente <ChevronRight size={16}/></button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* VISTA CERTIFICADO (MALLA PDF NATIVA) */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in zoom-in-95 duration-500">
          
          {/* 4️⃣ EDITOR HTML INTERACTIVO (SOLO ADMIN)[cite: 3] */}
          {!isStudentMode && isAdmin && (
            <div className="xl:col-span-4 space-y-6">
              <div className="bg-[#050505] p-8 rounded-[2.5rem] border border-white/5 space-y-8">
                <h3 className="text-white text-xs font-black uppercase italic border-b border-white/5 pb-4 tracking-widest">Capas Neurales</h3>
                <div className="relative group"><input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, true)} className="absolute inset-0 opacity-0 cursor-pointer z-10" /><div className="w-full bg-white/5 border-2 border-dashed border-white/10 p-6 rounded-2xl text-center group-hover:border-[#00E5FF]/40 transition-all"><p className="text-zinc-500 text-[9px] font-bold uppercase">Subir Fondo Canva</p></div></div>
                {Object.keys(certSettings.elements).map(key => (
                  <div key={key} className="space-y-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase text-zinc-400">{certSettings.elements[key].label}</span><Palette size={12} className="text-zinc-600"/></div>
                    <input type="color" value={certSettings.elements[key].color} onChange={(e) => updateCertElement(key, 'color', e.target.value)} className="w-full h-6 bg-transparent border-0 cursor-pointer" />
                    <div className="space-y-1"><p className="text-[7px] font-bold text-zinc-600 uppercase">Escala (PDF)</p><input type="range" min="8" max="120" value={certSettings.elements[key].fontSize} onChange={(e) => updateCertElement(key, 'fontSize', Number(e.target.value))} className="w-full accent-[#00E5FF]" /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`${!isAdmin || isStudentMode ? 'xl:col-span-12' : 'xl:col-span-8'} flex flex-col items-center gap-10`}>
             
             {/* PANTALLA DE BLOQUEO PARA ESTUDIANTE NO APROBADO */}
             {isStudentMode && !isUnlocked ? (
                <div className="bg-[#050505] border border-red-500/20 p-20 rounded-[3rem] text-center space-y-6 max-w-2xl"><div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.1)]"><Lock size={40}/></div><h2 className="text-3xl font-black uppercase italic tracking-tighter">Certificado Bloqueado</h2><p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Acredita tu conocimiento en la evaluación final para liberar tu diploma oficial.</p></div>
             ) : (
               <div className="w-full flex flex-col items-center gap-6">
                  
                  {/* VISUALIZADOR MODO ADMIN (HTML ARRASTRABLE)[cite: 3] */}
                  {!isStudentMode && isAdmin ? (
                    <div ref={containerRef} className="relative w-full max-w-4xl aspect-[1.414/1] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 select-none rounded-[1.5rem]">
                       {certSettings.bgImage ? <img src={certSettings.bgImage} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="Cert" /> : <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"><img src="/logo-botisfy.png" className="w-96" alt="" /></div>}
                       
                       {Object.entries(certSettings.elements).map(([key, el]: [string, any]) => el.visible && (
                         <div 
                          key={key} 
                          onMouseDown={() => setDraggingId(key)} 
                          style={{ 
                            position: 'absolute', top: `${el.top}%`, left: `${el.left}%`, 
                            fontSize: `${el.fontSize}px`, 
                            color: el.color, transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', cursor: 'grab', zIndex: 50
                          }}
                         >
                           {key === 'name' ? (currentUser?.full_name || 'Nombre Apellido') : key === 'course' ? (courseData?.title || 'Nombre del Curso') : '03 de Mayo, 2026'}
                         </div>
                       ))}
                    </div>
                  ) : (
                    /* VISUALIZADOR MODO ESTUDIANTE (PDF REAL)[cite: 3] */
                    <div className="w-full flex flex-col items-center gap-6">
                      {pdfPreviewUrl ? (
                         <iframe src={`${pdfPreviewUrl}#toolbar=0`} className="w-full max-w-4xl aspect-[1.414/1] rounded-3xl border border-white/10 shadow-2xl bg-white" />
                      ) : (
                         <div className="w-full max-w-4xl aspect-[1.414/1] flex items-center justify-center border border-white/10 rounded-3xl bg-white/5 animate-pulse">
                            <RefreshCw className="animate-spin text-[#00E5FF] mb-4" size={40} />
                         </div>
                      )}
                      <button onClick={downloadPDF} disabled={isSaving} className="bg-[#00E5FF] text-black px-12 py-5 rounded-2xl font-black text-xs uppercase shadow-[0_0_40px_rgba(0,229,255,0.3)] hover:scale-105 transition-all flex items-center gap-3 active:scale-95">
                        {isSaving ? <RefreshCw className="animate-spin" size={18}/> : <Download size={18}/>} 
                        {isSaving ? 'Descargando...' : 'Descargar PDF Oficial'}
                      </button>
                    </div>
                  )}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  )
}