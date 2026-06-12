import { NextResponse } from "next/server";
import { PLANS } from "@/lib/plans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import type { LovePageDraft, PaymentType } from "@/lib/types";
import { createPageSlug } from "@/lib/utils";

type CheckoutPage = {
  id: string;
  slug: string;
  title: string | null;
  status: string;
  expires_at: string | null;
  stripe_customer_id: string | null;
};

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
      page = await createPendingPageFromDraft(draft, auth.user?.id || null);
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
    return NextResponse.json(
      { error: message },
      { status: message.includes("supabase/update.sql") ? 400 : 500 }
    );
  }
}

async function createPendingPageFromDraft(draft: LovePageDraft, userId: string | null) {
  const admin = createSupabaseAdminClient();
  const slug = draft.slug || createPageSlug(draft.creatorName, draft.recipientName);

  const { data: page, error } = await admin
    .from("love_pages")
    .insert({
      user_id: userId,
      slug,
      creator_name: draft.creatorName || "",
      recipient_name: draft.recipientName || "",
      relationship_type: draft.relationshipType || "outro",
      met_at: draft.metAt || null,
      relationship_started_at: draft.relationshipStartedAt || null,
      short_message: draft.shortMessage || null,
      title: draft.title || "Nossos melhores momentos",
      intro_message: draft.introMessage || "",
      final_message: draft.finalMessage || "",
      main_photo_url: draft.mainPhotoUrl || null,
      theme: draft.theme || "classic",
      status: "pending_payment"
    })
    .select("id, slug, title, status, expires_at, stripe_customer_id")
    .single();

  if (error || !page) throw new Error(error?.message || "Não foi possível preparar a página.");

  const bestPhotos = (draft.bestPhotos || []).slice(0, 5).map((photo, index) => ({
    love_page_id: page.id,
    image_url: photo.imageUrl,
    sort_order: index
  }));

  if (bestPhotos.length) {
    const { error: bestPhotosError } = await admin.from("best_photos").insert(bestPhotos);
    if (bestPhotosError) {
      if (bestPhotosError.code === "42P01" || bestPhotosError.message.toLowerCase().includes("best_photos")) {
        throw new Error("A tabela best_photos ainda não existe no Supabase. Execute supabase/update.sql e tente novamente.");
      }
      throw new Error(bestPhotosError.message);
    }
  }

  for (const [index, moment] of draft.moments.slice(0, 8).entries()) {
    if (!moment.title && !moment.description && moment.images.length === 0) continue;
    const { data: insertedMoment, error: momentError } = await admin
      .from("moments")
      .insert({
        love_page_id: page.id,
        title: moment.title || `Momento ${index + 1}`,
        description: moment.description || "",
        moment_date: moment.momentDate || null,
        sort_order: index
      })
      .select("id")
      .single();

    if (momentError || !insertedMoment) throw new Error(momentError?.message || "Não foi possível salvar os momentos.");

    const images = moment.images.slice(0, 3).map((image, imageIndex) => ({
      moment_id: insertedMoment.id,
      image_url: image.imageUrl,
      sort_order: imageIndex
    }));

    if (images.length) {
      const { error: imagesError } = await admin.from("moment_images").insert(images);
      if (imagesError) throw new Error(imagesError.message);
    }
  }

  return page;
}
