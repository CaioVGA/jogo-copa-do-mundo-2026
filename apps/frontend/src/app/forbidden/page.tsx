"use client";

import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="copa-auth-bg min-h-screen text-white flex flex-col items-center justify-center p-4 md:p-8">
      {/* Glow ambient background */}
      <div className="absolute -left-12 -top-12 w-64 h-64 bg-[#ffd700]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-12 bottom-12 w-64 h-64 bg-[#2d8a50]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="auth-card max-w-md w-full p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden">
        {/* Decorative corner light */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#ffd700]/5 rounded-full blur-xl pointer-events-none" />

        {/* Red Card SVG Illustration */}
        <div className="relative w-36 h-36 flex items-center justify-center bg-black/20 rounded-full border border-white/5 shadow-inner">
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Arm / Sleeve */}
            <path d="M 32 85 L 48 60" stroke="#0a0f1e" strokeWidth="9" />
            <path d="M 48 60 L 56 42" stroke="#fbd38d" strokeWidth="6.5" />
            
            {/* Red Card */}
            <rect x="50" y="12" width="22" height="32" rx="3.5" fill="#ef4444" stroke="#ef4444" />
            
            {/* Whistle hanging */}
            <path d="M 32 85 Q 20 73 30 63" stroke="#ffd700" strokeWidth="1.8" fill="none" />
            <rect x="29" y="58" width="9" height="7" rx="1.5" fill="#ffd700" stroke="none" />
          </svg>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex px-3 py-1 rounded-full text-xs font-black text-red-400 bg-red-500/10 border border-red-500/20 uppercase tracking-widest">
            Erro 403
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mt-2">
            EXPULSO DO LANCE! 🟥
          </h1>
          <p className="text-white/60 text-sm leading-relaxed font-medium">
            Você tentou invadir a área técnica ou o vestiário sem autorização. O árbitro lhe aplicou um cartão vermelho direto e você está fora da jogada.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full pt-2">
          <Link
            href="/dashboard"
            className="copa-btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#ffd700]/10 hover:scale-102 transition-all duration-300"
          >
            Voltar para o Campo
          </Link>
        </div>
      </div>
    </div>
  );
}
