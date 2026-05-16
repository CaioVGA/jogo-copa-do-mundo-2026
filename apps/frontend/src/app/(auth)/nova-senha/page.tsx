"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { resetPasswordSchema, ResetPasswordFormData } from "@/lib/validations";
import { authApi } from "@/lib/api";

export default function NovaSenhaPage() {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("copa_reset_email");
    const storedOtp = sessionStorage.getItem("copa_reset_otp");
    if (!storedEmail || !storedOtp) {
      router.replace("/recuperar-senha");
      return;
    }
    setEmail(storedEmail);
    setOtp(storedOtp);
  }, [router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const watchedNewPassword = watch("newPassword", "");

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!email || !otp) {
      setApiError("Sessão inválida. Inicie o processo novamente.");
      return;
    }
    setApiError(null);
    try {
      await authApi.resetPassword({
        email,
        otp,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      setSuccess(true);
      // Limpa dados da sessão
      sessionStorage.removeItem("copa_reset_email");
      sessionStorage.removeItem("copa_reset_otp");
      // Redireciona para login após 2s
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    }
  };

  const PasswordToggle = ({ show, onToggle, testId }: { show: boolean; onToggle: () => void; testId: string }) => (
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
      title="Nova senha"
      subtitle="Crie uma nova senha segura para sua conta"
      badge="Redefinição"
      backHref="/login"
      backLabel="Voltar para o login"
    >
      {success ? (
        /* Estado de sucesso */
        <div className="text-center space-y-4 animate-fade-in-up" data-testid="reset-success">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center animate-pulse-gold">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-xl">Senha redefinida!</h3>
            <p className="text-white/55 text-sm mt-1">
              Sua senha foi alterada com sucesso.
            </p>
            <p className="text-white/35 text-xs mt-2">Redirecionando para o login...</p>
          </div>
          <div className="pt-2">
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-yellow-400 animate-[progress_2s_linear_forwards]"
                style={{ animation: "progress 2s linear forwards" }}
              />
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* API Error */}
          {apiError && (
            <div
              className="animate-shake p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center"
              role="alert"
              data-testid="reset-error"
            >
              {apiError}
            </div>
          )}

          {/* Nova Senha */}
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="block text-sm font-medium text-white/70">
              Nova senha
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`copa-input w-full px-4 py-3 pr-12 text-sm ${errors.newPassword ? "error" : ""}`}
                data-testid="new-password"
                {...register("newPassword")}
              />
              <PasswordToggle
                show={showNew}
                onToggle={() => setShowNew(!showNew)}
                testId="toggle-new-password"
              />
            </div>
            {errors.newPassword && (
              <p className="text-red-400 text-xs" role="alert">{errors.newPassword.message}</p>
            )}
            {/* Checklist em tempo real */}
            <PasswordChecklist password={watchedNewPassword} />
          </div>

          {/* Confirmar Nova Senha */}
          <div className="space-y-1.5">
            <label htmlFor="confirm-new-password" className="block text-sm font-medium text-white/70">
              Confirmar nova senha
            </label>
            <div className="relative">
              <input
                id="confirm-new-password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`copa-input w-full px-4 py-3 pr-12 text-sm ${errors.confirmPassword ? "error" : ""}`}
                data-testid="confirm-new-password"
                {...register("confirmPassword")}
              />
              <PasswordToggle
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                testId="toggle-confirm-new-password"
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
            data-testid="reset-submit"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Salvando...
              </span>
            ) : (
              "Salvar nova senha"
            )}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
