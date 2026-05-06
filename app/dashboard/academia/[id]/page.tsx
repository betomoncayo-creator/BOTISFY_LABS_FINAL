'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '../../../../lib/supabase'
import { jsPDF } from 'jspdf'
import { 
  ChevronLeft, Video, FileCode, FileText, 
  Trash2, ArrowUp, ArrowDown, 
  UploadCloud, RefreshCw, User, Edit3, Lock, Download, Square, CheckSquare, Plus, X
} from 'lucide-react'

export default function CourseEditorPage() {
  const { id } = useParams()
  const router = useRouter()
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
  const [savingProgress, setSavingProgress] = useState(false)
  
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

  const getTodayFormatted = () => new Date().toLocaleDateString('es-ES', { 
    day: '2-digit', month: '2-digit', year: 'numeric' 
  })

  useEffect(() => {
    const fetchInitData = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

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
          if (courseRes.data.certificate_config?.elements) {
            setCertSettings(courseRes.data.certificate_config)
          }
          if (courseRes.data.modules?.length > 0) {
            setSelectedModId(courseRes.data.modules[0].id)
          }
        }

        if (profileRes.data?.role?.toLowerCase() !== 'admin') {
          const { data: existingProgress } = await supabase
            .from('student_progress')
            .select('is_completed')
            .eq('profile_id', session.user.id)
            .eq('course_id', id)
            .maybeSingle()
          if (existingProgress?.is_completed) setIsUnlocked(true)
        }

      } finally { 
        setLoading(false) 
      }
    }
    if (id) fetchInitData()
  }, [id, router])

  const selectedModule = modules.find(m => m.id === selectedModId)

  const getEmbedUrl = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) 
      ? `https://www.youtube.com/embed/${match[2]}` 
      : url
  }

  const handleFileUpload = async (e: any, type: 'content' | 'cert') => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('course_materials')
        .upload(`${Date.now()}-${file.name}`, file)
      if (data) {
        const url = supabase.storage
          .from('course_materials')
          .getPublicUrl(data.path).data.publicUrl
        if (type === 'cert') setCertSettings({...certSettings, bgImage: url})
        else updateModule('content', url)
      }
    } catch (err) {
      console.error('Error uploading file:', err)
    } finally {
      setUploading(false)
    }
  }

  const moveItem = (list: any[], idx: number, dir: 'up' | 'down') => {
    const newList = [...list]
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= newList.length) return list
    const temp = newList[idx]
    newList[idx] = newList[targetIdx]
    newList[targetIdx] = temp
    return newList
  }

  const updateModule = (field: string, value: any) => {
    if (isStudentMode && field !== 'questions') return
    setModules(prev => prev.map(m => m.id === selectedModId ? { ...m, [field]: value } : m))
  }

  // 🎯 HELPERS PARA EDITAR QUIZ
  const updateQuestion = (qId: number, field: string, value: any) => {
    const updated = selectedModule.questions.map((q: any) =>
      q.id === qId ? { ...q, [field]: value } : q
    )
    updateModule('questions', updated)
  }

  const updateOption = (qId: number, optIdx: number, value: string) => {
    const updated = selectedModule.questions.map((q: any) => {
      if (q.id !== qId) return q
      const newOptions = [...q.options]
      // Si la opción estaba en correctAnswers, actualizar también
      const wasCorrect = q.correctAnswers?.includes(newOptions[optIdx])
      newOptions[optIdx] = value
      const newCorrects = wasCorrect
        ? q.correctAnswers.map((c: string) => c === q.options[optIdx] ? value : c)
        : q.correctAnswers || []
      return { ...q, options: newOptions, correctAnswers: newCorrects }
    })
    updateModule('questions', updated)
  }

  const addOption = (qId: number) => {
    const updated = selectedModule.questions.map((q: any) =>
      q.id === qId ? { ...q, options: [...(q.options || []), `Opción ${(q.options?.length || 0) + 1}`] } : q
    )
    updateModule('questions', updated)
  }

  const removeOption = (qId: number, optIdx: number) => {
    const updated = selectedModule.questions.map((q: any) => {
      if (q.id !== qId) return q
      const removedOpt = q.options[optIdx]
      return {
        ...q,
        options: q.options.filter((_: any, i: number) => i !== optIdx),
        correctAnswers: (q.correctAnswers || []).filter((c: string) => c !== removedOpt)
      }
    })
    updateModule('questions', updated)
  }

  const toggleCorrect = (qId: number, opt: string, isMultiple: boolean) => {
    const updated = selectedModule.questions.map((q: any) => {
      if (q.id !== qId) return q
      const current = q.correctAnswers || []
      let next: string[]
      if (isMultiple) {
        next = current.includes(opt) ? current.filter((c: string) => c !== opt) : [...current, opt]
      } else {
        next = current.includes(opt) ? [] : [opt]
      }
      return { ...q, correctAnswers: next }
    })
    updateModule('questions', updated)
  }

  // 🎯 CALIFICACIÓN + GUARDADO
  const runSimulation = async () => {
    if (!selectedModule?.questions) return
    const objectiveQs = selectedModule.questions.filter((q: any) => q.type !== 'open')
    let correct = 0
    objectiveQs.forEach((q: any) => {
      const uAns = (userAnswers[q.id] || []).sort().join(',')
      const cAns = (q.correctAnswers || []).sort().join(',')
      if (uAns === cAns && uAns !== '') correct++
    })
    const totalPoints = selectedModule.totalPoints || 10
    const score = Math.round((correct / (objectiveQs.length || 1)) * totalPoints * 10) / 10
    const passed = score >= totalPoints * 0.7
    setSimulationResult({ score, passed })

    if (passed) {
      setIsUnlocked(true)
      setSavingProgress(true)
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const { data: existing } = await supabase
          .from('student_progress')
          .select('id, is_completed')
          .eq('profile_id', session.user.id)
          .eq('course_id', id)
          .maybeSingle()
        if (existing) {
          if (!existing.is_completed) {
            await supabase.from('student_progress').update({
              current_score: score, is_completed: true, completed_at: new Date().toISOString()
            }).eq('id', existing.id)
          }
        } else {
          await supabase.from('student_progress').insert({
            id: crypto.randomUUID(), profile_id: session.user.id, course_id: id,
            current_score: score, is_completed: true, completed_at: new Date().toISOString()
          })
        }
      } catch (err) {
        console.error('Error guardando progreso:', err)
      } finally {
        setSavingProgress(false)
      }
    }
  }

  const generatePDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1358] })
    if (certSettings.bgImage) {
      const img = new Image(); img.crossOrigin = 'anonymous'; img.src = certSettings.bgImage
      await new Promise((r) => img.onload = r)
      doc.addImage(img, 'PNG', 0, 0, 1920, 1358)
    }
    Object.entries(certSettings.elements).forEach(([key, el]: [string, any]) => {
      if (el.visible) {
        doc.setFontSize(el.fontSize * 2.4); doc.setTextColor(el.color); doc.setFont('helvetica', 'bolditalic')
        const val = key === 'name' ? (currentUser?.full_name || 'STUDENT') 
          : key === 'course' ? (courseData?.title || 'COURSE') : getTodayFormatted()
        doc.text(val.toUpperCase(), (el.left / 100) * 1920, (el.top / 100) * 1358, { align: 'center' })
      }
    })
    doc.save(`Certificado-${courseData?.title}.pdf`)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-[#00E5FF]">
      <div className="relative">
        <div className="absolute inset-0 bg-[#00E5FF]/20 blur-3xl animate-pulse rounded-full" />
        <RefreshCw className="animate-spin relative z-10" size={40} />
      </div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando...</p>
    </div>
  )

  return (
    <div className="w-full space-y-8 pb-20 text-white animate-in fade-in"
      onMouseMove={(e) => {
        if (!draggingId || !containerRef.current || isStudentMode) return
        const rect = containerRef.current.getBoundingClientRect()
        setCertSettings((p: any) => ({
          ...p, elements: { ...p.elements, [draggingId]: {
            ...p.elements[draggingId],
            left: ((e.clientX - rect.left) / rect.width) * 100,
            top: ((e.clientY - rect.top) / rect.height) * 100
          }}
        }))
      }}
      onMouseUp={() => setDraggingId(null)}
    >

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">{courseData?.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={() => setIsStudentMode(!isStudentMode)}
              className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase border transition-all flex items-center gap-2 ${
                isStudentMode ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-zinc-500 border-white/10'
              }`}>
              {isStudentMode ? <Edit3 size={14}/> : <User size={14}/>}
              {isStudentMode ? 'MODO DOCENTE' : 'VISTA ESTUDIANTE'}
            </button>
          )}
          {!isStudentMode && isAdmin && (
            <button onClick={() => {
              const supabase = createClient()
              supabase.from('courses').update({ modules, certificate_config: certSettings }).eq('id', id)
                .then(() => alert('✅ Nodo Sincronizado'))
            }} className="bg-[#00E5FF] text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase">
              Publicar Cambios
            </button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-8 border-b border-white/5">
        <button onClick={() => setActiveTab('modulos')}
          className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'modulos' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]' : 'text-zinc-600'}`}>
          1. Contenidos
        </button>
        <button onClick={() => { if (!isStudentMode || isUnlocked) setActiveTab('certificado') }}
          className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'certificado' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]'
            : (isUnlocked || !isStudentMode) ? 'text-zinc-400' : 'text-zinc-800 cursor-not-allowed'
          }`}>
          2. Certificación {isStudentMode && !isUnlocked && <Lock size={10} />}
        </button>
      </div>

      {activeTab === 'modulos' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

          {/* LISTA MÓDULOS */}
          <div className="xl:col-span-4 space-y-4">
            <div className="space-y-3">
              {modules.map((mod, idx) => (
                <div key={mod.id} onClick={() => { setSelectedModId(mod.id); setSimulationResult(null) }}
                  className={`p-5 rounded-2xl flex items-center justify-between group border cursor-pointer transition-all ${
                    selectedModId === mod.id ? 'bg-[#00E5FF]/5 border-[#00E5FF]/40' : 'bg-[#050505] border-white/5'
                  }`}>
                  <div className="flex items-center gap-4">
                    {mod.type === 'video' ? <Video size={18} /> : mod.type === 'pdf' ? <FileText size={18} /> : mod.type === 'quiz' ? <CheckSquare size={18} /> : <FileCode size={18} />}
                    <p className="text-[11px] font-black uppercase tracking-tight">{mod.title}</p>
                  </div>
                  {!isStudentMode && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setModules(moveItem(modules, idx, 'up')) }} disabled={idx === 0}><ArrowUp size={14}/></button>
                      <button onClick={(e) => { e.stopPropagation(); setModules(moveItem(modules, idx, 'down')) }} disabled={idx === modules.length - 1}><ArrowDown size={14}/></button>
                      <button onClick={(e) => { e.stopPropagation(); setModules(modules.filter(m => m.id !== mod.id)) }} className="text-red-500"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!isStudentMode && (
              <div className="grid grid-cols-2 gap-3 mt-6 p-4 bg-white/[0.02] rounded-[2rem] border border-white/5">
                {[{t:'video',i:Video},{t:'embed',i:FileCode},{t:'pdf',i:FileText},{t:'quiz',i:CheckSquare}].map(item => (
                  <button key={item.t} onClick={() => setModules([...modules, {
                    id: Date.now(), title: `NUEVO ${item.t.toUpperCase()}`, type: item.t, content: '', questions: [], totalPoints: 10
                  }])} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#00E5FF]/20 group transition-all">
                    <item.i size={18} className="text-zinc-600 group-hover:text-[#00E5FF]" />
                    <span className="text-[7px] font-black uppercase text-zinc-700">{item.t}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CONTENIDO MÓDULO */}
          <div className="xl:col-span-8">
            {selectedModule && (
              <div className="bg-[#050505] border border-white/5 p-10 rounded-[3rem] space-y-8 animate-in slide-in-from-right-4">

                {/* TÍTULO MÓDULO */}
                {!isStudentMode ? (
                  <input type="text" value={selectedModule.title}
                    onChange={(e) => updateModule('title', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-xl font-black italic uppercase outline-none focus:border-[#00E5FF]/40" />
                ) : (
                  <h2 className="text-white text-3xl font-black italic uppercase">{selectedModule.title}</h2>
                )}

                {/* CONTENIDO NO-QUIZ */}
                {selectedModule.type !== 'quiz' && !isStudentMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <input type="file" onChange={(e) => handleFileUpload(e, 'content')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="bg-white/5 p-8 rounded-2xl border-2 border-dashed border-white/10 text-center">
                        <UploadCloud className="mx-auto mb-2 text-zinc-700" />
                        <p className="text-[8px] font-black text-zinc-500 uppercase">Subir Archivo</p>
                      </div>
                    </div>
                    <textarea value={selectedModule.content} onChange={(e) => updateModule('content', e.target.value)}
                      className="w-full bg-black border border-white/10 p-5 rounded-2xl text-[#00E5FF] text-xs font-mono"
                      placeholder="Enlace o Embed..." rows={3} />
                  </div>
                )}

                {/* RENDER CONTENIDO */}
                <div className="bg-black rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative min-h-[400px] flex items-center justify-center">
                  {selectedModule.type === 'quiz' ? (
                    <div className="w-full p-8 space-y-8 overflow-y-auto max-h-[700px]">

                      {/* MODO ADMIN — EDITOR DE QUIZ */}
                      {!isStudentMode ? (
                        <div className="space-y-8">

                          {/* PUNTAJE TOTAL */}
                          <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10">
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Puntaje Total</p>
                              <p className="text-zinc-500 text-[8px] mt-1">
                                Mínimo para aprobar: <span className="text-[#00E5FF] font-black">
                                  {((selectedModule.totalPoints || 10) * 0.7).toFixed(1)} pts (70%)
                                </span>
                              </p>
                            </div>
                            <input
                              type="number" min={1} max={1000}
                              value={selectedModule.totalPoints || 10}
                              onChange={(e) => updateModule('totalPoints', Number(e.target.value))}
                              className="w-24 text-center bg-black border border-[#00E5FF]/30 rounded-xl p-3 text-white text-2xl font-black outline-none focus:border-[#00E5FF]"
                            />
                          </div>

                          {/* BOTONES AGREGAR PREGUNTA */}
                          <div className="flex gap-2">
                            {['simple', 'multiple', 'open'].map(t => (
                              <button key={t} onClick={() => updateModule('questions', [
                                ...(selectedModule.questions || []),
                                { id: Date.now(), type: t, text: 'Nueva Pregunta', options: ['Opción A', 'Opción B'], correctAnswers: [] }
                              ])} className="px-4 py-2 bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded-xl text-[8px] font-black uppercase text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-all flex items-center gap-1">
                                <Plus size={12} /> {t}
                              </button>
                            ))}
                          </div>

                          {/* LISTA DE PREGUNTAS — EDITABLES */}
                          <div className="space-y-6">
                            {(selectedModule.questions || []).map((q: any, qIdx: number) => (
                              <div key={q.id} className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 space-y-5">

                                {/* CABECERA PREGUNTA */}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[#00E5FF] text-[8px] font-black uppercase tracking-widest">
                                        {qIdx + 1}. {q.type === 'simple' ? 'Opción simple' : q.type === 'multiple' ? 'Múltiple' : 'Abierta'}
                                      </span>
                                    </div>
                                    <input
                                      type="text" value={q.text}
                                      onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-[#00E5FF]/50 transition-all"
                                      placeholder="Escribe la pregunta..."
                                    />
                                  </div>
                                  {/* CONTROLES MOVER/ELIMINAR */}
                                  <div className="flex flex-col gap-1 pt-6">
                                    <button onClick={() => updateModule('questions', moveItem(selectedModule.questions, qIdx, 'up'))}
                                      disabled={qIdx === 0}
                                      className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-all">
                                      <ArrowUp size={12}/>
                                    </button>
                                    <button onClick={() => updateModule('questions', moveItem(selectedModule.questions, qIdx, 'down'))}
                                      disabled={qIdx === selectedModule.questions.length - 1}
                                      className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-all">
                                      <ArrowDown size={12}/>
                                    </button>
                                    <button onClick={() => updateModule('questions', selectedModule.questions.filter((x: any) => x.id !== q.id))}
                                      className="p-1.5 bg-red-500/10 rounded-lg hover:bg-red-500/20 text-red-500 transition-all">
                                      <Trash2 size={12}/>
                                    </button>
                                  </div>
                                </div>

                                {/* OPCIONES EDITABLES */}
                                {q.type !== 'open' && (
                                  <div className="space-y-3 ml-2">
                                    <p className="text-zinc-600 text-[7px] font-black uppercase tracking-widest">
                                      Opciones — clic en ✓ para marcar correcta{q.type === 'multiple' ? 's' : ''}
                                    </p>
                                    {(q.options || []).map((opt: string, optIdx: number) => {
                                      const isCorrect = (q.correctAnswers || []).includes(opt)
                                      return (
                                        <div key={optIdx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                          isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-white/[0.02] border-white/10'
                                        }`}>
                                          {/* MARCAR CORRECTA */}
                                          <button onClick={() => toggleCorrect(q.id, opt, q.type === 'multiple')}
                                            className={`flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                                              isCorrect ? 'bg-green-500 border-green-500 text-black' : 'border-white/20 text-zinc-600 hover:border-green-500/50'
                                            }`}>
                                            {isCorrect ? <CheckSquare size={14}/> : <Square size={14}/>}
                                          </button>
                                          {/* EDITAR TEXTO OPCIÓN */}
                                          <input type="text" value={opt}
                                            onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
                                            placeholder={`Opción ${optIdx + 1}`}
                                          />
                                          {/* ELIMINAR OPCIÓN */}
                                          {(q.options || []).length > 2 && (
                                            <button onClick={() => removeOption(q.id, optIdx)}
                                              className="flex-shrink-0 p-1 text-zinc-700 hover:text-red-500 transition-all">
                                              <X size={12}/>
                                            </button>
                                          )}
                                        </div>
                                      )
                                    })}
                                    {/* AGREGAR OPCIÓN */}
                                    <button onClick={() => addOption(q.id)}
                                      className="w-full py-2 border border-dashed border-white/10 rounded-xl text-zinc-600 text-[8px] font-black uppercase hover:border-[#00E5FF]/30 hover:text-[#00E5FF] transition-all flex items-center justify-center gap-2">
                                      <Plus size={12}/> Agregar opción
                                    </button>
                                  </div>
                                )}

                                {q.type === 'open' && (
                                  <p className="text-zinc-600 text-[8px] font-bold uppercase ml-2">
                                    Pregunta abierta — el estudiante escribe su respuesta
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>

                          {(selectedModule.questions || []).length === 0 && (
                            <div className="text-center py-12 text-zinc-700">
                              <CheckSquare size={40} className="mx-auto mb-4 opacity-20"/>
                              <p className="text-[9px] font-black uppercase tracking-widest">
                                Sin preguntas — agrega con los botones de arriba
                              </p>
                            </div>
                          )}
                        </div>

                      ) : (
                        /* MODO ESTUDIANTE — RESOLVER QUIZ */
                        <div className="space-y-10">
                          {simulationResult ? (
                            <div className="text-center p-12 space-y-4">
                              <p className="text-6xl font-black italic">
                                {simulationResult.score}/{selectedModule.totalPoints || 10}
                              </p>
                              <p className={`font-black text-lg ${simulationResult.passed ? 'text-green-500' : 'text-red-500'}`}>
                                {simulationResult.passed ? '✅ APROBADO' : '❌ FALLIDO'}
                              </p>
                              {simulationResult.passed && (
                                <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest">
                                  {savingProgress ? 'Guardando progreso...' : '✓ Progreso guardado — Certificado desbloqueado'}
                                </p>
                              )}
                              <button onClick={() => { setSimulationResult(null); setUserAnswers({}) }}
                                className="mt-6 px-10 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase">
                                Reintentar
                              </button>
                            </div>
                          ) : (
                            <>
                              {selectedModule.questions?.map((q: any, qIdx: number) => (
                                <div key={q.id} className="space-y-4">
                                  <p className="text-lg font-bold">{qIdx + 1}. {q.text}</p>
                                  <div className="grid gap-3 ml-4">
                                    {q.type === 'open' ? (
                                      <textarea className="w-full bg-white/5 border border-white/10 p-6 rounded-[2rem] outline-none text-sm italic" placeholder="Escribe tu respuesta..." />
                                    ) : q.options?.map((opt: string) => {
                                      const active = (userAnswers[q.id] || []).includes(opt)
                                      return (
                                        <button key={opt} onClick={() => {
                                          const list = userAnswers[q.id] || []
                                          const next = q.type === 'multiple'
                                            ? (list.includes(opt) ? list.filter((x: any) => x !== opt) : [...list, opt])
                                            : [opt]
                                          setUserAnswers({...userAnswers, [q.id]: next})
                                        }} className={`p-5 rounded-2xl border text-left text-[11px] flex items-center justify-between transition-all ${
                                          active ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'
                                        }`}>
                                          {opt}
                                          {active ? <CheckSquare size={18}/> : <Square size={18} className="opacity-20"/>}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}
                              <button onClick={runSimulation}
                                className="w-full bg-[#00E5FF] text-black py-7 rounded-[2rem] font-black uppercase text-[10px]">
                                Calificar Examen
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {selectedModule.type === 'video' && (
                        selectedModule.content?.includes('youtube.com')
                          ? <iframe className="w-full aspect-video" src={getEmbedUrl(selectedModule.content)} allowFullScreen />
                          : <video className="w-full aspect-video" src={selectedModule.content} controls />
                      )}
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
        /* CERTIFICACIÓN */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-8">
            <div ref={containerRef} className="relative w-full aspect-[1.414/1] bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/10">
              {certSettings.bgImage && <img src={certSettings.bgImage} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />}
              {Object.entries(certSettings.elements).map(([eid, el]: [string, any]) => el.visible && (
                <div key={eid} onMouseDown={() => !isStudentMode && setDraggingId(eid)}
                  style={{ top: `${el.top}%`, left: `${el.left}%`, fontSize: `${el.fontSize}px`, color: el.color }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 font-bold italic select-none ${!isStudentMode ? 'cursor-move ring-2 ring-[#00E5FF]/20 hover:ring-[#00E5FF] px-2' : ''}`}>
                  {eid === 'name' ? (currentUser?.full_name || el.label)
                    : eid === 'course' ? (courseData?.title || el.label)
                    : eid === 'date' ? getTodayFormatted() : el.label}
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
                    <div className="flex justify-between">
                      <span className="text-[9px] font-black uppercase text-[#00E5FF] italic">{eid}</span>
                      <span className="text-[10px] font-bold text-zinc-600">{el.fontSize}px</span>
                    </div>
                    <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <input type="range" min="10" max="150" value={el.fontSize}
                        onChange={(e) => setCertSettings({...certSettings, elements: {...certSettings.elements, [eid]: {...el, fontSize: Number(e.target.value)}}})}
                        className="w-full accent-[#00E5FF] bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer" />
                      <input type="color" value={el.color}
                        onChange={(e) => setCertSettings({...certSettings, elements: {...certSettings.elements, [eid]: {...el, color: e.target.value}}})}
                        className="w-full h-8 bg-black rounded p-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={generatePDF}
                className="w-full bg-[#00E5FF] text-black py-6 rounded-3xl font-black text-xs uppercase flex items-center justify-center gap-3">
                <Download size={20}/> Descargar Diploma
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}