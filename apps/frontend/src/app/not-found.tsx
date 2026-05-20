"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="copa-auth-bg min-h-screen text-white flex flex-col items-center justify-center p-4 md:p-8">
      {/* Glow ambient background */}
      <div className="absolute -left-12 -top-12 w-64 h-64 bg-[#ffd700]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-12 bottom-12 w-64 h-64 bg-[#2d8a50]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="auth-card max-w-md w-full p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden">
        {/* Decorative corner light */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#ffd700]/5 rounded-full blur-xl pointer-events-none" />

        {/* Flag SVG Illustration */}
        <div className="relative w-36 h-36 flex items-center justify-center bg-black/20 rounded-full border border-white/5 shadow-inner">
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24 drop-shadow-[0_0_15px_rgba(255,215,0,0.3)] animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Pole */}
            <line x1="25" y1="85" x2="25" y2="15" stroke="#a0aec0" strokeWidth="4" />
            <circle cx="25" cy="15" r="4.5" fill="#ffd700" stroke="none" />
            
            {/* Flag body */}
            <path
              d="M25 20 C 40 18, 50 25, 75 20 L 75 55 C 50 60, 40 53, 25 55 Z"
              fill="#ffd700"
              stroke="#ffd700"
            />
            {/* Diagonal stripes on the flag */}
            <path
              d="M25 20 C 35 19, 40 23, 45 22 L 35 54 C 30 54, 27 55, 25 55 Z"
              fill="#ef4444"
              stroke="#ef4444"
            />
            <path
              d="M55 22 C 60 21, 65 22, 75 20 L 65 52 C 55 53, 50 53, 45 53 Z"
              fill="#ef4444"
              stroke="#ef4444"
            />
          </svg>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex px-3 py-1 rounded-full text-xs font-black text-[#ffd700] bg-[#ffd700]/10 border border-[#ffd700]/20 uppercase tracking-widest">
            Erro 404
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mt-2">
            IMPEDIMENTO! 🚩
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            O lance foi revisado pelo VAR: a página que você está tentando acessar está em posição irregular (não existe ou foi movida).
          </p>
        </div>

        {/* Actions */}
        <div className="w-full pt-2">
          <Link
            href="/dashboard"
            className="copa-btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#ffd700]/10 hover:scale-102 transition-all duration-300"
          >
            Voltar para o Jogo
          </Link>
        </div>
      </div>
    </div>
  );
}
