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
      if (dateParts.length < 2 || isNaN(dateParts[0]) || isNaN(dateParts[1])) {
        throw new Error("Invalid bet date format: " + bet.date);
      }
      const [month] = dateParts;
      const monthIndex = month - 1;

      let balanceChange = 0;
      let profitChange = 0;
      let winCountChange = 0;
      let lossCountChange = 0;
      let activeCountChange = 0;
      const profit = stake * (odds - 1);

      if (status === "win") {
        balanceChange = -profit;
        profitChange = -profit;
        winCountChange = -1;
      } else if (status === "loss") {
        balanceChange = stake;
        profitChange = 0;
        lossCountChange = -1;
      } else {
        balanceChange = stake;
        profitChange = 0;
        activeCountChange = -1;
      }

      const updates = [];
      if (balanceChange !== 0) {
        updates.push({
          updatePath: "statistics.initialInvestment",
          newValue:
            status === "win" ? balanceChange + stake : balanceChange - stake,
          increment: true,
        });
      }
      if (profitChange !== 0) {
        updates.push({
          updatePath: `statistics.monthlyStats.${monthIndex}.monthlyProfit`,
          newValue: profitChange + stake,
          increment: true,
        });
      }
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

      if (updates.length > 0) {
        await fetch("http://localhost:1337/updateStatistics", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + JWT,
          },
          body: JSON.stringify({ updates }),
        });
      }

      await fetch("http://localhost:1337/removeBet", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
        body: JSON.stringify({ betId, date: bet.date, isParlay }),
      });

      setUserStats((prev) => {
        if (!prev || !prev.statistics) return prev;

        const newState = JSON.parse(JSON.stringify(prev));
        const stats = newState.statistics;
        const monthly = stats.monthlyStats[monthIndex];
        const day = dateParts[1];

        stats.initialInvestment =
          status === "win"
            ? Number(stats.initialInvestment) -
              (Number(stake) * Number(odds) - Number(stake))
            : status === "loss"
            ? Number(stats.initialInvestment) + Number(stake)
            : stats.initialInvestment;

        stats.totalWins = (Number(stats.totalWins) || 0) + winCountChange;
        stats.totalLosses = (Number(stats.totalLosses) || 0) + lossCountChange;
        stats.totalBets = Number(stats.totalBets - 1);

        if (monthly) {
          monthly.monthlyProfit = monthly.totalWins =
            (Number(monthly.totalWins) || 0) + winCountChange;
          monthly.totalLosses =
            (Number(monthly.totalLosses) || 0) + lossCountChange;
          monthly.totalActive =
            (Number(monthly.totalActive) || 0) + activeCountChange;

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
  /**
   * Saves changes to a bet's status and updates all relevant user statistics
   * on both the client and the server.
   *
   * This function implements a clear, centralized logic for calculating financial changes
   * to prevent data inconsistencies.
   *
   * @param {object} editor - State object containing the bet being edited.
   * @param {object} userStats - The user's current statistics object.
   * @param {function} setUserStats - The state setter for user statistics.
   * @param {function} setEditor - The state setter for the editor.
   * @param {string} JWT - The JSON Web Token for authorization.
   */
  const saveChanges = () => {
    // Extract key information about the bet from the editor state.
    const isParlay = editor.parlay;
    const betData = isParlay ? editor.bet[0] : editor.bet;
    const previousStatus = betData.status;
    const newStatus = editor.newStatus;

    // Proceed only if the status has actually changed.
    if (newStatus && newStatus !== previousStatus) {
      const stake = betData.stake;
      const odds = isParlay ? betData.totalOdds : betData.odds;
      const betId = isParlay ? betData.parlayId : betData.betId;
      const [month, day] = betData.date.split("/").map(Number);
      const monthIndex = month - 1;

      // --- Centralized Calculation Logic ---
      // Instead of "undoing" and "redoing", we calculate the net change needed.
      let balanceChange = 0;
      let profitChange = 0;
      let winCountChange = 0;
      let lossCountChange = 0;

      const profit = stake * (odds - 1); // The net profit from a win.
      const totalReturn = stake * odds; // The full amount returned on a win (stake + profit).

      // Scenario 1: Transitioning from LOST to WON
      if (previousStatus === "loss" && newStatus === "win") {
        // The balance needs the full winnings added.
        balanceChange = totalReturn;
        // The profit was negative (-stake), now it's positive (profit).
        // The change is profit - (-stake) => profit + stake => totalReturn.
        profitChange = totalReturn;
        winCountChange = 1;
        lossCountChange = -1;
      }
      // Scenario 2: Transitioning from WON to LOST
      else if (previousStatus === "win" && newStatus === "loss") {
        // Balance had the winnings, now they must be removed.
        balanceChange = -totalReturn;
        // Profit had the net profit, now it must be a loss of -stake.
        // The change is -stake - profit => -(stake + profit) => -totalReturn.
        profitChange = -totalReturn;
        winCountChange = -1;
        lossCountChange = 1;
      }
      // Scenario 3: A pending/active bet becomes a WIN
      // (This also covers changing a void/refunded bet to a win)
      else if (previousStatus !== "win" && newStatus === "win") {
        balanceChange = totalReturn;
        profitChange = profit;
        winCountChange = 1;
      }
      // Scenario 4: A pending/active bet becomes a LOSS
      else if (previousStatus !== "loss" && newStatus === "loss") {
        // Balance is unaffected as the stake was already removed when the bet was placed.
        balanceChange = 0;
        profitChange = -stake;
        lossCountChange = 1;
      }
      // Scenario 5: A WIN is reverted to pending/void
      else if (previousStatus === "win" && newStatus !== "loss") {
        balanceChange = -totalReturn;
        profitChange = -profit;
        winCountChange = -1;
      }
      // Scenario 6: A LOSS is reverted to pending/void
      else if (previousStatus === "loss" && newStatus !== "win") {
        // Balance is unaffected.
        balanceChange = 0;
        // The recorded loss of `stake` is reversed.
        profitChange = stake;
        lossCountChange = -1;
      }

      // --- Prepare Server Updates ---
      // Create an array of update operations based on the calculated changes.
      const updates = [];
      if (balanceChange !== 0) {
        updates.push({
          updatePath: "statistics.initialInvestment",
          newValue: balanceChange,
          increment: true,
        });
      }
      if (profitChange !== 0) {
        updates.push({
          updatePath: `statistics.monthlyStats.${monthIndex}.monthlyProfit`,
          newValue: profitChange,
          increment: true,
        });
      }
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

      // --- Update Local State ---
      // Apply the exact same calculated changes to the local state for a responsive UI.
      setUserStats((prev) => {
        if (!prev || !prev.statistics) return prev;

        // Deep copy to avoid direct state mutation.
        const newState = JSON.parse(JSON.stringify(prev));
        const stats = newState.statistics;
        const monthly = stats.monthlyStats[monthIndex];

        stats.initialInvestment += balanceChange;
        stats.totalWins += winCountChange;
        stats.totalLosses += lossCountChange;

        if (monthly) {
          monthly.monthlyProfit += profitChange;
          monthly.totalWins += winCountChange;
          monthly.totalLosses += lossCountChange;
        }

        // Also update the status of the specific bet in the local array.
        const localBet = monthly.bets[day]?.find((bet) =>
          isParlay ? bet[0]?.parlayId === betId : bet?.betId === betId
        );

        if (localBet) {
          if (isParlay) {
            localBet[0].status = newStatus;
          } else {
            localBet.status = newStatus;
          }
        }

        return newState;
      });

      // --- Perform API Calls ---
      // Chain the API calls to first update statistics, then the bet itself.
      fetch("http://localhost:1337/updateStatistics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
        body: JSON.stringify({ updates }),
      })
        .then((response) => {
          if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
          return response.json();
        })
        .then(() => {
          // After successfully updating stats, update the bet's status.
          return fetch("http://localhost:1337/updateBet", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + JWT,
            },
            body: JSON.stringify({
              bet: {
                betId: betId,
                date: betData.date,
                newStatus: newStatus,
                isParlay: isParlay,
              },
            }),
          });
        })
        .then((response) => {
          if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
          return response.json();
        })
        .then(() => {
          // Finally, update the editor state to reflect the change and reset.
          setEditor((prev) => ({
            ...prev,
            bet: isParlay
              ? [{ ...prev.bet[0], status: newStatus }]
              : { ...prev.bet, status: newStatus },
            newStatus: "", // Clear newStatus after successful update.
          }));
        })
        .catch((error) => {
          console.error("Error updating bet:", error);
          // Here you could add logic to revert the local state change on API failure.
        });
    } else {
      // If the status hasn't changed, notify the user.
      setEditor((prev) => ({
        ...prev,
        editorStatus: "This is already the current status.",
      }));
    }
  };

  return (
    <div className="relative max-h-[calc(100vh-200px)] overflow-auto select-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700/50">
      <table className="w-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700  shadow-2xl shadow-black/50 overflow-hidden">
        <thead className="bg-gradient-to-r from-gray-900 to-gray-800 backdrop-blur-sm sticky top-0 z-10">
          <tr className="border-b border-cyan-500/30">
            <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider sticky left-0 bg-gray-900/95 z-20 group">
              <div className="flex items-center space-x-1">
                <span>Meč</span>
                <svg
                  className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
            </th>
            <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider group">
              <div className="flex items-center space-x-1">
                <span>Tip</span>
                <svg
                  className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
            </th>
            <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider group">
              <div className="flex items-center space-x-1">
                <span>Kvota</span>
                <svg
                  className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
            </th>
            <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider group">
              <div className="flex items-center space-x-1">
                <span>Ulog</span>
                <svg
                  className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
            </th>
            <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider group">
              <div className="flex items-center space-x-1">
                <span>Status</span>
                <svg
                  className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
            </th>
            <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider group">
              <div className="flex items-center space-x-1">
                <span>Datum</span>
                <svg
                  className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
            </th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-700/40">
          {bets?.map((bet, index) =>
            !Array.isArray(bet) ? (
              <tr
                key={index}
                className="hover:bg-gray-700/20 transition-colors duration-150 group"
              >
                <td
                  className={`px-6 py-4 whitespace-nowrap relative after:absolute after:left-0 after:top-0 after:h-full after:w-1.5 ${
                    bet.status === "win"
                      ? "after:bg-green-500 after:shadow-green-500/50"
                      : bet.status === "active"
                      ? "after:bg-cyan-500 after:shadow-cyan-500/50"
                      : "after:bg-red-500 after:shadow-red-500/50"
                  } after:shadow-lg`}
                >
                  <span className="text-gray-200 group-hover:text-white transition-colors font-medium">
                    {bet.match}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">{bet.tip}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-cyan-300">
                    {bet.odds}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-100 font-medium">
                  {bet.stake}
                </td>
                <td
                  onClick={() => openEditor(bet)}
                  className={`px-6 py-4 font-medium cursor-pointer transition-all ${
                    bet.status === "loss"
                      ? "text-red-400 hover:text-red-300 bg-red-900/30"
                      : bet.status === "active"
                      ? "text-cyan-400 hover:text-cyan-300 bg-cyan-900/30"
                      : "text-green-400 hover:text-green-300 bg-green-900/30"
                  } rounded-md whitespace-nowrap`}
                >
                  <span className="inline-flex items-center">
                    {bet.status}
                    {bet.status === "active" && (
                      <svg
                        className="ml-1.5 h-2 w-2 animate-pulse text-cyan-400"
                        fill="currentColor"
                        viewBox="0 0 8 8"
                      >
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">{bet.date}</td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => removeBet(bet)}
                    className=" transition-opacity text-gray-400 hover:text-red-400 p-1 rounded-full hover:bg-gray-700/50"
                    aria-label="Delete"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ) : (
              bet[0] && (
                <React.Fragment key={index}>
                  <tr
                    className="hover:bg-cyan-900/20 cursor-pointer transition-colors bg-gray-800/50"
                    onClick={() => toggleParlay(index)}
                  >
                    <td
                      className={`px-6 py-4 relative after:absolute after:left-0 after:top-0 after:h-full after:w-1.5 ${
                        bet[0].status === "win"
                          ? "after:bg-green-500 after:shadow-green-500/50"
                          : bet[0].status === "active"
                          ? "after:bg-cyan-500 after:shadow-cyan-500/50"
                          : "after:bg-red-500 after:shadow-red-500/50"
                      } after:shadow-lg`}
                    >
                      <div className="flex items-center text-cyan-300 font-medium">
                        <span>[Sistem {bet.length - 1} meča]</span>
                        <svg
                          className={`ml-2 w-4 h-4 transform transition-transform ${
                            openParlayIndex === index ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">-</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-cyan-300">
                        {bet[0].totalOdds}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-100 font-medium">
                      {bet[0].stake}
                    </td>
                    <td
                      onClick={() => openEditor(bet)}
                      className={`px-6 py-4 font-medium cursor-pointer transition-all ${
                        bet[0].status === "loss"
                          ? "text-red-400 hover:text-red-300 bg-red-900/30"
                          : bet[0].status === "active"
                          ? "text-cyan-400 hover:text-cyan-300 bg-cyan-900/30"
                          : "text-green-400 hover:text-green-300 bg-green-900/30"
                      } rounded-md whitespace-nowrap`}
                    >
                      {bet[0].status}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {bet[0].date}
                    </td>
                    <td className="px-4 py-4"></td>
                  </tr>

                  {openParlayIndex === index &&
                    bet.map(
                      (parlayGame, parlayIndex) =>
                        parlayIndex > 0 && (
                          <tr
                            key={parlayIndex}
                            className="bg-gray-850/80 text-sm border-l-4 border-gray-700"
                          >
                            <td className="px-8 py-3 whitespace-nowrap text-gray-300">
                              <div className="flex items-center">
                                <svg
                                  className="w-3 h-3 mr-2 text-gray-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                  />
                                </svg>
                                {parlayGame.match}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-gray-400">
                              {parlayGame.tip}
                            </td>
                            <td className="px-6 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700/50 text-gray-300">
                                {parlayGame.odds}
                              </span>
                            </td>
                            <td colSpan="3"></td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => removeBet(parlayGame)}
                                className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-gray-700/50"
                                aria-label="Delete"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        )
                    )}
                </React.Fragment>
              )
            )
          )}
        </tbody>
      </table>

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
