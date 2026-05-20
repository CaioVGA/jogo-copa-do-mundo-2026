import { render, screen } from "@testing-library/react";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";

describe("PasswordChecklist", () => {
  it("não renderiza nada quando a senha está vazia", () => {
    const { container } = render(<PasswordChecklist password="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza o checklist quando a senha é informada", () => {
    render(<PasswordChecklist password="a" />);
    expect(screen.getByTestId("password-checklist")).toBeInTheDocument();
  });

  it("mostra todos os 4 requisitos", () => {
    render(<PasswordChecklist password="abc" />);
    expect(screen.getByTestId("check-min_length")).toBeInTheDocument();
    expect(screen.getByTestId("check-uppercase")).toBeInTheDocument();
    expect(screen.getByTestId("check-lowercase")).toBeInTheDocument();
    expect(screen.getByTestId("check-special")).toBeInTheDocument();
  });

  it("marca min_length como válido quando senha tem 6+ chars", () => {
    render(<PasswordChecklist password="abcdef" />);
    const item = screen.getByTestId("check-min_length");
    expect(item).toHaveAttribute("aria-checked", "true");
  });

  it("marca uppercase como válido quando senha tem maiúscula", () => {
    render(<PasswordChecklist password="Abc" />);
    const item = screen.getByTestId("check-uppercase");
    expect(item).toHaveAttribute("aria-checked", "true");
  });

  it("marca lowercase como válido quando senha tem minúscula", () => {
    render(<PasswordChecklist password="Abc" />);
    const item = screen.getByTestId("check-lowercase");
    expect(item).toHaveAttribute("aria-checked", "true");
  });

  it("marca special como válido quando senha tem caractere especial", () => {
    render(<PasswordChecklist password="@" />);
    const item = screen.getByTestId("check-special");
    expect(item).toHaveAttribute("aria-checked", "true");
  });

  it("marca todos como inválidos para senha fraca", () => {
    render(<PasswordChecklist password="abc" />);
    ["min_length", "uppercase", "special"].forEach((id) => {
      const item = screen.getByTestId(`check-${id}`);
      expect(item).toHaveAttribute("aria-checked", "false");
    });
  });

  it("marca todos como válidos para senha forte", () => {
    render(<PasswordChecklist password="Senha@123" />);
    ["min_length", "uppercase", "lowercase", "special"].forEach((id) => {
      const item = screen.getByTestId(`check-${id}`);
      expect(item).toHaveAttribute("aria-checked", "true");
    });
  });

  it("tem role e aria-label acessíveis", () => {
    render(<PasswordChecklist password="abc" />);
    const checklist = screen.getByRole("status");
    expect(checklist).toHaveAttribute("aria-label", "Requisitos de senha");
  });
});
