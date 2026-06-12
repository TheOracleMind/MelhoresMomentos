import { NextResponse } from "next/server";
import { PLANS } from "@/lib/plans";
import { createPageFromDraft, type PersistedDraftPage } from "@/lib/page-drafts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import type { LovePageDraft, PaymentType } from "@/lib/types";

type CheckoutPage = PersistedDraftPage;

export async function POST(request: Request) {
  try {
    const { lovePageId, paymentType, draft } = (await request.json()) as {
      lovePageId?: string;
      paymentType?: PaymentType;
      draft?: LovePageDraft;
    };

    if (!paymentType || !PLANS[paymentType]) {
      return NextResponse.json({ error: "Dados de checkout inválidos." }, { status: 400 });
    }

    const serverSupabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    const { data: auth } = await serverSupabase.auth.getUser();
    const isInitial = paymentType === "initial_24h" || paymentType === "initial_365d";
    const isRenewal = paymentType.startsWith("renewal");
    let pageId = lovePageId;
    let page: CheckoutPage | null = null;

    if (!pageId && isInitial && draft) {
      page = await createPageFromDraft({
        draft,
        userId: auth.user?.id || null,
        ownerEmail: auth.user?.email || null,
        status: "pending_payment"
      });
      pageId = page.id;
    }

    if (!pageId) {
      return NextResponse.json({ error: "Página não encontrada." }, { status: 400 });
    }

    if (!page) {
      const supabase = auth.user ? serverSupabase : admin;
      const { data, error } = await supabase
        .from("love_pages")
        .select("id, slug, title, status, expires_at, stripe_customer_id")
        .eq("id", pageId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Página não encontrada." }, { status: 404 });
      }
      page = data;
    }

    if (isRenewal && !auth.user) {
      return NextResponse.json({ error: "Faça login para renovar." }, { status: 401 });
    }

    const expiredByDate = page.expires_at ? new Date(page.expires_at).getTime() <= Date.now() : false;
    if (isRenewal && page.status !== "expired" && !expiredByDate) {
      return NextResponse.json({ error: "Renovação disponível apenas para páginas expiradas." }, { status: 400 });
    }

    const plan = PLANS[paymentType];
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "http://localhost:3000";
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: page.stripe_customer_id || undefined,
      customer_email: page.stripe_customer_id ? undefined : auth.user?.email || undefined,
      customer_creation: page.stripe_customer_id ? undefined : "always",
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: plan.price,
            product_data: {
              name: plan.checkoutLabel,
              description: plan.description
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        love_page_id: page.id,
        payment_type: paymentType,
        user_id: auth.user?.id || ""
      },
      client_reference_id: page.id,
      success_url: `${origin.replace(/\/$/, "")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin.replace(/\/$/, "")}/create?checkout=cancelled`
    });

    await admin
      .from("love_pages")
      .update({
        status: isRenewal ? "expired" : "pending_payment",
        stripe_checkout_session_id: session.id
      })
      .eq("id", page.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
