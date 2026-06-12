import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { PageQrCode } from "@/components/dashboard-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, getPublicPageUrl, isExpired } from "@/lib/utils";

export default async function DashboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?redirectTo=/dashboard/${id}`);

  const { data: page } = await supabase
    .from("love_pages")
    .select("*, moments(id)")
    .eq("id", id)
    .single();

  if (!page) notFound();

  const expired = page.status === "expired" || isExpired(page.expires_at);
  const publicUrl = getPublicPageUrl(page.slug);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-sm font-semibold text-rosewood">Voltar ao dashboard</Link>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
          <section className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
            <span className="rounded-full bg-petal px-3 py-1 text-xs font-bold text-rosewood">
              {expired ? "Expirada" : page.status === "active" ? "Ativa" : page.status === "pending_payment" ? "Pagamento pendente" : "Rascunho"}
            </span>
            <h1 className="mt-4 text-4xl font-bold">{page.title || "Nossos melhores momentos"}</h1>
            <p className="mt-3 break-all text-sm font-semibold text-rosewood">{publicUrl}</p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <Info label="Pessoa criadora" value={page.creator_name || "Não informado"} />
              <Info label="Pessoa presenteada" value={page.recipient_name || "Não informado"} />
              <Info label="Criada em" value={formatDate(page.created_at)} />
              <Info label="Expira em" value={formatDate(page.expires_at)} />
              <Info label="Momentos" value={String(page.moments?.length || 0)} />
              <Info label="Tema" value={page.theme} />
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink href={`/p/${page.slug}`} target="_blank" variant="secondary">
                <ExternalLink className="h-4 w-4" />
                Visualizar página
              </ButtonLink>
              <ButtonLink href={`/dashboard/${page.id}/editar`} variant="secondary">
                <Pencil className="h-4 w-4" />
                Editar página
              </ButtonLink>
            </div>
          </section>

          <PageQrCode slug={page.slug} title={page.title || "Melhores Momentos"} />
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper p-4">
      <dt className="text-xs font-bold uppercase text-ink/45">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
