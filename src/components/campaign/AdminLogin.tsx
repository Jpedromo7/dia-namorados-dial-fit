"use client";

import { LogIn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLogin() {
  async function signInWithGoogle() {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0e8b4a] px-6 text-sm font-semibold text-white shadow-xl shadow-[#0e8b4a]/18 transition hover:-translate-y-0.5 hover:bg-[#0b723e]"
    >
      <LogIn size={18} aria-hidden="true" />
      Entrar com Google
    </button>
  );
}
