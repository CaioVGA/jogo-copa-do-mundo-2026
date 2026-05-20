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
            className="w-28 h-28 drop-shadow-[0_0_15px_rgba(255,215,0,0.25)] animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* --- REFEREE / LINESMAN BODY --- */}
            
            {/* Left Arm (on waist/hip) */}
            <path
              d="M 28 65 Q 20 70 26 80"
              stroke="#0a0f1e"
              strokeWidth="5"
              fill="none"
            />
            <path
              d="M 28 65 Q 20 70 26 80"
              stroke="#fbd38d"
              strokeWidth="3.5"
              fill="none"
            />

            {/* Torso / Referee Jersey */}
            {/* Base Black Shirt */}
            <rect x="26" y="58" width="22" height="34" rx="4" fill="#0a0f1e" stroke="#0a0f1e" strokeWidth="1" />
            
            {/* Jersey Stripes (Yellow/Gold) */}
            <rect x="29" y="58" width="3" height="34" fill="#ffd700" stroke="none" />
            <rect x="35" y="58" width="3" height="34" fill="#ffd700" stroke="none" />
            <rect x="41" y="58" width="3" height="34" fill="#ffd700" stroke="none" />
            
            {/* Neck */}
            <rect x="34" y="50" width="6" height="8" fill="#fbd38d" stroke="none" />

            {/* Head (facing right) */}
            <circle cx="37" cy="42" r="8" fill="#fbd38d" stroke="none" />
            
            {/* Referee Cap (facing right) */}
            {/* Cap Crown */}
            <path
              d="M 31 39 C 31 33, 43 33, 44 39 Z"
              fill="#0a0f1e"
              stroke="none"
            />
            {/* Cap Visor */}
            <path
              d="M 42 38 L 49 40 L 43 42 Z"
              fill="#0a0f1e"
              stroke="none"
            />

            {/* Right Arm (raised vertically holding the flag) */}
            {/* Sleeve */}
            <path
              d="M 45 60 L 52 48"
              stroke="#0a0f1e"
              strokeWidth="7"
            />
            {/* Arm (skin tone) */}
            <path
              d="M 52 48 L 65 31"
              stroke="#fbd38d"
              strokeWidth="5"
            />

            {/* --- THE FLAG --- */}
            {/* Pole */}
            <line x1="65" y1="34" x2="65" y2="3" stroke="#a0aec0" strokeWidth="2.5" />
            <circle cx="65" cy="3" r="2.2" fill="#ffd700" stroke="none" />
            
            {/* Flag Waving Body (Yellow background) */}
            <path
              d="M 65 5 C 74 3.5, 83 6.5, 92 5 L 92 23 C 83 24.5, 74 21.5, 65 23 Z"
              fill="#ffd700"
              stroke="#ffd700"
              strokeWidth="0.5"
            />
            {/* Red Quadrants (creating the linesman checkerboard flag) */}
            {/* Top-Left Quadrant */}
            <path
              d="M 65 5 C 70 4.1, 74 5.3, 78.5 5.8 L 78.5 14 C 74 13.5, 70 12.3, 65 14 Z"
              fill="#ef4444"
              stroke="none"
            />
            {/* Bottom-Right Quadrant */}
            <path
              d="M 78.5 14 C 83 15.3, 87 14.2, 92 14 L 92 23 C 87 24.2, 83 23.1, 78.5 22.2 Z"
              fill="#ef4444"
              stroke="none"
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
