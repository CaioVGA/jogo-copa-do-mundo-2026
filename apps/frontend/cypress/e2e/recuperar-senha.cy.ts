// cypress/e2e/recuperar-senha.cy.ts

describe("Fluxo completo de recuperação de senha", () => {
  // ─── Tela: Recuperar Senha ────────────────────────────────────────────────
  describe("Recuperar Senha — /recuperar-senha", () => {
    beforeEach(() => {
      cy.clearAuthState();
      cy.visit("/recuperar-senha");
    });

    it("deve exibir o formulário corretamente", () => {
      cy.get("[data-testid=forgot-email]").should("be.visible");
      cy.get("[data-testid=forgot-submit]").should("contain", "Enviar código");
    });

    it("deve mostrar erro ao submeter email vazio", () => {
      cy.get("[data-testid=forgot-submit]").click();
      cy.contains("Email é obrigatório").should("be.visible");
    });

    it("deve mostrar erro para email inválido", () => {
      cy.get("[data-testid=forgot-email]").type("invalido");
      cy.get("[data-testid=forgot-submit]").click();
      cy.contains("email válido").should("be.visible");
    });

    it("deve mostrar estado de sucesso e redirecionar para /verificar-otp", () => {
      cy.intercept("POST", "**/auth/forgot-password", {
        statusCode: 200,
        body: { message: "Se este email estiver cadastrado, você receberá um código em breve." },
      }).as("forgotOk");

      cy.get("[data-testid=forgot-email]").type("usuario@test.com");
      cy.get("[data-testid=forgot-submit]").click();

      cy.wait("@forgotOk");
      cy.get("[data-testid=success-message]").should("be.visible");
      cy.contains("Código enviado!").should("be.visible");

      // Aguarda redirect
      cy.url({ timeout: 5000 }).should("include", "/verificar-otp");
    });

    it("deve funcionar mesmo para email não cadastrado (anti-enumeração)", () => {
      cy.intercept("POST", "**/auth/forgot-password", {
        statusCode: 200,
        body: { message: "Se este email estiver cadastrado, você receberá um código em breve." },
      }).as("forgotGeneric");

      cy.get("[data-testid=forgot-email]").type("naoexiste@test.com");
      cy.get("[data-testid=forgot-submit]").click();

      cy.wait("@forgotGeneric");
      cy.get("[data-testid=success-message]").should("be.visible");
    });

    it("deve navegar para /login ao clicar em 'Voltar'", () => {
      cy.contains("Voltar para o login").click();
      cy.url().should("include", "/login");
    });
  });

  // ─── Tela: Verificar OTP ──────────────────────────────────────────────────
  describe("Verificar OTP — /verificar-otp", () => {
    beforeEach(() => {
      cy.clearAuthState();
      cy.visit("/verificar-otp");
      cy.setResetEmail("usuario@test.com");
      cy.reload();
    });

    it("deve exibir 6 inputs de OTP", () => {
      for (let i = 0; i < 6; i++) {
        cy.get(`[data-testid=otp-digit-${i}]`).should("be.visible");
      }
    });

    it("deve navegar entre inputs ao digitar", () => {
      cy.get("[data-testid=otp-digit-0]").type("1");
      cy.focused().should("have.attr", "data-testid", "otp-digit-1");
      cy.get("[data-testid=otp-digit-1]").type("2");
      cy.focused().should("have.attr", "data-testid", "otp-digit-2");
    });

    it("deve exibir erro para OTP inválido", () => {
      cy.intercept("POST", "**/auth/verify-otp", {
        statusCode: 400,
        body: { message: "Código incorreto" },
      }).as("otpFail");

      for (let i = 0; i < 6; i++) {
        cy.get(`[data-testid=otp-digit-${i}]`).type("0");
      }
      cy.get("[data-testid=otp-submit]").click();

      cy.wait("@otpFail");
      cy.get("[data-testid=otp-error]").should("contain", "incorreto");
    });

    it("deve redirecionar para /nova-senha após OTP válido", () => {
      cy.intercept("POST", "**/auth/verify-otp", {
        statusCode: 200,
        body: { valid: true, message: "Código verificado com sucesso" },
      }).as("otpOk");

      const otp = "123456";
      otp.split("").forEach((d, i) => {
        cy.get(`[data-testid=otp-digit-${i}]`).type(d);
      });
      cy.get("[data-testid=otp-submit]").click();

      cy.wait("@otpOk");
      cy.url().should("include", "/nova-senha");
    });

    it("deve exibir o timer de expiração", () => {
      cy.get("[data-testid=otp-timer]").should("be.visible");
      cy.get("[data-testid=otp-timer]").invoke("text").should("match", /\d+:\d{2}/);
    });
  });

  // ─── Tela: Nova Senha ─────────────────────────────────────────────────────
  describe("Nova Senha — /nova-senha", () => {
    beforeEach(() => {
      cy.clearAuthState();
      cy.visit("/nova-senha");
      cy.setResetOtp("usuario@test.com", "123456");
      cy.reload();
    });

    it("deve exibir os campos de nova senha e confirmação", () => {
      cy.get("[data-testid=new-password]").should("be.visible");
      cy.get("[data-testid=confirm-new-password]").should("be.visible");
      cy.get("[data-testid=reset-submit]").should("be.visible");
    });

    it("deve exibir checklist em tempo real para nova senha", () => {
      cy.get("[data-testid=new-password]").type("a");
      cy.get("[data-testid=password-checklist]").should("be.visible");
    });

    it("deve mostrar erro se as senhas não coincidem", () => {
      cy.get("[data-testid=new-password]").type("NovaSenha@456");
      cy.get("[data-testid=confirm-new-password]").type("Diferente@789");
      cy.get("[data-testid=reset-submit]").click();
      cy.contains("As senhas não coincidem").should("be.visible");
    });

    it("deve mostrar estado de sucesso após redefinição bem-sucedida", () => {
      cy.intercept("POST", "**/auth/reset-password", {
        statusCode: 200,
        body: { message: "Senha redefinida com sucesso!" },
      }).as("resetOk");

      cy.get("[data-testid=new-password]").type("NovaSenha@456");
      cy.get("[data-testid=confirm-new-password]").type("NovaSenha@456");
      cy.get("[data-testid=reset-submit]").click();

      cy.wait("@resetOk");
      cy.get("[data-testid=reset-success]").should("be.visible");
      cy.contains("Senha redefinida!").should("be.visible");

      // Redireciona para login
      cy.url({ timeout: 5000 }).should("include", "/login");
    });

    it("deve mostrar erro da API se OTP expirou", () => {
      cy.intercept("POST", "**/auth/reset-password", {
        statusCode: 400,
        body: { message: "Código expirado. Solicite um novo." },
      }).as("resetExpired");

      cy.get("[data-testid=new-password]").type("NovaSenha@456");
      cy.get("[data-testid=confirm-new-password]").type("NovaSenha@456");
      cy.get("[data-testid=reset-submit]").click();

      cy.wait("@resetExpired");
      cy.get("[data-testid=reset-error]").should("contain", "expirado");
    });

    it("deve alternar visibilidade da nova senha", () => {
      cy.get("[data-testid=new-password]").should("have.attr", "type", "password");
      cy.get("[data-testid=toggle-new-password]").click();
      cy.get("[data-testid=new-password]").should("have.attr", "type", "text");
    });
  });
});
