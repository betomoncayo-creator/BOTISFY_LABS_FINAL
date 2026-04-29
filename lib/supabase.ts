import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Definimos la variable fuera para que persista entre renders
let supabaseInstance: any = null;

export const createClient = () => {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: false, // ⚠️ Desactivamos el auto-refresh para romper el bucle
        detectSessionInUrl: true,
        storageKey: 'botisfy-auth-token'
      }
    }
  )
  return supabaseInstance;
}