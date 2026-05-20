"use client";

import { checkPasswordStrength } from "@/lib/validations";

interface PasswordChecklistProps {
  password: string;
  className?: string;
}

export function PasswordChecklist({ password, className = "" }: PasswordChecklistProps) {
  const { requirements } = checkPasswordStrength(password);

  if (!password) return null;

  return (
    <div
      className={`mt-2 p-3 rounded-xl border border-white/10 bg-black/20 space-y-1.5 ${className}`}
      data-testid="password-checklist"
      role="status"
      aria-label="Requisitos de senha"
    >
      <p className="text-xs font-medium text-white/50 mb-2">Requisitos da senha:</p>
      {requirements.map((req, idx) => (
        <div
          key={req.id}
          className={`check-item animate-fade-in-up delay-${idx * 100}`}
          data-testid={`check-${req.id}`}
          aria-checked={req.valid}
          role="checkbox"
        >
          <span className={`check-icon ${req.valid ? "valid" : ""}`}>
            {req.valid ? (
              <svg
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3"
              >
                <path
                  d="M2 6L4.5 8.5L10 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-white/20 block mx-auto" />
            )}
          </span>
          <span className={`transition-colors duration-200 ${req.valid ? "valid" : ""}`}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
}
