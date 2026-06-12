"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminSetupForm() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createAdmin() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const payload = await response.json();

    if (!response.ok) {
      setLoading(false);
      setMessage(payload.error || "Não foi possível criar o administrador.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage("Administrador criado. Faça login para continuar.");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <div className="mx-auto max-w-md rounded-md border border-ink/10 bg-white p-6 shadow-soft">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-rosewood">Primeiro acesso</p>
      <h1 className="mt-2 text-3xl font-black">Criar administrador</h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-ink/65">
        Essa tela só funciona enquanto nenhum administrador existe. Depois da criação, nenhuma outra conta admin poderá ser criada por aqui.
      </p>

      <label className="mt-6 block text-sm font-bold" htmlFor="admin-email">Email</label>
      <input
        id="admin-email"
        className="focus-ring mt-2 min-h-12 w-full rounded-md border border-ink/10 px-3 font-semibold outline-none"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
      />

      <label className="mt-4 block text-sm font-bold" htmlFor="admin-password">Senha</label>
      <input
        id="admin-password"
        className="focus-ring mt-2 min-h-12 w-full rounded-md border border-ink/10 px-3 font-semibold outline-none"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="new-password"
        minLength={8}
      />

      {message ? <p className="mt-4 rounded-md bg-petal/60 p-3 text-sm font-bold text-rosewood">{message}</p> : null}

      <Button className="mt-6 w-full" disabled={loading || !email || password.length < 8} onClick={createAdmin}>
        Criar conta admin
      </Button>
    </div>
  );
}
