import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CAMPAIGN_KICKER, CAMPAIGN_NAME } from "@/config/campaign";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://dia-dos-pais-dial-fit.vercel.app"),
  title: CAMPAIGN_NAME,
  description: `${CAMPAIGN_KICKER} Campanha especial Agosto dos Pais para pais alunos da Dial Fit.`,
  openGraph: {
    title: CAMPAIGN_NAME,
    description: `${CAMPAIGN_KICKER} Participe do sorteio especial da Dial Fit.`,
    type: "website",
    locale: "pt_BR",
    siteName: "Dial Fit Academia",
  },
  twitter: {
    card: "summary_large_image",
    title: CAMPAIGN_NAME,
    description: `${CAMPAIGN_KICKER} Participe do sorteio especial da Dial Fit.`,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
