// cypress/e2e/cadastro.cy.ts

describe("Tela de Cadastro", () => {
  beforeEach(() => {
    cy.clearAuthState();
    cy.visit("/cadastro");
  });

  it("deve exibir o formulário de cadastro corretamente", () => {
    cy.get("[data-testid=register-name]").should("be.visible");
    cy.get("[data-testid=register-email]").should("be.visible");
    cy.get("[data-testid=register-password]").should("be.visible");
    cy.get("[data-testid=register-confirm-password]").should("be.visible");
    cy.get("[data-testid=register-submit]").should("contain", "Criar minha conta");
  });

  it("deve mostrar erros ao submeter vazio", () => {
    cy.get("[data-testid=register-submit]").click();
    cy.contains("Nome é obrigatório").should("be.visible");
    cy.contains("Email é obrigatório").should("be.visible");
  });

  it("deve exibir o checklist de senha ao digitar", () => {
    cy.get("[data-testid=register-password]").type("a");
    cy.get("[data-testid=password-checklist]").should("be.visible");
  });

  it("deve marcar mínimo de 6 chars como válido", () => {
    cy.get("[data-testid=register-password]").type("abcdef");
    cy.get("[data-testid=check-min_length]").should("have.attr", "aria-checked", "true");
  });

  it("deve marcar maiúscula como válida ao digitar letra maiúscula", () => {
    cy.get("[data-testid=register-password]").type("A");
    cy.get("[data-testid=check-uppercase]").should("have.attr", "aria-checked", "true");
  });

  it("deve marcar minúscula como válida ao digitar letra minúscula", () => {
    cy.get("[data-testid=register-password]").type("a");
    cy.get("[data-testid=check-lowercase]").should("have.attr", "aria-checked", "true");
  });

  it("deve marcar especial como válido ao digitar caractere especial", () => {
    cy.get("[data-testid=register-password]").type("@");
    cy.get("[data-testid=check-special]").should("have.attr", "aria-checked", "true");
  });

  it("deve mostrar erro se as senhas não coincidem", () => {
    cy.get("[data-testid=register-name]").type("João Silva");
    cy.get("[data-testid=register-email]").type("joao@test.com");
    cy.get("[data-testid=register-password]").type("Senha@123");
    cy.get("[data-testid=register-confirm-password]").type("Diferente@999");
    cy.get("[data-testid=register-submit]").click();
    cy.contains("As senhas não coincidem").should("be.visible");
  });

  it("deve alternar visibilidade da senha", () => {
    cy.get("[data-testid=register-password]").should("have.attr", "type", "password");
    cy.get("[data-testid=toggle-register-password]").click();
    cy.get("[data-testid=register-password]").should("have.attr", "type", "text");
  });

  it("deve mostrar erro de email duplicado vindo da API", () => {
    cy.intercept("POST", "**/auth/register", {
      statusCode: 409,
      body: { message: "Este email já está cadastrado" },
    }).as("registerConflict");

    cy.get("[data-testid=register-name]").type("João Silva");
    cy.get("[data-testid=register-email]").type("existente@test.com");
    cy.get("[data-testid=register-password]").type("Senha@123");
    cy.get("[data-testid=register-confirm-password]").type("Senha@123");
    cy.get("[data-testid=register-submit]").click();

    cy.wait("@registerConflict");
    cy.get("[data-testid=register-error]").should("contain", "já está cadastrado");
  });

  it("deve redirecionar para /dashboard após cadastro bem-sucedido", () => {
    cy.intercept("POST", "**/auth/register", {
      statusCode: 201,
      body: {
        user: { id: "1", name: "João Silva", email: "joao@test.com", createdAt: new Date().toISOString() },
        token: "fake-jwt-token",
      },
    }).as("registerOk");

    cy.get("[data-testid=register-name]").type("João Silva");
    cy.get("[data-testid=register-email]").type("joao@test.com");
    cy.get("[data-testid=register-password]").type("Senha@123");
    cy.get("[data-testid=register-confirm-password]").type("Senha@123");
    cy.get("[data-testid=register-submit]").click();

    cy.wait("@registerOk");
    cy.url().should("include", "/dashboard");
  });

  it("deve navegar para /login ao clicar em 'Entrar'", () => {
    cy.get("[data-testid=login-link]").click();
    cy.url().should("include", "/login");
  });

  it("deve mostrar todos os checks válidos para senha forte", () => {
    cy.get("[data-testid=register-password]").type("Senha@123");
    ["min_length", "uppercase", "lowercase", "special"].forEach((id) => {
      cy.get(`[data-testid=check-${id}]`).should("have.attr", "aria-checked", "true");
    });
  });
});
