"use client";

import { LogIn } from "lucide-react";
import { useState } from "react";
import { neonAuthClient } from "@/lib/neon/auth-client";

export function AdminLogin() {
  const [error, setError] = useState("");
  const [isGoogleOpening, setIsGoogleOpening] = useState(false);

  async function signInWithGoogle() {
    setError("");
    setIsGoogleOpening(true);
    try {
      await neonAuthClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/admin/black-friday")}`,
        scopes: ["openid", "email", "profile"],
      });
    } catch {
      setIsGoogleOpening(false);
      setError("Não foi possível abrir o login com Google. Confira a configuração do provedor.");
    }
  }

  return <div className="mx-auto grid max-w-sm gap-4 text-left">
    <button type="button" onClick={signInWithGoogle} disabled={isGoogleOpening} className="campaign-button inline-flex h-12 items-center justify-center gap-2 bg-white px-6 text-sm font-semibold text-[#071006] disabled:cursor-not-allowed disabled:opacity-60">
      <LogIn size={18} aria-hidden="true" />{isGoogleOpening ? "Abrindo Google…" : "Entrar com Google"}
    </button>
    {error && <p role="alert" className="campaign-frame-soft border-[#ff7d7d]/30 bg-[#ff7d7d]/8 px-4 py-3 text-center text-sm font-semibold text-[#ff9c9c]">{error}</p>}
  </div>;
}
