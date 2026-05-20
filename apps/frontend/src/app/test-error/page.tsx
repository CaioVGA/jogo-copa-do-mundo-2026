"use client";

import { useState } from "react";

export default function TestErrorPage() {
  const [errorType, setErrorType] = useState<"none" | "runtime" | "network">("none");

  if (errorType === "runtime") {
    throw new Error("Erro de renderização simulado: Falha crítica na execução do código do componente.");
  }

  if (errorType === "network") {
    throw new Error("Failed to fetch: NetworkError when attempting to fetch resource.");
  }

  return (
    <div className="copa-auth-bg min-h-screen text-white flex flex-col items-center justify-center p-4 md:p-8">
      {/* Ambient glows */}
      <div className="absolute -left-12 -top-12 w-64 h-64 bg-[#ffd700]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-12 bottom-12 w-64 h-64 bg-[#2d8a50]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Control Card */}
      <div className="auth-card max-w-md w-full p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden">
        {/* Decorative corner light */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#ffd700]/5 rounded-full blur-xl pointer-events-none" />

        <div className="space-y-2">
          <div className="inline-flex px-3 py-1 rounded-full text-xs font-black text-[#ffd700] bg-[#ffd700]/10 border border-[#ffd700]/20 uppercase tracking-widest">
            Laboratório 🧪
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            Simulador de Erros
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            Use os botões abaixo para forçar erros de execução e testar o comportamento visual do nosso tratador global.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          {/* Button for Runtime Error */}
          <button
            onClick={() => setErrorType("runtime")}
            className="copa-btn-primary w-full py-3.5 text-xs text-white border border-red-500/20 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-lg shadow-red-600/10 cursor-pointer"
          >
            Disparar Falta Grave (Cartão Vermelho 🟥)
          </button>
          
          {/* Button for Network Error */}
          <button
            onClick={() => setErrorType("network")}
            className="copa-btn-primary w-full py-3.5 text-xs text-white border border-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 shadow-lg shadow-blue-600/10 cursor-pointer"
          >
            Disparar Falha de Rede (Campo Alagado ⛈️)
          </button>
        </div>
      </div>
    </div>
  );
}
