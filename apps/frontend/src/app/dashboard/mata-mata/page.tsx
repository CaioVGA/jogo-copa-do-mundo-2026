"use client";

import { useEffect, useState } from "react";
import { matchesApi } from "@/lib/api";
import type { MatchPredictionData } from "@/lib/api";
import { Loader2, AlertCircle, Trophy } from "lucide-react";

// Simplified CircleMatch component for display only (no predictions)
function BracketCircleMatch({ game }: { game: MatchPredictionData }) {
  const isFinished = game.status === "FINISHED";
  const isLive = game.status === "IN_PLAY";
  
  const hTeam = game.homeTeam?.name ? game.homeTeam : null;
  const aTeam = game.awayTeam?.name ? game.awayTeam : null;

  const homeWon = game.realHomeScore !== null && (
    game.realHomeScore > (game.realAwayScore ?? 0) || 
    (game.realHomeScore === game.realAwayScore && (game.homePenalties ?? 0) > (game.awayPenalties ?? 0))
  );
  
  const awayWon = game.realAwayScore !== null && (
    game.realAwayScore > (game.realHomeScore ?? 0) || 
    (game.realAwayScore === game.realHomeScore && (game.awayPenalties ?? 0) > (game.homePenalties ?? 0))
  );

  return (
    <div className={`relative w-40 sm:w-44 bg-black/40 border ${isLive ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "border-white/10"} rounded-xl p-2 shrink-0 flex flex-col gap-1.5 backdrop-blur-sm mx-auto hover:bg-black/60 transition-colors`}>
      {/* Date & Stage */}
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] text-white/50 tracking-wider font-semibold">
          {new Date(game.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </span>
        {isLive && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </div>

      {/* Teams Container */}
      <div className="flex flex-col gap-1.5 bg-black/30 rounded-lg p-1.5 border border-white/5">
        {/* Home Team */}
        <div className={`flex items-center justify-between gap-1.5 p-1 rounded-md transition-colors ${homeWon ? "bg-[#ffd700]/5" : ""}`}>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center font-bold text-[8px]">
              {hTeam?.flag ? (
                <img src={hTeam.flag} alt={hTeam.code} className="w-full h-full object-cover" />
              ) : (
                hTeam?.code || "?"
              )}
            </div>
            <span className={`text-[10px] font-bold truncate ${homeWon ? "text-[#ffd700]" : "text-white/80"}`} title={hTeam?.name || game.homeTeamFallback || "A Definir"}>
              {hTeam?.name || game.homeTeamFallback || "A Definir"}
            </span>
          </div>
          {(isFinished || isLive || game.realHomeScore !== null) && (
            <div className="flex items-center gap-1">
              {game.homePenalties !== null && game.homePenalties !== undefined && (
                <span className="text-[8px] text-white/50 font-bold">({game.homePenalties})</span>
              )}
              <span className={`text-xs font-black shrink-0 ${isLive ? "text-emerald-400 animate-pulse" : (homeWon ? "text-[#ffd700]" : "text-white")}`}>
                {game.realHomeScore}
              </span>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className={`flex items-center justify-between gap-1.5 p-1 rounded-md transition-colors ${awayWon ? "bg-[#ffd700]/5" : ""}`}>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center font-bold text-[8px]">
              {aTeam?.flag ? (
                <img src={aTeam.flag} alt={aTeam.code} className="w-full h-full object-cover" />
              ) : (
                aTeam?.code || "?"
              )}
            </div>
            <span className={`text-[10px] font-bold truncate ${awayWon ? "text-[#ffd700]" : "text-white/80"}`} title={aTeam?.name || game.awayTeamFallback || "A Definir"}>
              {aTeam?.name || game.awayTeamFallback || "A Definir"}
            </span>
          </div>
          {(isFinished || isLive || game.realAwayScore !== null) && (
            <div className="flex items-center gap-1">
              {game.awayPenalties !== null && game.awayPenalties !== undefined && (
                <span className="text-[8px] text-white/50 font-bold">({game.awayPenalties})</span>
              )}
              <span className={`text-xs font-black shrink-0 ${isLive ? "text-emerald-400 animate-pulse" : (awayWon ? "text-[#ffd700]" : "text-white")}`}>
                {game.realAwayScore}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="bg-black/15 px-2 flex justify-between items-center text-[8px] border-t border-white/5 pt-1">
         <span className="text-white/30 truncate max-w-[100%] italic">{game.stadium || "Estádio a definir"}</span>
      </div>
    </div>
  );
}

export default function MataMataPage() {
  const [matches, setMatches] = useState<MatchPredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bracketRound, setBracketRound] = useState<"all" | "r32" | "r16" | "r8" | "r4" | "r2">("all");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await matchesApi.getMatches();
        const allMatches = Object.values(data).flat();
        setMatches(allMatches);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar jogos");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#ffd700] animate-spin" />
        <p className="text-white/50 font-medium">Carregando chaveamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 max-w-2xl mx-auto">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-red-400 font-bold">Erro</h3>
          <p className="text-white/70 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Arrays to hold the matches for each stage
  const r32 = matches.filter(m => m.stage === "Dezesseisavos de Final");
  const r16 = matches.filter(m => m.stage === "Oitavas de Final");
  const r8 = matches.filter(m => m.stage === "Quartas de Final");
  const r4 = matches.filter(m => m.stage === "Semifinais" || m.stage === "Semifinal");
  const r2 = matches.filter(m => m.stage === "Final" || m.stage === "Terceiro Lugar" || m.stage === "Disputa do 3º Lugar");

  const leftR32Order = [75, 78, 73, 76, 84, 83, 82, 81];
  const rightR32Order = [74, 77, 79, 80, 87, 86, 85, 88];
  const leftR16Order = [89, 90, 91, 92];
  const rightR16Order = [93, 94, 95, 96];
  const leftR8Order = [97, 98];
  const rightR8Order = [99, 100];
  const leftR4Order = [101];
  const rightR4Order = [102];

  const getMatchesByOrder = (pool: MatchPredictionData[], order: number[]) => {
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

  const getSelectedMatches = () => {
    switch (bracketRound) {
      case "r32": return r32;
      case "r16": return r16;
      case "r8": return r8;
      case "r4": return r4;
      case "r2": return r2;
      default: return [];
    }
  };

  const selectedMatches = getSelectedMatches();

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd700] to-[#f5c800] flex items-center justify-center shadow-lg shadow-[#ffd700]/20">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            Mata-Mata
          </h1>
          <p className="text-white/60 mt-2 text-sm max-w-xl">
            Acompanhe o chaveamento real e os cruzamentos da fase final da Copa do Mundo 2026.
          </p>
        </div>
      </div>

      <div className="space-y-4">
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
        </div>

        {/* Exibição da Árvore Symmetrical ou Grade Focada */}
        {bracketRound === "all" ? (
          <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 justify-start items-stretch scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent w-full">
            <div className="flex gap-4 md:gap-6 items-stretch py-2 min-w-max px-4 mx-auto">
              {/* COLUNA 1: Dezesseisavos (Lado Esquerdo) */}
              <div className="flex flex-col gap-2 w-44">
                <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">1/16 Final</div>
                <div className="flex flex-col justify-between flex-1 py-1 gap-2">
                  {r32Left.map((game) => (
                    <BracketCircleMatch key={game.id} game={game} />
                  ))}
                </div>
              </div>

              {/* COLUNA 2: Oitavas (Lado Esquerdo) */}
              <div className="flex flex-col gap-2 w-44">
                <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Oitavas</div>
                <div className="flex flex-col justify-around flex-1 py-4">
                  {r16Left.map((game) => (
                    <BracketCircleMatch key={game.id} game={game} />
                  ))}
                </div>
              </div>

              {/* COLUNA 3: Quartas (Lado Esquerdo) */}
              <div className="flex flex-col gap-2 w-44">
                <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Quartas</div>
                <div className="flex flex-col justify-around flex-1 py-12">
                  {r8Left.map((game) => (
                    <BracketCircleMatch key={game.id} game={game} />
                  ))}
                </div>
              </div>

              {/* COLUNA 4: Semifinal (Lado Esquerdo) */}
              <div className="flex flex-col gap-2 w-44">
                <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Semifinal</div>
                <div className="flex flex-col justify-around flex-1 py-24">
                  {r4Left.map((game) => (
                    <BracketCircleMatch key={game.id} game={game} />
                  ))}
                </div>
              </div>

              {/* COLUNA 5: FINAIS (Centro do Chaveamento) */}
              <div className="flex flex-col gap-4 justify-center items-center px-4 min-w-[210px] bg-black/10 border border-white/5 rounded-3xl relative overflow-hidden py-6 mx-2">
                <div className="absolute inset-0 bg-gradient-to-b from-[#ffd700]/5 to-transparent pointer-events-none" />
                
                {/* Campeão / Final */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-[#ffd700] tracking-widest bg-[#ffd700]/10 border border-[#ffd700]/25 px-2.5 py-1 rounded-full shadow-sm">
                    🏆 Final
                  </span>
                  {finalMatch ? (
                    <BracketCircleMatch game={finalMatch} />
                  ) : (
                    <div className="w-40 sm:w-44 h-16 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 text-xs">
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
                    <BracketCircleMatch game={thirdMatch} />
                  ) : (
                    <div className="w-40 sm:w-44 h-16 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 text-xs">
                      3º Lugar
                    </div>
                  )}
                </div>
              </div>

              {/* COLUNA 6: Semifinal (Lado Direito) */}
              <div className="flex flex-col gap-2 w-44">
                <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Semifinal</div>
                <div className="flex flex-col justify-around flex-1 py-24">
                  {r4Right.map((game) => (
                    <BracketCircleMatch key={game.id} game={game} />
                  ))}
                </div>
              </div>

              {/* COLUNA 7: Quartas (Lado Direito) */}
              <div className="flex flex-col gap-2 w-44">
                <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Quartas</div>
                <div className="flex flex-col justify-around flex-1 py-12">
                  {r8Right.map((game) => (
                    <BracketCircleMatch key={game.id} game={game} />
                  ))}
                </div>
              </div>

              {/* COLUNA 8: Oitavas (Lado Direito) */}
              <div className="flex flex-col gap-2 w-44">
                <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">Oitavas</div>
                <div className="flex flex-col justify-around flex-1 py-4">
                  {r16Right.map((game) => (
                    <BracketCircleMatch key={game.id} game={game} />
                  ))}
                </div>
              </div>

              {/* COLUNA 9: Dezesseisavos (Lado Direito) */}
              <div className="flex flex-col gap-2 w-44">
                <div className="text-[9px] uppercase font-black text-white/30 tracking-wider text-center border-b border-white/5 pb-1">1/16 Final</div>
                <div className="flex flex-col justify-between flex-1 py-1 gap-2">
                  {r32Right.map((game) => (
                    <BracketCircleMatch key={game.id} game={game} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center pt-2">
            {selectedMatches.map((game) => (
              <div key={game.id} className="flex flex-col items-center gap-1.5 p-2 bg-black/10 border border-white/5 rounded-2xl">
                <span className="text-[8px] font-black text-white/30 uppercase truncate max-w-[80px]">
                  {game.stage?.replace("Dezesseisavos", "1/16").replace(" de Final", "")}
                </span>
                <BracketCircleMatch game={game} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
