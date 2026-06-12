"use client";

import { useState } from "react";
import { Mail, Lock, Wand2 } from "lucide-react";
import { Button } from "@/components/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ redirectTo = "/create", compact = false }: { redirectTo?: string; compact?: boolean }) {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithPassword(mode: "signin" | "signup") {
    setLoading(true);
    setMessage("");
    const callbackUrl = `${window.location.origin}${redirectTo}`;
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callbackUrl } })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    window.location.href = redirectTo;
  }

  async function sendMagicLink() {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${redirectTo}` }
    });
    setLoading(false);
    setMessage(error ? error.message : "Enviamos um link de acesso para seu email.");
  }

  return (
    <div className={compact ? "" : "mx-auto max-w-md rounded-md border border-ink/10 bg-white p-6 shadow-soft"}>
      <h1 className={compact ? "text-2xl font-bold" : "text-3xl font-bold"}>Acesse sua conta</h1>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        Use uma conta para proteger seus dados, imagens e páginas criadas.
      </p>

      <label className="mt-6 block text-sm font-semibold" htmlFor="email">Email</label>
      <div className="mt-2 flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3">
        <Mail className="h-4 w-4 text-ink/45" />
        <input
          id="email"
          className="focus-ring min-h-11 flex-1 border-0 bg-transparent outline-none"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <label className="mt-4 block text-sm font-semibold" htmlFor="password">Senha</label>
      <div className="mt-2 flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3">
        <Lock className="h-4 w-4 text-ink/45" />
        <input
          id="password"
          className="focus-ring min-h-11 flex-1 border-0 bg-transparent outline-none"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          minLength={6}
        />
      </div>

      {message ? <p className="mt-4 rounded-md bg-petal/55 p-3 text-sm text-rosewood">{message}</p> : null}

      <div className="mt-6 grid gap-3">
        <Button disabled={loading || !email || !password} onClick={() => signInWithPassword("signin")}>
          Entrar
        </Button>
        <Button variant="secondary" disabled={loading || !email || password.length < 6} onClick={() => signInWithPassword("signup")}>
          Criar conta
        </Button>
        <Button variant="ghost" disabled={loading || !email} onClick={sendMagicLink}>
          <Wand2 className="h-4 w-4" />
          Enviar magic link
        </Button>
      </div>
    </div>
  );
}
