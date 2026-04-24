import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // En entornos como StackBlitz, las cookies se bloquean en el servidor por políticas de iframes.
  // Dejaremos que la protección de rutas la maneje exclusivamente el Layout del cliente.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}