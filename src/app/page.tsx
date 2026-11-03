import type { Metadata } from "next";
import { PublicExperience } from "@/components/black-friday/PublicExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Black Friday de Arrepiar 2026 | Dial Fit",
  description: "Entre na pré-lista da Black Friday de Arrepiar da Dial Fit e receba as condições da campanha diretamente da equipe.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ callStyle?: string | string[] }>;
}) {
  const { callStyle } = await searchParams;
  const initialCallStyle = callStyle === "iphone" ? "iphone" : "original";
  const showStyleSwitcher = process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";

  return <PublicExperience initialCallStyle={initialCallStyle} showStyleSwitcher={showStyleSwitcher} />;
}
