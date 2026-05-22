"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Users, Crown, ShieldAlert, Power, Calendar, Mail, Loader2, UserCheck, UserX, Search } from "lucide-react";
import { usersApi, UserProfileResponse } from "@/lib/api";
import { useToast, useConfirm } from "@/components/ui/toast";

export default function GerenciamentoPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [users, setUsers] = useState<UserProfileResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Load users and verify permissions
  async function loadData() {
    try {
      setLoading(true);
      const allUsers = await usersApi.getAllUsers();
      setUsers(allUsers);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar lista de usuários.");
      router.push("/forbidden");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Get logged-in user to prevent self-deactivation/demotion
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("copa_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          
          if (parsed.role !== "ADMIN") {
            router.push("/forbidden");
            return;
          }
        } catch (e) {
          router.push("/login");
          return;
        }
      } else {
        router.push("/login");
        return;
      }
    }
    loadData();
  }, []);

  async function handleToggleRole(user: UserProfileResponse) {
    const isPromoting = user.role === "USER";
    const targetRole = isPromoting ? "ADMIN" : "USER";
    const title = isPromoting ? "Promover a Administrador" : "Rebaixar para Usuário";
    const prompt = isPromoting
      ? `Deseja mesmo promover ${user.name} a Administrador? Ele terá acesso total a configurações e gerenciamento.`
      : `Deseja mesmo rebaixar ${user.name} para Usuário Comum? Ele perderá acesso ao painel administrativo.`;

    const ok = await confirm(prompt, title);
    if (!ok) return;

    setActioningId(user.id);
    try {
      await usersApi.updateUserRole(user.id, targetRole);
      toast.success(
        isPromoting
          ? `${user.name} foi promovido a Administrador!`
          : `${user.name} foi rebaixado para Usuário Comum.`
      );
      // Reload users list
      const allUsers = await usersApi.getAllUsers();
      setUsers(allUsers);
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar cargo do usuário.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleToggleActiveStatus(user: UserProfileResponse) {
    const nextStatus = !user.active;
    const title = nextStatus ? "Ativar Conta" : "Desativar Conta";
    const prompt = nextStatus
      ? `Deseja reativar a conta de ${user.name}? Ele poderá efetuar login e palpitar normalmente.`
      : `Deseja desativar a conta de ${user.name}? Ele será impedido de acessar a plataforma imediatamente.`;

    const ok = await confirm(prompt, title);
    if (!ok) return;

    setActioningId(user.id);
    try {
      await usersApi.updateUserActiveStatus(user.id, nextStatus);
      toast.success(
        nextStatus
          ? `Conta de ${user.name} ativada com sucesso!`
          : `Conta de ${user.name} desativada com sucesso.`
      );
      // Reload users list
      const allUsers = await usersApi.getAllUsers();
      setUsers(allUsers);
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar status de atividade do usuário.");
    } finally {
      setActioningId(null);
    }
  }

  // Filter users by search term
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const admins = filteredUsers.filter((u) => u.role === "ADMIN");
  const regularUsers = filteredUsers.filter((u) => u.role === "USER");

  const itemsPerPage = 10;
  const totalPages = Math.ceil(regularUsers.length / itemsPerPage);
  const activePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const paginatedRegularUsers = regularUsers.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/50">
        <Loader2 className="w-10 h-10 animate-spin text-[#ffd700] mb-4" />
        <p className="text-sm font-semibold">Carregando painel de gerenciamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 auth-card border border-white/5 bg-gradient-to-r from-[#0d2b1a] to-[#0a0f1e] rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <ShieldAlert className="w-24 h-24 text-[#ffd700]" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ffd700]/15 border border-[#ffd700]/25 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#ffd700]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">Painel de Gerenciamento</h1>
            <p className="text-xs text-white/50 font-semibold mt-0.5">
              Administração de usuários, ativação de contas e controle de permissões.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Users */}
        <div className="auth-card p-4 flex items-center gap-4 border border-white/5 bg-slate-950/20 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 text-teal-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Total de Usuários</p>
            <p className="text-xl font-black text-white">{users.length}</p>
          </div>
        </div>

        {/* Total Admins */}
        <div className="auth-card p-4 flex items-center gap-4 border border-white/5 bg-slate-950/20 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/20 flex items-center justify-center shrink-0 text-[#ffd700]">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Administradores</p>
            <p className="text-xl font-black text-white">
              {users.filter((u) => u.role === "ADMIN").length}
            </p>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="auth-card p-4 flex items-center gap-4 border border-white/5 bg-slate-950/20 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Contas Ativas</p>
            <p className="text-xl font-black text-white">
              {users.filter((u) => u.active).length}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Buscar usuários pelo nome..."
          className="w-full pl-10 pr-4 py-3 bg-[#0a0f1e]/50 border border-white/10 rounded-2xl text-white placeholder-white/40 text-xs focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all shadow-xl font-semibold backdrop-blur-sm"
        />
      </div>

      {/* Main Grid: Admins & Regular Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Administrators Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-[#ffd700] flex items-center gap-2 border-b border-white/5 pb-2">
            <Crown className="w-5 h-5 text-[#ffd700]" />
            Administradores ({admins.length})
          </h2>

          <div className="space-y-4">
            {admins.length === 0 ? (
              <p className="text-xs text-white/40 italic">
                {searchTerm ? "Nenhum administrador corresponde à busca." : "Nenhum administrador encontrado."}
              </p>
            ) : (
              admins.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  currentUser={currentUser}
                  actioningId={actioningId}
                  onToggleRole={handleToggleRole}
                  onToggleActive={handleToggleActiveStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* Regular Users Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-teal-400 flex items-center gap-2 border-b border-white/5 pb-2">
            <Users className="w-5 h-5 text-teal-400" />
            Usuários ({regularUsers.length})
          </h2>

          <div className="space-y-4">
            {paginatedRegularUsers.length === 0 ? (
              <p className="text-xs text-white/40 italic">
                {searchTerm ? "Nenhum usuário comum corresponde à busca." : "Nenhum usuário comum encontrado."}
              </p>
            ) : (
              paginatedRegularUsers.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  currentUser={currentUser}
                  actioningId={actioningId}
                  onToggleRole={handleToggleRole}
                  onToggleActive={handleToggleActiveStatus}
                />
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-6">
              <button
                disabled={activePage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3.5 py-2 rounded-xl border border-white/10 bg-[#0a0f1e]/40 hover:bg-[#0a0f1e]/80 hover:border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-bold shrink-0 cursor-pointer shadow-md"
              >
                Anterior
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border transition-all cursor-pointer shadow-sm ${
                      activePage === page
                        ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                        : "bg-[#0a0f1e]/40 border-white/5 text-white/40 hover:border-white/15 hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                disabled={activePage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3.5 py-2 rounded-xl border border-white/10 bg-[#0a0f1e]/40 hover:bg-[#0a0f1e]/80 hover:border-white/20 text-white/70 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-bold shrink-0 cursor-pointer shadow-md"
              >
                Próximo
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// User Card Subcomponent
interface UserCardProps {
  user: UserProfileResponse;
  currentUser: UserProfileResponse | null;
  actioningId: string | null;
  onToggleRole: (user: UserProfileResponse) => void;
  onToggleActive: (user: UserProfileResponse) => void;
}

function UserCard({ user, currentUser, actioningId, onToggleRole, onToggleActive }: UserCardProps) {
  const isMe = currentUser && currentUser.id === user.id;
  const isPending = actioningId === user.id;

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Data indisponível";

  return (
    <div
      className={`auth-card p-5 border relative overflow-hidden rounded-2xl transition-all duration-300 ${
        user.role === "ADMIN"
          ? "border-[#ffd700]/20 bg-gradient-to-b from-[#ffd700]/5 to-transparent hover:border-[#ffd700]/30"
          : "border-white/5 bg-[#0a0f1e]/30 hover:border-white/10"
      } ${!user.active ? "opacity-60 grayscale-[30%]" : ""}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* User Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar wrapper */}
          <div className="relative w-11 h-11 shrink-0">
            <div className="w-full h-full rounded-full border border-white/10 overflow-hidden bg-black/40 flex items-center justify-center font-bold text-white shadow-inner">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div
                  className={`w-full h-full font-black flex items-center justify-center text-sm ${
                    user.role === "ADMIN"
                      ? "bg-gradient-to-br from-[#ffd700] to-[#f5c800] text-black"
                      : "bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
                  }`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Tiny admin crown overlay */}
            {user.role === "ADMIN" && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-[#ffd700] to-[#f5c800] p-0.5 rounded-full shadow border border-black/20">
                <Crown className="w-2.5 h-2.5 text-[#0d2b1a]" />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white/90 truncate">{user.name}</h3>
              {isMe && (
                <span className="text-[8px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  Você
                </span>
              )}
              {!user.active && (
                <span className="text-[8px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  Inativo
                </span>
              )}
              {user.active && (
                <span className="text-[8px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Ativo
                </span>
              )}
            </div>

            <div className="flex flex-col gap-0.5 text-[10px] text-white/50 font-semibold">
              <span className="flex items-center gap-1.5 truncate">
                <Mail className="w-3 h-3 text-white/30 shrink-0" /> {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-white/30 shrink-0" /> Criado em {formattedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0 justify-end">
          {isMe ? (
            <span className="text-[10px] text-white/30 font-bold pr-2 italic select-none">
              Ações bloqueadas na própria conta
            </span>
          ) : (
            <>
              {/* Role Toggle Button */}
              <button
                onClick={() => onToggleRole(user)}
                disabled={isPending || !!actioningId}
                title={user.role === "ADMIN" ? "Rebaixar para Usuário" : "Promover a Administrador"}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-md flex items-center justify-center ${
                  user.role === "ADMIN"
                    ? "bg-slate-900/40 border-white/10 text-white/70 hover:bg-slate-900 hover:text-white"
                    : "bg-[#ffd700]/10 border-[#ffd700]/25 text-[#ffd700] hover:bg-[#ffd700] hover:text-black shadow-[#ffd700]/5"
                } disabled:opacity-50`}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : user.role === "ADMIN" ? (
                  <UserX className="w-4 h-4" />
                ) : (
                  <Crown className="w-4 h-4" />
                )}
              </button>

              {/* Active Status Toggle Button */}
              <button
                onClick={() => onToggleActive(user)}
                disabled={isPending || !!actioningId}
                title={user.active ? "Desativar Conta" : "Ativar Conta"}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-md flex items-center justify-center ${
                  user.active
                    ? "bg-rose-500/10 border-rose-500/25 text-rose-400 hover:bg-rose-500 hover:text-white shadow-rose-500/5"
                    : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500 hover:text-white shadow-emerald-500/5"
                } disabled:opacity-50`}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : user.active ? (
                  <Power className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
