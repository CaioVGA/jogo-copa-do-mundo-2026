"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/validations";
import { authApi } from "@/lib/api";

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError(null);
    try {
      await authApi.forgotPassword(data);
      setSuccess(true);
      // Salva email na session para reutilizar nas próximas telas
      sessionStorage.setItem("copa_reset_email", data.email);
      // Redireciona após 1.5s
      setTimeout(() => router.push("/verificar-otp"), 1500);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Erro ao processar solicitação");
    }
  };

  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Informe seu email e enviaremos um código de verificação"
      badge="Recuperação"
      backHref="/login"
      backLabel="Voltar para o login"
    >
      {success ? (
        /* Estado de sucesso */
        <div className="text-center space-y-4 animate-fade-in-up" data-testid="success-message">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center animate-pulse-gold">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Código enviado!</h3>
            <p className="text-white/55 text-sm mt-1">
              Verifique sua caixa de entrada em{" "}
              <span className="text-yellow-400 font-medium">{getValues("email")}</span>
            </p>
            <p className="text-white/35 text-xs mt-2">Redirecionando em instantes...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* API Error */}
          {apiError && (
            <div
              className="animate-shake p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center"
              role="alert"
              data-testid="forgot-error"
            >
              {apiError}
            </div>
          )}

          {/* Info */}
          <div className="p-4 rounded-xl bg-yellow-500/8 border border-yellow-500/20">
            <div className="flex gap-3 items-start">
              <span className="text-yellow-400 text-lg flex-shrink-0">💡</span>
              <p className="text-white/60 text-xs leading-relaxed">
                Enviaremos um código de 6 dígitos para o email cadastrado. 
                O código expira em <strong className="text-white/80">15 minutos</strong>.
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="forgot-email" className="block text-sm font-medium text-white/70">
              Email cadastrado
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className={`copa-input w-full px-4 py-3 text-sm ${errors.email ? "error" : ""}`}
              data-testid="forgot-email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-red-400 text-xs" role="alert">{errors.email.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="copa-btn-primary w-full py-3.5 text-sm"
            data-testid="forgot-submit"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enviando código...
              </span>
            ) : (
              "Enviar código de verificação"
            )}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
