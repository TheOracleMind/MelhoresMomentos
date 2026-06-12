import { notFound } from "next/navigation";
import { GiftPage } from "@/components/gift-page";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { LovePageDraft } from "@/lib/types";
import { isExpired, mapDbPage } from "@/lib/utils";

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
