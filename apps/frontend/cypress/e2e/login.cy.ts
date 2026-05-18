// cypress/e2e/login.cy.ts

describe("Tela de Login", () => {
  beforeEach(() => {
    cy.clearAuthState();
    cy.visit("/login");
  });

  it("deve exibir o formulário de login corretamente", () => {
    cy.get("[data-testid=login-email]").should("be.visible");
    cy.get("[data-testid=login-password]").should("be.visible");
    cy.get("[data-testid=login-submit]").should("be.visible").and("contain", "Entrar");
    cy.get("[data-testid=forgot-password-link]").should("be.visible");
    cy.get("[data-testid=register-link]").should("be.visible");
  });

  it("deve mostrar erros de validação ao submeter vazio", () => {
    cy.get("[data-testid=login-submit]").click();
    cy.contains("Email é obrigatório").should("be.visible");
    cy.contains("Senha é obrigatória").should("be.visible");
  });

  it("deve mostrar erro para email inválido", () => {
    cy.get("[data-testid=login-email]").type("emailinvalido");
    cy.get("[data-testid=login-submit]").click();
    cy.contains("email válido").should("be.visible");
  });

  it("deve alternar visibilidade da senha", () => {
    cy.get("[data-testid=login-password]").should("have.attr", "type", "password");
    cy.get("[data-testid=toggle-password]").click();
    cy.get("[data-testid=login-password]").should("have.attr", "type", "text");
    cy.get("[data-testid=toggle-password]").click();
    cy.get("[data-testid=login-password]").should("have.attr", "type", "password");
  });

  it("deve exibir erro da API quando credenciais estão erradas", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 401,
      body: { message: "Email ou senha inválidos" },
    }).as("loginFail");

    cy.get("[data-testid=login-email]").type("errado@test.com");
    cy.get("[data-testid=login-password]").type("Errado@123");
    cy.get("[data-testid=login-submit]").click();

    cy.wait("@loginFail");
    cy.get("[data-testid=login-error]").should("contain", "inválidos");
  });

  it("deve redirecionar para /dashboard após login bem-sucedido", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 200,
      body: {
        user: { id: "1", name: "Teste", email: "teste@test.com", createdAt: new Date().toISOString() },
        token: "fake-jwt-token",
      },
    }).as("loginOk");

    cy.get("[data-testid=login-email]").type("teste@test.com");
    cy.get("[data-testid=login-password]").type("Teste@123");
    cy.get("[data-testid=login-submit]").click();

    cy.wait("@loginOk");
    cy.url().should("include", "/dashboard");
  });

  it("deve navegar para /recuperar-senha ao clicar em 'Esqueci minha senha'", () => {
    cy.get("[data-testid=forgot-password-link]").click();
    cy.url().should("include", "/recuperar-senha");
  });

  it("deve navegar para /cadastro ao clicar em 'Cadastre-se'", () => {
    cy.get("[data-testid=register-link]").click();
    cy.url().should("include", "/cadastro");
  });

  it("deve mostrar loader durante o submit", () => {
    cy.intercept("POST", "**/auth/login", (req) => {
      (req as any).on("before:response", (res: any) => res.setDelay(500));
      req.reply({ statusCode: 200, body: { user: { id: "1", name: "T", email: "t@t.com", createdAt: "" }, token: "t" } });
    }).as("loginSlow");

    cy.get("[data-testid=login-email]").type("t@t.com");
    cy.get("[data-testid=login-password]").type("Teste@123");
    cy.get("[data-testid=login-submit]").click();
    cy.get("[data-testid=login-submit]").should("be.disabled");
  });
});
