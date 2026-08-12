"use client";

import {
  BadgeCheck,
  Camera,
  CalendarHeart,
  Download,
  Heart,
  Sparkles,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  DIALFIT_LOGO,
  LOMBARDIA_FACADE_IMAGE,
  LOMBARDIA_LOGO,
  PRIZE_DINNER_DATE_LABEL,
  WINNING_COUPLES_COUNT,
} from "@/config/campaign";
import type { CampaignEntry } from "@/types/campaign";

const INSTAGRAM_URL = "https://www.instagram.com/";

type ToastState = {
  title: string;
  message: string;
  tone: "loading" | "success" | "error";
} | null;

const toastStyles = {
  loading:
    "border-[#f4d190]/36 bg-[#3b111c]/92 text-white shadow-[#5b1224]/24",
  success:
    "border-[#bfe8ce] bg-[#f7fff9]/95 text-[#124f31] shadow-[#0e8b4a]/16",
  error:
    "border-[#f1c0cc] bg-[#fff0f3]/95 text-[#a4213d] shadow-[#a4213d]/14",
} as const;

function getFirstTwoNames(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return parts.slice(0, 2).join(" ") || name.trim();
}

function makeParticipationText(entry: CampaignEntry | null) {
  const student = entry?.studentName
    ? getFirstTwoNames(entry.studentName)
    : "Nome do aluno";
  const companion = entry?.companionName
    ? getFirstTwoNames(entry.companionName)
    : "Nome do acompanhante";

  return `${student} e ${companion}: nosso par está no sorteio da campanha Dia dos Namorados Dial Fit e Lombardia. Agora é torcer pelo jantar especial. Torça por nós!`;
}

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Nao foi possivel carregar ${src}`));
    image.src = src;
  });
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const imageRatio = image.width / image.height;
  const canvasRatio = width / height;
  const drawWidth = imageRatio > canvasRatio ? height * imageRatio : width;
  const drawHeight = imageRatio > canvasRatio ? height : width / imageRatio;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;

  context.drawImage(image, x, y, drawWidth, drawHeight);
}

function drawCoverImageInRect(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = image.width / image.height;
  const targetRatio = width / height;
  const drawWidth = imageRatio > targetRatio ? height * imageRatio : width;
  const drawHeight = imageRatio > targetRatio ? height : width / imageRatio;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawContainImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
) {
  const ratio = image.width / image.height;
  let drawWidth = maxWidth;
  let drawHeight = drawWidth / ratio;

  if (drawHeight > maxHeight) {
    drawHeight = maxHeight;
    drawWidth = drawHeight * ratio;
  }

  context.drawImage(image, centerX - drawWidth / 2, y, drawWidth, drawHeight);
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    const metrics = context.measureText(nextLine);

    if (metrics.width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = nextLine;
    }
  }

  if (line) {
    context.fillText(line, x, currentY);
  }

  return currentY + lineHeight;
}

async function downloadParticipationPng(
  entry: CampaignEntry | null,
  couplePhotoDataUrl: string | null,
) {
  const canvas = document.createElement("canvas");
  const width = 1080;
  const height = 1920;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas indisponivel.");
  }

  const background = await loadCanvasImage(LOMBARDIA_FACADE_IMAGE).catch(
    () => null,
  );

  if (background) {
    drawCoverImage(context, background, width, height);
  } else {
    const fallback = context.createLinearGradient(0, 0, width, height);
    fallback.addColorStop(0, "#5b1224");
    fallback.addColorStop(0.55, "#a4213d");
    fallback.addColorStop(1, "#fff0e7");
    context.fillStyle = fallback;
    context.fillRect(0, 0, width, height);
  }

  const overlay = context.createLinearGradient(0, 0, 0, height);
  overlay.addColorStop(0, "rgba(32, 6, 15, 0.42)");
  overlay.addColorStop(0.48, "rgba(65, 11, 28, 0.78)");
  overlay.addColorStop(1, "rgba(21, 5, 10, 0.96)");
  context.fillStyle = overlay;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(244, 209, 144, 0.16)";
  context.beginPath();
  context.arc(860, 280, 220, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(233, 162, 174, 0.14)";
  context.beginPath();
  context.arc(160, 1520, 260, 0, Math.PI * 2);
  context.fill();

  const [dialfitLogo, lombardiaLogo, couplePhoto] = await Promise.all([
    loadCanvasImage(DIALFIT_LOGO).catch(() => null),
    loadCanvasImage(LOMBARDIA_LOGO).catch(() => null),
    couplePhotoDataUrl
      ? loadCanvasImage(couplePhotoDataUrl).catch(() => null)
      : Promise.resolve(null),
  ]);

  if (dialfitLogo) {
    drawContainImage(context, dialfitLogo, width / 2, 120, 460, 190);
  }

  context.textAlign = "center";
  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.42)";
  context.shadowBlur = 18;
  context.fillStyle = "#ffe8b7";
  context.font = "700 30px Arial, sans-serif";
  context.fillText(`Inscrição #${entry?.raffleNumber ?? "001"} confirmada`, width / 2, 376);
  context.restore();

  const student = entry?.studentName ?? "Nome do aluno";
  const companion = entry?.companionName ?? "Nome do acompanhante";
  const titleY = couplePhoto ? 1010 : 570;
  const nameY = couplePhoto ? 1130 : 710;
  const nameLineHeight = couplePhoto ? 92 : 116;
  const campaignMinimumY = couplePhoto ? 1370 : 1030;
  const bodyMinimumY = couplePhoto ? 1460 : 1180;
  const detailsMinimumY = couplePhoto ? 1622 : 1440;

  if (couplePhoto) {
    context.save();
    roundedRect(context, 268, 448, 544, 464, 46);
    context.clip();
    drawCoverImageInRect(context, couplePhoto, 268, 448, 544, 464);
    context.restore();

    context.strokeStyle = "rgba(255, 232, 183, 0.3)";
    context.lineWidth = 3;
    roundedRect(context, 268, 448, 544, 464, 46);
    context.stroke();
  }

  context.fillStyle = "#ffe8b7";
  context.font = "600 48px Georgia, serif";
  context.fillText("Nosso par está no sorteio", width / 2, titleY);

  context.fillStyle = "#ffffff";
  context.font = couplePhoto
    ? "700 84px Georgia, serif"
    : "700 108px Georgia, serif";
  const nameBottom = drawWrappedText(
    context,
    `${getFirstTwoNames(student)} e ${getFirstTwoNames(companion)}`,
    width / 2,
    nameY,
    840,
    nameLineHeight,
  );
  const campaignY = Math.max(campaignMinimumY, nameBottom + 48);
  const bodyY = Math.max(bodyMinimumY, campaignY + 90);

  context.fillStyle = "#ffe8b7";
  context.font = "600 34px Georgia, serif";
  context.fillText("Dia dos Namorados Dial Fit e Lombardia", width / 2, campaignY);

  context.fillStyle = "rgba(255, 255, 255, 0.86)";
  context.font = "500 34px Arial, sans-serif";
  const bodyBottom = drawWrappedText(
    context,
    "Estamos concorrendo a um jantar especial no Restaurante Lombardia. Torça por nós!",
    width / 2,
    bodyY,
    790,
    48,
  );
  const detailsY = Math.max(detailsMinimumY, bodyBottom + 52);

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.44)";
  context.shadowBlur = 18;
  context.fillStyle = "#ffffff";
  context.font = "700 32px Arial, sans-serif";
  context.fillText(`${WINNING_COUPLES_COUNT} casais vencedores`, width / 2, detailsY + 46);
  context.fillStyle = "rgba(255, 255, 255, 0.82)";
  context.font = "500 28px Arial, sans-serif";
  context.fillText(`Jantar em ${PRIZE_DINNER_DATE_LABEL}`, width / 2, detailsY + 90);
  context.restore();

  if (lombardiaLogo) {
    drawContainImage(
      context,
      lombardiaLogo,
      width / 2,
      Math.min(detailsY + 190, 1764),
      340,
      128,
    );
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png", 0.95),
  );

  if (!blob) {
    throw new Error("Nao foi possivel gerar a imagem.");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `story-dia-dos-namorados-${entry?.raffleNumber ?? "dialfit"}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ParticipationShareCard({
  couplePhotoDataUrl,
  entry,
}: {
  couplePhotoDataUrl?: string | null;
  entry: CampaignEntry | null;
}) {
  const [toast, setToast] = useState<ToastState>(null);
  const participationText = useMemo(() => makeParticipationText(entry), [entry]);
  const studentName = entry?.studentName ?? "Nome do aluno";
  const companionName = entry?.companionName ?? "Nome do acompanhante";

  useEffect(() => {
    if (!toast || toast.tone === "loading") {
      return;
    }

    const timerId = window.setTimeout(() => setToast(null), 3800);

    return () => window.clearTimeout(timerId);
  }, [toast]);

  async function handleDownload() {
    setToast({
      title: "Preparando story",
      message: "Estamos gerando a imagem para compartilhar.",
      tone: "loading",
    });

    try {
      await downloadParticipationPng(entry, couplePhotoDataUrl ?? null);
      setToast({
        title: "Story baixado",
        message: "Agora é só abrir o Instagram e postar.",
        tone: "success",
      });
    } catch {
      setToast({
        title: "Não foi possível baixar",
        message: "Tente novamente em alguns instantes.",
        tone: "error",
      });
    }
  }

  return (
    <section className="relative isolate overflow-hidden rounded-lg bg-[#3b111c] p-5 text-white sm:p-6">
      <Image
        src={LOMBARDIA_FACADE_IMAGE}
        alt=""
        fill
        sizes="(min-width: 1024px) 46vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,9,20,0.26),rgba(44,9,20,0.76)_54%,rgba(23,7,12,0.95))]" />
      <Heart
        className="floating-romance absolute right-8 top-10 text-[#f5b8c3]/40"
        size={34}
        aria-hidden="true"
      />
      <Sparkles
        className="floating-romance absolute bottom-12 left-8 text-[#f4d190]/52"
        size={30}
        aria-hidden="true"
      />

      <div
        className={`relative flex flex-col justify-between ${
          couplePhotoDataUrl ? "min-h-[640px]" : "min-h-[470px]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/14 px-4 py-2 text-sm font-semibold text-[#ffe7ad] backdrop-blur">
            <Camera size={16} aria-hidden="true" />
            Story pronto
          </div>
          <div className="flex items-center gap-3">
            <Image
              src={DIALFIT_LOGO}
              alt="Dial Fit Academia"
              width={170}
              height={72}
              className="dialfit-logo-clean h-auto w-[128px] sm:w-[154px]"
            />
          </div>
        </div>

        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 text-sm font-semibold text-[#ffe7ad] [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]">
            <BadgeCheck size={16} aria-hidden="true" />
            Inscrição {entry?.raffleNumber ?? "001"} confirmada
          </div>
          {couplePhotoDataUrl ? (
            <div className="mx-auto mt-5 h-44 w-44 overflow-hidden rounded-lg border border-[#f4d190]/30 shadow-[0_18px_42px_rgba(0,0,0,0.36)] sm:h-52 sm:w-52">
              <div
                aria-label="Foto do casal"
                className="h-full w-full bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url(${couplePhotoDataUrl})` }}
              />
            </div>
          ) : null}
          <p
            className={`font-editorial text-2xl text-[#ffe7ad] ${
              couplePhotoDataUrl ? "mt-4" : "mt-5"
            }`}
          >
            Nosso par está no sorteio
          </p>
          <h2 className="font-display mt-3 text-4xl font-semibold leading-[1.04] sm:text-5xl">
            {getFirstTwoNames(studentName)} e{" "}
            {getFirstTwoNames(companionName)}
          </h2>
          <p className="mt-4 text-sm font-semibold text-[#ffe7ad] sm:text-base">
            Dia dos Namorados Dial Fit e Lombardia
          </p>
          <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-white/82 sm:text-base">
            {participationText}
          </p>

          <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/18 bg-white/12 px-4 py-3 text-left backdrop-blur">
              <div className="flex items-center gap-2 text-[#ffe7ad]">
                <Trophy size={16} aria-hidden="true" />
                <span className="text-xs font-semibold">Sorteio</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-white">
                {WINNING_COUPLES_COUNT} casais vencedores
              </p>
            </div>
            <div className="rounded-lg border border-white/18 bg-white/12 px-4 py-3 text-left backdrop-blur">
              <div className="flex items-center gap-2 text-[#ffe7ad]">
                <CalendarHeart size={16} aria-hidden="true" />
                <span className="text-xs font-semibold">Jantar</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-white">
                {PRIZE_DINNER_DATE_LABEL}
              </p>
            </div>
          </div>
          <Image
            src={LOMBARDIA_LOGO}
            alt="Lombardia Risotos e Massas"
            width={146}
            height={66}
            className="lombardia-logo-clean mx-auto mt-5 h-auto w-[118px]"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="campaign-button inline-flex h-[3.15rem] items-center justify-center gap-2 bg-[#0e8b4a] px-5 text-sm font-semibold text-white"
          >
            <Camera size={18} aria-hidden="true" />
            Abrir Instagram
          </a>
          <button
            type="button"
            onClick={handleDownload}
            className="campaign-button inline-flex h-[3.15rem] items-center justify-center gap-2 border-white/70 bg-white/14 px-5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
          >
            <Download size={18} aria-hidden="true" />
            Baixar story
          </button>
        </div>

      </div>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`animate-campaign-layer fixed bottom-5 left-4 right-4 z-50 flex items-start gap-3 rounded-lg border-2 px-4 py-3 text-left shadow-2xl backdrop-blur-xl sm:bottom-6 sm:left-auto sm:right-6 sm:w-[390px] ${toastStyles[toast.tone]}`}
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/72">
            {toast.tone === "success" ? (
              <BadgeCheck size={18} aria-hidden="true" />
            ) : toast.tone === "loading" ? (
              <Download
                size={18}
                aria-hidden="true"
                className="animate-pulse"
              />
            ) : (
              <Heart size={18} aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-sm font-bold">{toast.title}</p>
            <p className="mt-0.5 text-xs font-semibold opacity-78">
              {toast.message}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
