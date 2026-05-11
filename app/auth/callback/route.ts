import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (type === 'recovery') return NextResponse.redirect(`${origin}/auth/reset-password`)
      if (type === 'invite') return NextResponse.redirect(`${origin}/auth/reset-password?invited=true`)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // ── Flujo token_hash (Supabase v2) ──
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      if (type === 'recovery') return NextResponse.redirect(`${origin}/auth/reset-password`)
      if (type === 'invite') return NextResponse.redirect(`${origin}/auth/reset-password?invited=true`)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // ── Fallback sin code/token_hash ──
  if (type === 'recovery') return NextResponse.redirect(`${origin}/auth/reset-password`)
  if (type === 'invite') return NextResponse.redirect(`${origin}/auth/reset-password?invited=true`)

  return NextResponse.redirect(`${origin}/login?error=callback_failed`)
}