"use client";

import { useEffect, useState } from "react";
import { Trophy, Calendar, Users, Activity, Star } from "lucide-react";

export default function DashboardPage() {
  const [userName, setUserName] = useState("Jogador");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("copa_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.name) setUserName(user.name.split(" ")[0]);
        } catch (e) {}
      }
      setLoading(false);
    }
  }, []);

  const stats = [
    { title: "Meus Palpites", value: "0", icon: Trophy, color: "text-[#ffd700]", bg: "bg-[#ffd700]/10" },
    { title: "Pontuação", value: "0", icon: Star, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { title: "Jogos Hoje", value: "0", icon: Calendar, color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Posição Global", value: "-", icon: Activity, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  if (loading) {
    return <div className="animate-pulse flex space-x-4">Carregando...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Olá, <span className="text-[#ffd700]">{userName}</span>! 👋
          </h1>
          <p className="text-white/60 mt-1">
            Bem-vindo ao seu painel de controle da Copa 2026.
          </p>
        </div>
        <button className="copa-btn-primary px-6 py-3 text-sm inline-flex items-center gap-2 max-w-fit shadow-lg shadow-[#ffd700]/20">
          <Trophy className="w-4 h-4" />
          Fazer novo palpite
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx}
              className="auth-card p-6 border border-white/10 hover:border-white/20 transition-all flex items-start justify-between"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div>
                <p className="text-sm font-medium text-white/50 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos Jogos */}
        <div className="lg:col-span-2 auth-card p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#ffd700]" />
              Próximos Jogos
            </h2>
            <button className="text-sm copa-link">Ver todos</button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum jogo em breve</h3>
            <p className="text-white/50 max-w-sm">
              Os próximos jogos do mundial ainda não estão disponíveis para palpites.
            </p>
          </div>
        </div>

        {/* Ranking Resumo */}
        <div className="auth-card p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#ffd700]" />
              Top Ranking
            </h2>
            <button className="text-sm copa-link">Completo</button>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((pos) => (
              <div key={pos} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${pos === 1 ? 'bg-[#ffd700] text-[#0d2b1a]' : 'bg-white/10 text-white'}`}>
                  {pos}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Jogador Oculto</p>
                  <p className="text-xs text-white/50">0 pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
