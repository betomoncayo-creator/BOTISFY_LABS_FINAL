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
  
  // 🔐 SEGURIDAD Y ROLES
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isStudentMode, setIsStudentMode] = useState(true) 
  
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

  // 1️⃣ OBTENER DATOS DESDE TABLA PROFILES
  useEffect(() => {
    const fetchInitData = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return; }

      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userData) {
        setCurrentUser(userData)
        const userIsAdmin = userData.role?.toLowerCase() === 'admin'
        setIsAdmin(userIsAdmin)
        setIsStudentMode(!userIsAdmin) 
      }

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

  // 2️⃣ MOTOR PDF NATIVO
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
        if (key === 'name') textValue = currentUser?.full_name || 'Estudiante Botisfy';
        else if (key === 'course') textValue = courseData?.title || 'Certificación Botisfy';
        else textValue = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

        doc.text(textValue, xPos, yPos, { align: 'center', baseline: 'middle' });
      }
    });
    return doc;
  };

  const loadPDFPreview = async () => {
    try {
      const doc = await generatePDFDocument();
      const pdfBlob = doc.output('blob');
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(URL.createObjectURL(pdfBlob));
    } catch (e) { console.error(e); }
  };

  const downloadPDF = async () => {
    setIsSaving(true);
    try {
      const doc = await generatePDFDocument();
      const safeName = currentUser?.full_name ? currentUser.full_name.replace(/\s+/g, '_') : 'Estudiante';
      doc.save(`Certificado-${safeName}-${id}.pdf`);
    } catch (error) { alert("Error en descarga"); } 
    finally { setIsSaving(false); }
  };

  useEffect(() => {
    if (isStudentMode && isUnlocked && activeTab === 'certificado' && currentUser) {
      loadPDFPreview();
    }
  }, [isStudentMode, isUnlocked, activeTab, currentUser]);

  // --- LOGICA DE GESTIÓN ---
  const updateModule = (field: string, value: any) => {
    if (isStudentMode) return
    setModules(modules.map(m => m.id === selectedModId ? { ...m, [field]: value } : m))
  }

  const addModule = (type: string) => {
    const newMod: any = { id: Date.now(), type, title: `NUEVO NODO ${type.toUpperCase()}`, content: '', videoSource: 'url', questions: type === 'quiz' ? [] : undefined, passingScore: 7, totalPoints: 10 }
    setModules([...modules, newMod]); setSelectedModId(newMod.id);
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
      totalScore += Math.max(0, (aciertos - errores) / (cor.length || 1)) * puntosPorPregunta
    })
    const passed = Math.round(totalScore) >= (selectedModule.passingScore || 7)
    setSimulationResult({ score: Math.round(totalScore), passed }); if (passed) setIsUnlocked(true)
  }

  const handleFileUpload = async (e: any, isCert: boolean = false) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const { error } = await supabase.storage.from('course_materials').upload(fileName, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('course_materials').getPublicUrl(fileName);
      if (isCert) setCertSettings({ ...certSettings, bgImage: publicUrl });
      else updateModule('content', publicUrl);
    }
    setUploading(false);
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-[#00E5FF]"><RefreshCw className="animate-spin" /></div>

  return (
    <div className="w-full space-y-8 pb-20 text-white animate-in fade-in" onMouseUp={() => setDraggingId(null)} onMouseMove={(e) => {
      if (!draggingId || !containerRef.current || isStudentMode) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setCertSettings((prev: any) => ({ ...prev, elements: { ...prev.elements, [draggingId]: { ...prev.elements[draggingId], left: Math.min(Math.max(0, x), 100), top: Math.min(Math.max(0, y), 100) } } }))
    }}>
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-xl border border-white/5"><ChevronLeft size={20} /></button>
          <div>
            <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">{courseData?.title || 'Curso'}</h1>
            {isStudentMode && <p className="text-amber-500 text-[8px] font-black uppercase mt-1 tracking-widest">{isAdmin ? 'Simulación Activa' : `Sesión: ${currentUser?.full_name}`}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={() => { setIsStudentMode(!isStudentMode); setActiveTab('modulos'); setSimulationResult(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${isStudentMode ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-zinc-500'}`}>
              {isStudentMode ? <Edit3 size={14}/> : <User size={14}/>} {isStudentMode ? 'Volver al Editor' : 'Simular Estudiante'}
            </button>
          )}
          {!isStudentMode && isAdmin && (
            <>
              <button onClick={() => setActiveTab('modulos')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase ${activeTab === 'modulos' ? 'bg-white/10' : 'text-zinc-500'}`}>Nodos</button>
              <button onClick={() => setActiveTab('certificado')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase ${activeTab === 'certificado' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-zinc-500'}`}>Certificado</button>
              <button onClick={() => supabase.from('courses').update({ modules, certificate_config: certSettings }).eq('id', id).then(() => alert("✅ SINCRONIZADO"))} className="bg-[#00E5FF] text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.2)]"><Save size={16} /> Publicar</button>
            </>
          )}
          {isStudentMode && (
             <button onClick={() => { if (isUnlocked) setActiveTab('certificado'); }} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'certificado' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : (isUnlocked ? 'bg-white/5 text-white' : 'text-zinc-800 cursor-not-allowed')}`}>
               {!isUnlocked ? <Lock size={12}/> : <CheckCircle2 size={12}/>} Certificado
             </button>
          )}
        </div>
      </div>

      {activeTab === 'modulos' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-4 space-y-4">
             {modules.map((mod) => (
              <div key={mod.id} onClick={() => { setSelectedModId(mod.id); if (isStudentMode) setSimulationResult(null); }} className={`p-5 rounded-2xl flex items-center justify-between group border cursor-pointer transition-all ${selectedModId === mod.id ? 'bg-white/5 border-[#00E5FF]/40' : 'bg-[#050505] border-white/5'}`}>
                <div className="flex items-center gap-4">
                  {mod.type === 'video' ? <Video size={18} /> : mod.type === 'pdf' ? <FileText size={18} /> : mod.type === 'quiz' ? <ClipboardCheck size={18} /> : <FileCode size={18} />}
                  <p className={`text-[11px] font-black uppercase tracking-tight ${selectedModId === mod.id ? 'text-white' : 'text-zinc-500'}`}>{mod.title}</p>
                </div>
              </div>
            ))}
            {!isStudentMode && isAdmin && (
              <div className="grid grid-cols-2 gap-3 mt-6 p-4 bg-white/[0.02] rounded-[2rem] border border-white/5">
                {['video', 'embed', 'pdf', 'quiz'].map(t => (
                  <button key={t} onClick={() => addModule(t)} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#00E5FF]/20 text-[8px] font-black uppercase text-zinc-700 hover:text-white transition-all">{t}</button>
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-8">
            {selectedModule && (
              <div className="bg-[#050505] border border-white/5 p-10 rounded-[3rem] space-y-8 animate-in slide-in-from-right-4">
                {isStudentMode ? <h2 className="text-white text-3xl font-black italic uppercase">{selectedModule.title}</h2> : 
                <input type="text" value={selectedModule.title} onChange={(e) => updateModule('title', e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-xs font-bold outline-none" />}
                
                {selectedModule.type === 'video' && selectedModule.content && (
                  <div className="bg-black rounded-3xl overflow-hidden aspect-video shadow-2xl">
                    {selectedModule.content.includes('youtube') ? <iframe className="w-full h-full" src={selectedModule.content.replace('watch?v=', 'embed/')} /> : <video controls className="w-full h-full" key={selectedModule.content}><source src={selectedModule.content}/></video>}
                  </div>
                )}
                {selectedModule.type === 'pdf' && selectedModule.content && <iframe src={`${selectedModule.content}#toolbar=0`} className="w-full h-[600px] rounded-3xl border border-white/10 shadow-2xl" />}
                {selectedModule.type === 'embed' && selectedModule.content && <div className="bg-black rounded-3xl overflow-hidden aspect-video border border-white/5 shadow-2xl"><div className="w-full h-full" dangerouslySetInnerHTML={{ __html: selectedModule.content }} /></div>}
                
                {selectedModule.type === 'quiz' && (
                  <div className="space-y-8 bg-white/[0.01] p-10 rounded-[2rem] border border-white/5">
                    {simulationResult && isStudentMode ? (
                      <div className="text-center p-8"><p className="text-5xl font-black italic">{simulationResult.score} / {selectedModule.totalPoints}</p><p className="text-[10px] uppercase mt-4 text-[#00E5FF]">{simulationResult.passed ? '✅ Aprobado' : '❌ Reintentar'}</p></div>
                    ) : (
                      selectedModule.questions?.map((q: any, idx: number) => (
                        <div key={idx} className="space-y-4">
                          <p className="text-lg font-bold">{q.text}</p>
                          <div className="grid grid-cols-1 gap-3">
                            {q.options?.map((opt: string, i: number) => (
                              <button key={i} onClick={() => (userAnswers[q.id] || []).includes(opt) ? setUserAnswers({...userAnswers, [q.id]: userAnswers[q.id].filter((x:any)=>x!==opt)}) : setUserAnswers({...userAnswers, [q.id]: [...(userAnswers[q.id]||[]), opt]})} className={`p-5 rounded-2xl border text-left text-[11px] transition-all ${(userAnswers[q.id] || []).includes(opt) ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]' : 'bg-white/5 border-white/5 text-zinc-500'}`}>{opt}</button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                    {isStudentMode && !simulationResult && <button onClick={runSimulation} className="w-full bg-[#00E5FF] text-black py-6 rounded-3xl font-black text-xs uppercase shadow-[0_0_40px_rgba(0,229,255,0.2)]">Finalizar Evaluación</button>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-10">
          {pdfPreviewUrl ? (
             <iframe src={`${pdfPreviewUrl}#toolbar=0`} className="w-full max-w-4xl aspect-[1.414/1] rounded-3xl shadow-2xl bg-white" />
          ) : (
             <div className="w-full max-w-4xl aspect-[1.414/1] bg-white/5 rounded-3xl flex items-center justify-center animate-pulse"><RefreshCw className="animate-spin text-[#00E5FF]" size={40} /></div>
          )}
          <button onClick={downloadPDF} disabled={isSaving} className="bg-[#00E5FF] text-black px-12 py-5 rounded-2xl font-black text-xs uppercase shadow-[0_0_40px_rgba(0,229,255,0.3)] hover:scale-105 transition-all flex items-center gap-3">
            {isSaving ? <RefreshCw className="animate-spin" size={18}/> : <Download size={18}/>} Descargar Diploma PDF
          </button>
        </div>
      )}
    </div>
  )
}