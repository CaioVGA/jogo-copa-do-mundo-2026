"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Home, Trophy, Settings, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Visão Geral", icon: Home, exact: true },
  { href: "/dashboard/palpites", label: "Meus Palpites", icon: Trophy },
  { href: "/dashboard/grupos", label: "Grupos", icon: Users },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

function handleLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("copa_token");
    localStorage.removeItem("copa_user");
    window.location.href = "/login";
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <div className="copa-auth-bg min-h-screen text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-white/10 bg-[#0d2b1a]/80 backdrop-blur-md flex-col hidden md:flex h-screen sticky top-0">
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="copa-logo text-2xl tracking-tighter">
            COPA <span className="text-white">2026</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  active
                    ? "bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/20"
                    : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10 font-medium transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#0d2b1a]/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/dashboard" className="copa-logo text-xl">
          COPA <span className="text-white">2026</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`p-2 rounded-lg transition-colors ${
                  active ? "text-[#ffd700] bg-[#ffd700]/10" : "text-white/60 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
          <button
            className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden relative">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
