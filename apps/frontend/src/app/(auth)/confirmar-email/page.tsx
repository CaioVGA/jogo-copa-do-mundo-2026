"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { authApi } from "@/lib/api";

function ConfirmarEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirmando seu novo e-mail...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de confirmação ausente ou inválido.");
      return;
    }

    const confirm = async () => {
      try {
        const res = await authApi.confirmEmailChange(token);
        setStatus("success");
        setMessage(res.message || "E-mail confirmado com sucesso!");

        // Limpa a sessão anterior para garantir que o usuário faça o login novamente com a nova identidade
        if (typeof window !== "undefined") {
          localStorage.removeItem("copa_token");
          localStorage.removeItem("copa_user");
          localStorage.removeItem("copa_last_activity");
          localStorage.removeItem("copa_remember_me");
        }

        // Redireciona para o login após 4 segundos
        setTimeout(() => {
          router.push("/login?emailConfirmed=true");
        }, 4000);
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Falha na confirmação do e-mail. O link pode ter expirado.");
      }
    };

    confirm();
  }, [token, router]);

  return (
    <AuthCard
      title="Alteração de E-mail"
      subtitle="Confirmando sua nova identidade"
      badge="Copa 2026"
      backHref="/login"
      backLabel="Ir para o Login"
    >
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
        {status === "loading" && (
          <>
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-[#ffd700]/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#ffd700] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <p className="text-white/80 font-medium">{message}</p>
            <p className="text-white/40 text-xs">Por favor, aguarde enquanto atualizamos seu e-mail.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-bounce">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-300 font-semibold text-lg">{message}</p>
            <p className="text-white/50 text-sm">Sua sessão foi encerrada por segurança. Por favor, faça login com o seu novo e-mail.</p>
            <p className="text-[#ffd700] text-xs font-semibold mt-1">Redirecionando em instantes...</p>
            <Link href="/login" className="copa-btn-primary w-full py-3.5 text-sm mt-4 block text-center font-black">
              Fazer Login com Novo E-mail
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
            <p className="text-red-300 font-semibold text-lg">Falha na verificação</p>
            <p className="text-white/70 text-sm">{message}</p>
            <p className="text-white/40 text-xs mt-2 max-w-xs">
              Certifique-se de usar o link de confirmação mais recente enviado para a caixa de entrada do seu novo e-mail.
            </p>
            <Link href="/login" className="copa-btn-primary w-full py-3.5 text-sm mt-4 block text-center font-black">
              Voltar ao Login
            </Link>
          </>
        )}
      </div>
    </AuthCard>
  );
}

export default function ConfirmarEmailPage() {
  return (
    <Suspense fallback={
      <AuthCard title="Carregando" subtitle="Aguarde um momento" badge="Copa 2026">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#ffd700]" />
        </div>
      </AuthCard>
    }>
      <ConfirmarEmailContent />
    </Suspense>
  );
}
