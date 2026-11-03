"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle, LockKeyhole, MailCheck, ShieldCheck, UserRoundPlus } from "lucide-react";
import { neonAuthClient } from "@/lib/neon/auth-client";

type View = "sign-in" | "sign-up" | "verify" | "recover";
type VerificationPurpose = "email-verification" | "forget-password";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function messageFromAuthError(error: unknown) {
  if (!error || typeof error !== "object" || !("message" in error)) return "";
  return typeof error.message === "string" ? error.message.toLowerCase() : "";
}

export function AdminLogin() {
  const router = useRouter();
  const [view, setView] = useState<View>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationPassword, setVerificationPassword] = useState("");
  const [verificationPurpose, setVerificationPurpose] = useState<VerificationPurpose>("email-verification");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function goToPanel() {
    router.replace("/auth/callback?next=%2Fadmin%2Fblack-friday");
  }

  async function requestCode(targetEmail: string, purpose: VerificationPurpose, existingPassword = "") {
    const normalizedEmail = normalizeEmail(targetEmail);
    setError("");
    setNotice("");
    setPending(true);
    setVerificationEmail(normalizedEmail);
    setVerificationPassword(existingPassword);
    setVerificationPurpose(purpose);
    setCode("");
    setView("verify");

    try {
      const result = await neonAuthClient.emailOtp.sendVerificationOtp({ email: normalizedEmail, type: purpose });
      if (result.error) {
        setError("Não foi possível enviar o código agora. Confira o e-mail e tente novamente.");
        return false;
      }
      setNotice(`Enviamos um código de 6 dígitos para ${normalizedEmail}.`);
      return true;
    } catch {
      setError("Não foi possível enviar o código agora. Confira o e-mail e tente novamente.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    const normalizedEmail = normalizeEmail(email);

    try {
      const result = await neonAuthClient.signIn.email({ email: normalizedEmail, password });
      if (result.error) {
        const authMessage = messageFromAuthError(result.error);
        if (authMessage.includes("not verified") || authMessage.includes("not_verified") || authMessage.includes("email_not_verified")) {
          setPending(false);
          await requestCode(normalizedEmail, "email-verification", password);
          return;
        }
        setError("E-mail ou senha inválidos. Se você ainda não tem acesso, crie uma conta com o e-mail liberado pela administração.");
        return;
      }

      const sessionResult = await neonAuthClient.getSession();
      const user = sessionResult.data?.user;
      if (user && !user.emailVerified) {
        setPending(false);
        await requestCode(normalizedEmail, "email-verification", password);
        return;
      }
      goToPanel();
    } catch {
      setError("Não foi possível entrar. Confira sua conexão e tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password !== passwordConfirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    setPending(true);
    const normalizedEmail = normalizeEmail(email);
    try {
      const result = await neonAuthClient.signUp.email({ name: name.trim(), email: normalizedEmail, password });
      if (result.error) {
        const authMessage = messageFromAuthError(result.error);
        setError(authMessage.includes("already") || authMessage.includes("exist")
          ? "Já existe uma conta com esse e-mail. Entre ou use a opção “Esqueci minha senha”."
          : "Não foi possível criar a conta. Confira os dados e tente novamente.");
        return;
      }
      setPending(false);
      const sent = await requestCode(normalizedEmail, "email-verification", password);
      if (sent) setNotice(`Conta criada. Enviamos um código de confirmação para ${normalizedEmail}.`);
    } catch {
      setError("Não foi possível criar a conta agora. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function recoverAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestCode(email, "forget-password");
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    try {
      if (verificationPurpose === "forget-password") {
        const result = await neonAuthClient.emailOtp.resetPassword({
          email: verificationEmail,
          otp: code.trim(),
          password: newPassword,
        });
        if (result.error) {
          setError("Código inválido ou expirado. Confira o código ou solicite outro.");
          return;
        }
        setPassword("");
        setNewPassword("");
        setView("sign-in");
        setNotice("Senha atualizada. Entre com seu e-mail e a nova senha.");
        return;
      }

      const verification = await neonAuthClient.emailOtp.verifyEmail({ email: verificationEmail, otp: code.trim() });
      if (verification.error) {
        setError("Código inválido ou expirado. Confira o código ou solicite outro.");
        return;
      }

      const signInResult = await neonAuthClient.signIn.email({
        email: verificationEmail,
        password: verificationPassword,
      });
      if (signInResult.error) {
        setView("sign-in");
        setEmail(verificationEmail);
        setError("E-mail confirmado. Entre com sua senha para continuar.");
        return;
      }
      goToPanel();
    } catch {
      setError("Não foi possível concluir a confirmação. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  function changeView(nextView: View) {
    setError("");
    setNotice("");
    setView(nextView);
  }

  const isVerification = view === "verify";
  const isRecovery = view === "recover" || (isVerification && verificationPurpose === "forget-password");

  return <div className="mx-auto grid max-w-sm gap-4 text-left">
    {isVerification ? (
      <form onSubmit={verifyCode} className="grid gap-4" aria-labelledby="staff-verify-title">
        <div className="campaign-frame-soft p-4 text-center">
          <MailCheck size={25} className="mx-auto text-[#55e814]" aria-hidden="true" />
          <h2 id="staff-verify-title" className="mt-3 text-lg font-extrabold text-white">{isRecovery ? "Redefinir senha" : "Confirme seu e-mail"}</h2>
          <p className="mt-2 text-sm leading-6 text-[#a8b2aa]">Enviamos um código para <strong className="break-all text-white">{verificationEmail}</strong>. {isRecovery ? "Informe o código e escolha uma nova senha." : "Depois da confirmação, o acesso será validado pela equipe autorizada."}</p>
        </div>
        <label className="grid gap-1.5 text-xs font-bold text-[#c1cbc1]" htmlFor="staff-code">Código de 6 dígitos
          <input id="staff-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required className="h-12 rounded-lg border border-white/15 bg-[#0a0d0a] px-4 text-center font-mono text-xl tracking-[.45em] text-white outline-none focus:border-[#55e814]" />
        </label>
        {isRecovery && <label className="grid gap-1.5 text-xs font-bold text-[#c1cbc1]" htmlFor="staff-new-password">Nova senha
          <input id="staff-new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required className="h-12 rounded-lg border border-white/15 bg-[#0a0d0a] px-4 text-sm text-white outline-none focus:border-[#55e814]" />
        </label>}
        {error && <p role="alert" className="campaign-frame-soft border-[#ff7d7d]/30 bg-[#ff7d7d]/8 px-4 py-3 text-center text-sm font-semibold text-[#ff9c9c]">{error}</p>}
        {notice && <p role="status" className="text-center text-sm leading-6 text-[#b9d9ae]">{notice}</p>}
        <button type="submit" disabled={pending} className="campaign-button inline-flex h-12 items-center justify-center gap-2 bg-[#55e814] px-6 text-sm font-extrabold text-[#071006] disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
          {pending ? "Aguarde…" : isRecovery ? "ATUALIZAR SENHA" : "CONFIRMAR E-MAIL"}
        </button>
        <button type="button" onClick={() => void requestCode(verificationEmail, verificationPurpose, verificationPassword)} disabled={pending} className="mx-auto min-h-10 px-3 text-sm font-semibold text-[#a8b2aa] underline decoration-white/20 underline-offset-4 hover:text-white disabled:opacity-50">Reenviar código</button>
        <button type="button" onClick={() => changeView("sign-in")} className="mx-auto inline-flex min-h-10 items-center gap-2 px-3 text-sm font-semibold text-[#74f23d]"><ArrowLeft size={15} aria-hidden="true" /> Voltar ao acesso</button>
      </form>
    ) : view === "recover" ? (
      <form onSubmit={recoverAccess} className="grid gap-4" aria-labelledby="staff-recover-title">
        <div><h2 id="staff-recover-title" className="text-lg font-extrabold text-white">Recuperar acesso</h2><p className="mt-1 text-sm leading-6 text-[#a8b2aa]">Enviaremos um código para redefinir a senha deste e-mail.</p></div>
        <label className="grid gap-1.5 text-xs font-bold text-[#c1cbc1]" htmlFor="staff-recovery-email">E-mail
          <input id="staff-recovery-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required className="h-12 rounded-lg border border-white/15 bg-[#0a0d0a] px-4 text-sm text-white outline-none focus:border-[#55e814]" />
        </label>
        {error && <p role="alert" className="campaign-frame-soft border-[#ff7d7d]/30 bg-[#ff7d7d]/8 px-4 py-3 text-center text-sm font-semibold text-[#ff9c9c]">{error}</p>}
        {notice && <p role="status" className="text-center text-sm leading-6 text-[#b9d9ae]">{notice}</p>}
        <button type="submit" disabled={pending} className="campaign-button inline-flex h-12 items-center justify-center gap-2 bg-[#55e814] px-6 text-sm font-extrabold text-[#071006] disabled:opacity-60">{pending ? <LoaderCircle size={17} className="animate-spin" /> : <MailCheck size={17} />}{pending ? "Enviando…" : "ENVIAR CÓDIGO"}</button>
        <button type="button" onClick={() => changeView("sign-in")} className="mx-auto inline-flex min-h-10 items-center gap-2 px-3 text-sm font-semibold text-[#74f23d]"><ArrowLeft size={15} aria-hidden="true" /> Voltar ao acesso</button>
      </form>
    ) : (
      <>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/25 p-1" role="tablist" aria-label="Acesso da equipe">
          <button type="button" role="tab" aria-selected={view === "sign-in"} onClick={() => changeView("sign-in")} className={`min-h-11 rounded-lg px-3 text-sm font-bold transition-colors ${view === "sign-in" ? "bg-[#55e814] text-[#071006]" : "text-[#a8b2aa] hover:text-white"}`}>Entrar</button>
          <button type="button" role="tab" aria-selected={view === "sign-up"} onClick={() => changeView("sign-up")} className={`min-h-11 rounded-lg px-3 text-sm font-bold transition-colors ${view === "sign-up" ? "bg-[#55e814] text-[#071006]" : "text-[#a8b2aa] hover:text-white"}`}><span className="inline-flex items-center gap-1.5"><UserRoundPlus size={15} aria-hidden="true" /> Criar acesso</span></button>
        </div>

        <form onSubmit={view === "sign-in" ? signIn : signUp} className="grid gap-3.5" aria-label={view === "sign-in" ? "Entrar no painel" : "Criar acesso da equipe"}>
          {view === "sign-up" && <label className="grid gap-1.5 text-xs font-bold text-[#c1cbc1]" htmlFor="staff-name">Nome completo
            <input id="staff-name" type="text" autoComplete="name" minLength={3} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} required className="h-12 rounded-lg border border-white/15 bg-[#0a0d0a] px-4 text-sm text-white outline-none focus:border-[#55e814]" />
          </label>}
          <label className="grid gap-1.5 text-xs font-bold text-[#c1cbc1]" htmlFor="staff-email">E-mail
            <input id="staff-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required className="h-12 rounded-lg border border-white/15 bg-[#0a0d0a] px-4 text-sm text-white outline-none focus:border-[#55e814]" />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-[#c1cbc1]" htmlFor="staff-password">Senha
            <input id="staff-password" type="password" autoComplete={view === "sign-in" ? "current-password" : "new-password"} minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12 rounded-lg border border-white/15 bg-[#0a0d0a] px-4 text-sm text-white outline-none focus:border-[#55e814]" />
          </label>
          {view === "sign-up" && <label className="grid gap-1.5 text-xs font-bold text-[#c1cbc1]" htmlFor="staff-password-confirmation">Confirme a senha
            <input id="staff-password-confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} required className="h-12 rounded-lg border border-white/15 bg-[#0a0d0a] px-4 text-sm text-white outline-none focus:border-[#55e814]" />
          </label>}
          {view === "sign-up" && <p className="campaign-frame-soft flex gap-2.5 p-3 text-xs leading-5 text-[#b4c0b1]"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#55e814]" aria-hidden="true" />O cadastro só cria a conta. Para proteger os dados dos clientes, a administração precisa liberar este e-mail antes do acesso ao painel.</p>}
          {error && <p role="alert" className="campaign-frame-soft border-[#ff7d7d]/30 bg-[#ff7d7d]/8 px-4 py-3 text-center text-sm font-semibold leading-5 text-[#ff9c9c]">{error}</p>}
          {notice && <p role="status" className="text-center text-sm leading-6 text-[#b9d9ae]">{notice}</p>}
          <button type="submit" disabled={pending} className="campaign-button mt-1 inline-flex h-12 items-center justify-center gap-2 bg-[#55e814] px-6 text-sm font-extrabold text-[#071006] disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : view === "sign-in" ? <LockKeyhole size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
            {pending ? "Aguarde…" : view === "sign-in" ? "ENTRAR NO PAINEL" : "CRIAR CONTA E CONFIRMAR E-MAIL"}
          </button>
          {view === "sign-in" && <button type="button" onClick={() => changeView("recover")} className="mx-auto min-h-10 px-3 text-sm font-semibold text-[#a8b2aa] underline decoration-white/20 underline-offset-4 hover:text-white">Esqueci minha senha</button>}
        </form>
      </>
    )}
  </div>;
}
