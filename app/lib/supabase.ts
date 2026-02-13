import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const STORAGE_BUCKET = 'pdfs'

let _supabaseAdmin: SupabaseClient | null = null

/**
 * Lazy-initialized Supabase admin client.
 * Only creates the client when first accessed (avoids build errors when env vars are missing).
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) not configured.')
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  return _supabaseAdmin
}
