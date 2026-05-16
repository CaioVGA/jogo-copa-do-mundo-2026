import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Copa do Mundo 2026 — Bolão & Oráculo",
  description:
    "Participe do maior jogo de previsões da Copa do Mundo 2026! Dispute no Bolão acertando placares ou no Oráculo prevendo quem vai passar de fase.",
  keywords: ["copa do mundo 2026", "bolão", "previsão", "futebol", "oráculo"],
  authors: [{ name: "Copa 2026 Game" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
