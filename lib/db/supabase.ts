import { createClient } from '@supabase/supabase-js'

// This is the server-side client - has full access
// Only ever used in API routes and server components
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// This is the public client - respects RLS policies
// Safe to use in browser-facing code
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)