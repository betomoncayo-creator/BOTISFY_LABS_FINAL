import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // En StackBlitz las cookies se bloquean en el servidor.
  // La seguridad la maneja el Layout del cliente (Paso 2).
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}