import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Regex para detectar UUIDs en la ruta
const UUID_REGEX = /^\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(UUID_REGEX)
  
  if (match) {
    const uuid = match[1]
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('deal_uuid', uuid)
    // Rewrite (no redirect) - mantiene la URL original en el navegador
    return NextResponse.rewrite(url)
  }
}

export const config = {
  // Solo aplicar a rutas que parecen UUIDs, no a API, _next, archivos estáticos
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
}
