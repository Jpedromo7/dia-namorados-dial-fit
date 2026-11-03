"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type MouseEvent, type PointerEvent } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  CheckCircle2,
  PhoneCall,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { DIALFIT_LOGO } from "@/config/campaign";
import { formatBrazilianPhone, normalizeBrazilianPhone } from "@/lib/black-friday";

type UTM = { source: string; medium: string; campaign: string };
type Stage = "incoming" | "connected" | "reveal" | "form" | "success";

const LINES = [
  "Tem uma coisa chegando na Dial Fit...",
  "E ninguém está preparado.",
  "Só vou te dizer uma coisa...",
  "Vai ser de arrepiar.",
];

function playConnectionSignal() {
  const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const now = context.currentTime;
  [392, 494, 587].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + index * 0.17;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.055, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.16);
  });
  window.setTimeout(() => void context.close(), 900);
}

function getLineIndex(seconds: number) {
  if (seconds < 2) return 0;
  if (seconds < 4) return 1;
  if (seconds < 6) return 2;
  return 3;
}

export function PublicExperience({ audioSrc = "" }: { audioSrc?: string }) {
  const [stage, setStage] = useState<Stage>("incoming");
  const [drag, setDrag] = useState(0);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
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
  const sliderRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pointerStart = useRef(0);
  const lastDrag = useRef(0);
  const dragGeneratedClick = useRef(false);

  useEffect(() => {
    if (stage !== "connected") return;
    const started = Date.now();
    const interval = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - started) / 1000);
      setElapsed(seconds);
      if (seconds >= (audioSrc ? 30 : 9)) setStage("reveal");
    }, 250);
    return () => window.clearInterval(interval);
  }, [stage, audioSrc]);

  useEffect(() => {
    if (stage === "form") {
      document.getElementById("pre-list-name")?.focus({ preventScroll: true });
    }
  }, [stage]);

  function answerCall() {
    if (stage !== "incoming") return;
    setStage("connected");
    setElapsed(0);
    if (!muted) playConnectionSignal();
    if (audioSrc && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.muted = muted;
      void audioRef.current.play().catch(() => undefined);
    }
  }

  function finishCall() {
    audioRef.current?.pause();
    setStage("reveal");
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!sliderRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStart.current = event.clientX - drag;
    dragGeneratedClick.current = false;
    setSliderWidth(sliderRef.current.clientWidth);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const max = Math.max(0, sliderWidth - 58);
    const next = Math.max(0, Math.min(max, event.clientX - pointerStart.current));
    if (next > 5) dragGeneratedClick.current = true;
    lastDrag.current = next;
    setDrag(next);
    if (max > 0 && next >= max * 0.84) answerCall();
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (stage === "incoming" && sliderWidth > 0 && lastDrag.current >= (sliderWidth - 58) * 0.68) {
      answerCall();
      return;
    }
    if (stage === "incoming") setDrag(0);
    lastDrag.current = 0;
  }

  function onSliderClick(event: MouseEvent<HTMLButtonElement>) {
    if (dragGeneratedClick.current) {
      dragGeneratedClick.current = false;
      event.preventDefault();
      return;
    }
    answerCall();
  }

  function toggleAudio() {
    setMuted((current) => {
      const next = !current;
      if (audioRef.current) {
        audioRef.current.muted = next;
        if (next) audioRef.current.pause();
        else if (stage === "connected" && audioSrc) void audioRef.current.play().catch(() => undefined);
      }
      return next;
    });
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

  const lineIndex = getLineIndex(elapsed);
  const formattedSeconds = `00:${String(elapsed).padStart(2, "0")}`;

  return (
    <main className={`bf-public bf-stage-${stage}`}>
      {audioSrc ? <audio ref={audioRef} src={audioSrc} preload="none" onEnded={finishCall} /> : null}
      <div className="bf-atmosphere" aria-hidden="true" />
      <div className="bf-grain" aria-hidden="true" />

      <header className="bf-header">
        <Link href="/" aria-label="Dial Fit, início">
          <Image src={DIALFIT_LOGO} alt="Dial Fit Academia" width={2048} height={696} priority className="bf-logo" />
        </Link>
        <div className="bf-edition"><span className="bf-live-dot" /> BLACK EDITION <span>·</span> 2026</div>
      </header>

      {stage === "incoming" && (
        <section className="bf-call-screen" aria-labelledby="incoming-title">
          <div className="bf-call-copy">
            <p className="bf-eyebrow"><span className="bf-eyebrow-line" /> CHAMADA RECEBIDA</p>
            <h1 id="incoming-title" className="bf-call-title">Uma ligação<br /><span>pode mudar tudo.</span></h1>
            <p className="bf-call-subtitle">Atenda. Tem algo chegando à Dial Fit.</p>
          </div>

          <div className="bf-call-object" aria-label="Chamada recebida de um contato desconhecido">
            <div className="bf-orbit bf-orbit-outer" />
            <div className="bf-orbit bf-orbit-middle" />
            <div className="bf-orbit bf-orbit-inner" />
            <div className="bf-call-dial">
              <span className="bf-call-dial-top">LINHA DESCONHECIDA</span>
              <div className="bf-call-icon"><PhoneCall size={31} strokeWidth={1.7} /></div>
              <span className="bf-call-dial-name">DESCONHECIDO</span>
              <span className="bf-call-dial-status"><i /> Aguardando resposta</span>
            </div>
            <div className="bf-coordinate bf-coordinate-top">DF · 2026</div>
            <div className="bf-coordinate bf-coordinate-bottom">SINAL ENTRANTE / 01</div>
          </div>

          <div className="bf-answer-zone">
            <p className="bf-answer-label">DESLIZE PARA ATENDER <ArrowRight size={14} /></p>
            <div className="bf-slider" ref={sliderRef}>
              <span className="bf-slider-progress" style={{ width: `${drag + 56}px` }} />
              <span className="bf-slider-text" aria-hidden="true">DESLIZE PARA ATENDER</span>
              <button
                className="bf-slider-handle"
                type="button"
                aria-label="Deslizar ou ativar para atender a ligação"
                onClick={onSliderClick}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={{ transform: `translateX(${drag}px)` }}
              >
                <ArrowRight size={20} />
              </button>
            </div>
            <button className="bf-text-button" type="button" onClick={answerCall}>Ou toque aqui para atender</button>
          </div>

          <button className="bf-skip-link" type="button" onClick={() => setStage("reveal")}>Pular introdução <ArrowDownRight size={14} /></button>
        </section>
      )}

      {stage === "connected" && (
        <section className="bf-connected" aria-labelledby="connected-title">
          <p className="bf-eyebrow"><span className="bf-eyebrow-line" /> CHAMADA CONECTADA</p>
          <div className="bf-connected-mark" aria-hidden="true">
            <span className="bf-connected-ring bf-connected-ring-a" />
            <span className="bf-connected-ring bf-connected-ring-b" />
            <div className="bf-call-icon"><PhoneCall size={30} strokeWidth={1.7} /></div>
          </div>
          <h1 id="connected-title" className="bf-connected-name">DESCONHECIDO</h1>
          <p className="bf-call-timer">{formattedSeconds}</p>
          <div className="bf-waveform" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <p className="bf-caption" aria-live="polite">“{LINES[lineIndex]}”</p>
          <p className="bf-caption-note">Uma mensagem para você.</p>
          <div className="bf-call-controls">
            <button type="button" className="bf-audio-toggle" onClick={toggleAudio} aria-pressed={muted}>
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              {muted ? "Áudio silenciado" : "Silenciar áudio"}
            </button>
            <button type="button" className="bf-skip-link" onClick={finishCall}>Pular <ArrowRight size={14} /></button>
          </div>
        </section>
      )}

      {stage === "reveal" && (
        <section className="bf-reveal" aria-labelledby="reveal-title">
          <p className="bf-reveal-kicker"><span /> DIAL FIT APRESENTA <span /></p>
          <div className="bf-title-lockup">
            <p className="bf-title-outline">BLACK</p>
            <p className="bf-title-friday">FRIDAY</p>
            <h1 id="reveal-title" className="bf-title-shiver">DE ARREPIAR</h1>
          </div>
          <div className="bf-reveal-copy">
            <p className="bf-reveal-lead">A ESPERA ESTÁ QUASE ACABANDO.</p>
            <p>Algo extraordinário está chegando à Dial Fit.<br />E você pode ser um dos primeiros a receber as novidades.</p>
          </div>
          <div className="bf-reveal-cta">
            <div className="bf-cta-copy">
              <span className="bf-section-label">O PRÓXIMO CAPÍTULO É SEU</span>
              <p><strong>AS CONDIÇÕES ESPECIAIS ESTÃO CHEGANDO.</strong><br />Entre para nossa pré-lista e receba as informações diretamente da nossa equipe.</p>
            </div>
            <button className="bf-primary-button" type="button" onClick={() => setStage("form")}>
              QUERO ENTRAR NA PRÉ-LISTA <ArrowRight size={19} />
            </button>
          </div>
          <button className="bf-skip-link bf-back-link" type="button" onClick={() => setStage("incoming")}>Voltar à ligação</button>
        </section>
      )}

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
