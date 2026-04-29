'use client'
import { useState } from 'react'
import { X, Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function BulkUploadModal({ onClose, onSuccess }: any) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const supabase = createClient()

  const handleProcess = async () => {
    if (!file) return
    setStatus('processing')
    setLogs(['Iniciando protocolo de carga masiva...'])

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()))
      
      // Validamos cabeceras (opcional)
      const data = rows.slice(1).filter(row => row.length >= 2 && row[1] !== '')
      let successCount = 0

      for (const [name, email, role] of data) {
        setLogs(prev => [...prev, `Sincronizando: ${email}...` ])
        
        // Insertamos en el Directorio (profiles)[cite: 2]
        const { error } = await supabase.from('profiles').insert({
          full_name: name,
          email: email,
          role: role || 'estudiante'
        })

        if (!error) successCount++
        else setLogs(prev => [...prev, `❌ Error en ${email}: ${error.message}`])
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
            <h2 className="text-white text-2xl font-black uppercase italic italic tracking-tighter">Nodo de Importación</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={24}/></button>
          </div>

          {status === 'idle' ? (
            <div className="space-y-6">
              <label className="border-2 border-dashed border-white/5 rounded-[2rem] p-16 flex flex-col items-center justify-center group hover:border-[#00E5FF]/30 transition-all cursor-pointer bg-white/[0.01]">
                <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <Upload className="text-[#00E5FF] mb-4 group-hover:scale-110 transition-transform" size={48} />
                <p className="text-white text-sm font-bold uppercase tracking-widest">{file ? file.name : 'Subir archivo .CSV'}</p>
              </label>
              <button 
                onClick={handleProcess}
                disabled={!file}
                className="w-full py-5 bg-[#00E5FF] text-black font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl disabled:opacity-20 transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              >
                Ejecutar Sincronización
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-black rounded-3xl p-6 h-60 overflow-y-auto border border-white/5 font-mono text-[10px]">
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