'use client'
import { useState, useRef, useCallback } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import db from '../lib/database'

export default function BulkUploadModal({ onClose, onSuccess }: any) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File | null) => {
    if (f && f.name.endsWith('.csv')) setFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    handleFile(f)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const handleProcess = async () => {
    if (!file) return
    setStatus('processing')
    setLogs(['Iniciando protocolo de carga masiva...'])

    // Obtener token
    const session = await db.getSession()
    if (!session?.access_token) {
      setLogs(['❌ Sin sesión activa. Recarga la página.'])
      setStatus('done')
      return
    }
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')))
      const data = rows.slice(1).filter(row => row.length >= 2 && row[1] !== '')
      let successCount = 0

      for (const [name, email, role] of data) {
        if (!email || !name) continue
        setLogs(prev => [...prev, `Sincronizando: ${email}...`])
        try {
          const res = await fetch('/api/users', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              full_name: name,
              email: email.toLowerCase(),
              role: role?.trim() || 'estudiante',
            })
          })
          const json = await res.json()
          if (json.success) {
            successCount++
            setLogs(prev => [...prev, `✅ ${email} — invitación enviada`])
          } else {
            setLogs(prev => [...prev, `❌ Error en ${email}: ${json.error}`])
          }
        } catch (err: any) {
          setLogs(prev => [...prev, `❌ Error en ${email}: ${err.message}`])
        }
      }

      setLogs(prev => [...prev, `✅ Protocolo finalizado. ${successCount} registros nuevos.`])
      setStatus('done')
      setTimeout(onSuccess, 2000)
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60">
      <div className="bg-[#080808] border border-white/10 w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter">Nodo de Importación</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={24}/></button>
          </div>

          {status === 'idle' ? (
            <div className="space-y-6">

              {/* DROP ZONE */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-[2rem] p-16 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragging
                    ? 'border-[#00E5FF] bg-[#00E5FF]/5 scale-[1.01]'
                    : 'border-white/10 bg-white/[0.01] hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
                <Upload className={`mb-4 transition-all ${dragging ? 'text-[#00E5FF] scale-125' : 'text-[#00E5FF]'}`} size={48} />
                {file ? (
                  <div className="text-center">
                    <p className="text-white text-sm font-black uppercase tracking-widest">{file.name}</p>
                    <p className="text-zinc-500 text-[9px] mt-1 uppercase font-bold">Click para cambiar</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-white text-sm font-bold uppercase tracking-widest">Arrastra tu CSV aquí</p>
                    <p className="text-zinc-500 text-[9px] mt-1 uppercase font-bold">o click para seleccionar</p>
                  </div>
                )}
              </div>

              {/* Formato */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4">
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Formato requerido:</p>
                <code className="text-[#00E5FF] text-[10px]">full_name, email, role</code>
                <p className="text-zinc-600 text-[9px] mt-1">role: <span className="text-zinc-400">estudiante</span> o <span className="text-zinc-400">admin</span> (opcional, default: estudiante)</p>
              </div>

              <button
                onClick={handleProcess}
                disabled={!file}
                className="w-full py-5 bg-[#00E5FF] text-black font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl disabled:opacity-20 transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:cursor-not-allowed"
              >
                Ejecutar Sincronización
              </button>
            </div>

          ) : (
            <div className="space-y-6">
              <div className="bg-black rounded-3xl p-6 h-64 overflow-y-auto border border-white/5 font-mono text-[10px]">
                {logs.map((log, i) => (
                  <p key={i} className="text-zinc-400 mb-1 leading-relaxed">
                    <span className="text-[#00E5FF] mr-2">&gt;</span> {log}
                  </p>
                ))}
              </div>
              {status === 'processing' && (
                <div className="flex items-center justify-center gap-3 text-[#00E5FF] animate-pulse">
                  <Loader2 className="animate-spin" size={16}/>
                  <span className="text-[10px] font-black uppercase tracking-widest">Procesando Base de Datos...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}