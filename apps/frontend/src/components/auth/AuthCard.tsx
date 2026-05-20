"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  backHref?: string;
  backLabel?: string;
}

export function AuthCard({
  children,
  title,
  subtitle,
  badge,
  backHref,
  backLabel,
}: AuthCardProps) {
  return (
    <div className="auth-card w-full max-w-md p-8 mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        {badge && (
          <span className="copa-badge inline-block mb-4 animate-fade-in-up">
            {badge}
          </span>
        )}
        <h1
          className="text-3xl font-bold text-white mb-2 font-display animate-fade-in-up delay-100"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/55 text-sm leading-relaxed animate-fade-in-up delay-200">
            {subtitle}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="animate-fade-in-up delay-300">{children}</div>

      {/* Back link */}
      {backHref && backLabel && (
        <div className="mt-6 text-center animate-fade-in-up delay-400">
          <Link href={backHref} className="copa-link text-sm">
            ← {backLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
