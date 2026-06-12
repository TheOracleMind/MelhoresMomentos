import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Sliding-window rate limiter backed by Supabase.
 * Inserts one row per request; the cleanup cron removes old rows.
 *
 * @returns true if the request is allowed, false if rate-limited.
 */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { count } = await supabase
    .from("rate_limit_attempts")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", windowStart);

  if (count !== null && count >= limit) {
    return false;
  }

  await supabase.from("rate_limit_attempts").insert({ key });
  return true;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
