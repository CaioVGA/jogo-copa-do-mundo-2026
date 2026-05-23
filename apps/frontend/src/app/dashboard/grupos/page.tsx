"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Crown, Trash2, LogOut, Plus, UserPlus, Copy, Check, Loader2 } from "lucide-react";
import { groupsApi, GroupData } from "@/lib/api";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import JoinGroupModal from "@/components/groups/JoinGroupModal";

interface GroupCardProps {
  group: GroupData;
  isOwner: boolean;
  onAction: () => void;
}

function GroupCard({ group, isOwner, onAction }: GroupCardProps) {
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const memberCount = group._count?.members ?? 0;
  const occupancy = (memberCount / group.maxMembers) * 100;

  async function handleCopyCode(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(group.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function handleLeave(e: React.MouseEvent) {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await groupsApi.leaveGroup(group.id);
      onAction();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setActionLoading(true);
    try {
      await groupsApi.deleteGroup(group.id);
      onAction();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div 
      onClick={() => router.push(`/dashboard/grupos/${group.id}`)}
      className="auth-card p-5 border border-white/5 bg-[#0a0f1e]/40 hover:bg-white/5 hover:border-white/20 transition-all hover:scale-102 hover:shadow-xl hover:shadow-white/5 duration-300 group cursor-pointer"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-all duration-300 group-hover:scale-105 bg-white/5 border border-[#009E4F]/40 text-[#009E4F]">
            {isOwner ? (
              <Crown className="w-5 h-5 text-[#009E4F] animate-pulse" />
            ) : (
              <Users className="w-5 h-5 text-[#009E4F]/70" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-white text-sm font-black truncate tracking-tight">{group.name}</h3>
            <p className="text-[10px] text-white/40 truncate mt-0.5 font-semibold">
              {isOwner ? "Você é o criador" : `Por ${group.owner?.name ?? "..."}`}
            </p>
          </div>
        </div>
        {isOwner && (
          <span className="copa-badge shrink-0 text-[8px] px-2 py-0.5 font-bold shadow-sm">Dono</span>
        )}
      </div>

      {/* Invite code (Dashed Neon Gold Container) */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-dashed border-white/20 mb-4 group-hover:border-white/40 transition-colors shadow-inner">
        <div>
          <p className="text-[8px] text-white/30 uppercase tracking-widest font-black mb-0.5">Código de Convite</p>
          <span className="font-mono font-black text-white tracking-widest text-xs">
            {group.inviteCode}
          </span>
        </div>
        <button
          onClick={handleCopyCode}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md ${
            copiedCode 
              ? "bg-emerald-500 text-white shadow-emerald-500/20" 
              : "bg-white/10 text-white/70 hover:text-black hover:bg-white hover:scale-105 active:scale-95"
          }`}
        >
          {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Member progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-[10px] text-white/40 mb-1.5 font-bold">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-white/30" />
            Participantes
          </span>
          <span className={`font-black ${occupancy >= 100 ? "text-red-400" : occupancy > 75 ? "text-amber-400" : "text-white/60"}`}>
            {memberCount}/{group.maxMembers}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden shadow-inner border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
              occupancy >= 100 
                ? "from-red-600 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]" 
                : occupancy > 75 
                ? "from-amber-500 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
                : "from-emerald-500 to-green-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
            }`}
            style={{ width: `${occupancy}%` }}
          />
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={isOwner ? handleDelete : handleLeave}
        disabled={actionLoading}
        onBlur={() => setConfirmDelete(false)}
        className={`w-full py-2.5 text-xs font-black rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
          confirmDelete
            ? "border-red-500 bg-gradient-to-r from-red-600/30 to-red-500/20 text-red-200 shadow-md shadow-red-500/10"
            : isOwner
            ? "border-white/5 bg-white/[0.02] text-red-400 hover:bg-red-500/10 hover:border-red-500/20 active:scale-98"
            : "border-white/5 bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/10 active:scale-98"
        }`}
      >
        {actionLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isOwner ? (
          <>
            <Trash2 className="w-3.5 h-3.5" />
            {confirmDelete ? "Confirmar exclusão" : "Excluir Grupo"}
          </>
        ) : (
          <>
            <LogOut className="w-3.5 h-3.5" />
            Sair do Grupo
          </>
        )}
      </button>
    </div>
  );
}

export default function GruposPage() {
  const [ownedGroups, setOwnedGroups] = useState<GroupData[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await groupsApi.getMyGroups();
      setOwnedGroups(data.owned);
      setJoinedGroups(data.joined);
    } catch (err) {
      console.error("Erro ao carregar grupos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const totalGroups = ownedGroups.length + joinedGroups.length;

  return (
    <>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-[#ffd700]" />
              Grupos
            </h1>
            <p className="text-white/60 mt-1">
              {totalGroups === 0 ? "Crie ou entre em um grupo para competir com amigos" : `Você participa de ${totalGroups} grupo${totalGroups !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowJoin(true)}
              className="copa-btn-ghost px-5 py-3 text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4" />
              Participar de Grupo
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="copa-btn-primary px-5 py-3 text-sm flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#ffd700]/15"
            >
              <Plus className="w-4 h-4" />
              Criar Grupo
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="auth-card p-5 border border-white/5 bg-[#0a0f1e]/40 animate-pulse rounded-2xl min-h-[200px] flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-12 bg-white/5 rounded-2xl mb-4" />
                <div className="h-1.5 bg-white/10 rounded mb-4" />
                <div className="h-10 bg-white/5 rounded-xl" />
              </div>
            ))}
          </div>
        ) : totalGroups === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-white/5 border border-[#009E4F]/40 flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-[#009E4F]/30" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Nenhum grupo ainda</h2>
            <p className="text-white/50 max-w-sm mb-8">
              Crie um grupo e convide seus amigos, ou entre em um grupo com um código de convite.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowJoin(true)}
                className="copa-btn-ghost px-6 py-3 text-sm flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Participar com código
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="copa-btn-primary px-6 py-3 text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar meu primeiro grupo
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Owned groups */}
            {ownedGroups.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-4 h-4 text-white" />
                  <h2 className="text-lg font-semibold text-white">Meus Grupos</h2>
                  <span className="ml-1 text-xs bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded-full font-semibold">
                    {ownedGroups.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {ownedGroups.map((g) => (
                    <GroupCard key={g.id} group={g} isOwner onAction={fetchGroups} />
                  ))}
                </div>
              </section>
            )}

            {/* Joined groups */}
            {joinedGroups.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-white/70" />
                  <h2 className="text-lg font-semibold text-white">Grupos que Participo</h2>
                  <span className="ml-1 text-xs bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded-full font-semibold">
                    {joinedGroups.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {joinedGroups.map((g) => (
                    <GroupCard key={g.id} group={g} isOwner={false} onAction={fetchGroups} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { fetchGroups(); }}
        />
      )}
      {showJoin && (
        <JoinGroupModal
          onClose={() => setShowJoin(false)}
          onJoined={() => { fetchGroups(); setShowJoin(false); }}
        />
      )}
    </>
  );
}
