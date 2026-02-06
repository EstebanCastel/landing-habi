/**
 * Rate Limiter simple para proteger endpoints de DDoS
 * Almacena contadores en memoria (para producción usar Redis)
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const requestCounts = new Map<string, RateLimitEntry>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 60 segundos
const MAX_REQUESTS_PER_WINDOW = 30 // 30 requests por minuto

function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [ip, entry] of requestCounts.entries()) {
    if (now > entry.resetTime) {
      requestCounts.delete(ip)
    }
  }
}

export function checkRateLimit(ip: string): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  if (Math.random() < 0.1) {
    cleanupExpiredEntries()
  }

  const now = Date.now()
  const entry = requestCounts.get(ip)

  if (!entry || now > entry.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW
    requestCounts.set(ip, { count: 1, resetTime })
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetTime }
  }

  entry.count++

  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - entry.count,
    resetTime: entry.resetTime
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function sanitizeUUID(uuid: string): string {
  return uuid.replace(/[^a-f0-9-]/gi, '').toLowerCase()
}
