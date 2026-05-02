'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { 
  ChevronLeft, Video, FileCode, FileText, HelpCircle, 
  Save, Trash2, CheckCircle2, ArrowUp, ArrowDown, 
  UploadCloud, RefreshCw, Eye, Plus, Settings, 
  Layout, ClipboardCheck, MessageSquare, ToggleLeft, Play, XCircle, Square, CheckSquare, Type, Move, Maximize, Palette
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
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [quizPreviewMode, setQuizPreviewMode] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<number, string[]>>({}) 
  const [simulationResult, setSimulationResult] = useState<{score: number, passed: boolean} | null>(null)
  const [modules, setModules] = useState<any[]>([])

  const defaultCert = {
    bgImage: null,
    elements: {
      name: { top: 45, left: 50, fontSize: 40, color: '#FFFFFF', visible: true, label: 'Nombre Estudiante' },
      course: { top: 60, left: 50, fontSize: 25, color: '#00E5FF', visible: true, label: 'Nombre del Curso' },
      date: { top: 80, left: 50, fontSize: 12, color: '#94a3b8', visible: true, label: 'Fecha de Emisión' }
    }
  }
  const [certSettings, setCertSettings] = useState<any>(defaultCert)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true)
      const { data } = await supabase.from('courses').select('modules, certificate_config').eq('id', id).single()
      if (data) {
        if (data.modules) setModules(data.modules)
        if (data.certificate_config && data.certificate_config.elements) {
          setCertSettings(data.certificate_config)
        }
        if (data.modules?.length > 0) setSelectedModId(data.modules[0].id)
      }
      setLoading(false)
    }
    if (id) fetchCourseData()
  }, [id, supabase])

  const selectedModule = modules.find(m => m.id === selectedModId)

  // --- FUNCIONES DE GESTIÓN DE NODOS ---
  const updateModule = (field: string, value: any) => {
    setModules(modules.map(m => m.id === selectedModId ? { ...m, [field]: value } : m))
  }

  const addModule = (type: string) => {
    const newMod: any = {
      id: Date.now(), type, title: `NUEVO NODO ${type.toUpperCase()}`, content: '', videoSource: 'url'
    }
    if (type === 'quiz') {
      newMod.questions = []
      newMod.passingScore = 7
      newMod.totalPoints = 10
    }
    setModules([...modules, newMod])
    setSelectedModId(newMod.id)
  }

  const deleteModule = (modId: number) => {
    const filtered = modules.filter(m => m.id !== modId)
    setModules(filtered)
    if (selectedModId === modId) setSelectedModId(filtered[0]?.id || null)
  }

  const moveModule = (index: number, direction: 'up' | 'down') => {
    const newModules = [...modules]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newModules.length) return
    [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]]
    setModules(newModules)
  }

  const handleFileUpload = async (e: any, isCert: boolean = false) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    const { error } = await supabase.storage.from('course_materials').upload(fileName, file, {
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded / p.total) * 100)),
    })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('course_materials').getPublicUrl(fileName)
      if (isCert) setCertSettings({ ...certSettings, bgImage: publicUrl })
      else updateModule('content', publicUrl)
    }
    setUploading(false)
  }

  // --- LÓGICA DE QUIZ ---
  const handleScoreSync = (field: 'totalPoints' | 'passingScore', value: number) => {
    if (!selectedModule) return
    const currentMax = selectedModule.totalPoints || 10
    const currentMin = selectedModule.passingScore || 7
    if (field === 'totalPoints') {
      const newMin = Math.round(value * (currentMin / currentMax))
      setModules(modules.map(m => m.id === selectedModId ? { ...m, totalPoints: value, passingScore: newMin } : m))
    } else {
      updateModule('passingScore', value > currentMax ? currentMax : value)
    }
  }

  const addQuestion = (type: 'multiple' | 'boolean' | 'open') => {
    const newQ = { 
      id: Date.now(), type, text: '', 
      options: type === 'multiple' ? ['Opción 1', 'Opción 2'] : ['Verdadero', 'Falso'], 
      correctAnswers: [], correctAnswer: type === 'boolean' ? 'Verdadero' : '' 
    }
    updateModule('questions', [...(selectedModule.questions || []), newQ])
  }

  const toggleAnswer = (qId: number, option: string, multi: boolean) => {
    const current = userAnswers[qId] || []
    if (multi) {
      const next = current.includes(option) ? current.filter(i => i !== option) : [...current, option]
      setUserAnswers({...userAnswers, [qId]: next})
    } else {
      setUserAnswers({...userAnswers, [qId]: [option]})
    }
  }

  const runSimulation = () => {
    if (!selectedModule.questions?.length) return
    const objectiveQs = selectedModule.questions.filter((q: any) => q.type !== 'open')
    if (objectiveQs.length === 0) return setSimulationResult({ score: selectedModule.totalPoints, passed: true })
    let totalScoreAcumulado = 0
    const puntosPorPregunta = selectedModule.totalPoints / objectiveQs.length
    objectiveQs.forEach((q: any) => {
      const seleccionadas = userAnswers[q.id] || []
      const correctasDefinidas = q.type === 'boolean' ? [q.correctAnswer] : (q.correctAnswers || [])
      if (correctasDefinidas.length === 0) return
      const aciertos = seleccionadas.filter(a => correctasDefinidas.includes(a)).length
      const errores = seleccionadas.filter(a => !correctasDefinidas.includes(a)).length
      let scorePregunta = (aciertos - errores) / correctasDefinidas.length
      totalScoreAcumulado += Math.max(0, scorePregunta) * puntosPorPregunta
    })
    const finalScore = Math.round(totalScoreAcumulado)
    setSimulationResult({ score: finalScore, passed: finalScore >= selectedModule.passingScore })
  }

  // --- LÓGICA DE CERTIFICADO ---
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    updateCertElement(draggingId, 'left', Math.min(Math.max(0, x), 100))
    updateCertElement(draggingId, 'top', Math.min(Math.max(0, y), 100))
  }

  const updateCertElement = (key: string, field: string, value: any) => {
    setCertSettings((prev: any) => ({
      ...prev,
      elements: { ...prev.elements, [key]: { ...prev.elements[key], [field]: value } }
    }))
  }

  const handlePublish = async () => {
    setIsSaving(true)
    await supabase.from('courses').update({ modules, certificate_config: certSettings }).eq('id', id)
    alert("✅ SINCRONIZACIÓN EXITOSA")
    setIsSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-[#00E5FF]"><RefreshCw className="animate-spin" /></div>

  return (
    <div className="w-full space-y-8 pb-20 text-white animate-in fade-in" onMouseUp={() => setDraggingId(null)}>
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-xl border border-white/5"><ChevronLeft size={20} /></button>
          <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter italic">Gestión de <span className="text-[#00E5FF]">Contenidos</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('modulos')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeTab === 'modulos' ? 'bg-white/10' : 'text-zinc-500'}`}>Nodos</button>
          <button onClick={() => setActiveTab('certificado')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeTab === 'certificado' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-zinc-500'}`}>Certificado</button>
          <button onClick={handlePublish} disabled={isSaving} className="bg-[#00E5FF] text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:scale-105 transition-all">
            {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} Publicar
          </button>
        </div>
      </div>

      {activeTab === 'modulos' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* LISTA IZQUIERDA */}
          <div className="xl:col-span-4 space-y-4">
             {modules.map((mod, index) => (
              <div key={mod.id} onClick={() => { setSelectedModId(mod.id); setSimulationResult(null); setQuizPreviewMode(false); }} className={`p-5 rounded-2xl flex items-center justify-between group border cursor-pointer transition-all ${selectedModId === mod.id ? 'bg-white/5 border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.05)]' : 'bg-[#050505] border-white/5'}`}>
                <div className="flex items-center gap-4">
                  {mod.type === 'video' ? <Video size={18} /> : mod.type === 'pdf' ? <FileText size={18} /> : mod.type === 'quiz' ? <ClipboardCheck size={18} /> : <FileCode size={18} />}
                  <p className={`text-[11px] font-black uppercase tracking-tight ${selectedModId === mod.id ? 'text-white' : 'text-zinc-500'}`}>{mod.title}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); moveModule(index, 'up'); }} className="p-1 hover:text-[#00E5FF]"><ArrowUp size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveModule(index, 'down'); }} className="p-1 hover:text-[#00E5FF]"><ArrowDown size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteModule(mod.id); }} className="p-1 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 mt-6 p-4 bg-white/[0.02] rounded-[2rem] border border-white/5">
              {['video', 'embed', 'pdf', 'quiz'].map(t => (
                <button key={t} onClick={() => addModule(t)} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#00E5FF]/20 group">
                  <Plus size={18} className="text-zinc-600 group-hover:text-[#00E5FF]" />
                  <span className="text-[8px] font-black uppercase text-zinc-700 group-hover:text-white">{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* EDITORES DE NODOS RECONSTRUIDOS */}
          <div className="xl:col-span-8">
            {selectedModule ? (
              <div className="bg-[#050505] border border-white/5 p-10 rounded-[3rem] space-y-8 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-white text-xl font-black italic uppercase leading-none">Nodo: {selectedModule.type}</h2>
                  {selectedModule.type === 'quiz' && (
                    <button onClick={() => {setQuizPreviewMode(!quizPreviewMode); setSimulationResult(null); setUserAnswers({});}} className={`px-6 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${quizPreviewMode ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]' : 'border-white/10 text-zinc-500 hover:text-white'}`}>
                      {quizPreviewMode ? 'Volver al Editor' : 'Probar Simulación'}
                    </button>
                  )}
                </div>

                <input type="text" value={selectedModule.title} onChange={(e) => updateModule('title', e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-xs font-bold outline-none focus:border-[#00E5FF]/40 transition-all" />

                {/* --- EDITOR QUIZ --- */}
                {selectedModule.type === 'quiz' && (
                  <div className="space-y-8">
                    {!quizPreviewMode ? (
                      <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-4 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-2xl">
                          <div className="space-y-2">
                            <label className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Puntaje Máximo</label>
                            <input type="number" value={selectedModule.totalPoints} onChange={(e) => handleScoreSync('totalPoints', Number(e.target.value))} className="w-full bg-black/50 p-3 rounded-xl text-[#00E5FF] font-bold outline-none" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Mínimo Aprobatorio</label>
                            <input type="number" value={selectedModule.passingScore} onChange={(e) => handleScoreSync('passingScore', Number(e.target.value))} className="w-full bg-black/50 p-3 rounded-xl text-[#00E5FF] font-bold outline-none" />
                          </div>
                        </div>
                        {selectedModule.questions?.map((q: any, idx: number) => (
                          <div key={q.id} className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4 group">
                            <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase"><span>Pregunta {idx+1} — {q.type}</span><button onClick={() => updateModule('questions', selectedModule.questions.filter((_,i)=>i!==idx))}><Trash2 size={14}/></button></div>
                            <input value={q.text} onChange={(e) => { const nq = [...selectedModule.questions]; nq[idx].text = e.target.value; updateModule('questions', nq); }} className="w-full bg-transparent border-b border-white/10 py-2 text-white outline-none font-bold" placeholder="Escribe la pregunta..." />
                            {q.type !== 'open' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                {q.options.map((o:string, i:number) => {
                                  const isCorrect = q.type === 'boolean' ? q.correctAnswer === o : (q.correctAnswers || []).includes(o);
                                  return (
                                    <div key={i} className="relative">
                                      <input value={o} readOnly={q.type === 'boolean'} onChange={(e) => { const nq = [...selectedModule.questions]; nq[idx].options[i] = e.target.value; updateModule('questions', nq); }} className={`w-full p-3 rounded-xl text-[10px] border bg-[#050505] transition-all ${isCorrect ? 'border-[#00E5FF] text-[#00E5FF]' : 'border-white/5 text-zinc-500'}`} />
                                      <button onClick={() => { const nq = [...selectedModule.questions]; if (q.type === 'boolean') nq[idx].correctAnswer = o; else { const current = nq[idx].correctAnswers || []; nq[idx].correctAnswers = current.includes(o) ? current.filter((a:any) => a !== o) : [...current, o]; } updateModule('questions', nq); }} className={`absolute right-3 top-3 ${isCorrect ? 'text-[#00E5FF]' : 'text-zinc-800'}`}><CheckCircle2 size={14}/></button>
                                    </div>
                                  )
                                })}
                                {q.type === 'multiple' && <button onClick={() => { const nq = [...selectedModule.questions]; nq[idx].options.push(`Opción ${nq[idx].options.length + 1}`); updateModule('questions', nq); }} className="p-3 border border-dashed border-white/10 rounded-xl text-[8px] font-black uppercase">+ Añadir Opción</button>}
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-4 justify-center pt-6"><button onClick={() => addQuestion('multiple')} className="text-[8px] font-black uppercase bg-white/5 px-6 py-3 rounded-xl hover:text-[#00E5FF] border border-white/5">+ Opción Múltiple</button><button onClick={() => addQuestion('boolean')} className="text-[8px] font-black uppercase bg-white/5 px-6 py-3 rounded-xl hover:text-[#00E5FF] border border-white/5">+ V / F</button><button onClick={() => addQuestion('open')} className="text-[8px] font-black uppercase bg-white/5 px-6 py-3 rounded-xl hover:text-[#00E5FF] border border-white/5">+ Abierta</button></div>
                      </div>
                    ) : (
                      <div className="space-y-8 bg-white/[0.01] p-10 rounded-[2rem] border border-white/5">
                        {simulationResult && (
                          <div className={`p-8 rounded-3xl text-center border ${simulationResult.passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                             <p className="text-5xl font-black italic">{simulationResult.score} / {selectedModule.totalPoints}</p>
                             <p className={`text-[10px] font-black uppercase mt-3 ${simulationResult.passed ? 'text-green-500' : 'text-red-500'}`}>{simulationResult.passed ? '✅ APROBADO' : '❌ REPROBADO'}</p>
                          </div>
                        )}
                        {selectedModule.questions?.map((q: any, idx: number) => {
                           const seleccionadas = userAnswers[q.id] || [];
                           const correctas = q.type === 'boolean' ? [q.correctAnswer] : (q.correctAnswers || []);
                           const showFeedback = simulationResult !== null && q.type !== 'open';
                           const isCorrect = seleccionadas.every(s => correctas.includes(s)) && seleccionadas.length === correctas.length;
                           return (
                            <div key={q.id} className="space-y-6">
                              <div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${showFeedback ? (isCorrect ? 'bg-green-500 text-black' : 'bg-red-500 text-black') : 'bg-[#00E5FF]/10 text-[#00E5FF]'}`}>{idx + 1}</div><p className="text-lg font-bold">{q.text}</p></div>
                              <div className="grid grid-cols-1 gap-3 ml-12">
                                {q.type === 'open' ? <textarea value={seleccionadas[0] || ''} onChange={(e) => setUserAnswers({...userAnswers, [q.id]: [e.target.value]})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none" disabled={simulationResult !== null} /> : q.options.map((opt: string, i: number) => {
                                  const isSelected = seleccionadas.includes(opt);
                                  const isCorrectOpt = correctas.includes(opt);
                                  let style = isSelected ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]" : "bg-white/5 border-white/5 text-zinc-500";
                                  if (showFeedback) { if (isCorrectOpt) style = "bg-green-500/20 border-green-500 text-green-500"; else if (isSelected) style = "bg-red-500/20 border-red-500 text-red-500"; }
                                  return <button key={i} onClick={() => !simulationResult && toggleAnswer(q.id, opt, q.type === 'multiple')} className={`p-5 rounded-2xl border text-left text-[11px] font-bold transition-all flex items-center justify-between ${style}`}>{opt} {q.type === 'multiple' && (isSelected ? <CheckSquare size={16}/> : <Square size={16}/>)}</button>
                                })}
                              </div>
                            </div>
                           )
                        })}
                        {!simulationResult && <button onClick={runSimulation} className="w-full bg-[#00E5FF] text-black py-6 rounded-3xl font-black text-xs uppercase shadow-[0_0_40px_rgba(0,229,255,0.2)]">Procesar Evaluación</button>}
                      </div>
                    )}
                  </div>
                )}

                {/* --- EDITOR PDF --- */}
                {selectedModule.type === 'pdf' && (
                  <div className="space-y-6">
                    {selectedModule.content && <div className="bg-white/5 rounded-2xl border border-white/10 h-[500px] overflow-hidden"><iframe src={`${selectedModule.content}#toolbar=0`} className="w-full h-full border-none" /></div>}
                    <div className="relative group"><input type="file" accept="application/pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" /><div className="w-full bg-white/5 border-2 border-dashed border-white/10 p-12 rounded-[2rem] text-center"><UploadCloud className="mx-auto mb-4 text-zinc-700" size={40} /><p className="text-zinc-500 text-[9px] font-black uppercase">Subir PDF</p></div></div>
                  </div>
                )}

                {/* --- EDITOR VIDEO --- */}
                {selectedModule.type === 'video' && (
                  <div className="space-y-6">
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit"><button onClick={() => updateModule('videoSource', 'url')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase ${selectedModule.videoSource === 'url' ? 'bg-[#00E5FF] text-black' : 'text-zinc-500'}`}>Link</button><button onClick={() => updateModule('videoSource', 'file')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase ${selectedModule.videoSource === 'file' ? 'bg-[#00E5FF] text-black' : 'text-zinc-500'}`}>Archivo</button></div>
                    {selectedModule.content && <div className="bg-black rounded-3xl overflow-hidden border border-white/10 aspect-video">{selectedModule.content.includes('youtube.com') ? <iframe className="w-full h-full" src={selectedModule.content.replace('watch?v=', 'embed/')} /> : <video controls className="w-full h-full" key={selectedModule.content}><source src={selectedModule.content} /></video>}</div>}
                    {selectedModule.videoSource === 'file' && <input type="file" accept="video/*" onChange={handleFileUpload} className="w-full bg-white/5 p-4 rounded-xl text-xs" />}
                    {selectedModule.videoSource === 'url' && <input type="text" placeholder="https://..." value={selectedModule.content} onChange={(e) => updateModule('content', e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-xs font-mono outline-none" />}
                  </div>
                )}

                {/* --- EDITOR EMBED --- */}
                {selectedModule.type === 'embed' && (
                  <div className="space-y-6"><textarea rows={6} placeholder="<iframe>...</iframe>" value={selectedModule.content} onChange={(e) => updateModule('content', e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[#00E5FF] text-xs font-mono outline-none resize-none" />{selectedModule.content && <div className="bg-black rounded-3xl overflow-hidden border border-white/10 aspect-video"><div className="w-full h-full" dangerouslySetInnerHTML={{ __html: selectedModule.content }} /></div>}</div>
                )}
              </div>
            ) : <div className="h-full flex items-center justify-center text-zinc-700 uppercase tracking-widest text-[10px]">Selecciona un nodo</div>}
          </div>
        </div>
      ) : (
        /* --- ESTUDIO DE DISEÑO DE CERTIFICADO --- */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in zoom-in-95" onMouseMove={handleMouseMove}>
          <div className="xl:col-span-4 space-y-6">
            <div className="bg-[#050505] p-8 rounded-[2.5rem] border border-white/5 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <h3 className="text-white text-xs font-black uppercase italic flex items-center gap-2"><UploadCloud size={16} className="text-[#00E5FF]" /> Plantilla Canva</h3>
                <div className="relative group"><input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, true)} className="absolute inset-0 opacity-0 cursor-pointer z-10" /><div className="w-full bg-white/5 border-2 border-dashed border-white/10 p-6 rounded-2xl text-center"><p className="text-zinc-500 text-[9px] font-bold uppercase">Subir PNG/JPG</p></div></div>
              </div>
              <div className="space-y-10">
                {certSettings.elements && Object.keys(certSettings.elements).map((key) => (
                  <div key={key} className="space-y-4 border-t border-white/5 pt-6 first:border-0 first:pt-0">
                    <div className="flex items-center justify-between"><span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Type size={12} className="text-[#00E5FF]" /> {certSettings.elements[key].label}</span><button onClick={() => updateCertElement(key, 'visible', !certSettings.elements[key].visible)} className={`w-8 h-4 rounded-full relative ${certSettings.elements[key].visible ? 'bg-[#00E5FF]' : 'bg-zinc-800'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${certSettings.elements[key].visible ? 'right-0.5' : 'left-0.5'}`} /></button></div>
                    {certSettings.elements[key].visible && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3"><Palette size={14} className="text-zinc-600" /><input type="color" value={certSettings.elements[key].color} onChange={(e) => updateCertElement(key, 'color', e.target.value)} className="w-full h-8 bg-transparent border-0 cursor-pointer" /></div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1"><label className="text-zinc-600 text-[8px] font-black uppercase">Eje X (%)</label><input type="range" min="0" max="100" value={certSettings.elements[key].left} onChange={(e) => updateCertElement(key, 'left', Number(e.target.value))} className="w-full accent-[#00E5FF]" /></div>
                           <div className="space-y-1"><label className="text-zinc-600 text-[8px] font-black uppercase">Eje Y (%)</label><input type="range" min="0" max="100" value={certSettings.elements[key].top} onChange={(e) => updateCertElement(key, 'top', Number(e.target.value))} className="w-full accent-[#00E5FF]" /></div>
                        </div>
                        <div className="space-y-1"><label className="text-zinc-600 text-[8px] font-black uppercase">Tamaño</label><input type="range" min="8" max="120" value={certSettings.elements[key].fontSize} onChange={(e) => updateCertElement(key, 'fontSize', Number(e.target.value))} className="w-full accent-[#00E5FF]" /></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="xl:col-span-8 flex flex-col items-center">
             <div ref={containerRef} className="relative w-full aspect-[1.414/1] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 select-none">
                {certSettings.bgImage ? <img src={certSettings.bgImage} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="Cert" /> : <div className="absolute inset-0 flex items-center justify-center opacity-5"><img src="/logo-botisfy.png" className="w-96" alt="" /></div>}
                <div className="absolute inset-0">
                  {certSettings.elements && Object.entries(certSettings.elements).map(([key, el]: [string, any]) => el.visible && (
                    <div key={key} onMouseDown={() => setDraggingId(key)} style={{ position: 'absolute', top: `${el.top}%`, left: `${el.left}%`, fontSize: `${el.fontSize}px`, color: el.color, transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', cursor: draggingId === key ? 'grabbing' : 'grab', zIndex: draggingId === key ? 50 : 10 }}>
                      {key === 'name' ? 'Freddy Moncayo' : key === 'course' ? 'Automatización con IA 101' : '02 de Mayo, 2026'}
                    </div>
                  ))}
                </div>
             </div>
             <p className="mt-8 text-zinc-600 text-[8px] font-bold uppercase italic tracking-widest">Tip: Arrastra los textos directamente sobre el diploma.</p>
          </div>
        </div>
      )}
    </div>
  )
}