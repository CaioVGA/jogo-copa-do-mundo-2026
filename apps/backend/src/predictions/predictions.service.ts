import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../prisma/redis.service';
import { SavePredictionsDto } from './dto/save-predictions.dto';
import { isMatchLockedByKickoff } from '../common/utils/match-time';

@Injectable()
export class PredictionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private normalizeKnockoutKey(homeName: string | null, awayName: string | null): string {
    const normalize = (value: string | null) =>
      (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    return `${normalize(homeName)}|${normalize(awayName)}`;
  }

  private buildOfficialMatchNumberMap(matches: any[]): Map<string, number> {
    const byDateThenId = (a: any, b: any) => {
      const timeDiff = a.date.getTime() - b.date.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    };

    const byStage = (stage: string) =>
      matches.filter((m) => m.stage === stage).sort(byDateThenId);

    const officialById = new Map<string, number>();

    const groupMatches = matches
      .filter((m) => m.stage && m.stage.startsWith('Fase de Grupos'))
      .sort(byDateThenId);
    groupMatches.forEach((m, index) => officialById.set(m.id, index + 1));

    const roundOf32 = byStage('Dezesseisavos de Final');
    roundOf32.forEach((m, index) => officialById.set(m.id, 73 + index));

    const roundOf16Expected = new Map<string, number>([
      [this.normalizeKnockoutKey('Vencedor do jogo 73', 'Vencedor do jogo 76'), 90],
      [this.normalizeKnockoutKey('Vencedor do jogo 75', 'Vencedor do jogo 78'), 89],
      [this.normalizeKnockoutKey('Vencedor do jogo 74', 'Vencedor do jogo 77'), 91],
      [this.normalizeKnockoutKey('Vencedor do jogo 79', 'Vencedor do jogo 80'), 92],
      [this.normalizeKnockoutKey('Vencedor do jogo 84', 'Vencedor do jogo 83'), 93],
      [this.normalizeKnockoutKey('Vencedor do jogo 82', 'Vencedor do jogo 81'), 94],
      [this.normalizeKnockoutKey('Vencedor do jogo 87', 'Vencedor do jogo 86'), 95],
      [this.normalizeKnockoutKey('Vencedor do jogo 85', 'Vencedor do jogo 88'), 96],
    ]);

    const quarterExpected = new Map<string, number>([
      [this.normalizeKnockoutKey('Vencedor do jogo 89', 'Vencedor do jogo 90'), 97],
      [this.normalizeKnockoutKey('Vencedor do jogo 93', 'Vencedor do jogo 94'), 98],
      [this.normalizeKnockoutKey('Vencedor do jogo 91', 'Vencedor do jogo 92'), 99],
      [this.normalizeKnockoutKey('Vencedor do jogo 95', 'Vencedor do jogo 96'), 100],
    ]);

    const semiExpected = new Map<string, number>([
      [this.normalizeKnockoutKey('Vencedor do jogo 97', 'Vencedor do jogo 98'), 101],
      [this.normalizeKnockoutKey('Vencedor do jogo 99', 'Vencedor do jogo 100'), 102],
    ]);

    const thirdExpected = new Map<string, number>([
      [this.normalizeKnockoutKey('Perdedor do jogo 101', 'Perdedor do jogo 102'), 103],
    ]);

    const finalExpected = new Map<string, number>([
      [this.normalizeKnockoutKey('Vencedor do jogo 101', 'Vencedor do jogo 102'), 104],
    ]);

    const assignByFallback = (
      stage: string,
      expected: Map<string, number>,
      fallbackBase: number,
    ) => {
      const stageMatches = byStage(stage);
      stageMatches.forEach((m, index) => {
        const key = this.normalizeKnockoutKey(m.homeTeamName, m.awayTeamName);
        const official = expected.get(key) ?? fallbackBase + index;
        officialById.set(m.id, official);
      });
    };

    assignByFallback('Oitavas de Final', roundOf16Expected, 89);
    assignByFallback('Quartas de Final', quarterExpected, 97);
    assignByFallback('Semifinais', semiExpected, 101);
    assignByFallback('Terceiro Lugar', thirdExpected, 103);
    assignByFallback('Final', finalExpected, 104);

    return officialById;
  }

