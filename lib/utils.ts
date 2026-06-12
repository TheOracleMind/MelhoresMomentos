import type { DbLovePage, DbMoment, LovePageDraft } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

export function createPageSlug(creatorName: string, recipientName: string) {
  const base = slugify([creatorName, recipientName].filter(Boolean).join(" e ")) || "melhores-momentos";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export function getPublicPageUrl(slug: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${siteUrl.replace(/\/$/, "")}/p/${slug}`;
}

export function isExpired(expiresAt: string | null | undefined) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

export function relationshipDuration(startedAt: string | null | undefined) {
  if (!startedAt) return "Uma história em construção";
  const start = new Date(`${startedAt}T00:00:00`);
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
  if (diffDays < 30) return `${diffDays} dias de história`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} meses de história`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths ? `${years} anos e ${remainingMonths} meses de história` : `${years} anos de história`;
}

export function mapDbPage(page: DbLovePage, moments: DbMoment[] = []): LovePageDraft {
  return {
    id: page.id,
    slug: page.slug,
    creatorName: page.creator_name || "",
    recipientName: page.recipient_name || "",
    relationshipType: page.relationship_type || "outro",
    metAt: page.met_at,
    relationshipStartedAt: page.relationship_started_at,
    shortMessage: page.short_message || "",
    title: page.title || "",
    introMessage: page.intro_message || "",
    finalMessage: page.final_message || "",
    mainPhotoUrl: page.main_photo_url || "",
    theme: page.theme || "classic",
    status: page.status,
    planType: page.plan_type,
    paidAt: page.paid_at,
    expiresAt: page.expires_at,
    createdAt: page.created_at,
    bestPhotos: (page.best_photos || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((photo) => ({
        id: photo.id,
        imageUrl: photo.image_url,
        sortOrder: photo.sort_order
      })),
    moments: moments
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((moment) => ({
        id: moment.id,
        title: moment.title,
        description: moment.description,
        momentDate: moment.moment_date,
        sortOrder: moment.sort_order,
        images: (moment.moment_images || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((image) => ({
            id: image.id,
            imageUrl: image.image_url,
            sortOrder: image.sort_order
          }))
      }))
  };
}

export const emptyDraft: LovePageDraft = {
  slug: "",
  creatorName: "",
  recipientName: "",
  relationshipType: "namoro",
  metAt: null,
  relationshipStartedAt: null,
  shortMessage: "",
  title: "",
  introMessage: "",
  finalMessage: "",
  mainPhotoUrl: "",
  theme: "classic",
  status: "draft",
  bestPhotos: [],
  moments: [
    {
      title: "",
      description: "",
      momentDate: null,
      sortOrder: 0,
      images: []
    }
  ]
};
