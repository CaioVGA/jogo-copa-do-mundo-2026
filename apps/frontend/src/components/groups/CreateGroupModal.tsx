"use client";

import { useState } from "react";
import { X, Users, Copy, Check, Loader2 } from "lucide-react";
import { groupsApi, GroupData } from "@/lib/api";

interface Props {
  onClose: () => void;
  onCreated: (group: GroupData) => void;
}

export default function CreateGroupModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<GroupData | null>(null);
  const [copied, setCopied] = useState(false);

  const handleEntryFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setEntryFee("");
      return;
    }
    const valNumber = parseFloat(digits) / 100;
    const formatted = valNumber.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setEntryFee(formatted);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError("O nome deve ter no mínimo 3 caracteres");
      return;
    }
    if (name.trim().length > 50) {
      setError("O nome deve ter no máximo 50 caracteres");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      let parsedFee: number | undefined = undefined;
      if (entryFee) {
        const numericString = entryFee.replace(/\./g, "").replace(",", ".");
        parsedFee = parseFloat(numericString);
      }
      const group = await groupsApi.createGroup(
        name.trim(),
        pixKey.trim() || undefined,
        parsedFee
      );
      setCreatedGroup(group);
      onCreated(group);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar grupo");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!createdGroup) return;
    await navigator.clipboard.writeText(createdGroup.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md auth-card p-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffd700]/15 border border-[#ffd700]/25 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#ffd700]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {createdGroup ? "Grupo Criado!" : "Criar Grupo"}
              </h2>
              <p className="text-xs text-white/50">
                {createdGroup ? "Compartilhe o código abaixo" : "Máximo de 20 participantes"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success state */}
        {createdGroup ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <p className="text-sm text-emerald-300 mb-1">Grupo criado com sucesso! 🎉</p>
              <p className="text-white font-semibold">{createdGroup.name}</p>
            </div>

            <div>
              <p className="text-sm text-white/60 mb-2">Código de Convite</p>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#ffd700]/8 border border-[#ffd700]/30">
                <span className="flex-1 font-mono text-2xl font-bold text-[#ffd700] tracking-[0.25em] text-center">
                  {createdGroup.inviteCode}
                </span>
                <button
                  onClick={handleCopy}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    copied
                      ? "bg-emerald-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-white/40 mt-2 text-center">
                Compartilhe este código para convidar outros jogadores
              </p>
            </div>

            <div className="flex items-center justify-between text-sm text-white/50 p-3 rounded-lg bg-white/5">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Participantes
              </span>
              <span className="font-semibold text-white">
                1 / {createdGroup.maxMembers}
              </span>
            </div>

            <button onClick={onClose} className="copa-btn-primary w-full py-3 text-sm">
              Fechar
            </button>
          </div>
        ) : (
          /* Creation form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="group-name" className="block text-sm font-medium text-white/70">
                Nome do Grupo
              </label>
              <input
                id="group-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Amigos do Trabalho"
                maxLength={50}
                className="copa-input w-full px-4 py-3 text-sm"
                autoFocus
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-white/40">Mínimo 3 caracteres</p>
                <p className={`text-xs ${name.length > 45 ? "text-amber-400" : "text-white/40"}`}>
                  {name.length}/50
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="group-pix" className="block text-sm font-medium text-white/70">
                Chave Pix ou Código Copia e Cola (Opcional)
              </label>
              <input
                id="group-pix"
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, celular, e-mail ou código Pix Copia e Cola"
                className="copa-input w-full px-4 py-3 text-sm"
              />
              <p className="text-[10px] text-white/40 font-semibold leading-normal">
                Use para facilitar a arrecadação da taxa de inscrição do bolão entre os participantes. O QR Code será gerado automaticamente.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="group-fee" className="block text-sm font-medium text-white/70">
                Valor de Entrada (Opcional)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-white/40 text-sm select-none font-semibold">R$</span>
                <input
                  id="group-fee"
                  type="text"
                  value={entryFee}
                  onChange={handleEntryFeeChange}
                  placeholder="0,00"
                  className="copa-input w-full pl-10 pr-4 py-3 text-sm"
                />
              </div>
              <p className="text-[10px] text-white/40 font-semibold leading-normal">
                Opcional. Defina o valor da taxa de participação neste bolão.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#ffd700]/8 border border-[#ffd700]/20">
              <Users className="w-4 h-4 text-[#ffd700] shrink-0" />
              <p className="text-xs text-white/60">
                Um código de convite será gerado automaticamente.
                <strong className="text-white/80"> Máximo 20 participantes</strong>.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="copa-btn-ghost flex-1 py-3 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || name.trim().length < 3}
                className="copa-btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Grupo"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
