'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { jsPDF } from 'jspdf'
import { 
  ChevronLeft, Video, FileCode, FileText, 
  Trash2, CheckCircle2, ArrowUp, ArrowDown, 
  UploadCloud, RefreshCw, User, Edit3, Lock, Download, Square, CheckSquare, Eye
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
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false) 
  const [isStudentMode, setIsStudentMode] = useState(true) 
  
  const [isUnlocked, setIsUnlocked] = useState(false) 
  const [userAnswers, setUserAnswers] = useState<Record<number, string[]>>({}) 
  const [simulationResult, setSimulationResult] = useState<{score: number, passed: boolean} | null>(null)
  
  const [courseData, setCourseData] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [certSettings, setCertSettings] = useState<any>({
    bgImage: null,
    elements: {
      name: { top: 45, left: 50, fontSize: 40, color: '#000000', visible: true, label: 'Nombre Estudiante' },
      course: { top: 60, left: 50, fontSize: 25, color: '#00E5FF', visible: true, label: 'Nombre del Curso' },
      date: { top: 80, left: 50, fontSize: 12, color: '#94a3b8', visible: true, label: 'Fecha' }
    }
  })

  const getTodayFormatted = () => new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
    const fetchInitData = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return; }

      // 🚀 INGENIERÍA: Paralelización para velocidad máxima
      try {
        const [profileRes, courseRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          supabase.from('courses').select('*').eq('id', id).single()
        ])

        if (profileRes.data) {
          setCurrentUser(profileRes.data)
          const realIsAdmin = profileRes.data.role?.toLowerCase() === 'admin'
          setIsAdmin(realIsAdmin)
          setIsStudentMode(!realIsAdmin)
        }

        if (courseRes.data) {
          setCourseData(courseRes.data)
          setModules(courseRes.data.modules || [])
          if (courseRes.data.certificate_config?.elements) setCertSettings(courseRes.data.certificate_config)
          if (courseRes.data.modules?.length > 0) setSelectedModId(courseRes.data.modules[0].id)
        }
      } finally { setLoading(false) }
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

  // 🔄 SWAPPING LOGIC (CONTENIDOS Y PREGUNTAS)
  const moveItem = (list: any[], idx: number, dir: 'up' | 'down') => {
    const newList = [...list]
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= newList.length) return list
    const temp = newList[idx]; newList[idx] = newList[targetIdx]; newList[targetIdx] = temp;
    return newList
  }

  const updateModule = (field: string, value: any) => {
    if (isStudentMode && field !== 'questions') return
    setModules(modules.map(m => m.id === selectedModId ? { ...m, [field]: value } : m))
  }

  // 📝 MOTOR DE CALIFICACIÓN (70%)
  const runSimulation = () => {
    if (!selectedModule?.questions) return
    const objectiveQs = selectedModule.questions.filter((q: any) => q.type !== 'open')
    let correct = 0
    objectiveQs.forEach((q: any) => {
      const uAns = (userAnswers[q.id] || []).sort().join(',')
      const cAns = (q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : [])).sort().join(',')
      if (uAns === cAns && uAns !== "") correct++
    })
    const score = Math.round((correct / (objectiveQs.length || 1)) * (selectedModule.totalPoints || 10) * 10) / 10
    setSimulationResult({ score, passed: score >= (selectedModule.totalPoints || 10) * 0.7 })
    if (score >= (selectedModule.totalPoints || 10) * 0.7) setIsUnlocked(true)
  }

  const generatePDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1358] })
    if (certSettings.bgImage) {
      const img = new Image(); img.crossOrigin = "anonymous"; img.src = certSettings.bgImage;
      await new Promise((r) => img.onload = r); doc.addImage(img, 'PNG', 0, 0, 1920, 1358);
    }
    Object.entries(certSettings.elements).forEach(([key, el]: [string, any]) => {
      if (el.visible) {
        doc.setFontSize(el.fontSize * 2.4); doc.setTextColor(el.color); doc.setFont("helvetica", "bolditalic");
        let val = key === 'name' ? (currentUser?.full_name || 'STUDENT') : key === 'course' ? (courseData?.title || 'COURSE') : getTodayFormatted();
        doc.text(val.toUpperCase(), (el.left / 100) * 1920, (el.top / 100) * 1358, { align: 'center' });
      }
    });
    doc.save(`Certificado-${courseData?.title}.pdf`);
  }

  // 🌀 CARGA NEURAL
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-[#00E5FF]">
      <div className="relative">
        <div className="absolute inset-0 bg-[#00E5FF]/20 blur-3xl animate-pulse rounded-full" />
        <RefreshCw className="animate-spin relative z-10" size={40} />
      </div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando Neural Academy...</p>
    </div>
  )

  return (
    <div className="w-full space-y-8 pb-20 text-white animate-in fade-in" onMouseMove={(e) => {
      if (!draggingId || !containerRef.current || isStudentMode) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setCertSettings((p: any) => ({ ...p, elements: { ...p.elements, [draggingId]: { ...p.elements[draggingId], left: x, top: y } } }))
    }} onMouseUp={() => setDraggingId(null)}>
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all"><ChevronLeft size={20} /></button>
          <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">{courseData?.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={() => setIsStudentMode(!isStudentMode)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${isStudentMode ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-zinc-500'}`}>
              {isStudentMode ? <Edit3 size={14}/> : <User size={14}/>} {isStudentMode ? 'MODO DOCENTE' : 'VISTA ESTUDIANTE'}
            </button>
          )}
          {!isStudentMode && isAdmin && (
            <button onClick={() => supabase.from('courses').update({ modules, certificate_config: certSettings }).eq('id', id).then(() => alert("✅ Nodo Sincronizado"))} className="bg-[#00E5FF] text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-[0_0_20px_rgba(0,229,255,0.2)]">Publicar Cambios</button>
          )}
        </div>
      </div>

      <div className="flex gap-8 border-b border-white/5">
        <button onClick={() => setActiveTab('modulos')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'modulos' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]' : 'text-zinc-600'}`}>1. Contenidos</button>
        <button onClick={() => { if(!isStudentMode || isUnlocked) setActiveTab('certificado') }} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'certificado' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]' : (isUnlocked || !isStudentMode ? 'text-zinc-400' : 'text-zinc-800 cursor-not-allowed')}`}>2. Certificación {isStudentMode && !isUnlocked && <Lock size={10} className="inline ml-1" />}</button>
      </div>

      {activeTab === 'modulos' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-4 space-y-4">
            <div className="space-y-3">
              {modules.map((mod, idx) => (
                <div key={mod.id} onClick={() => { setSelectedModId(mod.id); setSimulationResult(null); }} className={`p-5 rounded-2xl flex items-center justify-between group border cursor-pointer transition-all ${selectedModId === mod.id ? 'bg-[#00E5FF]/5 border-[#00E5FF]/40' : 'bg-[#050505] border-white/5'}`}>
                  <div className="flex items-center gap-4">
                    {mod.type === 'video' ? <Video size={18} /> : mod.type === 'pdf' ? <FileText size={18} /> : mod.type === 'quiz' ? <CheckSquare size={18} /> : <FileCode size={18} />}
                    <p className="text-[11px] font-black uppercase tracking-tight">{mod.title}</p>
                  </div>
                  {!isStudentMode && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setModules(moveItem(modules, idx, 'up')); }} disabled={idx === 0}><ArrowUp size={14}/></button>
                      <button onClick={(e) => { e.stopPropagation(); setModules(moveItem(modules, idx, 'down')); }} disabled={idx === modules.length-1}><ArrowDown size={14}/></button>
                      <button onClick={(e) => { e.stopPropagation(); setModules(modules.filter(m=>m.id!==mod.id)); }} className="text-red-500"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!isStudentMode && (
              <div className="grid grid-cols-2 gap-3 mt-6 p-4 bg-white/[0.02] rounded-[2rem] border border-white/5">
                {[ {t:'video', i:Video}, {t:'embed', i:FileCode}, {t:'pdf', i:FileText}, {t:'quiz', i:CheckSquare} ].map(item => (
                  <button key={item.t} onClick={() => setModules([...modules, { id: Date.now(), title: `NUEVO ${item.t.toUpperCase()}`, type: item.t, content: '', questions: [] }])} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#00E5FF]/20 group transition-all text-center">
                    <item.i size={18} className="text-zinc-600 group-hover:text-[#00E5FF]" />
                    <span className="text-[7px] font-black uppercase text-zinc-700">{item.t}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-8">
            {selectedModule && (
              <div className="bg-[#050505] border border-white/5 p-10 rounded-[3rem] space-y-8 animate-in slide-in-from-right-4">
                {!isStudentMode ? (
                  <div className="space-y-6">
                    <input type="text" value={selectedModule.title} onChange={(e) => updateModule('title', e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-xl font-black italic uppercase outline-none focus:border-[#00E5FF]/40" />
                    {selectedModule.type !== 'quiz' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative"><input type="file" onChange={(e) => handleFileUpload(e, 'content')} className="absolute inset-0 opacity-0 cursor-pointer" /><div className="bg-white/5 p-8 rounded-2xl border-2 border-dashed border-white/10 text-center"><UploadCloud className="mx-auto mb-2 text-zinc-700" /><p className="text-[8px] font-black text-zinc-500 uppercase">Subir Archivo</p></div></div>
                        <textarea value={selectedModule.content} onChange={(e) => updateModule('content', e.target.value)} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-[#00E5FF] text-xs font-mono" placeholder="Enlace o Embed..." rows={3} />
                      </div>
                    )}
                  </div>
                ) : <h2 className="text-white text-3xl font-black italic uppercase">{selectedModule.title}</h2>}

                <div className="bg-black rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative min-h-[400px] flex items-center justify-center">
                  {selectedModule.type === 'quiz' ? (
                    <div className="w-full p-10 space-y-10 overflow-y-auto max-h-[600px]">
                       {!isStudentMode && (
                         <div className="flex gap-2 justify-center pb-6 border-b border-white/5">
                            {['simple', 'multiple', 'open'].map(t => <button key={t} onClick={() => updateModule('questions', [...(selectedModule.questions || []), {id: Date.now(), type: t, text: 'Nueva Pregunta', options: ['Opción A', 'Opción B'], correctAnswers: []}])} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase hover:text-[#00E5FF] transition-all">+ {t}</button>)}
                         </div>
                       )}
                       {simulationResult ? (
                         <div className="text-center p-12 bg-white/[0.01] rounded-[2.5rem] border border-white/5">
                           <p className="text-6xl font-black italic">{simulationResult.score}/{selectedModule.totalPoints || 10}</p>
                           <p className={`mt-4 font-black ${simulationResult.passed ? 'text-green-500' : 'text-red-500'}`}>{simulationResult.passed ? 'APROBADO' : 'FALLIDO'}</p>
                           <button onClick={() => {setSimulationResult(null); setUserAnswers({});}} className="mt-10 px-10 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase">Reintentar</button>
                         </div>
                       ) : (
                         <div className="space-y-10">
                           {selectedModule.questions?.map((q: any, qIdx: number) => (
                             <div key={q.id} className="space-y-6">
                               <div className="flex justify-between items-center">
                                 <p className="text-lg font-bold">{qIdx+1}. {q.text}</p>
                                 {!isStudentMode && (
                                   <div className="flex gap-2">
                                     <button onClick={(e) => { e.stopPropagation(); updateModule('questions', moveItem(selectedModule.questions, qIdx, 'up')); }} disabled={qIdx === 0}><ArrowUp size={14}/></button>
                                     <button onClick={(e) => { e.stopPropagation(); updateModule('questions', moveItem(selectedModule.questions, qIdx, 'down')); }} disabled={qIdx === selectedModule.questions.length - 1}><ArrowDown size={14}/></button>
                                     <button onClick={() => updateModule('questions', selectedModule.questions.filter((x:any)=>x.id!==q.id))}><Trash2 size={14} className="text-red-500"/></button>
                                   </div>
                                 )}
                               </div>
                               <div className="grid gap-3 ml-6">
                                 {q.type === 'open' ? <textarea className="w-full bg-white/5 border border-white/10 p-6 rounded-[2rem] outline-none text-sm italic" placeholder="Respuesta..." /> : 
                                 q.options?.map((opt: string) => {
                                   const active = !isStudentMode ? (q.correctAnswers || []).includes(opt) : (userAnswers[q.id] || []).includes(opt);
                                   return (
                                     <button key={opt} onClick={() => {
                                       const list = !isStudentMode ? (q.correctAnswers || []) : (userAnswers[q.id] || []);
                                       const next = q.type === 'multiple' ? (list.includes(opt) ? list.filter((x:any)=>x!==opt) : [...list, opt]) : [opt];
                                       if(!isStudentMode) { const nqs = [...selectedModule.questions]; nqs[qIdx].correctAnswers = next; updateModule('questions', nqs); }
                                       else { setUserAnswers({...userAnswers, [q.id]: next}); }
                                     }} className={`p-5 rounded-2xl border text-left text-[11px] flex items-center justify-between ${active ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                                       {opt} {active ? <CheckSquare size={18} /> : <Square size={18} className="opacity-20" />}
                                     </button>
                                   )
                                 })}
                               </div>
                             </div>
                           ))}
                           {isStudentMode && <button onClick={runSimulation} className="w-full bg-[#00E5FF] text-black py-7 rounded-[2rem] font-black uppercase text-[10px]">Calificar Examen</button>}
                         </div>
                       )}
                    </div>
                  ) : (
                    <>
                      {selectedModule.type === 'video' && (selectedModule.content?.includes('youtube.com') ? <iframe className="w-full aspect-video" src={getEmbedUrl(selectedModule.content)} allowFullScreen /> : <video className="w-full aspect-video" src={selectedModule.content} controls />)}
                      {selectedModule.type === 'pdf' && <iframe src={selectedModule.content} className="w-full h-[600px]" />}
                      {selectedModule.type === 'embed' && <div className="w-full h-full p-4" dangerouslySetInnerHTML={{ __html: selectedModule.content }} />}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 🖼️ CANVAS DE CERTIFICACIÓN (SLIDERS + FECHA DINÁMICA) */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-8">
            <div ref={containerRef} className="relative w-full aspect-[1.414/1] bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/10">
               {certSettings.bgImage && <img src={certSettings.bgImage} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />}
               {Object.entries(certSettings.elements).map(([eid, el]: [string, any]) => el.visible && (
                 <div key={eid} onMouseDown={() => !isStudentMode && setDraggingId(eid)} style={{ top: `${el.top}%`, left: `${el.left}%`, fontSize: `${el.fontSize}px`, color: el.color }} className={`absolute transform -translate-x-1/2 -translate-y-1/2 font-bold italic select-none ${!isStudentMode ? 'cursor-move ring-2 ring-[#00E5FF]/20 hover:ring-[#00E5FF] px-2' : ''}`}>
                   {eid === 'name' ? (currentUser?.full_name || el.label) : eid === 'course' ? (courseData?.title || el.label) : eid === 'date' ? getTodayFormatted() : el.label}
                 </div>
               ))}
            </div>
          </div>
          <div className="xl:col-span-4 space-y-6">
            {!isStudentMode ? (
              <div className="bg-[#050505] p-8 rounded-[2rem] border border-white/5 space-y-8">
                <input type="file" onChange={(e) => handleFileUpload(e, 'cert')} className="text-[10px] text-zinc-500" />
                {Object.entries(certSettings.elements).map(([eid, el]: [string, any]) => (
                  <div key={eid} className="space-y-4">
                    <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase text-[#00E5FF] italic">{eid}</span><span className="text-[10px] font-bold text-zinc-600">{el.fontSize}px</span></div>
                    <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <input type="range" min="10" max="150" value={el.fontSize} onChange={(e) => setCertSettings({...certSettings, elements: {...certSettings.elements, [eid]: {...el, fontSize: Number(e.target.value)}}})} className="w-full accent-[#00E5FF] bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer" />
                      <input type="color" value={el.color} onChange={(e) => setCertSettings({...certSettings, elements: {...certSettings.elements, [eid]: {...el, color: e.target.value}}})} className="w-full h-8 bg-black rounded p-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={generatePDF} className="w-full bg-[#00E5FF] text-black py-6 rounded-3xl font-black text-xs uppercase shadow-[0_0_40px_rgba(0,229,255,0.3)] flex items-center justify-center gap-3"><Download size={20}/> Descargar Diploma</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}