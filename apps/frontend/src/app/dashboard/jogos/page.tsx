"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { CalendarDays, Loader2, AlertCircle, RefreshCw, Trophy, Edit2, Save, X, ShieldAlert, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { predictionsApi, matchesApi } from "@/lib/api";
import type { MatchPredictionData } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const ALL_GROUPS = [
  "Grupo A", "Grupo B", "Grupo C", "Grupo D", "Grupo E", "Grupo F",
  "Grupo G", "Grupo H", "Grupo I", "Grupo J", "Grupo K", "Grupo L",
  "Dezesseisavos de Final", "Oitavas de Final", "Quartas de Final", "Semifinais", "Terceiro Lugar", "Final"
];

const GRUPOS_SUB = [
  "ALL_GRUPOS", "Grupo A", "Grupo B", "Grupo C", "Grupo D", "Grupo E", "Grupo F",
  "Grupo G", "Grupo H", "Grupo I", "Grupo J", "Grupo K", "Grupo L"
];

const MATA_MATA_SUB = [
  "ALL_MATA_MATA", "Dezesseisavos de Final", "Oitavas de Final", "Quartas de Final", "Semifinais", "Terceiro Lugar", "Final"
];

const ITEMS_PER_PAGE = 9;

export default function CopaGamesPage() {
  const toast = useToast();
  const [grouped, setGrouped] = useState<Record<string, MatchPredictionData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected filter tab: "ALL" or specific group
  const [activeCategory, setActiveCategory] = useState<"GRUPOS" | "MATA_MATA">("GRUPOS");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL_GRUPOS");

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active filter tab into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedGroup, activeCategory]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [userPaginating, setUserPaginating] = useState(false);



  const handlePrevSub = () => {
    if (activeCategory === "GRUPOS") {
      const idx = GRUPOS_SUB.indexOf(selectedGroup);
      if (idx > 0) {
        setSelectedGroup(GRUPOS_SUB[idx - 1]);
        setUserPaginating(false);
      }
    } else {
      const idx = MATA_MATA_SUB.indexOf(selectedGroup);
      if (idx > 0) {
        setSelectedGroup(MATA_MATA_SUB[idx - 1]);
        setUserPaginating(false);
      }
    }
  };

  const handleNextSub = () => {
    if (activeCategory === "GRUPOS") {
      const idx = GRUPOS_SUB.indexOf(selectedGroup);
      if (idx !== -1 && idx < GRUPOS_SUB.length - 1) {
        setSelectedGroup(GRUPOS_SUB[idx + 1]);
        setUserPaginating(false);
      }
    } else {
      const idx = MATA_MATA_SUB.indexOf(selectedGroup);
      if (idx !== -1 && idx < MATA_MATA_SUB.length - 1) {
        setSelectedGroup(MATA_MATA_SUB[idx + 1]);
        setUserPaginating(false);
      }
    }
  };

  // Admin controls
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editHomeScore, setEditHomeScore] = useState<string>("");
  const [editAwayScore, setEditAwayScore] = useState<string>("");
  const [editHomePenalties, setEditHomePenalties] = useState<string>("");
  const [editAwayPenalties, setEditAwayPenalties] = useState<string>("");
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await matchesApi.getMatches();
      setGrouped(data);

      const allMatches = Object.values(data).flat();
      const sortedMatches = [...allMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const groupMatches = allMatches.filter(m => m.stage.startsWith("Grupo"));
      const isGroupStageFinished = groupMatches.length > 0 && groupMatches.every(m => m.status === "FINISHED");
      
      const nextMatch = sortedMatches.find(m => m.status !== "FINISHED");
      const nextMatchIsKnockout = nextMatch && !nextMatch.stage.startsWith("Grupo");
      
      if (isGroupStageFinished || nextMatchIsKnockout) {
        setActiveCategory("MATA_MATA");
        setSelectedGroup("ALL_MATA_MATA");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar os jogos da Copa.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("copa_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.role === "ADMIN") {
            setIsAdmin(true);
          }
        } catch (e) {}
      }
    }
  }, []);

  // Reset pagination when selected group filter changes
  useEffect(() => {
    setUserPaginating(false);
  }, [selectedGroup, activeCategory]);

  function startEditing(game: MatchPredictionData) {
    setEditingMatchId(game.id);
    setEditHomeScore(game.realHomeScore !== null ? String(game.realHomeScore) : "");
    setEditAwayScore(game.realAwayScore !== null ? String(game.realAwayScore) : "");
    setEditHomePenalties(game.homePenalties !== null && game.homePenalties !== undefined ? String(game.homePenalties) : "");
    setEditAwayPenalties(game.awayPenalties !== null && game.awayPenalties !== undefined ? String(game.awayPenalties) : "");
  }

  async function handleSaveScore(game: MatchPredictionData) {
    const homeVal = parseInt(editHomeScore, 10);
    const awayVal = parseInt(editAwayScore, 10);
    const isKnockout = !game.stage.startsWith("Fase de Grupos");
    const homePenVal = parseInt(editHomePenalties, 10);
    const awayPenVal = parseInt(editAwayPenalties, 10);

    if (isNaN(homeVal) || isNaN(awayVal) || homeVal < 0 || awayVal < 0) {
      toast.warning("Por favor, insira placares válidos maiores ou iguais a 0.");
      return;
    }

    if (isKnockout && homeVal === awayVal) {
      if (isNaN(homePenVal) || isNaN(awayPenVal) || homePenVal < 0 || awayPenVal < 0) {
        toast.warning("Para empates no mata-mata, informe os pênaltis.");
        return;
      }
      if (homePenVal === awayPenVal) {
        toast.warning("Disputas de pênaltis não podem terminar empatadas.");
        return;
      }
    }

    setSubmittingMatchId(game.id);
    try {
      await predictionsApi.updateMatchScore(
        game.id, 
        homeVal, 
        awayVal, 
        isKnockout && homeVal === awayVal ? homePenVal : undefined, 
        isKnockout && homeVal === awayVal ? awayPenVal : undefined
      );
      // reload
      const data = await matchesApi.getMatches();
      setGrouped(data);
      setEditingMatchId(null);
      toast.success("Placar oficial salvo com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar o placar oficial.");
    } finally {
      setSubmittingMatchId(null);
    }
  }



  // Ordenação garantindo que a Fase Final fique por último
  const sortedGroupKeys = Object.keys(grouped).sort((a, b) => {
    const idxA = ALL_GROUPS.indexOf(a);
    const idxB = ALL_GROUPS.indexOf(b);
    const valA = idxA === -1 ? 999 : idxA;
    const valB = idxB === -1 ? 999 : idxB;
    return valA - valB;
  });

  const filteredGroups = useMemo(() => {
    if (activeCategory === "GRUPOS") {
      if (selectedGroup === "ALL_GRUPOS" || !selectedGroup.startsWith("Grupo")) {
        return sortedGroupKeys.filter((k) => k.startsWith("Grupo"));
      }
      return [selectedGroup];
    } else {
      if (selectedGroup === "ALL_MATA_MATA" || selectedGroup.startsWith("Grupo")) {
        return sortedGroupKeys.filter((k) => !k.startsWith("Grupo"));
      }
      return [selectedGroup];
    }
  }, [activeCategory, selectedGroup, sortedGroupKeys]);

  // Aplanar todos os confrontos dos grupos selecionados em uma única lista cronológica
  const allFilteredMatches = useMemo(() => {
    const matches: { groupName: string; match: MatchPredictionData }[] = [];
    filteredGroups.forEach((gName) => {
      const gMatches = grouped[gName] || [];
      gMatches.forEach((m) => {
        matches.push({ groupName: gName, match: m });
      });
    });
    // Ordenação estritamente crescente por data e horário
    matches.sort((a, b) => new Date(a.match.date).getTime() - new Date(b.match.date).getTime());
    return matches;
  }, [filteredGroups, grouped]);

  useEffect(() => {
    if (!userPaginating && allFilteredMatches.length > 0) {
      const index = allFilteredMatches.findIndex((m) => m.match.status !== "FINISHED");
      if (index !== -1) {
        setCurrentPage(Math.floor(index / ITEMS_PER_PAGE) + 1);
      } else {
        const lastPage = Math.ceil(allFilteredMatches.length / ITEMS_PER_PAGE) || 1;
        setCurrentPage(lastPage);
      }
    }
  }, [allFilteredMatches, userPaginating]);

  // Lógica de Paginação
  const totalItems = allFilteredMatches.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMatches = allFilteredMatches.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/50">
        <Loader2 className="w-10 h-10 animate-spin text-[#ffd700] mb-4" />
        <p className="text-sm font-semibold">Carregando tabela de jogos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Ops! Ocorreu um erro</h2>
        <p className="text-red-400 mb-6 max-w-md">{error}</p>
        <button
          onClick={loadData}
          className="copa-btn-ghost px-6 py-2.5 text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-[#ffd700] shrink-0" />
            Jogos da Copa 2026
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-white/60">
              Calendário completo, tabela de confrontos e resultados oficiais da Copa do Mundo.
            </p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/25 animate-pulse ml-2">
                <ShieldAlert className="w-3 h-3" />
                Admin
              </span>
            )}
          </div>
        </div>
        <button
          onClick={loadData}
          className="copa-btn-ghost px-4 py-2.5 min-h-11 text-xs flex items-center gap-1.5 self-start sm:self-auto"
          title="Atualizar dados"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar Tabela
        </button>
      </div>

       {/* Category Toggle (Fase de Grupos vs Mata-Mata) */}
      <div className="flex justify-center">
        <div className="bg-black/45 p-1 rounded-2xl border border-white/5 flex gap-1 shadow-inner shadow-black">
          <button
            onClick={() => {
              setActiveCategory("GRUPOS");
              setSelectedGroup("ALL_GRUPOS");
              setUserPaginating(false);
            }}
            className={`px-6 py-2.5 min-h-11 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer ${
              activeCategory === "GRUPOS"
                ? "bg-gradient-to-r from-[#ffd700] to-[#f5c800] text-[#0d2b1a] shadow-[0_4px_16px_rgba(255,215,0,0.15)] scale-102"
                : "bg-transparent text-white/50 hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            <Trophy className="w-4 h-4 shrink-0" />
            Fase de Grupos
          </button>
          <button
            onClick={() => {
              setActiveCategory("MATA_MATA");
              setSelectedGroup("ALL_MATA_MATA");
              setUserPaginating(false);
            }}
            className={`px-6 py-2.5 min-h-11 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer ${
              activeCategory === "MATA_MATA"
                ? "bg-gradient-to-r from-[#ffd700] to-[#f5c800] text-[#0d2b1a] shadow-[0_4px_16px_rgba(255,215,0,0.15)] scale-102"
                : "bg-transparent text-white/50 hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            <CalendarDays className="w-4 h-4 shrink-0" />
            Mata-Mata
          </button>
        </div>
      </div>

      {/* Sub-Filters based on Active Category with Prev/Next Chevrons */}
      <div className="flex items-center gap-2 max-w-full justify-center">
        <button
          onClick={handlePrevSub}
          disabled={activeCategory === "GRUPOS" ? selectedGroup === "ALL_GRUPOS" : selectedGroup === "ALL_MATA_MATA"}
          className="p-3 min-h-11 min-w-11 rounded-xl border border-white/5 bg-black/30 hover:bg-black/50 text-white hover:text-[#ffd700] disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 shrink-0 cursor-pointer shadow-md"
          title="Fase anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 overflow-hidden min-w-0">
          {activeCategory === "GRUPOS" ? (
            <div 
              ref={scrollContainerRef}
              className="bg-black/20 p-2 rounded-2xl border border-white/5 flex gap-2 overflow-x-auto copa-scrollbar max-w-full justify-start"
            >
              <button
                onClick={() => {
                  setSelectedGroup("ALL_GRUPOS");
                  setUserPaginating(false);
                }}
                data-active={selectedGroup === "ALL_GRUPOS"}
                className={`px-4 py-2.5 min-h-11 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 shrink-0 cursor-pointer whitespace-nowrap ${
                  selectedGroup === "ALL_GRUPOS"
                    ? "bg-white/10 text-[#ffd700] border border-[#ffd700]/30 shadow-[0_2px_10px_rgba(255,215,0,0.05)] scale-102"
                    : "bg-white/[0.02] hover:bg-white/[0.06] text-white/50 hover:text-white border border-white/5"
                }`}
              >
                Todos os Grupos
              </button>
              {["Grupo A", "Grupo B", "Grupo C", "Grupo D", "Grupo E", "Grupo F", "Grupo G", "Grupo H", "Grupo I", "Grupo J", "Grupo K", "Grupo L"].map((gKey) => (
                <button
                  key={gKey}
                  onClick={() => {
                    setSelectedGroup(gKey);
                    setUserPaginating(false);
                  }}
                  data-active={selectedGroup === gKey}
                  className={`px-5 py-2.5 min-h-11 rounded-xl text-xs font-black tracking-wider transition-all duration-300 shrink-0 cursor-pointer min-w-[50px] text-center whitespace-nowrap ${
                    selectedGroup === gKey
                      ? "bg-white/10 text-[#ffd700] border border-[#ffd700]/30 shadow-[0_2px_10px_rgba(255,215,0,0.05)] scale-102"
                      : "bg-white/[0.02] hover:bg-white/[0.06] text-white/50 hover:text-white border border-white/5"
                  }`}
                >
                  {gKey.replace("Grupo ", "GRUPO ")}
                </button>
              ))}
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              className="bg-black/20 p-2 rounded-2xl border border-white/5 flex gap-2 overflow-x-auto copa-scrollbar max-w-full justify-start"
            >
              <button
                onClick={() => {
                  setSelectedGroup("ALL_MATA_MATA");
                  setUserPaginating(false);
                }}
                data-active={selectedGroup === "ALL_MATA_MATA"}
                className={`px-4 py-2.5 min-h-11 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 shrink-0 cursor-pointer whitespace-nowrap ${
                  selectedGroup === "ALL_MATA_MATA"
                    ? "bg-white/10 text-[#ffd700] border border-[#ffd700]/30 shadow-[0_2px_10px_rgba(255,215,0,0.05)] scale-102"
                    : "bg-white/[0.02] hover:bg-white/[0.06] text-white/50 hover:text-white border border-white/5"
                }`}
              >
                Todo o Mata-Mata
              </button>
              {["Dezesseisavos de Final", "Oitavas de Final", "Quartas de Final", "Semifinais", "Terceiro Lugar", "Final"].map((gKey) => (
                <button
                  key={gKey}
                  onClick={() => {
                    setSelectedGroup(gKey);
                    setUserPaginating(false);
                  }}
                  data-active={selectedGroup === gKey}
                  className={`px-4 py-2.5 min-h-11 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 shrink-0 cursor-pointer whitespace-nowrap ${
                    selectedGroup === gKey
                      ? "bg-white/10 text-[#ffd700] border border-[#ffd700]/30 shadow-[0_2px_10px_rgba(255,215,0,0.05)] scale-102"
                      : "bg-white/[0.02] hover:bg-white/[0.06] text-white/50 hover:text-white border border-white/5"
                  }`}
                >
                  {gKey}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleNextSub}
          disabled={activeCategory === "GRUPOS" ? selectedGroup === "Grupo L" : selectedGroup === "Final"}
          className="p-3 min-h-11 min-w-11 rounded-xl border border-white/5 bg-black/30 hover:bg-black/50 text-white hover:text-[#ffd700] disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 shrink-0 cursor-pointer shadow-md"
          title="Próxima fase"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main List Grid */}
      <div className="space-y-6">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02]">
              <CalendarDays className="w-32 h-32 text-white" />
            </div>
            <CalendarDays className="w-12 h-12 text-white/20 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Nenhum confronto agendado</h3>
            <p className="text-xs text-white/50 max-w-sm leading-relaxed">
              Não existem partidas cadastradas nesta fase da Copa.
            </p>
          </div>
        ) : (
          <>
            {/* Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {paginatedMatches.map(({ groupName, match: game }) => {
                const isFinished = game.status === "FINISHED";
                const isLive = game.status === "LIVE";

                return (
                  <div
                    key={game.id}
                    className={`auth-card p-0 rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between min-h-[200px] bg-[#0a0f1e]/40 ${
                      isLive 
                        ? "border-emerald-500/30 bg-[#0d2b1a]/20 shadow-[0_0_20px_rgba(16,185,129,0.08)] hover:border-emerald-500/50 hover:-translate-y-1"
                        : isFinished 
                          ? "border-white/5 opacity-90 hover:border-white/10" 
                          : "border-white/5 hover:border-[#ffd700]/25 hover:bg-[#0d2b1a]/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#ffd700]/5"
                    }`}
                  >
                    {/* Top Info Banner */}
                    <div className="bg-black/35 px-4 py-2.5 text-[10px] text-white/40 flex justify-between items-center border-b border-white/5 font-black uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[#ffd700] tracking-widest">{groupName}</span>
                        <span className="text-white/20">•</span>
                        <span>{new Date(game.date).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{game.stadium && ` • ${game.stadium}`}</span>
                      </span>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ao Vivo
                        </span>
                      ) : isFinished ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Finalizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/15 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Pendente
                        </span>
                      )}
                    </div>

                    {/* Main Match Scores Area */}
                    <div className="p-5 flex items-center justify-between gap-4 flex-1">
                      {/* Home Team */}
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden mb-2 flex items-center justify-center font-black border border-white/15 bg-black/40 shrink-0 shadow-md team-flag-shell-3d">
                          {game.homeTeam.flag ? (
                            <img src={game.homeTeam.flag} alt={game.homeTeam.code} className="w-full h-full object-cover team-flag-3d" />
                          ) : (
                            game.homeTeam.code
                          )}
                        </div>
                        <span 
                          className="font-bold text-[10px] md:text-[11px] text-white text-center w-full uppercase tracking-wide cursor-help whitespace-normal break-words"
                          title={game.homeTeam.name}
                        >
                          {game.homeTeam.name}
                        </span>
                      </div>

                      {/* Scores Box */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0 min-w-[100px]">
                        {editingMatchId === game.id ? (
                          <div className="flex flex-col items-center gap-2 bg-black/40 p-2 rounded-2xl border border-[#ffd700]/30 shadow-inner">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={editHomeScore}
                                onChange={(e) => setEditHomeScore(e.target.value)}
                                className="w-10 h-10 rounded-xl bg-black/80 border border-[#ffd700]/40 text-center text-white font-black text-sm focus:outline-none focus:border-[#ffd700] focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                              />
                              <span className="text-white/20 font-bold text-xs">x</span>
                              <input
                                type="number"
                                min="0"
                                value={editAwayScore}
                                onChange={(e) => setEditAwayScore(e.target.value)}
                                className="w-10 h-10 rounded-xl bg-black/80 border border-[#ffd700]/40 text-center text-white font-black text-sm focus:outline-none focus:border-[#ffd700] focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                              />
                            </div>
                            
                            {editHomeScore !== "" && editAwayScore !== "" && editHomeScore === editAwayScore && !game.stage.startsWith("Fase") && (
                              <div className="flex flex-col items-center gap-1 w-full mt-1 bg-black/60 p-2 rounded-xl border border-white/10">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#ffd700]">Pênaltis</span>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    value={editHomePenalties}
                                    onChange={(e) => setEditHomePenalties(e.target.value)}
                                    className="w-11 h-11 rounded-lg bg-black/80 border border-white/20 text-center text-[#ffd700] font-black text-sm focus:outline-none focus:border-[#ffd700] focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="text-white/20 font-bold text-xs">x</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editAwayPenalties}
                                    onChange={(e) => setEditAwayPenalties(e.target.value)}
                                    className="w-11 h-11 rounded-lg bg-black/80 border border-white/20 text-center text-[#ffd700] font-black text-sm focus:outline-none focus:border-[#ffd700] focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 w-full justify-center">
                              <button
                                onClick={() => handleSaveScore(game)}
                                disabled={submittingMatchId === game.id}
                                className="w-11 h-11 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-md"
                                title="Confirmar Placar"
                              >
                                {submittingMatchId === game.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingMatchId(null)}
                                disabled={submittingMatchId === game.id}
                                className="w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 text-white/75 transition-all cursor-pointer flex items-center justify-center"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center gap-2.5">
                                <span className={`w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center font-black text-base shadow-inner ${
                                  (isFinished || isLive) && game.realHomeScore !== null ? "text-[#ffd700]" : "text-white/25"
                                }`}>
                                  {game.realHomeScore !== null ? game.realHomeScore : "—"}
                                </span>
                                <span className="text-white/20 font-bold text-xs">x</span>
                                <span className={`w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center font-black text-base shadow-inner ${
                                  (isFinished || isLive) && game.realAwayScore !== null ? "text-[#ffd700]" : "text-white/25"
                                }`}>
                                  {game.realAwayScore !== null ? game.realAwayScore : "—"}
                                </span>
                              </div>
                              {game.homePenalties != null && game.awayPenalties != null && (
                                <span className="text-[10px] font-bold text-white/50 tracking-wider">
                                  (Pên: {game.homePenalties} - {game.awayPenalties})
                                </span>
                              )}
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => startEditing(game)}
                                className="text-[10px] text-[#ffd700] hover:text-[#0d2b1a] font-bold flex items-center gap-1 mt-2 transition-all uppercase tracking-wider bg-[#ffd700]/10 hover:bg-[#ffd700] px-3 py-1.5 rounded-lg border border-[#ffd700]/25 cursor-pointer shadow-sm active:scale-98"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                                Placar
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden mb-2 flex items-center justify-center font-black border border-white/15 bg-black/40 shrink-0 shadow-md team-flag-shell-3d">
                          {game.awayTeam.flag ? (
                            <img src={game.awayTeam.flag} alt={game.awayTeam.code} className="w-full h-full object-cover team-flag-3d" />
                          ) : (
                            game.awayTeam.code
                          )}
                        </div>
                        <span 
                          className="font-bold text-[10px] md:text-[11px] text-white text-center w-full uppercase tracking-wide cursor-help whitespace-normal break-words"
                          title={game.awayTeam.name}
                        >
                          {game.awayTeam.name}
                        </span>
                      </div>
                    </div>

                    {/* Info Footer for LIVE Matches */}
                    {isLive && (
                      <div className="bg-emerald-500/[0.03] px-4 py-2 border-t border-white/5 flex justify-between items-center text-[10px] text-emerald-400 font-bold tracking-wider uppercase">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                          Partida em andamento
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-black text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse">
                          Sincronizando Ao Vivo
                        </span>
                      </div>
                    )}

                    {/* Info Footer for Finished Matches */}
                    {isFinished && (
                      <div className="bg-black/30 px-4 py-2 border-t border-white/5 flex justify-between items-center text-[10px] text-white/40 font-bold tracking-wider uppercase">
                        <span className="flex items-center gap-1.5">
                          <Trophy className="w-3 h-3 text-[#ffd700]" />
                          Resultado oficial definido
                        </span>
                        {game.predictedHomeScore !== null && game.predictedAwayScore !== null && (
                          <span className={`px-2 py-0.5 rounded-md font-black text-[10px] border ${
                            game.pointsEarned === 5 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]" :
                            game.pointsEarned === 4 ? "bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-[0_0_8px_rgba(20,184,166,0.1)]" :
                            game.pointsEarned === 3 ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]" :
                            game.pointsEarned === 1 ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]" :
                            "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            +{game.pointsEarned} Ponto{game.pointsEarned !== 1 ? "s" : ""} Obtido{game.pointsEarned !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-6 mt-6">
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                    setUserPaginating(true);
                  }}
                  disabled={currentPage === 1}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-white/5 bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-white/[0.02] disabled:hover:text-white/70 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  Anterior
                </button>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {(() => {
                      const range: (number | string)[] = [];
                      const delta = 1;
                      for (let i = 1; i <= totalPages; i++) {
                        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                          range.push(i);
                        } else if (range[range.length - 1] !== "...") {
                          range.push("...");
                        }
                      }
                      return range.map((page, idx) => {
                        if (page === "...") {
                          return (
                            <span key={`dots-${idx}`} className="px-2 text-white/40 text-xs font-bold">
                              ...
                            </span>
                          );
                        }
                        const isSelected = page === currentPage;
                        return (
                          <button
                            key={page}
                            onClick={() => {
                              setCurrentPage(page as number);
                              setUserPaginating(true);
                            }}
                            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center justify-center border ${
                              isSelected
                                ? "bg-gradient-to-br from-[#ffd700] to-[#f5c800] text-[#0d2b1a] border-[#ffd700] shadow-md shadow-[#ffd700]/15"
                                : "bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/15"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
                  </div>
                  <span className="text-xs text-white/30 font-semibold uppercase tracking-wider">
                    {totalItems} jogos no total
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    setUserPaginating(true);
                  }}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-white/5 bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-white/[0.02] disabled:hover:text-white/70 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  Próximo
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
