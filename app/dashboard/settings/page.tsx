'use client'
import { useState, useContext } from 'react'
import { UserContext } from '../../../lib/context'
import { createClient } from '../../../lib/supabase'
import { User, Shield, Check, Save, RefreshCw } from 'lucide-react'

export default function SettingsPage() {
  const { profile } = useContext(UserContext)
  const [newName, setNewName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', profile.id)

      if (!error) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Error updating profile:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-black italic text-white tracking-tighter uppercase">Configuración</h1>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em] mt-4 ml-1">Gestión de Nodo de Usuario</p>
      </div>

      <div className="bg-[#050505] border border-white/5 p-8 md:p-12 rounded-[3rem] space-y-8">
        {/* INFO DE CUENTA */}
        <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
          <div className="w-16 h-16 bg-[#00E5FF]/10 rounded-2xl flex items-center justify-center text-[#00E5FF] border border-[#00E5FF]/20">
            <User size={24} />
          </div>
          <div>
            <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">Correo Electrónico</p>
            <p className="text-white text-sm font-bold tracking-tight">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Shield size={12} className="text-[#00E5FF] opacity-50" />
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Rol: {profile?.role}</span>
            </div>
          </div>
        </div>

        {/* FORMULARIO DE NOMBRE */}
        <div className="space-y-4">
          <label className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] ml-4">Nombre Completo</label>
          <input 
            type="text" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-white text-xs font-bold tracking-widest focus:ring-1 focus:ring-[#00E5FF] focus:border-[#00E5FF] transition-all"
            placeholder="INGRESA TU NOMBRE..."
          />
        </div>

        <button 
          onClick={handleUpdate}
          disabled={loading}
          className="w-full py-5 bg-[#00E5FF] text-black rounded-2xl font-black text-[10px] tracking-[0.4em] uppercase flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
        >
          {success ? <Check size={18} /> : loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {success ? 'NODO ACTUALIZADO' : loading ? 'PROCESANDO...' : 'GUARDAR CAMBIOS'}
        </button>
      </div>
    </div>
  )
}
