import { PLANS } from "@/lib/plans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import type { PaymentType } from "@/lib/types";

export async function confirmStripeCheckoutSession(sessionId: string, expectedUserId?: string, expectedEmail?: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.mode !== "payment" || session.payment_status !== "paid") {
    throw new Error("Pagamento ainda não confirmado pela Stripe.");
  }

  const lovePageId = session.metadata?.love_page_id;
  const paymentType = session.metadata?.payment_type as PaymentType | undefined;
  const metadataUserId = session.metadata?.user_id || "";
  const customerEmail = session.customer_details?.email || session.customer_email || expectedEmail || null;

  if (!lovePageId || !paymentType || !PLANS[paymentType]) {
    throw new Error("Sessão de checkout sem metadados válidos.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: page, error: pageError } = await supabase
    .from("love_pages")
    .select("id, user_id, owner_email, expires_at")
    .eq("id", lovePageId)
    .single();

  if (pageError || !page) {
    throw new Error("Página vinculada ao pagamento não foi encontrada.");
  }

  if (metadataUserId && expectedUserId && metadataUserId !== expectedUserId) {
    throw new Error("Esta sessão de pagamento pertence a outra conta.");
  }

  if (page.user_id && expectedUserId && page.user_id !== expectedUserId) {
    throw new Error("Pagamento não corresponde à pessoa dona da página.");
  }

  if (page.user_id && !expectedUserId && metadataUserId && page.user_id !== metadataUserId) {
    throw new Error("Pagamento não corresponde à pessoa dona da página.");
  }

  const plan = PLANS[paymentType];
  const now = new Date();
  const currentExpiration = page.expires_at ? new Date(page.expires_at) : null;
  const isRenewal = paymentType.startsWith("renewal");
  const baseDate = isRenewal && currentExpiration && currentExpiration > now ? currentExpiration : now;
  const expiresAt = new Date(baseDate.getTime() + plan.durationHours * 60 * 60 * 1000).toISOString();
  const shouldAttachUser = expectedUserId && !page.user_id && customerEmail && expectedEmail?.toLowerCase() === customerEmail.toLowerCase();

  await supabase
    .from("love_pages")
    .update({
      user_id: shouldAttachUser ? expectedUserId : page.user_id,
      owner_email: customerEmail || page.owner_email,
      status: "active",
      plan_type: paymentType,
      stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
      stripe_checkout_session_id: session.id,
      paid_at: now.toISOString(),
      expires_at: expiresAt
    })
    .eq("id", lovePageId);

  await supabase.from("payments").upsert(
    {
      love_page_id: lovePageId,
      stripe_session_id: session.id,
      payment_type: paymentType,
      amount: session.amount_total || plan.price,
      paid_at: now.toISOString()
    },
    { onConflict: "stripe_session_id" }
  );

  return {
    lovePageId,
    paymentType,
    amount: session.amount_total || plan.price,
    currency: (session.currency || "brl").toUpperCase(),
    expiresAt,
    customerEmail,
    needsAccount: !page.user_id && !shouldAttachUser
  };
}
