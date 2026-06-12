import { NextResponse } from "next/server";
import { PLANS } from "@/lib/plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import type { PaymentType } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { lovePageId, paymentType } = (await request.json()) as {
      lovePageId?: string;
      paymentType?: PaymentType;
    };

    if (!lovePageId || !paymentType || !PLANS[paymentType]) {
      return NextResponse.json({ error: "Dados de checkout inválidos." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    }

    const { data: page, error } = await supabase
      .from("love_pages")
      .select("id, slug, title, status, expires_at, stripe_customer_id")
      .eq("id", lovePageId)
      .single();

    if (error || !page) {
      return NextResponse.json({ error: "Página não encontrada." }, { status: 404 });
    }

    const isRenewal = paymentType.startsWith("renewal");
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
      customer_email: page.stripe_customer_id ? undefined : auth.user.email || undefined,
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
        user_id: auth.user.id
      },
      client_reference_id: page.id,
      success_url: `${origin.replace(/\/$/, "")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin.replace(/\/$/, "")}/create?checkout=cancelled`
    });

    await supabase
      .from("love_pages")
      .update({
        status: isRenewal ? "expired" : "pending_payment",
        stripe_checkout_session_id: session.id
      })
      .eq("id", page.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar checkout." },
      { status: 500 }
    );
  }
}
