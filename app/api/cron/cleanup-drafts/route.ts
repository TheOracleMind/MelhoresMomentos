import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Called hourly by Vercel cron (vercel.json).
// Vercel automatically sends: Authorization: Bearer <CRON_SECRET>
// Set CRON_SECRET in Vercel environment variables.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createSupabaseAdminClient();
  const now = Date.now();
  const draftCutoff = new Date(now - 6 * 60 * 60 * 1000).toISOString();
  const rateLimitCutoff = new Date(now - 60 * 60 * 1000).toISOString();

  // Delete storage objects for unclaimed draft uploads older than 6 hours
  const { data: staleUploads } = await supabase
    .from("draft_uploads")
    .select("id, storage_path")
    .is("claimed_at", null)
    .lt("created_at", draftCutoff);

  let deletedDrafts = 0;
  if (staleUploads?.length) {
    const paths = staleUploads.map((u) => u.storage_path);
    await supabase.storage.from("gift-images").remove(paths);
    const ids = staleUploads.map((u) => u.id);
    await supabase.from("draft_uploads").delete().in("id", ids);
    deletedDrafts = staleUploads.length;
  }

  // Clean up old rate limit entries (older than 1 hour — no longer needed)
  await supabase.from("rate_limit_attempts").delete().lt("created_at", rateLimitCutoff);

  return NextResponse.json({ deletedDrafts });
}
