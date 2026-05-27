"use client";

import { Heart, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";

type BurstParticle = {
  kind: "heart" | "sparkle";
  className: string;
  size: number;
  style: CSSProperties;
};

const burstParticles: BurstParticle[] = [
  {
    kind: "heart",
    className: "left-[46%] top-[55%] text-[#b33150]",
    size: 18,
    style: { animationDelay: "0ms", "--x": "-44px", "--y": "-118px" } as CSSProperties,
  },
  {
    kind: "sparkle",
    className: "left-[50%] top-[54%] text-[#d9af65]",
    size: 18,
    style: { animationDelay: "50ms", "--x": "14px", "--y": "-132px" } as CSSProperties,
  },
  {
    kind: "heart",
    className: "left-[53%] top-[56%] text-[#ee8ea3]",
    size: 16,
    style: { animationDelay: "90ms", "--x": "58px", "--y": "-106px" } as CSSProperties,
  },
  {
    kind: "heart",
    className: "left-[48%] top-[58%] text-[#7a1027]",
    size: 14,
    style: { animationDelay: "130ms", "--x": "-10px", "--y": "-92px" } as CSSProperties,
  },
  {
    kind: "sparkle",
    className: "left-[51%] top-[57%] text-[#f1c979]",
    size: 14,
    style: { animationDelay: "170ms", "--x": "32px", "--y": "-86px" } as CSSProperties,
  },
];

export function CTAHeartsEffect({ burstKey }: { burstKey: number }) {
  if (burstKey === 0) {
    return null;
  }

  return (
    <div
      key={burstKey}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {burstParticles.map((particle, index) => {
        const Icon = particle.kind === "heart" ? Heart : Sparkles;

        return (
          <Icon
            key={`${particle.kind}-${index}`}
            size={particle.size}
            className={`cta-heart-burst absolute ${particle.className}`}
            style={particle.style}
          />
        );
      })}
    </div>
  );
}
