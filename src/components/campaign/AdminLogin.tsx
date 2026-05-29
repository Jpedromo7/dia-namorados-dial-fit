"use client";

import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setError("Supabase ainda nao esta configurado para login.");
      return;
    }

    setIsSending(true);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });

    setIsSending(false);

    if (signInError) {
      setError("Nao foi possivel enviar o acesso. Confira o e-mail e tente novamente.");
      return;
    }

    setMessage("Enviamos um link de acesso para o e-mail autorizado.");
  }

  return (
    <form onSubmit={sendMagicLink} className="mx-auto grid max-w-sm gap-3 text-left">
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
            className="h-12 w-full rounded-full border border-[#ead0d6] bg-white/90 pl-11 pr-4 text-sm font-medium text-[#3b111c] outline-none transition focus:border-[#0e8b4a] focus:ring-4 focus:ring-[#0e8b4a]/10"
          />
        </span>
      </label>

      <button
        type="submit"
        disabled={isSending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0e8b4a] px-6 text-sm font-semibold text-white shadow-xl shadow-[#0e8b4a]/18 transition hover:-translate-y-0.5 hover:bg-[#0b723e] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send size={18} aria-hidden="true" />
        {isSending ? "Enviando acesso..." : "Enviar link de acesso"}
      </button>

      {message ? (
        <p className="rounded-2xl border border-[#0e8b4a]/20 bg-[#effaf3] px-4 py-3 text-center text-sm font-semibold text-[#0e8b4a]">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-[#f1c0cc] bg-[#fff0f3] px-4 py-3 text-center text-sm font-semibold text-[#a4213d]">
          {error}
        </p>
      ) : null}
    </form>
  );
}
