"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error for diagnostic purposes
    console.error("Runtime Error Boundary captured error:", error);
  }, [error]);

  return (
    <div className="copa-auth-bg min-h-screen text-white flex flex-col items-center justify-center p-4 md:p-8">
      {/* Glow ambient background */}
      <div className="absolute -left-12 -top-12 w-64 h-64 bg-[#2d8a50]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-12 bottom-12 w-64 h-64 bg-[#ffd700]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="auth-card max-w-md w-full p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden">
        {/* Decorative corner light */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#ffd700]/5 rounded-full blur-xl pointer-events-none" />

        {/* Soccer ball under rain SVG */}
        <div className="relative w-36 h-36 flex items-center justify-center bg-black/20 rounded-full border border-white/5 shadow-inner">
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24 drop-shadow-[0_0_15px_rgba(96,165,250,0.3)] animate-pulse"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Cloud */}
            <path
              d="M 30 45 C 20 45, 15 35, 25 25 C 25 15, 45 10, 55 20 C 65 15, 80 20, 75 35 C 85 35, 85 48, 70 48 Z"
              fill="#1a202c"
              stroke="#4a5568"
              strokeWidth="2"
            />
            
            {/* Lightning bolt */}
            <path
              d="M 50 42 L 40 58 L 52 58 L 44 75"
              stroke="#ffd700"
              strokeWidth="2"
              fill="#ffd700"
            />
            
            {/* Soccer ball */}
            <circle cx="50" cy="80" r="12" fill="#0d2b1a" stroke="#a0aec0" strokeWidth="2" />
            <path d="M 42 72 C 46 75, 54 75, 58 72" stroke="#a0aec0" strokeWidth="1.5" />
            <path d="M 39 80 C 46 81, 54 81, 61 80" stroke="#a0aec0" strokeWidth="1.5" />
            <path d="M 42 88 C 46 85, 54 85, 58 88" stroke="#a0aec0" strokeWidth="1.5" />
            <line x1="50" y1="68" x2="50" y2="92" stroke="#a0aec0" strokeWidth="1.5" />

            {/* Rain drops */}
            <line x1="25" y1="52" x2="21" y2="60" stroke="#60a5fa" strokeWidth="2" />
            <line x1="38" y1="50" x2="34" y2="58" stroke="#60a5fa" strokeWidth="2" />
            <line x1="62" y1="50" x2="58" y2="58" stroke="#60a5fa" strokeWidth="2" />
            <line x1="75" y1="52" x2="71" y2="60" stroke="#60a5fa" strokeWidth="2" />
          </svg>
        </div>

        {/* Texts */}
        <div className="space-y-2">
          <div className="inline-flex px-3 py-1 rounded-full text-xs font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 uppercase tracking-widest">
            Erro de Sistema
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mt-2">
            JOGO ADIADO! ⛈️
          </h1>
          <p className="text-white/60 text-sm leading-relaxed font-medium">
            O gramado alagou e a bola não está rolando devido a uma falha crítica de sistema ou conexão. O árbitro interrompeu a partida temporariamente.
          </p>
          {error?.message && (
            <div className="text-[10px] bg-black/40 border border-white/5 rounded-lg p-2.5 text-blue-300 font-mono text-left max-h-16 overflow-y-auto mt-1 scrollbar-thin select-all">
              Cod: {error.message}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="w-full pt-2 flex flex-col gap-2">
          <button
            onClick={() => reset()}
            className="copa-btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#ffd700]/10 hover:scale-102 transition-all duration-300 cursor-pointer"
          >
            Tentar Novamente
          </button>
          
          <Link
            href="/dashboard"
            className="copa-btn-ghost w-full py-3 text-sm flex items-center justify-center gap-2 hover:scale-102 transition-all duration-300"
          >
            Ir para Visão Geral
          </Link>
        </div>
      </div>
    </div>
  );
}
