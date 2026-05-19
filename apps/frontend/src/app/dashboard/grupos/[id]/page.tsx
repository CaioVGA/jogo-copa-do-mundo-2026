"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Users, ArrowLeft, Loader2, Sparkles, Target, Activity, CalendarDays, Medal, Crown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { groupsApi, teamsApi, predictionsApi } from "@/lib/api";
import { useToast, useConfirm } from "@/components/ui/toast";
import type { MatchPredictionData } from "@/lib/api";

type TabType = "geral" | "bolao" | "oraculo" | "participantes";

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

const MOCK_ORACLE_QUESTIONS = [
  { id: 1, question: "Quem será o campeão?", answer: null, options: ["Brasil", "França", "Argentina", "Inglaterra"], points: 50 },
  { id: 2, question: "Artilheiro da Copa", answer: "Mbappé", options: ["Mbappé", "Messi", "Kane", "Vini Jr"], points: 30 },
];

interface BracketMatchCardProps {
  game: MatchPredictionData;
  predScores: Record<string, { home: string; away: string }>;
  setPredScores: React.Dispatch<React.SetStateAction<Record<string, { home: string; away: string }>>>;
  savingMatchId: string | null;
  handleSavePrediction: (matchId: string) => Promise<void>;
}

function BracketMatchCard({ game, predScores, setPredScores, savingMatchId, handleSavePrediction }: BracketMatchCardProps) {
  const isFinished = game.status === "FINISHED";
  const isClosed = new Date(game.date).getTime() < Date.now();
  const saving = savingMatchId === game.id;
  
  // Deadline text
  const diffMs = new Date(game.date).getTime() - Date.now();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let deadlineText = "Aberto";
  let deadlineColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
  
  if (isClosed) {
    deadlineText = isFinished ? "Encerrado" : "Em andamento";
    deadlineColor = "text-rose-400 border-rose-500/20 bg-rose-500/10";
  } else if (diffMs > 0) {
    if (diffDays > 0) {
      deadlineText = `Faltam ${diffDays}d`;
      deadlineColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
    } else {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      deadlineText = `Encerra em ${diffHours}h`;
      deadlineColor = "text-amber-400 border-amber-500/20 bg-amber-500/10";
    }
  }

  return (
    <div className="flex flex-col bg-black/40 border border-white/5 rounded-xl overflow-hidden hover:border-[#ffd700]/25 transition-all w-60 shrink-0 select-none">
      {/* Small Header */}
      <div className="bg-black/20 px-2 py-1 flex items-center justify-between border-b border-white/5 text-[9px] text-white/40">
        <span className="truncate max-w-[120px]" title={game.stage}>{game.stage}</span>
        <span className={`px-1 rounded border font-semibold ${deadlineColor}`}>{deadlineText}</span>
      </div>
      
      {/* Teams and Scores */}
      <div className="p-2.5 flex flex-col gap-2">
        {/* Home Team Row */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center font-bold text-[8px]">
              {game.homeTeam.flag ? (
                <img src={game.homeTeam.flag} alt={game.homeTeam.code} className="w-full h-full object-cover" />
              ) : (
                game.homeTeam.code
              )}
            </div>
            <span className="text-[10px] font-bold text-white/80 truncate" title={game.homeTeam.name}>
              {game.homeTeam.name}
            </span>
          </div>
          {isClosed ? (
            <span className={`text-xs font-black shrink-0 ${isFinished ? "text-white" : "text-[#ffd700]"}`}>
              {isFinished ? game.realHomeScore : (game.predictedHomeScore ?? "-")}
            </span>
          ) : (
            <input
              type="number"
              min="0"
              placeholder="0"
              value={predScores[game.id]?.home ?? ""}
              onChange={(e) => setPredScores(prev => ({
                ...prev,
                [game.id]: {
                  ...(prev[game.id] || { home: "", away: "" }),
                  home: e.target.value
                }
              }))}
              className="w-7 h-6 text-center text-[10px] font-bold rounded bg-black/60 border border-white/10 text-white focus:border-[#ffd700] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          )}
        </div>

        {/* Away Team Row */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center font-bold text-[8px]">
              {game.awayTeam.flag ? (
                <img src={game.awayTeam.flag} alt={game.awayTeam.code} className="w-full h-full object-cover" />
              ) : (
                game.awayTeam.code
              )}
            </div>
            <span className="text-[10px] font-bold text-white/80 truncate" title={game.awayTeam.name}>
              {game.awayTeam.name}
            </span>
          </div>
          {isClosed ? (
            <span className={`text-xs font-black shrink-0 ${isFinished ? "text-white" : "text-[#ffd700]"}`}>
              {isFinished ? game.realAwayScore : (game.predictedAwayScore ?? "-")}
            </span>
          ) : (
            <input
              type="number"
              min="0"
              placeholder="0"
              value={predScores[game.id]?.away ?? ""}
              onChange={(e) => setPredScores(prev => ({
                ...prev,
                [game.id]: {
                  ...(prev[game.id] || { home: "", away: "" }),
                  away: e.target.value
                }
              }))}
              className="w-7 h-6 text-center text-[10px] font-bold rounded bg-black/60 border border-white/10 text-white focus:border-[#ffd700] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          )}
        </div>
      </div>

      {/* Footer (Save button or scored points badge) */}
      <div className="bg-black/15 p-1.5 flex justify-between items-center text-[8px] border-t border-white/5">
        {isFinished ? (
          game.predictedHomeScore !== null ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-[8px] text-white/40">Palpite: {game.predictedHomeScore}x{game.predictedAwayScore}</span>
              <span className={`text-[8px] px-1 py-0.2 rounded font-black border leading-none ${
                game.pointsEarned === 5 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                game.pointsEarned === 4 ? "text-teal-400 bg-teal-500/10 border-teal-500/20" :
                game.pointsEarned === 3 ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                game.pointsEarned === 1 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                "text-red-400 bg-red-500/10 border-red-500/20"
              }`}>
                +{game.pointsEarned} pts
              </span>
            </div>
          ) : (
            <span className="text-white/35 italic">Sem palpite</span>
          )
        ) : !isClosed ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-white/40 truncate max-w-[100px]">
              {game.predictedHomeScore !== null ? (
                <span className="text-emerald-400 font-semibold">Salvo: {game.predictedHomeScore}x{game.predictedAwayScore}</span>
              ) : (
                "Não palpitado"
              )}
            </span>
            <button
              disabled={saving}
              onClick={() => handleSavePrediction(game.id)}
              className="bg-[#ffd700] hover:bg-[#f5c800] text-[#0d2b1a] px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all disabled:opacity-40"
            >
              {saving ? "..." : "Salvar"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-white/30 italic">Previsão fechada</span>
            {game.predictedHomeScore !== null ? (
              <span className="text-[#ffd700] font-semibold">Seu: {game.predictedHomeScore}x{game.predictedAwayScore}</span>
            ) : (
              <span className="text-white/35 italic">Sem palpite</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface OracleBracketCircleMatchProps {
  game: MatchPredictionData;
  savingMatchId: string | null;
  handleSavePredictionDirect: (matchId: string, homeScore: number, awayScore: number) => Promise<void>;
}

function OracleBracketCircleMatch({ game, savingMatchId, handleSavePredictionDirect }: OracleBracketCircleMatchProps) {
  const isFinished = game.status === "FINISHED";
  const isClosed = new Date(game.date).getTime() < Date.now();
  const saving = savingMatchId === game.id;

  const homePredicted = game.predictedHomeScore !== null && game.predictedAwayScore !== null && game.predictedHomeScore > game.predictedAwayScore;
  const awayPredicted = game.predictedHomeScore !== null && game.predictedAwayScore !== null && game.predictedHomeScore < game.predictedAwayScore;

  const homeWon = isFinished && game.realHomeScore !== null && game.realAwayScore !== null && game.realHomeScore > game.realAwayScore;
  const awayWon = isFinished && game.realHomeScore !== null && game.realAwayScore !== null && game.realHomeScore < game.realAwayScore;

  const handleSelectTeam = async (isHome: boolean) => {
    if (isClosed || saving) return;
    const homeScore = isHome ? 1 : 0;
    const awayScore = isHome ? 0 : 1;
    await handleSavePredictionDirect(game.id, homeScore, awayScore);
  };

  const renderTeamCircle = (isHome: boolean) => {
    const team = isHome ? game.homeTeam : game.awayTeam;
    const teamName = isHome ? game.homeTeam?.name : game.awayTeam?.name;
    const isSelected = isHome ? homePredicted : awayPredicted;
    const isWinner = isHome ? homeWon : awayWon;
    const isUndecided = !team || !team.code || teamName?.startsWith("Vencedor") || teamName?.startsWith("Perdedor");

    if (isUndecided) {
      return (
        <div className="flex flex-col items-center gap-1 group relative">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center text-white/30 text-xs font-black select-none">
            ?
          </div>
          <span className="text-[8px] font-bold text-white/30 uppercase tracking-wide truncate max-w-[50px]">
            {teamName?.replace("Vencedor", "Venc.").replace("Perdedor", "Perd.") || "A definir"}
          </span>
        </div>
      );
    }

    return (
      <button
        type="button"
        disabled={isClosed || saving}
        onClick={() => handleSelectTeam(isHome)}
        className={`flex flex-col items-center gap-1 group relative transition-all duration-300 focus:outline-none ${
          isClosed ? "cursor-default" : "cursor-pointer hover:scale-105 active:scale-95"
        }`}
      >
        <div
          className={`w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 relative transition-all duration-300 bg-[#0d2b1a] flex items-center justify-center ${
            isSelected
              ? "border-[#ffd700] ring-4 ring-[#ffd700]/30 shadow-lg shadow-[#ffd700]/20 scale-105"
              : isWinner
              ? "border-emerald-400 ring-2 ring-emerald-500/20"
              : "border-white/10 group-hover:border-white/30"
          }`}
        >
          {team.flag ? (
            <img src={team.flag} alt={team.code} className="w-full h-full object-cover animate-fade-in" />
          ) : (
            <span className="text-white font-black text-[10px]">{team.code}</span>
          )}

          {isSelected && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center animate-fade-in">
              <span className="text-[#ffd700] text-xs font-black">✓</span>
            </div>
          )}

          {saving && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-[#ffd700] animate-spin" />
            </div>
          )}
        </div>

        <span
          className={`text-[9px] font-black px-1.5 py-0.5 rounded transition-all duration-300 uppercase ${
            isSelected
              ? "bg-[#ffd700] text-[#0d2b1a] shadow"
              : "bg-black/40 text-white/70 group-hover:text-white"
          }`}
        >
          {team.code}
        </span>

        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
          <div className="bg-black/90 border border-white/10 text-white text-[9px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap">
            {team.name}
          </div>
          <div className="w-1.5 h-1.5 bg-black border-r border-b border-white/10 rotate-45 -mt-1" />
        </div>
      </button>
    );
  };

  const correctPrediction = (homePredicted && homeWon) || (awayPredicted && awayWon);

  return (
    <div className="flex flex-col items-center bg-black/25 border border-white/5 rounded-2xl p-2 px-3.5 hover:border-[#ffd700]/10 transition-all duration-300 w-20 shrink-0 relative select-none">
      {renderTeamCircle(true)}

      <div className="my-1.5 flex flex-col items-center relative z-10">
        <div className="w-0.5 h-3 bg-white/10" />
        {isFinished ? (
          <div className={`text-[8px] font-black px-1 py-0.2 rounded-full border leading-none -my-1 whitespace-nowrap bg-black z-20 ${
            correctPrediction
              ? "text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10"
              : "text-red-400 border-red-500/30"
          }`}>
            {game.realHomeScore}-{game.realAwayScore}
          </div>
        ) : (
          <div className="text-[7px] font-black text-white/30 tracking-widest uppercase bg-black px-1 rounded-full border border-white/5 -my-1 z-20">
            vs
          </div>
        )}
        <div className="w-0.5 h-3 bg-white/10" />

        {isFinished && game.predictedHomeScore !== null && (
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 z-20 animate-bounce">
            <span className={`text-[8px] px-1 py-0.5 rounded font-black border leading-none ${
              correctPrediction
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-sm shadow-emerald-500/20"
                : "text-red-400 bg-red-500/10 border-red-500/20"
            }`}>
              {correctPrediction ? "+4 pts" : "0 pts"}
            </span>
          </div>
        )}
      </div>

      {renderTeamCircle(false)}
    </div>
  );
}

export default function GroupDetailsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("geral");
  const [teams, setTeams] = useState<Record<string, string>>({});
  const [oracleGroups, setOracleGroups] = useState<Record<string, any[]>>({});
  const [savingOracle, setSavingOracle] = useState(false);
  const [oracleMessage, setOracleMessage] = useState<string | null>(null);
  const [isGroupStageFinished, setIsGroupStageFinished] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ groupName: string; index: number } | null>(null);
  const [oracleSubTab, setOracleSubTab] = useState<"grupos" | "matamata">("grupos");
  const [bracketRound, setBracketRound] = useState<"all" | "r32" | "r16" | "r8" | "r4" | "r2">("all");

  // Real games state
  const [games, setGames] = useState<MatchPredictionData[]>([]);
  const [predScores, setPredScores] = useState<Record<string, { home: string; away: string }>>({});
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);

  // Paginação dos palpites na aba Geral
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedGames = games.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(games.length / ITEMS_PER_PAGE) || 1;

  // Filtros da aba Bolão (Fase de Grupos vs Mata-Mata)
  const [bolaoCategory, setBolaoCategory] = useState<"GRUPOS" | "MATA_MATA">("GRUPOS");
  const [bolaoSelectedGroup, setBolaoSelectedGroup] = useState<string>("ALL_GRUPOS");
  const bolaoScrollContainerRef = useRef<HTMLDivElement>(null);

  // Paginação dos palpites na aba Bolão
  const [bolaoPage, setBolaoPage] = useState(1);

  // Auto-scroll the active filter tab in Bolão into view
  useEffect(() => {
    if (bolaoScrollContainerRef.current) {
      const activeElement = bolaoScrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [bolaoSelectedGroup, bolaoCategory, activeTab]);

  // Reset pagination when selected group filter changes
  useEffect(() => {
    setBolaoPage(1);
  }, [bolaoSelectedGroup, bolaoCategory]);

  // Derivação dos jogos do bolão com agrupamento e filtragem
  const getGroupName = (game: MatchPredictionData) => {
    if (game.stage && game.stage.startsWith('Fase de Grupos') && game.homeTeam?.group) {
      return `Grupo ${game.homeTeam.group}`;
    }
    return game.stage || 'Fase Final';
  };

  const groupedGames = games.reduce<Record<string, MatchPredictionData[]>>((acc, game) => {
    const groupName = getGroupName(game);
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(game);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedGames).sort((a, b) => {
    const idxA = ALL_GROUPS.indexOf(a);
    const idxB = ALL_GROUPS.indexOf(b);
    const valA = idxA === -1 ? 999 : idxA;
    const valB = idxB === -1 ? 999 : idxB;
    return valA - valB;
  });

  const filteredBolaoGroups = (() => {
    if (bolaoCategory === "GRUPOS") {
      if (bolaoSelectedGroup === "ALL_GRUPOS" || !bolaoSelectedGroup.startsWith("Grupo")) {
        return sortedGroupKeys.filter((k) => k.startsWith("Grupo"));
      }
      return [bolaoSelectedGroup];
    } else {
      if (bolaoSelectedGroup === "ALL_MATA_MATA" || bolaoSelectedGroup.startsWith("Grupo")) {
        return sortedGroupKeys.filter((k) => !k.startsWith("Grupo"));
      }
      return [bolaoSelectedGroup];
    }
  })();

  const allFilteredBolaoMatches: MatchPredictionData[] = [];
  filteredBolaoGroups.forEach((gName) => {
    const matches = groupedGames[gName] || [];
    allFilteredBolaoMatches.push(...matches);
  });

  // Sort filtered matches strictly by date
  allFilteredBolaoMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const bolaoStartIndex = (bolaoPage - 1) * ITEMS_PER_PAGE;
  const paginatedBolaoGames = allFilteredBolaoMatches.slice(bolaoStartIndex, bolaoStartIndex + ITEMS_PER_PAGE);
  const bolaoTotalPages = Math.ceil(allFilteredBolaoMatches.length / ITEMS_PER_PAGE) || 1;

  const handleBolaoPrevSub = () => {
    if (bolaoCategory === "GRUPOS") {
      const idx = GRUPOS_SUB.indexOf(bolaoSelectedGroup);
      if (idx > 0) {
        setBolaoSelectedGroup(GRUPOS_SUB[idx - 1]);
      }
    } else {
      const idx = MATA_MATA_SUB.indexOf(bolaoSelectedGroup);
      if (idx > 0) {
        setBolaoSelectedGroup(MATA_MATA_SUB[idx - 1]);
      }
    }
  };

  const handleBolaoNextSub = () => {
    if (bolaoCategory === "GRUPOS") {
      const idx = GRUPOS_SUB.indexOf(bolaoSelectedGroup);
      if (idx !== -1 && idx < GRUPOS_SUB.length - 1) {
        setBolaoSelectedGroup(GRUPOS_SUB[idx + 1]);
      }
    } else {
      const idx = MATA_MATA_SUB.indexOf(bolaoSelectedGroup);
      if (idx !== -1 && idx < MATA_MATA_SUB.length - 1) {
        setBolaoSelectedGroup(MATA_MATA_SUB[idx + 1]);
      }
    }
  };

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("copa_user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  useEffect(() => {
    async function loadGroup() {
      try {
        const data = await groupsApi.getGroupById(groupId);
        setGroup(data);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar grupo");
      } finally {
        setLoading(false);
      }
    }
    async function loadTeams() {
      try {
        const data = await teamsApi.getTeams();
        const mapping: Record<string, string> = {};
        data.forEach((t) => {
          if (t.flag) mapping[t.code] = t.flag;
        });
        setTeams(mapping);
      } catch (err) {
        console.error("Erro ao carregar times:", err);
      }
    }
    async function loadOracle() {
      try {
        const data = await groupsApi.getOraclePredictions(groupId);
        setOracleGroups(data.groups);
        setIsGroupStageFinished(data.isGroupStageFinished || false);
      } catch (err) {
        console.error("Erro ao carregar oráculo:", err);
      }
    }
    async function loadGames() {
      try {
        const data = await predictionsApi.getPredictions();
        const allMatches: MatchPredictionData[] = [];
        Object.values(data).forEach((groupMatches) => {
          allMatches.push(...groupMatches);
        });
        // Ordena de forma estritamente crescente em relação a data e horário
        allMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setGames(allMatches);

        const initialScores: Record<string, { home: string; away: string }> = {};
        allMatches.forEach((m) => {
          initialScores[m.id] = {
            home: m.predictedHomeScore !== null ? String(m.predictedHomeScore) : "",
            away: m.predictedAwayScore !== null ? String(m.predictedAwayScore) : "",
          };
        });
        setPredScores(initialScores);
      } catch (err) {
        console.error("Erro ao carregar jogos reais:", err);
      }
    }

    if (groupId) {
      loadGroup();
      loadTeams();
      loadOracle();
      loadGames();
    }
  }, [groupId]);

  async function handleSavePrediction(matchId: string) {
    const scores = predScores[matchId];
    if (!scores) return;
    const homeVal = parseInt(scores.home, 10);
    const awayVal = parseInt(scores.away, 10);
    if (isNaN(homeVal) || isNaN(awayVal) || homeVal < 0 || awayVal < 0) {
      toast.warning("Por favor, preencha placares válidos maiores ou iguais a 0.");
      return;
    }

    setSavingMatchId(matchId);
    try {
      await predictionsApi.savePredictions([{ matchId, homeScore: homeVal, awayScore: awayVal }]);
      
      setGames(prevGames => 
        prevGames.map(g => 
          g.id === matchId 
            ? { ...g, predictedHomeScore: homeVal, predictedAwayScore: awayVal } 
            : g
        )
      );
      
      toast.success("Palpite salvo com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar palpite.");
    } finally {
      setSavingMatchId(null);
    }
  }

  async function handleSavePredictionDirect(matchId: string, homeScore: number, awayScore: number) {
    setSavingMatchId(matchId);
    try {
      await predictionsApi.savePredictions([{ matchId, homeScore, awayScore }]);
      
      setGames(prevGames => 
        prevGames.map(g => 
          g.id === matchId 
            ? { ...g, predictedHomeScore: homeScore, predictedAwayScore: awayScore } 
            : g
        )
      );

      setPredScores(prev => ({
        ...prev,
        [matchId]: {
          home: String(homeScore),
          away: String(awayScore)
        }
      }));
      
      toast.success("Palpite salvo com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar palpite.");
    } finally {
      setSavingMatchId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/50">
        <Loader2 className="w-10 h-10 animate-spin text-[#ffd700] mb-4" />
        <p>Carregando informações do grupo...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Ops! Ocorreu um erro</h2>
        <p className="text-red-400 mb-6">{error || "Grupo não encontrado"}</p>
        <button onClick={() => router.push("/dashboard/grupos")} className="copa-btn-ghost px-6 py-2">
          Voltar para Grupos
        </button>
      </div>
    );
  }

  // Encontra a data do primeiro jogo da fase de grupos para travar o Oráculo
  const firstGroupMatchDate = (() => {
    const groupMatches = games.filter((g) => g.stage?.startsWith("Fase de Grupos"));
    if (groupMatches.length === 0) return null;
    const sorted = [...groupMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return new Date(sorted[0].date);
  })();

  const isOracleClosed = firstGroupMatchDate ? new Date() >= firstGroupMatchDate : false;

  const formattedFirstMatchDate = firstGroupMatchDate 
    ? firstGroupMatchDate.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "";

  // Flag informando quantos dias restam ou se já encerrou para palpitar no Oráculo
  const oracleDeadlineText = (() => {
    if (isOracleClosed) {
      return { text: "Encerrado", color: "text-red-400 bg-red-500/10 border-red-500/20" };
    }
    if (!firstGroupMatchDate) {
      return { text: "Aberto", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    }
    const now = new Date();
    const diffMs = firstGroupMatchDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      return { text: `Faltam ${diffDays} dias`, color: "text-[#ffd700] bg-[#ffd700]/10 border-[#ffd700]/20 animate-pulse font-bold" };
    } else {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (diffHours > 0) {
        return { text: `Encerra em ${diffHours}h e ${diffMins}m`, color: "text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse font-bold" };
      } else {
        return { text: `Encerra em ${diffMins}m!`, color: "text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse font-black" };
      }
    }
  })();

  // Ordenação dos participantes do grupo pelos pontos reais acumulados
  const rankedMembers = [...group.members].sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      {/* Header Back & Info */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => router.push("/dashboard/grupos")}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        
        <div className="auth-card p-4 sm:p-5 border border-white/10 relative overflow-hidden bg-gradient-to-r from-[#0d2b1a]/30 to-transparent">
          <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10">
            <Trophy className="w-20 h-20 text-[#ffd700]" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="copa-badge text-[9px] px-2 py-0.5">Copa 2026</span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-semibold">{group.inviteCode}</span>
              </div>
              <h1 className="text-2xl md:text-3.5xl font-black text-white tracking-tight mb-1">
                {group.name}
              </h1>
              <div className="flex items-center gap-4 text-xs text-white/60">
                <span className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-[#ffd700]" />
                  Criado por {group.owner.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {group.members.length} Participantes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-4 p-1 bg-black/20 rounded-xl backdrop-blur-md border border-white/5 max-w-xl mx-auto md:mx-0 relative">
        <button
          onClick={() => setActiveTab("geral")}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all relative z-10 ${
            activeTab === "geral" ? "text-[#0d2b1a]" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Trophy className="w-4 h-4 shrink-0" />
          <span className="truncate">Geral</span>
        </button>
        <button
          onClick={() => setActiveTab("bolao")}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all relative z-10 ${
            activeTab === "bolao" ? "text-[#0d2b1a]" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Target className="w-4 h-4 shrink-0" />
          <span className="truncate">Bolão</span>
        </button>
        <button
          onClick={() => setActiveTab("oraculo")}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all relative z-10 ${
            activeTab === "oraculo" ? "text-[#0d2b1a]" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="truncate">Oráculo</span>
        </button>
        <button
          onClick={() => setActiveTab("participantes")}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all relative z-10 ${
            activeTab === "participantes" ? "text-[#0d2b1a]" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="truncate">Participantes</span>
        </button>
        
        {/* Animated Background Pill */}
        <div 
          className="absolute inset-y-1 bg-gradient-to-r from-[#ffd700] to-[#f5c800] rounded-lg shadow-lg transition-all duration-300 ease-out z-0"
          style={{ 
            width: "calc(25% - 0.5rem)",
            left: activeTab === "geral" ? "0.25rem" 
                 : activeTab === "bolao" ? "calc(25% + 0.25rem)" 
                 : activeTab === "oraculo" ? "calc(50% + 0.25rem)"
                 : "calc(75% + 0.25rem)" 
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* Left Panel: Geral, Games or Oracle */}
        <div className={`${activeTab === "oraculo" && oracleSubTab === "matamata" ? "xl:col-span-3" : "xl:col-span-2"} space-y-6`}>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {activeTab === "geral" ? (
                <><Trophy className="w-5 h-5 text-[#ffd700]" /> Geral - Classificação e Palpites</>
              ) : activeTab === "bolao" ? (
                <><CalendarDays className="w-5 h-5 text-[#ffd700]" /> Próximos Jogos</>
              ) : activeTab === "oraculo" ? (
                <><Sparkles className="w-5 h-5 text-purple-400" /> Previsões do Oráculo</>
              ) : (
                <><Users className="w-5 h-5 text-[#ffd700]" /> Membros do Grupo</>
              )}
            </h2>
          </div>

          <div className="space-y-4">
            {activeTab === "geral" ? (
              <div className="space-y-6">
                {/* Placares & Palpites Coletivos */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#ffd700]" /> Palpites dos Integrantes
                      </h3>
                      <p className="text-xs text-white/50 mt-0.5">Veja e compare os palpites de todos os participantes</p>
                    </div>
                  </div>

                  {games.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-white/10 rounded-2xl bg-white/5">
                      <Activity className="w-8 h-8 text-white/30 mb-2 animate-pulse" />
                      <p className="text-sm font-semibold text-white/60">Carregando palpites dos integrantes...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedGames.map((game) => {
                          const isFinished = game.status === "FINISHED";
                          const gameDate = new Date(game.date);
                          const isStarted = new Date() >= gameDate;
                          const isClosed = isFinished || isStarted;

                          // Calcula o prazo dos palpites dinamicamente
                          const now = new Date();
                          const diffMs = gameDate.getTime() - now.getTime();
                          let deadlineText = "";
                          let deadlineColor = "";

                          if (isFinished || isStarted || diffMs <= 0) {
                            deadlineText = "Encerrado";
                            deadlineColor = "text-red-400 bg-red-500/10 border-red-500/20";
                          } else {
                            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                            if (diffDays > 1) {
                              deadlineText = `Faltam ${diffDays} dias`;
                              deadlineColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                            } else {
                              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                              const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                              if (diffHours > 0) {
                                deadlineText = `Encerra em ${diffHours}h e ${diffMins}m`;
                                deadlineColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                              } else {
                                deadlineText = `Encerra em ${diffMins}m`;
                                deadlineColor = "text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse";
                              }
                            }
                          }

                          // Filtrar palpites deste jogo
                          const gamePredictions = group.predictions?.filter((p: any) => p.matchId === game.id) || [];

                          return (
                            <div key={game.id} className="auth-card p-0 overflow-hidden border border-white/5 hover:border-[#ffd700]/25 transition-all bg-black/20 hover:scale-[1.01] duration-300">
                              {/* Top bar with game status */}
                              <div className="bg-black/40 p-2.5 flex justify-between items-center text-[10px] text-white/50 border-b border-white/5">
                                <span>{game.stage} • {new Date(game.date).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                {isFinished ? (
                                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded text-[9px] uppercase border border-emerald-500/20">Finalizado</span>
                                ) : isStarted ? (
                                  <span className="text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded text-[9px] uppercase border border-amber-500/20">Encerrado</span>
                                ) : (
                                  <span className={`font-bold px-2 py-0.5 rounded text-[9px] uppercase border ${deadlineColor}`}>
                                    {deadlineText}
                                  </span>
                                )}
                              </div>

                              {/* Match teams and scores */}
                              <div className="p-3.5 flex items-center justify-between gap-3 border-b border-white/5 bg-white/5">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-white/5 shrink-0">
                                    {game.homeTeam.flag ? <img src={game.homeTeam.flag} alt={game.homeTeam.code} className="w-full h-full object-cover" /> : game.homeTeam.code}
                                  </div>
                                  <span className="font-bold text-xs text-white/90 truncate cursor-help" title={game.homeTeam.name}>{game.homeTeam.name}</span>
                                </div>

                                <div className="flex items-center gap-2 px-2.5 py-1 bg-black/40 rounded-lg border border-white/5 font-extrabold text-xs shrink-0">
                                  {isFinished ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-white">{game.realHomeScore}</span>
                                      <span className="text-white/30 text-xs">x</span>
                                      <span className="text-white">{game.realAwayScore}</span>
                                    </div>
                                  ) : (
                                    <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Aguardando</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                  <span className="font-bold text-xs text-white/90 truncate text-right cursor-help" title={game.awayTeam.name}>{game.awayTeam.name}</span>
                                  <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-white/5 shrink-0">
                                    {game.awayTeam.flag ? <img src={game.awayTeam.flag} alt={game.awayTeam.code} className="w-full h-full object-cover" /> : game.awayTeam.code}
                                  </div>
                                </div>
                              </div>

                              {/* Members predictions */}
                              <div className="p-3 bg-black/10 space-y-1.5">
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-1">Palpites do Grupo</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {rankedMembers.map((member) => {
                                    const pred = gamePredictions.find((p: any) => p.userId === member.userId);
                                    // Apenas exibe o palpite de outros membros se o jogo já iniciou/fechou!
                                    const canSee = isClosed;

                                    return (
                                      <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 text-[11px]">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[9px] font-bold">
                                            {member.user.name.charAt(0).toUpperCase()}
                                          </div>
                                          <span className="font-medium text-white/70 truncate">{member.user.name}</span>
                                        </div>

                                        <div className="shrink-0 font-bold">
                                          {pred ? (
                                            canSee ? (
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[#ffd700]">{pred.homeScore} x {pred.awayScore}</span>
                                                {isFinished && (
                                                  <span className={`text-[8px] px-1 py-0.5 rounded font-black ${
                                                    pred.points === 5 ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" :
                                                    pred.points === 4 ? "text-teal-400 bg-teal-500/10 border border-teal-500/20" :
                                                    pred.points === 3 ? "text-blue-400 bg-blue-500/10 border border-blue-500/20" :
                                                    pred.points === 1 ? "text-amber-400 bg-amber-500/10 border border-amber-500/20" :
                                                    "text-red-400 bg-red-500/10 border border-red-500/20"
                                                  }`}>
                                                    +{pred.points}
                                                  </span>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-white/30 flex items-center gap-1 text-[9px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                                🔒 Oculto
                                              </span>
                                            )
                                          ) : (
                                            <span className="text-white/35 italic text-[9px]">Sem palpite</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      {games.length > ITEMS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4 mt-2">
                          <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-white/70 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          >
                            Anterior
                          </button>
                          
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
                                    onClick={() => setCurrentPage(page as number)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center border ${
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

                          <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-white/70 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          >
                            Próximo
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : activeTab === "bolao" ? (
              games.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-white/10 rounded-2xl bg-white/5">
                  <Activity className="w-8 h-8 text-white/30 mb-2 animate-pulse" />
                  <p className="text-sm font-semibold text-white/60">Carregando jogos da Copa...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Category Toggle (Fase de Grupos vs Mata-Mata) */}
                  <div className="flex justify-center">
                    <div className="bg-black/45 p-1 rounded-2xl border border-white/5 flex gap-1 shadow-inner shadow-black">
                      <button
                        onClick={() => {
                          setBolaoCategory("GRUPOS");
                          setBolaoSelectedGroup("ALL_GRUPOS");
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                          bolaoCategory === "GRUPOS"
                            ? "bg-gradient-to-r from-[#ffd700] to-[#f5c800] text-[#0d2b1a] shadow-[0_4px_16px_rgba(255,215,0,0.15)] scale-102"
                            : "bg-transparent text-white/55 hover:text-white hover:bg-white/[0.03]"
                        }`}
                      >
                        <Trophy className="w-3.5 h-3.5 shrink-0" />
                        Fase de Grupos
                      </button>
                      <button
                        onClick={() => {
                          setBolaoCategory("MATA_MATA");
                          setBolaoSelectedGroup("ALL_MATA_MATA");
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                          bolaoCategory === "MATA_MATA"
                            ? "bg-gradient-to-r from-[#ffd700] to-[#f5c800] text-[#0d2b1a] shadow-[0_4px_16px_rgba(255,215,0,0.15)] scale-102"
                            : "bg-transparent text-white/55 hover:text-white hover:bg-white/[0.03]"
                        }`}
                      >
                        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                        Mata-Mata
                      </button>
                    </div>
                  </div>

                  {/* Sub-Filters based on Active Category with Prev/Next Chevrons */}
                  <div className="flex items-center gap-2 max-w-full justify-center">
                    <button
                      onClick={handleBolaoPrevSub}
                      disabled={bolaoCategory === "GRUPOS" ? bolaoSelectedGroup === "ALL_GRUPOS" : bolaoSelectedGroup === "ALL_MATA_MATA"}
                      className="p-2 rounded-xl border border-white/5 bg-black/30 hover:bg-black/50 text-white hover:text-[#ffd700] disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 shrink-0 cursor-pointer shadow-md"
                      title="Fase anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex-1 overflow-hidden min-w-0">
                      {bolaoCategory === "GRUPOS" ? (
                        <div 
                          ref={bolaoScrollContainerRef}
                          className="bg-black/20 p-1.5 rounded-2xl border border-white/5 flex gap-1.5 overflow-x-auto copa-scrollbar max-w-full justify-start"
                        >
                          <button
                            onClick={() => {
                              setBolaoSelectedGroup("ALL_GRUPOS");
                            }}
                            data-active={bolaoSelectedGroup === "ALL_GRUPOS"}
                            className={`px-3 py-2 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-300 shrink-0 cursor-pointer whitespace-nowrap ${
                              bolaoSelectedGroup === "ALL_GRUPOS"
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
                                setBolaoSelectedGroup(gKey);
                              }}
                              data-active={bolaoSelectedGroup === gKey}
                              className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-wider transition-all duration-300 shrink-0 cursor-pointer text-center whitespace-nowrap ${
                                bolaoSelectedGroup === gKey
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
                          ref={bolaoScrollContainerRef}
                          className="bg-black/20 p-1.5 rounded-2xl border border-white/5 flex gap-1.5 overflow-x-auto copa-scrollbar max-w-full justify-start"
                        >
                          <button
                            onClick={() => {
                              setBolaoSelectedGroup("ALL_MATA_MATA");
                            }}
                            data-active={bolaoSelectedGroup === "ALL_MATA_MATA"}
                            className={`px-3 py-2 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-300 shrink-0 cursor-pointer whitespace-nowrap ${
                              bolaoSelectedGroup === "ALL_MATA_MATA"
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
                                setBolaoSelectedGroup(gKey);
                              }}
                              data-active={bolaoSelectedGroup === gKey}
                              className={`px-3 py-2 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-300 shrink-0 cursor-pointer whitespace-nowrap ${
                                bolaoSelectedGroup === gKey
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
                      onClick={handleBolaoNextSub}
                      disabled={bolaoCategory === "GRUPOS" ? bolaoSelectedGroup === "Grupo L" : bolaoSelectedGroup === "Final"}
                      className="p-2 rounded-xl border border-white/5 bg-black/30 hover:bg-black/50 text-white hover:text-[#ffd700] disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 shrink-0 cursor-pointer shadow-md"
                      title="Próxima fase"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {allFilteredBolaoMatches.length === 0 ? (
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedBolaoGames.map((game) => {
                          const isFinished = game.status === "FINISHED";
                          const gameDate = new Date(game.date);
                          const isStarted = new Date() >= gameDate;
                          const isClosed = isFinished || isStarted;

                          // Calcula o prazo dos palpites dinamicamente
                          const now = new Date();
                          const diffMs = gameDate.getTime() - now.getTime();
                          let deadlineText = "";
                          let deadlineColor = "";

                          if (isFinished || isStarted || diffMs <= 0) {
                            deadlineText = "Encerrado";
                            deadlineColor = "text-red-400 bg-red-500/10 border-red-500/20";
                          } else {
                            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                            if (diffDays > 1) {
                              deadlineText = `Faltam ${diffDays} dias`;
                              deadlineColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                            } else {
                              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                              const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                              if (diffHours > 0) {
                                deadlineText = `Encerra em ${diffHours}h e ${diffMins}m`;
                                deadlineColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                              } else {
                                deadlineText = `Encerra em ${diffMins}m`;
                                deadlineColor = "text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse";
                              }
                            }
                          }

                          return (
                            <div key={game.id} className="auth-card p-0 overflow-hidden border border-white/5 hover:border-[#ffd700]/25 transition-all hover:scale-[1.01] duration-300 group">
                              <div className="bg-black/20 p-2.5 flex justify-between items-center text-[10px] text-white/50 border-b border-white/5">
                                <span>{game.stage} • {new Date(game.date).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border ${deadlineColor}`}>
                                  {deadlineText}
                                </span>
                              </div>
                              <div className="p-3.5 flex items-center justify-between gap-3 sm:gap-4">
                                {/* Team A */}
                                <div className="flex flex-col items-center flex-1 min-w-0">
                                  <div className="w-8 h-8 rounded-full overflow-hidden mb-1.5 flex items-center justify-center font-bold text-sm border border-white/20 bg-white/5 shrink-0">
                                    {game.homeTeam.flag ? (
                                      <img src={game.homeTeam.flag} alt={game.homeTeam.code} className="w-full h-full object-cover" />
                                    ) : (
                                      game.homeTeam.code
                                    )}
                                  </div>
                                  <span className="font-bold text-xs text-white/80 truncate text-center w-full cursor-help" title={game.homeTeam.name}>{game.homeTeam.name}</span>
                                </div>

                                {/* Score / Inputs */}
                                <div className="flex items-center gap-2 shrink-0">
                                  {isClosed ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="flex items-center gap-2">
                                        {isFinished ? (
                                          <>
                                            <span className="text-xl sm:text-2xl font-black text-white">{game.realHomeScore}</span>
                                            <span className="text-white/30 text-xs font-bold">x</span>
                                            <span className="text-xl sm:text-2xl font-black text-white">{game.realAwayScore}</span>
                                          </>
                                        ) : game.predictedHomeScore !== null ? (
                                          <>
                                            <span className="text-xl sm:text-2xl font-black text-[#ffd700]">{game.predictedHomeScore}</span>
                                            <span className="text-white/30 text-xs font-bold">x</span>
                                            <span className="text-xl sm:text-2xl font-black text-[#ffd700]">{game.predictedAwayScore}</span>
                                          </>
                                        ) : (
                                          <span className="text-[10px] text-white/35 italic">Sem palpite</span>
                                        )}
                                      </div>
                                      {isFinished && game.predictedHomeScore !== null && (
                                        <div className="flex flex-col items-center gap-1 mt-1">
                                          <span className="text-[8px] text-[#ffd700] bg-[#ffd700]/10 border border-[#ffd700]/15 px-1.5 py-0.5 rounded font-semibold">
                                            Seu: {game.predictedHomeScore}x{game.predictedAwayScore}
                                          </span>
                                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border ${
                                            game.pointsEarned === 5 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                                            game.pointsEarned === 4 ? "text-teal-400 bg-teal-500/10 border-teal-500/20" :
                                            game.pointsEarned === 3 ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                                            game.pointsEarned === 1 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                                            "text-red-400 bg-red-500/10 border-red-500/20"
                                          }`}>
                                            +{game.pointsEarned} {game.pointsEarned === 1 ? "ponto" : "pontos"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={predScores[game.id]?.home ?? ""}
                                        onChange={(e) => setPredScores({
                                          ...predScores,
                                          [game.id]: {
                                            ...(predScores[game.id] || { home: "", away: "" }),
                                            home: e.target.value
                                          }
                                        })}
                                        className="w-10 h-9 sm:w-11 sm:h-10 text-center text-sm sm:text-base font-extrabold rounded-lg bg-black/60 border border-white/10 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                      <span className="text-white/30 text-xs font-bold">x</span>
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={predScores[game.id]?.away ?? ""}
                                        onChange={(e) => setPredScores({
                                          ...predScores,
                                          [game.id]: {
                                            ...(predScores[game.id] || { home: "", away: "" }),
                                            away: e.target.value
                                          }
                                        })}
                                        className="w-10 h-9 sm:w-11 sm:h-10 text-center text-sm sm:text-base font-extrabold rounded-lg bg-black/60 border border-white/10 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Team B */}
                                <div className="flex flex-col items-center flex-1 min-w-0">
                                  <div className="w-8 h-8 rounded-full overflow-hidden mb-1.5 flex items-center justify-center font-bold text-sm border border-white/20 bg-white/5 shrink-0">
                                    {game.awayTeam.flag ? (
                                      <img src={game.awayTeam.flag} alt={game.awayTeam.code} className="w-full h-full object-cover" />
                                    ) : (
                                      game.awayTeam.code
                                    )}
                                  </div>
                                  <span className="font-bold text-xs text-white/80 truncate text-center w-full cursor-help" title={game.awayTeam.name}>{game.awayTeam.name}</span>
                                </div>
                              </div>
                              {!isClosed && (
                                <div className="p-2.5 px-3.5 bg-black/20 border-t border-white/5 flex justify-between items-center">
                                  <span className="text-[9px] text-white/40 truncate max-w-[50%]">
                                    {game.predictedHomeScore !== null ? (
                                      <span className="text-emerald-400 font-semibold">Salvo: {game.predictedHomeScore}x{game.predictedAwayScore}</span>
                                    ) : (
                                      "Não palpitado"
                                    )}
                                  </span>
                                  <button
                                    disabled={savingMatchId === game.id}
                                    onClick={() => handleSavePrediction(game.id)}
                                    className="copa-btn-primary px-4 py-1.5 text-[10px] shadow-md flex items-center gap-1"
                                  >
                                    {savingMatchId === game.id ? (
                                      <>
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                        Salvando...
                                      </>
                                    ) : (
                                      "Salvar"
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls for Bolão */}
                      {allFilteredBolaoMatches.length > ITEMS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4 mt-4">
                          <button
                            onClick={() => setBolaoPage((prev) => Math.max(prev - 1, 1))}
                            disabled={bolaoPage === 1}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-white/70 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          >
                            Anterior
                          </button>

                          <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            {(() => {
                              const range: (number | string)[] = [];
                              const delta = 1;
                              for (let i = 1; i <= bolaoTotalPages; i++) {
                                if (i === 1 || i === bolaoTotalPages || (i >= bolaoPage - delta && i <= bolaoPage + delta)) {
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
                                const isSelected = page === bolaoPage;
                                return (
                                  <button
                                    key={page}
                                    onClick={() => setBolaoPage(page as number)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center border ${
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

                          <button
                            onClick={() => setBolaoPage((prev) => Math.min(prev + 1, bolaoTotalPages))}
                            disabled={bolaoPage === bolaoTotalPages}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-white/70 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          >
                            Próximo
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            ) : activeTab === "oraculo" ? (
              <div className="space-y-4 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/30 p-4 border border-white/10 rounded-2xl">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-[#ffd700]" /> Oráculo da Copa
                    </h2>
                    <p className="text-[10px] sm:text-xs text-white/50 mt-0.5">Preveja a ordem da Fase de Grupos e o chaveamento do Mata-Mata.</p>
                  </div>
                  {/* Flag de Prazo */}
                  <div className={`inline-flex items-center self-start sm:self-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${oracleDeadlineText.color}`}>
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{oracleDeadlineText.text}</span>
                  </div>
                </div>

                {/* Alternador de Sub-Abas do Oráculo (Segmented Control) */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-fit">
                  <button
                    onClick={() => setOracleSubTab("grupos")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      oracleSubTab === "grupos"
                        ? "bg-gradient-to-br from-[#ffd700] to-[#f5c800] text-[#0d2b1a] shadow-md font-black"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Fase de Grupos
                  </button>
                  <div className="relative group">
                    <button
                      disabled
                      type="button"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white/35 cursor-not-allowed select-none transition-all"
                    >
                      Mata-Mata
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-gradient-to-b from-[#0d2b1a] to-[#05110a] border border-[#ffd700]/30 text-white text-[11px] font-medium p-2.5 rounded-xl shadow-2xl text-center z-50 backdrop-blur-md">
                      O mata-mata estará habilitado quando a fase de grupos for encerrada.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#05110a]" />
                    </div>
                  </div>
                </div>

                {oracleSubTab === "grupos" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(oracleGroups).sort().map((groupName) => (
                        <div key={groupName} className="auth-card p-4 border border-white/5 relative overflow-hidden bg-[#0d2b1a]/40">
                          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-1.5">
                            <h3 className="text-base font-bold text-[#ffd700] flex items-center gap-2">
                              Grupo {groupName}
                            </h3>
                            <span className="text-[9px] uppercase text-white/40 tracking-wider hidden sm:inline">
                              {isOracleClosed ? "Visualização" : "Arrastar ou usar setas"}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {oracleGroups[groupName]?.map((team, index) => (
                              <div
                                key={team.code}
                                draggable={!isOracleClosed}
                                onDragStart={(e) => {
                                  if (isOracleClosed) return;
                                  setDraggedItem({ groupName, index });
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnd={() => setDraggedItem(null)}
                                onDrop={(e) => {
                                  if (isOracleClosed || !draggedItem) return;
                                  if (draggedItem.groupName !== groupName) return;
                                  const newTeams = [...oracleGroups[groupName]];
                                  const [moved] = newTeams.splice(draggedItem.index, 1);
                                  newTeams.splice(index, 0, moved);
                                  setOracleGroups({
                                    ...oracleGroups,
                                    [groupName]: newTeams
                                  });
                                  setDraggedItem(null);
                                }}
                                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                  isOracleClosed ? "bg-black/10 border-white/5 cursor-default" :
                                  draggedItem && draggedItem.groupName === groupName && draggedItem.index === index
                                    ? "bg-white/5 border-[#ffd700] opacity-50 scale-98 cursor-grab"
                                    : "bg-black/20 border-white/5 hover:border-[#ffd700]/30 hover:bg-white/5 cursor-grab active:cursor-grabbing"
                                }`}
                              >
                                 {/* Position rank */}
                                <span className={`w-5 text-center font-bold text-xs shrink-0 ${
                                  index === 0 ? "text-[#ffd700]" :
                                  index === 1 ? "text-gray-300" :
                                  index === 2 ? "text-amber-600" : "text-white/40"
                                }`}>
                                  {index + 1}º
                                </span>

                                 {/* Flag container */}
                                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white/20 bg-white/5 flex items-center justify-center font-bold text-[10px]">
                                  {team.flag ? (
                                    <img src={team.flag} alt={team.code} className="w-full h-full object-cover" />
                                  ) : (
                                    team.code
                                  )}
                                </div>

                                 {/* Team Name */}
                                <span className="flex-1 text-xs font-semibold text-white/90 truncate">
                                  {team.name}
                                </span>

                                {/* Pontuação do Oráculo */}
                                {isGroupStageFinished && index < 4 && (
                                  <div className="flex items-center gap-1.5 shrink-0 ml-auto mr-1">
                                    {team.realPosition && team.realPosition !== (index + 1) && (
                                      <span className="text-[9px] text-white/40 italic">
                                        (Real: {team.realPosition}º)
                                      </span>
                                    )}
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border ${
                                      team.pointsEarned === 4
                                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                        : "text-red-400 bg-red-500/10 border-red-500/20"
                                    }`}>
                                      {team.pointsEarned === 4 ? "+4 pts" : "0 pts"}
                                    </span>
                                  </div>
                                )}

                                 {/* Reorder Arrows (Failsafe for mobile & accessibility!) */}
                                {!isOracleClosed && (
                                  <div className="flex flex-col gap-0.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity">
                                    {index > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newTeams = [...oracleGroups[groupName]];
                                          const temp = newTeams[index];
                                          newTeams[index] = newTeams[index - 1];
                                          newTeams[index - 1] = temp;
                                          setOracleGroups({
                                            ...oracleGroups,
                                            [groupName]: newTeams
                                          });
                                        }}
                                        className="p-0.5 hover:text-[#ffd700] transition-colors"
                                        title="Mover para cima"
                                      >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {index < oracleGroups[groupName].length - 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newTeams = [...oracleGroups[groupName]];
                                          const temp = newTeams[index];
                                          newTeams[index] = newTeams[index + 1];
                                          newTeams[index + 1] = temp;
                                          setOracleGroups({
                                            ...oracleGroups,
                                            [groupName]: newTeams
                                          });
                                        }}
                                        className="p-0.5 hover:text-[#ffd700] transition-colors"
                                        title="Mover para baixo"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Save button and instructions */}
                    {isOracleClosed ? (
                      <div className="flex flex-col items-center justify-center p-4.5 border border-red-500/20 rounded-2xl bg-red-500/5 mt-5 text-center shadow-[0_0_15px_rgba(239,68,68,0.05)] animate-fade-in-up">
                        <p className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 justify-center">
                          🔒 Oráculo Encerrado
                        </p>
                        <p className="text-[11px] text-white/60 max-w-md leading-relaxed">
                          O prazo para enviar e alterar palpites no Oráculo encerrou em <strong className="text-white font-bold">{formattedFirstMatchDate || "o início da fase de grupos"}</strong> com o pontapé inicial do torneio. Agora você pode apenas visualizar as projeções das seleções.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 border border-white/10 rounded-xl bg-black/20 mt-5">
                        <p className="text-xs text-white/60 text-center mb-3">
                          Organize os grupos arrastando as seleções ou usando as setas laterais para prever os classificados em ordem. Os palpites podem ser salvos e alterados até <strong className="text-[#ffd700] font-bold">{formattedFirstMatchDate || "o início da fase de grupos"}</strong>.
                        </p>
                        <button
                          disabled={savingOracle}
                          onClick={async () => {
                            setSavingOracle(true);
                            setOracleMessage(null);
                            try {
                              const payload = Object.keys(oracleGroups).map((gName) => ({
                                groupName: gName,
                                teamOrder: oracleGroups[gName].map((t) => t.code),
                              }));
                              await groupsApi.saveOraclePredictions(groupId, payload);
                              setOracleMessage("Palpites salvos com sucesso!");
                              setTimeout(() => setOracleMessage(null), 5000);
                            } catch (err: any) {
                              setOracleMessage(err.message || "Erro ao salvar palpites");
                            } finally {
                              setSavingOracle(false);
                            }
                          }}
                          className="copa-btn-primary px-6 py-2 text-sm shadow-lg shadow-[#ffd700]/15 w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                          {savingOracle ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Salvando palpites...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Salvar Palpites do Oráculo
                            </>
                          )}
                        </button>
                        {oracleMessage && (
                          <p className={`mt-2 text-xs font-semibold ${
                            oracleMessage.includes("sucesso") ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {oracleMessage}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (() => {
                  const knockoutMatches = games.filter((g) => !g.stage.startsWith("Fase de Grupos"));
                  const r32 = knockoutMatches.filter((m) => m.stage === "Dezesseisavos de Final");
                  const r16 = knockoutMatches.filter((m) => m.stage === "Oitavas de Final");
                  const r8 = knockoutMatches.filter((m) => m.stage === "Quartas de Final");
                  const r4 = knockoutMatches.filter((m) => m.stage === "Semifinais" || m.stage === "Semifinal");
                  const r2 = knockoutMatches.filter((m) => m.stage === "Final" || m.stage === "Terceiro Lugar" || m.stage === "Disputa do 3º Lugar");

                  const getSelectedMatches = () => {
                    if (bracketRound === "r32") return r32;
                    if (bracketRound === "r16") return r16;
                    if (bracketRound === "r8") return r8;
                    if (bracketRound === "r4") return r4;
                    if (bracketRound === "r2") return r2;
                    return [];
                  };

                  const selectedMatches = getSelectedMatches();

                  // Divisão em dois lados para visualização simétrica (Árvore de Copa do Mundo)
                  const r32Left = r32.slice(0, 8);
                  const r32Right = r32.slice(8, 16);
                  const r16Left = r16.slice(0, 4);
                  const r16Right = r16.slice(4, 8);
                  const r8Left = r8.slice(0, 2);
                  const r8Right = r8.slice(2, 4);
                  const r4Left = r4.slice(0, 1);
                  const r4Right = r4.slice(1, 2);
                  const finalMatch = r2.find(m => m.stage === "Final");
                  const thirdMatch = r2.find(m => m.stage === "Terceiro Lugar" || m.stage === "Disputa do 3º Lugar");

                  return (
                    <div className="space-y-4 animate-fade-in-up">
                      {/* Navegação entre as fases do chaveamento */}
                      <div className="flex flex-col sm:flex-row gap-3 bg-black/20 p-3 rounded-2xl border border-white/5 items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => setBracketRound("all")}
                            className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                              bracketRound === "all" ? "bg-white/10 text-white border border-white/20" : "text-white/60 hover:text-white"
                            }`}
                          >
                            Árvore Completa
                          </button>
                          <button
                            onClick={() => setBracketRound("r32")}
                            className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                              bracketRound === "r32" ? "bg-white/10 text-white border border-white/20" : "text-white/60 hover:text-white"
                            }`}
                          >
                            Dezesseisavos (32)
                          </button>
                          <button
                            onClick={() => setBracketRound("r16")}
                            className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                              bracketRound === "r16" ? "bg-white/10 text-white border border-white/20" : "text-white/60 hover:text-white"
                            }`}
                          >
                            Oitavas (16)
                          </button>
                          <button
                            onClick={() => setBracketRound("r8")}
                            className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                              bracketRound === "r8" ? "bg-white/10 text-white border border-white/20" : "text-white/60 hover:text-white"
                            }`}
                          >
                            Quartas (8)
                          </button>
                          <button
                            onClick={() => setBracketRound("r4")}
                            className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                              bracketRound === "r4" ? "bg-white/10 text-white border border-white/20" : "text-white/60 hover:text-white"
                            }`}
                          >
                            Semifinais
                          </button>
                          <button
                            onClick={() => setBracketRound("r2")}
                            className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                              bracketRound === "r2" ? "bg-white/10 text-white border border-white/20" : "text-white/60 hover:text-white"
                            }`}
                          >
                            Finais
                          </button>
                        </div>
                        <span className="text-[10px] text-white/40 italic flex items-center gap-1">
                          ✨ Selecione clicando na bandeira do time que vai avançar
                        </span>
                      </div>

                      {/* Exibição da Árvore Symmetrical ou Grade Focada */}
                      {bracketRound === "all" ? (
                        <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 justify-start lg:justify-center items-stretch scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent min-w-full">
                          <div className="flex gap-4 md:gap-6 items-stretch py-2 min-w-[1300px] justify-center mx-auto">
                            {/* COLUNA 1: Dezesseisavos (Lado Esquerdo) */}
                            <div className="flex flex-col gap-2 w-20">
                              <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">1/16 Final</div>
                              <div className="flex flex-col justify-between flex-1 py-1">
                                {r32Left.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    handleSavePredictionDirect={handleSavePredictionDirect}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 2: Oitavas (Lado Esquerdo) */}
                            <div className="flex flex-col gap-2 w-20">
                              <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Oitavas</div>
                              <div className="flex flex-col justify-around flex-1 py-4">
                                {r16Left.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    handleSavePredictionDirect={handleSavePredictionDirect}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 3: Quartas (Lado Esquerdo) */}
                            <div className="flex flex-col gap-2 w-20">
                              <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Quartas</div>
                              <div className="flex flex-col justify-around flex-1 py-12">
                                {r8Left.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    handleSavePredictionDirect={handleSavePredictionDirect}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 4: Semifinal (Lado Esquerdo) */}
                            <div className="flex flex-col gap-2 w-20">
                              <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Semifinal</div>
                              <div className="flex flex-col justify-around flex-1 py-24">
                                {r4Left.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    handleSavePredictionDirect={handleSavePredictionDirect}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 5: FINAIS (Centro do Chaveamento) */}
                            <div className="flex flex-col gap-4 justify-center items-center px-4 min-w-[210px] bg-black/10 border border-white/5 rounded-3xl relative overflow-hidden py-6">
                              <div className="absolute inset-0 bg-gradient-to-b from-[#ffd700]/5 to-transparent pointer-events-none" />
                              
                              {/* Campeão / Grande Final */}
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-[9px] font-black uppercase text-[#ffd700] tracking-widest bg-[#ffd700]/10 border border-[#ffd700]/25 px-2.5 py-1 rounded-full shadow-sm">
                                  🏆 Grande Final
                                </span>
                                {finalMatch ? (
                                  <OracleBracketCircleMatch
                                    game={finalMatch}
                                    savingMatchId={savingMatchId}
                                    handleSavePredictionDirect={handleSavePredictionDirect}
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 text-xs">
                                    Final
                                  </div>
                                )}
                              </div>

                              {/* Disputa do 3º Lugar */}
                              <div className="flex flex-col items-center gap-2 mt-4">
                                <span className="text-[9px] font-black uppercase text-teal-400 tracking-widest bg-teal-500/10 border border-teal-500/25 px-2.5 py-1 rounded-full shadow-sm">
                                  🥉 3º Lugar
                                </span>
                                {thirdMatch ? (
                                  <OracleBracketCircleMatch
                                    game={thirdMatch}
                                    savingMatchId={savingMatchId}
                                    handleSavePredictionDirect={handleSavePredictionDirect}
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 text-xs">
                                    3º Lugar
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* COLUNA 6: Semifinal (Lado Direito) */}
                            <div className="flex flex-col gap-2 w-20">
                              <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Semifinal</div>
                              <div className="flex flex-col justify-around flex-1 py-24">
                                {r4Right.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    handleSavePredictionDirect={handleSavePredictionDirect}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 7: Quartas (Lado Direito) */}
                            <div className="flex flex-col gap-2 w-20">
                              <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Quartas</div>
                              <div className="flex flex-col justify-around flex-1 py-12">
                                {r8Right.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    handleSavePredictionDirect={handleSavePredictionDirect}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 8: Oitavas (Lado Direito) */}
                            <div className="flex flex-col gap-2 w-20">
                              <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Oitavas</div>
                              <div className="flex flex-col justify-around flex-1 py-4">
                                {r16Right.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    handleSavePredictionDirect={handleSavePredictionDirect}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 9: Dezesseisavos (Lado Direito) */}
                            <div className="flex flex-col gap-2 w-20">
                              <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">1/16 Final</div>
                              <div className="flex flex-col justify-between flex-1 py-1">
                                {r32Right.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    handleSavePredictionDirect={handleSavePredictionDirect}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 justify-items-center pt-2">
                          {selectedMatches.map((game) => (
                            <div key={game.id} className="flex flex-col items-center gap-1.5 p-2 bg-black/10 border border-white/5 rounded-2xl">
                              <span className="text-[8px] font-black text-white/30 uppercase truncate max-w-[80px]">
                                {game.stage?.replace("Dezesseisavos", "1/16").replace(" de Final", "")}
                              </span>
                              <OracleBracketCircleMatch
                                game={game}
                                savingMatchId={savingMatchId}
                                handleSavePredictionDirect={handleSavePredictionDirect}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                <div className="auth-card p-6 border border-white/5 relative overflow-hidden bg-black/20">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#ffd700]" /> Integrantes do Grupo
                      </h3>
                      <p className="text-xs text-white/50 mt-0.5">Gerencie os membros que estão participando deste bolão</p>
                    </div>
                    <span className="text-xs font-semibold text-[#ffd700] bg-[#ffd700]/10 border border-[#ffd700]/20 px-3 py-1 rounded-full">
                      {group?.members?.length || 0} / {group?.maxMembers || 48} Participantes
                    </span>
                  </div>

                  <div className="divide-y divide-white/5">
                    {group?.members?.map((member: any) => {
                      const isOwner = member.userId === group.ownerId;
                      const isMe = currentUser && member.userId === currentUser.id;
                      const isGroupCreator = currentUser && group.ownerId === currentUser.id;

                      return (
                        <div key={member.id} className="flex items-center justify-between py-4 group/item">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 shrink-0">
                              <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-white shadow-inner overflow-hidden">
                                {member.user.avatar ? (
                                  <img src={member.user.avatar} alt={member.user.name} className="w-full h-full object-cover" />
                                ) : (
                                  member.user.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              {isOwner && (
                                <div className="absolute -top-2.5 -right-1 bg-gradient-to-r from-[#ffd700] to-[#f5c800] p-1 rounded-full shadow-lg border border-black/20 z-10" title="Criador do Grupo">
                                  <Crown className="w-3 h-3 text-[#0d2b1a]" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white/90">
                                  {member.user.name}
                                </span>
                                {isMe && (
                                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                    Você
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-white/40 mt-0.5">
                                Entrou em {new Date(member.joinedAt).toLocaleDateString("pt-BR")} • <span className="text-[#ffd700] font-bold">{member.points || 0} pts</span> (Bolão: {member.matchPoints || 0} | Oráculo: {member.oraclePoints || 0})
                              </p>
                            </div>
                          </div>

                          {/* Kick/Remove member action */}
                          {isGroupCreator && !isOwner && (
                            <button
                              onClick={async () => {
                                const ok = await confirm(`Deseja mesmo remover o participante ${member.user.name} do grupo?`, "Remover Participante");
                                if (ok) {
                                  try {
                                    await groupsApi.removeMember(groupId, member.userId);
                                    toast.success("Membro removido com sucesso!");
                                    window.location.reload();
                                  } catch (err: any) {
                                    toast.error(err.message || "Erro ao remover membro");
                                  }
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-md shrink-0 md:opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Ranking / Oracle Standings / Group Stats */}
        {!(activeTab === "oraculo" && oracleSubTab === "matamata") && (
          <div className="space-y-6 self-start w-full">
          {activeTab === "geral" ? (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#ffd700]" /> Informações do Grupo
              </h2>

              {/* Invite Code Card (Dashed Gold Neon style) */}
              <div className="auth-card p-5 border border-dashed border-[#ffd700]/25 bg-[#ffd700]/5 relative overflow-hidden rounded-3xl shadow-lg">
                <div className="absolute top-0 right-0 p-3 opacity-5">
                  <Users className="w-16 h-16 text-[#ffd700]" />
                </div>
                <h3 className="text-base font-black text-white mb-2 flex items-center gap-2">
                  📢 Convidar Amigos
                </h3>
                <p className="text-xs text-white/50 mb-4 font-semibold">Compartilhe o código de convite para trazer novos participantes para o seu grupo!</p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 bg-black/50 border border-[#ffd700]/20 px-3 py-2.5 rounded-xl text-sm font-mono text-center font-black text-[#ffd700] tracking-widest select-all">
                    {group.inviteCode}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(group.inviteCode);
                      toast.success("Código copiado para a área de transferência!");
                    }}
                    className="copa-btn-primary px-5 py-2.5 text-xs font-black shadow-lg shadow-[#ffd700]/15 rounded-xl cursor-pointer"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* Group stats card */}
              <div className="auth-card p-5 border border-white/5 bg-[#0a0f1e]/40 rounded-3xl shadow-md">
                <h3 className="text-xs font-black text-white/40 mb-3 uppercase tracking-wider">Estatísticas</h3>
                <div className="space-y-3 text-xs text-white/70">
                  <div className="flex justify-between py-2 border-b border-white/5 items-center font-semibold">
                    <span className="text-white/40">Participantes:</span>
                    <span className="font-black text-[#ffd700]">{group.members.length} / {group.maxMembers}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5 items-center font-semibold">
                    <span className="text-white/40">Criado por:</span>
                    <span className="font-black text-white">{group.owner.name}</span>
                  </div>
                  <div className="flex justify-between py-2 items-center font-semibold">
                    <span className="text-white/40">Criado em:</span>
                    <span className="font-black text-white">{new Date(group.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>

              {/* Classificação do Grupo / Leaderboard */}
              <div className="auth-card p-5 border border-white/5 relative overflow-hidden bg-gradient-to-br from-[#0d2b1a]/40 via-black/20 to-black/30 animate-fade-in-up rounded-3xl shadow-xl shadow-black/10">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Trophy className="w-24 h-24 text-[#ffd700]" />
                </div>
                
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <div>
                    <h3 className="text-sm font-black text-[#ffd700] flex items-center gap-2">
                      <Medal className="w-4 h-4" /> Classificação do Grupo
                    </h3>
                    <p className="text-[10px] text-white/40 font-semibold mt-0.5">Membros classificados de acordo com os acertos</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 copa-scrollbar">
                  {rankedMembers.map((member, index) => {
                    const isOwner = member.userId === group.ownerId;
                    return (
                      <div 
                        key={member.id} 
                        className={`flex items-center justify-between gap-2.5 p-2 px-3 rounded-xl transition-all ${
                          index === 0 
                            ? "bg-gradient-to-r from-[#ffd700]/15 to-[#ffd700]/5 border border-[#ffd700]/30 shadow-sm shadow-[#ffd700]/5" 
                            : "hover:bg-white/5 bg-white/[0.02] border border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Position Badge */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm ${
                            index === 0 ? "bg-gradient-to-r from-[#ffd700] to-[#f5c800] text-[#0d2b1a] shadow-[0_0_8px_rgba(255,215,0,0.3)]" : 
                            index === 1 ? "bg-gradient-to-r from-gray-300 to-gray-400 text-[#0d2b1a] shadow-[0_0_8px_rgba(200,200,200,0.3)]" : 
                            index === 2 ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-[0_0_8px_rgba(180,83,9,0.3)]" : 
                            "bg-white/5 text-white/50 border border-white/10"
                          }`}>
                            {index + 1}º
                          </div>

                          {/* Initials Avatar */}
                          <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                            {member.user.avatar ? (
                              <img src={member.user.avatar} alt={member.user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] font-black text-white">
                                {member.user.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-white truncate flex items-center gap-1">
                              {member.user.name}
                              {index === 0 && <Crown className="w-3.5 h-3.5 text-[#ffd700] animate-pulse" />}
                            </p>
                            <p className="text-[9px] text-white/40 mt-0.5">
                              Bolão: <span className="text-white/60 font-bold">{member.matchPoints || 0} pts</span>
                              {" • "}
                              Oráculo: <span className="text-purple-400 font-bold">{member.oraclePoints || 0} pts</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-1">
                          <span className="text-xs font-black text-[#ffd700]">{member.points || 0}</span>
                          <span className="text-[8px] text-white/40 uppercase font-black">pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === "bolao" ? (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#ffd700]" /> Regulamento do Bolão
              </h2>

              {/* Sistema de Pontuação Card */}
              <div className="auth-card p-5 border border-[#ffd700]/20 bg-[#0a0f1e]/40 relative overflow-hidden rounded-3xl shadow-xl">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                  <Trophy className="w-20 h-20 text-[#ffd700]" />
                </div>
                <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                  ⭐ Sistema de Pontuação
                </h3>
                <div className="space-y-3.5 text-xs">
                  {/* 5 Points */}
                  <div className="flex gap-3 items-start p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/25 text-sm">
                      5
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">Placar Exato</p>
                      <p className="text-[11px] text-white/50 leading-normal">Caso crave o placar exato da partida.</p>
                    </div>
                  </div>

                  {/* 4 Points */}
                  <div className="flex gap-3 items-start p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/10">
                    <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 font-black border border-teal-500/25 text-sm">
                      4
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">Vencedor + Gols de um Time</p>
                      <p className="text-[11px] text-white/50 leading-normal">Caso acerte o vencedor, sem cravar o placar, mas acerte a quantidade de gols de um dos times. <span className="text-teal-400/80 italic font-medium">(Ex: jogo 2x0 e palpite 2x1)</span></p>
                    </div>
                  </div>

                  {/* 3 Points */}
                  <div className="flex gap-3 items-start p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-black border border-blue-500/25 text-sm">
                      3
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">Vencedor ou Empate Simples</p>
                      <p className="text-[11px] text-white/50 leading-normal">Caso acerte o vencedor ou o empate errando a quantidade de gols de ambos os times. <span className="text-blue-400/80 italic font-medium">(Ex: jogo 0x0 e palpite 1x1, ou jogo 1x0 e palpite 2x1)</span></p>
                    </div>
                  </div>

                  {/* 1 Point */}
                  <div className="flex gap-3 items-start p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-black border border-amber-500/25 text-sm">
                      1
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">Gols de um Time (Erro de Vencedor)</p>
                      <p className="text-[11px] text-white/50 leading-normal">Caso erre o vencedor ou o empate, mas acerte o número de gols de um dos times. <span className="text-amber-400/80 italic font-medium">(Ex: jogo 0x1 e palpite 1x1, ou jogo 0x0 e palpite 0x1)</span></p>
                    </div>
                  </div>

                  {/* 0 Points */}
                  <div className="flex gap-3 items-start p-2.5 rounded-xl bg-red-500/5 border border-red-500/10">
                    <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/20 text-red-400 font-black border border-red-500/25 text-sm">
                      0
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">Erro Absoluto</p>
                      <p className="text-[11px] text-white/50 leading-normal">Caso erre absolutamente tudo na partida.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regra da Copa 2026 Card */}
              <div className="auth-card p-5 border border-emerald-500/20 bg-[#0d2b1a]/30 relative overflow-hidden rounded-3xl">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Trophy className="w-16 h-16 text-[#ffd700]" />
                </div>
                <h3 className="text-lg font-bold text-[#ffd700] flex items-center gap-2 mb-3">
                  🏆 Regra da Copa 2026
                </h3>
                <div className="space-y-2 text-xs text-white/70">
                  <p>A Copa do Mundo de 2026 conta com <strong>12 grupos de 4 seleções</strong>.</p>
                  <div className="p-2.5 bg-black/30 rounded-lg border border-white/5 space-y-1">
                    <p className="flex justify-between">
                      <span>1º e 2º colocados:</span>
                      <span className="font-bold text-emerald-400">24 vagas</span>
                    </p>
                    <p className="flex justify-between">
                      <span>8 melhores 3ºs:</span>
                      <span className="font-bold text-emerald-400">8 vagas</span>
                    </p>
                    <div className="border-t border-white/10 my-1 pt-1 flex justify-between text-[#ffd700] font-bold">
                      <span>Total Mata-Mata:</span>
                      <span>32 times</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/40 italic">
                    Os 32 classificados avançam para os 16-avos de final (primeira fase do mata-mata).
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === "oraculo" ? (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#ffd700]" /> Regulamento & Projeção
                </h2>
              </div>

              {/* Pontuação do Oráculo Card */}
              <div className="auth-card p-5 border border-[#ffd700]/25 bg-[#0a0f1e]/40 relative overflow-hidden rounded-3xl shadow-xl">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                  <Trophy className="w-20 h-20 text-[#ffd700]" />
                </div>
                <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                  ⭐ Pontuação do Oráculo
                </h3>
                <div className="space-y-3 text-xs">
                  {/* Posições exatas */}
                  <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/25 text-[10px]">
                        +4
                      </span>
                      Posições Exatas (1º, 2º e 3º)
                    </p>
                    <p className="text-[11px] text-white/50 leading-normal pl-6">
                      Você ganha **4 pontos** para cada time que acertar a posição exata (1º, 2º ou 3º colocado) no grupo. Qualquer erro de colocação resultará em **0 pontos**.
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/5 mt-4 pt-3 text-[10px] text-white/40 italic leading-normal">
                  ⚠️ O Oráculo fecha no início da primeira partida e as pontuações só serão calculadas e exibidas na tabela após a finalização completa da Fase de Grupos.
                </div>
              </div>

              {/* Regra Card */}
              {oracleSubTab !== "matamata" && (
                <div className="auth-card p-5 border border-emerald-500/20 bg-[#0d2b1a]/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Trophy className="w-16 h-16 text-[#ffd700]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#ffd700] flex items-center gap-2 mb-3">
                    🏆 Regra da Copa 2026
                  </h3>
                  <div className="space-y-2 text-xs text-white/70">
                    <p>A Copa do Mundo de 2026 conta com <strong>12 grupos de 4 seleções</strong>.</p>
                    <div className="p-2.5 bg-black/30 rounded-lg border border-white/5 space-y-1">
                      <p className="flex justify-between">
                        <span>1º e 2º colocados:</span>
                        <span className="font-bold text-emerald-400">24 vagas</span>
                      </p>
                      <p className="flex justify-between">
                        <span>8 melhores 3ºs:</span>
                        <span className="font-bold text-emerald-400">8 vagas</span>
                      </p>
                      <div className="border-t border-white/10 my-1 pt-1 flex justify-between text-[#ffd700] font-bold">
                        <span>Total Mata-Mata:</span>
                        <span>32 times</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/40 italic">
                      Os 32 classificados avançam para os 16-avos de final (primeira fase do mata-mata).
                    </p>
                  </div>
                </div>
              )}

              {/* Classificados dynamic list */}
              {oracleSubTab !== "matamata" && (
                <div className="auth-card p-5 border border-white/10">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-[#ffd700]" /> Previsão de Classificados
                  </h3>

                  <div className="space-y-4">
                    {/* Classificados Diretos */}
                    <div>
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Classificados Diretos (1º e 2º)
                      </h4>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1 copa-scrollbar">
                        {Object.keys(oracleGroups).sort().map((groupName) => {
                          const groupTeams = oracleGroups[groupName] || [];
                          const first = groupTeams[0];
                          const second = groupTeams[1];
                          return [first, second].filter(Boolean).map((team) => (
                            <div key={team.code} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs">
                              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center font-bold text-[8px]">
                                {team.flag ? (
                                  <img src={team.flag} alt={team.code} className="w-full h-full object-cover" />
                                ) : (
                                  team.code
                                )}
                              </div>
                              <span className="font-semibold text-white/90 truncate flex-1">{team.name}</span>
                              <span className="text-[9px] font-bold text-[#ffd700] bg-white/5 px-1 rounded uppercase shrink-0">{groupName}</span>
                            </div>
                          ));
                        })}
                      </div>
                    </div>

                    {/* Melhores Terceiros */}
                    <div className="border-t border-white/10 pt-3">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        Terceiros (Repescagem 2026)
                      </h4>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto pr-1 copa-scrollbar">
                        {Object.keys(oracleGroups).sort().map((groupName) => {
                          const groupTeams = oracleGroups[groupName] || [];
                          const third = groupTeams[2];
                          if (!third) return null;
                          return (
                            <div key={third.code} className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs">
                              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center font-bold text-[8px]">
                                {third.flag ? (
                                  <img src={third.flag} alt={third.code} className="w-full h-full object-cover" />
                                ) : (
                                  third.code
                                )}
                              </div>
                              <span className="font-semibold text-white/90 truncate flex-1">{third.name}</span>
                              <span className="text-[9px] font-bold text-white/40 bg-white/5 px-1 rounded uppercase shrink-0">{groupName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#ffd700]" /> Convidar Integrantes
              </h2>

              {/* Invite Code Card */}
              <div className="auth-card p-5 border border-white/10 relative overflow-hidden bg-gradient-to-r from-[#0d2b1a]/40 to-transparent">
                <div className="absolute top-0 right-0 p-3 opacity-5">
                  <Users className="w-16 h-16 text-[#ffd700]" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  📢 Convidar Amigos
                </h3>
                <p className="text-xs text-white/60 mb-4">Compartilhe o código de convite para trazer novos participantes para o seu grupo!</p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 bg-black/40 border border-white/10 px-3 py-2.5 rounded-xl text-sm font-mono text-center font-bold text-[#ffd700] tracking-wider select-all">
                    {group.inviteCode}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(group.inviteCode);
                      toast.success("Código copiado para a área de transferência!");
                    }}
                    className="copa-btn-primary px-4 py-2.5 text-xs shadow-md"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* Group stats card */}
              <div className="auth-card p-5 border border-white/10 bg-black/20">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider text-white/40">Resumo do Grupo</h3>
                <div className="space-y-3 text-xs text-white/70">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span>Máximo de Vagas:</span>
                    <span className="font-bold text-[#ffd700]">{group.maxMembers}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span>Criador:</span>
                    <span className="font-bold text-white">{group.owner.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Criado em:</span>
                    <span className="font-bold text-white">{new Date(group.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      </div>
    </div>
  );
}
