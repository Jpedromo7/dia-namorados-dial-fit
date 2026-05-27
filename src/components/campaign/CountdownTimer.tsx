"use client";

import { useEffect, useState } from "react";

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const EMPTY_TIME: TimeRemaining = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

function getTimeRemaining(targetDate: string): TimeRemaining {
  const difference = Math.max(new Date(targetDate).getTime() - Date.now(), 0);

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function TimeBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-[#f0d1d8] bg-[#fffaf8]/84 px-3 py-4 text-center shadow-sm shadow-[#5b1224]/6 backdrop-blur">
      <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-[#f1c979]/70 to-transparent" />
      <div className="font-display text-4xl font-semibold leading-none text-[#5b1224] sm:text-5xl">
        {String(value).padStart(2, "0")}
      </div>
      <div className="mt-2 text-xs font-semibold text-[#7a5f67]">
        {label}
      </div>
    </div>
  );
}

export function CountdownTimer({
  targetDate,
  title = "Faltam:",
  description = "Para o sorteio especial de Dia dos Namorados",
  large = false,
}: {
  targetDate: string;
  title?: string;
  description?: string;
  large?: boolean;
}) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(EMPTY_TIME);

  useEffect(() => {
    const updateTimer = () => setTimeRemaining(getTimeRemaining(targetDate));

    updateTimer();
    const intervalId = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(intervalId);
  }, [targetDate]);

  return (
    <div aria-live="polite">
      <p
        className={`font-display font-semibold leading-tight text-[#5b1224] ${
          large ? "text-3xl sm:text-4xl" : "text-2xl"
        }`}
      >
        {title}
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
        <TimeBox label="dias" value={timeRemaining.days} />
        <TimeBox label="horas" value={timeRemaining.hours} />
        <TimeBox label="min" value={timeRemaining.minutes} />
        <TimeBox label="seg" value={timeRemaining.seconds} />
      </div>
      <p className="mt-4 text-sm text-[#6f555d]">{description}</p>
    </div>
  );
}
