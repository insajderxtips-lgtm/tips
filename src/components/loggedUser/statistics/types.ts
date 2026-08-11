export enum Month {
  Januar = 0,
  Februar = 1,
  Mart = 2,
  April = 3,
  Maj = 4,
  Jun = 5,
  Jul = 6,
  Avgust = 7,
  Septembar = 8,
  Oktobar = 9,
  Novembar = 10,
  Decembar = 11,
}

export type BetStatus = "active" | "win" | "loss";

/** A single game inside a parlay ticket. */
export interface ParlayGame {
  match: string;
  tip: string;
  odds: number;
  status: string;
}

/** A bet as stored on the server (single or parlay). */
export interface StoredBet {
  type?: "single" | "parlay";
  match?: string;
  tip?: string;
  stake?: number;
  odds?: number;
  status?: string;
  date?: string;
  betId?: string;
  games?: ParlayGame[];
}

/** The bet currently being composed in the BetBuilder. */
export interface CurrentBet {
  match: string | null;
  tip: string | null;
  stake: number | null;
  odds: number | null;
  status: string;
}

export interface MonthlyStat {
  month: string;
  monthlyProfit: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  avgBetAmount: number;
  /** Indexed by day-of-month; each entry is the list of bets placed that day. */
  bets: StoredBet[][];
}

export interface UserStatistics {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalProfit: number;
  initialInvestment: number;
  monthlyStats: MonthlyStat[];
  avgBetAmount: number;
  averageReturnOnInvestment: number;
}

export interface UserStats {
  _id: string;
  email: string;
  username: string;
  tier: string;
  defaultCurrency: string;
  updatedAt: string;
  statistics: UserStatistics;
}

export interface DailyStats {
  totalWins: number;
  totalLosses: number;
  totalActives: number;
  winPercentage: string;
  profit: number;
}

export interface LineMode {
  /** Selected month index (0–11). */
  month: number;
  /** Selected day-of-month, or 0 for the whole month. */
  day: number;
}
