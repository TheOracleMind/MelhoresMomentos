"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Gift,
  Heart,
  HelpCircle,
  ImagePlus,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/button";
import { GiftPage } from "@/components/gift-page";
import { compressImage } from "@/lib/image";
import { formatPrice, initialPlans } from "@/lib/plans";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BestPhoto, LovePageDraft, Moment, PaymentType, RelationshipType } from "@/lib/types";
import { cn, emptyDraft, mapDbPage } from "@/lib/utils";

const localDraftKey = "melhores-momentos-draft";
const localTokenKey = "melhores-momentos-draft-token";

const relationshipOptions: Array<{ value: RelationshipType; label: string }> = [
  { value: "namoro", label: "Namoro" },
  { value: "noivado", label: "Noivado" },
  { value: "casamento", label: "Casamento" },
  { value: "outro", label: "Outro" }
];

function freshDraft(): LovePageDraft {
  return {
    ...emptyDraft,
    bestPhotos: [],
    moments: emptyDraft.moments.map((moment) => ({ ...moment, images: [] }))
  };
}

function normalizeDraft(draft: LovePageDraft): LovePageDraft {
  return {
    ...freshDraft(),
    ...draft,
    theme: "classic",
    bestPhotos: (draft.bestPhotos || []).slice(0, 5).map((photo, sortOrder) => ({ ...photo, sortOrder })),
    moments: (draft.moments?.length ? draft.moments : freshDraft().moments).map((moment, sortOrder) => ({
      ...moment,
      sortOrder,
      images: moment.images || []
    }))
  };
}

function fieldClass() {
  return "focus-ring mt-2 min-h-14 w-full rounded-md border-2 border-ink/10 bg-white px-4 text-lg font-semibold outline-none";
}

function textAreaClass() {
  return "focus-ring mt-2 min-h-32 w-full rounded-md border-2 border-ink/10 bg-white px-4 py-3 text-lg font-semibold outline-none";
}

function getDraftToken() {
  let token = window.localStorage.getItem(localTokenKey);
  if (!token) {
    token = crypto.randomUUID().replace(/-/g, "");
    window.localStorage.setItem(localTokenKey, token);
  }
  return token;
}

