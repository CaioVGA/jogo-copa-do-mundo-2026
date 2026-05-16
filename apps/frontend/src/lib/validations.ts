import { z } from "zod";

// ─── Regex de validação ────────────────────────────────────────────────────
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;

// ─── Checklist de requisitos ───────────────────────────────────────────────
export interface PasswordRequirement {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "min_length",
    label: "Mínimo de 6 caracteres",
    test: (v) => v.length >= 6,
  },
  {
    id: "uppercase",
    label: "Pelo menos uma letra maiúscula (A-Z)",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    id: "lowercase",
    label: "Pelo menos uma letra minúscula (a-z)",
    test: (v) => /[a-z]/.test(v),
  },
  {
    id: "special",
    label: "Pelo menos um caractere especial (!@#$...)",
    test: (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v),
  },
];

export function checkPasswordStrength(password: string): {
  requirements: Array<PasswordRequirement & { valid: boolean }>;
  score: number;
  allValid: boolean;
} {
  const requirements = PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    valid: req.test(password),
  }));
  const score = requirements.filter((r) => r.valid).length;
  return { requirements, score, allValid: score === requirements.length };
}

// ─── Schemas Zod ───────────────────────────────────────────────────────────
const passwordSchema = z
  .string()
  .min(1, "Senha é obrigatória")
  .min(6, "A senha deve ter no mínimo 6 caracteres")
  .regex(PASSWORD_REGEX, "A senha não atende aos requisitos mínimos");

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Informe um email válido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nome é obrigatório")
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(80, "Nome deve ter no máximo 80 caracteres"),
    email: z
      .string()
      .min(1, "Email é obrigatório")
      .email("Informe um email válido"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Informe um email válido"),
});

export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .min(6, "O código deve ter 6 dígitos")
    .max(6, "O código deve ter 6 dígitos")
    .regex(/^\d{6}$/, "O código deve conter apenas números"),
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

// ─── Tipos inferidos ───────────────────────────────────────────────────────
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
