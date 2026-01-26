import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";

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
  const [openMonths, setOpenMonths] = useState({});
  const [editor, setEditor] = useState({
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
          Authorization: "Bearer " + JWT 
        },
        body: JSON.stringify({ 
          betId, 
          datePath // Sending the path the server expects
        }),
      });
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  return (
    <div className="relative max-h-[calc(100vh-200px)] overflow-auto select-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700/50">
      <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-sm">
              <tr>
                <th className="sticky left-0 z-20 bg-slate-900/80 py-4 pl-6 pr-4 text-left text-base font-semibold text-white backdrop-blur-sm">Meč</th>
                <th className="px-4 py-4 text-left text-base font-semibold text-white">Tip</th>
                <th className="px-4 py-4 text-left text-base font-semibold text-white">Kvota</th>
                <th className="px-4 py-4 text-left text-base font-semibold text-white">Ulog</th>
                <th className="px-4 py-4 text-left text-base font-semibold text-white">Status</th>
                <th className="px-4 py-4 text-left text-base font-semibold text-white">Datum</th>
                <th className="relative py-4 pl-4 pr-6"><span className="sr-only">Delete</span></th>
              </tr>
            </thead>

            {Object.entries(groupedBets).map(([monthYear, monthBets]) => (
              <React.Fragment key={monthYear}>
                <tbody className="divide-y divide-slate-800 border-t-2 border-slate-700">
                  <tr onClick={() => toggleMonth(monthYear)} className="bg-slate-900/70 cursor-pointer transition-colors hover:bg-slate-800">
                    <td colSpan={7} className="py-3 px-6 text-base font-bold text-white tracking-wider">
                      <div className="flex items-center gap-3">
                        <svg className={`h-5 w-5 transition-transform ${openMonths[monthYear] ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                        <span className="capitalize">{monthYear}</span>
                        <span className="ml-auto text-sm font-normal text-slate-400">{monthBets.length} opklada</span>
                      </div>
                    </td>
                  </tr>
                </tbody>

                {openMonths[monthYear] && (
                  <tbody className="divide-y divide-slate-800">
                    {monthBets.map((bet, index) => {
                      const uniqueKey = `${monthYear}-${index}`;
                      const isParlay = bet.type === "parlay";
                      const status = bet.status;

                      const statusBorder = status === "win" ? "border-green-500" : status === "loss" ? "border-red-500" : "border-sky-500";
                      const statusBadge = status === "win" ? "bg-green-500/10 text-green-400 ring-1 ring-green-500/20" : status === "loss" ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/20" : "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20";

                      if (!isParlay) {
                        return (
                          <tr key={uniqueKey} className="transition-colors hover:bg-slate-800/40">
                            <td className={`whitespace-nowrap py-5 pl-6 pr-4 text-base font-medium text-white sticky left-0 bg-slate-900/50 border-l-4 ${statusBorder}`}>{bet.match}</td>
                            <td className="whitespace-nowrap px-4 py-5 text-base text-slate-400">{bet.tip}</td>
                            <td className="whitespace-nowrap px-4 py-5 text-base text-slate-400"><span className="inline-flex items-center rounded-lg bg-slate-700/60 px-2.5 py-1.5 text-sm font-semibold text-sky-300">{Number(bet.odds).toFixed(2)}</span></td>
                            <td className="whitespace-nowrap px-4 py-5 text-base font-semibold text-white">{bet.stake}€</td>
                            <td className="whitespace-nowrap px-4 py-5 text-base">
                              <button onClick={() => openEditor(bet)} className={`inline-flex items-center gap-x-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold ${statusBadge}`}>{status === "active" && <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></div>}{status}</button>
                            </td>
                            <td className="whitespace-nowrap px-4 py-5 text-base text-slate-500">{bet.date}</td>
                            <td className="relative whitespace-nowrap py-5 pl-4 pr-6 text-right">
                              <button onClick={() => removeBet(bet)} className="p-1 rounded-full text-slate-500 hover:text-red-400 hover:bg-slate-800">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <React.Fragment key={uniqueKey}>
                          <tr onClick={() => toggleParlay(uniqueKey)} className="cursor-pointer bg-slate-800/20 transition-colors hover:bg-slate-800/50">
                            <td className={`whitespace-nowrap py-5 pl-6 pr-4 text-base font-medium text-sky-300 sticky left-0 bg-slate-900/50 border-l-4 ${statusBorder}`}>
                              <div className="flex items-center gap-2">
                                <span>[Sistem {bet.games?.length || 0} meča]</span>
                                <svg className={`h-5 w-5 transition-transform ${openParlayKey === uniqueKey ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="M19 9l-7 7-7-7"/></svg>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-5 text-base text-slate-500">Kombinacija</td>
                            <td className="whitespace-nowrap px-4 py-5 text-base text-slate-400"><span className="inline-flex items-center rounded-lg bg-slate-700/60 px-2.5 py-1.5 text-sm font-semibold text-sky-300">{Number(bet.odds).toFixed(2)}</span></td>
                            <td className="whitespace-nowrap px-4 py-5 text-base font-semibold text-white">{bet.stake}€</td>
                            <td className="whitespace-nowrap px-4 py-5 text-base">
                              <button onClick={(e) => { e.stopPropagation(); openEditor(bet); }} className={`inline-flex items-center gap-x-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold ${statusBadge}`}>{status}</button>
                            </td>
                            <td className="whitespace-nowrap px-4 py-5 text-base text-slate-500">{bet.date}</td>
                            <td className="relative whitespace-nowrap py-5 pl-4 pr-6 text-right">
                              <button onClick={(e) => { e.stopPropagation(); removeBet(bet); }} className="p-1 rounded-full text-slate-500 hover:text-red-400 hover:bg-slate-800">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                              </button>
                            </td>
                          </tr>
                          {openParlayKey === uniqueKey && bet.games?.map((game, gIndex) => (
                            <tr key={`${uniqueKey}-g-${gIndex}`} className="bg-slate-800/10">
                              <td className="whitespace-nowrap py-4 pl-12 pr-4 text-sm font-medium text-slate-300">↳ {game.match}</td>
                              <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-400">{game.tip}</td>
                              <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">{Number(game.odds).toFixed(2)}</td>
                              <td colSpan={4}></td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                )}
              </React.Fragment>
            ))}
          </table>
        </div>
      </div>

      {editor.visible &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">Ažuriraj Status Opklade</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Novi Status</label>
                  <select
                    value={editor.newStatus}
                    onChange={(e) => setEditor((prev) => ({ ...prev, newStatus: e.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                  </select>
                </div>

                {editor.editorStatus && (
                  <div className={`rounded-lg p-3 text-sm font-medium ${editor.editorStatus.includes('uspešno') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {editor.editorStatus}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button onClick={closeEditor} className="flex-1 rounded-xl bg-slate-800 px-4 py-3 font-semibold text-white transition-colors hover:bg-slate-700">Otkaži</button>
                  <button onClick={saveChanges} className="flex-1 rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-sky-400">Sačuvaj</button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}