  private async getLiveBracketResolver() {
    const stageOrder = {
      'Fase de Grupos - Rodada 1': 1,
      'Fase de Grupos - Rodada 2': 2,
      'Fase de Grupos - Rodada 3': 3,
      'Dezesseisavos de Final': 4,
      'Oitavas de Final': 5,
      'Quartas de Final': 6,
      'Semifinais': 7,
      'Terceiro Lugar': 8,
      'Final': 9,
    };

    const allMatches = await this.prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
    });

    allMatches.sort((a, b) => {
      const stageA = stageOrder[a.stage as keyof typeof stageOrder] || 99;
      const stageB = stageOrder[b.stage as keyof typeof stageOrder] || 99;
      if (stageA !== stageB) return stageA - stageB;
      const timeDiff = a.date.getTime() - b.date.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    });

    const officialMatchNumberById = this.buildOfficialMatchNumberMap(allMatches);
    const matchByNumber = new Map<number, any>();
    allMatches.forEach((m) => {
      const officialNumber = officialMatchNumberById.get(m.id);
      if (officialNumber) {
        matchByNumber.set(officialNumber, m);
      }
    });

    const groupMatches = allMatches.filter(m => m.stage && m.stage.startsWith('Fase de Grupos'));

    const teams = await this.prisma.team.findMany({
      where: { group: { not: null } },
    });

    const standingsMap: Record<string, Record<string, any>> = {};
    teams.forEach((t) => {
      const g = t.group!;
      if (!standingsMap[g]) standingsMap[g] = {};
      standingsMap[g][t.code] = { id: t.id, code: t.code, name: t.name, flag: t.flag, group: g, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
    });

    groupMatches.forEach((m) => {
      if (m.status !== 'FINISHED' || !m.homeTeam || !m.awayTeam) return;
      const g = m.homeTeam.group!;
      const home = standingsMap[g]?.[m.homeTeam.code];
      const away = standingsMap[g]?.[m.awayTeam.code];
      if (!home || !away) return;
      home.played += 1; away.played += 1;
      const hs = m.homeScore ?? 0; const as = m.awayScore ?? 0;
      home.gf += hs; home.ga += as; away.gf += as; away.ga += hs;
      home.gd = home.gf - home.ga; away.gd = away.gf - away.ga;
      if (hs > as) { home.won += 1; home.points += 3; away.lost += 1; }
      else if (hs < as) { away.won += 1; away.points += 3; home.lost += 1; }
      else { home.drawn += 1; home.points += 1; away.drawn += 1; away.points += 1; }
    });

    const sortedStandings: Record<string, any[]> = {};
    Object.keys(standingsMap).forEach((g) => {
      const list = Object.values(standingsMap[g]);
      list.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.name.localeCompare(b.name);
      });
      sortedStandings[g] = list;
    });

    const thirdPlacedTeams: any[] = [];
    Object.keys(sortedStandings).forEach((g) => {
      const list = sortedStandings[g];
      if (list.length >= 3) {
        thirdPlacedTeams.push(list[2]);
      }
    });

    thirdPlacedTeams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name);
    });

    const best8Thirds = thirdPlacedTeams.slice(0, 8);
    
    const thirdSlots = [
      '3º Grupo A/B/C/D/F',
      '3º Grupo C/D/F/G/H',
      '3º Grupo C/E/F/H/I',
      '3º Grupo E/H/I/J/K',
      '3º Grupo B/E/F/I/J',
      '3º Grupo A/E/H/I/J',
      '3º Grupo E/F/G/I/J',
      '3º Grupo D/E/I/J/L'
    ];
    
    const slotAssignments: Record<string, any> = {};
    const assignSlots = (slotIndex: number, currentAssignments: Record<string, any>, usedTeams: Set<string>): boolean => {
      if (slotIndex === thirdSlots.length) return true;
      const slot = thirdSlots[slotIndex];
      const allowed = slot.replace('3º Grupo ', '').split('/');
      
      for (const t of best8Thirds) {
        if (!usedTeams.has(t.code) && allowed.includes(t.group)) {
          currentAssignments[slot] = t;
          usedTeams.add(t.code);
          if (assignSlots(slotIndex + 1, currentAssignments, usedTeams)) return true;
          usedTeams.delete(t.code);
          delete currentAssignments[slot];
        }
      }
      return false;
    };

    if (!assignSlots(0, slotAssignments, new Set<string>())) {
      const usedGroups = new Set<string>();
      thirdSlots.forEach(slot => {
         const allowed = slot.replace('3º Grupo ', '').split('/');
         for (const t of best8Thirds) {
            if (allowed.includes(t.group) && !usedGroups.has(t.group)) {
               slotAssignments[slot] = t;
               usedGroups.add(t.group);
               break;
            }
         }
      });
    }

    const resolveTeam = (dbTeam: any, teamNameFallback: string | null): any => {
      if (dbTeam) return { id: dbTeam.id, name: dbTeam.name, code: dbTeam.code, flag: dbTeam.flag, group: dbTeam.group };
      if (!teamNameFallback) return { id: null, name: 'TBD', code: 'TBD', flag: null, group: null };

      const matchObj = teamNameFallback.match(/^(\d)º Grupo ([A-L])$/);
      if (matchObj) {
        const pos = parseInt(matchObj[1], 10) - 1;
        const groupLetter = matchObj[2];
        if (sortedStandings[groupLetter] && sortedStandings[groupLetter][pos]) {
          const t = sortedStandings[groupLetter][pos];
          return { id: t.id, name: t.name, code: t.code, flag: t.flag, group: t.group };
        }
      }

      if (teamNameFallback.startsWith('3º Grupo')) {
        const t = slotAssignments[teamNameFallback];
        if (t) {
          return { id: t.id, name: t.name, code: t.code, flag: t.flag, group: t.group };
        }
      }

      const knockoutMatch = teamNameFallback.match(/^(Vencedor|Perdedor) do jogo (\d+)$/);
      if (knockoutMatch) {
        const type = knockoutMatch[1];
        const matchNumber = parseInt(knockoutMatch[2], 10);
        const sourceMatch = matchByNumber.get(matchNumber);

        if (sourceMatch && sourceMatch.status === 'FINISHED') {
          const home = resolveTeam(sourceMatch.homeTeam, sourceMatch.homeTeamName);
          const away = resolveTeam(sourceMatch.awayTeam, sourceMatch.awayTeamName);

          let winner = null;
          let loser = null;

          if (sourceMatch.homeScore > sourceMatch.awayScore) {
            winner = home;
            loser = away;
          } else if (sourceMatch.awayScore > sourceMatch.homeScore) {
            winner = away;
            loser = home;
          } else if (sourceMatch.homePenalties != null && sourceMatch.awayPenalties != null) {
            if (sourceMatch.homePenalties > sourceMatch.awayPenalties) {
              winner = home;
              loser = away;
            } else {
              winner = away;
              loser = home;
            }
          }

          if (type === 'Vencedor' && winner && winner.code !== 'TBD') {
            return winner;
          } else if (type === 'Perdedor' && loser && loser.code !== 'TBD') {
            return loser;
          }
        }
      }

      return { id: null, name: teamNameFallback, code: 'TBD', flag: null, group: null };
    };
    return { resolver: resolveTeam, sortedMatches: allMatches, officialMatchNumberById };
  }

  async getMatches() {
    const { resolver, sortedMatches: matches, officialMatchNumberById } =
      await this.getLiveBracketResolver();

    const grouped: Record<string, any[]> = {};

    matches.forEach((match, index) => {
      const mappedMatch = {
        id: match.id,
        date: match.date,
        stadium: match.stadium,
        city: match.city,
        stage: match.stage,
        status: match.status,
        realHomeScore: match.homeScore,
        realAwayScore: match.awayScore,
        homePenalties: match.homePenalties,
        awayPenalties: match.awayPenalties,
        predictedHomeScore: null,
        predictedAwayScore: null,
        pointsEarned: 0,
        homeTeam: resolver(match.homeTeam, match.homeTeamName),
        awayTeam: resolver(match.awayTeam, match.awayTeamName),
        matchNumber: officialMatchNumberById.get(match.id) ?? index + 1,
        homeTeamFallback: match.homeTeamName,
        awayTeamFallback: match.awayTeamName,
      };

      let groupName = match.stage || 'Fase Final';
      if (match.stage && match.stage.startsWith('Fase de Grupos') && match.homeTeam?.group) {
        groupName = `Grupo ${match.homeTeam.group}`;
      }

      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(mappedMatch);
    });

    return grouped;
  }

  async getPredictions(userId: string, groupId: string) {
    // 0. Verify user is member of the group
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('Você não faz parte deste grupo.');
    }

    const { resolver, sortedMatches: matches, officialMatchNumberById } =
      await this.getLiveBracketResolver();

    // 2. Fetch all predictions by this user in this group
    const userPredictions = await this.prisma.matchPrediction.findMany({
      where: { userId, groupId },
    });

    // Create a map for fast lookup
    const predictionMap = new Map<string, typeof userPredictions[0]>();
    userPredictions.forEach((p) => {
      predictionMap.set(p.matchId, p);
    });

    // 3. Map matches with predictions and group them by group letter
    const grouped: Record<string, any[]> = {};

    matches.forEach((match, index) => {
      const pred = predictionMap.get(match.id);
      const mappedMatch = {
        id: match.id,
        date: match.date,
        stadium: match.stadium,
        city: match.city,
        stage: match.stage,
        status: match.status,
        realHomeScore: match.homeScore,
        realAwayScore: match.awayScore,
        homePenalties: match.homePenalties,
        awayPenalties: match.awayPenalties,
        predictedHomeScore: pred ? pred.homeScore : null,
        predictedAwayScore: pred ? pred.awayScore : null,
        pointsEarned: pred ? pred.points : 0,
        homeTeam: resolver(match.homeTeam, match.homeTeamName),
        awayTeam: resolver(match.awayTeam, match.awayTeamName),
        matchNumber: officialMatchNumberById.get(match.id) ?? index + 1,
        homeTeamFallback: match.homeTeamName,
        awayTeamFallback: match.awayTeamName,
      };

      // Determine group name
      let groupName = match.stage || 'Fase Final';
      if (match.stage && match.stage.startsWith('Fase de Grupos') && match.homeTeam?.group) {
        groupName = `Grupo ${match.homeTeam.group}`;
      }

      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(mappedMatch);
    });

    return grouped;
  }

  async savePredictions(userId: string, dto: SavePredictionsDto) {
    const { groupId } = dto;
    const now = new Date();

    // 0. Verify user is member of the group
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('Você não faz parte deste grupo.');
    }

    for (const pred of dto.predictions) {
      // Find match and verify if it exists and is open for predictions
      const match = await this.prisma.match.findUnique({
        where: { id: pred.matchId },
      });

      if (!match) {
        throw new BadRequestException(`Partida com ID ${pred.matchId} não encontrada.`);
      }

      // Security rule: block predictions if the match has already started
      if (isMatchLockedByKickoff(match.date, now) || match.status !== 'PENDING') {
        throw new ForbiddenException(
          `Não é permitido palpitar na partida entre ${match.homeTeamName || 'Time A'} e ${
            match.awayTeamName || 'Time B'
          } pois ela já iniciou ou foi encerrada.`
        );
      }

      // Upsert prediction scoped to group
      await this.prisma.matchPrediction.upsert({
        where: {
          userId_matchId_groupId: {
            userId,
            matchId: pred.matchId,
            groupId,
          },
        },
        update: {
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
        },
        create: {
          userId,
          matchId: pred.matchId,
          groupId,
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
        },
      });
    }

    // Invalida cache do grupo específico para atualizar o ranking em tempo real
    await this.redis.del(`group:details:${groupId}`);

    return { success: true, message: 'Palpites salvos com sucesso!' };
  }

  private calculatePredictionPoints(
    realHome: number,
    realAway: number,
    predHome: number,
    predAway: number,
  ): number {
    const exactMatch = (predHome === realHome) && (predAway === realAway);
    if (exactMatch) {
      return 5;
    }

    const realWinner = realHome > realAway ? 1 : realHome < realAway ? -1 : 0;
    const predWinner = predHome > predAway ? 1 : predHome < predAway ? -1 : 0;

    if (realWinner === predWinner) {
      const matchedHomeGoals = predHome === realHome;
      const matchedAwayGoals = predAway === realAway;
      if (matchedHomeGoals || matchedAwayGoals) {
        return 4;
      } else {
        return 3;
      }
    } else {
      const matchedHomeGoals = predHome === realHome;
      const matchedAwayGoals = predAway === realAway;
      if (matchedHomeGoals || matchedAwayGoals) {
        return 1;
      } else {
        return 0;
      }
    }
  }

  async updateMatchScore(userId: string, matchId: string, homeScore: number, awayScore: number, homePenalties?: number, awayPenalties?: number) {
    // 1. Verify if user is an ADMIN
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem atualizar o placar das partidas.');
    }

    // 2. Find and update match
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new BadRequestException('Partida não encontrada.');
    }

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        homePenalties,
        awayPenalties,
        status: 'FINISHED',
      },
    });

    // 3. Score ALL predictions for this match across all groups
    const predictions = await this.prisma.matchPrediction.findMany({
      where: { matchId },
    });

      for (const pred of predictions) {
        const points = this.calculatePredictionPoints(homeScore, awayScore, pred.homeScore, pred.awayScore);
        await this.prisma.matchPrediction.update({
          where: { id: pred.id },
          data: { points },
        });
      }

      // 4. Se for mata-mata, calcular os pontos do Oráculo (quem acertou quem passou ganha +5)
      if (match.stage && !match.stage.startsWith('Fase de Grupos')) {
        const { resolver } = await this.getLiveBracketResolver();
        const fullMatch = await this.prisma.match.findUnique({
          where: { id: matchId },
          include: { homeTeam: true, awayTeam: true },
        });

        if (fullMatch) {
          const resolvedHome = resolver(fullMatch.homeTeam, fullMatch.homeTeamName);
          const resolvedAway = resolver(fullMatch.awayTeam, fullMatch.awayTeamName);

          if (resolvedHome && resolvedHome.code !== 'TBD' && resolvedAway && resolvedAway.code !== 'TBD') {
            let winnerTeamCode: string | null = null;
            
            if (homeScore > awayScore) {
              winnerTeamCode = resolvedHome.code;
            } else if (awayScore > homeScore) {
              winnerTeamCode = resolvedAway.code;
            } else if (homePenalties !== undefined && awayPenalties !== undefined) {
              if (homePenalties > awayPenalties) {
                winnerTeamCode = resolvedHome.code;
              } else if (awayPenalties > homePenalties) {
                winnerTeamCode = resolvedAway.code;
              }
            }

            if (winnerTeamCode) {
              const oraclePredictions = await this.prisma.oracleKnockoutPrediction.findMany({
                where: { matchId },
              });

              for (const oraclePred of oraclePredictions) {
                const points = oraclePred.predictedWinner === winnerTeamCode ? 5 : 0;
                await this.prisma.oracleKnockoutPrediction.update({
                  where: { id: oraclePred.id },
                  data: { points },
                });
              }
            }
          }
        }
      }

    // Invalida todos os caches de grupos globalmente porque os placares e pontuações mudaram
    await this.redis.delByPattern('group:details:*');

    return { success: true, message: 'Placar atualizado e pontos calculados com sucesso!' };
  }

  async syncMatchScore(matchId: string, homeScore: number, awayScore: number, status: string, homePenalties?: number, awayPenalties?: number) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new BadRequestException('Partida não encontrada.');
    }

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        homePenalties,
        awayPenalties,
        status,
      },
    });

    if (status === 'FINISHED') {
      const predictions = await this.prisma.matchPrediction.findMany({
        where: { matchId },
      });

        for (const pred of predictions) {
          const points = this.calculatePredictionPoints(homeScore, awayScore, pred.homeScore, pred.awayScore);
          await this.prisma.matchPrediction.update({
            where: { id: pred.id },
            data: { points },
          });
        }

        if (match.stage && !match.stage.startsWith('Fase de Grupos')) {
          const { resolver } = await this.getLiveBracketResolver();
          const fullMatch = await this.prisma.match.findUnique({
            where: { id: matchId },
            include: { homeTeam: true, awayTeam: true },
          });

          if (fullMatch) {
            const resolvedHome = resolver(fullMatch.homeTeam, fullMatch.homeTeamName);
            const resolvedAway = resolver(fullMatch.awayTeam, fullMatch.awayTeamName);

            if (resolvedHome && resolvedHome.code !== 'TBD' && resolvedAway && resolvedAway.code !== 'TBD') {
              let winnerTeamCode: string | null = null;
              
              if (homeScore > awayScore) {
                winnerTeamCode = resolvedHome.code;
              } else if (awayScore > homeScore) {
                winnerTeamCode = resolvedAway.code;
              } else if (homePenalties !== undefined && awayPenalties !== undefined) {
                if (homePenalties > awayPenalties) {
                  winnerTeamCode = resolvedHome.code;
                } else if (awayPenalties > homePenalties) {
                  winnerTeamCode = resolvedAway.code;
                }
              }

            if (winnerTeamCode) {
              const oraclePredictions = await this.prisma.oracleKnockoutPrediction.findMany({
                where: { matchId },
              });

              for (const oraclePred of oraclePredictions) {
                const points = oraclePred.predictedWinner === winnerTeamCode ? 5 : 0;
                await this.prisma.oracleKnockoutPrediction.update({
                  where: { id: oraclePred.id },
                  data: { points },
                });
              }
            }
          }
        }
      }
    }

    await this.redis.delByPattern('group:details:*');

    return { success: true, message: 'Placar sincronizado com sucesso!' };
  }
}
