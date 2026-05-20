// cypress/support/commands.ts

// ─── Custom commands ─────────────────────────────────────────────────────────

/** Limpa localStorage e sessionStorage antes do teste */
Cypress.Commands.add("clearAuthState", () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => win.sessionStorage.clear());
});

/** Configura email no sessionStorage para simular fluxo de recuperação */
Cypress.Commands.add("setResetEmail", (email: string) => {
  cy.window().then((win) => {
    win.sessionStorage.setItem("copa_reset_email", email);
  });
});

/** Configura OTP no sessionStorage para simular fluxo de nova senha */
Cypress.Commands.add("setResetOtp", (email: string, otp: string) => {
  cy.window().then((win) => {
    win.sessionStorage.setItem("copa_reset_email", email);
    win.sessionStorage.setItem("copa_reset_otp", otp);
  });
});

// ─── TypeScript declarations ─────────────────────────────────────────────────
declare global {
  namespace Cypress {
    interface Chainable {
      clearAuthState(): Chainable<void>;
      setResetEmail(email: string): Chainable<void>;
      setResetOtp(email: string, otp: string): Chainable<void>;
    }
  }
}

export {};
