import Image from "next/image";
import { CalendarDays, Heart, Sparkles } from "lucide-react";
import type { LovePageDraft } from "@/lib/types";
import { cn, formatDate, relationshipDuration } from "@/lib/utils";

const themeClasses = {
  classic: "bg-[#fffaf7] text-ink",
  minimal: "bg-white text-ink",
  romantic: "bg-[#fff4f1] text-ink"
};

export function GiftPage({ page, preview = false }: { page: LovePageDraft; preview?: boolean }) {
  const title = page.title || "Nossos melhores momentos";
  const creator = page.creatorName || "Você";
  const recipient = page.recipientName || "pessoa especial";
  const mainPhoto = page.mainPhotoSignedUrl;

  return (
    <main className={cn("min-h-screen", themeClasses[page.theme])}>
      <section className="mx-auto flex min-h-[92vh] w-full max-w-5xl flex-col px-5 py-8 sm:px-8">
        {preview ? (
          <p className="mb-4 rounded-full bg-white/80 px-4 py-2 text-center text-xs font-semibold text-rosewood shadow-soft">
            Pré-visualização
          </p>
        ) : null}

        <div className="grid flex-1 items-center gap-8 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-rosewood shadow-soft">
              <Sparkles className="h-4 w-4" />
              Presente digital
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">{title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-ink/72">
              {page.introMessage || `Uma página criada para celebrar a história de ${creator} e ${recipient}.`}
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-ink/10 bg-white/80 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">História</p>
                <p className="mt-2 text-lg font-bold">{relationshipDuration(page.relationshipStartedAt)}</p>
              </div>
              <div className="rounded-md border border-ink/10 bg-white/80 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">Começo</p>
                <p className="mt-2 text-lg font-bold">{formatDate(page.relationshipStartedAt)}</p>
              </div>
            </div>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-petal shadow-soft">
            {mainPhoto ? (
              <Image src={mainPhoto} alt="Foto principal do presente" fill className="object-cover" sizes="(min-width: 768px) 45vw, 90vw" />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center text-rosewood">
                <Heart className="h-16 w-16" />
                <span className="sr-only">Espaço reservado para foto principal</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white/72 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-rosewood" />
            <h2 className="text-2xl font-bold">Momentos especiais</h2>
          </div>
          <div className="mt-8 space-y-8">
            {(page.moments.length ? page.moments : [{ title: "Primeiro momento", description: "Adicione memórias para montar a timeline.", momentDate: null, sortOrder: 0, images: [] }]).map((moment, index) => (
              <article key={`${moment.id || index}`} className="grid gap-5 border-l border-rosewood/30 pl-5 md:grid-cols-[0.85fr_1.15fr]">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-rosewood">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(moment.momentDate)}
                  </div>
                  <h3 className="mt-2 text-2xl font-bold">{moment.title || `Momento ${index + 1}`}</h3>
                  <p className="mt-3 leading-7 text-ink/70">{moment.description || "Uma lembrança importante merece um texto bonito aqui."}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(moment.images.length ? moment.images : [{ imageUrl: "", signedUrl: "", sortOrder: 0 }]).slice(0, 3).map((image, imageIndex) => (
                    <div key={`${image.imageUrl || imageIndex}`} className="relative aspect-square overflow-hidden rounded-md bg-petal">
                      {image.signedUrl ? (
                        <Image src={image.signedUrl} alt={`Imagem do momento ${index + 1}`} fill className="object-cover" sizes="30vw" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs font-semibold text-rosewood/70">
                          Foto
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 text-center sm:px-8">
        <p className="mx-auto max-w-2xl text-2xl font-bold leading-snug">
          {page.finalMessage || "Que esta página guarde um pedaço bonito dessa história."}
        </p>
      </section>
    </main>
  );
}
