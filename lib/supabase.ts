import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        // Esto desactiva el manejo agresivo de pestañas que causa el error de "Lock"
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Añadimos esto para mitigar el error en entornos de desarrollo como StackBlitz
        flowType: 'pkce' 
      }
    }
  )
}