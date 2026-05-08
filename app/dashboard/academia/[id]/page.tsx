'use client'

import { useState, useEffect } from 'react'
import db from '../../../../lib/database'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Save, Trash2, Plus, X, Users } from 'lucide-react'



export default function CourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [courseData, setCourseData] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  // Estados para edición
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await db.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        const profileData = await db.getProfile(session.user.id)
        const isAdminUser = profileData?.role?.toLowerCase() === 'admin'
        setIsAdmin(isAdminUser)

        const course = await db.getCourse(id)
        setCourseData(course)
        setTitle(course?.title || '')
        setDescription(course?.description || '')

        if (isAdminUser) {
          const students = await db.getAllProfiles('estudiante')
          setAllStudents(students)

          const enrollments = await db.getEnrollments(id)
          const enrolledSet = new Set(enrollments.map((e: any) => e.profile_id))
          setEnrolledIds(enrolledSet)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, router])

  const handleToggleEnrollment = async (profileId: string) => {
    try {
      const isEnrolled = enrolledIds.has(profileId)

      if (isEnrolled) {
        await db.removeEnrollment(profileId, id)
        setEnrolledIds((prev: Set<string>) => {
          const next = new Set(prev)
          next.delete(profileId)
          return next
        })
      } else {
        await db.addEnrollment(profileId, id)
        setEnrolledIds((prev: Set<string>) => new Set([...prev, profileId]))
      }
    } catch (error) {
      console.error('Error toggling enrollment:', error)
      alert('Error al cambiar inscripción')
    }
  }

  const handleSaveCourse = async () => {
    if (!title.trim()) {
      alert('El título es requerido')
      return
    }

    setSaving(true)
    try {
      await db.updateCourse(id, {
        title,
        description,
      })
      setCourseData((prev: any) => ({ ...prev, title, description }))
      setEditMode(false)
      alert('Curso actualizado exitosamente')
    } catch (error) {
      console.error('Error saving course:', error)
      alert('Error al guardar el curso')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCourse = async () => {
    if (!confirm('¿Eliminar este curso permanentemente?')) return

    try {
      await db.deleteCourse(id)
      router.push('/dashboard/academia')
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Error al eliminar el curso')
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!courseData) {
    return (
      <div className="py-20 text-center text-zinc-600 text-[9px] font-black uppercase tracking-widest">
        Curso no encontrado
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* HEADER CON BOTONES */}
      <div className="bg-[#050505] border border-white/5 p-8 rounded-[2rem] flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-3 text-zinc-600 hover:text-[#00E5FF] transition-colors"
        >
          <ChevronLeft size={24} />
        </button>

        <h1 className="text-3xl font-black text-white uppercase italic flex-1 text-center">
          {courseData.title}
        </h1>

        <div className="flex gap-2">
          {isAdmin && (
            <>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="p-3 bg-[#00E5FF]/10 text-[#00E5FF] rounded-xl hover:bg-[#00E5FF]/20 transition-all"
                >
                  Editar
                </button>
              ) : (
                <button
                  onClick={handleSaveCourse}
                  disabled={saving}
                  className="p-3 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 transition-all disabled:opacity-50"
                >
                  <Save size={20} />
                </button>
              )}
              <button
                onClick={handleDeleteCourse}
                className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
              >
                <Trash2 size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* CONTENIDO DEL CURSO */}
      <div className="bg-[#050505] border border-white/5 p-8 rounded-[2rem] space-y-6">
        {editMode ? (
          <>
            <div>
              <label className="text-zinc-400 text-[9px] font-black uppercase block mb-2">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white text-sm outline-none focus:border-[#00E5FF]/50 transition-all"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-[9px] font-black uppercase block mb-2">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white text-sm outline-none focus:border-[#00E5FF]/50 transition-all"
              />
            </div>
          </>
        ) : (
          <div>
            <p className="text-zinc-400 text-[9px] font-black uppercase block mb-2">Descripción</p>
            <p className="text-white text-sm">{courseData.description || 'Sin descripción'}</p>
          </div>
        )}
      </div>

      {/* INSCRIPCIONES (SOLO ADMIN) */}
      {isAdmin && (
        <div className="bg-[#050505] border border-white/5 p-8 rounded-[2rem] space-y-6">
          <h2 className="text-xl font-black text-white uppercase italic flex items-center gap-3">
            <Users size={24} className="text-[#00E5FF]" /> Inscripciones
          </h2>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {allStudents.length === 0 ? (
              <p className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest text-center py-8">
                No hay estudiantes disponibles
              </p>
            ) : (
              allStudents.map(student => (
                <div
                  key={student.id}
                  className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:border-[#00E5FF]/20 transition-all"
                >
                  <div>
                    <p className="text-white font-black text-[11px] uppercase">{student.full_name}</p>
                    <p className="text-zinc-500 text-[9px]">{student.email}</p>
                  </div>

                  <button
                    onClick={() => handleToggleEnrollment(student.id)}
                    className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase transition-all ${
                      enrolledIds.has(student.id)
                        ? 'bg-[#00E5FF] text-black hover:bg-[#00D4EE]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {enrolledIds.has(student.id) ? 'Inscrito' : 'Inscribir'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ESTUDIANTE MODE */}
      {!isAdmin && (
        <div className="bg-[#050505] border border-white/5 p-8 rounded-[2rem] text-center text-zinc-600 text-[9px] font-black uppercase tracking-widest">
          Visualizando el contenido del curso
        </div>
      )}
    </div>
  )
}