export function CreateExperience({ mode = "create", pageId }: { mode?: "create" | "edit"; pageId?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const totalSteps = mode === "edit" ? 6 : 8;
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<LovePageDraft>(freshDraft);
  const [selectedPlan, setSelectedPlan] = useState<PaymentType>("initial_365d");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState<number[]>([]);
  const [expandedDates, setExpandedDates] = useState<number[]>([]);
  const initialLoadDone = useRef(false);
  const isCheckoutStep = mode === "create" && step === totalSteps;
  const creatorName = draft.creatorName.trim() || "você";
  const recipientName = draft.recipientName.trim() || "essa pessoa especial";
  const coupleName = draft.creatorName.trim() && draft.recipientName.trim() ? `${draft.creatorName.trim()} e ${draft.recipientName.trim()}` : "vocês";

  const patchDraft = useCallback((patch: Partial<LovePageDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const signImagePaths = useCallback(
    async (nextDraft: LovePageDraft) => {
      const paths = [
        nextDraft.mainPhotoUrl,
        ...nextDraft.bestPhotos.map((photo) => photo.imageUrl),
        ...nextDraft.moments.flatMap((moment) => moment.images.map((image) => image.imageUrl))
      ].filter(Boolean);
      if (!paths.length) return nextDraft;

      const response = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, paths })
      });
      const payload = await response.json();
      const map = new Map<string, string>(
        (payload.urls || []).map((item: { path: string; signedUrl: string }) => [item.path, item.signedUrl])
      );

      return {
        ...nextDraft,
        mainPhotoSignedUrl: map.get(nextDraft.mainPhotoUrl) || nextDraft.mainPhotoSignedUrl,
        bestPhotos: nextDraft.bestPhotos.map((photo) => ({ ...photo, signedUrl: map.get(photo.imageUrl) || photo.signedUrl })),
        moments: nextDraft.moments.map((moment) => ({
          ...moment,
          images: moment.images.map((image) => ({ ...image, signedUrl: map.get(image.imageUrl) || image.signedUrl }))
        }))
      };
    },
    [pageId]
  );

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      setUser(data.user);

      if (mode === "create") {
        const saved = window.localStorage.getItem(localDraftKey);
        if (saved) {
          try {
            setDraft(normalizeDraft(JSON.parse(saved)));
          } catch {
            setDraft(freshDraft());
          }
        }
      }

      if (data.user && mode === "edit" && pageId) {
        const { data: page, error } = await supabase
          .from("love_pages")
          .select("*, best_photos(*), moments(*, moment_images(*))")
          .eq("id", pageId)
          .single();

        if (error || !page) {
          setNotice("Não foi possível carregar esta página.");
        } else {
          setDraft(await signImagePaths(mapDbPage(page, page.moments || [])));
        }
      }

      initialLoadDone.current = true;
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [mode, pageId, signImagePaths, supabase]);

  const saveDraft = useCallback(
    async (snapshot: LovePageDraft = draft) => {
      if (!initialLoadDone.current) return;

      if (mode === "create") {
        window.localStorage.setItem(localDraftKey, JSON.stringify(snapshot));
        return;
      }

      if (!user || !snapshot.id) return;
      setNotice("");

      try {
        const { error: pageError } = await supabase
          .from("love_pages")
          .update({
            creator_name: snapshot.creatorName,
            recipient_name: snapshot.recipientName,
            relationship_type: snapshot.relationshipType,
            met_at: snapshot.metAt || null,
            relationship_started_at: snapshot.relationshipStartedAt || null,
            short_message: snapshot.shortMessage || null,
            title: snapshot.title || "Nossos melhores momentos",
            intro_message: snapshot.introMessage || "",
            final_message: snapshot.finalMessage || "",
            main_photo_url: snapshot.mainPhotoUrl || null,
            theme: snapshot.theme,
            status: snapshot.status === "active" ? "active" : snapshot.status || "draft"
          })
          .eq("id", snapshot.id);

        if (pageError) throw pageError;

        const { error: deleteError } = await supabase.from("moments").delete().eq("love_page_id", snapshot.id);
        if (deleteError) throw deleteError;

        const { error: bestPhotosDeleteError } = await supabase.from("best_photos").delete().eq("love_page_id", snapshot.id);
        if (bestPhotosDeleteError) throw bestPhotosDeleteError;

        const bestPhotoRows = snapshot.bestPhotos.slice(0, 5).map((photo, index) => ({
          love_page_id: snapshot.id,
          image_url: photo.imageUrl,
          sort_order: index
        }));

        if (bestPhotoRows.length) {
          const { error: bestPhotosError } = await supabase.from("best_photos").insert(bestPhotoRows);
          if (bestPhotosError) throw bestPhotosError;
        }

        for (const [index, moment] of snapshot.moments.entries()) {
          if (!moment.title && !moment.description && moment.images.length === 0) continue;
          const { data: insertedMoment, error: momentError } = await supabase
            .from("moments")
            .insert({
              love_page_id: snapshot.id,
              title: moment.title || `Momento ${index + 1}`,
              description: moment.description || "",
              moment_date: moment.momentDate || null,
              sort_order: index
            })
            .select("id")
            .single();

          if (momentError || !insertedMoment) throw momentError;

          const imageRows = moment.images.map((image, imageIndex) => ({
            moment_id: insertedMoment.id,
            image_url: image.imageUrl,
            sort_order: imageIndex
          }));
          if (imageRows.length) {
            const { error: imageError } = await supabase.from("moment_images").insert(imageRows);
            if (imageError) throw imageError;
          }
        }
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Não foi possível salvar.");
      }
    },
    [draft, mode, supabase, user]
  );

  useEffect(() => {
    if (!initialLoadDone.current) return;
    const timer = window.setTimeout(() => saveDraft(draft), 450);
    return () => window.clearTimeout(timer);
  }, [draft, saveDraft]);

  async function uploadFile(file: File, target: "main" | "moment" | "best", momentIndex = 0) {
    setUploading(true);
    setNotice("");

    try {
      const compressed = await compressImage(file);
      let path = "";
      let signedUrl: string | undefined;

      if (mode === "create") {
        const formData = new FormData();
        formData.append("file", compressed);
        formData.append("draftToken", getDraftToken());
        formData.append("target", target);

        const response = await fetch("/api/uploads", {
          method: "POST",
          body: formData
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Não foi possível enviar a imagem.");
        path = payload.path;
        signedUrl = payload.signedUrl;
      } else {
        if (!user || !draft.id) throw new Error("Entre na conta antes de enviar imagens.");
        const fileName = `${crypto.randomUUID()}.webp`;
        path = `${user.id}/${draft.id}/${target}/${fileName}`;
        const { error } = await supabase.storage.from("gift-images").upload(path, compressed, {
          cacheControl: "31536000",
          upsert: false,
          contentType: "image/webp"
        });
        if (error) throw error;
        const { data } = await supabase.storage.from("gift-images").createSignedUrl(path, 60 * 60);
        signedUrl = data?.signedUrl || undefined;
      }

      if (target === "main") {
        patchDraft({ mainPhotoUrl: path, mainPhotoSignedUrl: signedUrl });
      } else if (target === "best") {
        setDraft((current) => ({
          ...current,
          bestPhotos: [...current.bestPhotos, { imageUrl: path, signedUrl, sortOrder: current.bestPhotos.length }].slice(0, 5)
        }));
      } else {
        setDraft((current) => ({
          ...current,
          moments: current.moments.map((moment, index) =>
            index === momentIndex
              ? { ...moment, images: [...moment.images, { imageUrl: path, signedUrl, sortOrder: moment.images.length }].slice(0, 3) }
              : moment
          )
        }));
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function startCheckout() {
    await saveDraft(draft);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "create"
          ? { paymentType: selectedPlan, draft: { ...draft, theme: "classic" } }
          : { lovePageId: draft.id, paymentType: selectedPlan }
      )
    });
    const payload = await response.json();
    if (!response.ok) {
      setNotice(payload.error || "Não foi possível iniciar o checkout.");
      return;
    }
    window.location.href = payload.url;
  }

  function updateMoment(index: number, patch: Partial<Moment>) {
    setDraft((current) => ({
      ...current,
      moments: current.moments.map((moment, momentIndex) => (momentIndex === index ? { ...moment, ...patch } : moment))
    }));
  }

  function moveMoment(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const next = [...current.moments];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, moments: next.map((moment, sortOrder) => ({ ...moment, sortOrder })) };
    });
  }

  function updateBestPhotos(nextPhotos: BestPhoto[]) {
    patchDraft({ bestPhotos: nextPhotos.slice(0, 5).map((photo, sortOrder) => ({ ...photo, sortOrder })) });
  }

  function moveBestPhoto(index: number, direction: -1 | 1) {
    const next = [...draft.bestPhotos];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateBestPhotos(next);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-rosewood" />
      </main>
    );
  }

  if (mode === "edit" && !user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12">
        <AuthForm redirectTo={pageId ? `/dashboard/${pageId}/editar` : "/dashboard"} compact />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfbfb] pb-36 pt-28">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-ink/10 bg-white px-5 py-5 shadow-sm">
        <StepProgress step={step} totalSteps={totalSteps} />
      </header>

      <section className="mx-auto max-w-3xl px-5">
        {notice ? <p className="mb-5 rounded-md bg-red-50 p-4 text-base font-bold text-rosewood">{notice}</p> : null}

        {step === 1 ? (
          <StepShell
            eyebrow="Vamos começar"
            title="Vamos criar um presente especial?"
            subtitle="Me conta seu nome e quem é a pessoa amada que vai receber essa surpresa."
          >
            <ConversationBubble>
              Esse presente vai ficar com a cara de vocês. Primeiro, preciso saber como chamar cada pessoa nessa história.
            </ConversationBubble>
            <label className="block text-base font-extrabold">Como você quer aparecer na página?</label>
            <input className={fieldClass()} placeholder="Seu nome" value={draft.creatorName} onChange={(event) => patchDraft({ creatorName: event.target.value })} />
            <label className="mt-5 block text-base font-extrabold">E qual é o nome da pessoa presenteada?</label>
            <input className={fieldClass()} placeholder="Nome da pessoa amada" value={draft.recipientName} onChange={(event) => patchDraft({ recipientName: event.target.value })} />
            <label className="mt-5 block text-base font-extrabold">Que tipo de história vocês estão celebrando?</label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {relationshipOptions.map((option) => (
                <ChoiceButton key={option.value} active={draft.relationshipType === option.value} onClick={() => patchDraft({ relationshipType: option.value })}>
                  {option.label}
                </ChoiceButton>
              ))}
            </div>
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell
            eyebrow="A história de vocês"
            title={`Que bonito, ${creatorName}. Quando tudo começou?`}
            subtitle={`Essas datas ajudam a página de ${recipientName} a contar o tempo dessa história de um jeito mais emocionante.`}
          >
            <ConversationBubble>
              Se você não lembrar uma data exata, tudo bem. O presente continua lindo com as informações que você tiver.
            </ConversationBubble>
            <label className="block text-base font-extrabold">Quando vocês se conheceram?</label>
            <input className={fieldClass()} type="date" value={draft.metAt || ""} onChange={(event) => patchDraft({ metAt: event.target.value || null })} />
            <label className="mt-5 block text-base font-extrabold">E quando o relacionamento começou?</label>
            <input className={fieldClass()} type="date" value={draft.relationshipStartedAt || ""} onChange={(event) => patchDraft({ relationshipStartedAt: event.target.value || null })} />
            <label className="mt-5 block text-base font-extrabold">Quer deixar uma frase curtinha para abrir o clima?</label>
            <textarea className={textAreaClass()} placeholder={`Ex: ${recipientName}, preparei isso para lembrar do quanto nossa história é especial.`} value={draft.shortMessage} onChange={(event) => patchDraft({ shortMessage: event.target.value })} />
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell
            eyebrow="A primeira impressão"
            title={`Escolha uma foto que faça ${recipientName} sorrir.`}
            subtitle="Essa vai ser a imagem de abertura do presente. Pense naquela foto que já carrega uma memória inteira."
          >
            <ConversationBubble>
              Pode ser uma foto simples. O que importa é que ela tenha significado para vocês.
            </ConversationBubble>
            <div className="overflow-hidden rounded-md border-2 border-ink/10 bg-white">
              <div className="flex aspect-[4/3] items-center justify-center bg-red-50">
                {draft.mainPhotoSignedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.mainPhotoSignedUrl} alt="Prévia da foto principal" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-12 w-12 text-rosewood" />
                )}
              </div>
              <label className="focus-ring flex min-h-16 cursor-pointer items-center justify-center gap-2 p-4 text-lg font-extrabold text-rosewood">
                <ImagePlus className="h-5 w-5" />
                {uploading ? "Enviando..." : "Selecionar foto"}
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0], "main")} />
              </label>
            </div>
          </StepShell>
        ) : null}

        {step === 4 ? (
          <StepShell
            eyebrow="As cinco favoritas"
            title={`Agora escolha as 5 melhores fotos de ${coupleName}.`}
            subtitle="Coloque em ordem de preferência. A primeira da lista vira a foto número 1 no presente, como um ranking para revelar."
          >
            <ConversationBubble>
              Pense nas fotos que fariam {recipientName} parar a tela por alguns segundos. Pode mandar aos poucos e trocar a ordem quando quiser.
            </ConversationBubble>

            <div className="grid gap-3">
              {draft.bestPhotos.map((photo, index) => (
                <div key={photo.imageUrl} className="flex items-center gap-3 rounded-md border-2 border-ink/10 bg-white p-3 shadow-soft">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-red-50">
                    {photo.signedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.signedUrl} alt={`Foto favorita ${index + 1}`} className="h-full w-full object-cover" />
                    ) : null}
                    <span className="absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-rosewood text-sm font-black text-white">
                      {index + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-black">Foto #{index + 1}</p>
                    <p className="text-sm font-bold text-ink/55">Arrume a ordem para montar o suspense da revelação.</p>
                  </div>
                  <div className="flex gap-1">
                    <IconButton label="Subir foto" disabled={index === 0} onClick={() => moveBestPhoto(index, -1)}><ArrowUp className="h-4 w-4" /></IconButton>
                    <IconButton label="Descer foto" disabled={index === draft.bestPhotos.length - 1} onClick={() => moveBestPhoto(index, 1)}><ArrowDown className="h-4 w-4" /></IconButton>
                    <IconButton label="Remover foto" onClick={() => updateBestPhotos(draft.bestPhotos.filter((_, photoIndex) => photoIndex !== index))}><Trash2 className="h-4 w-4" /></IconButton>
                  </div>
                </div>
              ))}
            </div>

            {draft.bestPhotos.length < 5 ? (
              <label className="focus-ring mt-5 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-rosewood/40 bg-red-50 p-5 text-center text-lg font-extrabold text-rosewood">
                <ImagePlus className="h-7 w-7" />
                {uploading ? "Enviando..." : `Adicionar foto ${draft.bestPhotos.length + 1} de 5`}
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0], "best")} />
              </label>
            ) : (
              <div className="mt-5 rounded-md bg-red-50 p-4 text-base font-extrabold text-rosewood">
                Pronto: as cinco fotos favoritas já estão em ordem.
              </div>
            )}
          </StepShell>
        ) : null}

        {step === 5 ? (
          <StepShell
            eyebrow="Memórias que marcaram"
            title={`Quais momentos de ${coupleName} merecem entrar nesse presente?`}
            subtitle="Você pode adicionar, remover e mudar a ordem. Data e descrição são opcionais, então coloque só o que deixar a lembrança mais bonita."
          >
            <ConversationBubble>
              Pense em viagens, mensagens importantes, um dia comum que virou especial, uma conquista, uma risada, uma surpresa.
            </ConversationBubble>
            <div className="space-y-4">
              {draft.moments.map((moment, index) => (
                <div key={`${moment.id || index}`} className="animate-rise rounded-md border-2 border-ink/10 bg-white p-4 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-extrabold">Momento {index + 1}</p>
                    <div className="flex gap-1">
                      <IconButton label="Subir" disabled={index === 0} onClick={() => moveMoment(index, -1)}><ArrowUp className="h-4 w-4" /></IconButton>
                      <IconButton label="Descer" disabled={index === draft.moments.length - 1} onClick={() => moveMoment(index, 1)}><ArrowDown className="h-4 w-4" /></IconButton>
                      <IconButton label="Remover" disabled={draft.moments.length === 1} onClick={() => patchDraft({ moments: draft.moments.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="h-4 w-4" /></IconButton>
                    </div>
                  </div>
                  <label className="mt-4 block text-base font-extrabold">Dê um nome para essa lembrança</label>
                  <input className={fieldClass()} placeholder="Ex: Nossa primeira viagem" value={moment.title} onChange={(event) => updateMoment(index, { title: event.target.value })} />

                  {moment.momentDate || expandedDates.includes(index) ? (
                    <>
                      <label className="mt-4 block text-base font-extrabold">Se quiser, coloque a data</label>
                      <input className={fieldClass()} type="date" value={moment.momentDate || ""} onChange={(event) => updateMoment(index, { momentDate: event.target.value || null })} />
                    </>
                  ) : (
                    <Button className="mt-4 w-full" variant="secondary" onClick={() => setExpandedDates((current) => [...current, index])}>
                      <CalendarDays className="h-5 w-5" />
                      Adicionar data opcional
                    </Button>
                  )}

                  {moment.description || expandedDescriptions.includes(index) ? (
                    <>
                      <label className="mt-4 block text-base font-extrabold">Quer contar por que esse momento foi especial?</label>
                      <textarea className={textAreaClass()} placeholder="Descrição opcional" value={moment.description} onChange={(event) => updateMoment(index, { description: event.target.value })} />
                    </>
                  ) : (
                    <Button className="mt-3 w-full" variant="secondary" onClick={() => setExpandedDescriptions((current) => [...current, index])}>
                      <Heart className="h-5 w-5" />
                      Adicionar descrição opcional
                    </Button>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {moment.images.map((image, imageIndex) => (
                      <div key={image.imageUrl} className="relative aspect-square overflow-hidden rounded-md bg-red-50">
                        {image.signedUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image.signedUrl} alt="Prévia do momento" className="h-full w-full object-cover" />
                        ) : null}
                        <button
                          className="absolute right-1 top-1 rounded-full bg-white p-1 text-rosewood"
                          aria-label="Remover imagem"
                          onClick={() => updateMoment(index, { images: moment.images.filter((_, itemIndex) => itemIndex !== imageIndex) })}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {moment.images.length < 3 ? (
                      <label className="focus-ring flex aspect-square cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-rosewood/40 bg-red-50">
                        <ImagePlus className="h-6 w-6 text-rosewood" />
                        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0], "moment", index)} />
                      </label>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-5 w-full" variant="secondary" disabled={draft.moments.length >= 8} onClick={() => patchDraft({ moments: [...draft.moments, { title: "", description: "", momentDate: null, sortOrder: draft.moments.length, images: [] }] })}>
              <Plus className="h-5 w-5" />
              Adicionar momento
            </Button>
          </StepShell>
        ) : null}

        {step === 6 ? (
          <StepShell
            eyebrow="A dedicatória"
            title={`Agora vamos escrever o que ${recipientName} vai sentir ao abrir.`}
            subtitle="Essas mensagens deixam o presente com voz, intenção e carinho. Pode ser simples, sincero e direto do seu jeito."
          >
            <ConversationBubble>
              Não precisa parecer perfeito. As melhores mensagens são as que parecem verdadeiras.
            </ConversationBubble>
            <label className="block text-base font-extrabold">Qual título esse presente deve ter?</label>
            <input className={fieldClass()} value={draft.title} onChange={(event) => patchDraft({ title: event.target.value, theme: "classic" })} placeholder={`Para ${recipientName}`} />
            <label className="mt-5 block text-base font-extrabold">Mensagem de abertura</label>
            <textarea className={textAreaClass()} placeholder={`${recipientName}, fiz essa página para guardar um pouco do que vivemos até aqui...`} value={draft.introMessage} onChange={(event) => patchDraft({ introMessage: event.target.value })} />
            <label className="mt-5 block text-base font-extrabold">Mensagem final</label>
            <textarea className={textAreaClass()} placeholder="Uma frase para fechar o presente com emoção." value={draft.finalMessage} onChange={(event) => patchDraft({ finalMessage: event.target.value })} />
          </StepShell>
        ) : null}

        {step === 7 && mode === "create" ? (
          <StepShell
            eyebrow="Veja como ficou"
            title={`Antes de finalizar, confira o presente de ${recipientName}.`}
            subtitle="Esse é o momento de abrir a pré-visualização, sentir a experiência completa e garantir que tudo ficou do jeito que você quer."
          >
            <ConversationBubble>
              Clique no botão abaixo para ver a página como a pessoa presenteada vai receber. Depois é só voltar por esse mesmo canto e continuar para o pagamento.
            </ConversationBubble>
            <div className="rounded-md border-2 border-ink/10 bg-white p-5 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rosewood text-white">
                  <Eye className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-black">Abra a prévia pelo menos uma vez.</p>
                  <p className="mt-2 text-base font-semibold leading-7 text-ink/65">
                    Assim você confirma as fotos, textos, animações e a ordem dos momentos antes de criar o link final.
                  </p>
                </div>
              </div>
              <Button className="mt-6 w-full" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-5 w-5" />
                Ver como ficou
              </Button>
            </div>
          </StepShell>
        ) : null}

        {step === 8 && mode === "create" ? (
          <StepShell
            eyebrow="Está quase pronto"
            title={`Ficou lindo, ${creatorName}. ${recipientName} vai amar abrir isso.`}
            subtitle="Agora escolha por quanto tempo o presente ficará disponível para ser visto, enviado e revivido."
          >
            <ConversationBubble>
              Depois do pagamento, você recebe o link e o QR Code. Também pode editar a página pelo dashboard.
            </ConversationBubble>
            <div className="grid gap-4 sm:grid-cols-2">
              {initialPlans.map((plan) => (
                <button
                  key={plan.id}
                  className={cn(
                    "focus-ring rounded-md border-2 bg-white p-5 text-left shadow-soft transition",
                    selectedPlan === plan.id ? "border-rosewood ring-4 ring-rosewood/15" : "border-ink/10 hover:border-rosewood/45"
                  )}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold uppercase text-rosewood">
                        {plan.id === "initial_365d" ? "Melhor custo-benefício" : "Mais econômico"}
                      </p>
                      <p className="mt-2 text-2xl font-black">{plan.label}</p>
                    </div>
                    <span className={cn("mt-1 h-6 w-6 rounded-full border-2", selectedPlan === plan.id ? "border-rosewood bg-rosewood" : "border-ink/20")} />
                  </div>
                  <p className="mt-4 text-4xl font-black">{formatPrice(plan.price)}</p>
                  <p className="mt-3 min-h-12 text-base font-semibold leading-7 text-ink/65">
                    {plan.id === "initial_365d"
                      ? "Para guardar o presente por 30 dias e poder rever com calma."
                      : "Para uma surpresa rápida, disponível durante um dia após o pagamento."}
                  </p>
                  <ul className="mt-5 space-y-3 text-left">
                    {(plan.id === "initial_365d"
                      ? ["Disponível por 30 dias", "Acesso imediato após pagamento", "Pagamento único", "Link e QR Code inclusos", "Pode editar depois"]
                      : ["Disponível por 24 horas", "Acesso imediato após pagamento", "Pagamento único", "Link e QR Code inclusos"]
                    ).map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm font-extrabold text-ink/75">
                        <CheckCircle2 className="h-5 w-5 text-rosewood" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-md border-2 border-ink/10 bg-white p-5">
              <div className="flex items-center gap-2 text-lg font-black">
                <Sparkles className="h-5 w-5 text-rosewood" />
                O que você recebe
              </div>
              <ul className="mt-4 space-y-3">
                {["Acesso imediato", "Pagamento único", "Suporte exclusivo"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-base font-extrabold text-ink/75">
                    <CheckCircle2 className="h-5 w-5 text-rosewood" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <PlanFaq />
          </StepShell>
        ) : null}
      </section>

      {!isCheckoutStep ? (
      <button
        className="fixed bottom-24 left-4 z-40 inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-base font-extrabold text-rosewood shadow-soft ring-2 ring-rosewood/20"
        onClick={() => setPreviewOpen(true)}
      >
        <Eye className="h-5 w-5" />
        Pré-visualizar
      </button>
      ) : null}

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white px-5 py-4 shadow-[0_-8px_28px_rgba(0,0,0,0.06)]">
        <div className={cn("mx-auto grid max-w-3xl gap-3", isCheckoutStep ? "grid-cols-1" : "grid-cols-2")}>
          {!isCheckoutStep ? (
          <Button variant="secondary" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Button>
          ) : null}
          {step < totalSteps ? (
            <Button onClick={() => setStep((current) => Math.min(totalSteps, current + 1))}>
              Continuar
              <ArrowRight className="h-5 w-5" />
            </Button>
          ) : mode === "edit" ? (
            <Button onClick={async () => {
              await saveDraft(draft);
              router.push(pageId ? `/dashboard/${pageId}` : "/dashboard");
            }}>
              Salvar
            </Button>
          ) : (
            <Button onClick={startCheckout}>Criar minha página</Button>
          )}
        </div>
      </footer>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-paper">
          <button
            className="fixed bottom-24 left-4 z-50 inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-rosewood px-5 py-3 text-base font-extrabold text-white shadow-[0_8px_0_#9f172a]"
            onClick={() => setPreviewOpen(false)}
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>
          <GiftPage page={draft} preview />
        </div>
      ) : null}
    </main>
  );
}

function StepProgress({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <div className="mx-auto flex max-w-3xl items-center">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const number = index + 1;
        const active = number === step;
        const done = number < step;
        return (
          <div key={number} className="flex flex-1 items-center last:flex-none">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-lg font-black transition",
                active || done ? "border-rosewood bg-rosewood text-white" : "border-ink/15 bg-white text-ink/35"
              )}
            >
              {number}
            </div>
            {number < totalSteps ? (
              <div className="mx-2 h-2 flex-1 rounded-full bg-ink/10">
                <div className={cn("h-full rounded-full transition", done ? "bg-rosewood" : "bg-transparent")} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function StepShell({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="animate-rise rounded-md border border-ink/10 bg-white p-5 shadow-soft sm:p-7">
      <p className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-black uppercase text-rosewood">
        <Gift className="h-4 w-4" />
        {eyebrow}
      </p>
      <h1 className="animate-fade-up mt-5 text-4xl font-black leading-tight [animation-delay:90ms]">{title}</h1>
      <p className="animate-fade-up mt-3 text-lg font-semibold leading-8 text-ink/65 [animation-delay:160ms]">{subtitle}</p>
      <div className="animate-fade-up mt-7 [animation-delay:230ms]">{children}</div>
    </div>
  );
}

function ConversationBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex gap-3 rounded-md bg-[#fff7f7] p-4 text-base font-bold leading-7 text-ink/75">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rosewood text-white">
        <Heart className="h-4 w-4" />
      </div>
      <p>{children}</p>
    </div>
  );
}

function PlanFaq() {
  const faqs = [
    ["Posso editar depois que comprar?", "Sim. Depois do pagamento você cria uma senha e acessa o dashboard para editar a página."],
    ["Funciona em qualquer celular?", "Sim. A página foi pensada para abrir bem no celular e também no computador."],
    ["Como envio o presente?", "Você recebe um link público e um QR Code. É só enviar a mensagem ou imprimir o QR Code."],
    ["Qual a diferença entre os planos?", "O conteúdo é o mesmo. O que muda é o tempo em que a página fica disponível: 24 horas ou 30 dias."],
    ["Vale pegar 30 dias?", "Sim, se você quer que a pessoa possa rever o presente com calma depois da surpresa."]
  ];

  return (
    <div className="mt-6 rounded-md border-2 border-ink/10 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 text-lg font-black">
        <HelpCircle className="h-5 w-5 text-rosewood" />
        Dúvidas rápidas
      </div>
      <div className="space-y-3">
        {faqs.map(([question, answer], index) => (
          <details key={question} className="animate-fade-up rounded-md bg-[#fbfbfb] p-4" style={{ animationDelay: `${index * 55}ms` }}>
            <summary className="cursor-pointer text-base font-black">{question}</summary>
            <p className="mt-3 font-semibold leading-7 text-ink/65">{answer}</p>
          </details>
        ))}
      </div>
      <div className="hidden">
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-sm font-extrabold">
          <Clock className="h-5 w-5 text-rosewood" />
          24h é ideal para surpresa rápida.
        </div>
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-sm font-extrabold">
          <CalendarDays className="h-5 w-5 text-rosewood" />
          30 dias é melhor para guardar.
        </div>
      </div>
    </div>
  );
}

function ChoiceButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={cn(
        "focus-ring min-h-14 rounded-md border-2 px-4 text-lg font-extrabold transition",
        active ? "border-rosewood bg-red-50 text-rosewood" : "border-ink/10 bg-white hover:border-rosewood/45"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function IconButton({ label, children, disabled, onClick }: { label: string; children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border-2 border-ink/10 bg-white text-ink disabled:opacity-35"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
