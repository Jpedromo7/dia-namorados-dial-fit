"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, CheckCircle2, Share2 } from "lucide-react";
import { DIALFIT_LOGO } from "@/config/campaign";
import { formatBrazilianPhone, normalizeBrazilianPhone } from "@/lib/black-friday";
import {
  CampaignReveal,
  OriginalCallInterface,
  type CallPhase,
} from "./CallExperience";

type UTM = { source: string; medium: string; campaign: string };
type Stage = CallPhase | "reveal" | "form" | "success";
type SoundEffect = "connected" | "ended" | "reveal";

function stopAudio(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.pause();
  try { audio.currentTime = 0; } catch { /* Metadata may not have loaded yet. */ }
}

function playCallEffect(contextRef: { current: AudioContext | null }, enabledRef: { current: boolean }, effect: SoundEffect) {
  if (!enabledRef.current) return;
  const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const context = contextRef.current ?? new AudioContextClass();
    contextRef.current = context;
    if (context.state === "suspended") void context.resume().catch(() => undefined);
    const notes = {
      connected: [{ frequency: 660, offset: 0, duration: 0.12 }, { frequency: 880, offset: 0.13, duration: 0.13 }],
      ended: [{ frequency: 392, offset: 0, duration: 0.18 }],
      reveal: [{ frequency: 523, offset: 0, duration: 0.22 }, { frequency: 659, offset: 0.04, duration: 0.24 }, { frequency: 784, offset: 0.08, duration: 0.26 }],
    }[effect];
    const now = context.currentTime;

    notes.forEach(({ frequency, offset, duration }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + offset;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.035, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start);
      oscillator.stop(start + duration + 0.01);
    });
  } catch {
    // Audio is optional; browser restrictions must never block the visual flow.
  }
}

function closeCallAudio(contextRef: { current: AudioContext | null }) {
  const context = contextRef.current;
  contextRef.current = null;
  if (context && context.state !== "closed") void context.close().catch(() => undefined);
}

