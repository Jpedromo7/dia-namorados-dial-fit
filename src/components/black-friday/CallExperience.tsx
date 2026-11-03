"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowDownRight, ArrowRight, PhoneCall, Volume2, VolumeX } from "lucide-react";

export type CallPhase = "incoming" | "connected" | "message" | "ended";

type SoundToggleProps = {
  enabled: boolean;
  onToggle: () => void;
  compact?: boolean;
};

function SoundToggle({ enabled, onToggle, compact = false }: SoundToggleProps) {
  return (
    <button
      type="button"
      className={`bf-audio-toggle${compact ? " bf-audio-toggle-compact" : ""}`}
      onClick={onToggle}
      aria-label={enabled ? "Silenciar som da chamada" : "Ativar som da chamada"}
      aria-pressed={enabled}
    >
      {enabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
      {!compact && (enabled ? "Som ativado" : "Som desativado")}
    </button>
  );
}

type SharedCallProps = {
  phase: CallPhase;
  elapsedSeconds: number;
  soundEnabled: boolean;
  soundBlocked: boolean;
  soundPending?: boolean;
  onToggleSound: () => void;
  onAnswer: () => void;
  onEnd: () => void;
  onSkip: () => void;
};

function formattedTime(seconds: number) {
  return `00:${String(seconds).padStart(2, "0")}`;
}

export function OriginalCallInterface({
  phase,
  elapsedSeconds,
  soundEnabled,
  soundBlocked,
  soundPending = false,
  onToggleSound,
  onAnswer,
  onEnd,
  onSkip,
}: SharedCallProps) {
  const [drag, setDrag] = useState(0);
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef(0);
  const lastDrag = useRef(0);
  const dragGeneratedClick = useRef(false);

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!sliderRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStart.current = event.clientX - drag;
    dragGeneratedClick.current = false;
    setSliderWidth(sliderRef.current.clientWidth);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const max = Math.max(0, sliderWidth - 58);
    const next = Math.max(0, Math.min(max, event.clientX - pointerStart.current));
    if (next > 5) dragGeneratedClick.current = true;
    lastDrag.current = next;
    setDrag(next);
    if (max > 0 && next >= max * 0.84) onAnswer();
  }

  function onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (phase === "incoming" && sliderWidth > 0 && lastDrag.current >= (sliderWidth - 58) * 0.68) {
      onAnswer();
      return;
    }
    if (phase === "incoming") setDrag(0);
    lastDrag.current = 0;
  }

  function onSliderClick(event: ReactMouseEvent<HTMLButtonElement>) {
    if (dragGeneratedClick.current) {
      dragGeneratedClick.current = false;
      event.preventDefault();
      return;
    }
    onAnswer();
  }

  if (phase === "ended") {
    return (
      <section className="bf-ended-screen" aria-live="polite" aria-label="Ligação encerrada">
        <div className="bf-ended-mark"><PhoneCall size={30} /></div>
        <p className="bf-eyebrow"><span className="bf-eyebrow-line" /> CHAMADA ENCERRADA</p>
        <p className="bf-ended-copy">A linha ficou em silêncio.</p>
      </section>
    );
  }

  if (phase === "incoming") {
    return (
      <section className="bf-call-screen" aria-labelledby="incoming-title">
        <div className="bf-call-copy">
          <p className="bf-eyebrow"><span className="bf-eyebrow-line" /> CHAMADA RECEBIDA</p>
          <h1 id="incoming-title" className="bf-call-title">
            <span>Uma ligação</span>
            <span>pode mudar</span>
            <span>tudo.</span>
          </h1>
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
          <div className="bf-slider" ref={sliderRef}>
            <span className="bf-slider-progress" style={{ width: `${drag + 56}px` }} />
            <span className="bf-slider-text" aria-hidden="true">DESLIZE PARA ATENDER</span>
            <button
              className="bf-slider-handle"
              type="button"
              aria-label="Deslizar ou tocar para atender a ligação"
              disabled={phase !== "incoming"}
              onClick={onSliderClick}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ left: `${drag + 4}px` }}
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="bf-call-secondary-actions" role="group" aria-label="Ações da chamada">
            <button className="bf-text-button bf-answer-link" type="button" onClick={onAnswer} disabled={phase !== "incoming"}>
              Toque para atender
            </button>
            <div className="bf-incoming-audio">
              <button
                className="bf-audio-toggle"
                type="button"
                onClick={onToggleSound}
                aria-label={soundEnabled ? "Silenciar toque da chamada" : "Ativar som da chamada"}
                aria-pressed={soundEnabled}
                aria-busy={soundPending}
                disabled={phase !== "incoming" || soundPending}
              >
                {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
                {soundPending ? "Ativando…" : soundEnabled ? "Silenciar" : "Ativar som"}
              </button>
              {soundBlocked ? <p className="bf-audio-note" role="status">O navegador bloqueou o início automático. Toque em “Ativar som” para ouvir.</p> : null}
            </div>
            <button className="bf-skip-link" type="button" onClick={onSkip} disabled={phase !== "incoming"}>
              Pular introdução <ArrowDownRight size={14} />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`bf-connected bf-connected-${phase}`} aria-labelledby="connected-title">
      <p className="bf-eyebrow"><span className="bf-eyebrow-line" /> {phase === "message" ? "MENSAGEM RECEBIDA" : "CHAMADA CONECTADA"}</p>
      <div className="bf-connected-mark" aria-hidden="true">
        <span className="bf-connected-ring bf-connected-ring-a" />
        <span className="bf-connected-ring bf-connected-ring-b" />
        <div className="bf-call-icon"><PhoneCall size={30} strokeWidth={1.7} /></div>
      </div>
      <h1 id="connected-title" className="bf-connected-name">DESCONHECIDO</h1>
      <p className="bf-call-timer">{formattedTime(elapsedSeconds)}</p>
      <p className="bf-caption" aria-live="polite">
        {phase === "message" ? "VOCÊ NÃO ESTAVA PREPARADO PARA ESSA LIGAÇÃO." : "A linha está segura."}
      </p>
      <div className="bf-call-controls">
        <SoundToggle enabled={soundEnabled} onToggle={onToggleSound} />
        <button type="button" className="bf-end-text-button" onClick={onEnd}><PhoneCall size={16} /> Encerrar ligação</button>
        <button type="button" className="bf-skip-link" onClick={onSkip}>Pular <ArrowRight size={14} /></button>
      </div>
    </section>
  );
}

type RevealProps = { onContinue: () => void; onReplay: () => void };

export function CampaignReveal({ onContinue, onReplay }: RevealProps) {
  return (
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
        <button className="bf-primary-button" type="button" onClick={onContinue}>
          QUERO ENTRAR NA PRÉ-LISTA <ArrowRight size={19} />
        </button>
      </div>
      <button className="bf-skip-link bf-back-link" type="button" onClick={onReplay}>Voltar à ligação</button>
    </section>
  );
}
