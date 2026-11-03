import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? `https://${process.env.VERCEL_URL ?? "dia-dos-pais-dial-fit.vercel.app"}`),
  title: "Black Friday de Arrepiar 2026 | Dial Fit",
  description: "Entre na pré-lista da Black Friday de Arrepiar da Dial Fit e receba as condições da campanha diretamente da equipe.",
  openGraph: {
    title: "Black Friday de Arrepiar 2026 | Dial Fit",
    description: "Uma experiência especial está chegando à Dial Fit. Entre na pré-lista.",
    type: "website",
    locale: "pt_BR",
    siteName: "Dial Fit Academia",
  },
  twitter: {
    card: "summary_large_image",
    title: "Black Friday de Arrepiar 2026 | Dial Fit",
    description: "Uma experiência especial está chegando à Dial Fit. Entre na pré-lista.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
