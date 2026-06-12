"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSortableTable, type AdminTableRow } from "@/components/admin-sortable-table";
import { Button } from "@/components/button";

export function FunnelSplitControl({ rows }: { rows: AdminTableRow[] }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function createSplit() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/funnel-splits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error || "Nao foi possivel criar o split.");
      return;
    }

    setReason("");
    router.refresh();
  }

  return (
    <section className="grid gap-5 rounded-md border border-ink/10 bg-white p-5 shadow-soft">
      <div>
        <h2 className="text-3xl font-black text-ink">Splits dos funis</h2>
        <p className="mt-2 max-w-3xl text-sm font-bold text-ink/55">
          Use um split quando fizer uma mudanca importante. Ele salva o estado atual dos dois funis e comeca uma nova leitura a partir dali.
        </p>
      </div>

      <div className="rounded-md border border-ink/10 bg-[#fbfbfb] p-4">
        <label className="block text-sm font-black uppercase tracking-[0.14em] text-ink/45" htmlFor="split-reason">
          Motivo do split
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            id="split-reason"
            className="focus-ring min-h-12 rounded-md border border-white/15 bg-white px-4 font-bold text-ink outline-none"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ex: antes da nova pagina de vendas"
            maxLength={160}
          />
          <Button disabled={loading} onClick={createSplit}>
            Criar split
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm font-bold text-red-600">{message}</p> : null}
      </div>

      <div>
        <h3 className="mb-3 text-2xl font-black text-ink">Historico de splits</h3>
        <AdminSortableTable
          headers={["Data", "Motivo", "Visitas", "Comecaram", "Oferta", "Pagaram", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]}
          rows={rows}
        />
      </div>
    </section>
  );
}
