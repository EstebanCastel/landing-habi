import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Regex para detectar UUIDs en la ruta
const UUID_REGEX = /^\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

// Rutas de prueba permitidas (no son UUIDs pero pasan como deal_uuid)
const TEST_PATHS = ['/123']

export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(UUID_REGEX)
  
  if (match) {
    const uuid = match[1]
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('deal_uuid', uuid)
    return NextResponse.rewrite(url)
  }

  // Rutas de prueba — siempre landing C
  if (TEST_PATHS.includes(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('deal_uuid', request.nextUrl.pathname.slice(1))
    url.searchParams.set('force_group', 'C')
    return NextResponse.rewrite(url)
  }
}

export const config = {
  // Solo aplicar a rutas que parecen UUIDs, no a API, _next, archivos estáticos
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
}
