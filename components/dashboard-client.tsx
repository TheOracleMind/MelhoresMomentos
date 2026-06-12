"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Pencil, QrCode, RotateCcw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button, ButtonLink } from "@/components/button";
import { formatPrice, renewalPlans } from "@/lib/plans";
import type { DbLovePage, PaymentType } from "@/lib/types";
import { formatDate, getPublicPageUrl, isExpired } from "@/lib/utils";

export function DashboardClient({ pages }: { pages: DbLovePage[] }) {
  const [busy, setBusy] = useState("");

  async function copyLink(slug: string) {
    await navigator.clipboard.writeText(getPublicPageUrl(slug));
  }

  async function renew(pageId: string, paymentType: PaymentType) {
    setBusy(`${pageId}-${paymentType}`);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lovePageId: pageId, paymentType })
    });
    const payload = await response.json();
    setBusy("");
    if (payload.url) window.location.href = payload.url;
    else alert(payload.error || "Não foi possível iniciar a renovação.");
  }

  return (
    <div className="grid gap-4">
      {pages.map((page) => {
        const expired = page.status === "expired" || isExpired(page.expires_at);
        const publicUrl = getPublicPageUrl(page.slug);

        return (
          <article key={page.id} className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold">{page.title || "Nossos melhores momentos"}</h2>
                  <span className="rounded-full bg-petal px-3 py-1 text-xs font-bold text-rosewood">
                    {expired ? "Expirada" : page.status === "active" ? "Ativa" : page.status === "pending_payment" ? "Pagamento pendente" : "Rascunho"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink/60">Criada em {formatDate(page.created_at)} · Expira em {formatDate(page.expires_at)}</p>
                <Link className="mt-3 inline-flex break-all text-sm font-semibold text-rosewood" href={`/p/${page.slug}`} target="_blank">
                  {publicUrl}
                </Link>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" onClick={() => copyLink(page.slug)}>
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
                <ButtonLink href={`/dashboard/${page.id}`} variant="secondary">
                  <QrCode className="h-4 w-4" />
                  Detalhes
                </ButtonLink>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink href={`/p/${page.slug}`} variant="secondary" target="_blank">
                <ExternalLink className="h-4 w-4" />
                Visualizar
              </ButtonLink>
              <ButtonLink href={`/dashboard/${page.id}/editar`} variant="secondary">
                <Pencil className="h-4 w-4" />
                Editar
              </ButtonLink>
            </div>

            {expired ? (
              <div className="mt-5 rounded-md border border-rosewood/20 bg-petal/40 p-4">
                <p className="font-bold text-rosewood">Renovar página</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {renewalPlans.map((plan) => (
                    <Button key={plan.id} variant="secondary" disabled={busy === `${page.id}-${plan.id}`} onClick={() => renew(page.id, plan.id)}>
                      <RotateCcw className="h-4 w-4" />
                      {plan.label} · {formatPrice(plan.price)}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export function PageQrCode({ slug, title }: { slug: string; title: string }) {
  const publicUrl = getPublicPageUrl(slug);
  const elementId = `qr-${slug}`;

  function downloadQrCode() {
    const svg = document.getElementById(elementId);
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-qr-code.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
      <p className="font-bold">QR Code</p>
      <div className="mt-4 inline-block rounded-md bg-white p-3">
        <QRCodeSVG id={elementId} value={publicUrl} title={title} size={180} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => navigator.clipboard.writeText(publicUrl)}>
          <Copy className="h-4 w-4" />
          Copiar link
        </Button>
        <Button onClick={downloadQrCode}>Baixar QR Code</Button>
      </div>
    </div>
  );
}
