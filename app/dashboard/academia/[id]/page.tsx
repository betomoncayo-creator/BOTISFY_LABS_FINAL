'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { 
  ChevronLeft, Video, FileCode, FileText, HelpCircle, 
  Save, Trash2, CheckCircle2, ArrowUp, ArrowDown, 
  UploadCloud, RefreshCw, Eye, Plus, Settings, 
  Layout, ClipboardCheck, MessageSquare, ToggleLeft, Play, XCircle, Square, CheckSquare
} from 'lucide-react'

export default function CourseEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('modulos')
  const [selectedModId, setSelectedModId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // 🧪 ESTADOS DE SIMULACIÓN Y MULTI-RESPUESTA
  const [quizPreviewMode, setQuizPreviewMode] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<number, string[]>>({}) 
  const [simulationResult, setSimulationResult] = useState<{score: number, passed: boolean} | null>(null)

  const [modules, setModules] = useState<any[]>([])
  const [certSettings, setCertSettings] = useState({
    bgImage: null, showName: true, showDate: true, showCourse: true, fontColor: '#ffffff'
  })

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true)
      const { data } = await supabase.from('courses').select('modules, certificate_config').eq('id', id).single()
      if (data) {
        if (data.modules) setModules(data.modules)
        if (data.certificate_config) setCertSettings(data.certificate_config)
        if (data.modules?.length > 0) setSelectedModId(data.modules[0].id)
      }
      setLoading(false)
    }
    if (id) fetchCourseData()
  }, [id, supabase])

  const selectedModule = modules.find(m => m.id === selectedModId)

  const updateModule = (field: string, value: any) => {
    setModules(modules.map(m => m.id === selectedModId ? { ...m, [field]: value } : m))
  }

  // ☁️ FUNCIÓN DE CARGA RESTAURADA
  const handleFileUpload = async (e: any) => {
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
      updateModule('content', publicUrl)
    }
    setUploading(false)
  }

  // 🧠 LÓGICA DE SCORING CON CRÉDITO PARCIAL Y PENALIZACIÓN
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

      // Cálculo: (Aciertos - Errores) / Total de Correctas
      const aciertos = seleccionadas.filter(a => correctasDefinidas.includes(a)).length
      const errores = seleccionadas.filter(a => !correctasDefinidas.includes(a)).length
      
      let scorePregunta = (aciertos - errores) / correctasDefinidas.length
      if (scorePregunta < 0) scorePregunta = 0 // No restamos del total del examen
      totalScoreAcumulado += scorePregunta * puntosPorPregunta
    })

    const finalScore = Math.round(totalScoreAcumulado)
    setSimulationResult({ score: finalScore, passed: finalScore >= selectedModule.passingScore })
  }

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
      options: type === 'multiple' ? ['Opción 1', 'Opción 2', 'Opción 3'] : ['Verdadero', 'Falso'], 
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

  const handlePublish = async () => {
    setIsSaving(true)
    await supabase.from('courses').update({ modules, certificate_config: certSettings }).eq('id', id)
    alert("✅ SINCRONIZACIÓN EXITOSA")
    setIsSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-[#00E5FF]"><RefreshCw className="animate-spin" /></div>

  return (
    <div className="w-full space-y-8 pb-20 text-white animate-in fade-in">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-xl border border-white/5"><ChevronLeft size={20} /></button>
          <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter italic leading-none">Gestión de <span className="text-[#00E5FF]">Contenidos</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('modulos')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase ${activeTab === 'modulos' ? 'bg-white/10' : 'text-zinc-500'}`}>Nodos</button>
          <button onClick={() => setActiveTab('certificado')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase ${activeTab === 'certificado' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-zinc-500'}`}>Certificado</button>
          <button onClick={handlePublish} disabled={isSaving} className="bg-[#00E5FF] text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:scale-105 transition-all">
            {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} Publicar
          </button>
        </div>
      </div>

      {activeTab === 'modulos' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* MALLA NEURAL */}
          <div className="xl:col-span-4 space-y-4">
             {modules.map((mod, index) => (
              <div key={mod.id} onClick={() => { setSelectedModId(mod.id); setSimulationResult(null); setQuizPreviewMode(false); }} className={`p-5 rounded-2xl flex items-center justify-between group border cursor-pointer transition-all ${selectedModId === mod.id ? 'bg-white/5 border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.05)]' : 'bg-[#050505] border-white/5'}`}>
                <div className="flex items-center gap-4">
                  {mod.type === 'video' ? <Video size={18} /> : mod.type === 'pdf' ? <FileText size={18} /> : mod.type === 'quiz' ? <ClipboardCheck size={18} /> : <FileCode size={18} />}
                  <p className={`text-[11px] font-black uppercase ${selectedModId === mod.id ? 'text-white' : 'text-zinc-500'}`}>{mod.title}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); moveModule(index, 'up'); }} className="p-1 hover:text-[#00E5FF]"><ArrowUp size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveModule(index, 'down'); }} className="p-1 hover:text-[#00E5FF]"><ArrowDown size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteModule(mod.id); }} className="p-1 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 mt-6 p-4 bg-white/[0.02] rounded-[2rem] border border-white/5">
              {[{t:'video', i:Video}, {t:'embed', i:FileCode}, {t:'pdf', i:FileText}, {t:'quiz', i:ClipboardCheck}].map(item => (
                <button key={item.t} onClick={() => addModule(item.t)} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#00E5FF]/20 transition-all group">
                  <item.i size={18} className="text-zinc-600 group-hover:text-[#00E5FF]" />
                  <span className="text-[8px] font-black uppercase text-zinc-700 group-hover:text-white">{item.t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* EDITOR / SIMULADOR */}
          <div className="xl:col-span-8">
            {selectedModule ? (
              <div className="bg-[#050505] border border-white/5 p-10 rounded-[3rem] space-y-8 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-white text-xl font-black italic uppercase leading-none">Nodo: {selectedModule.type}</h2>
                  {selectedModule.type === 'quiz' && (
                    <button onClick={() => {setQuizPreviewMode(!quizPreviewMode); setSimulationResult(null); setUserAnswers({});}} className={`px-6 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${quizPreviewMode ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]' : 'border-white/10 text-zinc-500 hover:text-white'}`}>
                      {quizPreviewMode ? 'Volver al Editor' : 'Simular como Estudiante'}
                    </button>
                  )}
                </div>

                <input type="text" value={selectedModule.title} onChange={(e) => updateModule('title', e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-xs font-bold outline-none focus:border-[#00E5FF]/40 transition-all" />

                {/* 🚀 LÓGICA DE QUIZ */}
                {selectedModule.type === 'quiz' && (
                  <div className="space-y-8">
                    {!quizPreviewMode ? (
                      <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-4 bg-white/5 p-6 rounded-2xl border border-white/10">
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
                            <input value={q.text} onChange={(e) => {
                              const nq = [...selectedModule.questions]; nq[idx].text = e.target.value; updateModule('questions', nq);
                            }} className="w-full bg-transparent border-b border-white/10 py-2 text-white outline-none font-bold" placeholder="Escribe la pregunta..." />
                            
                            {q.type !== 'open' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                {q.options.map((o:string, i:number) => {
                                  const isCorrect = q.type === 'boolean' ? q.correctAnswer === o : (q.correctAnswers || []).includes(o);
                                  return (
                                    <div key={i} className="relative">
                                      <input value={o} readOnly={q.type === 'boolean'} onChange={(e) => {
                                        const nq = [...selectedModule.questions]; nq[idx].options[i] = e.target.value; updateModule('questions', nq);
                                      }} className={`w-full p-3 rounded-xl text-[10px] border transition-all outline-none bg-[#050505] ${isCorrect ? 'border-[#00E5FF] text-[#00E5FF]' : 'border-white/5 text-zinc-500'}`} />
                                      <button onClick={() => {
                                        const nq = [...selectedModule.questions];
                                        if (q.type === 'boolean') nq[idx].correctAnswer = o;
                                        else {
                                          const current = nq[idx].correctAnswers || [];
                                          nq[idx].correctAnswers = current.includes(o) ? current.filter((a:any) => a !== o) : [...current, o];
                                        }
                                        updateModule('questions', nq);
                                      }} className={`absolute right-3 top-3 ${isCorrect ? 'text-[#00E5FF]' : 'text-zinc-800'}`}><CheckCircle2 size={14}/></button>
                                    </div>
                                  )
                                })}
                                {q.type === 'multiple' && (
                                  <button onClick={() => {
                                    const nq = [...selectedModule.questions]; nq[idx].options.push(`Opción ${nq[idx].options.length + 1}`); updateModule('questions', nq);
                                  }} className="p-3 border border-dashed border-white/10 rounded-xl text-[8px] font-black uppercase text-zinc-600 hover:text-[#00E5FF]">+ Añadir Opción</button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-4 justify-center pt-6 border-t border-white/5">
                           <button onClick={() => addQuestion('multiple')} className="text-[8px] font-black uppercase bg-white/5 px-6 py-3 rounded-xl hover:text-[#00E5FF] border border-white/5">+ Opción Múltiple</button>
                           <button onClick={() => addQuestion('boolean')} className="text-[8px] font-black uppercase bg-white/5 px-6 py-3 rounded-xl hover:text-[#00E5FF] border border-white/5">+ V / F</button>
                           <button onClick={() => addQuestion('open')} className="text-[8px] font-black uppercase bg-white/5 px-6 py-3 rounded-xl hover:text-[#00E5FF] border border-white/5">+ Abierta</button>
                        </div>
                      </div>
                    ) : (
                      /* SIMULADOR CON PENALIZACIÓN */
                      <div className="space-y-8 animate-in slide-in-from-bottom-4 bg-white/[0.01] p-10 rounded-[2rem] border border-white/5">
                        {simulationResult && (
                          <div className={`p-8 rounded-3xl text-center border ${simulationResult.passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                             <p className="text-5xl font-black italic">{simulationResult.score} / {selectedModule.totalPoints}</p>
                             <p className={`text-[10px] font-black uppercase mt-3 ${simulationResult.passed ? 'text-green-500' : 'text-red-500'}`}>
                               {simulationResult.passed ? '✅ APROBADO - CERTIFICADO DESBLOQUEADO' : '❌ REPROBADO'}
                             </p>
                             <button onClick={() => {setSimulationResult(null); setUserAnswers({});}} className="mt-8 px-8 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase">Reiniciar Prueba</button>
                          </div>
                        )}

                        <div className="space-y-12">
                          {selectedModule.questions?.map((q: any, idx: number) => {
                            const seleccionadas = userAnswers[q.id] || [];
                            const correctas = q.type === 'boolean' ? [q.correctAnswer] : (q.correctAnswers || []);
                            const showFeedback = simulationResult !== null && q.type !== 'open';

                            return (
                              <div key={q.id} className="space-y-6">
                                <div className="flex items-center gap-4">
                                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${showFeedback ? (seleccionadas.every(s => correctas.includes(s)) && seleccionadas.length === correctas.length ? 'bg-green-500 text-black' : 'bg-red-500 text-black') : 'bg-[#00E5FF]/10 text-[#00E5FF]'}`}>{idx + 1}</div>
                                   <p className="text-lg font-bold text-white tracking-tight leading-tight">{q.text}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 ml-12">
                                  {q.type === 'open' ? (
                                    <textarea value={seleccionadas[0] || ''} onChange={(e) => !simulationResult && setUserAnswers({...userAnswers, [q.id]: [e.target.value]})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none text-zinc-400 italic text-sm" placeholder="Respuesta abierta..." disabled={simulationResult !== null} />
                                  ) : (
                                    q.options.map((opt: string, i: number) => {
                                      const isSelected = seleccionadas.includes(opt);
                                      const isCorrect = correctas.includes(opt);
                                      let buttonStyle = "bg-white/5 border-white/5 text-zinc-500";
                                      if (isSelected) buttonStyle = "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]";
                                      if (showFeedback) {
                                        if (isCorrect) buttonStyle = "bg-green-500/20 border-green-500 text-green-500 opacity-100";
                                        else if (isSelected && !isCorrect) buttonStyle = "bg-red-500/20 border-red-500 text-red-500 opacity-100";
                                      }

                                      return (
                                        <button key={i} onClick={() => !simulationResult && toggleAnswer(q.id, opt, q.type === 'multiple')} disabled={simulationResult !== null} className={`p-5 rounded-2xl border text-left text-[11px] font-bold transition-all relative flex items-center justify-between group ${buttonStyle}`}>
                                          {opt}
                                          {q.type === 'multiple' && (isSelected ? <CheckSquare size={16} /> : <Square size={16} className="opacity-20" />)}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {!simulationResult && <button onClick={runSimulation} className="w-full bg-[#00E5FF] text-black py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(0,229,255,0.2)]">Procesar Evaluación Neural</button>}
                      </div>
                    )}
                  </div>
                )}

                {/* 📂 VISORES FIJOS[cite: 1] */}
                {selectedModule.type === 'pdf' && (
                  <div className="space-y-6">
                    {selectedModule.content && <div className="bg-white/5 rounded-2xl border border-white/10 h-[500px] overflow-hidden"><iframe src={`${selectedModule.content}#toolbar=0`} className="w-full h-full border-none" /></div>}
                    <div className="relative group">
                      <input type="file" accept="application/pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <div className="w-full bg-white/5 border-2 border-dashed border-white/10 p-12 rounded-[2rem] text-center"><UploadCloud className="mx-auto mb-4 text-zinc-700" size={40} /><p className="text-zinc-500 text-[9px] font-black uppercase">Subir PDF Instructivo</p></div>
                    </div>
                  </div>
                )}

                {selectedModule.type === 'video' && (
                  <div className="space-y-6">
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                      <button onClick={() => updateModule('videoSource', 'url')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase ${selectedModule.videoSource === 'url' ? 'bg-[#00E5FF] text-black' : 'text-zinc-500'}`}>Link</button>
                      <button onClick={() => updateModule('videoSource', 'file')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase ${selectedModule.videoSource === 'file' ? 'bg-[#00E5FF] text-black' : 'text-zinc-500'}`}>Archivo</button>
                    </div>
                    {selectedModule.content && (
                      <div className="bg-black rounded-3xl overflow-hidden border border-white/10 aspect-video">
                        {selectedModule.content.includes('youtube.com') ? <iframe className="w-full h-full" src={selectedModule.content.replace('watch?v=', 'embed/')} /> : <video controls className="w-full h-full" key={selectedModule.content}><source src={selectedModule.content} /></video>}
                      </div>
                    )}
                    {selectedModule.videoSource === 'file' && <input type="file" accept="video/*" onChange={handleFileUpload} className="w-full bg-white/5 p-4 rounded-xl text-xs" />}
                  </div>
                )}

                {selectedModule.type === 'embed' && (
                  <div className="space-y-6">
                    <textarea rows={6} placeholder="<iframe>...</iframe>" value={selectedModule.content} onChange={(e) => updateModule('content', e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[#00E5FF] text-xs font-mono outline-none resize-none" />
                    {selectedModule.content && <div className="bg-black rounded-3xl overflow-hidden border border-white/10 aspect-video"><div className="w-full h-full" dangerouslySetInnerHTML={{ __html: selectedModule.content }} /></div>}
                  </div>
                )}
              </div>
            ) : <div className="h-full flex items-center justify-center text-zinc-700 uppercase tracking-widest text-[10px] italic">Selecciona un nodo neural para comenzar</div>}
          </div>
        </div>
      ) : (
        /* VISTA CERTIFICADO[cite: 1] */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in zoom-in-95">
          <div className="space-y-6 bg-[#050505] p-10 rounded-[3rem] border border-white/5">
            <h3 className="text-white text-sm font-black italic uppercase tracking-widest">Diplomado Dinámico</h3>
            <div className="space-y-3">
              {['showName', 'showCourse', 'showDate'].map(v => (
                <div key={v} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#00E5FF]/20 transition-all">
                  <span className="text-white text-[10px] font-bold uppercase">{v}</span>
                  <button onClick={() => setCertSettings({...certSettings, [v as keyof typeof certSettings]: !certSettings[v as keyof typeof certSettings]})} className={`w-10 h-5 rounded-full relative transition-all ${certSettings[v as keyof typeof certSettings] ? 'bg-[#00E5FF]' : 'bg-zinc-800'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${certSettings[v as keyof typeof certSettings] ? 'left-6' : 'left-1'}`} /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-[2rem] aspect-[1.414/1] flex flex-col items-center justify-center p-12 text-center text-black shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 opacity-5 flex items-center justify-center"><img src="/logo-botisfy.png" alt="" className="w-64" /></div>
             <p className="font-serif italic text-2xl mb-8 relative z-10">Certificado de Logro</p>
             {certSettings.showName && <h4 className="text-5xl font-black uppercase italic mb-4 relative z-10 tracking-tighter">Freddy Moncayo</h4>}
             {certSettings.showCourse && <p className="text-[#00E5FF] text-3xl font-black uppercase italic relative z-10">Automatización con IA 101</p>}
             {certSettings.showDate && <p className="mt-12 text-zinc-400 font-bold uppercase text-[8px] tracking-[0.4em] relative z-10">Expedido el 02 de Mayo, 2026</p>}
          </div>
        </div>
      )}
    </div>
  )
}