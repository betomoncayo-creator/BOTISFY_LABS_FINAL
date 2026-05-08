// middleware.ts
// NOTA: En StackBlitz/WebContainer el middleware server-side no puede hacer
// redirects por limitaciones del entorno. La seguridad de rutas la maneja
// el UserContextProvider en el cliente (Capa 2).
// Al deployar en Vercel/Netlify, reemplazar con la versión completa.

import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo-botisfy.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}