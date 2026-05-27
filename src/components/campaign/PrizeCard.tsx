import { Check, Gift, Heart, Utensils } from "lucide-react";

const includedItems = ["Entrada", "Prato principal", "Sobremesa"];

export function PrizeCard() {
  return (
    <article className="relative overflow-hidden rounded-lg border border-white/72 bg-white/86 p-5 text-[#3b111c] shadow-2xl shadow-[#5b1224]/14 backdrop-blur-xl sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#a61f3d] via-[#d8b55e] to-[#0e8b4a]" />
      <div className="absolute right-5 top-5 text-[#f0b5bf]/40">
        <Heart size={42} aria-hidden="true" />
      </div>

      <div className="inline-flex items-center gap-2 rounded-md bg-[#fff3d8] px-3 py-2 text-sm font-semibold text-[#7a4c1d]">
        <Gift size={16} aria-hidden="true" />
        Prêmio especial para casal
      </div>

      <h2 className="mt-5 text-3xl font-semibold leading-tight">
        Jantar no Restaurante Lombardia
      </h2>

      <div className="mt-5 flex items-center gap-3 rounded-lg border border-[#f0d7dc] bg-[#fffaf8] p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#f7e8ec] text-[#a61f3d]">
          <Utensils size={21} aria-hidden="true" />
        </div>
        <p className="text-sm leading-6 text-[#6f555d]">
          Uma experiência romântica para celebrar a data com entrada, prato
          principal e sobremesa.
        </p>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {includedItems.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 rounded-lg border border-[#0e8b4a]/14 bg-white px-3 py-3 text-sm font-semibold text-[#4e3039]"
          >
            <Check size={17} className="text-[#0e8b4a]" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
