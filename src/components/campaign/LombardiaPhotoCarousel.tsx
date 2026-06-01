"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import {
  LOMBARDIA_FACADE_IMAGE,
  LOMBARDIA_HERO_IMAGE,
  LOMBARDIA_SALAO_IMAGE,
  LOMBARDIA_WINE_IMAGE,
} from "@/config/campaign";

const carouselImages = [
  LOMBARDIA_HERO_IMAGE,
  LOMBARDIA_WINE_IMAGE,
  LOMBARDIA_FACADE_IMAGE,
  LOMBARDIA_SALAO_IMAGE,
] as const;

function getWrappedIndex(index: number) {
  return (index + carouselImages.length) % carouselImages.length;
}

function getCardOffset(index: number, activeIndex: number) {
  let offset = index - activeIndex;
  const halfLength = carouselImages.length / 2;

  if (offset > halfLength) {
    offset -= carouselImages.length;
  }

  if (offset < -halfLength) {
    offset += carouselImages.length;
  }

  return offset;
}

function getCardStyle(offset: number): CSSProperties {
  const distance = Math.abs(offset);
  const visibleOffset = Math.max(-2, Math.min(2, offset));
  const scale = distance === 0 ? 1 : distance === 1 ? 0.97 : 0.93;
  const opacity = distance === 0 ? 1 : distance === 1 ? 0.7 : 0.34;

  return {
    opacity,
    zIndex: 40 - distance,
    transform: `translate3d(${visibleOffset * 10}%, 0, 0) rotate(${
      visibleOffset * 2
    }deg) scale(${scale})`,
  };
}

export function LombardiaPhotoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => getWrappedIndex(current + 1));
    }, 3600);

    return () => window.clearInterval(intervalId);
  }, []);

  function showPrevious() {
    setActiveIndex((current) => getWrappedIndex(current - 1));
  }

  function showNext() {
    setActiveIndex((current) => getWrappedIndex(current + 1));
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX === null) {
      return;
    }

    const distance = clientX - touchStartX;

    if (Math.abs(distance) > 42) {
      if (distance > 0) {
        showPrevious();
      } else {
        showNext();
      }
    }

    setTouchStartX(null);
  }

  return (
    <div
      className="relative h-full min-h-[320px] sm:min-h-[520px]"
      onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
      onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0].clientX)}
    >
      <div className="absolute inset-0 [perspective:1100px]">
        {carouselImages.map((image, index) => {
          const offset = getCardOffset(index, activeIndex);

          return (
            <div
              key={image}
              className="romantic-surface absolute inset-0 overflow-hidden rounded-lg border-2 border-[#3b111c] bg-[#3b111c] shadow-[8px_8px_0_#3b111c] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={getCardStyle(offset)}
            >
              <Image
                src={image}
                alt=""
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover"
              />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Foto anterior"
        onClick={showPrevious}
        className="absolute left-4 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border-2 border-white/70 bg-[#16080d]/54 text-white shadow-[4px_4px_0_#3b111c] backdrop-blur transition duration-300 hover:-translate-y-[52%] hover:bg-[#16080d]/72 focus:outline-none focus:ring-2 focus:ring-white/70"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>

      <button
        type="button"
        aria-label="Próxima foto"
        onClick={showNext}
        className="absolute right-4 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border-2 border-white/70 bg-[#16080d]/54 text-white shadow-[4px_4px_0_#3b111c] backdrop-blur transition duration-300 hover:-translate-y-[52%] hover:bg-[#16080d]/72 focus:outline-none focus:ring-2 focus:ring-white/70"
      >
        <ChevronRight size={22} aria-hidden="true" />
      </button>

      <div className="absolute bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-md border-2 border-white/50 bg-[#16080d]/44 px-3 py-2 backdrop-blur">
        {carouselImages.map((image, index) => (
          <button
            key={`${image}-dot`}
            type="button"
            aria-label={`Mostrar foto ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 rounded-sm transition duration-300 ${
              index === activeIndex
                ? "w-7 bg-white"
                : "w-2.5 bg-white/48 hover:bg-white/72"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
