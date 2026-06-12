import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GiftPage } from "@/components/gift-page";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DbLovePage, DbMoment, LovePageDraft } from "@/lib/types";
import { isExpired, mapDbPage } from "@/lib/utils";

type PublicPageRow = DbLovePage & {
  best_photos?: Array<{ image_url: string; sort_order: number }>;
  moments?: Array<DbMoment>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: page } = await supabase
    .from("love_pages")
    .select("*, best_photos(image_url, sort_order), moments(*, moment_images(*))")
    .eq("slug", slug)
    .single();

  if (!page) {
    return {
      title: "Melhores Momentos"
    };
  }

  const mapped = mapDbPage(page as PublicPageRow, page.moments || []);
  const title = mapped.title || `Uma surpresa de ${mapped.creatorName || "alguém especial"} para ${mapped.recipientName || "você"}`;
  const description =
    mapped.introMessage ||
    mapped.shortMessage ||
    `Uma página especial com fotos, memórias e uma linha do tempo criada para ${mapped.recipientName || "uma pessoa especial"}.`;
  const coverPath = getCoverImagePath(mapped);
  const coverUrl = coverPath ? await createSignedImageUrl(coverPath, 60 * 60 * 24 * 7) : undefined;
  const url = `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/p/${mapped.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Melhores Momentos",
      type: "website",
      images: coverUrl
        ? [
            {
              url: coverUrl,
              alt: title
            }
          ]
        : undefined
    },
    twitter: {
      card: coverUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: coverUrl ? [coverUrl] : undefined
    }
  };
}

export default async function PublicGiftPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: page } = await supabase
    .from("love_pages")
    .select("*, best_photos(*), moments(*, moment_images(*))")
    .eq("slug", slug)
    .single();

  if (!page) notFound();

  if (page.status !== "active" || isExpired(page.expires_at)) {
    if (page.status === "active" && isExpired(page.expires_at)) {
      await supabase.from("love_pages").update({ status: "expired" }).eq("id", page.id);
    }
    return <ExpiredPage />;
  }

  const mapped = mapDbPage(page, page.moments || []);
  const signed = await withSignedImages(mapped);

  return <GiftPage page={signed} />;
}

async function withSignedImages(page: LovePageDraft) {
  const supabase = createSupabaseAdminClient();
  const paths = [
    page.mainPhotoUrl,
    ...page.bestPhotos.map((photo) => photo.imageUrl),
    ...page.moments.flatMap((moment) => moment.images.map((image) => image.imageUrl))
  ].filter(Boolean);
  if (!paths.length) return page;
  const { data } = await supabase.storage.from("gift-images").createSignedUrls(paths, 60 * 60);
  const urls = new Map(data?.map((item) => [item.path, item.signedUrl]) || []);

  return {
    ...page,
    mainPhotoSignedUrl: urls.get(page.mainPhotoUrl) || undefined,
    bestPhotos: page.bestPhotos.map((photo) => ({ ...photo, signedUrl: urls.get(photo.imageUrl) || undefined })),
    moments: page.moments.map((moment) => ({
      ...moment,
      images: moment.images.map((image) => ({ ...image, signedUrl: urls.get(image.imageUrl) || undefined }))
    }))
  };
}

function getCoverImagePath(page: LovePageDraft) {
  return (
    page.mainPhotoUrl ||
    page.bestPhotos[0]?.imageUrl ||
    page.moments.flatMap((moment) => moment.images.map((image) => image.imageUrl))[0] ||
    ""
  );
}

async function createSignedImageUrl(path: string, expiresIn: number) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.storage.from("gift-images").createSignedUrl(path, expiresIn);
  return data?.signedUrl;
}

function ExpiredPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12 text-center">
      <div className="max-w-md rounded-md border border-ink/10 bg-white p-8 shadow-soft">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-petal text-3xl">♡</div>
        <h1 className="mt-5 text-3xl font-bold">Esta página não está mais disponível.</h1>
        <p className="mt-3 leading-7 text-ink/65">A pessoa criadora pode renovar o presente pelo dashboard.</p>
      </div>
    </main>
  );
}
