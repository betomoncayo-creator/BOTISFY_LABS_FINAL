// lib/supabase.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

export const createClient = () => {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'botisfy-auth-token',
      }
    }
  )
  return supabaseInstance
}