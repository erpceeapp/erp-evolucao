import { createClient } from "@supabase/supabase-js"

export async function rateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return { success: true, remaining: maxRequests }
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.rpc("rate_limit_check", {
    p_key: ip,
    p_max_requests: maxRequests,
    p_window_sec: Math.ceil(windowMs / 1000),
  })

  if (error || !data) {
    return { success: true, remaining: maxRequests }
  }

  const result = data as unknown as { success: boolean; remaining: number }
  return result
}
