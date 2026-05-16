import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="copa-auth-bg flex flex-col items-center justify-center min-h-screen px-4 py-12">
      {/* Logo/Header */}
      <div className="mb-8 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="text-4xl">🏆</span>
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
