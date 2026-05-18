"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Home, Trophy, Settings, Users, CalendarDays, Sparkles, ShieldCheck } from "lucide-react";
import { usersApi } from "@/lib/api";

function handleLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("copa_token");
    localStorage.removeItem("copa_user");
    window.location.href = "/login";
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string | null; role?: string } | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const dynamicNavItems = [
    { href: "/dashboard", label: "Visão Geral", icon: Home, exact: true },
    { href: "/dashboard/palpites", label: "Jogos", icon: CalendarDays },
    { href: "/dashboard/grupos", label: "Grupos", icon: Users },
    ...(isAdmin
      ? [{ href: "/dashboard/gerenciamento", label: "Gerenciamento", icon: ShieldCheck }]
      : []),
    { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
  ];

  useEffect(() => {
    async function syncProfile() {
      try {
        const profile = await usersApi.getProfile();
        setUser(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem("copa_user", JSON.stringify(profile));
        }
      } catch (e) {
        console.error("Erro ao sincronizar perfil:", e);
      }
    }

    function loadUser() {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("copa_user");
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    loadUser();
    syncProfile();

    // Ouvir atualizações de perfil em tempo real
    window.addEventListener("user-profile-updated", loadUser);
    return () => {
      window.removeEventListener("user-profile-updated", loadUser);
    };
  }, []);

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <div className="copa-auth-bg min-h-screen text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-white/5 bg-gradient-to-b from-[#0b1c11] via-[#05110a]/95 to-[#020704]/98 backdrop-blur-xl flex flex-col hidden md:flex z-30 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.5)]">
        {/* Ambient top glow inside sidebar */}
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-[#ffd700]/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Logo Section */}
        <div className="p-6 border-b border-white/5 relative flex items-center gap-2.5">
          <div className="bg-gradient-to-b from-[#ffd700]/25 to-transparent p-0 rounded-lg border border-[#ffd700]/20 shadow-inner flex items-center justify-center w-8 h-8 shrink-0 overflow-hidden">
            <img 
              src="/fifa-world-cup-2026.png" 
              alt="FIFA World Cup 2026 Logo" 
              className="w-full h-full object-cover brightness-110 filter drop-shadow-[0_0_8px_rgba(255,215,0,0.45)] animate-pulse" 
            />
          </div>
          <Link href="/dashboard" className="copa-logo text-xl tracking-wider font-black select-none">
            COPA <span className="bg-gradient-to-r from-[#ffd700] to-[#f5c800] bg-clip-text text-transparent">2026</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto relative scrollbar-thin">
          {dynamicNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 group/nav ${
                  active
                    ? "bg-gradient-to-r from-[#ffd700]/12 to-[#ffd700]/4 text-[#ffd700] border border-[#ffd700]/20 pl-5"
                    : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent hover:translate-x-1"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-3.5 bottom-3.5 w-[3px] bg-gradient-to-b from-[#ffd700] to-[#ffe135] rounded-r-md" />
                )}
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${active ? "text-[#ffd700]" : "text-white/40 group-hover/nav:text-white"}`} />
                <span className="text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Area with User Profile Card & Logout */}
        <div className="p-4 border-t border-white/5 space-y-3 bg-black/10 relative">
          {/* User Profile Card */}
          {user && (
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3 relative overflow-hidden group/user transition-all duration-300 hover:bg-white/[0.04]">
              <div className="absolute -right-8 -bottom-8 w-16 h-16 bg-[#ffd700]/5 rounded-full blur-xl pointer-events-none group-hover/user:bg-[#ffd700]/10 transition-colors" />
              <div className="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-black/40 shrink-0 relative flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#ffd700] to-[#f5c800] text-black font-black flex items-center justify-center text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover/user:text-[#ffd700] transition-colors">{user.name}</p>
                  {user.role === "ADMIN" && (
                    <span className="text-[8px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#ffd700]/10 border border-[#ffd700]/25 text-[#ffd700] shrink-0">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/40 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <button
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold text-sm cursor-pointer transition-all duration-300 active:scale-98 border border-transparent hover:border-red-500/15"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-[#0d2b1a] to-[#040e09] backdrop-blur-md sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <img 
            src="/fifa-world-cup-2026.png" 
            alt="FIFA World Cup 2026 Logo" 
            className="w-7 h-7 object-cover rounded-md overflow-hidden brightness-110" 
          />
          <Link href="/dashboard" className="copa-logo text-lg tracking-wider font-black">
            COPA <span className="text-[#ffd700]">2026</span>
          </Link>
        </div>
        <nav className="flex items-center gap-1.5">
          {dynamicNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  active ? "text-[#ffd700] bg-[#ffd700]/10 border border-[#ffd700]/20" : "text-white/60 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
              </Link>
            );
          })}
          <button
            className="p-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-500/15"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 overflow-x-hidden relative">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
