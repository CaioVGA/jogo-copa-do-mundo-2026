"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { loginSchema, LoginFormData } from "@/lib/validations";
import { authApi } from "@/lib/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const registered = searchParams.get("registered") === "true";
  const activated = searchParams.get("activated") === "true";
  const resent = searchParams.get("resent") === "true";

  const [resendingActivation, setResendingActivation] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("copa_token");
      const isRemembered = localStorage.getItem("copa_remember_me") === "true";
      const lastActivity = localStorage.getItem("copa_last_activity");

      let sessionExpired = false;
      if (token && !isRemembered && lastActivity) {
        const elapsed = Date.now() - Number(lastActivity);
        if (elapsed > 30 * 60 * 1000) {
          sessionExpired = true;
          localStorage.removeItem("copa_token");
          localStorage.removeItem("copa_user");
          localStorage.removeItem("copa_last_activity");
          localStorage.removeItem("copa_remember_me");
        }
      }

      if (token && !sessionExpired) {
        router.replace("/dashboard");
      }
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      const res = await authApi.login(data);
      localStorage.setItem("copa_token", res.token);
      localStorage.setItem("copa_user", JSON.stringify(res.user));
      localStorage.setItem("copa_remember_me", rememberMe ? "true" : "false");
      localStorage.setItem("copa_last_activity", Date.now().toString());
      router.push("/dashboard");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Erro ao fazer login");
    }
  };

  const handleResendFromLogin = async () => {
    const email = getValues("email");
    if (!email) {
      setResendStatus({ type: "error", message: "Insira seu e-mail no campo acima primeiro." });
      return;
    }
    setResendingActivation(true);
    setResendStatus(null);
    try {
      const res = await authApi.resendActivation(email);
      setResendStatus({ type: "success", message: res.message || "Link enviado!" });
    } catch (err) {
      setResendStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao reenviar e-mail.",
      });
    } finally {
      setResendingActivation(false);
    }
  };

  return (
    <AuthCard
      title="Entrar"
      subtitle="Acesse sua conta para participar do jogo"
      badge="Copa 2026"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* API Error */}
        {apiError && (
          <div
            className="animate-shake p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center space-y-2"
            role="alert"
            data-testid="login-error"
          >
            <p>{apiError}</p>
            {apiError.toLowerCase().includes("inativa") && (
              <div className="pt-1.5 border-t border-red-500/10">
                <button
                  type="button"
                  onClick={handleResendFromLogin}
                  disabled={resendingActivation}
                  className="text-xs text-[#ffd700] hover:text-[#ffd700]/80 underline font-semibold transition-colors cursor-pointer"
                >
                  {resendingActivation ? "Enviando..." : "Reenviar e-mail de ativação"}
                </button>
                {resendStatus && (
                  <p className={`text-xs mt-1 font-semibold ${resendStatus.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {resendStatus.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mensagem de conta criada */}
        {registered && !apiError && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm text-center">
            {resent ? (
              <>
                Sua conta já estava cadastrada, mas ainda não foi ativada. <br />
                Enviamos um <strong>novo e-mail de ativação</strong>. Por favor, verifique sua caixa de entrada! 📧
              </>
            ) : (
              <>
                Conta criada com sucesso! 🏆 <br />
                Por favor, <strong>verifique seu e-mail</strong> para ativar sua conta antes de entrar.
              </>
            )}
          </div>
        )}

        {/* Mensagem de conta ativada */}
        {activated && !apiError && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm text-center">
            Sua conta foi ativada com sucesso! 🎉 <br />
            Você já pode fazer o seu login abaixo.
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-white/70"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className={`copa-input w-full px-4 py-3 text-sm ${
              errors.email ? "error" : ""
            }`}
            data-testid="login-email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-white/70"
            >
              Senha
            </label>
            <Link
              href="/recuperar-senha"
              className="text-xs copa-link"
              data-testid="forgot-password-link"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`copa-input w-full px-4 py-3 pr-12 text-sm ${
                errors.password ? "error" : ""
              }`}
              data-testid="login-password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              data-testid="toggle-password"
            >
              {showPassword ? (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs mt-1" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Lembrar de mim */}
        <div className="flex items-center pt-1 select-none">
          <label className="copa-checkbox-container">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="copa-checkbox-input"
            />
            <span className="copa-checkbox-custom" />
            Lembrar de mim
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="copa-btn-primary w-full py-3.5 text-sm mt-2"
          data-testid="login-submit"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Entrando...
            </span>
          ) : (
            "Entrar"
          )}
        </button>

        {/* Divider */}
        <div className="copa-divider">ou</div>

        {/* Registro */}
        <p className="text-center text-sm text-white/45">
          Não tem uma conta?{" "}
          <Link href="/cadastro" className="copa-link font-semibold" data-testid="register-link">
            Cadastre-se grátis
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthCard title="Carregando" subtitle="Aguarde um momento" badge="Copa 2026">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#ffd700]" />
        </div>
      </AuthCard>
    }>
      <LoginContent />
    </Suspense>
  );
}
