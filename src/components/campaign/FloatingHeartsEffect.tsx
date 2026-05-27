import { Heart, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";

type FloatingAccent = {
  kind: "heart" | "sparkle";
  className: string;
  size: number;
  style: CSSProperties;
};

type RisingHeart = {
  left: string;
  size: number;
  className: string;
  style: CSSProperties & Record<"--drift", string>;
};

const accents: FloatingAccent[] = [
  {
    kind: "heart",
    className: "left-[7%] top-[18%] text-[#b33150]/20",
    size: 34,
    style: { animationDelay: "0s", animationDuration: "7s" },
  },
  {
    kind: "sparkle",
    className: "left-[18%] bottom-[14%] text-[#d9af65]/35",
    size: 24,
    style: { animationDelay: "1.1s", animationDuration: "6.5s" },
  },
  {
    kind: "heart",
    className: "right-[10%] top-[21%] text-[#f0a3b3]/28",
    size: 28,
    style: { animationDelay: "1.8s", animationDuration: "7.8s" },
  },
  {
    kind: "sparkle",
    className: "right-[18%] bottom-[18%] text-[#f2cf86]/34",
    size: 28,
    style: { animationDelay: "0.7s", animationDuration: "6s" },
  },
  {
    kind: "heart",
    className: "left-[48%] top-[10%] text-[#8d1832]/14",
    size: 22,
    style: { animationDelay: "2.4s", animationDuration: "8.2s" },
  },
];

const risingHearts: RisingHeart[] = [
  {
    left: "4%",
    size: 18,
    className: "text-[#a4213d]/18",
    style: { animationDelay: "0s", animationDuration: "13s", "--drift": "18px" },
  },
  {
    left: "9%",
    size: 12,
    className: "text-[#f0a3b3]/24",
    style: { animationDelay: "2.1s", animationDuration: "15s", "--drift": "-12px" },
  },
  {
    left: "14%",
    size: 22,
    className: "text-[#8d1832]/14",
    style: { animationDelay: "4.3s", animationDuration: "16s", "--drift": "26px" },
  },
  {
    left: "19%",
    size: 14,
    className: "text-[#d95f79]/20",
    style: { animationDelay: "1.4s", animationDuration: "14s", "--drift": "-20px" },
  },
  {
    left: "24%",
    size: 20,
    className: "text-[#b33150]/16",
    style: { animationDelay: "5.2s", animationDuration: "17s", "--drift": "14px" },
  },
  {
    left: "31%",
    size: 13,
    className: "text-[#f2b4bf]/24",
    style: { animationDelay: "3.2s", animationDuration: "13.5s", "--drift": "-18px" },
  },
  {
    left: "36%",
    size: 24,
    className: "text-[#a4213d]/13",
    style: { animationDelay: "6.5s", animationDuration: "18s", "--drift": "30px" },
  },
  {
    left: "42%",
    size: 15,
    className: "text-[#d9af65]/22",
    style: { animationDelay: "1.9s", animationDuration: "15.5s", "--drift": "-16px" },
  },
  {
    left: "48%",
    size: 19,
    className: "text-[#f0a3b3]/20",
    style: { animationDelay: "7.1s", animationDuration: "16.5s", "--drift": "20px" },
  },
  {
    left: "54%",
    size: 12,
    className: "text-[#8d1832]/16",
    style: { animationDelay: "0.8s", animationDuration: "14.5s", "--drift": "-26px" },
  },
  {
    left: "59%",
    size: 25,
    className: "text-[#b33150]/14",
    style: { animationDelay: "4.9s", animationDuration: "18.5s", "--drift": "16px" },
  },
  {
    left: "65%",
    size: 14,
    className: "text-[#f2b4bf]/26",
    style: { animationDelay: "2.7s", animationDuration: "14s", "--drift": "-14px" },
  },
  {
    left: "71%",
    size: 21,
    className: "text-[#a4213d]/16",
    style: { animationDelay: "6.1s", animationDuration: "17.5s", "--drift": "28px" },
  },
  {
    left: "77%",
    size: 16,
    className: "text-[#d9af65]/22",
    style: { animationDelay: "1.2s", animationDuration: "15s", "--drift": "-22px" },
  },
  {
    left: "83%",
    size: 24,
    className: "text-[#d95f79]/18",
    style: { animationDelay: "3.8s", animationDuration: "16.8s", "--drift": "18px" },
  },
  {
    left: "89%",
    size: 13,
    className: "text-[#8d1832]/18",
    style: { animationDelay: "5.7s", animationDuration: "14.2s", "--drift": "-18px" },
  },
  {
    left: "94%",
    size: 20,
    className: "text-[#f0a3b3]/20",
    style: { animationDelay: "2.4s", animationDuration: "17.2s", "--drift": "12px" },
  },
  {
    left: "98%",
    size: 15,
    className: "text-[#b33150]/14",
    style: { animationDelay: "7.6s", animationDuration: "18s", "--drift": "-24px" },
  },
];

export function FloatingHeartsEffect() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {risingHearts.map((heart, index) => (
        <Heart
          key={`rising-heart-${index}`}
          size={heart.size}
          fill="currentColor"
          className={`floating-heart-rise absolute bottom-[-3rem] ${heart.className}`}
          style={{ ...heart.style, left: heart.left }}
        />
      ))}
      {accents.map((accent, index) => {
        const Icon = accent.kind === "heart" ? Heart : Sparkles;

        return (
          <Icon
            key={`${accent.kind}-${index}`}
            size={accent.size}
            className={`floating-romance ${accent.className}`}
            style={accent.style}
          />
        );
      })}
    </div>
  );
}
