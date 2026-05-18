import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="copa-auth-bg flex flex-col items-center justify-center min-h-screen px-4 py-12">
      {/* Logo/Header */}
      <div className="mb-8 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-4 bg-gradient-to-b from-[#ffd700]/15 to-transparent p-0 rounded-3xl border border-[#ffd700]/20 shadow-xl relative overflow-hidden bg-black/40">
          <div className="absolute inset-0 bg-radial-gradient from-[#ffd700]/5 to-transparent pointer-events-none" />
          <img 
            src="/fifa-world-cup-2026.png" 
            alt="FIFA 2026 logo" 
            className="w-full h-full object-cover brightness-110 filter drop-shadow-[0_0_12px_rgba(255,215,0,0.35)] animate-pulse"
          />
        </div>
        <h2
          className="copa-logo text-2xl tracking-tight"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Copa do Mundo 2026
        </h2>
        <p className="text-white/35 text-xs mt-1 tracking-widest uppercase font-medium">
          Bolão & Oráculo
        </p>
      </div>

      {/* Card area */}
      <div className="w-full max-w-md relative z-10">{children}</div>

      {/* Footer */}
      <p className="mt-10 text-white/20 text-xs text-center animate-fade-in-up delay-500">
        © 2026 Copa do Mundo Game · Todos os direitos reservados
      </p>
    </div>
  );
}
