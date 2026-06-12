import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnalyticsEventName } from "@/lib/analytics";

const allowedEvents = new Set<AnalyticsEventName>(["landing_view", "create_started", "offer_view"]);

export async function POST(request: Request) {
  try {
    const { eventName, visitorId, lovePageId } = (await request.json()) as {
      eventName?: AnalyticsEventName;
      visitorId?: string;
      lovePageId?: string;
    };

    if (!eventName || !allowedEvents.has(eventName)) {
      return NextResponse.json({ ok: true });
    }

    const safeVisitorId = typeof visitorId === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(visitorId) ? visitorId : null;
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const admin = createSupabaseAdminClient();

    await admin.from("analytics_events").insert({
      event_name: eventName,
      visitor_id: safeVisitorId,
      user_id: auth.user?.id || null,
      love_page_id: lovePageId || null
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
