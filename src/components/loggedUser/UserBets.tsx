import React, { useState } from "react";
import { createPortal } from "react-dom";

export default function UserBets({
  bets,
  userStats,
  setUserStats,
}: {
  bets: any;
  userStats: any;
  local: any;
  setUserStats: any;
}): React.ReactNode {
  // This component renders the <bets> inside of a table that also has Editor built in.

  const [openParlayIndex, setOpenParlayIndex] = useState<number | null>(null);
  const [editor, setEditor] = useState({
    visible: false,
    parlay: false,
    bet: null,
    newStatus: "active",
    editorStatus: null,
  });

  const JWT = localStorage.getItem("insajder_token") || "";

  const toggleParlay = (index: number) => {
    setOpenParlayIndex(openParlayIndex === index ? null : index);
  };

  const openEditor = (bet) => {
    // Opens the bet editor
    setEditor((prev) => ({
      ...prev,
      visible: true,
      bet: bet,
      parlay: Array.isArray(bet),
      newStatus: Array.isArray(bet) ? bet[0].status : bet.status,
    }));
  };
  const removeBet = async (bet) => {
    try {
      const isParlay = bet.isParlay;
      const stake = Number(bet.stake);
      const odds = isParlay ? Number(bet.totalOdds) : Number(bet.odds);
      const betId = isParlay ? bet.parlayId : bet.betId;
      const status = bet.status;
      const dateParts = bet.date.split("/").map(Number);
      const [month, day] = dateParts;
      const monthIndex = month - 1;

      const profit = stake * (odds - 1);

      let balanceChange = 0;
      let profitChange = 0;
      let winCountChange = 0;
      let lossCountChange = 0;
      let activeCountChange = 0;

      if (status === "win") {
        balanceChange = -profit;
        profitChange = -profit;
        winCountChange = -1;
      } else if (status === "loss") {
        balanceChange = stake;
        profitChange = stake;
        lossCountChange = -1;
      } else {
        balanceChange = stake;
        profitChange = 0;
        activeCountChange = -1;
      }

      const updates = [];

      // For settled bets (win/loss), we assume the /removeBet endpoint handles the profit.
      // So, we ONLY send the profit update to /updateStatistics for an "active" bet.
      // Since profitChange is 0 for active bets, this effectively sends no financial data.
      if (status !== "win" && status !== "loss") {
        updates.push({
          updatePath: `statistics.monthlyStats.${monthIndex}.monthlyProfit`,
          newValue: profitChange,
          increment: true,
        });
      }

      updates.push(
        { updatePath: "statistics.totalBets", newValue: -1, increment: true },
        {
          updatePath: `statistics.monthlyStats.${monthIndex}.totalBets`,
          newValue: -1,
          increment: true,
        }
      );

      if (winCountChange !== 0) {
        updates.push(
          {
            updatePath: "statistics.totalWins",
            newValue: winCountChange,
            increment: true,
          },
          {
            updatePath: `statistics.monthlyStats.${monthIndex}.totalWins`,
            newValue: winCountChange,
            increment: true,
          }
        );
      }
      if (lossCountChange !== 0) {
        updates.push(
          {
            updatePath: "statistics.totalLosses",
            newValue: lossCountChange,
            increment: true,
          },
          {
            updatePath: `statistics.monthlyStats.${monthIndex}.totalLosses`,
            newValue: lossCountChange,
            increment: true,
          }
        );
      }
      if (activeCountChange !== 0) {
        updates.push({
          updatePath: `statistics.monthlyStats.${monthIndex}.totalActive`,
          newValue: activeCountChange,
          increment: true,
        });
      }

      await fetch("/updateStatistics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
        body: JSON.stringify({ updates }),
      });

      await fetch("/removeBet", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
        body: JSON.stringify({ betId, date: bet.date, isParlay }),
      });

      setUserStats((prev) => {
        if (!prev || !prev.statistics) {
          return prev;
        }
        const newState = JSON.parse(JSON.stringify(prev));
        const stats = newState.statistics;
        const monthly = stats.monthlyStats[monthIndex];

        stats.initialInvestment += balanceChange;
        stats.totalBets = Math.max(0, (stats.totalBets || 0) - 1);
        stats.totalWins += winCountChange;
        stats.totalLosses += lossCountChange;

        if (monthly) {
          monthly.monthlyProfit += profitChange;
          monthly.totalBets = Math.max(0, (monthly.totalBets || 0) - 1);
          monthly.totalWins += winCountChange;
          monthly.totalLosses += lossCountChange;
          monthly.totalActive += activeCountChange;

          if (monthly.bets && monthly.bets[day]) {
            monthly.bets[day] = monthly.bets[day].filter((b) => {
              const currentBetId = Array.isArray(b) ? b[0]?.parlayId : b?.betId;
              return currentBetId !== betId;
            });
          }
        }
        return newState;
      });
    } catch (error) {
      console.error("Error removing bet:", error);
    }
  };
  const closeEditor = () => {
    setEditor((prev) => ({ ...prev, bet: null, visible: false }));
  };

  async function saveChanges() {
    const isParlay = editor.parlay;
    const betData = isParlay ? editor.bet[0] : editor.bet;
    const previousStatus = betData.status;
    const newStatus = editor.newStatus;

    if (!newStatus || newStatus === previousStatus) {
      setEditor((prev) => ({
        ...prev,
        editorStatus: "This is already the current status.",
      }));
      console.log("abort: no status change", { previousStatus, newStatus });
      return;
    }

    const stake = Number(betData.stake);
    const odds = Number(isParlay ? betData.totalOdds : betData.odds);
    const betId = isParlay ? betData.parlayId : betData.betId;
    const [monthNum, dayNum] = (betData.date || "1/1").split("/").map(Number);
    const monthIndex = Math.max(0, (monthNum || 1) - 1);
    const dayIndex = Math.max(1, dayNum || 1);

    console.log("saveChanges start", {
      betId,
      previousStatus,
      newStatus,
      stake,
      odds,
      monthIndex,
      dayIndex,
    });

    const contributionFor = (status) => {
      const profit = stake * (odds - 1);
      if (status === "active")
        return { initialInvestment: -stake, monthlyProfit: 0 };
      if (status === "loss")
        return { initialInvestment: -stake, monthlyProfit: -stake };
      if (status === "win")
        return { initialInvestment: profit, monthlyProfit: profit };
      return { initialInvestment: 0, monthlyProfit: 0 };
    };

    const prevContrib = contributionFor(previousStatus);
    const newContrib = contributionFor(newStatus);

    const balanceChange =
      newContrib.initialInvestment - prevContrib.initialInvestment;
    const profitChange = newContrib.monthlyProfit - prevContrib.monthlyProfit;

    let winCountChange = 0;
    let lossCountChange = 0;
    if (previousStatus !== "win" && newStatus === "win") winCountChange = 1;
    if (previousStatus === "win" && newStatus !== "win") winCountChange = -1;
    if (previousStatus !== "loss" && newStatus === "loss") lossCountChange = 1;
    if (previousStatus === "loss" && newStatus !== "loss") lossCountChange = -1;

    console.log("computed deltas", {
      prevContrib,
      newContrib,
      balanceChange,
      profitChange,
      winCountChange,
      lossCountChange,
    });

    const updates = [];
    if (balanceChange !== 0)
      updates.push({
        updatePath: "statistics.initialInvestment",
        newValue: balanceChange,
        increment: true,
      });
    if (profitChange !== 0)
      updates.push({
        updatePath: `statistics.monthlyStats.${monthIndex}.monthlyProfit`,
        newValue: profitChange,
        increment: true,
      });
    if (winCountChange !== 0) {
      updates.push({
        updatePath: "statistics.totalWins",
        newValue: winCountChange,
        increment: true,
      });
      updates.push({
        updatePath: `statistics.monthlyStats.${monthIndex}.totalWins`,
        newValue: winCountChange,
        increment: true,
      });
    }
    if (lossCountChange !== 0) {
      updates.push({
        updatePath: "statistics.totalLosses",
        newValue: lossCountChange,
        increment: true,
      });
      updates.push({
        updatePath: `statistics.monthlyStats.${monthIndex}.totalLosses`,
        newValue: lossCountChange,
        increment: true,
      });
    }

    console.log("updates payload", updates);

    setUserStats((prev) => {
      if (!prev || !prev.statistics) {
        console.log("setUserStats aborted: missing prev.stats");
        return prev;
      }

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
      } else {
        console.log("warning: monthly stat missing for monthIndex", monthIndex);
      }

      const localBet = monthly?.bets?.[dayIndex]?.find((bet) =>
        isParlay ? bet[0]?.parlayId === betId : bet?.betId === betId
      );

      if (localBet) {
        if (isParlay) localBet[0].status = newStatus;
        else localBet.status = newStatus;
      } else {
        console.log("warning: localBet not found", {
          monthIndex,
          dayIndex,
          betId,
        });
      }

      console.log("local state updated", {
        balanceChange,
        profitChange,
        winCountChange,
        lossCountChange,
      });
      return newState;
    });

    try {
      const statRes = await fetch("/updateStatistics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
        body: JSON.stringify({ updates }),
      });
      const statJson = await statRes.json().catch(() => ({}));
      console.log("updateStatistics response", {
        ok: statRes.ok,
        status: statRes.status,
        body: statJson,
      });
      if (!statRes.ok)
        throw new Error(`updateStatistics failed ${statRes.status}`);

      const betRes = await fetch("/updateBet", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
        body: JSON.stringify({
          bet: { betId, date: betData.date, newStatus, isParlay },
        }),
      });
      const betJson = await betRes.json().catch(() => ({}));
      console.log("updateBet response", {
        ok: betRes.ok,
        status: betRes.status,
        body: betJson,
      });
      if (!betRes.ok) throw new Error(`updateBet failed ${betRes.status}`);

      setEditor((prev) => ({
        ...prev,
        bet: isParlay
          ? [{ ...prev.bet[0], status: newStatus }]
          : { ...prev.bet, status: newStatus },
        newStatus: "",
      }));

      console.log("saveChanges finished successfully", { betId, newStatus });
    } catch (err) {
      console.error("saveChanges error", err);
    }
  }

  return (
    <div className="relative max-h-[calc(100vh-200px)] overflow-auto select-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700/50">
      <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-lg">
        <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-sm">
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-20 bg-slate-900/80 py-4 pl-6 pr-4 text-left text-base font-semibold text-white backdrop-blur-sm"
                  >
                    Meč
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-4 text-left text-base font-semibold text-white"
                  >
                    Tip
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-4 text-left text-base font-semibold text-white"
                  >
                    Kvota
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-4 text-left text-base font-semibold text-white"
                  >
                    Ulog
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-4 text-left text-base font-semibold text-white"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-4 text-left text-base font-semibold text-white"
                  >
                    Datum
                  </th>
                  <th scope="col" className="relative py-4 pl-4 pr-6">
                    <span className="sr-only">Delete</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {bets?.map((bet, index) => {
                  const isParlay = Array.isArray(bet) && bet[0];
                  const mainBet = isParlay ? bet[0] : bet;
                  const status = mainBet?.status;

                  let statusBorderClass = "";
                  if (status === "win") statusBorderClass = "border-green-500";
                  else if (status === "loss")
                    statusBorderClass = "border-red-500";
                  else if (status === "active")
                    statusBorderClass = "border-sky-500";

                  let statusBadgeClass = "";
                  if (status === "win")
                    statusBadgeClass =
                      "bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20";
                  else if (status === "loss")
                    statusBadgeClass =
                      "bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20";
                  else if (status === "active")
                    statusBadgeClass =
                      "bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20";

                  return !isParlay ? (
                    <tr
                      key={index}
                      className="transition-colors hover:bg-slate-800/40"
                    >
                      <td
                        className={`whitespace-nowrap py-5 pl-6 pr-4 text-base font-medium text-white sticky left-0 bg-slate-900/50 border-l-4 ${statusBorderClass}`}
                      >
                        {bet.match}
                      </td>
                      <td className="whitespace-nowrap px-4 py-5 text-base text-slate-400">
                        {bet.tip}
                      </td>
                      <td className="whitespace-nowrap px-4 py-5 text-base text-slate-400">
                        <span className="inline-flex items-center rounded-lg bg-slate-700/60 px-2.5 py-1.5 text-sm font-semibold text-sky-300">
                          {bet.odds}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-5 text-base font-semibold text-white">
                        {bet.stake}
                      </td>
                      <td className="whitespace-nowrap px-4 py-5 text-base">
                        <button
                          onClick={() => openEditor(bet)}
                          className={`inline-flex items-center gap-x-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold ${statusBadgeClass}`}
                        >
                          {status === "active" && (
                            <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></div>
                          )}
                          {status}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-5 text-base text-slate-500">
                        {bet.date}
                      </td>
                      <td className="relative whitespace-nowrap py-5 pl-4 pr-6 text-right text-base font-medium">
                        <button
                          onClick={() => removeBet(bet)}
                          className="p-1 rounded-full text-slate-500 transition-colors hover:text-red-400 hover:bg-slate-800"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <React.Fragment key={index}>
                      <tr
                        onClick={() => toggleParlay(index)}
                        className="cursor-pointer bg-slate-800/20 transition-colors hover:bg-slate-800/50"
                      >
                        <td
                          className={`whitespace-nowrap py-5 pl-6 pr-4 text-base font-medium text-sky-300 sticky left-0 bg-slate-900/50 border-l-4 ${statusBorderClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <span>[Sistem {bet.length - 1} meča]</span>
                            <svg
                              className={`h-5 w-5 transition-transform ${
                                openParlayIndex === index ? "rotate-180" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-5 text-base text-slate-500">
                          -
                        </td>
                        <td className="whitespace-nowrap px-4 py-5 text-base text-slate-400">
                          <span className="inline-flex items-center rounded-lg bg-slate-700/60 px-2.5 py-1.5 text-sm font-semibold text-sky-300">
                            {mainBet.totalOdds}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-5 text-base font-semibold text-white">
                          {mainBet.stake}
                        </td>
                        <td className="whitespace-nowrap px-4 py-5 text-base">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditor(bet);
                            }}
                            className={`inline-flex items-center gap-x-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold ${statusBadgeClass}`}
                          >
                            {status === "active" && (
                              <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></div>
                            )}
                            {status}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-5 text-base text-slate-500">
                          {mainBet.date}
                        </td>
                        <td className="relative whitespace-nowrap py-5 pl-4 pr-6 text-right text-base font-medium"></td>
                      </tr>
                      {openParlayIndex === index &&
                        bet.map(
                          (parlayGame, parlayIndex) =>
                            parlayIndex > 0 && (
                              <tr key={parlayIndex} className="bg-slate-800/10">
                                <td
                                  colSpan={4}
                                  className="py-4 pl-12 pr-4 text-base text-slate-300"
                                >
                                  {parlayGame.match}
                                </td>
                                <td className="px-4 py-4 text-base text-slate-400">
                                  {parlayGame.tip}
                                </td>
                                <td className="px-4 py-4 text-base">
                                  <span className="inline-flex items-center rounded-lg bg-slate-700/60 px-2.5 py-1.5 text-sm font-semibold text-sky-300">
                                    {parlayGame.odds}
                                  </span>
                                </td>
                                <td className="relative py-4 pl-4 pr-6 text-right text-base">
                                  <button
                                    onClick={() => removeBet(parlayGame)}
                                    className="p-1 rounded-full text-slate-500 transition-colors hover:text-red-400 hover:bg-slate-800"
                                  >
                                    <svg
                                      className="h-5 w-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth="1.5"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                      />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            )
                        )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal portal remains unchanged */}
      {editor.visible &&
        createPortal(
          <div className="z-50 fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-cyan-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white font-semibold text-lg">
                  Promeni status opklade (Trenutno je{" "}
                  {editor.parlay ? (
                    <span
                      className={
                        editor.bet[0].status === "win"
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      <span>{editor.bet[0].status}</span>
                    </span>
                  ) : (
                    <span
                      className={
                        editor.bet.status === "win"
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      <>{editor.bet.status}</>
                    </span>
                  )}
                  )
                </span>
                <button
                  onClick={closeEditor}
                  className="text-white hover:text-red-400 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <select
                className={`w-full bg-gray-800/50 border-2 ${
                  editor.newStatus === "win"
                    ? "border-green-500/30"
                    : "border-red-500/30"
                } rounded-lg p-3 mb-4 text-gray-300 focus:ring-2 focus:ring-cyan-400`}
                defaultValue={editor.newStatus}
                onChange={(e) =>
                  setEditor((prev) => ({ ...prev, newStatus: e.target.value }))
                }
              >
                <option value="win" className="bg-gray-800 text-green-400">
                  Dobitan
                </option>
                <option value="loss" className="bg-gray-800 text-red-400">
                  Gubitan
                </option>
              </select>

              <button
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg transition-colors"
                onClick={saveChanges}
              >
                Sačuvaj
              </button>
            </div>
          </div>,
          document.getElementById("modal-root")
        )}
    </div>
  );
}
