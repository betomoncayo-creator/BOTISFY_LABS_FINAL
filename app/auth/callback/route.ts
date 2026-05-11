// app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('[callback] URL completa:', request.url)
  console.log('[callback] code:', code)
  console.log('[callback] token_hash:', token_hash)
  console.log('[callback] type:', type)

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  // ── Flujo PKCE (code) ──
  if (code) {
    console.log('[callback] Intentando exchangeCodeForSession...')
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      console.log('[callback] exchangeCodeForSession OK, type:', type)
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[callback] exchangeCodeForSession error:', error.message)
  }

  // ── Flujo token_hash (nuevo formato Supabase v2) ──
  if (token_hash && type) {
    console.log('[callback] Intentando verifyOtp con token_hash...')
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      console.log('[callback] verifyOtp OK, type:', type)
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[callback] verifyOtp error:', error.message)
  }

  // ── Sin code ni token_hash → flujo hash (el cliente JS procesa el #fragment) ──
  // Si es recovery, mandamos a la página correcta y el cliente lo maneja
  if (type === 'recovery') {
    console.log('[callback] Sin code/token_hash, type=recovery → redirigiendo a reset-password')
    return NextResponse.redirect(`${origin}/auth/reset-password`)
  }

  console.log('[callback] No se pudo procesar → redirigiendo a login con error')
  return NextResponse.redirect(`${origin}/login?error=callback_failed&type=${type || 'unknown'}`)
}
