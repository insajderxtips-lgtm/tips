import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Trash2, Layers } from "lucide-react";

const STATUS: Record<string, { bar: string; pill: string; label: string; dot: string }> = {
  win: { bar: "border-emerald-500", pill: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20", label: "prolaz", dot: "bg-emerald-400" },
  loss: { bar: "border-rose-500", pill: "bg-rose-500/10 text-rose-400 ring-rose-500/20", label: "gubitan", dot: "bg-rose-400" },
  active: { bar: "border-sky-500", pill: "bg-sky-500/10 text-sky-400 ring-sky-500/20", label: "aktivan", dot: "bg-sky-400" },
};
const statusOf = (s: string) => STATUS[s] || STATUS.active;

/** Formats an amount with Serbian thousands separators (e.g. 33500 → "33.500"). */
const fmtAmount = (n: number): string =>
  (Math.round(Math.abs(n) * 100) / 100).toLocaleString("sr-RS", { maximumFractionDigits: 2 });

/** A hand-drawn wavy connector (deliberately not an arrow) linking a bet's
 *  status to its profit/loss amount. */
function WigglyLine({ className = "" }: { className?: string }) {
  return (
    <svg width="36" height="12" viewBox="0 0 36 12" fill="none" aria-hidden className={className}>
      <path
        d="M1 6 C 3 1.5, 5 1.5, 7 6 S 11 10.5, 13 6 S 17 1.5, 19 6 S 23 10.5, 25 6 S 29 1.5, 31 6 S 34 8, 35 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function UserBets({
  bets,
  userStats,
  setUserStats,
}: {
  bets: any;
  userStats: any;
  setUserStats: any;
}): React.ReactNode {
  const [openParlayKey, setOpenParlayKey] = useState<string | null>(null);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  const [editor, setEditor] = useState<any>({
    visible: false,
    parlay: false,
    bet: null,
    newStatus: "active",
    editorStatus: null,
  });

  const JWT = localStorage.getItem("insajder_token") || "";

  const toggleParlay = (key: string) => {
    setOpenParlayKey(openParlayKey === key ? null : key);
  };

  const toggleMonth = (monthYear: string) => {
    setOpenMonths((prev) => ({
      ...prev,
      [monthYear]: !prev[monthYear],
    }));
  };

  const groupedBets = useMemo(() => {
    if (!bets || !Array.isArray(bets)) return {};
    const groups: Record<string, any[]> = {};

    const allBets = bets
      .filter((day) => day !== null)
      .flat()
      .filter((bet) => bet !== null);

    allBets.forEach((bet) => {
      const dateStr = bet?.date;
      let monthYear = "Nepoznat Datum";

      if (dateStr) {
        const parts = dateStr.split("/");
        const month = parseInt(parts[0], 10) - 1;
        const year = parts.length === 3 ? parseInt(parts[2], 10) : new Date().getFullYear();
        if (!isNaN(month) && !isNaN(year)) {
          monthYear = new Date(year, month, 1).toLocaleString("sr-Latn", {
            month: "long",
            year: "numeric",
          });
        }
      }

      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(bet);
    });

    return groups;
  }, [bets]);

  const openEditor = (bet) => {
    setEditor({
      visible: true,
      bet: bet,
      parlay: bet.type === "parlay",
      newStatus: bet.status || "active",
      editorStatus: null,
    });
  };

  const closeEditor = () => {
    setEditor((prev) => ({
      ...prev,
      bet: null,
      visible: false,
      editorStatus: null,
    }));
  };

  async function saveChanges() {
    const betData = editor.bet;
    const isParlay = editor.parlay;
    const previousStatus = betData.status;
    const newStatus = editor.newStatus;

    if (!newStatus || newStatus === previousStatus) {
      setEditor((prev) => ({
        ...prev,
        editorStatus: "Ovo je već trenutni status.",
      }));
      return;
    }

    const stake = Number(betData.stake);
    const odds = Number(betData.odds);
    const betId = betData.betId;
    const [monthNum, dayNum] = (betData.date || "1/1").split("/").map(Number);
    const monthIndex = Math.max(0, (monthNum || 1) - 1);

    const contributionFor = (status) => {
      const profit = stake * (odds - 1);
      if (status === "active") return { initialInvestment: -stake, monthlyProfit: 0 };
      if (status === "loss") return { initialInvestment: -stake, monthlyProfit: -stake };
      if (status === "win") return { initialInvestment: profit, monthlyProfit: profit };
      return { initialInvestment: 0, monthlyProfit: 0 };
    };

    const prevContrib = contributionFor(previousStatus);
    const newContrib = contributionFor(newStatus);

    const balanceChange = newContrib.initialInvestment - prevContrib.initialInvestment;
    const profitChange = newContrib.monthlyProfit - prevContrib.monthlyProfit;

    let winCountChange = 0;
    let lossCountChange = 0;
    if (previousStatus !== "win" && newStatus === "win") winCountChange = 1;
    if (previousStatus === "win" && newStatus !== "win") winCountChange = -1;
    if (previousStatus !== "loss" && newStatus === "loss") lossCountChange = 1;
    if (previousStatus === "loss" && newStatus !== "loss") lossCountChange = -1;

    const updates = [];
    if (balanceChange !== 0) updates.push({ updatePath: "statistics.initialInvestment", newValue: balanceChange, increment: true });
    if (profitChange !== 0) updates.push({ updatePath: `statistics.monthlyStats.${monthIndex}.monthlyProfit`, newValue: profitChange, increment: true });
    if (winCountChange !== 0) {
      updates.push({ updatePath: "statistics.totalWins", newValue: winCountChange, increment: true });
      updates.push({ updatePath: `statistics.monthlyStats.${monthIndex}.totalWins`, newValue: winCountChange, increment: true });
    }
    if (lossCountChange !== 0) {
      updates.push({ updatePath: "statistics.totalLosses", newValue: lossCountChange, increment: true });
      updates.push({ updatePath: `statistics.monthlyStats.${monthIndex}.totalLosses`, newValue: lossCountChange, increment: true });
    }

    setUserStats((prev) => {
      if (!prev || !prev.statistics) return prev;
      const newState = JSON.parse(JSON.stringify(prev));
      const stats = newState.statistics;
      const monthly = stats.monthlyStats && stats.monthlyStats[monthIndex];

      stats.initialInvestment += balanceChange;
      stats.totalWins += winCountChange;
      stats.totalLosses += lossCountChange;

      if (monthly) {
        monthly.monthlyProfit += profitChange;
        monthly.totalWins += winCountChange;
        monthly.totalLosses += lossCountChange;
      }

      const localBet = monthly?.bets?.[dayNum]?.find((b) => b.betId === betId);
      if (localBet) localBet.status = newStatus;

      return newState;
    });

    try {
      await fetch("/updateStatistics", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + JWT },
        body: JSON.stringify({ updates }),
      });

      await fetch("/updateBet", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + JWT },
        body: JSON.stringify({ bet: { betId, date: betData.date, newStatus, isParlay } }),
      });

      setEditor((prev) => ({
        ...prev,
        bet: { ...prev.bet, status: newStatus },
        newStatus: newStatus,
        editorStatus: "Status uspešno ažuriran.",
      }));
    } catch (err: any) {
      setEditor((prev) => ({
        ...prev,
        editorStatus: `Greška: ${err.message}`,
      }));
    }
  }

  const removeBet = async (bet) => {
    const isParlay = bet.type === "parlay";
    const betId = bet.betId;

    // 1. Construct datePath for the server (e.g., "0.bets.26")
    const dateParts = (bet.date || "1/1").split("/").map(Number);
    const monthIndex = Math.max(0, (dateParts[0] || 1) - 1);
    const dayNum = dateParts[1] || 1;
    const datePath = `${monthIndex}.bets.${dayNum}`;

    // 2. Stats calculations (same as before)
    const stake = Number(bet.stake);
    const odds = Number(bet.odds);
    const profit = stake * (odds - 1);

    let contrib = { initialInvestment: 0, monthlyProfit: 0, wins: 0, losses: 0, totalBets: 1 };
    if (bet.status === "active") {
      contrib.initialInvestment = -stake;
    } else if (bet.status === "win") {
      contrib.initialInvestment = profit;
      contrib.monthlyProfit = profit;
      contrib.wins = 1;
    } else if (bet.status === "loss") {
      contrib.initialInvestment = -stake;
      contrib.monthlyProfit = -stake;
      contrib.losses = 1;
    }

    // 3. UI Update
    setUserStats((prev) => {
      if (!prev || !prev.statistics) return prev;
      const newState = JSON.parse(JSON.stringify(prev));
      const stats = newState.statistics;
      const monthly = stats.monthlyStats?.[monthIndex];

      const betsArray = monthly?.bets?.[dayNum];
      if (betsArray) {
        const index = betsArray.findIndex((b) => b.betId === betId);
        if (index !== -1) betsArray.splice(index, 1);
      }

      stats.totalBets -= contrib.totalBets;
      stats.totalWins -= contrib.wins;
      stats.totalLosses -= contrib.losses;
      stats.initialInvestment -= contrib.initialInvestment;

      if (monthly) {
        monthly.totalBets -= contrib.totalBets;
        monthly.totalWins -= contrib.wins;
        monthly.totalLosses -= contrib.losses;
        monthly.monthlyProfit -= contrib.monthlyProfit;
      }

      return newState;
    });

    // 4. Server Request with required parameters
    try {
      await fetch("/removeBet", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
        body: JSON.stringify({
          betId,
          datePath, // Sending the path the server expects
        }),
      });
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  const monthKeys = Object.keys(groupedBets);

  if (monthKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <Layers className="h-7 w-7 text-slate-700" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Nema opklada za prikaz</p>
      </div>
    );
  }

  return (
    <div className="select-none space-y-3">
      {monthKeys.map((monthYear) => {
        const monthBets = groupedBets[monthYear];
        const isMonthOpen = openMonths[monthYear];

        return (
          <div key={monthYear}>
            {/* Month header */}
            <button
              onClick={() => toggleMonth(monthYear)}
              className="flex w-full items-center gap-3 rounded-xl border border-[#1a3050] bg-[#0b1628] px-4 py-3 transition-colors hover:border-[#2a4d75] hover:bg-[#0b1c2e]"
            >
              <motion.span animate={{ rotate: isMonthOpen ? 0 : -90 }} className="text-slate-500">
                <ChevronDown className="h-4 w-4" />
              </motion.span>
              <span className="text-sm font-bold capitalize text-white">{monthYear}</span>
              <span className="ml-auto rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                {monthBets.length}
              </span>
            </button>

            {/* Bets */}
            <AnimatePresence initial={false}>
              {isMonthOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-2">
                    {monthBets.map((bet, index) => {
                      const uniqueKey = `${monthYear}-${index}`;
                      // A system ticket is any bet that carries a list of games — not only
                      // those explicitly typed "parlay" (older tickets may omit the type).
                      const games: any[] = Array.isArray(bet?.games)
                        ? bet.games
                        : Array.isArray(bet)
                        ? bet
                        : [];
                      const isParlay = games.length > 0;
                      const resolvedStatus = bet.status ?? games[0]?.status;
                      const st = statusOf(resolvedStatus);
                      const isParlayOpen = openParlayKey === uniqueKey;

                      return (
                        <div
                          key={uniqueKey}
                          className={`overflow-hidden rounded-xl border border-[#1a3050] border-l-4 bg-[#0b1c2e]/70 ${st.bar}`}
                        >
                          <div
                            className={`flex items-center gap-3 p-3 ${isParlay ? "cursor-pointer" : ""}`}
                            onClick={isParlay ? () => toggleParlay(uniqueKey) : undefined}
                          >
                            {/* Match + meta */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {isParlay && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-sky-300">
                                    <Layers className="h-3 w-3" />
                                    {games.length}
                                  </span>
                                )}
                                <p className="truncate text-sm font-bold text-white">
                                  {isParlay ? "Sistem tiket" : bet.match}
                                </p>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                                <span className="truncate">{isParlay ? "Kombinacija" : bet.tip}</span>
                                <span className="text-slate-700">·</span>
                                <span className="shrink-0 font-mono">{bet.date}</span>
                              </div>
                            </div>

                            {/* Odds + stake */}
                            <div className="shrink-0 text-right">
                              <p className="font-mono text-sm font-bold text-sky-300">{Number(bet.odds).toFixed(2)}</p>
                              <p className="text-[10px] text-slate-500">ulog {bet.stake}</p>
                            </div>

                            {/* Status pill */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditor(bet);
                              }}
                              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide ring-1 ${st.pill}`}
                            >
                              {bet.status === "active" && <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${st.dot}`} />}
                              {st.label}
                            </button>

                            {/* Profit / loss — wavy line links the status to the amount */}
                            {(resolvedStatus === "win" || resolvedStatus === "loss") && (() => {
                              const win = resolvedStatus === "win";
                              const stake = Number(bet.stake) || 0;
                              const odds = Number(bet.odds) || 0;
                              const amount = win ? stake * (odds - 1) : stake;
                              return (
                                <div className="flex shrink-0 items-center gap-0.5">
                                  <WigglyLine className={win ? "text-emerald-400/60" : "text-rose-400/60"} />
                                  <span className={`font-mono text-xs font-black tabular-nums ${win ? "text-emerald-400" : "text-rose-400"}`}>
                                    {win ? "+" : "-"}{fmtAmount(amount)}
                                  </span>
                                </div>
                              );
                            })()}

                            {/* Parlay chevron */}
                            {isParlay && (
                              <motion.span animate={{ rotate: isParlayOpen ? 180 : 0 }} className="shrink-0 text-slate-600">
                                <ChevronDown className="h-4 w-4" />
                              </motion.span>
                            )}

                            {/* Delete (inset; never flush to the viewport edge) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBet(bet);
                              }}
                              aria-label="Ukloni opkladu"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Parlay games */}
                          <AnimatePresence initial={false}>
                            {isParlay && isParlayOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-1 border-t border-[#1a3050] bg-[#07131f]/60 p-3">
                                  {games.map((game: any, gIndex: number) => (
                                    <div key={`${uniqueKey}-g-${gIndex}`} className="flex items-center justify-between gap-3 text-xs">
                                      <span className="min-w-0 flex-1 truncate text-slate-300">↳ {game.match}</span>
                                      <span className="shrink-0 text-slate-500">{game.tip}</span>
                                      <span className="shrink-0 font-mono text-slate-400">{Number(game.odds).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {editor.visible &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="w-full max-w-md rounded-2xl border border-[#1a3050] bg-[#07131f] p-6 shadow-2xl"
            >
              <h2 className="mb-6 text-xl font-bold text-white">Ažuriraj Status Opklade</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-400">Novi Status</label>
                  <select
                    value={editor.newStatus}
                    onChange={(e) => setEditor((prev) => ({ ...prev, newStatus: e.target.value }))}
                    className="w-full rounded-xl border border-[#1a3050] bg-[#0b1c2e] px-4 py-3 text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="active">Aktivan</option>
                    <option value="win">Prolaz</option>
                    <option value="loss">Gubitan</option>
                  </select>
                </div>

                {editor.editorStatus && (
                  <div className={`rounded-lg p-3 text-sm font-medium ${editor.editorStatus.includes("uspešno") ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                    {editor.editorStatus}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={closeEditor} className="flex-1 rounded-xl bg-[#0b1c2e] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#0d2035]">
                    Otkaži
                  </button>
                  <button onClick={saveChanges} className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                    Sačuvaj
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
    </div>
  );
}
