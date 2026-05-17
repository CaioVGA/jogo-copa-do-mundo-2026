"use client";

import { useState } from "react";
import { X, Search, Users, Crown, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { groupsApi, GroupPreview } from "@/lib/api";

interface Props {
  onClose: () => void;
  onJoined: () => void;
}

export default function JoinGroupModal({ onClose, onJoined }: Props) {
  const [code, setCode] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [joined, setJoined] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 8) {
      setSearchError("O código deve ter exatamente 8 caracteres");
      return;
    }
    setSearchError(null);
    setPreview(null);
    setJoinError(null);
    setSearching(true);
    try {
      const data = await groupsApi.lookupGroup(trimmed);
      setPreview(data);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Grupo não encontrado");
    } finally {
      setSearching(false);
    }
  }

  async function handleJoin() {
    if (!preview) return;
    setJoinError(null);
    setJoining(true);
    try {
      await groupsApi.joinGroup(preview.inviteCode);
      setJoined(true);
      onJoined();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Erro ao entrar no grupo");
    } finally {
      setJoining(false);
    }
  }

  const occupancy = preview ? (preview.memberCount / preview.maxMembers) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!joining ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md auth-card p-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-400/15 border border-blue-400/25 flex items-center justify-center">
              <Search className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {joined ? "Bem-vindo!" : "Participar de Grupo"}
              </h2>
              <p className="text-xs text-white/50">
                {joined ? "Você agora faz parte do grupo" : "Digite o código de convite"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={joining}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Joined success */}
        {joined && preview ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-1">{preview.name}</h3>
              <p className="text-white/60 text-sm">
                Você entrou no grupo com sucesso! 🎉
              </p>
            </div>
            <button onClick={onClose} className="copa-btn-primary w-full py-3 text-sm">
              Fechar
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Search form */}
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="invite-code" className="block text-sm font-medium text-white/70">
                  Código de Convite
                </label>
                <div className="flex gap-2">
                  <input
                    id="invite-code"
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
                      setPreview(null);
                      setSearchError(null);
                      setJoinError(null);
                    }}
                    placeholder="Ex: X7K2M9QP"
                    maxLength={8}
                    className="copa-input flex-1 px-4 py-3 text-sm font-mono tracking-widest uppercase"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={searching || code.trim().length < 8}
                    className="copa-btn-primary px-4 py-3 text-sm flex items-center gap-2 shrink-0"
                  >
                    {searching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Buscar
                  </button>
                </div>
                {searchError && (
                  <p className="text-red-400 text-xs">{searchError}</p>
                )}
              </div>
            </form>

            {/* Group preview */}
            {preview && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  {/* Group name & owner */}
                  <div>
                    <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">Grupo encontrado</p>
                    <h3 className="text-xl font-bold text-white">{preview.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Crown className="w-3.5 h-3.5 text-[#ffd700]" />
                      <span className="text-sm text-white/60">
                        Criado por <strong className="text-white/80">{preview.owner.name}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Member bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white/60">Participantes</span>
                      </div>
                      <span className={`text-sm font-semibold ${preview.isFull ? "text-red-400" : "text-white"}`}>
                        {preview.memberCount} / {preview.maxMembers}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          preview.isFull ? "bg-red-500" : occupancy > 75 ? "bg-amber-400" : "bg-emerald-500"
                        }`}
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>

                  {/* Status alerts */}
                  {preview.isFull && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/25">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-red-300 text-sm">Este grupo atingiu o limite máximo de participantes</p>
                    </div>
                  )}
                  {preview.alreadyMember && !preview.isFull && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/25">
                      <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className="text-blue-300 text-sm">Você já faz parte deste grupo</p>
                    </div>
                  )}
                </div>

                {joinError && (
                  <p className="text-red-400 text-sm">{joinError}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setPreview(null); setCode(""); }}
                    className="copa-btn-ghost flex-1 py-3 text-sm"
                  >
                    Buscar outro
                  </button>
                  <button
                    onClick={handleJoin}
                    disabled={joining || preview.isFull || preview.alreadyMember}
                    className="copa-btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Confirmar e Entrar"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Initial hint */}
            {!preview && !searching && !searchError && (
              <div className="flex flex-col items-center py-4 text-center text-white/40">
                <Search className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Digite o código de 8 caracteres e clique em Buscar</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
