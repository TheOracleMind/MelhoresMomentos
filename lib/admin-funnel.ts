import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type FunnelSnapshot = {
  landingViews: number;
  createStarted: number;
  offerViews: number;
  purchases: number;
};

type AnalyticsEvent = {
  event_name: string;
  visitor_id: string | null;
  created_at: string;
};

type PaymentEvent = {
  id: string;
  paid_at: string;
};

export async function getCurrentFunnelSnapshot(since?: string | null): Promise<FunnelSnapshot> {
  const admin = createSupabaseAdminClient();
  const [{ data: events }, { data: payments }] = await Promise.all([
    admin.from("analytics_events").select("event_name, visitor_id, created_at"),
    admin.from("payments").select("id, paid_at")
  ]);

  return calculateFunnelSnapshot((events || []) as AnalyticsEvent[], (payments || []) as PaymentEvent[], since);
}

export function calculateFunnelSnapshot(events: AnalyticsEvent[], payments: PaymentEvent[], since?: string | null): FunnelSnapshot {
  const sinceTime = since ? new Date(since).getTime() : 0;
  const currentEvents = events.filter((event) => new Date(event.created_at).getTime() >= sinceTime);
  const currentPayments = payments.filter((payment) => new Date(payment.paid_at).getTime() >= sinceTime);

  return {
    landingViews: countDistinct(currentEvents.filter((event) => event.event_name === "landing_view").map((event) => event.visitor_id)),
    createStarted: countDistinct(currentEvents.filter((event) => event.event_name === "create_started").map((event) => event.visitor_id)),
    offerViews: countDistinct(currentEvents.filter((event) => event.event_name === "offer_view").map((event) => event.visitor_id)),
    purchases: currentPayments.length
  };
}

function countDistinct(values: Array<string | null>) {
  return new Set(values.filter(Boolean)).size;
}
