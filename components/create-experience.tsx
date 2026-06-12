"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/button";
import { GiftPage } from "@/components/gift-page";
import { compressImage } from "@/lib/image";
import { formatPrice, initialPlans } from "@/lib/plans";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { LovePageDraft, Moment, RelationshipType, ThemeName } from "@/lib/types";
import { cn, createPageSlug, emptyDraft, mapDbPage } from "@/lib/utils";

const relationshipOptions: Array<{ value: RelationshipType; label: string }> = [
  { value: "namoro", label: "Namoro" },
  { value: "noivado", label: "Noivado" },
  { value: "casamento", label: "Casamento" },
  { value: "outro", label: "Outro" }
];

const themeOptions: Array<{ value: ThemeName; label: string }> = [
  { value: "classic", label: "Clássico" },
  { value: "minimal", label: "Minimalista" },
  { value: "romantic", label: "Romântico" }
];

function fieldClass() {
  return "focus-ring mt-2 min-h-12 w-full rounded-md border border-ink/10 bg-white px-4 text-base outline-none";
}

function textAreaClass() {
  return "focus-ring mt-2 min-h-28 w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-base outline-none";
}

export function CreateExperience({ mode = "create", pageId }: { mode?: "create" | "edit"; pageId?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const totalSteps = mode === "edit" ? 5 : 6;
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<LovePageDraft>({ ...emptyDraft, moments: emptyDraft.moments.map((moment) => ({ ...moment })) });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const initialLoadDone = useRef(false);

  const patchDraft = useCallback((patch: Partial<LovePageDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const signImagePaths = useCallback(
    async (nextDraft: LovePageDraft) => {
      const paths = [
        nextDraft.mainPhotoUrl,
        ...nextDraft.moments.flatMap((moment) => moment.images.map((image) => image.imageUrl))
      ].filter(Boolean);

      if (!paths.length) return nextDraft;
      const { data } = await supabase.storage.from("gift-images").createSignedUrls(paths, 60 * 60);
      const map = new Map(data?.map((item) => [item.path, item.signedUrl]) || []);

      return {
        ...nextDraft,
        mainPhotoSignedUrl: map.get(nextDraft.mainPhotoUrl) || nextDraft.mainPhotoSignedUrl,
        moments: nextDraft.moments.map((moment) => ({
          ...moment,
          images: moment.images.map((image) => ({
            ...image,
            signedUrl: map.get(image.imageUrl) || image.signedUrl
          }))
        }))
      };
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      setUser(data.user);

      if (data.user && mode === "edit" && pageId) {
        const { data: page, error } = await supabase
          .from("love_pages")
          .select("*, moments(*, moment_images(*))")
          .eq("id", pageId)
          .single();

        if (error || !page) {
          setNotice("Não foi possível carregar esta página.");
        } else {
          const mapped = mapDbPage(page, page.moments || []);
          setDraft(await signImagePaths(mapped));
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

  const ensurePageId = useCallback(
    async (snapshot: LovePageDraft) => {
      if (!user) throw new Error("Entre na conta para salvar.");
      if (snapshot.id) return { id: snapshot.id, slug: snapshot.slug };

      const slug = createPageSlug(snapshot.creatorName, snapshot.recipientName);
      const { data, error } = await supabase
        .from("love_pages")
        .insert({
          user_id: user.id,
          slug,
          creator_name: snapshot.creatorName,
          recipient_name: snapshot.recipientName,
          relationship_type: snapshot.relationshipType,
          status: "draft",
          theme: snapshot.theme,
          title: snapshot.title || "Nossos melhores momentos",
          intro_message: snapshot.introMessage,
          final_message: snapshot.finalMessage
        })
        .select("id, slug")
        .single();

      if (error || !data) throw new Error(error?.message || "Não foi possível criar a página.");
      setDraft((current) => ({ ...current, id: data.id, slug: data.slug }));
      return data;
    },
    [supabase, user]
  );

  const saveDraft = useCallback(
    async (snapshot: LovePageDraft = draft) => {
      if (!user || !initialLoadDone.current) return;
      setSaving(true);
      setNotice("");

      try {
        const page = await ensurePageId(snapshot);
        const nextStatus = mode === "edit" && snapshot.status === "active" ? "active" : snapshot.status || "draft";

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
            status: nextStatus
          })
          .eq("id", page.id);

        if (pageError) throw pageError;

        const { error: deleteError } = await supabase.from("moments").delete().eq("love_page_id", page.id);
        if (deleteError) throw deleteError;

        for (const [index, moment] of snapshot.moments.entries()) {
          if (!moment.title && !moment.description && moment.images.length === 0) continue;
          const { data: insertedMoment, error: momentError } = await supabase
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
      } finally {
        setSaving(false);
      }
    },
    [draft, ensurePageId, mode, supabase, user]
  );

  useEffect(() => {
    if (!user || !initialLoadDone.current) return;
    const timer = window.setTimeout(() => saveDraft(draft), 900);
    return () => window.clearTimeout(timer);
  }, [draft, saveDraft, user]);

  async function uploadFile(file: File, target: "main" | "moment", momentIndex = 0) {
    if (!user) {
      setNotice("Entre na conta antes de enviar imagens.");
      return;
    }
    setUploading(true);
    setNotice("");

    try {
      const page = await ensurePageId(draft);
      const compressed = await compressImage(file);
      const fileName = `${crypto.randomUUID()}.webp`;
      const path = `${user.id}/${page.id}/${target}/${fileName}`;
      const { error } = await supabase.storage.from("gift-images").upload(path, compressed, {
        cacheControl: "31536000",
        upsert: false,
        contentType: "image/webp"
      });
      if (error) throw error;

      const { data } = await supabase.storage.from("gift-images").createSignedUrl(path, 60 * 60);
      if (target === "main") {
        patchDraft({ mainPhotoUrl: path, mainPhotoSignedUrl: data?.signedUrl });
      } else {
        setDraft((current) => ({
          ...current,
          moments: current.moments.map((moment, index) =>
            index === momentIndex
              ? {
                  ...moment,
                  images: [...moment.images, { imageUrl: path, signedUrl: data?.signedUrl || undefined, sortOrder: moment.images.length }].slice(0, 3)
                }
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

  async function startCheckout(planId: string) {
    await saveDraft(draft);
    const page = await ensurePageId(draft);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lovePageId: page.id, paymentType: planId })
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-rosewood" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12">
        <AuthForm redirectTo={mode === "edit" && pageId ? `/dashboard/${pageId}/editar` : "/create"} compact />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-32 pt-24">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-ink/10 bg-paper/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Passo {step} de {totalSteps}</span>
            <span className="text-ink/55">{saving ? "Salvando..." : "Salvo automaticamente"}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-rosewood transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5">
        {notice ? <p className="mb-5 rounded-md bg-petal/70 p-3 text-sm font-semibold text-rosewood">{notice}</p> : null}

        {step === 1 ? (
          <StepShell title="Informações principais" subtitle="Comece com os nomes e o tipo de relacionamento.">
            <label className="block text-sm font-semibold">Seu nome</label>
            <input className={fieldClass()} value={draft.creatorName} onChange={(event) => patchDraft({ creatorName: event.target.value })} />
            <label className="mt-5 block text-sm font-semibold">Nome da pessoa presenteada</label>
            <input className={fieldClass()} value={draft.recipientName} onChange={(event) => patchDraft({ recipientName: event.target.value })} />
            <label className="mt-5 block text-sm font-semibold">Tipo de relacionamento</label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {relationshipOptions.map((option) => (
                <button
                  key={option.value}
                  className={cn("focus-ring min-h-12 rounded-md border px-4 font-semibold", draft.relationshipType === option.value ? "border-rosewood bg-petal text-rosewood" : "border-ink/10 bg-white")}
                  onClick={() => patchDraft({ relationshipType: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell title="Datas" subtitle="Essas datas ajudam a contar o tempo dessa história.">
            <label className="block text-sm font-semibold">Data em que se conheceram</label>
            <input className={fieldClass()} type="date" value={draft.metAt || ""} onChange={(event) => patchDraft({ metAt: event.target.value || null })} />
            <label className="mt-5 block text-sm font-semibold">Data em que começaram o relacionamento</label>
            <input className={fieldClass()} type="date" value={draft.relationshipStartedAt || ""} onChange={(event) => patchDraft({ relationshipStartedAt: event.target.value || null })} />
            <label className="mt-5 block text-sm font-semibold">Mensagem curta opcional</label>
            <textarea className={textAreaClass()} value={draft.shortMessage} onChange={(event) => patchDraft({ shortMessage: event.target.value })} />
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell title="Foto principal" subtitle="Escolha uma imagem que represente bem esse presente.">
            <div className="overflow-hidden rounded-md border border-ink/10 bg-white">
              <div className="flex aspect-[4/3] items-center justify-center bg-petal/65">
                {draft.mainPhotoSignedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.mainPhotoSignedUrl} alt="Prévia da foto principal" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-10 w-10 text-rosewood" />
                )}
              </div>
              <label className="focus-ring flex cursor-pointer items-center justify-center gap-2 p-4 font-semibold">
                <ImagePlus className="h-4 w-4" />
                {uploading ? "Enviando..." : "Selecionar foto"}
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0], "main")} />
              </label>
            </div>
          </StepShell>
        ) : null}

        {step === 4 ? (
          <StepShell title="Momentos especiais" subtitle="Adicione até 8 momentos, com até 3 imagens em cada um.">
            <div className="space-y-4">
              {draft.moments.map((moment, index) => (
                <div key={`${moment.id || index}`} className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">Momento {index + 1}</p>
                    <div className="flex gap-1">
                      <IconButton label="Subir" disabled={index === 0} onClick={() => moveMoment(index, -1)}><ArrowUp className="h-4 w-4" /></IconButton>
                      <IconButton label="Descer" disabled={index === draft.moments.length - 1} onClick={() => moveMoment(index, 1)}><ArrowDown className="h-4 w-4" /></IconButton>
                      <IconButton label="Remover" disabled={draft.moments.length === 1} onClick={() => patchDraft({ moments: draft.moments.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="h-4 w-4" /></IconButton>
                    </div>
                  </div>
                  <input className={fieldClass()} placeholder="Título" value={moment.title} onChange={(event) => updateMoment(index, { title: event.target.value })} />
                  <input className={fieldClass()} type="date" value={moment.momentDate || ""} onChange={(event) => updateMoment(index, { momentDate: event.target.value || null })} />
                  <textarea className={textAreaClass()} placeholder="Descrição" value={moment.description} onChange={(event) => updateMoment(index, { description: event.target.value })} />
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {moment.images.map((image, imageIndex) => (
                      <div key={image.imageUrl} className="relative aspect-square overflow-hidden rounded-md bg-petal">
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
                      <label className="focus-ring flex aspect-square cursor-pointer items-center justify-center rounded-md border border-dashed border-rosewood/40 bg-petal/40">
                        <ImagePlus className="h-5 w-5 text-rosewood" />
                        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0], "moment", index)} />
                      </label>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="mt-5 w-full"
              variant="secondary"
              disabled={draft.moments.length >= 8}
              onClick={() => patchDraft({ moments: [...draft.moments, { title: "", description: "", momentDate: null, sortOrder: draft.moments.length, images: [] }] })}
            >
              <Plus className="h-4 w-4" />
              Adicionar momento
            </Button>
          </StepShell>
        ) : null}

        {step === 5 ? (
          <StepShell title="Personalização" subtitle="Defina o texto de abertura, fechamento e visual.">
            <label className="block text-sm font-semibold">Título da página</label>
            <input className={fieldClass()} value={draft.title} onChange={(event) => patchDraft({ title: event.target.value })} placeholder="Nossos melhores momentos" />
            <label className="mt-5 block text-sm font-semibold">Mensagem inicial</label>
            <textarea className={textAreaClass()} value={draft.introMessage} onChange={(event) => patchDraft({ introMessage: event.target.value })} />
            <label className="mt-5 block text-sm font-semibold">Mensagem final</label>
            <textarea className={textAreaClass()} value={draft.finalMessage} onChange={(event) => patchDraft({ finalMessage: event.target.value })} />
            <label className="mt-5 block text-sm font-semibold">Tema</label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  className={cn("focus-ring min-h-12 rounded-md border px-4 font-semibold", draft.theme === option.value ? "border-rosewood bg-petal text-rosewood" : "border-ink/10 bg-white")}
                  onClick={() => patchDraft({ theme: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </StepShell>
        ) : null}

        {step === 6 && mode === "create" ? (
          <StepShell title="Pagamento" subtitle="Escolha por quanto tempo a página ficará disponível.">
            <div className="grid gap-4 sm:grid-cols-2">
              {initialPlans.map((plan) => (
                <div key={plan.id} className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
                  <p className="text-sm font-bold text-rosewood">{plan.label}</p>
                  <p className="mt-3 text-3xl font-bold">{formatPrice(plan.price)}</p>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-ink/65">{plan.description}</p>
                  <Button className="mt-5 w-full" disabled={saving} onClick={() => startCheckout(plan.id)}>
                    Pagar com Stripe
                  </Button>
                </div>
              ))}
            </div>
          </StepShell>
        ) : null}
      </section>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-paper/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2">
          <Button variant="secondary" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4" />
            Pré-visualizar
          </Button>
          {step < totalSteps ? (
            <Button onClick={() => setStep((current) => Math.min(totalSteps, current + 1))}>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : mode === "edit" ? (
            <Button onClick={async () => {
              await saveDraft(draft);
              router.push(pageId ? `/dashboard/${pageId}` : "/dashboard");
            }}>
              Salvar
            </Button>
          ) : (
            <Button disabled>Escolha plano</Button>
          )}
        </div>
      </footer>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-paper">
          <button className="fixed right-4 top-4 z-10 rounded-full bg-white p-3 shadow-soft" aria-label="Fechar pré-visualização" onClick={() => setPreviewOpen(false)}>
            <X className="h-5 w-5" />
          </button>
          <GiftPage page={draft} preview />
        </div>
      ) : null}
    </main>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white/75 p-5 shadow-soft sm:p-7">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 leading-7 text-ink/65">{subtitle}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function IconButton({ label, children, disabled, onClick }: { label: string; children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 bg-white text-ink disabled:opacity-35"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
