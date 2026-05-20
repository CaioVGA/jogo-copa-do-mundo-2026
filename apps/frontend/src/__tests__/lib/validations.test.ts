import {
  checkPasswordStrength,
  PASSWORD_REQUIREMENTS,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from "@/lib/validations";

describe("checkPasswordStrength()", () => {
  it("retorna score 0 para string vazia", () => {
    const { score, allValid } = checkPasswordStrength("");
    expect(score).toBe(0);
    expect(allValid).toBe(false);
  });

  it("retorna allValid=true para senha forte", () => {
    const { score, allValid } = checkPasswordStrength("Senha@123");
    expect(score).toBe(4);
    expect(allValid).toBe(true);
  });

  it("detecta corretamente cada requisito individual", () => {
    const cases = [
      { password: "abcdef", id: "min_length", expected: true },
      { password: "abcde", id: "min_length", expected: false },
      { password: "A", id: "uppercase", expected: true },
      { password: "a", id: "uppercase", expected: false },
      { password: "a", id: "lowercase", expected: true },
      { password: "A", id: "lowercase", expected: false },
      { password: "!", id: "special", expected: true },
      { password: "a", id: "special", expected: false },
    ];

    cases.forEach(({ password, id, expected }) => {
      const { requirements } = checkPasswordStrength(password);
      const req = requirements.find((r) => r.id === id);
      expect(req?.valid).toBe(expected);
    });
  });

  it("retorna todos os 4 requisitos", () => {
    const { requirements } = checkPasswordStrength("test");
    expect(requirements).toHaveLength(4);
    expect(requirements.map((r) => r.id)).toEqual([
      "min_length",
      "uppercase",
      "lowercase",
      "special",
    ]);
  });
});

// ─── Schema Tests ──────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("valida campos corretos", () => {
    const result = loginSchema.safeParse({ email: "test@test.com", password: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejeita email inválido", () => {
    const result = loginSchema.safeParse({ email: "nao-email", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejeita senha vazia", () => {
    const result = loginSchema.safeParse({ email: "test@test.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "João Silva",
    email: "joao@test.com",
    password: "Senha@123",
    confirmPassword: "Senha@123",
  };

  it("valida dados corretos", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita senhas que não coincidem", () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: "Diferente@999",
    });
    expect(result.success).toBe(false);
    const error = result.error?.issues.find((i) => i.path.includes("confirmPassword"));
    expect(error?.message).toContain("não coincidem");
  });

  it("rejeita senha sem maiúscula", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "senha@123",
      confirmPassword: "senha@123",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita senha sem caractere especial", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "SenhaSemEspecial1",
      confirmPassword: "SenhaSemEspecial1",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita nome muito curto", () => {
    const result = registerSchema.safeParse({ ...valid, name: "A" });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("valida email correto", () => {
    expect(forgotPasswordSchema.safeParse({ email: "test@test.com" }).success).toBe(true);
  });

  it("rejeita email inválido", () => {
    expect(forgotPasswordSchema.safeParse({ email: "invalido" }).success).toBe(false);
  });
});

describe("verifyOtpSchema", () => {
  it("valida OTP de 6 dígitos", () => {
    expect(verifyOtpSchema.safeParse({ otp: "123456" }).success).toBe(true);
  });

  it("rejeita OTP com menos de 6 dígitos", () => {
    expect(verifyOtpSchema.safeParse({ otp: "12345" }).success).toBe(false);
  });

  it("rejeita OTP com letras", () => {
    expect(verifyOtpSchema.safeParse({ otp: "12345a" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const valid = {
    newPassword: "NovaSenha@456",
    confirmPassword: "NovaSenha@456",
  };

  it("valida dados corretos", () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita senhas que não coincidem", () => {
    const result = resetPasswordSchema.safeParse({
      ...valid,
      confirmPassword: "Diferente@789",
    });
    expect(result.success).toBe(false);
  });
});
