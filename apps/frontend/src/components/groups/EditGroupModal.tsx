"use client";

import { useState } from "react";
import { X, Settings, Loader2 } from "lucide-react";
import { groupsApi, GroupData } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface Props {
  group: GroupData;
  onClose: () => void;
  onUpdated: (group: GroupData) => void;
}

export default function EditGroupModal({ group, onClose, onUpdated }: Props) {
  const toast = useToast();
  const [name, setName] = useState(group.name);
  const [pixKey, setPixKey] = useState(group.pixKey || "");
  
  // Format initial fee for display as BRL cents (e.g. 50.00 -> "50,00")
  const initialFeeFormatted = group.entryFee !== undefined && group.entryFee !== null
    ? group.entryFee.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";

  const [entryFee, setEntryFee] = useState(initialFeeFormatted);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      let parsedFee: number | null = null;
      if (entryFee) {
        const numericString = entryFee.replace(/\./g, "").replace(",", ".");
        parsedFee = parseFloat(numericString);
      }

      const updated = await groupsApi.updateGroup(group.id, {
        name: name.trim(),
        pixKey: pixKey.trim() || null,
        entryFee: parsedFee,
      });

      toast.success("Grupo atualizado com sucesso!");
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar grupo");
    } finally {
      setLoading(false);
    }
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
              <Settings className="w-5 h-5 text-[#ffd700]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Editar Grupo</h2>
              <p className="text-xs text-white/50">Atualizar informações do bolão</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="edit-group-name" className="block text-sm font-medium text-white/70">
              Nome do Grupo
            </label>
            <input
              id="edit-group-name"
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
            <label htmlFor="edit-group-pix" className="block text-sm font-medium text-white/70">
              Chave Pix ou Código Copia e Cola (Opcional)
            </label>
            <input
              id="edit-group-pix"
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, celular, e-mail ou código Pix Copia e Cola"
              className="copa-input w-full px-4 py-3 text-sm"
            />
            <p className="text-[10px] text-white/40 font-semibold leading-normal">
              Use para facilitar a arrecadação da taxa de inscrição do bolão. O QR Code será atualizado e exibido no painel do grupo.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-group-fee" className="block text-sm font-medium text-white/70">
              Valor de Entrada (Opcional)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-white/40 text-sm select-none font-semibold">R$</span>
              <input
                id="edit-group-fee"
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
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
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
