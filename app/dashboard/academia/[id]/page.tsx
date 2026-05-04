'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { jsPDF } from 'jspdf'
import { 
  ChevronLeft, Video, FileCode, FileText, 
  Save, Trash2, CheckCircle2, ArrowUp, ArrowDown, 
  UploadCloud, RefreshCw, Plus, User, Edit3, ChevronRight, Lock, Download, Square, CheckSquare, XCircle, Eye, Info
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
  
  // 🔐 SEGURIDAD DE ROLES
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false) // Valida si el usuario es Admin en DB
  const [isStudentMode, setIsStudentMode] = useState(true) // Switch visual para el Admin
  
  // 📝 EVALUACIÓN
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
      date: { top: 80, left: 50, fontSize: 12, color: '#94a3b8', visible: true, label: 'Fecha de Emisión' }
    }
  })

  useEffect(() => {
    const fetchInitData = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return; }

      // 🔍 VALIDACIÓN DE ROL REAL
      const { data: userData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (userData) {
        setCurrentUser(userData)
        const realIsAdmin = userData.role?.toLowerCase() === 'admin'
        setIsAdmin(realIsAdmin)
        setIsStudentMode(!realIsAdmin) // Si no es admin, forzar Modo Estudiante
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

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  }

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
    <div className="w-full space-y-8 pb-20 text-white animate-in fade-in">
      
      {/* 🟢 HEADER DINÁMICO SEGÚN ROL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-xl border border-white/5"><ChevronLeft size={20} /></button>
          <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">{courseData?.title}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Muestra switch de modo SOLO si el usuario es Admin real */}
          {isAdmin && (
            <button onClick={() => { setIsStudentMode(!isStudentMode); setSimulationResult(null); }} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${isStudentMode ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-zinc-500'}`}>
              {isStudentMode ? <Edit3 size={14}/> : <User size={14}/>} {isStudentMode ? 'MODO DOCENTE' : 'VISTA ESTUDIANTE'}
            </button>
          )}

          {/* Botón publicar SOLO para Admin real en modo editor */}
          {isAdmin && !isStudentMode && (
            <button onClick={() => supabase.from('courses').update({ modules, certificate_config: certSettings }).eq('id', id).then(() => alert("✅ Publicado"))} className="bg-[#00E5FF] text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-[0_0_20px_rgba(0,229,255,0.2)]">Publicar Cambios</button>
          )}

          {/* Pestaña de Certificado Estudiante (Visible pero bloqueada) */}
          {(!isAdmin || isStudentMode) && (
            <button 
              onClick={() => setActiveTab('certificado')}
              className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'certificado' ? 'bg-[#00E5FF] text-black' : 'bg-white/5 text-zinc-500'}`}
            >
              {isUnlocked ? <CheckCircle2 size={14}/> : <Lock size={14}/>} Certificado
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-8 border-b border-white/5">
        <button onClick={() => setActiveTab('modulos')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'modulos' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]' : 'text-zinc-600'}`}>1. Contenidos</button>
        {isAdmin && !isStudentMode && (
          <button onClick={() => setActiveTab('certificado')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'certificado' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]' : 'text-zinc-400'}`}>2. Configuración Certificado</button>
        )}
      </div>

      {activeTab === 'modulos' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* SIDEBAR */}
          <div className="xl:col-span-4 space-y-4">
            {modules.map((mod) => (
              <div key={mod.id} onClick={() => { setSelectedModId(mod.id); setSimulationResult(null); }} className={`p-5 rounded-2xl flex items-center justify-between group border cursor-pointer transition-all ${selectedModId === mod.id ? 'bg-[#00E5FF]/5 border-[#00E5FF]/40' : 'bg-[#050505] border-white/5'}`}>
                <div className="flex items-center gap-4">
                  {mod.type === 'video' ? <Video size={18} /> : mod.type === 'pdf' ? <FileText size={18} /> : mod.type === 'quiz' ? <CheckSquare size={18} /> : <FileCode size={18} />}
                  <p className="text-[11px] font-black uppercase tracking-tight">{mod.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="xl:col-span-8">
            {selectedModule && (
              <div className="bg-[#050505] border border-white/5 p-10 rounded-[3rem] space-y-8 animate-in slide-in-from-right-4">
                <h2 className="text-white text-3xl font-black italic uppercase">{selectedModule.title}</h2>
                <div className="bg-black rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative min-h-[400px] flex items-center justify-center">
                  {selectedModule.type === 'quiz' ? (
                    <div className="w-full p-10 space-y-10">
                       {simulationResult ? (
                         <div className="text-center"><p className="text-6xl font-black italic">{simulationResult.score}/{selectedModule.totalPoints || 10}</p><p className={`mt-4 font-black ${simulationResult.passed ? 'text-green-500' : 'text-red-500'}`}>{simulationResult.passed ? 'APROBADO' : 'NO ALCANZASTE EL 70%'}</p></div>
                       ) : (
                         <div className="space-y-8">
                           {selectedModule.questions?.map((q: any, idx: number) => (
                             <div key={q.id} className="space-y-4">
                               <p className="text-lg font-bold">{idx+1}. {q.text}</p>
                               <div className="grid gap-3 ml-6">
                                 {q.options?.map((opt: string) => {
                                   const active = (userAnswers[q.id] || []).includes(opt);
                                   return (
                                     <button key={opt} onClick={() => {
                                       const list = userAnswers[q.id] || [];
                                       const next = q.type === 'multiple' ? (list.includes(opt) ? list.filter((x:any)=>x!==opt) : [...list, opt]) : [opt];
                                       setUserAnswers({...userAnswers, [q.id]: next});
                                     }} className={`p-5 rounded-2xl border text-left text-[11px] flex items-center justify-between ${active ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                                       {opt} {active ? <CheckSquare size={18} /> : <Square size={18} className="opacity-20" />}
                                     </button>
                                   )
                                 })}
                               </div>
                             </div>
                           ))}
                           <button onClick={runSimulation} className="w-full bg-[#00E5FF] text-black py-7 rounded-[2rem] font-black uppercase text-[10px]">Finalizar Evaluación</button>
                         </div>
                       )}
                    </div>
                  ) : (
                    <>
                      {selectedModule.type === 'video' && <iframe className="w-full aspect-video" src={getEmbedUrl(selectedModule.content)} allowFullScreen />}
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
        /* 🖼️ VISTA DE CERTIFICADO PARA ESTUDIANTE */
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 animate-in zoom-in-95">
           {!isUnlocked ? (
             <div className="max-w-md w-full bg-[#050505] border border-white/5 p-12 rounded-[3rem] text-center space-y-6">
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-white/5">
                  <Lock size={32} className="text-zinc-700" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Certificación Bloqueada</h3>
                <p className="text-xs text-zinc-500 uppercase leading-relaxed font-bold">Para obtener tu diploma oficial de **Botisfy Labs**, debes completar el curso y aprobar la evaluación final con al menos un **70%** de respuestas correctas.</p>
                <button onClick={() => setActiveTab('modulos')} className="text-[#00E5FF] text-[9px] font-black uppercase tracking-widest flex items-center gap-2 mx-auto hover:gap-4 transition-all">Ir al Test <ChevronRight size={14}/></button>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-8">
                <CheckCircle2 size={60} className="text-green-500" />
                <h3 className="text-2xl font-black uppercase italic">¡Felicidades, {currentUser?.full_name}!</h3>
                <p className="text-zinc-500 uppercase text-[10px] font-bold">Tu certificación neural está lista para ser descargada.</p>
                <button onClick={async () => (await generatePDF()).save('Certificado-Botisfy.pdf')} className="bg-[#00E5FF] text-black px-12 py-5 rounded-2xl font-black text-xs uppercase shadow-[0_0_40px_rgba(0,229,255,0.3)] flex items-center gap-3"><Download size={20}/> Descargar Diploma Oficial</button>
             </div>
           )}
        </div>
      )}
    </div>
  )
}