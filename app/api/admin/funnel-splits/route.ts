import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { getCurrentFunnelSnapshot } from "@/lib/admin-funnel";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Acesso restrito ao administrador." }, { status: 403 });
    }

    const { reason } = (await request.json()) as { reason?: string };
    const cleanReason = reason?.trim().slice(0, 160) || "Split sem nome";
    const admin = createSupabaseAdminClient();
    const { data: lastSplit } = await admin
      .from("funnel_splits")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const snapshot = await getCurrentFunnelSnapshot(lastSplit?.created_at || null);
    const { error } = await admin.from("funnel_splits").insert({
      reason: cleanReason,
      landing_views: snapshot.landingViews,
      create_started: snapshot.createStarted,
      offer_views: snapshot.offerViews,
      purchases: snapshot.purchases
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível criar o split." },
      { status: 500 }
    );
  }
}
