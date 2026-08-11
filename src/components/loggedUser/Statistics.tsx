import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Pencil, Plus, Receipt, SearchX, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { v4 as uuidv4 } from "uuid";
import "../../index.css";
import { logout } from "../../redux/slices/UserSlice";
import { RootState } from "../../redux/store";
import PremiumFallback from "./PremiumFallback";
import UserBets from "./UserBets";
import BetBuilderModal from "./statistics/BetBuilderModal";
import EditBalanceModal from "./statistics/EditBalanceModal";
import {
  dailyOutcomeSeries,
  daysInMonth,
  getBets,
  getDailyStats,
} from "./statistics/calculations";
import {
  barOptions,
  buildDailyBar,
  buildDoughnut,
  buildMonthlyBars,
  doughnutOptions,
  monthlyBarOptions,
} from "./statistics/charts";
import { EmptyState, MiniStat, PeriodSelect, StatCard } from "./statistics/components";
import { CurrentBet, Month, UserStats } from "./statistics/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
);

const EMPTY_BET: CurrentBet = {
  match: null,
  tip: null,
  stake: null,
  odds: null,
  status: "active",
};

export default function Statistics(): React.ReactNode {
  const currentUser = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const nav = useNavigate();

  const [JWT] = useState(() => localStorage.getItem("insajder_token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [userStats, setUserStats] = useState<UserStats>();
  const [bankCapital, setBankCapital] = useState<number | null>(null);

  const [currentBet, setCurrentBet] = useState<CurrentBet | null>(EMPTY_BET);
  const [betBuilder, setBetBuilder] = useState({ status: "", visible: false, mode: "single" });
  const [parlay, setParlay] = useState<CurrentBet[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newBalance, setNewBalance] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [areTodayBetsVisible, setAreTodayBetsVisible] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth();
  const today = now.getDate();
  const [lineMode, setLineMode] = useState({ month: currentMonth, day: 0 });

  const stats = userStats?.statistics;
  const defaultCurrency = userStats?.defaultCurrency;
  const currentMonthStats = stats?.monthlyStats?.[lineMode.month];
  const totalDays = daysInMonth(now.getFullYear(), lineMode.month);

  // ---- Load statistics ----------------------------------------------------
  useEffect(() => {
    document.title = "InsajderTips | Statistike";
    const token = localStorage.getItem("insajder_token");

    if (!token) {
      dispatch(logout());
      nav("/");
      return;
    }
    if (!currentUser?.username) return;

    setLoading(true);
    fetch("/statistics/" + currentUser.username, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) throw new Error("AUTH_EXPIRED");
        if (!res.ok) throw new Error("SERVER_ERROR");
        return res.json();
      })
      .then((json) => {
        setUserStats(json);
        setError(null);
      })
      .catch((err) => {
        if (err.message === "AUTH_EXPIRED") {
          dispatch(logout());
          nav("/");
        } else {
          setError({ message: "Greška pri učitavanju." });
        }
      })
      .finally(() => setLoading(false));
  }, [currentUser?.username, dispatch, nav]);

  // ---- Derived data (memoized) -------------------------------------------
  const dailyStats = useMemo(
    () => getDailyStats(stats, lineMode.month, lineMode.day),
    [stats, lineMode.month, lineMode.day]
  );
  const outcomes = useMemo(
    () => dailyOutcomeSeries(stats, lineMode.month, totalDays),
    [stats, lineMode.month, totalDays]
  );
  const allBets = useMemo(() => getBets(stats, null, null, true), [stats]);
  const periodBets = useMemo(
    () => getBets(stats, lineMode.month, lineMode.day, false),
    [stats, lineMode.month, lineMode.day]
  );

  const labels = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => `${i + 1}. ${Month[lineMode.month]}`),
    [totalDays, lineMode.month]
  );
  const chartData = buildMonthlyBars(labels, outcomes);
  const doughMonthly = buildDoughnut(currentMonthStats?.totalWins, currentMonthStats?.totalLosses);

  // ---- Bet builder helpers ------------------------------------------------
  const addToParlay = useCallback(() => {
    if (!currentBet?.tip || !currentBet?.odds || !currentBet?.match) {
      console.error("Invalid bet data. Cannot add to parlay.");
      return;
    }
    setParlay((prev) => [
      ...prev,
      { ...EMPTY_BET, tip: currentBet.tip, odds: currentBet.odds, match: currentBet.match },
    ]);
  }, [currentBet]);

  const removeParlayItem = useCallback(
    (index: number) => setParlay((prev) => prev.filter((_, i) => i !== index)),
    []
  );

  const closeBetBuilder = useCallback(() => {
    setCurrentBet(null);
    setBetBuilder((prev) => ({ ...prev, visible: false }));
    setParlay([]);
  }, []);

  const saveCurrentBet = async () => {
    if (!currentBet || Object.values(currentBet).some((v) => v == null || v === "")) {
      setBetBuilder((prev) => ({ ...prev, status: "Došlo je do greške. Molimo popunite svako polje." }));
      return;
    }

    const stake = Number(currentBet.stake);
    const isParlay = parlay.length > 0;
    const odds = isParlay
      ? parlay.reduce((acc, g) => acc * Number(g.odds), 1)
      : Number(currentBet.odds);

    if (odds >= 10000) {
      setBetBuilder((prev) => ({ ...prev, status: "Došlo je do greške." }));
      return;
    }

    setBetBuilder((prev) => ({ ...prev, status: "Azuriranje..." }));

    const betToSave = isParlay
      ? {
          type: "parlay" as const,
          games: parlay.map((g) => ({ match: g.match, tip: g.tip, odds: g.odds, status: g.status })),
          stake,
          odds,
          status: currentBet.status,
          date: new Date().toLocaleDateString("en-us"),
          betId: uuidv4(),
        }
      : {
          type: "single" as const,
          match: currentBet.match,
          tip: currentBet.tip,
          stake,
          odds,
          status: currentBet.status,
          date: new Date().toLocaleDateString("en-us"),
          betId: uuidv4(),
        };

    // Investment & profit deltas
    let investmentChange = 0;
    let monthlyProfitChange = 0;
    if (currentBet.status === "active" || currentBet.status === "loss") {
      investmentChange = -stake;
      monthlyProfitChange = currentBet.status === "loss" ? -stake : 0;
    } else if (currentBet.status === "win") {
      investmentChange = stake * (odds - 1);
      monthlyProfitChange = stake * (odds - 1);
    }

    // Build the next state immutably, then derive the server payload from it.
    const next = structuredClone(userStats) as UserStats;
    const month = next.statistics.monthlyStats[currentMonth];
    month.bets[today] = [...(month.bets[today] || []), betToSave];
    next.statistics.totalBets += 1;
    next.statistics.initialInvestment += investmentChange;
    month.totalBets += 1;
    month.monthlyProfit += monthlyProfitChange;
    if (currentBet.status === "win") month.totalWins += 1;
    else if (currentBet.status === "loss") month.totalLosses += 1;

    setUserStats(next);

    const path = `statistics.monthlyStats.${currentMonth}`;
    try {
      const res = await fetch("/updateStatistics", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + JWT },
        body: JSON.stringify({
          updates: [
            { updatePath: "statistics.totalBets", newValue: next.statistics.totalBets, increment: false },
            { updatePath: "statistics.initialInvestment", newValue: next.statistics.initialInvestment, increment: false },
            { updatePath: `${path}.monthlyProfit`, newValue: month.monthlyProfit, increment: false },
            { updatePath: `${path}.totalBets`, newValue: month.totalBets, increment: false },
            { updatePath: `${path}.totalWins`, newValue: month.totalWins, increment: false },
            { updatePath: `${path}.totalLosses`, newValue: month.totalLosses, increment: false },
            { updatePath: `${path}.bets.${today}`, newValue: betToSave, increment: false, push: true },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setBetBuilder((prev) => ({ ...prev, status: "Vaša opklada je uspešno sačuvana!", visible: false }));
      setParlay([]);
    } catch (err) {
      console.error(err);
      setError({ message: "Došlo je do greške." });
    }
  };

  // ---- Capital handlers ---------------------------------------------------
  const updateCapital = (val: number) => {
    if (val >= 20000000) return;
    setBankCapital(val);
  };

  const updateInitialCapital = () => {
    if (!bankCapital) return;
    fetch("/updateCapital", {
      method: "PUT",
      headers: { Authorization: "Bearer " + JWT, "Content-Type": "application/json" },
      body: JSON.stringify({ initialInvestment: bankCapital }),
    }).then((res) => {
      if (!res.ok) {
        setError({ message: "Doslo je do greske sa serverom." });
        return;
      }
      setError({
        message: `Vas pocetni kapital od ${bankCapital} ${defaultCurrency?.toUpperCase()} je uspesno sacuvan.`,
      });
      setUserStats((prev) =>
        prev ? { ...prev, statistics: { ...prev.statistics, initialInvestment: bankCapital } } : prev
      );
    });
  };

  const handleUpdateBalance = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch("updateBalance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${JWT}` },
        body: JSON.stringify({ balance: Number(newBalance) }),
      });
      if (res.ok) {
        setUserStats((prev) =>
          prev ? { ...prev, statistics: { ...prev.statistics, initialInvestment: Number(newBalance) } } : prev
        );
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error("Greška pri ažuriranju stanja:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditBalance = () => {
    setNewBalance(Math.round(stats?.initialInvestment || 0));
    setIsEditModalOpen(true);
  };

  // ---- Render -------------------------------------------------------------
  if (currentUser.tier === "free") return <PremiumFallback />;

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-center">
        <span className="text-xl">Ucitavanje...</span>
      </div>
    );
  }

  const investment = stats?.initialInvestment;
  const hasCapital = investment !== undefined && investment !== null;
  const positive = (investment ?? 0) > 0;
  const monthHasBets = !!currentMonthStats && currentMonthStats.totalBets > 0;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="ml-auto flex h-full w-full md:mx-auto">
        <div className="my-2 flex w-full flex-col">
          {!userStats ? (
            <div className="flex h-96 w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />
            </div>
          ) : !hasCapital ? (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 animate-in fade-in duration-500">
              <div className="max-w-lg rounded-[2rem] border border-white/5 bg-slate-900/60 p-8 text-center shadow-2xl backdrop-blur-xl">
                <h2 className="mb-2 text-xl font-black uppercase italic tracking-tighter text-white">
                  Početni kapital nije postavljen
                </h2>
                <p className="mb-6 text-xs font-bold uppercase leading-relaxed tracking-widest text-slate-400">
                  Unesite iznos da biste aktivirali praćenje profita i statistike.
                </p>
                <div className="w-full space-y-3">
                  <input
                    type="number"
                    onChange={(e) => updateCapital(Number(e.target.value))}
                    placeholder={`Unesite kapital (${defaultCurrency?.toUpperCase()})`}
                    className="w-full rounded-xl border border-white/5 bg-slate-950/50 p-4 text-center font-mono text-lg text-white transition-all placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {bankCapital && bankCapital > 0 && (
                    <button
                      onClick={updateInitialCapital}
                      className="w-full rounded-xl bg-white py-4 text-xs font-black uppercase text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:bg-cyan-400"
                    >
                      Sačuvaj kapital
                    </button>
                  )}
                  {error && (
                    <div
                      className={`mt-4 rounded-lg p-3 text-[10px] font-black uppercase tracking-widest ${
                        error.message.startsWith("Vas")
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border border-rose-500/20 bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {error.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => !betBuilder.visible && setBetBuilder((prev) => ({ ...prev, visible: true }))}
                className="group fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-sky-400 bg-sky-600 text-white shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all duration-300 hover:scale-110 hover:bg-sky-500 active:scale-95 sm:h-auto sm:w-auto sm:rounded-xl sm:px-5 sm:py-2.5 sm:font-bold sm:uppercase sm:tracking-wider md:bottom-8 md:right-8"
              >
                <Plus className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90 sm:h-5 sm:w-5 sm:group-hover:rotate-0" />
                <span className="ml-2 hidden text-[11px] sm:inline">Dodaj Opkladu</span>
              </button>

              {/* Summary cards */}
              <div className="grid grid-cols-1 gap-3 p-2 md:grid-cols-2 lg:gap-4">
                <StatCard
                  icon={
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
                      <Receipt className="h-5 w-5" />
                    </div>
                  }
                  label="Ukupno opklada"
                  value={stats?.totalBets || 0}
                />
                <StatCard
                  icon={
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                        positive
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border-red-500/20 bg-red-500/10 text-red-400"
                      }`}
                    >
                      <Wallet className="h-5 w-5" />
                    </div>
                  }
                  label="Ukupno Stanje"
                  labelAction={
                    <button
                      onClick={openEditBalance}
                      title="Izmeni stanje"
                      className="flex items-center justify-center rounded-md border border-white/5 bg-slate-800/50 p-1 text-cyan-500 transition-colors hover:bg-cyan-500/10 hover:text-cyan-400"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                  }
                  value={Math.round(investment || 0)}
                  valueClassName={positive ? "text-emerald-400" : "text-red-400"}
                  suffix={<span className="ml-1 font-sans text-xs font-medium text-slate-500">{defaultCurrency}</span>}
                  trailing={
                    <div
                      className={`flex h-6 items-center rounded-lg px-2 text-[10px] font-black uppercase tracking-tighter ${
                        positive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {positive ? "↑" : "↓"}
                    </div>
                  }
                />
              </div>

              <div className="mx-auto flex w-full flex-col gap-2 p-1 pb-20 md:p-4 md:pb-20">
                <div className="flex h-fit min-w-full flex-col gap-6 p-2 lg:flex-row">
                  {/* Main stats area */}
                  <div className="flex w-full flex-col space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-800/60 pb-6">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                          Mesečni <span className="text-sky-400">pregled</span>
                        </h2>
                        <p className="text-sm text-slate-500">Detaljna analiza vaših rezultata</p>
                      </div>
                      <div className="flex w-full gap-3 sm:w-auto">
                        <PeriodSelect
                          value={lineMode.month}
                          onChange={(month) => setLineMode((prev) => ({ ...prev, month }))}
                          className="sm:w-40"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i} className="bg-slate-900">
                              {Month[i]}
                            </option>
                          ))}
                        </PeriodSelect>
                        <PeriodSelect
                          value={lineMode.day}
                          onChange={(day) => setLineMode((prev) => ({ ...prev, day }))}
                          className="sm:w-48"
                        >
                          <option value={0} className="bg-slate-900 text-slate-300">
                            Ceo mesec
                          </option>
                          {Array.from({ length: totalDays }, (_, i) => (
                            <option key={i + 1} value={i + 1} className="bg-slate-900 text-slate-300">
                              {i + 1}. {Month[lineMode.month]}
                            </option>
                          ))}
                        </PeriodSelect>
                      </div>
                    </div>

                    <div className="min-h-[400px] w-full">
                      {!monthHasBets ? (
                        <EmptyState
                          icon={<SearchX className="h-12 w-12" />}
                          title="Nema pronađenih opklada"
                          subtitle="Izgleda da niste uneli nikakve podatke za ovaj period."
                        />
                      ) : lineMode.day === 0 ? (
                        <div className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-950/30 p-4 md:h-[550px]">
                          <div className="pointer-events-none absolute -left-10 top-0 h-48 w-48 rounded-full bg-sky-500/10 blur-[80px]" />
                          <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-[80px]" />
                          <div className="relative h-full w-full">
                            <Bar data={chartData} options={monthlyBarOptions} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-8">
                          <div className="grid grid-cols-1 gap-8 xl:grid-cols-5">
                            <div className="h-[380px] rounded-2xl border border-slate-800/50 bg-slate-950/20 p-4 xl:col-span-2">
                              <Bar
                                data={buildDailyBar(
                                  dailyStats.totalWins,
                                  dailyStats.totalActives,
                                  dailyStats.totalLosses
                                )}
                                options={barOptions}
                              />
                            </div>
                            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/20 xl:col-span-3">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="border-b border-slate-800 bg-slate-800/30">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Statistika</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Vrednost</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                  <tr className="transition-colors hover:bg-slate-800/40">
                                    <td className="px-6 py-4 font-medium text-slate-300">Ukupno opklada</td>
                                    <td className="px-6 py-4 font-mono text-white">
                                      {stats?.monthlyStats?.[lineMode.month]?.bets?.[lineMode.day]?.length || 0}
                                    </td>
                                  </tr>
                                  <tr className="transition-colors hover:bg-slate-800/40">
                                    <td className="px-6 py-4 font-medium text-slate-300">Dobitnih opklada</td>
                                    <td className="px-6 py-4 font-bold text-emerald-400">{dailyStats.totalWins}</td>
                                  </tr>
                                  <tr className="transition-colors hover:bg-slate-800/40">
                                    <td className="px-6 py-4 font-medium text-slate-300">Ostvaren profit</td>
                                    <td className={`px-6 py-4 font-mono font-bold ${dailyStats.profit <= 0 ? "text-red-400" : "text-emerald-400"}`}>
                                      {Number(dailyStats.profit || 0).toFixed(2)} {defaultCurrency}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Accordion: today's bets */}
                          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/20">
                            <button
                              onClick={() => setAreTodayBetsVisible((v) => !v)}
                              className="flex w-full items-center justify-between p-5 font-bold text-white transition-all hover:bg-slate-800/50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
                                <span>Opklade ovog dana</span>
                              </div>
                              <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className={`h-6 w-6 text-slate-500 transition-transform duration-500 ${areTodayBetsVisible ? "rotate-180" : ""}`}
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                            <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${areTodayBetsVisible ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                              <div className="overflow-hidden">
                                <div className="max-h-[500px] overflow-y-auto border-t border-slate-800/50 bg-slate-900/40 p-4">
                                  <UserBets bets={periodBets} userStats={stats} setUserStats={setUserStats} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar summary */}
                  <div className="group relative min-w-[320px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl transition-all duration-500 hover:border-sky-500/40">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/5 blur-[80px]" />
                    <div className="relative z-10 flex flex-col space-y-8">
                      <div className="border-b border-slate-800/60 pb-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Statistika Meseca</h3>
                        <p className={`mt-2 text-4xl font-black tracking-tighter ${(currentMonthStats?.monthlyProfit ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {(currentMonthStats?.monthlyProfit ?? 0) >= 0 ? "+" : ""}
                          {currentMonthStats?.monthlyProfit?.toFixed(2) || "0.00"}
                          <span className="ml-2 font-sans text-lg font-medium opacity-60">{defaultCurrency}</span>
                        </p>
                      </div>

                      <div className="relative mx-auto flex aspect-square w-full max-w-[260px] items-center justify-center">
                        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-white">
                            {currentMonthStats?.totalBets
                              ? Math.round((currentMonthStats.totalWins / currentMonthStats.totalBets) * 100)
                              : 0}
                            %
                          </span>
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Prolaz</span>
                        </div>
                        <div className="h-full w-full drop-shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                          <Doughnut data={doughMonthly} options={doughnutOptions} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <MiniStat value={currentMonthStats?.totalBets || 0} label="Ukupno" />
                        <MiniStat
                          value={(currentMonthStats?.totalBets ?? 0) - (currentMonthStats?.totalWins ?? 0) - (currentMonthStats?.totalLosses ?? 0) || 0}
                          label="Aktivnih"
                          valueClassName="text-sky-400"
                        />
                        <MiniStat
                          value={currentMonthStats?.totalWins || 0}
                          label="Dobitnih"
                          valueClassName="text-emerald-400"
                          labelClassName="text-emerald-600"
                          className="border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/10"
                        />
                        <MiniStat
                          value={currentMonthStats?.totalLosses || 0}
                          label="Gubitnih"
                          valueClassName="text-red-400"
                          labelClassName="text-red-600"
                          className="border-red-500/10 bg-red-500/5 hover:bg-red-500/10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent bets */}
                <div className="flex w-full flex-col overflow-hidden rounded-[1.5rem] border border-white/[0.05] bg-slate-950/20 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/[0.05] bg-slate-900/40 px-5 py-3 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Poslednje Opklade</h3>
                    </div>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                      {allBets.length}
                    </span>
                  </div>
                  <div className="scrollbar-hide max-h-[65vh] overflow-y-auto p-3 sm:p-4">
                    <UserBets bets={allBets} userStats={stats} setUserStats={setUserStats} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {betBuilder.visible && (
        <BetBuilderModal
          currency={currentUser.defaultCurrency}
          mode={betBuilder.mode}
          setMode={(mode) => setBetBuilder((prev) => ({ ...prev, mode }))}
          currentBet={currentBet}
          setCurrentBet={setCurrentBet}
          parlay={parlay}
          status={betBuilder.status}
          addToParlay={addToParlay}
          removeParlayItem={removeParlayItem}
          onSave={saveCurrentBet}
          onClose={closeBetBuilder}
        />
      )}

      {isEditModalOpen && (
        <EditBalanceModal
          defaultCurrency={defaultCurrency}
          value={newBalance}
          onChange={setNewBalance}
          onSave={handleUpdateBalance}
          onClose={() => setIsEditModalOpen(false)}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
}
