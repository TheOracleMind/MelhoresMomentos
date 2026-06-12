"use client";

import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import { Button } from "@/components/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function CreateAccountForm({ sessionId }: { sessionId: string }) {
  const supabase = createSupabaseBrowserClient();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/checkout/create-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, password })
    });
    const payload = await response.json();

    if (!response.ok) {
      setLoading(false);
      setMessage(payload.error || "Não foi possível criar sua conta.");
      setNeedsLogin(Boolean(payload.needsLogin));
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password
    });

    setLoading(false);
    if (error) {
      setMessage("Conta criada. Entre com seu email e senha para acessar o dashboard.");
      return;
    }

    window.localStorage.removeItem("melhores-momentos-draft");
    window.location.href = `/dashboard/${payload.lovePageId}?checkout=success`;
  }

  return (
    <div className="mx-auto max-w-md rounded-md border border-ink/10 bg-white p-6 shadow-soft">
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-petal text-rosewood">
        <Mail className="h-6 w-6" />
      </div>
      <h1 className="text-3xl font-bold">Crie sua senha</h1>
      <p className="mt-3 leading-7 text-ink/65">
        O pagamento foi confirmado. Agora crie uma senha para acessar o dashboard, editar a página e baixar o QR Code.
      </p>

      <label className="mt-6 block text-sm font-bold" htmlFor="password">Senha</label>
      <div className="mt-2 flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3">
        <Lock className="h-4 w-4 text-ink/45" />
        <input
          id="password"
          className="focus-ring min-h-12 flex-1 border-0 bg-transparent outline-none"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={6}
        />
      </div>

      {message ? <p className="mt-4 rounded-md bg-petal/55 p-3 text-sm font-semibold text-rosewood">{message}</p> : null}

      {needsLogin ? (
        <Button
          className="mt-6 w-full"
          onClick={() => {
            window.location.href = `/login?redirectTo=${encodeURIComponent(`/checkout/success?session_id=${sessionId}`)}`;
          }}
        >
          Entrar e assumir página
        </Button>
      ) : (
        <Button className="mt-6 w-full" disabled={loading || password.length < 6} onClick={submit}>
          {loading ? "Criando..." : "Acessar minha página"}
        </Button>
      )}
    </div>
  );
}
