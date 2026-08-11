import type {
  BetStatus,
  DailyStats,
  StoredBet,
  UserStatistics,
} from "./types";

/** Profit/loss a single settled bet contributes. Active bets contribute 0. */
export function betProfit(bet: StoredBet | undefined): number {
  if (!bet) return 0;
  const stake = Number(bet.stake || 0);
  const odds = Number(bet.odds || 1);
  const status = bet.status?.toLowerCase();

  if (status === "win" || status === "won") return stake * odds - stake;
  if (status === "loss" || status === "lost") return -stake;
  return 0;
}

function normalizeStatus(status?: string): BetStatus {
  const s = status?.toLowerCase();
  if (s === "win" || s === "won") return "win";
  if (s === "loss" || s === "lost") return "loss";
  return "active";
}

export const daysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

/**
 * Number of bets per calendar day, aligned to days 1..totalDays.
 * Day-of-month buckets are 1-indexed (bets[1] = the 1st), so index 0 is skipped
 * and the result lines up exactly with the chart's day labels.
 */
export function betsPerDay(
  stats: UserStatistics | undefined,
  month: number,
  totalDays: number
): number[] {
  const days = stats?.monthlyStats?.[month]?.bets ?? [];
  return Array.from({ length: totalDays }, (_, i) => {
    const day = days[i + 1];
    return Array.isArray(day) ? day.length : 0;
  });
}

/** Aggregate stats for a single selected day. */
export function getDailyStats(
  stats: UserStatistics | undefined,
  month: number,
  day: number
): DailyStats {
  const empty: DailyStats = {
    totalWins: 0,
    totalLosses: 0,
    totalActives: 0,
    winPercentage: "0.00",
    profit: 0,
  };

  const bets = stats?.monthlyStats?.[month]?.bets?.[day];
  if (!Array.isArray(bets)) return empty;

  let totalWins = 0;
  let totalLosses = 0;
  let totalActives = 0;
  let profit = 0;

  for (const bet of bets) {
    const status = normalizeStatus(bet?.status);
    if (status === "win") totalWins += 1;
    else if (status === "loss") totalLosses += 1;
    else totalActives += 1;
    profit += betProfit(bet);
  }

  const settled = totalWins + totalLosses;
  return {
    totalWins,
    totalLosses,
    totalActives,
    winPercentage: settled > 0 ? ((totalWins / settled) * 100).toFixed(2) : "0.00",
    profit: Number(profit.toFixed(2)),
  };
}

export interface DailyOutcomes {
  wins: number[];
  losses: number[];
  actives: number[];
}

/**
 * Per-day win / loss / active counts, aligned to days 1..totalDays.
 * Drives the monthly stacked-bar chart.
 */
export function dailyOutcomeSeries(
  stats: UserStatistics | undefined,
  month: number,
  totalDays: number
): DailyOutcomes {
  const days = stats?.monthlyStats?.[month]?.bets ?? [];
  const wins: number[] = [];
  const losses: number[] = [];
  const actives: number[] = [];

  for (let i = 0; i < totalDays; i++) {
    const day = days[i + 1];
    let w = 0;
    let l = 0;
    let a = 0;
    if (Array.isArray(day)) {
      for (const bet of day) {
        const status = normalizeStatus(Array.isArray(bet) ? bet[0]?.status : bet?.status);
        if (status === "win") w += 1;
        else if (status === "loss") l += 1;
        else a += 1;
      }
    }
    wins.push(w);
    losses.push(l);
    actives.push(a);
  }

  return { wins, losses, actives };
}

/**
 * Daily win-rate (%) series, aligned to days 1..totalDays (see betsPerDay).
 * Days with no settled bets return 0 so the series stays length-consistent.
 */
export function winRateSeries(
  stats: UserStatistics | undefined,
  month: number,
  totalDays: number
): number[] {
  const days = stats?.monthlyStats?.[month]?.bets ?? [];

  return Array.from({ length: totalDays }, (_, i) => {
    const day = days[i + 1];
    if (!Array.isArray(day)) return 0;
    let wins = 0;
    let losses = 0;
    for (const bet of day) {
      const status = normalizeStatus(Array.isArray(bet) ? bet[0]?.status : bet?.status);
      if (status === "win") wins += 1;
      else if (status === "loss") losses += 1;
    }
    const settled = wins + losses;
    return settled > 0 ? Math.round((wins / settled) * 100) : 0;
  });
}

/**
 * Flatten the bets relevant to the requested period.
 * - `all`: every bet across every month.
 * - month + specific day: that day's bets.
 * - month only (day 0/null): every bet in the month.
 */
export function getBets(
  stats: UserStatistics | undefined,
  month: number | string | null,
  day: number | string | null,
  all: boolean
): StoredBet[] {
  const monthlyStats = stats?.monthlyStats;
  if (!monthlyStats) return [];

  if (all) {
    return monthlyStats.reduce<StoredBet[]>((acc, m) => {
      if (Array.isArray(m?.bets)) acc.push(...m.bets.flat().filter(Boolean));
      return acc;
    }, []);
  }

  const monthIdx = typeof month === "string" ? parseInt(month, 10) : month;
  if (monthIdx == null) return [];
  const monthData = monthlyStats[monthIdx];
  if (!monthData?.bets) return [];

  if (day != null && day !== 0) {
    const dayIdx = typeof day === "string" ? parseInt(day, 10) : day;
    const dayBets = monthData.bets[dayIdx];
    return Array.isArray(dayBets) ? dayBets : [];
  }

  return monthData.bets.flatMap((d) => d || []);
}
