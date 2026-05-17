"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const memberCount = group._count?.members ?? 0;
  const occupancy = (memberCount / group.maxMembers) * 100;

  async function handleCopyCode() {
    await navigator.clipboard.writeText(group.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function handleLeave() {
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

  async function handleDelete() {
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
    <div className="auth-card p-5 border border-white/10 hover:border-white/20 transition-all group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isOwner ? "bg-[#ffd700]/15 border border-[#ffd700]/25" : "bg-blue-400/15 border border-blue-400/25"
          }`}>
            {isOwner ? (
              <Crown className="w-5 h-5 text-[#ffd700]" />
            ) : (
              <Users className="w-5 h-5 text-blue-400" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold truncate">{group.name}</h3>
            <p className="text-xs text-white/50">
              {isOwner ? "Você é o criador" : `Criado por ${group.owner?.name ?? "..."}`}
            </p>
          </div>
        </div>
        {isOwner && (
          <span className="copa-badge shrink-0 text-[10px]">Dono</span>
        )}
      </div>

      {/* Invite code */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#ffd700]/8 border border-[#ffd700]/20 mb-4">
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Código de Convite</p>
          <span className="font-mono font-bold text-[#ffd700] tracking-widest text-sm">
            {group.inviteCode}
          </span>
        </div>
        <button
          onClick={handleCopyCode}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            copiedCode ? "bg-emerald-500 text-white" : "bg-white/10 text-white/60 hover:text-white hover:bg-white/20"
          }`}
        >
          {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Member progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs text-white/50 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Participantes
          </span>
          <span className={`font-semibold ${occupancy >= 100 ? "text-red-400" : occupancy > 75 ? "text-amber-400" : "text-white/70"}`}>
            {memberCount}/{group.maxMembers}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              occupancy >= 100 ? "bg-red-500" : occupancy > 75 ? "bg-amber-400" : "bg-emerald-500"
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
        className={`w-full py-2.5 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-2 ${
          confirmDelete
            ? "border-red-500 bg-red-500/20 text-red-300"
            : isOwner
            ? "border-white/10 bg-white/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
            : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
        }`}
      >
        {actionLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isOwner ? (
          <>
            <Trash2 className="w-3.5 h-3.5" />
            {confirmDelete ? "Clique novamente para confirmar" : "Deletar Grupo"}
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
        <div className="flex gap-3">
          <button
            onClick={() => setShowJoin(true)}
            className="copa-btn-ghost px-5 py-3 text-sm flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Participar de Grupo
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="copa-btn-primary px-5 py-3 text-sm flex items-center gap-2 shadow-lg shadow-[#ffd700]/15"
          >
            <Plus className="w-4 h-4" />
            Criar Grupo
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="auth-card p-5 border border-white/10 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
              <div className="h-12 bg-white/5 rounded-lg mb-4" />
              <div className="h-1.5 bg-white/10 rounded mb-4" />
              <div className="h-9 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      ) : totalGroups === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-white/20" />
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
                <Crown className="w-4 h-4 text-[#ffd700]" />
                <h2 className="text-lg font-semibold text-white">Meus Grupos</h2>
                <span className="ml-1 text-xs bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/20 px-2 py-0.5 rounded-full font-semibold">
                  {ownedGroups.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <Users className="w-4 h-4 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Grupos que Participo</h2>
                <span className="ml-1 text-xs bg-blue-400/15 text-blue-400 border border-blue-400/20 px-2 py-0.5 rounded-full font-semibold">
                  {joinedGroups.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {joinedGroups.map((g) => (
                  <GroupCard key={g.id} group={g} isOwner={false} onAction={fetchGroups} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

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
    </div>
  );
}
