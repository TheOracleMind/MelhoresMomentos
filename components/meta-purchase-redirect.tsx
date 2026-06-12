"use client";

import { useEffect } from "react";
import { trackMetaPixelEvent } from "@/lib/meta-pixel";

export function MetaPurchaseRedirect({
  redirectTo,
  amount,
  currency,
  lovePageId,
  paymentType,
  sessionId
}: {
  redirectTo: string;
  amount: number;
  currency: string;
  lovePageId: string;
  paymentType: string;
  sessionId: string;
}) {
  useEffect(() => {
    const key = `meta-purchase-${sessionId}`;
    if (!window.sessionStorage.getItem(key)) {
      trackMetaPixelEvent("Purchase", {
        value: amount / 100,
        currency,
        content_ids: [lovePageId],
        content_type: "product",
        content_name: paymentType
      });
      window.sessionStorage.setItem(key, "1");
    }

    const timer = window.setTimeout(() => {
      window.location.href = redirectTo;
    }, 450);

    return () => window.clearTimeout(timer);
  }, [amount, currency, lovePageId, paymentType, redirectTo, sessionId]);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12 text-center">
      <div className="max-w-md rounded-md border border-ink/10 bg-white p-8 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-rosewood">Pagamento confirmado</p>
        <h1 className="mt-2 text-3xl font-black">Preparando seu acesso...</h1>
        <p className="mt-3 leading-7 text-ink/65">Estamos finalizando a confirmação e te levando para o próximo passo.</p>
      </div>
    </main>
  );
}
