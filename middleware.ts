import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicRoutes = ['/login', '/auth/reset-password', '/']

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const supabaseAuth = createClient()
  const { data: { session } } = await supabaseAuth.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}