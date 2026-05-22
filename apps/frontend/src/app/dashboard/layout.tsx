"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Home, Settings, Users, Sparkles, ShieldCheck, CalendarDays } from "lucide-react";
import { usersApi } from "@/lib/api";

function handleLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("copa_token");
    localStorage.removeItem("copa_user");
    localStorage.removeItem("copa_last_activity");
    localStorage.removeItem("copa_remember_me");
    window.location.href = "/login";
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string | null; role?: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const dynamicNavItems = [
    { href: "/dashboard", label: "Visão Geral", icon: Home, exact: true },
    { href: "/dashboard/jogos", label: "Jogos", icon: CalendarDays },
    { href: "/dashboard/grupos", label: "Grupos", icon: Users },
    ...(isAdmin
      ? [{ href: "/dashboard/gerenciamento", label: "Gerenciamento", icon: ShieldCheck }]
      : []),
    { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("copa_token");
      if (!token) {
        setIsAuthenticated(false);
        router.push("/login");
        return;
      }
      setIsAuthenticated(true);
    }

    async function syncProfile() {
      try {
        const profile = await usersApi.getProfile();
        setUser(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem("copa_user", JSON.stringify(profile));
        }
      } catch (e) {
        console.error("Erro ao sincronizar perfil:", e);
        if (typeof window !== "undefined") {
          localStorage.removeItem("copa_token");
          localStorage.removeItem("copa_user");
        }
        setIsAuthenticated(false);
        router.push("/login");
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
  }, [router]);

  // ─── Inactivity/Remember Me Tracker ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isRemembered = localStorage.getItem("copa_remember_me") === "true";
    if (isRemembered) return;

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms

    const checkInactivity = () => {
      const lastActivity = localStorage.getItem("copa_last_activity");
      if (lastActivity) {
        const elapsed = Date.now() - Number(lastActivity);
        if (elapsed > INACTIVITY_TIMEOUT) {
          handleLogout();
        }
      } else {
        localStorage.setItem("copa_last_activity", Date.now().toString());
      }
    };

    const updateActivity = () => {
      localStorage.setItem("copa_last_activity", Date.now().toString());
    };

    // Run check immediately on mount
    checkInactivity();

    // Listen to user interaction events to refresh inactivity timestamp
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    // Check inactivity status every 10 seconds
    const interval = setInterval(checkInactivity, 10000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, []);

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  if (isAuthenticated === null) {
    return (
      <div className="copa-auth-bg min-h-screen text-white flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#ffd700]" />
        <p className="text-white/60 text-sm font-semibold">Verificando autenticação...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="copa-auth-bg min-h-screen text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-white/5 bg-gradient-to-b from-[#0b1c11] via-[#05110a]/95 to-[#020704]/98 backdrop-blur-xl flex flex-col hidden md:flex z-30 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.5)]">
        {/* Ambient top glow inside sidebar */}
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-[#ffd700]/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Logo Section */}
        <div className="p-6 border-b border-white/5 relative flex items-center gap-2.5">
          <div className="bg-black rounded-xl border border-[#ffd700]/20 shadow-inner flex items-center justify-center w-9 h-9 shrink-0 overflow-hidden p-0">
            <img 
              src="/fifa-world-cup-2026.png" 
              alt="FIFA World Cup 2026 Logo" 
              className="w-full h-full object-cover brightness-110 filter drop-shadow-[0_0_8px_rgba(255,215,0,0.45)]" 
            />
          </div>
          <Link href="/dashboard" className="flex flex-col select-none hover:opacity-90 transition-opacity">
            <span className="font-light text-[10px] tracking-widest text-white/70 uppercase leading-none">Copa do</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-black text-sm tracking-tight bg-gradient-to-r from-[#ffd700] via-[#ffe135] to-[#f5c800] bg-clip-text text-transparent uppercase leading-none">Mundo</span>
              <span className="text-[8px] font-black text-white/40 tracking-wider bg-white/5 border border-white/10 px-1 py-0.2 rounded-md leading-none">2026</span>
            </div>
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
            <Link 
              href="/dashboard/configuracoes"
              className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3 relative overflow-hidden group/user transition-all duration-300 hover:bg-white/[0.04] cursor-pointer"
            >
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
            </Link>
          )}

          <button
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold text-sm cursor-pointer transition-all duration-300 active:scale-98 border border-transparent hover:border-red-500/15"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-[#0d2b1a] to-[#040e09] backdrop-blur-md sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="bg-black rounded-lg border border-[#ffd700]/20 shadow-sm flex items-center justify-center w-7 h-7 shrink-0 overflow-hidden p-0">
            <img 
              src="/fifa-world-cup-2026.png" 
              alt="FIFA World Cup 2026 Logo" 
              className="w-full h-full object-cover brightness-110" 
            />
          </div>
          <Link href="/dashboard" className="flex flex-col select-none">
            <span className="font-light text-[9px] tracking-widest text-white/70 uppercase leading-none">Copa do</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-black text-xs tracking-tight bg-gradient-to-r from-[#ffd700] via-[#ffe135] to-[#f5c800] bg-clip-text text-transparent uppercase leading-none">Mundo</span>
              <span className="text-[7px] font-black text-white/40 tracking-wider bg-white/5 border border-white/10 px-0.5 rounded leading-none">26</span>
            </div>
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
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 overflow-x-hidden relative">
        <div className="max-w-7xl xl:max-w-[1440px] mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Soccer-themed Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          {/* Modal Card */}
          <div className="auth-card max-w-sm w-full p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden border border-white/10 shadow-2xl scale-in">
            {/* Glowing lights */}
            <div className="absolute -left-8 -top-8 w-20 h-20 bg-[#2d8a50]/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -right-8 -bottom-8 w-20 h-20 bg-[#ffd700]/5 rounded-full blur-xl pointer-events-none" />
            
            {/* Player Leaving the Field Tired SVG Illustration */}
            <div className="relative w-28 h-28 flex items-center justify-center bg-black/30 rounded-full border border-white/5 shadow-inner">
              <svg
                viewBox="0 0 100 100"
                className="w-16 h-16 drop-shadow-[0_0_15px_rgba(255,215,0,0.25)] animate-pulse"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Pitch Boundary Line & Exit Arrow */}
                <path d="M 10 85 L 75 85" stroke="#4a5568" strokeWidth="2.5" />
                <path d="M 75 85 L 90 85 L 82 77" stroke="#ef4444" strokeWidth="2.5" />

                {/* Sweat Drops */}
                <path d="M 52 35 C 50 35, 48 38, 50 40 C 51 41, 52 41, 53 40 C 55 38, 53 35, 52 35 Z" fill="#60a5fa" stroke="none" />
                <path d="M 42 45 C 41 45, 40 47, 41 49 C 41 50, 42 50, 42 49 C 43 47, 43 45, 42 45 Z" fill="#60a5fa" stroke="none" />

                {/* Player Silhouette */}
                {/* Head (tilted down forward) */}
                <circle cx="48" cy="25" r="6" fill="#fbd38d" stroke="#fbd38d" />

                {/* Slouched Torso (fatigued curve) */}
                <path
                  d="M 46 31 C 41 35, 38 42, 42 56"
                  stroke="#2d8a50"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* Left Arm (hanging limp in front) */}
                <path
                  d="M 43 34 C 47 42, 48 50, 46 58"
                  stroke="#fbd38d"
                  strokeWidth="2"
                />

                {/* Right Arm (resting on waist in fatigue) */}
                <path
                  d="M 39 37 C 35 41, 35 46, 38 50"
                  stroke="#2d8a50"
                  strokeWidth="2"
                />

                {/* Shorts */}
                <path
                  d="M 42 56 L 46 56"
                  stroke="#a0aec0"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                {/* Left Leg (stepping slowly) */}
                <path
                  d="M 45 58 L 52 70 L 56 85"
                  stroke="#a0aec0"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Right Leg (dragging behind) */}
                <path
                  d="M 41 58 L 36 72 L 34 85"
                  stroke="#a0aec0"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Texts */}
            <div className="space-y-2">
              <div className="inline-flex px-3 py-1 rounded-full text-[10px] font-black text-[#ffd700] bg-[#ffd700]/10 border border-[#ffd700]/25 uppercase tracking-widest">
                Substituição
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                CANSOU DO JOGO? 🥵
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Você correu muito e parece cansado. Tem certeza de que deseja pedir substituição e ir direto para o vestiário?
              </p>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-2 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="copa-btn-primary w-full py-3 text-sm flex items-center justify-center font-bold shadow-lg shadow-[#ffd700]/5 hover:scale-102 transition-all duration-300 cursor-pointer"
              >
                Continuar no Jogo ⚽
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:text-red-300 text-xs font-bold transition-all duration-300 cursor-pointer"
              >
                Sair de Campo (Logout)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
