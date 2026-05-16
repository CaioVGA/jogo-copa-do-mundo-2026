"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { registerSchema, RegisterFormData } from "@/lib/validations";
import { authApi } from "@/lib/api";

export default function CadastroPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const watchedPassword = watch("password", "");

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      const res = await authApi.register(data);
      localStorage.setItem("copa_token", res.token);
      localStorage.setItem("copa_user", JSON.stringify(res.user));
      router.push("/dashboard");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Erro ao criar conta");
    }
  };

  const PasswordToggle = ({
    show,
    onToggle,
    testId,
  }: {
    show: boolean;
    onToggle: () => void;
    testId: string;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
      aria-label={show ? "Ocultar senha" : "Mostrar senha"}
      data-testid={testId}
    >
      {show ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Junte-se ao jogo e faça suas previsões"
      badge="Copa 2026"
      backHref="/login"
      backLabel="Já tenho uma conta"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* API Error */}
        {apiError && (
          <div
            className="animate-shake p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center"
            role="alert"
            data-testid="register-error"
          >
            {apiError}
          </div>
        )}

        {/* Nome */}
        <div className="space-y-1.5">
          <label htmlFor="register-name" className="block text-sm font-medium text-white/70">
            Nome completo
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="João Silva"
            className={`copa-input w-full px-4 py-3 text-sm ${errors.name ? "error" : ""}`}
            data-testid="register-name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-red-400 text-xs" role="alert">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="register-email" className="block text-sm font-medium text-white/70">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className={`copa-input w-full px-4 py-3 text-sm ${errors.email ? "error" : ""}`}
            data-testid="register-email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-400 text-xs" role="alert">{errors.email.message}</p>
          )}
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <label htmlFor="register-password" className="block text-sm font-medium text-white/70">
            Senha
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`copa-input w-full px-4 py-3 pr-12 text-sm ${errors.password ? "error" : ""}`}
              data-testid="register-password"
              {...register("password", {
                onChange: (e) => setPasswordValue(e.target.value),
              })}
            />
            <PasswordToggle
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
              testId="toggle-register-password"
            />
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs" role="alert">{errors.password.message}</p>
          )}
          {/* Checklist em tempo real */}
          <PasswordChecklist password={watchedPassword} />
        </div>

        {/* Confirmar Senha */}
        <div className="space-y-1.5">
          <label htmlFor="register-confirm" className="block text-sm font-medium text-white/70">
            Confirmar senha
          </label>
          <div className="relative">
            <input
              id="register-confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`copa-input w-full px-4 py-3 pr-12 text-sm ${errors.confirmPassword ? "error" : ""}`}
              data-testid="register-confirm-password"
              {...register("confirmPassword")}
            />
            <PasswordToggle
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
              testId="toggle-confirm-password"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs" role="alert">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="copa-btn-primary w-full py-3.5 text-sm mt-2"
          data-testid="register-submit"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Criando conta...
            </span>
          ) : (
            "Criar minha conta"
          )}
        </button>

        {/* Terms note */}
        <p className="text-center text-xs text-white/30 pt-1">
          Ao criar uma conta, você concorda com os termos de uso do jogo.
        </p>

        {/* Login link */}
        <div className="copa-divider">ou</div>
        <p className="text-center text-sm text-white/45">
          Já tem uma conta?{" "}
          <Link href="/login" className="copa-link font-semibold" data-testid="login-link">
            Entrar
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
