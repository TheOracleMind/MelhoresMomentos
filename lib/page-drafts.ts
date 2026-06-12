import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { LovePageDraft, PageStatus, PaymentType } from "@/lib/types";
import { createPageSlug } from "@/lib/utils";

export type PersistedDraftPage = {
  id: string;
  slug: string;
  title: string | null;
  status: string;
  expires_at: string | null;
  stripe_customer_id: string | null;
};

export async function createPageFromDraft({
  draft,
  userId,
  ownerEmail,
  status,
  planType = null,
  paidAt = null,
  expiresAt = null
}: {
  draft: LovePageDraft;
  userId: string | null;
  ownerEmail?: string | null;
  status: PageStatus;
  planType?: PaymentType | null;
  paidAt?: string | null;
  expiresAt?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const slug = draft.slug || createPageSlug(draft.creatorName, draft.recipientName);

  const { data: page, error } = await admin
    .from("love_pages")
    .insert({
      user_id: userId,
      owner_email: ownerEmail || null,
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
      status,
      plan_type: planType,
      paid_at: paidAt,
      expires_at: expiresAt
    })
    .select("id, slug, title, status, expires_at, stripe_customer_id")
    .single();

  if (error || !page) throw new Error(error?.message || "Não foi possível preparar a página.");

  await insertDraftChildren(page.id, draft);
  return page as PersistedDraftPage;
}

async function insertDraftChildren(pageId: string, draft: LovePageDraft) {
  const admin = createSupabaseAdminClient();
  const bestPhotos = (draft.bestPhotos || []).slice(0, 5).map((photo, index) => ({
    love_page_id: pageId,
    image_url: photo.imageUrl,
    sort_order: index
  }));

  if (bestPhotos.length) {
    const { error } = await admin.from("best_photos").insert(bestPhotos);
    if (error) throw new Error(error.message);
  }

  for (const [index, moment] of draft.moments.slice(0, 8).entries()) {
    if (!moment.title && !moment.description && moment.images.length === 0) continue;
    const { data: insertedMoment, error } = await admin
      .from("moments")
      .insert({
        love_page_id: pageId,
        title: moment.title || `Momento ${index + 1}`,
        description: moment.description || "",
        moment_date: moment.momentDate || null,
        sort_order: index
      })
      .select("id")
      .single();

    if (error || !insertedMoment) throw new Error(error?.message || "Não foi possível salvar os momentos.");

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
}
