"use client";

import { useEffect, useState } from "react";
import { Trophy, Calendar, Users, Activity, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { matchesApi, teamsApi } from "@/lib/api";
import type { MatchPredictionData, TeamData } from "@/lib/api";

const GROUPS_LIST = [
  "Grupo A", "Grupo B", "Grupo C", "Grupo D", "Grupo E", "Grupo F",
  "Grupo G", "Grupo H", "Grupo I", "Grupo J", "Grupo K", "Grupo L"
];

export default function DashboardPage() {
  const [userName, setUserName] = useState("Jogador");
  const [loading, setLoading] = useState(true);
  const [gamesData, setGamesData] = useState<Record<string, MatchPredictionData[]>>({});
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [allGames, setAllGames] = useState<MatchPredictionData[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<MatchPredictionData[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("Grupo A");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("copa_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.name) setUserName(user.name.split(" ")[0]);
        } catch (e) {}
      }
    }

    async function loadDashboardData() {
      try {
        const [data, fetchedTeams] = await Promise.all([
          matchesApi.getMatches(),
          teamsApi.getTeams(),
        ]);
        setGamesData(data);
        setTeams(fetchedTeams);

        const allMatches: MatchPredictionData[] = [];
        Object.values(data).forEach((groupMatches) => {
          allMatches.push(...groupMatches);
        });

        // Ordenar confrontos em ordem estritamente crescente de data/hora
        allMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setAllGames(allMatches);

        // Jogos que não foram finalizados
        const upcoming = allMatches.filter((m) => m.status !== "FINISHED");
        setUpcomingGames(upcoming.length > 0 ? upcoming.slice(0, 5) : allMatches.slice(0, 5));
      } catch (err) {
        console.error("Erro ao carregar confrontos para o dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Calcular classificação do grupo selecionado
  const standings = (() => {
    const matches = gamesData[selectedGroup] || [];
    const table: Record<string, {
      code: string;
      name: string;
      flag: string | null;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      points: number;
      gf: number;
      ga: number;
      gd: number;
    }> = {};

    // 1. Pre-populate the table with all 4 teams belonging to the selected group
    const groupLetter = selectedGroup.replace("Grupo ", "").trim(); // E.g. "Grupo A" -> "A"
    const groupTeams = teams.filter((t) => t.group === groupLetter);

    groupTeams.forEach((t) => {
      table[t.code] = {
        code: t.code,
        name: t.name,
        flag: t.flag,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        points: 0,
        gf: 0,
        ga: 0,
        gd: 0,
      };
    });

    // 2. Loop over matches to update statistics
    matches.forEach((match) => {
      const homeCode = match.homeTeam.code;
      const awayCode = match.awayTeam.code;

      // Fallback in case a team is not in the groupTeams list (e.g. dynamic/TBD teams)
      if (!table[homeCode]) {
        table[homeCode] = {
          code: homeCode,
          name: match.homeTeam.name,
          flag: match.homeTeam.flag,
          played: 0, won: 0, drawn: 0, lost: 0, points: 0, gf: 0, ga: 0, gd: 0
        };
      }
      if (!table[awayCode]) {
        table[awayCode] = {
          code: awayCode,
          name: match.awayTeam.name,
          flag: match.awayTeam.flag,
          played: 0, won: 0, drawn: 0, lost: 0, points: 0, gf: 0, ga: 0, gd: 0
        };
      }

      const hScore = match.realHomeScore;
      const aScore = match.realAwayScore;

      if (hScore !== null && aScore !== null) {
        table[homeCode].played += 1;
        table[awayCode].played += 1;
        table[homeCode].gf += hScore;
        table[homeCode].ga += aScore;
        table[awayCode].gf += aScore;
        table[awayCode].ga += hScore;

        if (hScore > aScore) {
          table[homeCode].won += 1;
          table[homeCode].points += 3;
          table[awayCode].lost += 1;
        } else if (hScore < aScore) {
          table[awayCode].won += 1;
          table[awayCode].points += 3;
          table[homeCode].lost += 1;
        } else {
          table[homeCode].drawn += 1;
          table[homeCode].points += 1;
          table[awayCode].drawn += 1;
          table[awayCode].points += 1;
        }
      }
    });

    // Calcular diferença de gols
    Object.keys(table).forEach((code) => {
      table[code].gd = table[code].gf - table[code].ga;
    });

    return Object.values(table).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name);
    });
  })();

  // Estatísticas gerais
  const totalFinished = allGames.filter((g) => g.status === "FINISHED").length;
  const totalPending = allGames.filter((g) => g.status !== "FINISHED").length;
  const todayStr = new Date().toDateString();
  const gamesTodayCount = allGames.filter((g) => new Date(g.date).toDateString() === todayStr).length;

  const stats = [
    { title: "Jogos Pendentes", value: String(totalPending), icon: CalendarDays, color: "text-[#ffd700]", bg: "bg-[#ffd700]/10" },
    { title: "Jogos Encerrados", value: String(totalFinished), icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { title: "Total de Jogos", value: String(allGames.length), icon: Activity, color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Jogos Hoje", value: String(gamesTodayCount), icon: Calendar, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-[#ffd700] animate-spin" />
        <p className="text-white/60 text-sm font-semibold">Carregando painel geral...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome Header */}
      <div className="relative p-6 md:p-8 rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-r from-[#0d2b1a]/40 via-[#0a0f1e]/40 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-[#2d8a50]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-12 bottom-0 w-32 h-32 bg-[#ffd700]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Olá, <span className="text-[#ffd700] bg-gradient-to-r from-[#ffd700] to-[#f5c800] bg-clip-text text-transparent">{userName}</span>! 👋
          </h1>
          <p className="text-white/60 mt-2 text-sm md:text-base max-w-xl leading-relaxed">
            Bem-vindo ao seu painel de controle da Copa 2026. Acompanhe seus palpites, classificação geral e o calendário do torneio.
          </p>
        </div>
        
        <Link 
          href="/dashboard/jogos"
          className="copa-btn-primary px-7 py-3.5 text-sm inline-flex items-center gap-2 max-w-fit shadow-xl shadow-[#ffd700]/15 hover:scale-102 transition-all duration-300 relative z-10"
        >
          <CalendarDays className="w-4.5 h-4.5" />
          Ver Jogos
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const cardThemes = [
            "hover:bg-[#ffd700]/5 hover:border-[#ffd700]/30 shadow-[0_4px_24px_-8px_rgba(255,215,0,0.08)]",
            "hover:bg-blue-500/5 hover:border-blue-500/30 shadow-[0_4px_24px_-8px_rgba(59,130,246,0.08)]",
            "hover:bg-emerald-500/5 hover:border-emerald-500/30 shadow-[0_4px_24px_-8px_rgba(16,185,129,0.08)]",
            "hover:bg-purple-500/5 hover:border-purple-500/30 shadow-[0_4px_24px_-8px_rgba(139,92,246,0.08)]",
          ];
          
          return (
            <div 
              key={idx}
              className={`auth-card p-5 border border-white/5 hover:border-white/20 transition-all duration-300 flex items-center justify-between bg-[#0a0f1e]/40 hover:-translate-y-1.5 ${cardThemes[idx]}`}
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{stat.title}</p>
                <h3 className="text-3xl font-black text-white tracking-tight">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-2xl ${stat.bg} shrink-0 shadow-inner border border-white/5`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Próximos Jogos & Tabela de Grupos ao Lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Próximos Jogos Panel */}
        <div className="auth-card p-6 border border-white/5 bg-[#0a0f1e]/40 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-[#ffd700]" />
                Próximos Jogos
              </h2>
              <p className="text-xs text-white/45 mt-1">Os próximos 5 confrontos agendados no torneio</p>
            </div>
            <Link href="/dashboard/jogos" className="text-xs font-bold text-[#ffd700] hover:underline flex items-center gap-1 group">
              Ver todos <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>

          {upcomingGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-white/30" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Nenhum jogo em breve</h3>
              <p className="text-xs text-white/50 max-w-sm">
                Todos os jogos do torneio foram concluídos ou não estão disponíveis.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingGames.map((game) => {
                const isFinished = game.status === "FINISHED";
                const isLive = game.status === "LIVE";
                const hasPredicted = game.predictedHomeScore !== null && game.predictedAwayScore !== null;
                const gameDate = new Date(game.date);

                return (
                  <div 
                    key={game.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-[#ffd700]/20 transition-all duration-300"
                  >
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex max-w-fit px-2 py-0.5 rounded-md text-[9px] font-black text-[#ffd700] bg-[#ffd700]/10 border border-[#ffd700]/15 uppercase tracking-wider">
                          {game.stage} • {gameDate.toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}{game.stadium && ` • ${game.stadium}`}
                        </span>
                        
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ao Vivo
                          </span>
                        ) : isFinished ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black text-red-400 bg-red-500/10 border border-red-500/20 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Finalizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/15 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Pendente
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3.5 mt-0.5">
                        {/* Home Team */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/15 bg-black/30 flex items-center justify-center text-[8px] font-black shadow-md">
                            {game.homeTeam.flag ? (
                              <img src={game.homeTeam.flag} alt={game.homeTeam.code} className="w-full h-full object-cover" />
                            ) : (
                              game.homeTeam.code
                            )}
                          </div>
                          <span 
                            className="font-bold text-xs sm:text-sm text-white truncate max-w-[100px] sm:max-w-none cursor-help"
                            title={game.homeTeam.name}
                          >
                            {game.homeTeam.name}
                          </span>
                        </div>

                        <span className="text-[10px] font-black text-white/20 shrink-0">VS</span>

                        {/* Away Team */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/15 bg-black/30 flex items-center justify-center text-[8px] font-black shadow-md">
                            {game.awayTeam.flag ? (
                              <img src={game.awayTeam.flag} alt={game.awayTeam.code} className="w-full h-full object-cover" />
                            ) : (
                              game.awayTeam.code
                            )}
                          </div>
                          <span 
                            className="font-bold text-xs sm:text-sm text-white truncate max-w-[100px] sm:max-w-none cursor-help"
                            title={game.awayTeam.name}
                          >
                            {game.awayTeam.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      {isLive ? (
                        <div className="flex flex-col gap-1 items-center shrink-0">
                          <div className="text-center shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl min-w-[95px] shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Ao Vivo
                            </p>
                            <p className="text-sm font-black text-[#ffd700] mt-0.5">{game.realHomeScore} - {game.realAwayScore}</p>
                          </div>
                        </div>
                      ) : isFinished ? (
                        <div className="flex flex-col gap-1 items-center shrink-0">
                          <div className="text-center shrink-0 bg-red-500/10 border border-red-500/20 px-3.5 py-2 rounded-xl min-w-[95px]">
                            <p className="text-[8px] font-black text-red-400 uppercase tracking-widest flex items-center justify-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Finalizado
                            </p>
                            <p className="text-sm font-black text-white mt-0.5">{game.realHomeScore} - {game.realAwayScore}</p>
                          </div>
                          {game.predictedHomeScore !== null && game.predictedAwayScore !== null && (
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border ${
                              game.pointsEarned === 5 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]" :
                              game.pointsEarned === 4 ? "bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-[0_0_8px_rgba(20,184,166,0.1)]" :
                              game.pointsEarned === 3 ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]" :
                              game.pointsEarned === 1 ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]" :
                              "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                              +{game.pointsEarned} Ponto{game.pointsEarned !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      ) : hasPredicted ? (
                        <div className="flex flex-col gap-1 text-center shrink-0">
                          <div className="text-center bg-black/45 border border-[#ffd700]/30 px-3.5 py-1.5 rounded-xl shadow-inner min-w-[95px] flex flex-col items-center">
                            <p className="text-[8px] font-black text-[#ffd700] uppercase tracking-widest flex items-center justify-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Pendente
                            </p>
                            <p className="text-xs font-black text-white mt-0.5">{game.predictedHomeScore} - {game.predictedAwayScore}</p>
                          </div>
                          <Link 
                            href="/dashboard/grupos" 
                            className="text-[9px] font-black text-[#ffd700] hover:text-white transition-all uppercase tracking-wider text-center"
                          >
                            Alterar
                          </Link>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 text-center shrink-0">
                          <Link 
                            href="/dashboard/grupos" 
                            className="copa-btn-primary px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-center shrink-0 min-w-[95px] justify-center block hover:scale-102 transition-all duration-300"
                          >
                            Palpitar
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Standings Group Panel */}
        <div className="auth-card p-5 border border-white/5 bg-[#0a0f1e]/40 space-y-5 self-start w-full">
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-[#ffd700]" />
              Tabela do Grupo
            </h2>
            <p className="text-xs text-white/45 mt-1">Classificação ao vivo das seleções</p>
          </div>
  
          {/* Group Selector with Next / Prev buttons */}
          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => {
                const currentIndex = GROUPS_LIST.indexOf(selectedGroup);
                if (currentIndex > 0) {
                  setSelectedGroup(GROUPS_LIST[currentIndex - 1]);
                }
              }}
              disabled={selectedGroup === "Grupo A"}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-white hover:border-[#ffd700]/30 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/5 transition-all shrink-0 flex items-center justify-center cursor-pointer"
              title="Grupo Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
  
            <div className="relative flex-1">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-transparent border border-white/5 hover:border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none cursor-pointer text-center flex items-center justify-center gap-1 bg-white/[0.01] hover:bg-white/[0.04] transition-all"
              >
                {selectedGroup.toUpperCase()}
                <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  
                  {/* Floating glass dropdown menu */}
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1627]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.7)] shadow-[#ffd700]/5 overflow-hidden z-50 py-1.5 max-h-56 overflow-y-auto copa-scrollbar animate-fade-in-up">
                    {GROUPS_LIST.map((g) => (
                      <button
                        key={g}
                        onClick={() => {
                          setSelectedGroup(g);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-center px-4 py-2 text-[11px] font-black uppercase transition-all duration-200 cursor-pointer ${
                          selectedGroup === g
                            ? "bg-gradient-to-r from-[#ffd700] to-[#f5c800] text-[#0d2b1a] font-black"
                            : "text-white/70 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
  
            <button
              onClick={() => {
                const currentIndex = GROUPS_LIST.indexOf(selectedGroup);
                if (currentIndex < GROUPS_LIST.length - 1) {
                  setSelectedGroup(GROUPS_LIST[currentIndex + 1]);
                }
              }}
              disabled={selectedGroup === "Grupo L"}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-white hover:border-[#ffd700]/30 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/5 transition-all shrink-0 flex items-center justify-center cursor-pointer"
              title="Próximo Grupo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
  
          {/* Standings Table */}
          <div className="overflow-hidden border border-white/5 rounded-2xl bg-black/10">
            <table className="w-full text-left text-xs border-collapse table-fixed">
              <thead>
                <tr className="bg-black/35 border-b border-white/5 text-[9px] font-bold uppercase text-white/40 tracking-wider">
                  <th className="py-2.5 px-1 text-center w-[8%]">Pos</th>
                  <th className="py-2.5 px-1 w-[24%]">Seleção</th>
                  <th className="py-2.5 px-1 text-center w-[8%]">J</th>
                  <th className="py-2.5 px-1 text-center w-[8%]">V</th>
                  <th className="py-2.5 px-1 text-center w-[8%]">E</th>
                  <th className="py-2.5 px-1 text-center w-[8%]">D</th>
                  <th className="py-2.5 px-1 text-center w-[8%]">GP</th>
                  <th className="py-2.5 px-1 text-center w-[8%]">GC</th>
                  <th className="py-2.5 px-1 text-center w-[8%]">SG</th>
                  <th className="py-2.5 px-1 text-center w-[12%]">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {standings.map((team, index) => {
                  const isTop2 = index < 2;
                  const isThird = index === 2;
 
                  return (
                    <tr 
                      key={team.code} 
                      className={`hover:bg-white/5 transition-all duration-200 border-l-2 ${
                        isTop2 
                          ? "bg-emerald-500/[0.02] border-l-emerald-500/40" 
                          : isThird 
                          ? "bg-blue-500/[0.02] border-l-blue-500/40" 
                          : "border-l-transparent"
                      }`}
                    >
                      {/* Position Badge */}
                      <td className="py-3 px-1 text-center shrink-0 w-[8%]">
                        <span className={`inline-flex w-4.5 h-4.5 items-center justify-center rounded-full font-black text-[9px] ${
                          isTop2 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
                          isThird ? "bg-blue-500/20 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]" :
                          "bg-white/5 text-white/40"
                        }`}>
                          {index + 1}
                        </span>
                      </td>
 
                      {/* Team Info */}
                      <td className="py-3 px-1 font-bold w-[24%]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-white/15 bg-black/40 flex items-center justify-center font-bold text-[6px] shadow-sm">
                            {team.flag ? (
                              <img src={team.flag} alt={team.code} className="w-full h-full object-cover" />
                            ) : (
                              team.code
                            )}
                          </div>
                          <span className="text-white truncate max-w-[70px] sm:max-w-none text-[10px] sm:text-xs">{team.name}</span>
                        </div>
                      </td>
 
                      {/* Played */}
                      <td className="py-3 px-1 text-center font-semibold text-white/70 text-[10px] sm:text-xs w-[8%]">{team.played}</td>
 
                      {/* Vitórias */}
                      <td className="py-3 px-1 text-center font-semibold text-white/70 text-[10px] sm:text-xs w-[8%]">{team.won}</td>
 
                      {/* Empates */}
                      <td className="py-3 px-1 text-center font-semibold text-white/70 text-[10px] sm:text-xs w-[8%]">{team.drawn}</td>
 
                      {/* Derrotas */}
                      <td className="py-3 px-1 text-center font-semibold text-white/70 text-[10px] sm:text-xs w-[8%]">{team.lost}</td>
 
                      {/* Gols Pró (Marcados) */}
                      <td className="py-3 px-1 text-center font-semibold text-white/70 text-[10px] sm:text-xs w-[8%]">{team.gf}</td>
 
                      {/* Gols Contra (Sofridos) */}
                      <td className="py-3 px-1 text-center font-semibold text-white/70 text-[10px] sm:text-xs w-[8%]">{team.ga}</td>
 
                      {/* Goal Difference */}
                      <td className={`py-3 px-1 text-center font-black text-[10px] sm:text-xs w-[8%] ${
                        team.gd > 0 ? "text-emerald-400" : team.gd < 0 ? "text-red-400" : "text-white/40"
                      }`}>
                        {team.gd > 0 ? `+${team.gd}` : team.gd}
                      </td>
 
                      {/* Points */}
                      <td className="py-3 px-1 text-center shrink-0 w-[12%]">
                        <span className="font-black text-[#ffd700] text-[10px] sm:text-xs">{team.points}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
  
          {/* Information legend */}
          <div className="flex items-center justify-between text-[9px] text-white/30 px-1 border-t border-white/5 pt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" /> Classificados
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]" /> Repescagem
            </span>
          </div>
  
        </div>
 


      </div>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
