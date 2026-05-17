"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Users, ArrowLeft, Loader2, Sparkles, Target, Activity, CalendarDays, Medal, Crown } from "lucide-react";
import { groupsApi } from "@/lib/api";

type TabType = "bolao" | "oraculo";

// Mock data for Games and Rankings
const MOCK_GAMES = [
  { id: 1, teamA: "BRA", teamB: "ARG", scoreA: null, scoreB: null, date: "2026-06-11T16:00:00Z", status: "PENDING" },
  { id: 2, teamA: "FRA", teamB: "ENG", scoreA: 2, scoreB: 1, date: "2026-06-12T14:00:00Z", status: "FINISHED" },
  { id: 3, teamA: "GER", teamB: "ESP", scoreA: 1, scoreB: 1, date: "2026-06-13T19:00:00Z", status: "FINISHED" },
];

const MOCK_ORACLE_QUESTIONS = [
  { id: 1, question: "Quem será o campeão?", answer: null, options: ["Brasil", "França", "Argentina", "Inglaterra"], points: 50 },
  { id: 2, question: "Artilheiro da Copa", answer: "Mbappé", options: ["Mbappé", "Messi", "Kane", "Vini Jr"], points: 30 },
];

export default function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("bolao");

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
    if (groupId) loadGroup();
  }, [groupId]);

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

  // Mock score logic for ranking
  const rankedMembers = [...group.members].map((m, index) => ({
    ...m,
    points: Math.floor(Math.random() * 200) + (100 - index * 10), // fake points
  })).sort((a, b) => b.points - a.points);

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
        
        <div className="auth-card p-6 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Trophy className="w-32 h-32 text-[#ffd700]" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="copa-badge text-[10px]">Copa 2026</span>
                <span className="text-xs text-white/40 uppercase tracking-widest">{group.inviteCode}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
                {group.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-[#ffd700]" />
                  Criado por {group.owner.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {group.members.length} Participantes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1.5 bg-black/20 rounded-xl backdrop-blur-md border border-white/5 max-w-sm mx-auto md:mx-0 relative">
        <button
          onClick={() => setActiveTab("bolao")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all relative z-10 ${
            activeTab === "bolao" ? "text-[#0d2b1a]" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Target className="w-4 h-4" />
          Bolão (Jogos)
        </button>
        <button
          onClick={() => setActiveTab("oraculo")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all relative z-10 ${
            activeTab === "oraculo" ? "text-[#0d2b1a]" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Oráculo
        </button>
        
        {/* Animated Background Pill */}
        <div 
          className="absolute inset-y-1.5 w-[calc(50%-0.375rem)] bg-gradient-to-r from-[#ffd700] to-[#f5c800] rounded-lg shadow-lg transition-transform duration-300 ease-out"
          style={{ transform: activeTab === "bolao" ? "translateX(0)" : "translateX(100%)" }}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Panel: Games or Oracle */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {activeTab === "bolao" ? (
                <><CalendarDays className="w-5 h-5 text-[#ffd700]" /> Próximos Jogos</>
              ) : (
                <><Sparkles className="w-5 h-5 text-purple-400" /> Previsões do Oráculo</>
              )}
            </h2>
          </div>

          <div className="space-y-4">
            {activeTab === "bolao" ? (
              MOCK_GAMES.map((game) => (
                <div key={game.id} className="auth-card p-0 overflow-hidden border border-white/5 hover:border-[#ffd700]/30 transition-all group">
                  <div className="bg-black/20 p-3 flex justify-between items-center text-xs text-white/50 border-b border-white/5">
                    <span>Fase de Grupos • {new Date(game.date).toLocaleDateString("pt-BR")}</span>
                    {game.status === "FINISHED" ? (
                      <span className="text-emerald-400 font-medium">Encerrado</span>
                    ) : (
                      <span className="text-amber-400 font-medium animate-pulse">Aberto para palpites</span>
                    )}
                  </div>
                  <div className="p-6 flex items-center justify-between gap-4">
                    {/* Team A */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-12 h-12 rounded-full bg-white/10 mb-2 flex items-center justify-center font-bold text-lg border border-white/20">
                        {game.teamA}
                      </div>
                      <span className="font-semibold text-white/80">{game.teamA}</span>
                    </div>

                    {/* Score / Inputs */}
                    <div className="flex items-center gap-4">
                      {game.status === "FINISHED" ? (
                        <>
                          <span className="text-3xl font-black text-white">{game.scoreA}</span>
                          <span className="text-white/30">x</span>
                          <span className="text-3xl font-black text-white">{game.scoreB}</span>
                        </>
                      ) : (
                        <>
                          <input type="number" placeholder="0" className="w-16 h-16 text-center text-2xl font-bold rounded-xl bg-black/30 border border-white/10 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] text-white" />
                          <span className="text-white/30">x</span>
                          <input type="number" placeholder="0" className="w-16 h-16 text-center text-2xl font-bold rounded-xl bg-black/30 border border-white/10 focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] text-white" />
                        </>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-12 h-12 rounded-full bg-white/10 mb-2 flex items-center justify-center font-bold text-lg border border-white/20">
                        {game.teamB}
                      </div>
                      <span className="font-semibold text-white/80">{game.teamB}</span>
                    </div>
                  </div>
                  {game.status !== "FINISHED" && (
                    <div className="p-3 bg-black/20 border-t border-white/5 flex justify-end">
                      <button className="copa-btn-primary px-6 py-2 text-sm shadow-md">Salvar Palpite</button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              MOCK_ORACLE_QUESTIONS.map((q) => (
                <div key={q.id} className="auth-card p-6 border border-white/5 hover:border-purple-500/30 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-white">{q.question}</h3>
                    <span className="copa-badge bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                      Valendo {q.points} pts
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {q.options.map((opt) => (
                      <button 
                        key={opt}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          q.answer === opt 
                            ? "bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20" 
                            : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Ranking */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Medal className="w-5 h-5 text-[#ffd700]" /> Ranking
          </h2>
          
          <div className="auth-card p-2 border border-white/10">
            {rankedMembers.map((member, index) => (
              <div 
                key={member.id} 
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                  index === 0 ? "bg-gradient-to-r from-[#ffd700]/20 to-transparent" : "hover:bg-white/5"
                }`}
              >
                <div className={`w-8 text-center font-bold ${
                  index === 0 ? "text-[#ffd700] text-xl" : 
                  index === 1 ? "text-gray-300 text-lg" : 
                  index === 2 ? "text-amber-600 text-lg" : "text-white/40"
                }`}>
                  {index + 1}º
                </div>
                
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">
                    {member.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate flex items-center gap-2">
                    {member.user.name}
                    {index === 0 && <Crown className="w-3.5 h-3.5 text-[#ffd700]" />}
                  </p>
                </div>
                
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-[#ffd700]">{member.points}</p>
                  <p className="text-[10px] text-white/40 uppercase">pontos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
