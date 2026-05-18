"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const OTP_LENGTH = 6;

export default function VerificarOtpPage() {
  const router = useRouter();
  const toast = useToast();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 min em segundos
  const [resendCount, setResendCount] = useState<number>(0);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("copa_reset_email");
    if (!storedEmail) {
      router.replace("/recuperar-senha");
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  // Countdown timer para expiração geral do OTP
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Countdown timer para o cooldown do botão Reenviar
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleChange = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[idx] = digit;
    setDigits(newDigits);
    setApiError(null);
    if (digit && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
    // Auto-submit when all filled
    if (digit && idx === OTP_LENGTH - 1 && newDigits.every((d) => d !== "")) {
      handleVerify(newDigits.join(""));
    }
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const newDigits = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, i) => (newDigits[i] = d));
    setDigits(newDigits);
    const nextEmpty = newDigits.findIndex((d) => d === "");
    const focusIdx = nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty;
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === OTP_LENGTH) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (otp: string) => {
    if (!email) return;
    setIsSubmitting(true);
    setApiError(null);
    try {
      await authApi.verifyOtp({ email, otp });
      sessionStorage.setItem("copa_reset_otp", otp);
      router.push("/nova-senha");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Código inválido");
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setApiError("Preencha todos os 6 dígitos do código");
      return;
    }
    handleVerify(otp);
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0 || resendCount >= 3) return;
    try {
      await authApi.forgotPassword({ email });
      setTimeLeft(15 * 60);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      setApiError(null);
      
      const nextCount = resendCount + 1;
      setResendCount(nextCount);
      if (nextCount < 3) {
        setResendCooldown(60); // 1 minuto de cooldown
      }
      
      toast.success("Código de verificação reenviado com sucesso!");
    } catch {
      setApiError("Erro ao reenviar o código");
      toast.error("Falha ao reenviar o código. Tente novamente.");
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2}).+(@.+)/, "$1***$2")
    : "***";

  return (
    <AuthCard
      title="Verificar código"
      subtitle={`Digite o código de 6 dígitos enviado para ${maskedEmail}`}
      badge="Verificação OTP"
      backHref="/recuperar-senha"
      backLabel="Usar outro email"
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* API Error */}
        {apiError && (
          <div
            className="animate-shake p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center"
            role="alert"
            data-testid="otp-error"
          >
            {apiError}
          </div>
        )}

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2.5" role="group" aria-label="Código de verificação">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={idx === 0 ? handlePaste : undefined}
              className={`otp-input ${apiError ? "border-red-500/50" : ""}`}
              aria-label={`Dígito ${idx + 1} do código`}
              data-testid={`otp-digit-${idx}`}
              disabled={isSubmitting}
              placeholder="·"
              autoFocus={idx === 0}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-center">
          {timeLeft > 0 ? (
            <p className="text-white/45 text-sm">
              Código expira em{" "}
              <span
                className={`font-mono font-semibold ${timeLeft < 60 ? "text-red-400" : "text-yellow-400"}`}
                data-testid="otp-timer"
              >
                {formatTime(timeLeft)}
              </span>
            </p>
          ) : (
            <p className="text-red-400 text-sm">Código expirado!</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || digits.some((d) => d === "")}
          className="copa-btn-primary w-full py-3.5 text-sm"
          data-testid="otp-submit"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verificando...
            </span>
          ) : (
            "Verificar código"
          )}
        </button>

        {/* Reenviar */}
        <div className="text-center">
          <span className="text-white/45 text-sm">Não recebeu o código? </span>
          <button
            type="button"
            onClick={handleResend}
            className="text-sm copa-link disabled:opacity-40 disabled:pointer-events-none"
            data-testid="resend-otp"
            disabled={resendCooldown > 0 || resendCount >= 3}
          >
            {resendCount >= 3 
              ? "Reenviar (Limite atingido)" 
              : resendCooldown > 0 
                ? `Reenviar (${resendCooldown}s)` 
                : "Reenviar"}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
