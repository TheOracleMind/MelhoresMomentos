"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { AdminSortableTable, type AdminTableRow } from "@/components/admin-sortable-table";

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
      setMessage(payload.error || "Não foi possível criar o split.");
      return;
    }

    setReason("");
    router.refresh();
  }

  return (
    <div className="mt-6 grid gap-5">
      <div className="rounded-md border border-white/10 bg-white/8 p-4">
        <label className="block text-sm font-black uppercase tracking-[0.14em] text-white/60" htmlFor="split-reason">
          Motivo do split
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            id="split-reason"
            className="focus-ring min-h-12 rounded-md border border-white/15 bg-white px-4 font-bold text-ink outline-none"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ex: antes da nova página de vendas"
            maxLength={160}
          />
          <Button disabled={loading} onClick={createSplit}>
            Criar split
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm font-bold text-red-200">{message}</p> : null}
      </div>

      <div>
        <h3 className="mb-3 text-2xl font-black text-white">Histórico de splits</h3>
        <AdminSortableTable
          headers={["Data", "Motivo", "Visitas", "Começaram", "Oferta", "Pagaram"]}
          rows={rows}
        />
      </div>
    </div>
  );
}
