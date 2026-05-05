'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { RefreshCw, ChevronRight, GraduationCap, Upload, X, Plus, Edit, Menu } from 'lucide-react'

export default function AcademiaPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [navigatingId, setNavigatingId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [showEditCourseModal, setShowEditCourseModal] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseDesc, setNewCourseDesc] = useState('')
  const [creatingCourse, setCreatingCourse] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchCourses = async () => {
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: userData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        if (userData) setIsAdmin(userData.role?.toLowerCase() === 'admin')
      }
      
      const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
      if (data) setCourses(data)
      setLoading(false)
    }
    fetchCourses()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, courseId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingId(courseId)
    try {
      const supabase = createClient()
      const fileName = `course-${courseId}-${Date.now()}-${file.name}`
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('course_images')
        .upload(fileName, file)

      if (storageError) {
        console.error('Error en storage:', storageError)
        alert('Error al subir imagen: ' + storageError.message)
        setUploadingId(null)
        return
      }

      if (!storageData) {
        console.error('No storage data returned')
        alert('Error: No se recibió confirmación de subida')
        setUploadingId(null)
        return
      }

      const { data: urlData } = supabase.storage
        .from('course_images')
        .getPublicUrl(storageData.path)

      if (!urlData || !urlData.publicUrl) {
        console.error('No public URL returned')
        alert('Error al obtener URL de la imagen')
        setUploadingId(null)
        return
      }

      const publicUrl = urlData.publicUrl

      const { error: dbError } = await supabase
        .from('courses')
        .update({ image_url: publicUrl })
        .eq('id', courseId)

      if (dbError) {
        console.error('Error en BD:', dbError)
        alert('Error al guardar en BD: ' + dbError.message)
        setUploadingId(null)
        return
      }

      setCourses(prevCourses => 
        prevCourses.map(c => 
          c.id === courseId ? { ...c, image_url: publicUrl } : c
        )
      )

      console.log('✅ Imagen guardada:', publicUrl)

    } catch (error) {
      console.error('Error en handleImageUpload:', error)
      alert('Error inesperado: ' + (error instanceof Error ? error.message : 'Desconocido'))
    } finally {
      setUploadingId(null)
    }
  }

  const removeImage = async (courseId: string) => {
    if (!window.confirm('¿Eliminar imagen del curso?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('courses')
        .update({ image_url: null })
        .eq('id', courseId)

      if (error) {
        console.error('Error al eliminar:', error)
        alert('Error: ' + error.message)
        return
      }

      setCourses(prevCourses =>
        prevCourses.map(c =>
          c.id === courseId ? { ...c, image_url: null } : c
        )
      )

      console.log('✅ Imagen eliminada')
    } catch (error) {
      console.error('Error en removeImage:', error)
      alert('Error inesperado: ' + (error instanceof Error ? error.message : 'Desconocido'))
    }
  }

  const openEditModal = (course: any) => {
    setEditingCourseId(course.id)
    setNewCourseName(course.title)
    setNewCourseDesc(course.description || '')
    setShowEditCourseModal(true)
  }

  const handleEditCourse = async () => {
    if (!newCourseName.trim()) {
      alert('El nombre del curso es requerido')
      return
    }

    if (!editingCourseId) return

    setCreatingCourse(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('courses')
        .update({
          title: newCourseName,
          description: newCourseDesc || 'Sin descripción',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCourseId)

      if (error) {
        console.error('Error al editar curso:', error)
        alert('Error: ' + error.message)
        setCreatingCourse(false)
        return
      }

      setCourses(prevCourses =>
        prevCourses.map(c =>
          c.id === editingCourseId
            ? { ...c, title: newCourseName, description: newCourseDesc || 'Sin descripción' }
            : c
        )
      )
      
      setNewCourseName('')
      setNewCourseDesc('')
      setEditingCourseId(null)
      setShowEditCourseModal(false)
      
      alert('✅ Curso actualizado exitosamente')
      console.log('✅ Curso actualizado:', editingCourseId)

    } catch (error) {
      console.error('Error en handleEditCourse:', error)
      alert('Error inesperado: ' + (error instanceof Error ? error.message : 'Desconocido'))
    } finally {
      setCreatingCourse(false)
    }
  }

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) {
      alert('El nombre del curso es requerido')
      return
    }

    setCreatingCourse(true)
    try {
      const supabase = createClient()
      
      const courseId = `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const { error } = await supabase.from('courses').insert([
        {
          id: courseId,
          title: newCourseName,
          description: newCourseDesc || 'Sin descripción',
          modules: [],
          certificate_config: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])

      if (error) {
        console.error('Error al crear curso:', error)
        alert('Error: ' + error.message)
        setCreatingCourse(false)
        return
      }

      const newCourse = {
        id: courseId,
        title: newCourseName,
        description: newCourseDesc || 'Sin descripción',
        modules: [],
        certificate_config: {},
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setCourses(prevCourses => [newCourse, ...prevCourses])
      
      setNewCourseName('')
      setNewCourseDesc('')
      setShowAddCourseModal(false)
      
      alert('✅ Curso creado exitosamente')
      console.log('✅ Curso creado:', courseId)

    } catch (error) {
      console.error('Error en handleCreateCourse:', error)
      alert('Error inesperado: ' + (error instanceof Error ? error.message : 'Desconocido'))
    } finally {
      setCreatingCourse(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#00E5FF] px-4">
      <RefreshCw className="animate-spin mb-4" size={30} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">Cargando Academia...</p>
    </div>
  )

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 px-4 sm:px-6 md:px-0">
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="w-full sm:flex-1">
          <h1 className="text-white text-3xl sm:text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-tight">
            Neural <span className="text-[#00E5FF]">Academy</span>
          </h1>
          <p className="text-zinc-500 text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] mt-2">Tu centro de aprendizaje neural</p>
        </div>
        <div className="w-full sm:w-auto bg-white/5 border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center gap-4 sm:gap-6">
          <div className="text-right flex-1 sm:flex-none">
            <p className="text-zinc-500 text-[7px] sm:text-[8px] font-black uppercase">Cursos</p>
            <p className="text-white text-lg sm:text-2xl font-black italic">{courses.length}</p>
          </div>
          <div className="p-2 sm:p-3 bg-[#00E5FF]/10 rounded-xl sm:rounded-2xl text-[#00E5FF]">
            <GraduationCap size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* BOTÓN CREAR CURSO */}
      {isAdmin && (
        <button
          onClick={() => setShowAddCourseModal(true)}
          className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-[#00E5FF] text-black rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase transition-all flex items-center justify-center gap-2 sm:gap-3 hover:bg-[#00D4EE]"
        >
          <Plus size={16} className="sm:w-5 sm:h-5" />
          Crear Nuevo Curso
        </button>
      )}

      {/* GRID DE CURSOS - RESPONSIVO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {courses.map((course) => (
          <div key={course.id} className="bg-[#050505] border border-white/5 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[3rem] group hover:border-[#00E5FF]/30 transition-all space-y-4 sm:space-y-6">
            
            {/* IMAGEN DEL CURSO */}
            <div className="relative aspect-video bg-zinc-900/50 rounded-lg sm:rounded-xl md:rounded-[2rem] flex items-center justify-center overflow-hidden group/image border border-white/5">
              
              {course.image_url && course.image_url.trim() ? (
                <>
                  <img 
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Error cargando imagen:', course.image_url)
                      e.currentTarget.src = ''
                    }}
                  />
                  {isAdmin && (
                    <button
                      onClick={() => removeImage(course.id)}
                      className="absolute top-2 right-2 p-1.5 sm:p-2 bg-red-500 text-white rounded opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/30 to-transparent flex flex-col items-center justify-center gap-3">
                  <GraduationCap size={40} className="sm:w-12 sm:h-12 text-zinc-700" />
                  {isAdmin && (
                    <label className="cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, course.id)}
                        disabled={uploadingId === course.id}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#00E5FF] text-black rounded-lg hover:bg-[#00D4EE] transition-all font-black text-[8px] sm:text-[9px] uppercase">
                        <Upload size={12} className="sm:w-3.5 sm:h-3.5" />
                        {uploadingId === course.id ? 'Subiendo...' : 'Foto'}
                      </div>
                    </label>
                  )}
                </div>
              )}

              {isAdmin && course.image_url && course.image_url.trim() && (
                <label className="absolute bottom-2 left-2 cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, course.id)}
                    disabled={uploadingId === course.id}
                    className="hidden"
                  />
                  <div className="px-2 sm:px-3 py-1 bg-[#00E5FF] text-black rounded text-[7px] sm:text-[8px] font-black uppercase opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-[#00D4EE]">
                    Cambiar
                  </div>
                </label>
              )}
            </div>

            {/* TÍTULO Y BOTÓN EDITAR */}
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-white text-base sm:text-lg md:text-xl font-black italic uppercase tracking-tight line-clamp-2 flex-1">
                {course.title}
              </h3>
              {isAdmin && (
                <button
                  onClick={() => openEditModal(course)}
                  className="p-1.5 sm:p-2 hover:bg-[#00E5FF]/20 rounded transition-all text-[#00E5FF] flex-shrink-0"
                  title="Editar curso"
                >
                  <Edit size={16} className="sm:w-5 sm:h-5" />
                </button>
              )}
            </div>

            {/* DESCRIPCIÓN */}
            {course.description && (
              <p className="text-zinc-400 text-[7px] sm:text-[8px] line-clamp-2">
                {course.description}
              </p>
            )}
            
            {/* BOTÓN ACCIÓN */}
            <button 
              onClick={() => {
                setNavigatingId(course.id)
                router.push(`/dashboard/academia/${course.id}`)
              }}
              disabled={navigatingId !== null}
              className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase transition-all flex items-center justify-center gap-2 sm:gap-3 ${
                navigatingId === course.id ? 'bg-[#00E5FF] text-black' : 'bg-zinc-900/50 text-white hover:bg-[#00E5FF] hover:text-black'
              }`}
            >
              {navigatingId === course.id ? (
                <>
                  Sincronizando... <RefreshCw className="animate-spin" size={12} className="sm:w-4 sm:h-4" />
                </>
              ) : (
                <>
                  {isAdmin ? 'Editar' : 'Iniciar'}
                  <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* MODAL CREAR CURSO */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#050505] border border-white/10 rounded-2xl md:rounded-[2rem] p-6 md:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center">
              <h2 className="text-white text-xl md:text-2xl font-black italic uppercase">Nuevo Curso</h2>
              <button
                onClick={() => setShowAddCourseModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-zinc-400 text-[8px] md:text-[9px] font-black uppercase">Nombre</label>
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Ej: Introducción a Python"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00E5FF] transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-400 text-[8px] md:text-[9px] font-black uppercase">Descripción (Opcional)</label>
              <textarea
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
                placeholder="Describe el contenido..."
                rows={4}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00E5FF] transition-all resize-none text-sm"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowAddCourseModal(false)}
                className="flex-1 py-3 bg-zinc-900/50 text-white rounded-xl font-black text-[8px] md:text-[9px] uppercase hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={creatingCourse || !newCourseName.trim()}
                className="flex-1 py-3 bg-[#00E5FF] text-black rounded-xl font-black text-[8px] md:text-[9px] uppercase hover:bg-[#00D4EE] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingCourse ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR CURSO */}
      {showEditCourseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#050505] border border-white/10 rounded-2xl md:rounded-[2rem] p-6 md:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center">
              <h2 className="text-white text-xl md:text-2xl font-black italic uppercase">Editar Curso</h2>
              <button
                onClick={() => setShowEditCourseModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-zinc-400 text-[8px] md:text-[9px] font-black uppercase">Nombre</label>
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Nombre del curso"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00E5FF] transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-400 text-[8px] md:text-[9px] font-black uppercase">Descripción</label>
              <textarea
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
                placeholder="Describe el contenido..."
                rows={4}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00E5FF] transition-all resize-none text-sm"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowEditCourseModal(false)}
                className="flex-1 py-3 bg-zinc-900/50 text-white rounded-xl font-black text-[8px] md:text-[9px] uppercase hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditCourse}
                disabled={creatingCourse || !newCourseName.trim()}
                className="flex-1 py-3 bg-[#00E5FF] text-black rounded-xl font-black text-[8px] md:text-[9px] uppercase hover:bg-[#00D4EE] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingCourse ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}