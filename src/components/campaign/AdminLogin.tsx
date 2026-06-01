"use client";

import { LogIn, Mail, Send } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGoogleOpening, setIsGoogleOpening] = useState(false);

  async function signInWithGoogle() {
    setMessage("");
    setError("");
    setIsGoogleOpening(true);

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setIsGoogleOpening(false);
      setError("Login com Google não configurado.");
      return;
    }

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/admin")}`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (googleError) {
      setIsGoogleOpening(false);
      setError(
        "Não foi possível abrir o login com Google. Confira o provedor no Supabase.",
      );
    }
  }

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    setIsSending(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    setIsSending(false);

    if (!response.ok) {
      setError(data?.message ?? "Não foi possível enviar o acesso agora.");
      return;
    }

    setMessage(
      data?.message ??
        "Se este e-mail estiver autorizado, enviaremos um link de acesso.",
    );
  }

  return (
    <div className="mx-auto grid max-w-sm gap-4 text-left">
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isGoogleOpening}
        className="campaign-button inline-flex h-12 items-center justify-center gap-2 bg-white px-6 text-sm font-semibold text-[#3b111c] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogIn size={18} aria-hidden="true" />
        {isGoogleOpening ? "Abrindo Google..." : "Entrar com Google"}
      </button>

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7078]">
        <span className="h-px flex-1 bg-[#ead0d6]" />
        ou
        <span className="h-px flex-1 bg-[#ead0d6]" />
      </div>

      <form onSubmit={sendMagicLink} className="grid gap-3">
        <label className="grid gap-2 text-sm font-semibold text-[#4e3039]">
          E-mail autorizado
          <span className="relative">
            <Mail
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a4213d]"
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seuemail@exemplo.com"
              required
              className="campaign-field h-12 w-full pl-11 pr-4 text-sm font-medium"
            />
          </span>
        </label>

        <button
          type="submit"
          disabled={isSending}
          className="campaign-button inline-flex h-12 items-center justify-center gap-2 bg-[#0e8b4a] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={18} aria-hidden="true" />
          {isSending ? "Enviando acesso..." : "Enviar link de acesso"}
        </button>
      </form>

      {message ? (
        <p className="campaign-frame-soft bg-[#effaf3] px-4 py-3 text-center text-sm font-semibold text-[#0e8b4a]">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="campaign-frame-soft bg-[#fff0f3] px-4 py-3 text-center text-sm font-semibold text-[#a4213d]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
