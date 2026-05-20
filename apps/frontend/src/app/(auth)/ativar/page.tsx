"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { authApi } from "@/lib/api";

function AtivarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Ativando sua conta...");

  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResendActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setResending(true);
    setResendSuccess(null);
    setResendError(null);
    try {
      const res = await authApi.resendActivation(resendEmail);
      setResendSuccess(res.message || "E-mail de ativação reenviado com sucesso!");
    } catch (err) {
      setResendError(err instanceof Error ? err.message : "Erro ao reenviar e-mail.");
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de ativação ausente.");
      return;
    }

    const activate = async () => {
      try {
        const res = await authApi.activate(token);
        setStatus("success");
        setMessage(res.message || "Conta ativada com sucesso!");
        // Redireciona para o login após 3 segundos
        setTimeout(() => {
          router.push("/login?activated=true");
        }, 3000);
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Falha na ativação. O token pode ter expirado.");
      }
    };

    activate();
  }, [token, router]);

  return (
    <AuthCard
      title="Ativação de Conta"
      subtitle="Verificando seus dados de acesso"
      badge="Copa 2026"
      backHref="/login"
      backLabel="Voltar para o Login"
    >
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
        {status === "loading" && (
          <>
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-[#ffd700]/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#ffd700] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <p className="text-white/80 font-medium">{message}</p>
            <p className="text-white/40 text-xs">Por favor, aguarde enquanto validamos o token.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <svg className="w-8 h-8 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-300 font-semibold text-lg">{message}</p>
            <p className="text-white/50 text-sm">Redirecionando você para a página de login...</p>
            <Link href="/login" className="copa-btn-primary w-full py-3.5 text-sm mt-4 block text-center">
              Entrar agora
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-300 font-semibold text-lg">Erro na ativação</p>
            <p className="text-white/70 text-sm mb-2">{message}</p>
            
            {/* Form de reenvio de e-mail */}
            <div className="w-full pt-4 border-t border-white/5 space-y-3">
              <p className="text-white/50 text-xs">Insira seu e-mail cadastrado para receber um novo link:</p>
              <form onSubmit={handleResendActivation} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="copa-input w-full px-4 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="copa-btn-ghost w-full py-2.5 text-xs font-bold"
                >
                  {resending ? "Enviando..." : "Reenviar e-mail de ativação"}
                </button>
              </form>
              {resendSuccess && (
                <p className="text-emerald-400 text-xs font-semibold text-center">{resendSuccess}</p>
              )}
              {resendError && (
                <p className="text-red-400 text-xs font-semibold text-center">{resendError}</p>
              )}
            </div>

            <Link href="/cadastro" className="copa-btn-primary w-full py-3.5 text-sm mt-2 block text-center">
              Criar nova conta
            </Link>
          </>
        )}
      </div>
    </AuthCard>
  );
}

export default function AtivarPage() {
  return (
    <Suspense fallback={
      <AuthCard title="Carregando" subtitle="Aguarde um momento" badge="Copa 2026">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#ffd700]" />
        </div>
      </AuthCard>
    }>
      <AtivarContent />
    </Suspense>
  );
}