export function PublicExperience() {
  const [stage, setStage] = useState<Stage>("incoming");
  const [elapsed, setElapsed] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [soundPending, setSoundPending] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [contactTime, setContactTime] = useState("");
  const [utm] = useState<UTM>(() => {
    if (typeof window === "undefined") return { source: "", medium: "", campaign: "" };
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get("utm_source") ?? "",
      medium: params.get("utm_medium") ?? "",
      campaign: params.get("utm_campaign") ?? "",
    };
  });
  const [startedAt] = useState(() => Date.now());
  const callStartedAt = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneAttemptRef = useRef(0);
  const soundPendingRef = useRef(false);
  const callAcceptedRef = useRef(false);
  const soundEnabledRef = useRef(false);

  function stopIncomingRingtone() {
    ringtoneAttemptRef.current += 1;
    soundPendingRef.current = false;
    setSoundPending(false);
    stopAudio(ringtoneRef.current);
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const ringtone = new Audio("/audio/dialfit-incoming-call.mp3");
    ringtone.preload = "auto";
    ringtone.loop = true;
    ringtone.volume = 0.64;
    ringtoneRef.current = ringtone;

    const pauseAllSound = () => {
      ringtoneAttemptRef.current += 1;
      soundPendingRef.current = false;
      stopAudio(ringtoneRef.current);
      soundEnabledRef.current = false;
      setSoundEnabled(false);
      setSoundPending(false);
      setSoundBlocked(false);
      closeCallAudio(audioContextRef);
    };

    const pauseForBackground = () => {
      if (document.hidden) pauseAllSound();
    };

    document.addEventListener("visibilitychange", pauseForBackground);
    window.addEventListener("pagehide", pauseAllSound);
    return () => {
      document.removeEventListener("visibilitychange", pauseForBackground);
      window.removeEventListener("pagehide", pauseAllSound);
      stopAudio(ringtoneRef.current);
      ringtoneRef.current = null;
      closeCallAudio(audioContextRef);
    };
  }, []);

  useEffect(() => {
    if (stage !== "connected" && stage !== "message") return;
    const messageAt = reducedMotion ? 180 : 520;
    const endAt = reducedMotion ? 1_500 : 2_650;
    const interval = window.setInterval(() => {
      const elapsedMs = Math.max(0, Date.now() - callStartedAt.current);
      setElapsed(Math.floor(elapsedMs / 1000));
      if (elapsedMs >= endAt) {
        setStage("ended");
        playCallEffect(audioContextRef, soundEnabledRef, "ended");
      } else if (stage === "connected" && elapsedMs >= messageAt) {
        setStage("message");
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [stage, reducedMotion]);

  useEffect(() => {
    if (stage !== "ended") return;
    const timeout = window.setTimeout(() => setStage("reveal"), reducedMotion ? 280 : 570);
    return () => window.clearTimeout(timeout);
  }, [stage, reducedMotion]);

  useEffect(() => {
    if (stage !== "reveal") return;
    playCallEffect(audioContextRef, soundEnabledRef, "reveal");
    const timeout = window.setTimeout(() => closeCallAudio(audioContextRef), 800);
    return () => {
      window.clearTimeout(timeout);
      closeCallAudio(audioContextRef);
    };
  }, [stage]);

  useEffect(() => {
    if (stage === "form") {
      document.getElementById("pre-list-name")?.focus({ preventScroll: true });
    }
  }, [stage]);

  function answerCall() {
    if (stage !== "incoming" || callAcceptedRef.current) return;
    callAcceptedRef.current = true;
    stopIncomingRingtone();
    setSoundBlocked(false);
    callStartedAt.current = Date.now();
    setStage("connected");
    setElapsed(0);
    playCallEffect(audioContextRef, soundEnabledRef, "connected");
  }

  function finishCall() {
    if (stage !== "connected" && stage !== "message") return;
    stopIncomingRingtone();
    setStage("ended");
    playCallEffect(audioContextRef, soundEnabledRef, "ended");
  }

  function skipToReveal() {
    stopIncomingRingtone();
    soundEnabledRef.current = false;
    setSoundEnabled(false);
    setSoundBlocked(false);
    closeCallAudio(audioContextRef);
    setStage("reveal");
  }

  async function toggleSound() {
    if (soundEnabledRef.current) {
      soundEnabledRef.current = false;
      setSoundEnabled(false);
      setSoundBlocked(false);
      stopIncomingRingtone();
      closeCallAudio(audioContextRef);
      return;
    }

    if (stage === "incoming") {
      if (soundPendingRef.current) return;
      const ringtone = ringtoneRef.current;
      if (!ringtone) {
        setSoundBlocked(true);
        return;
      }

      const attempt = ++ringtoneAttemptRef.current;
      soundPendingRef.current = true;
      setSoundPending(true);
      setSoundBlocked(false);
      try {
        await ringtone.play();
        if (attempt !== ringtoneAttemptRef.current || stage !== "incoming" || document.hidden) {
          stopAudio(ringtone);
          return;
        }
        soundEnabledRef.current = true;
        setSoundEnabled(true);
      } catch {
        if (attempt === ringtoneAttemptRef.current) {
          soundEnabledRef.current = false;
          setSoundEnabled(false);
          setSoundBlocked(true);
        }
      } finally {
        if (attempt === ringtoneAttemptRef.current) {
          soundPendingRef.current = false;
          setSoundPending(false);
        }
      }
      return;
    }

    soundEnabledRef.current = true;
    setSoundEnabled(true);
    setSoundBlocked(false);
  }

  function replayCall() {
    stopIncomingRingtone();
    soundEnabledRef.current = false;
    setSoundEnabled(false);
    setSoundBlocked(false);
    callAcceptedRef.current = false;
    setStage("incoming");
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      phone,
      preferredContactTime: contactTime || null,
      consent: form.get("consent") === "on",
      website: String(form.get("website") ?? ""),
      startedAt,
      utmSource: utm.source,
      utmMedium: utm.medium,
      utmCampaign: utm.campaign,
    };

    if (!normalizeBrazilianPhone(phone)) {
      setError("Informe um WhatsApp válido com DDD.");
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/black-friday/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setError(data?.message ?? "Não foi possível enviar seus dados agora. Tente novamente.");
        return;
      }
      setStage("success");
    } catch {
      setError("Sem conexão no momento. Confira sua internet e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function shareCampaign() {
    const url = window.location.origin;
    setShareMessage("");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Black Friday de Arrepiar | Dial Fit", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMessage("Link copiado. Compartilhe com quem vai gostar da novidade.");
    } catch {
      setShareMessage("Não foi possível compartilhar agora. Copie o endereço do site.");
    }
  }

  const callPhase = (["incoming", "connected", "message", "ended"] as CallPhase[]).includes(stage as CallPhase)
    ? stage as CallPhase
    : null;

  return (
    <main className={`bf-public bf-stage-${stage}`}>
      <div className="bf-atmosphere" aria-hidden="true" />
      <div className="bf-grain" aria-hidden="true" />

      <header className="bf-header">
        <Link href="/" aria-label="Dial Fit, início">
          <Image src={DIALFIT_LOGO} alt="Dial Fit Academia" width={2048} height={696} priority className="bf-logo" />
        </Link>
        <div className="bf-header-controls">
          <div className="bf-edition"><span className="bf-live-dot" /> BLACK EDITION <span>·</span> 2026</div>
        </div>
      </header>

      {callPhase && (
        <OriginalCallInterface
          phase={callPhase}
          elapsedSeconds={elapsed}
          soundEnabled={soundEnabled}
          soundBlocked={soundBlocked}
          soundPending={soundPending}
          onToggleSound={toggleSound}
          onAnswer={answerCall}
          onEnd={finishCall}
          onSkip={skipToReveal}
        />
      )}

      {stage === "reveal" && <CampaignReveal onContinue={() => setStage("form")} onReplay={replayCall} />}

      {stage === "form" && (
        <section className="bf-form-screen" aria-labelledby="form-title">
          <div className="bf-form-story">
            <p className="bf-eyebrow"><span className="bf-eyebrow-line" /> BLACK FRIDAY DE ARREPIAR</p>
            <h1 id="form-title">SUA CHANCE<br /><span>COMEÇA AQUI.</span></h1>
            <p>Entre na pré-lista e receba as condições da Black Friday de Arrepiar diretamente da equipe Dial Fit.</p>
            <div className="bf-form-note"><span className="bf-note-mark">01</span><span>Sem compromisso de matrícula.<br />Nossa equipe apresenta os detalhes no atendimento.</span></div>
          </div>

          <form className="bf-lead-form" onSubmit={submitLead}>
            <div className="bf-form-heading">
              <span className="bf-section-label">PRÉ-LISTA · 2026</span>
              <h2>Vamos manter contato.</h2>
              <p>Leva menos de um minuto.</p>
            </div>
            <label className="bf-field-label" htmlFor="pre-list-name">Nome completo <span>*</span></label>
            <input className="bf-input" id="pre-list-name" name="name" type="text" autoComplete="name" minLength={3} maxLength={120} placeholder="Como podemos chamar você?" required />

            <label className="bf-field-label" htmlFor="pre-list-phone">WhatsApp <span>*</span></label>
            <div className="bf-phone-input"><span>+55</span><input className="bf-input" id="pre-list-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={(event) => setPhone(formatBrazilianPhone(event.target.value))} placeholder="(00) 00000-0000" maxLength={16} required /></div>

            <label className="bf-field-label" htmlFor="pre-list-time">Melhor horário para contato <span className="bf-optional">OPCIONAL</span></label>
            <select className="bf-input bf-select" id="pre-list-time" name="preferredContactTime" value={contactTime} onChange={(event) => setContactTime(event.target.value)}>
              <option value="">Selecione um horário</option>
              <option value="morning">Manhã</option>
              <option value="afternoon">Tarde</option>
              <option value="evening">Noite</option>
              <option value="anytime">Qualquer horário</option>
            </select>

            <label className="bf-consent">
              <input type="checkbox" name="consent" required />
              <span className="bf-consent-box"><Check size={13} /></span>
              <span>Autorizo a Academia Dial Fit a utilizar meu nome e WhatsApp para entrar em contato comigo sobre a campanha Black Friday de Arrepiar, conforme a <Link href="/privacidade">Política de Privacidade</Link>.</span>
            </label>

            <div className="bf-honeypot" aria-hidden="true"><label htmlFor="bf-website">Deixe este campo vazio</label><input id="bf-website" name="website" tabIndex={-1} autoComplete="off" /></div>
            {error ? <p className="bf-form-error" role="alert">{error}</p> : null}
            <button className="bf-primary-button bf-submit-button" type="submit" disabled={busy}>
              {busy ? "ENVIANDO..." : "ENTRAR NA PRÉ-LISTA"} <ArrowRight size={18} />
            </button>
            <p className="bf-form-footnote">Cadastro gratuito. A vaga é apenas para a pré-lista, não representa matrícula reservada.</p>
          </form>
        </section>
      )}

      {stage === "success" && (
        <section className="bf-success" aria-labelledby="success-title">
          <div className="bf-success-icon"><CheckCircle2 size={43} strokeWidth={1.3} /></div>
          <p className="bf-eyebrow"><span className="bf-eyebrow-line" /> CONFIRMAÇÃO DE PRÉ-CADASTRO</p>
          <h1 id="success-title">VOCÊ ESTÁ<br /><span>NA LISTA.</span></h1>
          <p>Seu pré-cadastro foi recebido.<br />Agora fique atento ao WhatsApp. Nossa equipe entrará em contato para apresentar as condições da Black Friday Dial Fit.</p>
          <Image src={DIALFIT_LOGO} alt="Dial Fit Academia" width={2048} height={696} className="bf-success-logo" />
          <button className="bf-share-button" type="button" onClick={shareCampaign}><Share2 size={17} /> COMPARTILHAR COM UM AMIGO</button>
          {shareMessage ? <p className="bf-share-feedback" role="status">{shareMessage}</p> : null}
          <Link className="bf-text-button" href="/">Voltar ao início <ArrowRight size={14} /></Link>
        </section>
      )}

      <footer className="bf-footer">
        <span>© {new Date().getFullYear()} DIAL FIT</span>
        <Link href="/privacidade">PRIVACIDADE</Link>
        <span className="bf-footer-signal"><span /> LINHA SEGURA</span>
      </footer>
    </main>
  );
}
