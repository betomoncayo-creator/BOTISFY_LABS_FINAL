'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { 
  ChevronLeft, Video, FileCode, FileText, HelpCircle, 
  Plus, Save, Trash2, Award, Eye, Image as ImageIcon,
  CheckCircle2, Link as LinkIcon, ArrowUp, ArrowDown, 
  UploadCloud, RefreshCw, X 
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

  // 🧠 ESTADO INICIAL (Vacío hasta que la base de datos responda)
  const [modules, setModules] = useState<any[]>([])
  const [certSettings, setCertSettings] = useState({
    bgImage: null,
    showName: true,
    showDate: true,
    showCourse: true,
    fontColor: '#ffffff'
  })

  // 🛰️ EFECTO DE RECUPERACIÓN (Sincronización al cargar / F5)
  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select('modules, certificate_config')
        .eq('id', id)
        .single()

      if (data) {
        // Inyectamos lo que hay en la base de datos al estado del editor
        if (data.modules) setModules(data.modules)
        if (data.certificate_config) setCertSettings(data.certificate_config)
        
        // Seleccionamos el primer nodo automáticamente si existe
        if (data.modules && data.modules.length > 0) {
          setSelectedModId(data.modules[0].id)
        }
      }
      setLoading(false)
    }

    if (id) fetchCourseData()
  }, [id, supabase])

  const selectedModule = modules.find(m => m.id === selectedModId)

  // 🛠️ LÓGICA DE GESTIÓN (Persistencia en Memoria)
  const updateModule = (field: string, value: any) => {
    setModules(modules.map(m => m.id === selectedModId ? { ...m, [field]: value } : m))
  }

  const addModule = (type: string) => {
    const newMod = {
      id: Date.now(),
      type,
      title: `NUEVO NODO ${type.toUpperCase()}`,
      content: '',
      videoSource: 'url',
      description: ''
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

  // ☁️ CARGA DE ARCHIVOS A SUPABASE
  const handleVideoUpload = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    const { data, error } = await supabase.storage.from('course_materials').upload(fileName, file, {
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded / p.total) * 100)),
    })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('course_materials').getPublicUrl(fileName)
      updateModule('content', publicUrl)
    }
    setUploading(false)
  }

  // 💾 PERSISTENCIA FINAL (Guardar en la Red)
  const handlePublish = async () => {
    setIsSaving(true)
    const { error } = await supabase
      .from('courses')
      .update({
        modules: modules,
        certificate_config: certSettings,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (!error) {
      alert("✅ ESTRUCTURA DESPLEGADA: Los cambios se han sincronizado con la Red Neural de Botisfy Labs.")
    } else {
      alert("⚠️ ERROR: " + error.message)
    }
    setIsSaving(false)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-[#00E5FF]">
      <RefreshCw className="animate-spin" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em]">Sincronizando con Base de Datos...</p>
    </div>
  )

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-20 text-white">
      {/* HEADER DE CONTROL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 border border-white/5 transition-all"><ChevronLeft size={20} /></button>
          <div>
            <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">Gestión de <span className="text-[#00E5FF]">Contenidos</span></h1>
            <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-2 italic">Despliegue Activo • ID: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('modulos')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'modulos' ? 'bg-white/10 text-white border border-white/20' : 'text-zinc-500 hover:text-white'}`}>Nodos</button>
          <button onClick={() => setActiveTab('certificado')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'certificado' ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30' : 'text-zinc-500 hover:text-white'}`}>Certificado</button>
          <div className="w-[1px] h-8 bg-white/10 mx-2" />
          <button onClick={handlePublish} disabled={isSaving} className="bg-[#00E5FF] text-black px-8 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,229,255,0.2)]">
            {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            {isSaving ? 'Publicando...' : 'Publicar Cambios'}
          </button>
        </div>
      </div>

      {activeTab === 'modulos' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* LISTA DE NODOS (IZQUIERDA) */}
          <div className="xl:col-span-4 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 ml-4">Malla de Aprendizaje</h3>
            <div className="space-y-3">
              {modules.length > 0 ? modules.map((mod, index) => (
                <div key={mod.id} onClick={() => setSelectedModId(mod.id)} className={`p-5 rounded-2xl flex items-center justify-between group transition-all cursor-pointer border ${selectedModId === mod.id ? 'bg-white/5 border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.05)]' : 'bg-[#050505] border-white/5 hover:border-white/10'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${selectedModId === mod.id ? 'text-[#00E5FF] border-[#00E5FF]/20' : 'text-zinc-600 border-white/5'}`}>
                      {mod.type === 'video' && <Video size={18} />}
                      {mod.type === 'embed' && <FileCode size={18} />}
                      {mod.type === 'pdf' && <FileText size={18} />}
                      {mod.type === 'quiz' && <HelpCircle size={18} />}
                    </div>
                    <p className={`text-[11px] font-black uppercase tracking-tight ${selectedModId === mod.id ? 'text-white' : 'text-zinc-500'}`}>{mod.title}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); moveModule(index, 'up'); }} className="p-1 hover:text-[#00E5FF]"><ArrowUp size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveModule(index, 'down'); }} className="p-1 hover:text-[#00E5FF]"><ArrowDown size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteModule(mod.id); }} className="p-1 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              )) : (
                <div className="p-10 border-2 border-dashed border-white/5 rounded-3xl text-center">
                  <p className="text-zinc-700 text-[8px] font-black uppercase tracking-widest">Sin nodos registrados</p>
                </div>
              )}
            </div>
            
            {/* INYECTOR */}
            <div className="bg-[#050505] border border-white/5 p-6 rounded-[2rem] mt-8 grid grid-cols-2 gap-3">
              {[{ type: 'video', icon: Video }, { type: 'embed', icon: FileCode }, { type: 'pdf', icon: FileText }, { type: 'quiz', icon: HelpCircle }].map((item) => (
                <button key={item.type} onClick={() => addModule(item.type)} className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl hover:border-[#00E5FF]/20 transition-all group">
                  <item.icon size={18} className="text-zinc-600 group-hover:text-[#00E5FF]" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-700 group-hover:text-white">{item.type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* EDITOR (DERECHA) */}
          <div className="xl:col-span-8">
            {selectedModule ? (
              <div className="bg-[#050505] border border-white/5 p-10 rounded-[3rem] space-y-8 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#00E5FF]/10 rounded-2xl flex items-center justify-center text-[#00E5FF]">
                    {selectedModule.type === 'video' ? <Video size={24} /> : <FileCode size={24} />}
                  </div>
                  <h2 className="text-white text-xl font-black italic uppercase tracking-tighter">Nodo: {selectedModule.type}</h2>
                </div>
                <div className="space-y-6">
                  <label className="text-zinc-600 text-[8px] font-black uppercase tracking-widest ml-4">Título del Nodo</label>
                  <input type="text" value={selectedModule.title} onChange={(e) => updateModule('title', e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-xs font-bold outline-none focus:border-[#00E5FF]/40" />
                  
                  {selectedModule.type === 'video' && (
                    <div className="space-y-4">
                      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                        <button onClick={() => updateModule('videoSource', 'url')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${selectedModule.videoSource === 'url' ? 'bg-[#00E5FF] text-black' : 'text-zinc-500'}`}>URL</button>
                        <button onClick={() => updateModule('videoSource', 'file')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${selectedModule.videoSource === 'file' ? 'bg-[#00E5FF] text-black' : 'text-zinc-500'}`}>Archivo</button>
                      </div>
                      {selectedModule.videoSource === 'url' ? (
                        <input type="text" placeholder="https://..." value={selectedModule.content} onChange={(e) => updateModule('content', e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-xs font-mono outline-none" />
                      ) : (
                        <div className="relative group">
                          <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          <div className="w-full bg-white/5 border-2 border-dashed border-white/10 p-12 rounded-[2rem] flex flex-col items-center justify-center gap-4 group-hover:border-[#00E5FF]/40 transition-all">
                            {uploading ? (
                              <><RefreshCw className="text-[#00E5FF] animate-spin" size={32} /><div className="w-full max-w-xs bg-white/5 h-1.5 rounded-full mt-4"><div className="bg-[#00E5FF] h-full" style={{ width: `${uploadProgress}%` }} /></div></>
                            ) : selectedModule.content ? (<><CheckCircle2 className="text-green-500" size={32} /><p className="text-[10px] uppercase font-bold">{selectedModule.content.split('/').pop()}</p></>) : (
                              <><UploadCloud className="text-zinc-700 group-hover:text-[#00E5FF]" size={40} /><p className="text-zinc-500 text-[9px] font-black uppercase">Subir MP4</p></>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedModule.type === 'embed' && (
                    <div className="space-y-6">
                      <textarea rows={6} placeholder="<iframe... />" value={selectedModule.content} onChange={(e) => updateModule('content', e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[#00E5FF] text-xs font-mono outline-none resize-none" />
                      {selectedModule.content && (
                        <div className="bg-black rounded-3xl overflow-hidden border border-white/10 aspect-video"><div className="w-full h-full" dangerouslySetInnerHTML={{ __html: selectedModule.content }} /></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : <div className="h-full flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em]">Selecciona un nodo para iniciar</div>}
          </div>
        </div>
      ) : (
        /* VISTA CERTIFICADO */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6 bg-[#050505] border border-white/5 p-10 rounded-[3rem]">
            <h3 className="text-white text-sm font-black italic uppercase tracking-widest">Configuración Diploma</h3>
            {['showName', 'showCourse', 'showDate'].map(v => (
              <div key={v} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <span className="text-white text-[10px] font-bold uppercase">{v === 'showName' ? 'Nombre Estudiante' : v === 'showCourse' ? 'Nombre Curso' : 'Fecha Emisión'}</span>
                <button onClick={() => setCertSettings({...certSettings, [v as keyof typeof certSettings]: !certSettings[v as keyof typeof certSettings]})} className={`w-10 h-5 rounded-full transition-all relative ${certSettings[v as keyof typeof certSettings] ? 'bg-[#00E5FF]' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${certSettings[v as keyof typeof certSettings] ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl aspect-[1.414/1] relative overflow-hidden shadow-2xl flex flex-col items-center justify-center p-12 text-center text-black font-serif italic text-2xl">
             <div className="absolute inset-0 opacity-5 flex items-center justify-center"><img src="/logo-botisfy.png" alt="" className="w-64" /></div>
             Certificado de Logro
             {certSettings.showName && <div className="mt-4 text-5xl font-black uppercase not-italic tracking-tighter">Freddy Moncayo</div>}
             {certSettings.showCourse && <div className="mt-6 text-[#00E5FF] text-3xl font-black uppercase not-italic tracking-tighter">Automatización con IA 101</div>}
          </div>
        </div>
      )}
    </div>
  )
}