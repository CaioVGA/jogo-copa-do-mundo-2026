"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Users, ArrowLeft, Loader2, Sparkles, Target, Activity, CalendarDays, Medal, Crown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, QrCode, Coins, Copy, Check, Clock, Lock, Award, LayoutGrid, Star, GripVertical, Zap, ShieldCheck, TrendingUp } from "lucide-react";
import { groupsApi, teamsApi, predictionsApi, playersApi } from "@/lib/api";
import { useToast, useConfirm } from "@/components/ui/toast";
import type { MatchPredictionData, PlayerData } from "@/lib/api";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import EditGroupModal from "@/components/groups/EditGroupModal";
import { formatMatchDateTime, getMatchKickoffTimestamp, isMatchClosed } from "@/lib/match-time";

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
  const isLive = game.status === "LIVE";
  const nowMs = Date.now();
  const isClosed = isMatchClosed(game.date, nowMs);
  const saving = savingMatchId === game.id;
  
  // Deadline text
  const diffMs = getMatchKickoffTimestamp(game.date) - nowMs;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let deadlineText = "Aberto";
  let deadlineColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
  
  if (isLive) {
    deadlineText = "Ao Vivo";
    deadlineColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.15)]";
  } else if (isFinished) {
    deadlineText = "Finalizado";
    deadlineColor = "text-rose-400 border-rose-500/20 bg-rose-500/10";
  } else if (isClosed) {
    deadlineText = "Pendente";
    deadlineColor = "text-amber-400 border-amber-500/20 bg-amber-500/10";
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
    <div className="flex flex-col bg-black/40 border border-white/5 rounded-xl overflow-hidden hover:border-[#ffd700]/25 transition-all w-64 shrink-0 select-none">
      {/* Small Header */}
      <div className="bg-black/20 px-2 py-1.5 flex items-center justify-between border-b border-white/5 text-[10px] text-white/40" title={game.stadium || undefined}>
        <span className="truncate max-w-[110px]" title={game.stage}>{game.stage}</span>
        <span className="hidden sm:inline text-[10px] text-white/50">{formatMatchDateTime(game.date)}</span>
        <span className={`px-1.5 py-0.5 rounded border font-bold flex items-center gap-1 ${deadlineColor}`}>
          {isLive && <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />}
          {isFinished && <span className="w-1 h-1 rounded-full bg-red-500" />}
          {isClosed && !isLive && !isFinished && <span className="w-1 h-1 rounded-full bg-amber-400" />}
          {deadlineText}
        </span>
      </div>
      
      {/* Teams and Scores */}
      <div className="p-2.5 flex flex-col gap-2">
        {/* Home Team Row */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center font-bold text-[8px] team-flag-shell-3d">
              {game.homeTeam.flag ? (
                <img src={game.homeTeam.flag} alt={game.homeTeam.code} className="w-full h-full object-cover team-flag-3d" />
              ) : (
                game.homeTeam.code
              )}
            </div>
            <span className="text-[10px] font-bold text-white/80 truncate" title={game.homeTeam.name}>
              {game.homeTeam.name}
            </span>
          </div>
          {isClosed ? (
            <span className={`text-xs font-black shrink-0 ${isFinished || isLive ? (isLive ? "text-emerald-400 animate-pulse" : "text-white") : "text-[#ffd700]"}`}>
              {isFinished || isLive ? game.realHomeScore : (game.predictedHomeScore ?? "-")}
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
              className="w-11 h-10 text-center text-xs font-bold rounded bg-black/60 border border-white/10 text-white focus:border-[#ffd700] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          )}
        </div>

        {/* Away Team Row */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center font-bold text-[8px] team-flag-shell-3d">
              {game.awayTeam.flag ? (
                <img src={game.awayTeam.flag} alt={game.awayTeam.code} className="w-full h-full object-cover team-flag-3d" />
              ) : (
                game.awayTeam.code
              )}
            </div>
            <span className="text-[10px] font-bold text-white/80 truncate" title={game.awayTeam.name}>
              {game.awayTeam.name}
            </span>
          </div>
          {isClosed ? (
            <span className={`text-xs font-black shrink-0 ${isFinished || isLive ? (isLive ? "text-emerald-400 animate-pulse" : "text-white") : "text-[#ffd700]"}`}>
              {isFinished || isLive ? game.realAwayScore : (game.predictedAwayScore ?? "-")}
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
              className="w-11 h-10 text-center text-xs font-bold rounded bg-black/60 border border-white/10 text-white focus:border-[#ffd700] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          )}
        </div>
      </div>

      {/* Footer (Save button or scored points badge) */}
      <div className="bg-black/15 p-2 flex justify-between items-center text-[10px] border-t border-white/5">
        {isFinished || isLive ? (
          game.predictedHomeScore !== null ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] text-white/40">Palpite: {game.predictedHomeScore}x{game.predictedAwayScore}</span>
              {isFinished ? (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black border leading-none ${
                  game.pointsEarned === 5 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                  game.pointsEarned === 4 ? "text-teal-400 bg-teal-500/10 border-teal-500/20" :
                  game.pointsEarned === 3 ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                  game.pointsEarned === 1 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                  "text-red-400 bg-red-500/10 border-red-500/20"
                }`}>
                  +{game.pointsEarned} pts
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-black border leading-none text-emerald-400 bg-emerald-500/10 border-emerald-500/20 animate-pulse">
                  Ao Vivo
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full text-white/35 italic">
              <span>Sem palpite</span>
              {isLive && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-black border leading-none text-emerald-400 bg-emerald-500/10 border-emerald-500/20 animate-pulse">
                  Ao Vivo
                </span>
              )}
            </div>
          )
        ) : !isClosed ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-white/40 truncate max-w-[120px]">
              {game.predictedHomeScore !== null ? (
                <span className="text-emerald-400 font-semibold">Salvo: {game.predictedHomeScore}x{game.predictedAwayScore}</span>
              ) : (
                "Não palpitado"
              )}
            </span>
            <button
              disabled={saving}
              onClick={() => handleSavePrediction(game.id)}
              className="bg-[#ffd700] hover:bg-[#f5c800] text-[#0d2b1a] px-3 py-2 min-h-11 rounded text-[10px] font-black uppercase transition-all disabled:opacity-40"
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
  handleSavePredictionDirect?: (matchId: string, homeScore: number, awayScore: number) => Promise<void>;
  isOracleMode?: boolean;
  oracleWinner?: string;
  onOracleSelect?: (matchId: string, teamCode: string) => void;
  oracleHomeTeam?: { code: string; name: string; flag: string | null } | null;
  oracleAwayTeam?: { code: string; name: string; flag: string | null } | null;
  isLocked?: boolean;
}

function OracleBracketCircleMatch({ 
  game, 
  savingMatchId, 
  handleSavePredictionDirect,
  isOracleMode,
  oracleWinner,
  onOracleSelect,
  oracleHomeTeam,
  oracleAwayTeam,
  isLocked
}: OracleBracketCircleMatchProps) {
  const isFinished = game.status === "FINISHED";
  const isLive = game.status === "LIVE";
  const isClosed = !isOracleMode && isMatchClosed(game.date);
  const saving = savingMatchId === game.id;

  const homePredicted = game.predictedHomeScore !== null && game.predictedAwayScore !== null && game.predictedHomeScore > game.predictedAwayScore;
  const awayPredicted = game.predictedHomeScore !== null && game.predictedAwayScore !== null && game.predictedHomeScore < game.predictedAwayScore;

  const homeWon = isFinished && game.realHomeScore !== null && game.realAwayScore !== null && (
    game.realHomeScore > game.realAwayScore ||
    (game.realHomeScore === game.realAwayScore && (game.homePenalties || 0) > (game.awayPenalties || 0))
  );

  const awayWon = isFinished && game.realHomeScore !== null && game.realAwayScore !== null && (
    game.realHomeScore < game.realAwayScore ||
    (game.realHomeScore === game.realAwayScore && (game.homePenalties || 0) < (game.awayPenalties || 0))
  );

  const bothTeamsDefined = (() => {
    const home = oracleHomeTeam || game.homeTeam;
    const away = oracleAwayTeam || game.awayTeam;
    const isUndecided = (t: any) => !t || !t.code || t.name?.startsWith("Vencedor") || t.name?.startsWith("Perdedor");
    return !isUndecided(home) && !isUndecided(away);
  })();
  const homeTeamCurrent = (isOracleMode && oracleHomeTeam) ? oracleHomeTeam : game.homeTeam;
  const awayTeamCurrent = (isOracleMode && oracleAwayTeam) ? oracleAwayTeam : game.awayTeam;
  const winnerMatchesTeam = (winner: string | undefined, targetTeam: any, isTargetHome: boolean) => {
    if (!winner || winner === "TBD" || !targetTeam) return false;
    const targetIdentifier = targetTeam?.code === "TBD" ? `TBD_${game.id}_${isTargetHome ? "HOME" : "AWAY"}` : targetTeam?.code;
    return winner === targetIdentifier || winner === targetTeam?.code || winner === targetTeam?.name;
  };
  const isFinalStage = (game.stage || "").trim().toLowerCase() === "final";

  const handleSelectTeam = async (isHome: boolean) => {
    if (saving) return;
    
    if (isOracleMode && onOracleSelect) {
      if (!bothTeamsDefined) return;
      const team = isHome ? (oracleHomeTeam || game.homeTeam) : (oracleAwayTeam || game.awayTeam);
      if (team) {
        const identifier = team.code === "TBD" ? `TBD_${game.id}_${isHome ? 'HOME' : 'AWAY'}` : team.code;
        if (identifier) onOracleSelect(game.id, identifier);
      }
      return;
    }

    if (isClosed || !handleSavePredictionDirect) return;
    const homeScore = isHome ? 1 : 0;
    const awayScore = isHome ? 0 : 1;
    await handleSavePredictionDirect(game.id, homeScore, awayScore);
  };

  const renderTeamCircle = (isHome: boolean) => {
    const originalTeam = isHome ? game.homeTeam : game.awayTeam;
    const dynamicTeam = isHome ? oracleHomeTeam : oracleAwayTeam;
    const team = (isOracleMode && dynamicTeam) ? dynamicTeam : originalTeam;
    const teamName = team?.name;
    const teamIdentifier = team?.code === "TBD" ? `TBD_${game.id}_${isHome ? 'HOME' : 'AWAY'}` : team?.code;
    const isSelected = isOracleMode
      ? !!team && (
          oracleWinner === teamIdentifier ||
          oracleWinner === team?.code ||
          oracleWinner === team?.name
        )
      : (isHome ? homePredicted : awayPredicted);
    const hasAnySelection = isOracleMode
      ? winnerMatchesTeam(oracleWinner, homeTeamCurrent, true) || winnerMatchesTeam(oracleWinner, awayTeamCurrent, false)
      : (homePredicted || awayPredicted);
    const isLoser = hasAnySelection && !isSelected;
    const isWinner = isOracleMode ? false : (isHome ? homeWon : awayWon);
    const isUndecided = !team || !team.code || teamName?.startsWith("Vencedor") || teamName?.startsWith("Perdedor");

    if (isUndecided) {
      return (
        <div className="flex flex-col items-center gap-1 group relative">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center text-white/30 text-xs font-black select-none">
            {isLocked && !isSelected && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Lock className="w-4 h-4 text-white/40" />
              </div>
            )}
            ?
          </div>
          <span className={`text-[8px] font-bold uppercase tracking-wide truncate max-w-[50px] ${
            isLocked && !isSelected ? "text-white/20" :
            isSelected ? "text-[#ffd700]" : 
            isWinner ? "text-emerald-400" : 
            isLoser ? "text-white/20 line-through" : 
            "text-white/60 group-hover:text-white"
          }`}>
            {teamName?.replace("Vencedor", "Venc.").replace("Perdedor", "Perd.") || "A definir"}
          </span>
        </div>
      );
    }

    const disabledInteraction = (isClosed && !isOracleMode) || saving || (isOracleMode && (!bothTeamsDefined || isLocked));

    return (
      <button
        type="button"
        disabled={disabledInteraction}
        onClick={() => handleSelectTeam(isHome)}
        className={`flex flex-col items-center gap-1 group relative hover:z-50 transition-all duration-300 focus:outline-none ${
          disabledInteraction ? "cursor-default" : "cursor-pointer hover:scale-105 active:scale-95"
        }`}
      >
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 border-2 relative transition-all duration-300 bg-[#0d2b1a] flex items-center justify-center team-flag-shell-3d ${
            isLocked && !isSelected
              ? "border-white/5 opacity-50 grayscale"
              : isSelected
              ? "border-[#ffd700] ring-4 ring-[#ffd700]/30 shadow-lg shadow-[#ffd700]/20 scale-105"
              : isWinner
              ? "border-emerald-400 ring-2 ring-emerald-500/20"
              : isLoser
              ? "border-transparent"
              : disabledInteraction
              ? "border-white/5"
              : "border-white/10 group-hover:border-white/30"
          }`}
        >
          {team.flag ? (
            <img
              src={team.flag}
              alt={team.code}
              className="w-full h-full object-cover team-flag-3d animate-fade-in transition-all duration-300"
              style={isLoser ? { filter: "grayscale(1) saturate(0) brightness(0.45) contrast(0.9)" } : undefined}
            />
          ) : (
            <span className={`text-white font-black text-[10px] transition-all duration-300 ${isLoser ? "opacity-40" : ""}`}>{team.code}</span>
          )}

          {isLoser && (
            <div className="absolute inset-0 bg-black/30 pointer-events-none z-20" />
          )}

          {saving && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-[#ffd700] animate-spin" />
            </div>
          )}
        </div>

        <span
          className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded transition-all duration-300 uppercase ${
            isSelected
              ? "bg-[#ffd700] text-[#0d2b1a] shadow"
              : "bg-black/40 text-white/70 group-hover:text-white"
          }`}
        >
          {team.code}
        </span>

        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
          <div className="bg-black/90 border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap">
            {team.name}
          </div>
          <div className="w-1.5 h-1.5 bg-black border-r border-b border-white/10 rotate-45 -mt-1" />
        </div>
      </button>
    );
  };

  const correctPrediction = isOracleMode
    ? (isFinished && !!oracleWinner && oracleWinner !== "TBD" && ((homeWon && oracleWinner === (oracleHomeTeam?.code || game.homeTeam?.code)) || (awayWon && oracleWinner === (oracleAwayTeam?.code || game.awayTeam?.code))))
    : ((homePredicted && homeWon) || (awayPredicted && awayWon));
  return (
    <div className="flex flex-col items-center bg-black/25 border border-white/5 rounded-2xl p-2 px-2.5 sm:px-3.5 hover:border-[#ffd700]/10 transition-all duration-300 w-[74px] sm:w-20 shrink-0 relative select-none">
      {isFinished && isOracleMode && oracleWinner && oracleWinner !== "TBD" && (
        <div className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg border absolute -top-2 -right-2 shadow-lg z-30 ${
          correctPrediction
            ? "text-emerald-900 border-emerald-500 bg-emerald-400"
            : "text-red-100 border-red-500/50 bg-red-500/80"
        }`}>
          {correctPrediction ? "+5" : "0"}
        </div>
      )}

      {renderTeamCircle(true)}

      <div className="my-1.5 flex flex-col items-center relative z-10">
        <div className="w-0.5 h-3 bg-white/10" />
        {isFinished || isLive ? (
          <div className="flex flex-col items-center relative z-20">
            <div className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border leading-none -my-1 whitespace-nowrap bg-black relative z-10 ${
              isLive
                ? "text-emerald-400 border-emerald-500/30 animate-pulse shadow-sm shadow-emerald-500/10"
                : correctPrediction
                ? "text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                : "text-red-400 border-red-500/30 bg-red-500/10"
            }`}>
              {game.homePenalties != null ? `(${game.homePenalties}) ` : ""}{game.realHomeScore}-{game.realAwayScore}{game.awayPenalties != null ? ` (${game.awayPenalties})` : ""}
            </div>
          </div>
        ) : (
          <div className="text-[7px] font-black text-white/30 tracking-widest uppercase bg-black px-1 rounded-full border border-white/5 -my-1 z-20">
            vs
          </div>
        )}
        <div className="w-0.5 h-3 bg-white/10" />

        {isFinished && !isOracleMode && game.predictedHomeScore !== null && (
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("geral");
  const [teams, setTeams] = useState<Record<string, string>>({});
  const [oracleGroups, setOracleGroups] = useState<Record<string, any[]>>({});
  const [savingOracle, setSavingOracle] = useState(false);
  const [oracleMessage, setOracleMessage] = useState<string | null>(null);
  const [isGroupStageFinished, setIsGroupStageFinished] = useState(false);
  const [nextMatchIsKnockout, setNextMatchIsKnockout] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ groupName: string; index: number } | null>(null);
  const [oracleSubTab, setOracleSubTab] = useState<"classificacoes" | "premiacoes">("classificacoes");
  const [classificationsSubTab, setClassificationsSubTab] = useState<"grupos" | "matamata">("grupos");
  const [oracleKnockout, setOracleKnockout] = useState<Record<string, string>>({});
  const [knockoutDeadlines, setKnockoutDeadlines] = useState<Record<string, string>>({});
  const [bracketRound, setBracketRound] = useState<"all" | "r32" | "r16" | "r8" | "r4" | "r2">("all");

  useEffect(() => {
    if (isGroupStageFinished || nextMatchIsKnockout) {
      setBolaoCategory("MATA_MATA");
      setBolaoSelectedGroup("ALL_MATA_MATA");
      setClassificationsSubTab("matamata");
    }
  }, [isGroupStageFinished, nextMatchIsKnockout]);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [topScorer, setTopScorer] = useState("");
  const [assistLeader, setAssistLeader] = useState("");
  const [bestPlayer, setBestPlayer] = useState("");
  const [openAwardDropdown, setOpenAwardDropdown] = useState<"scorer" | "assist" | "best" | null>(null);
  const [savingAwards, setSavingAwards] = useState(false);
  const [awardsMessage, setAwardsMessage] = useState<string | null>(null);

  // Real games state
  const [games, setGames] = useState<MatchPredictionData[]>([]);
  const [predScores, setPredScores] = useState<Record<string, { home: string; away: string }>>({});
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [updatingPaidMemberId, setUpdatingPaidMemberId] = useState<string | null>(null);

  // Paginação dos palpites na aba Geral
  const [currentPage, setCurrentPage] = useState(1);
  const [userPaginatingGeral, setUserPaginatingGeral] = useState(false);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    if (!userPaginatingGeral && games.length > 0) {
      const index = games.findIndex((m) => m.status !== "FINISHED");
      if (index !== -1) {
        setCurrentPage(Math.floor(index / ITEMS_PER_PAGE) + 1);
      } else {
        const lastPage = Math.ceil(games.length / ITEMS_PER_PAGE) || 1;
        setCurrentPage(lastPage);
      }
    }
  }, [games, userPaginatingGeral]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedGames = games.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(games.length / ITEMS_PER_PAGE) || 1;

  // Filtros da aba Bolão (Fase de Grupos vs Mata-Mata)
  const [bolaoCategory, setBolaoCategory] = useState<"GRUPOS" | "MATA_MATA">("GRUPOS");
  const [bolaoSelectedGroup, setBolaoSelectedGroup] = useState<string>("ALL_GRUPOS");
  const bolaoScrollContainerRef = useRef<HTMLDivElement>(null);

  // Paginação dos palpites na aba Bolão
  const [bolaoPage, setBolaoPage] = useState(1);
  const [userPaginatingBolao, setUserPaginatingBolao] = useState(false);

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

  const getStageLevel = (stage: string) => {
    if (!stage) return 0;
    if (stage === "Dezesseisavos de Final") return 1;
    if (stage === "Oitavas de Final") return 2;
    if (stage === "Quartas de Final") return 3;
    if (stage === "Semifinais" || stage.startsWith("Semifinal")) return 4;
    if (stage === "Final" || stage.startsWith("Terceiro") || stage.startsWith("Disputa")) return 5;
    return 0;
  };

  const isKnockoutMatchLocked = (match: MatchPredictionData) =>
    match.status !== "PENDING" || isMatchClosed(match.date);

  const handleOracleKnockoutSelect = async (matchId: string, teamCode: string) => {
    const previousKnockout = { ...oracleKnockout };
    const oldTeamCode = oracleKnockout[matchId];
    let newKnockout = { ...oracleKnockout };

    // Se houver substituição de time, devemos atualizar as escolhas futuras (propagação)
    if (oldTeamCode && oldTeamCode !== teamCode) {
      const changedGame = games.find(g => g.id === matchId);
      const matchLevel = getStageLevel(changedGame?.stage || "");

      Object.keys(newKnockout).forEach(k => {
        if (k !== matchId) {
          const gameK = games.find(g => g.id === k);
          const kLevel = getStageLevel(gameK?.stage || "");
          
          // Somente propagar para fases futuras para evitar reverter fases passadas
          if (kLevel > matchLevel) {
            if (newKnockout[k] === oldTeamCode) {
              newKnockout[k] = teamCode;
            }
          }
        }
      });
    }

    newKnockout[matchId] = teamCode;
    setOracleKnockout(newKnockout);

    setSavingMatchId(matchId);
    try {
      const payload = Object.keys(oracleGroups).map((gName) => ({
        groupName: gName,
        teamOrder: oracleGroups[gName].map((t) => t.code),
      }));
      const knockoutPayload = Object.keys(newKnockout).map((mId) => ({
        matchId: mId,
        predictedWinner: newKnockout[mId],
      }));
      await groupsApi.saveOraclePredictions(groupId, payload, knockoutPayload);
    } catch (err: any) {
      console.error("[Oráculo Mata-Mata] Falha ao atualizar palpite", {
        groupId,
        matchId,
        attemptedWinner: teamCode,
        error: err,
      });
      setOracleKnockout(previousKnockout);
      toast.error(err.message || "Erro ao salvar palpite");
    } finally {
      setSavingMatchId(null);
    }
  };

  const getOracleTeamForSlot = (
    gameId: string, 
    isHome: boolean, 
    roundGames: MatchPredictionData[], 
    parentRoundGames: MatchPredictionData[]
  ) => {
    const game = resolvedGames.find(g => g.id === gameId) || games.find(g => g.id === gameId);
    if (!game) return null;

    const getFinishedWinnerCode = (match: MatchPredictionData) => {
      if (
        match.status !== "FINISHED" ||
        match.realHomeScore === null ||
        match.realAwayScore === null
      ) {
        return null;
      }

      if (match.realHomeScore > match.realAwayScore) return match.homeTeam?.code || null;
      if (match.realHomeScore < match.realAwayScore) return match.awayTeam?.code || null;

      if (match.homePenalties != null && match.awayPenalties != null) {
        if (match.homePenalties > match.awayPenalties) return match.homeTeam?.code || null;
        if (match.homePenalties < match.awayPenalties) return match.awayTeam?.code || null;
      }

      return null;
    };

    const resolveTeamInMatch = (match: MatchPredictionData, teamCode: string) => {
      if (match.homeTeam?.code === teamCode) return match.homeTeam;
      if (match.awayTeam?.code === teamCode) return match.awayTeam;
      return null;
    };
    
    let parentGameId = null;
    const fallback = isHome ? game.homeTeamFallback : game.awayTeamFallback;
    if (fallback) {
      const match = fallback.match(/^(Vencedor|Perdedor) do jogo (\d+)$/);
      if (match) {
        const matchNumber = parseInt(match[2], 10);
        const parentMatch = resolvedGames.find(g => g.matchNumber === matchNumber) || games.find(g => g.matchNumber === matchNumber);
        if (parentMatch) {
          parentGameId = parentMatch.id;
        }
      }
    }

    if (!parentGameId) {
      const index = roundGames.findIndex(g => g.id === gameId);
      if (index !== -1) {
        const parentGame = parentRoundGames[index * 2 + (isHome ? 0 : 1)];
        if (parentGame) parentGameId = parentGame.id;
      }
    }

    if (!parentGameId) return null;

    const parentGame = resolvedGames.find(g => g.id === parentGameId) || games.find(g => g.id === parentGameId);
    if (!parentGame) return null;

    const finishedWinnerCode = getFinishedWinnerCode(parentGame);
    if (finishedWinnerCode) {
      const teamFromParent = resolveTeamInMatch(parentGame, finishedWinnerCode);
      if (teamFromParent) return teamFromParent;
      return { code: finishedWinnerCode, name: finishedWinnerCode, flag: teams[finishedWinnerCode] || null };
    }

    const winnerCode = oracleKnockout[parentGameId];
    if (!winnerCode) return null;

    for (const g of resolvedGames) {
      if (g.homeTeam?.code === winnerCode || g.homeTeam?.name === winnerCode || `TBD_${g.id}_HOME` === winnerCode) {
        return { ...g.homeTeam, code: winnerCode };
      }
      if (g.awayTeam?.code === winnerCode || g.awayTeam?.name === winnerCode || `TBD_${g.id}_AWAY` === winnerCode) {
        return { ...g.awayTeam, code: winnerCode };
      }
    }
    return { code: winnerCode, name: winnerCode, flag: teams[winnerCode] || null };
  };

  const getOracleLoserForSlot = (
    gameId: string, 
    isHome: boolean, 
    roundGames: MatchPredictionData[], 
    parentRoundGames: MatchPredictionData[],
    grandparentRoundGames: MatchPredictionData[]
  ) => {
    const game = resolvedGames.find(g => g.id === gameId) || games.find(g => g.id === gameId);
    if (!game) return null;

    const getFinishedLoserCode = (match: MatchPredictionData) => {
      if (
        match.status !== "FINISHED" ||
        match.realHomeScore === null ||
        match.realAwayScore === null
      ) {
        return null;
      }

      if (match.realHomeScore > match.realAwayScore) return match.awayTeam?.code || null;
      if (match.realHomeScore < match.realAwayScore) return match.homeTeam?.code || null;

      if (match.homePenalties != null && match.awayPenalties != null) {
        if (match.homePenalties > match.awayPenalties) return match.awayTeam?.code || null;
        if (match.homePenalties < match.awayPenalties) return match.homeTeam?.code || null;
      }

      return null;
    };

    const resolveTeamInMatch = (match: MatchPredictionData, teamCode: string) => {
      if (match.homeTeam?.code === teamCode) return match.homeTeam;
      if (match.awayTeam?.code === teamCode) return match.awayTeam;
      return null;
    };

    let parentGameId = null;
    const fallback = isHome ? game.homeTeamFallback : game.awayTeamFallback;
    if (fallback) {
      const match = fallback.match(/^(Vencedor|Perdedor) do jogo (\d+)$/);
      if (match) {
        const matchNumber = parseInt(match[2], 10);
        const parentMatch = resolvedGames.find(g => g.matchNumber === matchNumber) || games.find(g => g.matchNumber === matchNumber);
        if (parentMatch) {
          parentGameId = parentMatch.id;
        }
      }
    }

    if (!parentGameId) {
      const index = roundGames.findIndex(g => g.id === gameId);
      if (index !== -1) {
        const parentGame = parentRoundGames[index * 2 + (isHome ? 0 : 1)];
        if (parentGame) parentGameId = parentGame.id;
      }
    }

    if (!parentGameId) return null;

    const parentGame = resolvedGames.find(g => g.id === parentGameId) || games.find(g => g.id === parentGameId);
    if (!parentGame) return null;

    const finishedLoserCode = getFinishedLoserCode(parentGame);
    if (finishedLoserCode) {
      const teamFromParent = resolveTeamInMatch(parentGame, finishedLoserCode);
      if (teamFromParent) return teamFromParent;
      return { code: finishedLoserCode, name: finishedLoserCode, flag: teams[finishedLoserCode] || null };
    }

    const winnerCode = oracleKnockout[parentGameId];
    if (!winnerCode) return null;

    const homeTeamOfParent = getOracleTeamForSlot(parentGameId, true, parentRoundGames, grandparentRoundGames);
    const awayTeamOfParent = getOracleTeamForSlot(parentGameId, false, parentRoundGames, grandparentRoundGames);

    if (homeTeamOfParent?.code === winnerCode) return awayTeamOfParent;
    if (awayTeamOfParent?.code === winnerCode) return homeTeamOfParent;

    return null;
  };

  // Reset pagination when selected group filter changes
  useEffect(() => {
    setUserPaginatingBolao(false);
  }, [bolaoSelectedGroup, bolaoCategory]);

  // Derivação dos jogos do bolão com agrupamento e filtragem
  const getGroupName = (game: MatchPredictionData) => {
    if (game.stage && game.stage.startsWith('Fase de Grupos') && game.homeTeam?.group) {
      return `Grupo ${game.homeTeam.group}`;
    }
    return game.stage || 'Fase Final';
  };

  const groupedGames = useMemo(() => games.reduce<Record<string, MatchPredictionData[]>>((acc, game) => {
    const groupName = getGroupName(game);
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(game);
    return acc;
  }, {}), [games]);

  const sortedGroupKeys = useMemo(() => Object.keys(groupedGames).sort((a, b) => {
    const idxA = ALL_GROUPS.indexOf(a);
    const idxB = ALL_GROUPS.indexOf(b);
    const valA = idxA === -1 ? 999 : idxA;
    const valB = idxB === -1 ? 999 : idxB;
    return valA - valB;
  }), [groupedGames]);

  const filteredBolaoGroups = useMemo(() => {
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
  }, [bolaoCategory, bolaoSelectedGroup, sortedGroupKeys]);

  const allFilteredBolaoMatches = useMemo(() => {
    const matches: MatchPredictionData[] = [];
    filteredBolaoGroups.forEach((gName) => {
      const gMatches = groupedGames[gName] || [];
      matches.push(...gMatches);
    });
    // Sort filtered matches strictly by date
    matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return matches;
  }, [filteredBolaoGroups, groupedGames]);

  useEffect(() => {
    if (!userPaginatingBolao && allFilteredBolaoMatches.length > 0) {
      const index = allFilteredBolaoMatches.findIndex((m) => m.status !== "FINISHED");
      if (index !== -1) {
        setBolaoPage(Math.floor(index / ITEMS_PER_PAGE) + 1);
      } else {
        const lastPage = Math.ceil(allFilteredBolaoMatches.length / ITEMS_PER_PAGE) || 1;
        setBolaoPage(lastPage);
      }
    }
  }, [allFilteredBolaoMatches, userPaginatingBolao]);

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
  const isOwner = group && currentUser && group.ownerId === currentUser.id;

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
        setOracleKnockout(data.knockoutPredictions || {});
        setIsGroupStageFinished(data.isGroupStageFinished || false);
        setKnockoutDeadlines(data.knockoutDeadlines || {});
      } catch (err) {
        console.error("Erro ao carregar oráculo:", err);
      }
    }
    async function loadGames() {
      try {
        const data = await predictionsApi.getPredictions(groupId);
        const allMatches: MatchPredictionData[] = [];
        Object.values(data).forEach((groupMatches) => {
          allMatches.push(...groupMatches);
        });
        // Ordena de forma estritamente crescente em relação a data e horário
        allMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setGames(allMatches);

        const nextMatch = allMatches.find(m => m.status !== "FINISHED");
        setNextMatchIsKnockout(Boolean(nextMatch && !nextMatch.stage.startsWith("Grupo")));

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

    async function loadPlayers() {
      try {
        const data = await playersApi.getPlayers();
        setPlayers(data);
      } catch (err) {
        console.error("Erro ao carregar jogadores:", err);
      }
    }

    if (groupId) {
      loadGroup();
      loadTeams();
      loadOracle();
      loadGames();
      loadPlayers();
    }
  }, [groupId]);

  useEffect(() => {
    if (group && currentUser) {
      const myMember = group.members.find((m: any) => String(m.userId) === String(currentUser.id));
      if (myMember) {
        setTopScorer(myMember.topScorer || "");
        setAssistLeader(myMember.assistLeader || "");
        setBestPlayer(myMember.bestPlayer || "");
      }
    }
  }, [group, currentUser]);

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
      await predictionsApi.savePredictions(groupId, [{ matchId, homeScore: homeVal, awayScore: awayVal }]);
      
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
      await predictionsApi.savePredictions(groupId, [{ matchId, homeScore, awayScore }]);
      
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

  const handleSaveAwards = async () => {
    setSavingAwards(true);
    setAwardsMessage(null);
    try {
      const res = await groupsApi.saveIndividualAwards(groupId, {
        topScorer: topScorer || undefined,
        assistLeader: assistLeader || undefined,
        bestPlayer: bestPlayer || undefined,
      });
      setAwardsMessage(res.message);
      toast.success(res.message);
      const data = await groupsApi.getGroupById(groupId);
      setGroup(data);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Erro ao salvar palpites";
      setAwardsMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setSavingAwards(false);
    }
  };

  const renderSelectedPlayerCard = (player: PlayerData | undefined) => {
    if (!player) return null;

    return (
      <div className="auth-card p-3 border border-white/10 bg-white/[0.02] rounded-2xl flex items-center gap-3 w-full sm:w-[280px] max-w-[280px] shrink-0 relative overflow-hidden transition-all duration-300 hover:border-white/20">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20 bg-white/5 flex items-center justify-center font-bold text-xs relative team-flag-shell-3d">
          {player.team?.flag ? (
            <img src={player.team.flag} alt={player.team.name} className="w-full h-full object-cover team-flag-3d" />
          ) : (
            <span className="text-white/60 font-black">{player.team?.code || "??"}</span>
          )}
        </div>
        
        <div className="min-w-0">
          <p className="text-xs font-black text-white truncate">{player.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="bg-white/5 border border-white/10 text-white/50 text-[9px] px-1.5 py-0.5 rounded font-medium">
              {player.position}
            </span>
            <span className="bg-white/10 border border-white/20 text-white text-[9px] px-1.5 py-0.5 rounded font-black">
              {player.team?.name || player.team?.code}
            </span>
          </div>
        </div>
      </div>
    );
  };

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

  // Encontra o primeiro jogo da fase de grupos para travar o Oráculo
  const firstGroupMatch = (() => {
    const groupMatches = games.filter((g) => g.stage?.startsWith("Fase de Grupos"));
    if (groupMatches.length === 0) return null;
    const sorted = [...groupMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted[0];
  })();

  // Prazos distintos para o Oráculo
  const oracleGroupsDeadline = new Date("2026-06-11T16:00:00-03:00");
  const oracleKnockoutDeadline = new Date("2026-06-28T16:00:00-03:00");
  
  const isOracleGroupsClosed = new Date() >= oracleGroupsDeadline;
  const isOracleKnockoutClosed = new Date() >= oracleKnockoutDeadline;

  // O fechamento geral do Oráculo depende da aba selecionada
  const isOracleClosed = classificationsSubTab === "grupos" 
    ? isOracleGroupsClosed 
    : isOracleKnockoutClosed;

  const activeDeadlineDate = classificationsSubTab === "grupos"
    ? oracleGroupsDeadline
    : oracleKnockoutDeadline;

  const formattedFirstMatchDate = activeDeadlineDate.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  // Flag informando quantos dias restam ou se já encerrou para palpitar no Oráculo
  const oracleDeadlineText = (() => {
    if (isOracleClosed) {
      return { text: "Encerrado", color: "text-red-400 bg-red-500/10 border-red-500/20" };
    }
    const now = new Date();
    const diffMs = activeDeadlineDate.getTime() - now.getTime();
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
  const rankedMembersBolao = [...group.members].sort((a, b) => (b.matchPoints || 0) - (a.matchPoints || 0));
  const rankedMembersOracle = [...group.members].sort((a, b) => (b.oraclePoints || 0) - (a.oraclePoints || 0));

  // Tabela real da fase de grupos (mesmos critérios da Visão Geral) para repescagem dos 3ºs
  const realStandingsByGroup = (() => {
    const result: Record<string, Record<string, { points: number; gd: number; gf: number; ga: number; name: string }>> = {};
    const groupMatches = games.filter((g) => g.stage?.startsWith("Fase de Grupos"));

    groupMatches.forEach((match) => {
      const groupLetter = match.homeTeam?.group;
      if (!groupLetter || !match.homeTeam || !match.awayTeam) return;

      if (!result[groupLetter]) result[groupLetter] = {};

      const ensureTeam = (code: string, name: string) => {
        if (!result[groupLetter][code]) {
          result[groupLetter][code] = { points: 0, gd: 0, gf: 0, ga: 0, name };
        }
      };

      ensureTeam(match.homeTeam.code, match.homeTeam.name);
      ensureTeam(match.awayTeam.code, match.awayTeam.name);

      const hScore = match.realHomeScore;
      const aScore = match.realAwayScore;
      if (hScore === null || aScore === null) return;

      const home = result[groupLetter][match.homeTeam.code];
      const away = result[groupLetter][match.awayTeam.code];

      home.gf += hScore;
      home.ga += aScore;
      away.gf += aScore;
      away.ga += hScore;

      if (hScore > aScore) {
        home.points += 3;
      } else if (hScore < aScore) {
        away.points += 3;
      } else {
        home.points += 1;
        away.points += 1;
      }
    });

    Object.values(result).forEach((groupTable) => {
      Object.values(groupTable).forEach((team) => {
        team.gd = team.gf - team.ga;
      });
    });

    return result;
  })();

  const hasGroupStandingData = games.some(
    (g) =>
      g.stage?.startsWith("Fase de Grupos") &&
      g.realHomeScore !== null &&
      g.realAwayScore !== null,
  );

  const { bestThirdTeamCodes, rankedBestThirds, allThirdCandidates } = (() => {
    type ThirdCandidate = {
      code: string;
      name: string;
      flag: string | null;
      groupName: string;
      points: number;
      gd: number;
      gf: number;
    };

    const thirdCandidates: ThirdCandidate[] = [];

    Object.keys(oracleGroups)
      .sort()
      .forEach((groupName) => {
        const third = oracleGroups[groupName]?.[2];
        if (!third) return;

        const stats = realStandingsByGroup[groupName]?.[third.code];
        thirdCandidates.push({
          code: third.code,
          name: third.name,
          flag: third.flag ?? null,
          groupName,
          points: stats?.points ?? 0,
          gd: stats?.gd ?? 0,
          gf: stats?.gf ?? 0,
        });
      });

    thirdCandidates.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name);
    });

    const best = thirdCandidates.slice(0, 8);

    return {
      bestThirdTeamCodes: new Set(best.map((t) => t.code)),
      rankedBestThirds: best,
      allThirdCandidates: thirdCandidates,
    };
  })();

  const realGroupsData = (() => {
    const data: Record<string, any[]> = {};
    Object.keys(realStandingsByGroup).forEach(groupName => {
      const teams = Object.values(realStandingsByGroup[groupName]);
      teams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.name.localeCompare(b.name);
      });
      data[groupName] = teams.map(t => {
        const code = Object.keys(realStandingsByGroup[groupName]).find(k => realStandingsByGroup[groupName][k].name === t.name);
        const flag = games.find(g => g.homeTeam?.code === code)?.homeTeam?.flag || games.find(g => g.awayTeam?.code === code)?.awayTeam?.flag || null;
        return { code, name: t.name, flag }; 
      });
    });
    return data;
  })();

  const realBest8Thirds = (() => {
    if (Object.keys(realStandingsByGroup).length === 0) return { rankedBestThirds: [] };
    const thirdCandidates: any[] = [];
    Object.keys(realGroupsData).forEach(groupName => {
      const third = realGroupsData[groupName]?.[2];
      if (third) {
        const stats = realStandingsByGroup[groupName]?.[third.code];
        thirdCandidates.push({
          ...third,
          groupName,
          points: stats?.points || 0,
          gd: stats?.gd || 0,
          gf: stats?.gf || 0,
        });
      }
    });
    thirdCandidates.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name);
    });
    return { rankedBestThirds: thirdCandidates.slice(0, 8) };
  })();

  const isCopiaCola = group.pixKey?.trim().startsWith("000201");

  const resolvedGames = (() => {
    if (!realBest8Thirds.rankedBestThirds.length || Object.keys(realGroupsData).length === 0) return games;
    
    // Copy the set so we don't mutate the memoized one
    const availableThirds = new Set(realBest8Thirds.rankedBestThirds.map((t: any) => t.groupName));
    
    const resolveRealRoundOf32Team = (teamName: string) => {
      if (!teamName || !realGroupsData) return null;
      const match = teamName.match(/([1-3])º Grupo ([A-L](?:\/[A-L])*)/);
      if (!match) return null;
      const position = parseInt(match[1]);
      const groupsString = match[2];
      if (groupsString.includes('/')) {
        const groupLetters = groupsString.split('/');
        for (const letter of groupLetters) {
          if (availableThirds.has(letter)) {
            availableThirds.delete(letter);
            const team = realGroupsData[letter]?.[position - 1];
            return team ? { ...team, name: `${team.name} (3º Grp ${letter})` } : null;
          }
        }
        return null;
      } else {
        return realGroupsData[groupsString]?.[position - 1] || null;
      }
    };
    
    return games.map(game => {
      if (game.stage === "Dezesseisavos de Final") {
        const resolvedHome = resolveRealRoundOf32Team(game.homeTeam?.name || "");
        const resolvedAway = resolveRealRoundOf32Team(game.awayTeam?.name || "");
        return {
          ...game,
          _originalHomeTeamName: game.homeTeam?.name,
          _originalAwayTeamName: game.awayTeam?.name,
          homeTeam: resolvedHome || game.homeTeam,
          awayTeam: resolvedAway || game.awayTeam
        };
      }
      return game;
    });
  })();

  return (
    <>
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
                {group.entryFee !== undefined && group.entryFee !== null && (
                  <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold">
                    {group.entryFee.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                )}
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
            {isOwner && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="copa-btn-ghost text-xs py-2 px-4 border border-white/10 hover:border-[#ffd700] hover:text-[#ffd700] transition-all shrink-0 cursor-pointer"
              >
                Editar Grupo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="w-full overflow-x-auto copa-scrollbar pb-2 mb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:mb-0 md:overflow-visible">
        <div className="grid grid-cols-4 min-w-[500px] md:min-w-0 p-1 bg-black/20 rounded-xl backdrop-blur-md border border-white/5 max-w-xl mx-auto md:mx-0 relative">
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
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* Left Panel: Geral, Games or Oracle */}
        <div className={`${activeTab === "oraculo" && oracleSubTab === "classificacoes" && classificationsSubTab === "matamata" ? "xl:col-span-3" : "xl:col-span-2"} space-y-6`}>
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
                        {paginatedGames.map((g) => {
                          const game = resolvedGames.find(rg => rg.id === g.id) || g;
                          const isFinished = game.status === "FINISHED";
                          const isLive = game.status === "LIVE";
                          const gameDateMs = getMatchKickoffTimestamp(game.date);
                          const isStarted = Date.now() >= gameDateMs;
                          const isClosed = isFinished || isStarted;

                          // Calcula o prazo dos palpites dinamicamente
                          const nowMs = Date.now();
                          const diffMs = gameDateMs - nowMs;
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
                                <span>{game.stage} • {formatMatchDateTime(game.date)}{game.stadium && ` • ${game.stadium}`}</span>
                                {isLive ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.15)] animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Ao Vivo
                                  </span>
                                ) : isFinished ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    Finalizado
                                  </span>
                                ) : isStarted ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    Pendente
                                  </span>
                                ) : (
                                  <span className={`font-bold px-2 py-0.5 rounded text-[9px] uppercase border ${deadlineColor}`}>
                                    {deadlineText}
                                  </span>
                                )}
                              </div>

                              {/* Match teams and scores */}
                              <div className="p-3.5 flex items-center justify-between gap-3 border-b border-white/5 bg-white/5">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-white/5 shrink-0 team-flag-shell-3d">
                                    {game.homeTeam.flag ? <img src={game.homeTeam.flag} alt={game.homeTeam.code} className="w-full h-full object-cover team-flag-3d" /> : game.homeTeam.code}
                                  </div>
                                  <span className="font-bold text-xs text-white/90 truncate cursor-help" title={game.homeTeam.name}>{game.homeTeam.name}</span>
                                </div>

                                <div className="flex items-center gap-2 px-2.5 py-1 bg-black/40 rounded-lg border border-white/5 font-extrabold text-xs shrink-0">
                                  {isFinished || isLive ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className={isLive ? "text-emerald-400 animate-pulse" : "text-white"}>{game.realHomeScore}</span>
                                        <span className="text-white/30 text-xs">x</span>
                                        <span className={isLive ? "text-emerald-400 animate-pulse" : "text-white"}>{game.realAwayScore}</span>
                                      </div>
                                      {game.homePenalties != null && game.awayPenalties != null && (
                                        <span className="text-[8px] font-bold text-white/50 tracking-wider">
                                          (Pên: {game.homePenalties} - {game.awayPenalties})
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center p-0.5" title="Aguardando início do jogo">
                                      <Clock className="w-3.5 h-3.5 text-white/30" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                  <span className="font-bold text-xs text-white/90 truncate text-right cursor-help" title={game.awayTeam.name}>{game.awayTeam.name}</span>
                                  <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-white/5 shrink-0 team-flag-shell-3d">
                                    {game.awayTeam.flag ? <img src={game.awayTeam.flag} alt={game.awayTeam.code} className="w-full h-full object-cover team-flag-3d" /> : game.awayTeam.code}
                                  </div>
                                </div>
                              </div>

                              {/* Members predictions */}
                              <div className="p-3 bg-black/10 space-y-1.5">
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-1">Palpites do Grupo</p>
                                <div className="max-h-48 overflow-y-auto copa-scrollbar pr-1">
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
                                                <span className="text-white/30 flex items-center justify-center bg-white/5 p-1 rounded border border-white/5" title="Palpite oculto até o início da partida">
                                                  <Lock className="w-3.5 h-3.5" />
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
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      {games.length > ITEMS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4 mt-2">
                          <button
                            onClick={() => {
                              setCurrentPage((prev) => Math.max(prev - 1, 1));
                              setUserPaginatingGeral(true);
                            }}
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
                                    onClick={() => {
                                      setCurrentPage(page as number);
                                      setUserPaginatingGeral(true);
                                    }}
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
                            onClick={() => {
                              setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                              setUserPaginatingGeral(true);
                            }}
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
                        {paginatedBolaoGames.map((g) => {
                          const game = resolvedGames.find(rg => rg.id === g.id) || g;
                          const isFinished = game.status === "FINISHED";
                          const isLive = game.status === "LIVE";
                          const gameDateMs = getMatchKickoffTimestamp(game.date);
                          const isStarted = Date.now() >= gameDateMs;
                          const isClosed = isFinished || isStarted;

                          // Calcula o prazo dos palpites dinamicamente
                          const nowMs = Date.now();
                          const diffMs = gameDateMs - nowMs;
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
                                <span>{game.stage} • {formatMatchDateTime(game.date)}{game.stadium && ` • ${game.stadium}`}</span>
                                {isLive ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.15)] animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Ao Vivo
                                  </span>
                                ) : isFinished ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    Finalizado
                                  </span>
                                ) : isStarted ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    Pendente
                                  </span>
                                ) : (
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border ${deadlineColor}`}>
                                    {deadlineText}
                                  </span>
                                )}
                              </div>
                              <div className="p-3.5 flex items-center justify-between gap-3 sm:gap-4">
                                {/* Team A */}
                                <div className="flex flex-col items-center flex-1 min-w-0">
                                  <div className="w-8 h-8 rounded-full overflow-hidden mb-1.5 flex items-center justify-center font-bold text-sm border border-white/20 bg-white/5 shrink-0 team-flag-shell-3d">
                                    {game.homeTeam.flag ? (
                                      <img src={game.homeTeam.flag} alt={game.homeTeam.code} className="w-full h-full object-cover team-flag-3d" />
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
                                        {isFinished || isLive ? (
                                          <>
                                            <span className={`text-xl sm:text-2xl font-black ${isLive ? "text-emerald-400 animate-pulse" : "text-white"}`}>{game.realHomeScore}</span>
                                            <span className="text-white/30 text-xs font-bold">x</span>
                                            <span className={`text-xl sm:text-2xl font-black ${isLive ? "text-emerald-400 animate-pulse" : "text-white"}`}>{game.realAwayScore}</span>
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
                                      {(isFinished || isLive) && game.homePenalties != null && game.awayPenalties != null && (
                                        <span className="text-[9px] font-bold text-white/50 tracking-wider -mt-1 mb-1">
                                          (Pên: {game.homePenalties} - {game.awayPenalties})
                                        </span>
                                      )}
                                      {(isFinished || isLive) && game.predictedHomeScore !== null && (
                                        <div className="flex flex-col items-center gap-1 mt-1">
                                          <span className="text-[8px] text-[#ffd700] bg-[#ffd700]/10 border border-[#ffd700]/15 px-1.5 py-0.5 rounded font-semibold">
                                            Seu: {game.predictedHomeScore}x{game.predictedAwayScore}
                                          </span>
                                          {isFinished && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border ${
                                              game.pointsEarned === 5 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                                              game.pointsEarned === 4 ? "text-teal-400 bg-teal-500/10 border-teal-500/20" :
                                              game.pointsEarned === 3 ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                                              game.pointsEarned === 1 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                                              "text-red-400 bg-red-500/10 border-red-500/20"
                                            }`}>
                                              +{game.pointsEarned} {game.pointsEarned === 1 ? "ponto" : "pontos"}
                                            </span>
                                          )}
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
                                  <div className="w-8 h-8 rounded-full overflow-hidden mb-1.5 flex items-center justify-center font-bold text-sm border border-white/20 bg-white/5 shrink-0 team-flag-shell-3d">
                                    {game.awayTeam.flag ? (
                                      <img src={game.awayTeam.flag} alt={game.awayTeam.code} className="w-full h-full object-cover team-flag-3d" />
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
                            onClick={() => {
                              setBolaoPage((prev) => Math.max(prev - 1, 1));
                              setUserPaginatingBolao(true);
                            }}
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
                                    onClick={() => {
                                      setBolaoPage(page as number);
                                      setUserPaginatingBolao(true);
                                    }}
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
                            onClick={() => {
                              setBolaoPage((prev) => Math.min(prev + 1, bolaoTotalPages));
                              setUserPaginatingBolao(true);
                            }}
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
                {/* Header do Oráculo — borda dinâmica por status */}
                <div className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${
                  isOracleClosed
                    ? "border-red-500/20 bg-gradient-to-r from-red-500/5 via-black/30 to-black/10"
                    : "border-emerald-500/20 bg-gradient-to-r from-[#0d2b1a]/60 via-black/30 to-black/10"
                }`}>
                  {/* Decoração de fundo */}
                  <div className="absolute top-0 right-0 p-3 sm:p-5 opacity-[0.06] pointer-events-none">
                    <Sparkles className="w-20 h-20 sm:w-28 sm:h-28 text-white" />
                  </div>
                  {/* Barra lateral de status */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${isOracleClosed ? "bg-red-500" : "bg-emerald-500"}`} />

                  <div className="pl-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className={`w-4 h-4 ${isOracleClosed ? "text-red-400" : "text-[#ffd700]"}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Oráculo da Copa 2026</span>
                      </div>
                      <p className="text-xs text-white/55 leading-relaxed max-w-md">
                        {isOracleClosed
                          ? `Palpites encerrados desde ${formattedFirstMatchDate || "o início da Copa"}. Acompanhe as projeções abaixo.`
                          : "Preveja a classificação dos grupos, o chaveamento do mata-mata e as premiações individuais."}
                      </p>
                    </div>
                    {/* Badge de prazo — maior e mais impactante */}
                    <div className={`inline-flex items-center self-start sm:self-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black border shrink-0 ${oracleDeadlineText.color}`}>
                      {isOracleClosed ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>{oracleDeadlineText.text}</span>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs do Oráculo — padronizadas com ícones */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-fit relative z-40">
                  <button
                    onClick={() => setOracleSubTab("classificacoes")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      oracleSubTab === "classificacoes"
                        ? "bg-gradient-to-r from-[#ffd700] to-[#f5c800] text-[#0d2b1a] shadow-md font-black shadow-[#ffd700]/20"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                    Classificações
                  </button>
                  <button
                    onClick={() => setOracleSubTab("premiacoes")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      oracleSubTab === "premiacoes"
                        ? "bg-gradient-to-r from-[#ffd700] to-[#f5c800] text-[#0d2b1a] shadow-md font-black shadow-[#ffd700]/20"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 shrink-0" />
                    Premiações Individuais
                  </button>
                </div>

                {oracleSubTab === "classificacoes" ? (
                  <>
                    {/* Alternador de Classificações (Fase de Grupos vs Mata-Mata) */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-fit mb-4">
                      <button
                        onClick={() => setClassificationsSubTab("grupos")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          classificationsSubTab === "grupos"
                            ? "bg-white/10 text-white border border-white/20 shadow-md font-black"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        Fase de Grupos
                      </button>
                      <div className="relative group">
                          <button
                            onClick={() => setClassificationsSubTab("matamata")}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              classificationsSubTab === "matamata"
                                ? "bg-white/10 text-white border border-white/20 shadow-md font-black"
                                : "text-white/60 hover:text-white"
                            }`}
                          >
                            Mata-Mata
                          </button>
                      </div>
                    </div>

                    {classificationsSubTab === "grupos" ? (
                      <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(oracleGroups).sort().map((groupName) => {
                        const teamsInGroup = oracleGroups[groupName] || [];
                        return (
                        <div key={groupName} className="auth-card border border-white/5 relative overflow-hidden bg-[#0d2b1a]/40 flex flex-col">
                          {/* Card Header */}
                          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/8">
                            <h3 className="text-sm font-black text-white flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-[#ffd700]/10 border border-[#ffd700]/20 flex items-center justify-center text-[#ffd700] text-[10px] font-black shrink-0">{groupName}</span>
                              <span className="text-white/70 font-semibold text-xs">Grupo {groupName}</span>
                            </h3>
                            {!isOracleClosed ? (
                              <div className="flex items-center gap-1 text-[9px] text-white/35 select-none">
                                <GripVertical className="w-3 h-3" />
                                <span className="hidden sm:inline">Arraste para ordenar</span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-white/30 uppercase tracking-wider">Visualização</span>
                            )}
                          </div>

                          {/* Separator legend */}
                          <div className="mx-4 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-[9px] text-white/30 font-medium">Classificado</span>
                            </div>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                              <span className="text-[9px] text-white/30 font-medium">Repescagem</span>
                            </div>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-white/15 shrink-0" />
                              <span className="text-[9px] text-white/30 font-medium">Eliminado</span>
                            </div>
                          </div>

                          <div className="p-3 space-y-1.5">
                            {teamsInGroup.map((team, index) => {
                              const isDirectClassified = index < 2;
                              const isThirdPlace = index === 2;
                              const isThirdQualified =
                                isThirdPlace &&
                                (!hasGroupStandingData || bestThirdTeamCodes.has(team.code));
                              const isRepescagem = isThirdPlace && isThirdQualified;
                              const isLastBeforeElimination = index === 2;
                              return (
                                <>
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
                                      setOracleGroups({ ...oracleGroups, [groupName]: newTeams });
                                      setDraggedItem(null);
                                    }}
                                    className={`flex items-center gap-2 p-2 rounded-lg border-l-2 border border-r border-t border-b transition-all ${
                                      isOracleClosed
                                        ? isDirectClassified
                                          ? "bg-emerald-500/5 border-l-emerald-500/60 border-r-white/5 border-t-white/5 border-b-white/5 cursor-default"
                                          : isRepescagem
                                            ? "bg-blue-500/5 border-l-blue-500/60 border-r-white/5 border-t-white/5 border-b-white/5 cursor-default"
                                            : "bg-black/10 border-l-white/10 border-r-white/5 border-t-white/5 border-b-white/5 cursor-default"
                                        : draggedItem && draggedItem.groupName === groupName && draggedItem.index === index
                                          ? "bg-white/5 border-l-[#ffd700] border-r-[#ffd700]/30 border-t-[#ffd700]/30 border-b-[#ffd700]/30 opacity-50 cursor-grab"
                                          : isDirectClassified
                                            ? "bg-emerald-500/5 border-l-emerald-500/40 border-r-white/5 border-t-white/5 border-b-white/5 hover:border-l-emerald-500/70 hover:bg-emerald-500/8 cursor-grab active:cursor-grabbing"
                                            : isRepescagem
                                              ? "bg-blue-500/5 border-l-blue-500/40 border-r-white/5 border-t-white/5 border-b-white/5 hover:border-l-blue-500/70 hover:bg-blue-500/8 cursor-grab active:cursor-grabbing"
                                              : "bg-black/15 border-l-white/8 border-r-white/5 border-t-white/5 border-b-white/5 hover:border-l-white/20 hover:bg-white/3 cursor-grab active:cursor-grabbing"
                                    }`}
                                  >
                                    {/* Position rank */}
                                    <span className={`w-5 text-center font-black text-xs shrink-0 ${
                                      index === 0 ? "text-[#ffd700]" :
                                      index === 1 ? "text-slate-300" :
                                      isRepescagem ? "text-blue-400" :
                                      "text-white/25"
                                    }`}>
                                      {index + 1}º
                                    </span>

                                    {/* Flag */}
                                    <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 border bg-white/5 flex items-center justify-center font-bold text-[10px] team-flag-shell-3d ${
                                      isDirectClassified ? "border-emerald-500/30" :
                                      isRepescagem ? "border-blue-500/30" :
                                      "border-white/15"
                                    }`}>
                                      {team.flag ? (
                                        <img src={team.flag} alt={team.code} className="w-full h-full object-cover team-flag-3d" />
                                      ) : (
                                        team.code
                                      )}
                                    </div>

                                    {/* Team Name */}
                                    <span className={`flex-1 text-xs font-semibold truncate ${
                                      isDirectClassified || isRepescagem ? "text-white/90" : "text-white/50"
                                    }`}>
                                      {team.name}
                                    </span>

                                    {/* Classification badge */}
                                    {!isGroupStageFinished && isDirectClassified && (
                                      <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                                        AVANÇA
                                      </span>
                                    )}
                                    {!isGroupStageFinished && isRepescagem && (
                                      <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded shrink-0">
                                        REPESCAGEM
                                      </span>
                                    )}

                                    {/* Oracle score badge */}
                                    {isGroupStageFinished && index < 4 && (
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {team.realPosition && team.realPosition !== (index + 1) && (
                                          <span className="text-[9px] text-white/35 italic">(Real: {team.realPosition}º)</span>
                                        )}
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border ${
                                          team.pointsEarned === 3
                                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                            : "text-red-400 bg-red-500/10 border-red-500/20"
                                        }`}>
                                          {team.pointsEarned === 3 ? "+3" : "0"}
                                        </span>
                                      </div>
                                    )}

                                    {/* Reorder Arrows */}
                                    {!isOracleClosed && (
                                      <div className="flex flex-col gap-0.5 shrink-0 opacity-30 hover:opacity-90 transition-opacity">
                                        {index > 0 && (
                                          <button type="button"
                                            onClick={() => {
                                              const newTeams = [...oracleGroups[groupName]];
                                              [newTeams[index], newTeams[index - 1]] = [newTeams[index - 1], newTeams[index]];
                                              setOracleGroups({ ...oracleGroups, [groupName]: newTeams });
                                            }}
                                            className="p-0.5 hover:text-[#ffd700] transition-colors" title="Mover para cima"
                                          >
                                            <ChevronUp className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        {index < teamsInGroup.length - 1 && (
                                          <button type="button"
                                            onClick={() => {
                                              const newTeams = [...oracleGroups[groupName]];
                                              [newTeams[index], newTeams[index + 1]] = [newTeams[index + 1], newTeams[index]];
                                              setOracleGroups({ ...oracleGroups, [groupName]: newTeams });
                                            }}
                                            className="p-0.5 hover:text-[#ffd700] transition-colors" title="Mover para baixo"
                                          >
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </>
                              );
                            })}
                          </div>
                        </div>
                      );
                      })}
                    </div>

                    {/* Save / Status Banner */}
                    {isOracleClosed ? (
                      <div className="flex items-start gap-4 mt-5 p-4 sm:p-5 border border-red-500/20 rounded-2xl bg-gradient-to-r from-red-500/8 to-black/20 animate-fade-in-up">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-red-400 mb-1">Oráculo Encerrado</p>
                          <p className="text-xs text-white/55 leading-relaxed">
                            As previsões foram travadas em <strong className="text-white/80">{formattedFirstMatchDate || "o início da Copa"}</strong>. Você pode acompanhar as projeções e ver a pontuação do Oráculo no painel à direita.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 p-4 sm:p-5 border border-[#ffd700]/15 rounded-2xl bg-gradient-to-r from-[#ffd700]/5 to-black/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/20 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-[#ffd700]" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-[#ffd700] mb-0.5">Palpites Abertos</p>
                              <p className="text-[11px] text-white/50 leading-relaxed">
                                Arraste as seleções ou use as setas para ordenar. Palpites até <strong className="text-white/70">{formattedFirstMatchDate || "o início da Copa"}</strong>.
                              </p>
                            </div>
                          </div>
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
                                const knockoutPayload = Object.keys(oracleKnockout).map((matchId) => ({
                                  matchId,
                                  predictedWinner: oracleKnockout[matchId],
                                }));
                                await groupsApi.saveOraclePredictions(groupId, payload, knockoutPayload);
                                setOracleMessage("Palpites salvos com sucesso!");
                                setTimeout(() => setOracleMessage(null), 5000);
                              } catch (err: any) {
                                console.error("[Oráculo] Falha ao salvar palpites", {
                                  groupId,
                                  error: err,
                                });
                                setOracleMessage(err.message || "Erro ao salvar palpites");
                                toast.error(err.message || "Erro ao salvar palpites");
                              } finally {
                                setSavingOracle(false);
                              }
                            }}
                            className="copa-btn-primary px-5 py-2 text-sm shadow-lg shadow-[#ffd700]/15 shrink-0 flex items-center gap-2"
                          >
                            {savingOracle ? (
                              <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                            ) : (
                              <><Check className="w-4 h-4" />Salvar Palpites</>
                            )}
                          </button>
                        </div>
                        {oracleMessage && (
                          <p className={`mt-3 text-xs font-semibold ${
                            oracleMessage.includes("sucesso") ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {oracleMessage}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                    ) : (() => {
                  const resolveRoundOf32Team = (teamName: string, availableThirds: Set<string>) => {
                    if (!teamName || !oracleGroups) return null;
                    const match = teamName.match(/([1-3])º Grupo ([A-L](?:\/[A-L])*)/);
                    if (!match) return null;
                    const position = parseInt(match[1]);
                    const groupsString = match[2];
                    if (groupsString.includes('/')) {
                      const groupLetters = groupsString.split('/');
                      for (const letter of groupLetters) {
                        if (availableThirds.has(letter)) {
                          availableThirds.delete(letter);
                          const team = oracleGroups[letter]?.[position - 1];
                          return team ? { ...team, name: `${team.name} (3º Grp ${letter})` } : null;
                        }
                      }
                      const fallbackLetter = Array.from(availableThirds)[0];
                      if (fallbackLetter) {
                        availableThirds.delete(fallbackLetter);
                        const team = oracleGroups[fallbackLetter]?.[position - 1];
                        return team ? { ...team, name: `${team.name} (3º Grp ${fallbackLetter})` } : null;
                      }
                      return null;
                    } else {
                      return oracleGroups[groupsString]?.[position - 1] || null;
                    }
                  };

                  const r32Mappings = (() => {
                    const mappings: Record<string, { home: any, away: any }> = {};
                    if (!oracleGroups || Object.keys(oracleGroups).length === 0) return mappings;
                    const availableThirds = new Set(rankedBestThirds.map(t => t.groupName));
                    const r32Matches = resolvedGames.filter((m) => m.stage === "Dezesseisavos de Final");
                    r32Matches.forEach(game => {
                      mappings[game.id] = {
                        home: resolveRoundOf32Team((game as any)._originalHomeTeamName || game.homeTeam?.name || "", availableThirds),
                        away: resolveRoundOf32Team((game as any)._originalAwayTeamName || game.awayTeam?.name || "", availableThirds)
                      };
                    });
                    return mappings;
                  })();

                  const knockoutMatches = resolvedGames.filter((g) => !g.stage.startsWith("Fase de Grupos"));
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
                  const leftR32Order = [75, 78, 73, 76, 84, 83, 82, 81];
                  const rightR32Order = [74, 77, 79, 80, 87, 86, 85, 88];
                  // O print oficial usa 90 acima de 89 no lado esquerdo.
                  const leftR16Order = [90, 89, 93, 94];
                  const rightR16Order = [91, 92, 95, 96];
                  const leftR8Order = [97, 98];
                  const rightR8Order = [99, 100];
                  const leftR4Order = [101];
                  const rightR4Order = [102];

                  const getMatchesByOrder = (pool: any[], order: number[]) => {
                    return order.map(num => pool.find(m => m.matchNumber === num)).filter(Boolean) as MatchPredictionData[];
                  };

                  const r32Left = getMatchesByOrder(r32, leftR32Order);
                  const r32Right = getMatchesByOrder(r32, rightR32Order);
                  const r16Left = getMatchesByOrder(r16, leftR16Order);
                  const r16Right = getMatchesByOrder(r16, rightR16Order);
                  const r8Left = getMatchesByOrder(r8, leftR8Order);
                  const r8Right = getMatchesByOrder(r8, rightR8Order);
                  const r4Left = getMatchesByOrder(r4, leftR4Order);
                  const r4Right = getMatchesByOrder(r4, rightR4Order);
                  const finalMatch = r2.find(m => m.stage === "Final");
                  const thirdMatch = r2.find(m => m.stage === "Terceiro Lugar" || m.stage === "Disputa do 3º Lugar");
                  const finalOracleWinner = finalMatch ? oracleKnockout[finalMatch.id] : undefined;
                  const finalHomeTeam = finalMatch ? getOracleTeamForSlot(finalMatch.id, true, [finalMatch], [...r4Left, ...r4Right]) : null;
                  const finalAwayTeam = finalMatch ? getOracleTeamForSlot(finalMatch.id, false, [finalMatch], [...r4Left, ...r4Right]) : null;
                  const finalIsFinished = finalMatch?.status === "FINISHED";
                  const finalPointsGenerated = !!finalMatch && finalIsFinished && !!finalOracleWinner && finalOracleWinner !== "TBD";
                  const finalChampionTeam = (() => {
                    if (!finalMatch) return null;

                    if (
                      finalIsFinished &&
                      finalHomeTeam &&
                      finalAwayTeam &&
                      finalMatch.realHomeScore !== null &&
                      finalMatch.realAwayScore !== null
                    ) {
                      const homeWins = finalMatch.realHomeScore > finalMatch.realAwayScore ||
                        (finalMatch.realHomeScore === finalMatch.realAwayScore && (finalMatch.homePenalties || 0) > (finalMatch.awayPenalties || 0));
                      return homeWins ? finalHomeTeam : finalAwayTeam;
                    }

                    const matchesWinner = (team: any, isHome: boolean) => {
                      if (!team || !finalOracleWinner) return false;
                      const identifier = team.code === "TBD" ? `TBD_${finalMatch.id}_${isHome ? "HOME" : "AWAY"}` : team.code;
                      return finalOracleWinner === identifier || finalOracleWinner === team.code || finalOracleWinner === team.name;
                    };

                    if (matchesWinner(finalHomeTeam, true)) return finalHomeTeam;
                    if (matchesWinner(finalAwayTeam, false)) return finalAwayTeam;
                    return null;
                  })();

                  const handleResetKnockout = async () => {
                    const newOracleKnockout: Record<string, string> = {};
                    
                    // Manter os jogos que já foram encerrados ou cuja fase está bloqueada
                    const knockoutMatchesList = resolvedGames.filter((g) => !g.stage.startsWith("Fase de Grupos"));
                    
                    Object.keys(oracleKnockout).forEach((matchId) => {
                      const matchInfo = knockoutMatchesList.find(m => m.id === matchId);
                      if (matchInfo) {
                        const isLocked = isKnockoutMatchLocked(matchInfo);
                        if (isLocked) {
                          newOracleKnockout[matchId] = oracleKnockout[matchId];
                        }
                      }
                    });

                    setOracleKnockout(newOracleKnockout);

                    try {
                      const payload = Object.keys(oracleGroups).map((gName) => ({
                        groupName: gName,
                        teamOrder: oracleGroups[gName].map((t) => t.code),
                      }));
                      await groupsApi.saveOraclePredictions(groupId, payload, [], true);
                      toast.success("Árvore limpa com sucesso!");
                    } catch (err: any) {
                      console.error("[Oráculo Mata-Mata] Falha ao limpar árvore", {
                        groupId,
                        error: err,
                      });
                      toast.error(err.message || "Erro ao resetar palpites");
                    }
                  };

                  return (
                    <div className="space-y-4 animate-fade-in-up">
                      {/* Prazos do Mata-Mata */}
                      <div className="bg-[#0a0f1e]/80 border border-[#ffd700]/20 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                          <Clock className="w-24 h-24 text-[#ffd700]" />
                        </div>
                        <h3 className="text-[#ffd700] font-bold flex items-center gap-2 mb-2 text-sm sm:text-base">
                          <Trophy className="w-4 h-4" /> Regras e Prazos do Mata-Mata
                        </h3>
                        <p className="text-white/70 text-xs">
                          Você ganha <strong className="text-emerald-400">5 pontos</strong> por cada seleção que acertar que avançará de fase! 
                          O Oráculo do mata-mata é bloqueado <strong>por partida</strong>. Você pode selecionar ou alterar seu palpite até o apito inicial de cada confronto específico, de forma idêntica ao bolão!
                        </p>
                      </div>

                      {/* Navegação entre as fases do chaveamento */}
                      <div className="flex flex-col sm:flex-row gap-3 bg-black/20 p-3 rounded-2xl border border-white/5 items-center justify-between">
                      <div className="flex overflow-x-auto whitespace-nowrap copa-scrollbar gap-2 w-full sm:w-auto pb-1 sm:pb-0">
                          <button
                            onClick={() => setBracketRound("all")}
                            className={`px-3.5 py-2 min-h-10 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              bracketRound === "all" ? "bg-white/10 text-white border border-white/20" : "text-white/60 hover:text-white"
                            }`}
                          >
                            Árvore Completa
                          </button>
                          <button
                            onClick={() => setBracketRound("r32")}
                            className={`px-3.5 py-2 min-h-10 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              bracketRound === "r32" ? "bg-white/10 text-white border border-white/20" : "text-white/60 hover:text-white"
                            }`}
                          >
                            Dezesseisavos (32)
                          </button>
                          <button
                            onClick={() => setBracketRound("r16")}
                            className={`px-3.5 py-2 min-h-10 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              bracketRound === "r16" ? "bg-white/10 text-white border border-white/20" : "text-white/60 hover:text-white"
                            }`}
                          >
                            Oitavas (16)
                          </button>
                          <button
                            onClick={() => setBracketRound("r8")}
                            className={`px-3.5 py-2 min-h-10 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              bracketRound === "r8" ? "bg-white/10 text-white border border-white/20" : "text-white/60 hover:text-white"
                            }`}
                          >
                            Quartas (8)
                          </button>
                          <button
                            onClick={() => setBracketRound("r4")}
                            className={`px-3.5 py-2 min-h-10 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              bracketRound === "r4" ? "bg-white/10 text-white border border-white/20" : "text-white/60 hover:text-white"
                            }`}
                          >
                            Semifinais
                          </button>
                          <button
                            onClick={() => setBracketRound("r2")}
                            className={`px-3.5 py-2 min-h-10 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              bracketRound === "r2" ? "bg-white/10 text-white border border-white/20" : "text-white/60 hover:text-white"
                            }`}
                          >
                            Finais
                          </button>
                          <button
                            onClick={handleResetKnockout}
                            className={`px-3.5 py-2 min-h-10 rounded-lg text-xs font-bold transition-all cursor-pointer ml-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                            title="Limpar todos os palpites do mata-mata"
                          >
                            Resetar
                          </button>
                        </div>
                        <span className="text-xs text-white/40 italic flex items-center gap-1">
                        Selecione clicando na bandeira da seleção que vai avançar
                        </span>
                      </div>

                      {/* Exibição da Árvore Symmetrical ou Grade Focada */}
                      {bracketRound === "all" ? (
                        <div className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-6 pb-6 pt-2 justify-start lg:justify-center items-stretch copa-scrollbar w-full">
                          <div className="flex gap-3 sm:gap-4 md:gap-6 items-stretch py-2 min-w-[1040px] sm:min-w-[1180px] md:min-w-[1300px] justify-center mx-auto px-2 sm:px-4 md:px-0">
                            {/* COLUNA 1: Dezesseisavos (Lado Esquerdo) */}
                            <div className="flex flex-col gap-2 w-[78px] sm:w-[88px]">
                              <div className="text-[10px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">1/16 Final</div>
                              <div className="flex flex-col justify-between flex-1 py-1">
                                {r32Left.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    isOracleMode={true}
                                    onOracleSelect={handleOracleKnockoutSelect}
                                    oracleWinner={oracleKnockout[game.id]}
                                    oracleHomeTeam={r32Mappings[game.id]?.home}
                                    oracleAwayTeam={r32Mappings[game.id]?.away}
                                    isLocked={isKnockoutMatchLocked(game)}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 2: Oitavas (Lado Esquerdo) */}
                            <div className="flex flex-col gap-2 w-[78px] sm:w-[88px]">
                              <div className="text-[10px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Oitavas</div>
                              <div className="flex flex-col justify-around flex-1 py-4">
                                {r16Left.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    isOracleMode={true}
                                    onOracleSelect={handleOracleKnockoutSelect}
                                    oracleWinner={oracleKnockout[game.id]}
                                    oracleHomeTeam={getOracleTeamForSlot(game.id, true, r16Left, r32Left)}
                                    oracleAwayTeam={getOracleTeamForSlot(game.id, false, r16Left, r32Left)}
                                    isLocked={isKnockoutMatchLocked(game)}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 3: Quartas (Lado Esquerdo) */}
                            <div className="flex flex-col gap-2 w-[78px] sm:w-[88px]">
                              <div className="text-[10px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Quartas</div>
                              <div className="flex flex-col justify-around flex-1 py-12">
                                {r8Left.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    isOracleMode={true}
                                    onOracleSelect={handleOracleKnockoutSelect}
                                    oracleWinner={oracleKnockout[game.id]}
                                    oracleHomeTeam={getOracleTeamForSlot(game.id, true, r8Left, r16Left)}
                                    oracleAwayTeam={getOracleTeamForSlot(game.id, false, r8Left, r16Left)}
                                    isLocked={isKnockoutMatchLocked(game)}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 4: Semifinal (Lado Esquerdo) */}
                            <div className="flex flex-col gap-2 w-[78px] sm:w-[88px]">
                              <div className="text-[10px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Semifinal</div>
                              <div className="flex flex-col justify-around flex-1 py-24">
                                {r4Left.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    isOracleMode={true}
                                    onOracleSelect={handleOracleKnockoutSelect}
                                    oracleWinner={oracleKnockout[game.id]}
                                    oracleHomeTeam={getOracleTeamForSlot(game.id, true, r4Left, r8Left)}
                                    oracleAwayTeam={getOracleTeamForSlot(game.id, false, r4Left, r8Left)}
                                    isLocked={isKnockoutMatchLocked(game)}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 5: FINAIS (Centro do Chaveamento) */}
                            <div className="flex flex-col gap-4 justify-center items-center px-3 sm:px-4 min-w-[186px] sm:min-w-[218px] bg-black/20 border border-[#ffd700]/15 rounded-3xl relative overflow-hidden py-6 shadow-[0_12px_34px_rgba(0,0,0,0.35)] backdrop-blur-[1.5px]">
                              <div className="absolute inset-0 bg-gradient-to-b from-[#ffd700]/8 to-transparent pointer-events-none" />
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-24 bg-[#ffd700]/10 blur-2xl pointer-events-none" />
                              
                              {/* Campeão / Final */}
                              <div className="flex flex-col items-center gap-2">
                                {finalPointsGenerated && finalChampionTeam && (
                                  <div className="w-full max-w-[202px] rounded-2xl border border-[#ffd700]/45 bg-gradient-to-b from-[#195735]/95 via-[#0f3a24]/95 to-[#0b2118]/95 px-3 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.5)] relative overflow-hidden -mt-3 mb-2 backdrop-blur-[2px]">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.26),transparent_54%)] pointer-events-none" />
                                    <div className="absolute -top-3 -right-3 w-14 h-14 rounded-full bg-[#ffd700]/15 blur-xl pointer-events-none" />
                                    <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
                                    <div className="absolute top-2 left-2 text-[#ffd700]/75 animate-pulse pointer-events-none">
                                      <Sparkles className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="absolute top-3 right-2 text-[#ffd700]/70 animate-pulse [animation-delay:180ms] pointer-events-none">
                                      <Sparkles className="w-3 h-3" />
                                    </div>
                                    <div className="absolute bottom-2 right-5 w-1.5 h-1.5 rounded-full bg-[#ffd700]/80 animate-pulse pointer-events-none" />
                                    <div className="absolute bottom-3 left-5 w-1 h-1 rounded-full bg-emerald-300/80 animate-pulse [animation-delay:240ms] pointer-events-none" />

                                    <div className="relative flex items-center gap-2.5">
                                      <div className="relative shrink-0">
                                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#ffd700] bg-[#0d2b1a] flex items-center justify-center team-flag-shell-3d shadow-[0_0_16px_rgba(255,215,0,0.35)]">
                                          {finalChampionTeam.flag ? (
                                            <img src={finalChampionTeam.flag} alt={finalChampionTeam.code} className="w-full h-full object-cover team-flag-3d" />
                                          ) : (
                                            <span className="text-[10px] font-black text-[#ffd700]">{finalChampionTeam.code || "?"}</span>
                                          )}
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border border-[#ffe27a] bg-[#ffd700] flex items-center justify-center shadow-[0_0_10px_rgba(255,215,0,0.45)]">
                                          <Crown className="w-2.5 h-2.5 text-[#0d2b1a]" />
                                        </div>
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1">
                                          <p className="text-[0.5rem] font-semibold tracking-[0.16rem] text-[#ffd700] uppercase">Campeão</p>
                                        </div>
                                        <p className="text-xs font-black text-white truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">{finalChampionTeam.name || finalChampionTeam.code}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <span className="text-[9px] font-black uppercase text-[#ffd700] tracking-widest bg-[#ffd700]/10 border border-[#ffd700]/25 px-2.5 py-1 rounded-full shadow-sm">
                                  🏆 Final
                                </span>
                                <span className="text-[8px] text-white/55 font-semibold tracking-wide -mt-1 mb-1">
                                  Defina o campeão no confronto abaixo
                                </span>
                                {finalMatch ? (
                                  <OracleBracketCircleMatch
                                    game={finalMatch}
                                    savingMatchId={savingMatchId}
                                    isOracleMode={true}
                                    onOracleSelect={handleOracleKnockoutSelect}
                                    oracleWinner={oracleKnockout[finalMatch.id]}
                                    oracleHomeTeam={getOracleTeamForSlot(finalMatch.id, true, [finalMatch], [...r4Left, ...r4Right])}
                                    oracleAwayTeam={getOracleTeamForSlot(finalMatch.id, false, [finalMatch], [...r4Left, ...r4Right])}
                                    isLocked={isKnockoutMatchLocked(finalMatch)}
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
                                    isOracleMode={true}
                                    onOracleSelect={handleOracleKnockoutSelect}
                                    oracleWinner={oracleKnockout[thirdMatch.id]}
                                    oracleHomeTeam={getOracleLoserForSlot(thirdMatch.id, true, [thirdMatch], [...r4Left, ...r4Right], [...r8Left, ...r8Right])}
                                    oracleAwayTeam={getOracleLoserForSlot(thirdMatch.id, false, [thirdMatch], [...r4Left, ...r4Right], [...r8Left, ...r8Right])}
                                    isLocked={isKnockoutMatchLocked(thirdMatch)}
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 text-xs">
                                    3º Lugar
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* COLUNA 6: Semifinal (Lado Direito) */}
                            <div className="flex flex-col gap-2 w-[78px] sm:w-[88px]">
                              <div className="text-[10px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Semifinal</div>
                              <div className="flex flex-col justify-around flex-1 py-24">
                                {r4Right.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    isOracleMode={true}
                                    onOracleSelect={handleOracleKnockoutSelect}
                                    oracleWinner={oracleKnockout[game.id]}
                                    oracleHomeTeam={getOracleTeamForSlot(game.id, true, r4Right, r8Right)}
                                    oracleAwayTeam={getOracleTeamForSlot(game.id, false, r4Right, r8Right)}
                                    isLocked={isKnockoutMatchLocked(game)}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 7: Quartas (Lado Direito) */}
                            <div className="flex flex-col gap-2 w-[78px] sm:w-[88px]">
                              <div className="text-[10px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Quartas</div>
                              <div className="flex flex-col justify-around flex-1 py-12">
                                {r8Right.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    isOracleMode={true}
                                    onOracleSelect={handleOracleKnockoutSelect}
                                    oracleWinner={oracleKnockout[game.id]}
                                    oracleHomeTeam={getOracleTeamForSlot(game.id, true, r8Right, r16Right)}
                                    oracleAwayTeam={getOracleTeamForSlot(game.id, false, r8Right, r16Right)}
                                    isLocked={isKnockoutMatchLocked(game)}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 8: Oitavas (Lado Direito) */}
                            <div className="flex flex-col gap-2 w-[78px] sm:w-[88px]">
                              <div className="text-[10px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Oitavas</div>
                              <div className="flex flex-col justify-around flex-1 py-4">
                                {r16Right.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    isOracleMode={true}
                                    onOracleSelect={handleOracleKnockoutSelect}
                                    oracleWinner={oracleKnockout[game.id]}
                                    oracleHomeTeam={getOracleTeamForSlot(game.id, true, r16Right, r32Right)}
                                    oracleAwayTeam={getOracleTeamForSlot(game.id, false, r16Right, r32Right)}
                                    isLocked={isKnockoutMatchLocked(game)}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* COLUNA 9: Dezesseisavos (Lado Direito) */}
                            <div className="flex flex-col gap-2 w-[78px] sm:w-[88px]">
                              <div className="text-[10px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">1/16 Final</div>
                              <div className="flex flex-col justify-between flex-1 py-1">
                                {r32Right.map((game) => (
                                  <OracleBracketCircleMatch
                                    key={game.id}
                                    game={game}
                                    savingMatchId={savingMatchId}
                                    isOracleMode={true}
                                    onOracleSelect={handleOracleKnockoutSelect}
                                    oracleWinner={oracleKnockout[game.id]}
                                    oracleHomeTeam={r32Mappings[game.id]?.home}
                                    oracleAwayTeam={r32Mappings[game.id]?.away}
                                    isLocked={isKnockoutMatchLocked(game)}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 justify-items-center pt-2">
                          {selectedMatches.map((game) => {
                            const resolveOracleTeamForGame = (g: MatchPredictionData, isHome: boolean) => {
                              if (g.stage === "Dezesseisavos de Final") {
                                return isHome ? r32Mappings[g.id]?.home : r32Mappings[g.id]?.away;
                              }
                              if (g.stage === "Oitavas de Final") {
                                return r16Left.find(m => m.id === g.id) 
                                  ? getOracleTeamForSlot(g.id, isHome, r16Left, r32Left) 
                                  : getOracleTeamForSlot(g.id, isHome, r16Right, r32Right);
                              }
                              if (g.stage === "Quartas de Final") {
                                return r8Left.find(m => m.id === g.id) 
                                  ? getOracleTeamForSlot(g.id, isHome, r8Left, r16Left) 
                                  : getOracleTeamForSlot(g.id, isHome, r8Right, r16Right);
                              }
                              if (g.stage === "Semifinais" || g.stage === "Semifinal") {
                                return r4Left.find(m => m.id === g.id) 
                                  ? getOracleTeamForSlot(g.id, isHome, r4Left, r8Left) 
                                  : getOracleTeamForSlot(g.id, isHome, r4Right, r8Right);
                              }
                              if (g.stage === "Final") {
                                return getOracleTeamForSlot(g.id, isHome, [finalMatch!], [...r4Left, ...r4Right]);
                              }
                              if (g.stage === "Terceiro Lugar" || g.stage === "Disputa do 3º Lugar") {
                                return getOracleLoserForSlot(g.id, isHome, [thirdMatch!], [...r4Left, ...r4Right], [...r8Left, ...r8Right]);
                              }
                              return null;
                            };

                            return (
                              <div key={game.id} className="flex flex-col items-center gap-2 p-2.5 bg-black/10 border border-white/5 rounded-2xl">
                                <span className="text-[10px] font-black text-white/30 uppercase truncate max-w-[96px]">
                                  {game.stage?.replace("Dezesseisavos", "1/16").replace(" de Final", "")}
                                </span>
                                <OracleBracketCircleMatch
                                  game={game}
                                  savingMatchId={savingMatchId}
                                  isOracleMode={true}
                                  onOracleSelect={handleOracleKnockoutSelect}
                                  oracleWinner={oracleKnockout[game.id]}
                                  oracleHomeTeam={resolveOracleTeamForGame(game, true)}
                                  oracleAwayTeam={resolveOracleTeamForGame(game, false)}
                                  isLocked={isKnockoutMatchLocked(game)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Seus Palpites das Premiações Individuais Card */}
                    <div className="auth-card border border-white/10 bg-white/[0.02] rounded-3xl overflow-visible relative z-20 isolate">
                      <div className="rounded-t-3xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
                        <div>
                          <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <Star className="w-4 h-4 text-[#ffd700]" />
                            Seus Palpites das Premiações Individuais
                          </h3>
                          <p className="text-[11px] text-white/45 mt-0.5">
                            {isOracleClosed ? "Premiações travadas — veja seus palpites abaixo." : "Escolha seus candidatos aos prêmios individuais da Copa."}
                          </p>
                        </div>
                        {isOracleClosed && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                            <Lock className="w-3 h-3" /> Travado
                          </span>
                        )}
                      </div>
                      </div>

                      <div className="p-5 space-y-4 overflow-visible">
                        {/* Artilheiro — tema Dourado */}
                        <div className="border border-[#ffd700]/15 border-l-2 border-l-[#ffd700]/60 rounded-xl bg-[#ffd700]/[0.03] p-4 space-y-2.5 relative z-30 overflow-visible">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">⚽</span>
                              <div>
                                <p className="text-xs font-black text-[#ffd700]">Chuteira de Ouro</p>
                                <p className="text-[10px] text-white/35">Artilheiro da Copa</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {group.topScorerResult && (
                                <span className="text-[9px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded font-medium">
                                  Oficial: {group.topScorerResult}
                                </span>
                              )}
                              {group.topScorerResult && topScorer && topScorer.trim().toLowerCase() === group.topScorerResult.trim().toLowerCase() && (
                                <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse font-mono">+15 pts</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="w-full sm:w-[280px] shrink-0">
                              <SearchableDropdown
                                options={players}
                                value={topScorer}
                                onChange={setTopScorer}
                                placeholder="Buscar jogador..."
                                disabled={isOracleClosed}
                                theme="gold"
                                open={openAwardDropdown === "scorer"}
                                onOpenChange={(isOpen) => setOpenAwardDropdown(isOpen ? "scorer" : null)}
                              />
                            </div>
                            {renderSelectedPlayerCard(players.find((p) => p.name === topScorer))}
                          </div>
                        </div>

                        {/* Líder de Assistências — tema Teal */}
                        <div className="border border-teal-500/15 border-l-2 border-l-teal-500/60 rounded-xl bg-teal-500/[0.03] p-4 space-y-2.5 relative z-20 overflow-visible">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">🎯</span>
                              <div>
                                <p className="text-xs font-black text-teal-400">Líder de Assistências</p>
                                <p className="text-[10px] text-white/35">Jogador com mais assistências</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {group.assistLeaderResult && (
                                <span className="text-[9px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded font-medium">
                                  Oficial: {group.assistLeaderResult}
                                </span>
                              )}
                              {group.assistLeaderResult && assistLeader && assistLeader.trim().toLowerCase() === group.assistLeaderResult.trim().toLowerCase() && (
                                <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse font-mono">+15 pts</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="w-full sm:w-[280px] shrink-0">
                              <SearchableDropdown
                                options={players}
                                value={assistLeader}
                                onChange={setAssistLeader}
                                placeholder="Buscar jogador..."
                                disabled={isOracleClosed}
                                theme="teal"
                                open={openAwardDropdown === "assist"}
                                onOpenChange={(isOpen) => setOpenAwardDropdown(isOpen ? "assist" : null)}
                              />
                            </div>
                            {renderSelectedPlayerCard(players.find((p) => p.name === assistLeader))}
                          </div>
                        </div>

                        {/* Melhor Jogador — tema Roxo */}
                        <div className="border border-purple-500/15 border-l-2 border-l-purple-500/60 rounded-xl bg-purple-500/[0.03] p-4 space-y-2.5 relative z-10 overflow-visible">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">⭐</span>
                              <div>
                                <p className="text-xs font-black text-purple-400">Melhor Jogador</p>
                                <p className="text-[10px] text-white/35">Bola de Ouro da Copa</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {group.bestPlayerResult && (
                                <span className="text-[9px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded font-medium">
                                  Oficial: {group.bestPlayerResult}
                                </span>
                              )}
                              {group.bestPlayerResult && bestPlayer && bestPlayer.trim().toLowerCase() === group.bestPlayerResult.trim().toLowerCase() && (
                                <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse font-mono">+15 pts</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="w-full sm:w-[280px] shrink-0">
                              <SearchableDropdown
                                options={players}
                                value={bestPlayer}
                                onChange={setBestPlayer}
                                placeholder="Buscar jogador..."
                                disabled={isOracleClosed}
                                theme="purple"
                                open={openAwardDropdown === "best"}
                                onOpenChange={(isOpen) => setOpenAwardDropdown(isOpen ? "best" : null)}
                              />
                            </div>
                            {renderSelectedPlayerCard(players.find((p) => p.name === bestPlayer))}
                          </div>
                        </div>
                      </div>

                      {!isOracleClosed && (
                        <div className="px-5 pb-5">
                          <button
                            onClick={handleSaveAwards}
                            disabled={savingAwards}
                            className="copa-btn-primary px-6 py-2.5 text-xs font-black shadow-lg shadow-[#ffd700]/10 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {savingAwards ? (
                              <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                            ) : (
                              <><Check className="w-4 h-4" />Salvar Premiações Individuais</>
                            )}
                          </button>
                          {awardsMessage && (
                            <p className={`mt-2 text-xs font-semibold ${awardsMessage.includes("sucesso") ? "text-emerald-400" : "text-red-400"}`}>
                              {awardsMessage}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Palpites dos Participantes Card — com ranking visual */}
                    <div className="auth-card border border-white/10 bg-white/[0.02] rounded-2xl relative z-10 overflow-hidden">
                      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#ffd700]" /> Ranking Palpites das Premiações Individuais
                        </h3>
                        <span className="text-[10px] text-white/35 font-medium">
                          {isOracleClosed ? "Palpites visíveis" : "Seus palpites estão visíveis apenas para você"}
                        </span>
                      </div>

                      <div className="overflow-x-auto w-full pb-2 copa-scrollbar">
                        <table className="w-full text-left min-w-[700px]">
                          <thead>
                            <tr className="border-b border-white/10 text-white/35 text-[10px] font-black uppercase tracking-wider">
                              <th className="py-3 px-4 w-8">#</th>
                              <th className="py-3 px-4">Participante</th>
                              <th className="py-3 px-4"><span className="text-[#ffd700]/70">⚽</span> Artilheiro</th>
                              <th className="py-3 px-4"><span className="text-teal-400/70">🎯</span> Assistências</th>
                              <th className="py-3 px-4"><span className="text-purple-400/70">⭐</span> Melhor Jogador</th>
                              <th className="py-3 px-4 text-right">Pontos</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {[...group.members]
                              .sort((a, b) => {
                                const ptsA = (() => {
                                  let p = 0;
                                  if (group.topScorerResult && a.topScorer && a.topScorer.trim().toLowerCase() === group.topScorerResult.trim().toLowerCase()) p += 15;
                                  if (group.assistLeaderResult && a.assistLeader && a.assistLeader.trim().toLowerCase() === group.assistLeaderResult.trim().toLowerCase()) p += 15;
                                  if (group.bestPlayerResult && a.bestPlayer && a.bestPlayer.trim().toLowerCase() === group.bestPlayerResult.trim().toLowerCase()) p += 15;
                                  return p;
                                })();
                                const ptsB = (() => {
                                  let p = 0;
                                  if (group.topScorerResult && b.topScorer && b.topScorer.trim().toLowerCase() === group.topScorerResult.trim().toLowerCase()) p += 15;
                                  if (group.assistLeaderResult && b.assistLeader && b.assistLeader.trim().toLowerCase() === group.assistLeaderResult.trim().toLowerCase()) p += 15;
                                  if (group.bestPlayerResult && b.bestPlayer && b.bestPlayer.trim().toLowerCase() === group.bestPlayerResult.trim().toLowerCase()) p += 15;
                                  return p;
                                })();
                                if (ptsB !== ptsA) return ptsB - ptsA;
                                return (a.user?.name || "").localeCompare(b.user?.name || "");
                              })
                              .map((member, rankIndex) => {
                                const isMe = currentUser && String(member.userId) === String(currentUser.id);
                                const showPredictions = isOracleClosed || isMe;
                                const pts = (() => {
                                  let p = 0;
                                  if (group.topScorerResult && member.topScorer && member.topScorer.trim().toLowerCase() === group.topScorerResult.trim().toLowerCase()) p += 15;
                                  if (group.assistLeaderResult && member.assistLeader && member.assistLeader.trim().toLowerCase() === group.assistLeaderResult.trim().toLowerCase()) p += 15;
                                  if (group.bestPlayerResult && member.bestPlayer && member.bestPlayer.trim().toLowerCase() === group.bestPlayerResult.trim().toLowerCase()) p += 15;
                                  return p;
                                })();
                                const podiumColors = [
                                  "text-[#ffd700]",
                                  "text-slate-300",
                                  "text-amber-600",
                                ];
                                const rankColor = rankIndex < 3 ? podiumColors[rankIndex] : "text-white/25";

                                return (
                                  <tr key={member.id} className={`text-xs transition-colors ${
                                    isMe
                                      ? "bg-[#ffd700]/[0.04] border-l-2 border-l-[#ffd700]/40 text-white"
                                      : "text-white/70 hover:bg-white/[0.02]"
                                  }`}>
                                    {/* Rank */}
                                    <td className="py-3 px-4">
                                      <span className={`font-black text-xs ${rankColor}`}>
                                        {rankIndex === 0 ? "🥇" : rankIndex === 1 ? "🥈" : rankIndex === 2 ? "🥉" : `${rankIndex + 1}º`}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full overflow-hidden shrink-0 ${
                                          isMe ? "border border-[#ffd700]/40" : "border border-white/20"
                                        } bg-white/5`}>
                                          {member.user.avatar ? (
                                            <img src={member.user.avatar} alt={member.user.name} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#0f0f0f] flex items-center justify-center font-bold text-[10px] text-white/50">
                                              {member.user.name.substring(0, 2).toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                        <span className={`font-bold truncate max-w-[110px] ${isMe ? "text-[#ffd700]" : "text-white"}`}>{member.user.name}</span>
                                        {isMe && (
                                          <span className="text-[8px] font-black text-[#0d2b1a] bg-[#ffd700] px-1.5 py-0.5 rounded uppercase">Você</span>
                                        )}
                                      </div>
                                    </td>

                                    <td className={showPredictions ? "py-3 px-4" : "py-3 px-4 text-center"}>
                                      {showPredictions ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className="truncate max-w-[150px]">{member.topScorer || "-"}</span>
                                          {group.topScorerResult && member.topScorer && member.topScorer.trim().toLowerCase() === group.topScorerResult.trim().toLowerCase() && (
                                            <span className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded font-bold">+15</span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-white/30 inline-flex items-center justify-center bg-white/5 p-1 rounded border border-white/5" title="Palpite oculto até o início da partida"><Lock className="w-3.5 h-3.5" /></span>
                                      )}
                                    </td>

                                    <td className={showPredictions ? "py-3 px-4" : "py-3 px-4 text-center"}>
                                      {showPredictions ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className="truncate max-w-[150px]">{member.assistLeader || "-"}</span>
                                          {group.assistLeaderResult && member.assistLeader && member.assistLeader.trim().toLowerCase() === group.assistLeaderResult.trim().toLowerCase() && (
                                            <span className="bg-emerald-500/15 border border-[#009E4F]/20 text-[#009E4F] text-[8px] px-1.5 py-0.5 rounded font-bold">+15</span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-white/30 inline-flex items-center justify-center bg-white/5 p-1 rounded border border-white/5" title="Palpite oculto até o início da partida"><Lock className="w-3.5 h-3.5" /></span>
                                      )}
                                    </td>

                                    <td className={showPredictions ? "py-3 px-4" : "py-3 px-4 text-center"}>
                                      {showPredictions ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className="truncate max-w-[150px]">{member.bestPlayer || "-"}</span>
                                          {group.bestPlayerResult && member.bestPlayer && member.bestPlayer.trim().toLowerCase() === group.bestPlayerResult.trim().toLowerCase() && (
                                            <span className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded font-bold">+15</span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-white/30 inline-flex items-center justify-center bg-white/5 p-1 rounded border border-white/5" title="Palpite oculto até o início da partida"><Lock className="w-3.5 h-3.5" /></span>
                                      )}
                                    </td>

                                    <td className="py-3 px-4 text-right">
                                      <span className={`font-black text-sm ${
                                        pts > 0 ? "text-emerald-400" : "text-white/40"
                                      }`}>
                                        {pts > 0 ? `+${pts}` : pts} pts
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
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
                    {[...(group?.members || [])]
                      .sort((a: any, b: any) => {
                        const dateA = new Date(a.joinedAt || 0).getTime();
                        const dateB = new Date(b.joinedAt || 0).getTime();
                        return dateA - dateB;
                      })
                      .map((member: any) => {
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
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  member.paid
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}>
                                  {member.paid ? "Pago" : "Pendente"}
                                </span>
                              </div>
                              <p className="text-[10px] text-white/40 mt-0.5">
                                Entrou em {new Date(member.joinedAt).toLocaleDateString("pt-BR")} • <span className="text-[#ffd700] font-bold">{member.points || 0} pts</span> (Bolão: {member.matchPoints || 0} | Oráculo: {member.oraclePoints || 0})
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {/* Toggle Paid Button for Group Creator */}
                            {isGroupCreator && (
                              <button
                                disabled={updatingPaidMemberId === member.userId}
                                onClick={async () => {
                                  if (updatingPaidMemberId) return;
                                  setUpdatingPaidMemberId(member.userId);
                                  try {
                                    await groupsApi.toggleMemberPaid(groupId, member.userId, !member.paid);
                                    const updatedGroup = await groupsApi.getGroupById(groupId);
                                    setGroup(updatedGroup);
                                    toast.success(`Status de pagamento de ${member.user.name} atualizado!`);
                                  } catch (err: any) {
                                    toast.error(err.message || "Erro ao atualizar status de pagamento");
                                  } finally {
                                    setUpdatingPaidMemberId(null);
                                  }
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-md shrink-0 flex items-center gap-1 ${
                                  member.paid
                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white"
                                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {updatingPaidMemberId === member.userId ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : member.paid ? (
                                  "Marcar Pendente"
                                ) : (
                                  "Marcar Pago"
                                )}
                              </button>
                            )}

                            {/* Kick/Remove member action */}
                            {isGroupCreator && (
                              isOwner ? (
                                <div className="px-3 py-1.5 text-xs font-semibold invisible select-none shrink-0 pointer-events-none">
                                  Remover
                                </div>
                              ) : (
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
                              )
                            )}
                          </div>
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
        {!(activeTab === "oraculo" && oracleSubTab === "classificacoes" && classificationsSubTab === "matamata") && (
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
                <h3 className="text-xs font-black text-white/40 mb-3 uppercase tracking-wider">Resumo</h3>
                <div className="space-y-3 text-xs text-white/70">
                  <div className="flex justify-between py-2 border-b border-white/5 items-center font-semibold">
                    <span className="text-white/40">Participantes:</span>
                    <span className="font-black text-[#ffd700]">{group.members.length} / {group.maxMembers}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5 items-center font-semibold">
                    <span className="text-white/40">Criado por:</span>
                    <span className="font-black text-white">{group.owner.name}</span>
                  </div>
                  {group.entryFee !== undefined && group.entryFee !== null && (
                    <div className="flex justify-between py-2 border-b border-white/5 items-center font-semibold">
                      <span className="text-white/40">Taxa de Entrada:</span>
                      <span className="font-black text-emerald-400">
                        {group.entryFee.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 items-center font-semibold">
                    <span className="text-white/40">Criado em:</span>
                    <span className="font-black text-white">{new Date(group.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>

              {/* Classificações do Grupo / Leaderboards (Bolão e Oráculo) */}
              <div className="flex flex-col gap-4 lg:gap-6 w-full animate-fade-in-up">
                
                {/* Ranking do Bolão */}
                <div className="auth-card p-5 border border-white/5 relative overflow-hidden bg-gradient-to-br from-[#0d2b1a]/40 via-black/20 to-black/30 rounded-3xl shadow-xl shadow-black/10">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Trophy className="w-24 h-24 text-[#ffd700]" />
                  </div>
                  
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <div>
                      <h3 className="text-sm font-black text-[#ffd700] flex items-center gap-2">
                        <Medal className="w-4 h-4" /> Ranking Bolão
                      </h3>
                      <p className="text-[10px] text-white/40 font-semibold mt-0.5">Pontos dos jogos da Fase de Grupos</p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 copa-scrollbar">
                    {rankedMembersBolao.map((member, index) => {
                      return (
                        <div 
                          key={`bolao-${member.id}`} 
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
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-1">
                            <span className="text-xs font-black text-[#ffd700]">{member.matchPoints || 0}</span>
                            <span className="text-[8px] text-white/40 uppercase font-black">pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ranking do Oráculo */}
                <div className="auth-card p-5 border border-purple-500/10 relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-black/20 to-black/30 rounded-3xl shadow-xl shadow-black/10">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                    <Sparkles className="w-24 h-24 text-purple-400" />
                  </div>
                  
                  <div className="flex items-center justify-between mb-4 border-b border-purple-500/10 pb-2">
                    <div>
                      <h3 className="text-sm font-black text-purple-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Ranking Oráculo
                      </h3>
                      <p className="text-[10px] text-white/40 font-semibold mt-0.5">Pontos do Mata-Mata e Premiações</p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 copa-scrollbar">
                    {rankedMembersOracle.map((member, index) => {
                      return (
                        <div 
                          key={`oracle-${member.id}`} 
                          className={`flex items-center justify-between gap-2.5 p-2 px-3 rounded-xl transition-all ${
                            index === 0 
                              ? "bg-gradient-to-r from-purple-500/15 to-purple-500/5 border border-purple-500/30 shadow-sm shadow-purple-500/5" 
                              : "hover:bg-white/5 bg-white/[0.02] border border-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Position Badge */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm ${
                              index === 0 ? "bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.3)]" : 
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
                                {index === 0 && <Crown className="w-3.5 h-3.5 text-purple-400 animate-pulse" />}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-1">
                            <span className="text-xs font-black text-purple-400">{member.oraclePoints || 0}</span>
                            <span className="text-[8px] text-white/40 uppercase font-black">pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card de Pagamento do Bolão (Pix) */}
              {group.pixKey && (
                <div className="auth-card p-5 border border-emerald-500/20 bg-[#0d2b1a]/10 relative overflow-hidden rounded-3xl shadow-lg animate-fade-in-up">
                  <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                    <Sparkles className="w-16 h-16 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-black text-white mb-2 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-400" /> Contribuição do Grupo
                  </h3>
                  
                  {isCopiaCola ? (
                    <>
                      <p className="text-xs text-white/50 mb-4 font-semibold leading-normal">
                        Escaneie o QR Code abaixo ou copie o código Copia e Cola para realizar o pagamento da taxa do bolão.
                      </p>
                      
                      {/* QR Code Container */}
                      <div className="flex flex-col items-center justify-center p-4 mb-4 rounded-2xl bg-white/5 border border-white/10 relative group/qr">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-[#ffd700] rounded-2xl blur opacity-0 group-hover/qr:opacity-10 transition duration-500" />
                        
                        <div className="relative p-2.5 bg-white rounded-xl shadow-lg transition-transform duration-300 group-hover/qr:scale-105">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(group.pixPayload || group.pixKey)}`}
                            alt="Pix QR Code"
                            className="w-[180px] h-[180px] object-contain select-none"
                            loading="lazy"
                          />
                        </div>
                        
                        <p className="text-[10px] text-white/40 mt-2.5 font-bold uppercase tracking-wider flex items-center gap-1">
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" /> Valor definido pelo organizador
                        </p>
                      </div>

                      {/* Pix Key Display (Copia e Cola) */}
                      <div className="mb-4">
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Código Copia e Cola:</p>
                        <div className="bg-black/30 border border-white/5 px-3 py-2 rounded-xl text-xs font-mono text-center text-white/80 select-all truncate">
                          {group.pixPayload || group.pixKey}
                        </div>
                      </div>

                      {/* Copy & Paste Code */}
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(group.pixPayload || group.pixKey);
                            toast.success("Código Pix Copia e Cola copiado!");
                          }}
                          className="w-full copa-btn-primary flex items-center justify-center gap-2 py-2.5 text-xs font-black shadow-lg shadow-emerald-500/10 rounded-xl cursor-pointer"
                        >
                          Copiar Pix Copia e Cola
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-white/50 mb-4 font-semibold leading-normal">
                        Copie a chave Pix cadastrada abaixo para realizar a transferência da taxa do bolão.
                      </p>
                      
                      {/* Pix Key Display */}
                      <div className="mb-4">
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Chave Pix cadastrada:</p>
                        <div className="bg-black/30 border border-[#ffd700]/15 px-3 py-2.5 rounded-xl text-sm font-mono text-center font-black text-[#ffd700] tracking-wider select-all truncate">
                          {group.pixKey}
                        </div>
                      </div>

                      {/* Copy Key Button */}
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(group.pixKey);
                            toast.success("Chave Pix copiada!");
                          }}
                          className="w-full copa-btn-primary flex items-center justify-center gap-2 py-2.5 text-xs font-black shadow-lg shadow-[#ffd700]/10 rounded-xl cursor-pointer"
                        >
                          Copiar Chave Pix
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
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
                {oracleSubTab === "premiacoes" ? (
                  <>
                    <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                      ⭐ Pontuação das Premiações
                    </h3>
                    <div className="space-y-3 text-xs">
                      {/* Acertos de premiações */}
                      <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                        <p className="font-bold text-white flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-8 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/25 text-[10px]">
                            +15
                          </span>
                          Acerto de Premiação Individual
                        </p>
                        <p className="text-[11px] text-white/50 leading-normal pl-9">
                          Você ganha <strong className="text-white font-bold">15 pontos</strong> para cada acerto correto nas categorias: <strong className="text-white font-bold">Artilheiro</strong>, <strong className="text-white font-bold">Líder de Assistências</strong> ou <strong className="text-white font-bold">Melhor Jogador</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-white/5 mt-4 pt-3 text-[10px] text-white/40 italic leading-normal">
                      ⚠️ Os palpites fecham no início da primeira partida e a pontuação será computada automaticamente ao final do torneio após a definição oficial dos vencedores.
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                      ⭐ Pontuação do Oráculo
                    </h3>
                    <div className="space-y-3 text-xs">
                      {/* Posições exatas */}
                      <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                        <p className="font-bold text-white flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/25 text-[10px]">
                            +3
                          </span>
                          Posições Exatas (1º, 2º, 3º e 4º)
                        </p>
                        <p className="text-[11px] text-white/50 leading-normal pl-6">
                          Você ganha <strong className="text-white font-bold">3 pontos</strong> para cada time que acertar a posição exata (1º, 2º, 3º ou 4º colocado) no grupo.
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-white/5 mt-4 pt-3 text-[10px] text-white/40 italic leading-normal">
                      ⚠️ O Oráculo fecha no início da primeira partida e as pontuações só serão calculadas e exibidas na tabela após a finalização completa da Fase de Grupos.
                    </div>
                  </>
                )}
                </div>

              {/* Regra Card */}
              {oracleSubTab !== "premiacoes" && classificationsSubTab !== "matamata" && (
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
              {oracleSubTab !== "premiacoes" && classificationsSubTab !== "matamata" && (
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
                              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center font-bold text-[8px] team-flag-shell-3d">
                                {team.flag ? (
                                  <img src={team.flag} alt={team.code} className="w-full h-full object-cover team-flag-3d" />
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
                        {hasGroupStandingData ? "8 Melhores Terceiros" : "Terceiros (Repescagem 2026)"}
                      </h4>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto pr-1 copa-scrollbar">
                        {(hasGroupStandingData ? rankedBestThirds : allThirdCandidates).map((third) => (
                            <div key={third.code} className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs">
                              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center font-bold text-[8px] team-flag-shell-3d">
                                {third.flag ? (
                                  <img src={third.flag} alt={third.code} className="w-full h-full object-cover team-flag-3d" />
                                ) : (
                                  third.code
                                )}
                              </div>
                              <span className="font-semibold text-white/90 truncate flex-1">{third.name}</span>
                              {hasGroupStandingData && (
                                <span className="text-[9px] font-bold text-[#ffd700] shrink-0">{third.points} pts</span>
                              )}
                              <span className="text-[9px] font-bold text-white/40 bg-white/5 px-1 rounded uppercase shrink-0">{third.groupName}</span>
                            </div>
                        ))}
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
                  {group.entryFee !== undefined && group.entryFee !== null && (
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span>Taxa de Entrada:</span>
                      <span className="font-bold text-emerald-400">
                        {group.entryFee.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  )}
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

    {isEditModalOpen && (
      <EditGroupModal
        group={group}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={(updatedGroup) => {
          setGroup(updatedGroup);
          setIsEditModalOpen(false);
        }}
      />
    )}
  </>
  );
}
