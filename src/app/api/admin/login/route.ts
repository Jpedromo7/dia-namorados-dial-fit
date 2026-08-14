import { NextResponse } from "next/server";
import { getAdminEmails } from "@/lib/admin-auth";
import {
  assertSameOrigin,
  enforceRateLimit,
  jsonError,
  readJsonBody,
} from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const genericMessage =
  "Se este e-mail estiver autorizado, enviaremos um link de acesso.";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "admin-login", 5, 15 * 60_000);

    const payload = (await readJsonBody(request, 1_000)) as {
      email?: unknown;
    } | null;
    const email = normalizeEmail(payload?.email);

    if (!isEmail(email)) {
      return NextResponse.json({ message: genericMessage });
    }

    const supabase = await createSupabaseServerClient();
    const adminEmails = getAdminEmails();

    if (!supabase || adminEmails.length === 0) {
      return NextResponse.json(
        { message: "Login administrativo não configurado." },
        { status: 503 },
      );
    }

    if (!adminEmails.includes(email)) {
      return NextResponse.json({ message: genericMessage });
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback?next=/admin`,
      },
    });

    if (error) {
      if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        return NextResponse.json(
          {
            message:
              "O limite de e-mails foi atingido. Use o link mais recente da sua caixa de entrada ou tente novamente em 1 hora.",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { message: "Não foi possível enviar o acesso agora." },
        { status: 502 },
      );
    }

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    return jsonError(error);
  }
}
