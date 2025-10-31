import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use empty strings as fallback during build
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
