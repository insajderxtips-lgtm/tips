import React, { useState } from "react";
import { createPortal } from "react-dom";

export default function UserBets({
  bets,
  readOnly,
  userStats,
  setUserStats,
}: {
  bets: any;
  readOnly: boolean;
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
  const closeEditor = () => {
    setEditor((prev) => ({ ...prev, bet: null, visible: false }));
  };
  const saveChanges = () => {
    // Saves the bet editor data to the server (updates it)
    // dokle sam stigao: passujemo state iz statistika u userbets da ga apdejtujemo lokalno, dole smo nasli lokalni bet i apdejtujemo status,
    // a sada u svakom pozivu servera cemo isto tako i lokalni stejt update isto kako i na serveru, optimizovati.

    const previousStatus = editor.parlay
      ? editor.bet[0].status
      : editor.bet.status;

    if (editor.newStatus && editor.newStatus !== previousStatus) {
      let updates = [];
      const stake = editor.parlay ? editor.bet[0].stake : editor.bet.stake;
      const odds = editor.parlay ? editor.bet[0].totalOdds : editor.bet.odds;
      const betId = editor.parlay ? editor.bet[0].parlayId : editor.bet.betId;
      const [betMonth, betDay] = (
        editor.parlay ? editor.bet[0].date : editor.bet.date
      )
        .split("/")
        .map(Number);
      const localBet = userStats?.monthlyStats[betMonth - 1].bets[
        betDay
      ].filter((bet) =>
        Array.isArray(bet) ? bet[0].parlayId === betId : bet.betId === betId
      );
      if (localBet.length > 0) {
        if (editor.parlay) {
          localBet[0][0].status = editor.newStatus;
        } else {
          localBet[0].status = editor.newStatus;
        }
      }

      const [month, day] = editor.parlay
        ? editor.bet[0].date.split("/")
        : editor.bet.date.split("/");

      const monthIndex = Math.max(0, month - 1); // Prevent negative indexes

      // Handle different status changes
      if (previousStatus === "active" && editor.newStatus === "win") {
        updates.push(
          {
            updatePath: `statistics.initialInvestment`,
            newValue: stake * odds,
            increment: true,
          },
          { updatePath: `statistics.totalWins`, newValue: 1, increment: true },
          {
            updatePath: `statistics.monthlyStats.${monthIndex}.totalWins`,
            newValue: 1,
            increment: true,
          }
        );
        setUserStats((prev) => {
          if (!prev || !prev.statistics) return prev;

          // Deep clone monthlyStats to avoid direct mutation
          const updatedMonthlyStats = [...prev.statistics.monthlyStats];

          // Update the specific month's totalWins
          updatedMonthlyStats[monthIndex] = {
            ...updatedMonthlyStats[monthIndex],
            totalWins: (updatedMonthlyStats[monthIndex]?.totalWins || 0) + 1,
          };

          return {
            ...prev,
            statistics: {
              ...prev.statistics,
              initialInvestment:
                prev.statistics.initialInvestment + stake * odds,
              totalWins: (prev.statistics.totalWins || 0) + 1, // Fixed: was incorrectly using initialInvestment
              monthlyStats: updatedMonthlyStats,
            },
          };
        });
      } else if (previousStatus === "active" && editor.newStatus === "loss") {
        updates.push(
          {
            updatePath: `statistics.totalLosses`,
            newValue: 1,
            increment: true,
          },
          {
            updatePath: `statistics.monthlyStats.${monthIndex}.totalLosses`,
            newValue: 1,
            increment: true,
          }
        );
        setUserStats((prev) => {
          if (!prev || !prev.statistics) return prev;

          // Clone monthlyStats to avoid direct mutation
          const updatedMonthlyStats = [...prev.statistics.monthlyStats];

          // Update the specific month's totalLosses
          updatedMonthlyStats[monthIndex] = {
            ...updatedMonthlyStats[monthIndex],
            totalLosses:
              (updatedMonthlyStats[monthIndex]?.totalLosses || 0) + 1,
          };

          return {
            ...prev,
            statistics: {
              ...prev.statistics,
              totalLosses: (prev.statistics.totalLosses || 0) + 1,
              monthlyStats: updatedMonthlyStats,
            },
          };
        });
      } else if (previousStatus === "win" && editor.newStatus === "loss") {
        updates.push(
          {
            updatePath: `statistics.initialInvestment`,
            newValue: -stake * odds,
            increment: true,
          },
          { updatePath: `statistics.totalWins`, newValue: -1, increment: true },
          {
            updatePath: `statistics.monthlyStats.${monthIndex}.totalWins`,
            newValue: -1,
            increment: true,
          },
          {
            updatePath: `statistics.totalLosses`,
            newValue: 1,
            increment: true,
          },
          {
            updatePath: `statistics.monthlyStats.${monthIndex}.totalLosses`,
            newValue: 1,
            increment: true,
          }
        );
        setUserStats((prev) => {
          if (!prev || !prev.statistics) return prev;

          // Create a deep clone of the state to avoid mutation
          const newState = JSON.parse(JSON.stringify(prev));

          // Apply updates to match server behavior
          newState.statistics.initialInvestment -= stake * odds;
          newState.statistics.totalWins = Math.max(
            0,
            newState.statistics.totalWins - 1
          );
          newState.statistics.totalLosses += 1;

          // Update monthly stats if the month exists
          if (newState.statistics.monthlyStats[monthIndex]) {
            newState.statistics.monthlyStats[monthIndex].totalWins = Math.max(
              0,
              newState.statistics.monthlyStats[monthIndex].totalWins - 1
            );
            newState.statistics.monthlyStats[monthIndex].totalLosses += 1;
          }

          return newState;
        });
      } else if (previousStatus === "loss" && editor.newStatus === "win") {
        updates.push(
          {
            updatePath: `statistics.initialInvestment`,
            newValue: stake * odds,
            increment: true,
          },
          {
            updatePath: `statistics.totalLosses`,
            newValue: -1,
            increment: true,
          },
          { updatePath: `statistics.totalWins`, newValue: 1, increment: true },
          {
            updatePath: `statistics.monthlyStats.${monthIndex}.totalWins`,
            newValue: 1,
            increment: true,
          },
          {
            updatePath: `statistics.monthlyStats.${monthIndex}.totalLosses`,
            newValue: -1,
            increment: true,
          }
        );
        setUserStats((prev) => {
          if (!prev || !prev.statistics) return prev;

          // Deep clone the state (simple approach)
          const newState = JSON.parse(JSON.stringify(prev));

          // Apply all updates to match server behavior
          newState.statistics.initialInvestment += stake * odds;
          newState.statistics.totalWins += 1;
          newState.statistics.totalLosses = Math.max(
            0,
            newState.statistics.totalLosses - 1
          ); // Prevent negatives

          // Update monthly stats if month exists
          if (newState.statistics.monthlyStats[monthIndex]) {
            newState.statistics.monthlyStats[monthIndex].totalWins += 1;
            newState.statistics.monthlyStats[monthIndex].totalLosses = Math.max(
              0,
              newState.statistics.monthlyStats[monthIndex].totalLosses - 1
            );
          }

          return newState;
        });
      }

      // Update monthly profit
      updates.push({
        updatePath: `statistics.monthlyStats.${monthIndex}.monthlyProfit`,
        newValue:
          editor.newStatus === "loss" || editor.newStatus === "active"
            ? -Number(stake)
            : Number(stake * odds),
        increment: true,
      });

      // First, update statistics
      fetch("http://localhost:1337/updateStatistics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
        body: JSON.stringify({ updates }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(() => {
          // Then, update the actual bet status
          return fetch("http://localhost:1337/updateBet", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + JWT,
            },
            body: JSON.stringify({
              bet: {
                betId: editor.parlay
                  ? editor.bet[0].parlayId
                  : editor.bet.betId,
                date: editor.parlay ? editor.bet[0].date : editor.bet.date,
                newStatus: editor.newStatus,
                isParlay: editor.parlay,
              },
            }),
          });
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(() => {
          setEditor((prev) => ({
            ...prev,
            bet: prev.parlay
              ? [{ ...prev.bet[0], status: editor.newStatus }]
              : { ...prev.bet, status: editor.newStatus },
            newStatus: "", // Clear newStatus after updating
          }));
        })
        .catch((error) => {
          console.error("Error updating bet:", error);
        });
    } else {
      setEditor((prev) => ({
        ...prev,
        editorStatus: "Ovaj status je trenutni status.",
      }));
    }
  };

  const removeBet = async (bet) => {
    try {
      const isParlay = Array.isArray(bet); // Check if it's a parlay
      const month = isParlay
        ? bet[0].date.split("/")[0]
        : bet.date.split("/")[0]; // Extract month
      const day = isParlay ? bet[0].date.split("/")[1] : bet.date.split("/")[1]; // Extract day

      const requestBody = {
        updates: [
          {
            updatePath: `statistics.monthlyStats.${month - 1}.bets.${day}`,
            newValue: isParlay ? bet[0].parlayId : bet.betId, // Either the parlay ID or single bet ID
            delete: true, // Trigger deletion
            increment: false,
            push: false,
          },
        ],
      };

      const response = await fetch("http://localhost:1337/updateStatistics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const result = await response.json();
      console.log("Bet deleted:", result);

      // ✅ Update local state: Remove bet from UI after successful deletion
      setEditor((prev) => ({
        ...prev,
        bet: isParlay
          ? prev.bet.filter((b) => b.parlayId !== bet[0].parlayId) // Remove entire parlay
          : {}, // If single bet, reset bet object
      }));
    } catch (error) {
      console.error("Error removing bet:", error);
    }
  };

  return (
    <div className="overflow-x-auto select-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700/50">
      <table className="bg-blue-500  w-full  bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700/40 rounded-xl shadow-xl shadow-black/30">
        <thead className="bg-gray-900/80 backdrop-blur-sm sticky top-0">
          <tr className="border-b-2 border-cyan-500/30">
            <th className="px-5 py-3 text-left text-white-400 font-bold text-sm md:text-base">
              Meč
            </th>
            <th className="px-5 py-3 text-left text-white-400 font-bold text-sm md:text-base">
              Kvota
            </th>
            <th className="px-5 py-3 text-left text-white-400 font-bold text-sm md:text-base">
              Ulog
            </th>
            <th className="px-5 py-3 text-left text-white-400 font-bold text-sm md:text-base">
              Status
            </th>
            <th className="px-5 py-3 text-left text-white-400 font-bold text-sm md:text-base">
              Datum
            </th>
            <th className="px-5 py-3 text-left text-white-400 font-bold text-sm md:text-base">
              Ažuriraj
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-700/40">
          {bets?.map((bet, index) =>
            !Array.isArray(bet) ? (
              <tr
                key={index}
                className="hover:bg-gray-700/10 transition-colors duration-200 group"
              >
                <td
                  className={`px-5 py-3 relative after:absolute after:left-0 after:top-0 after:h-full after:w-2 ${
                    bet.status === "win"
                      ? "after:bg-green-500"
                      : bet.status === "active"
                      ? "after:bg-gray-500"
                      : "after:bg-red-500"
                  }`}
                >
                  <span className="text-gray-300 group-hover:text-cyan-400 transition-colors">
                    {bet.match}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-200 font-mono">
                  {bet.odds}
                </td>
                <td className="px-5 py-3 text-gray-200 font-mono">
                  {bet.stake}
                </td>
                <td
                  className={`px-5 py-3 font-semibold ${
                    bet.status === "loss"
                      ? "text-red-400 bg-red-900/20"
                      : bet.status === "active"
                      ? "text-cyan-400 bg-cyan-900/20"
                      : "text-green-400 bg-green-900/20"
                  } rounded-lg`}
                >
                  {bet.status}
                </td>
                <td className="px-5 py-3 text-gray-400">{bet.date}</td>
                <td className="px-5 py-3">
                  {!readOnly && (
                    <button
                      onClick={() => openEditor(bet)}
                      className="p-2 hover:bg-cyan-500/20 rounded-md transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-5 md:size-6 text-cyan-400 hover:text-cyan-300"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                        />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              bet[0] && (
                <React.Fragment key={index}>
                  <tr
                    className="hover:bg-cyan-900/10 cursor-pointer transition-colors"
                    onClick={() => toggleParlay(index)}
                  >
                    <td
                      className={`px-5 py-3 text-cyan-300 relative after:absolute after:left-0 after:top-0 after:h-full after:w-2 ${
                        bet[0].status === "win"
                          ? "after:bg-green-500"
                          : bet[0].status === "active"
                          ? "after:bg-gray-500"
                          : "after:bg-red-500"
                      }`}
                    >
                      [Sistem {bet.length - 1} meča]
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {bet[0].totalOdds}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {bet[0].stake}
                    </td>
                    <td
                      className={`px-5 py-3 whitespace-nowrap font-semibold ${
                        bet[0].status === "loss"
                          ? "text-red-500 rounded-md bg-red-900/20"
                          : bet[0].status === "active"
                          ? "text-gray-400"
                          : "text-green-500 bg-green-900/20 rounded-md"
                      }`}
                    >
                      {bet[0].status}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {bet[0].date}
                    </td>
                    <td
                      className="px-5 py-3 flex items-center"
                      onClick={() => openEditor(bet)}
                    >
                      <button className="p-2 hover:scale-110 transition-transform">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-5 md:size-6 text-amber-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  {openParlayIndex === index &&
                    bet.map(
                      (parlayGame, parlayIndex) =>
                        parlayIndex > 0 && (
                          <tr
                            key={parlayIndex}
                            className="border-b text-sm md:text-base bg-gray-750"
                          >
                            <td className="px-5 py-3 whitespace-nowrap">
                              {parlayGame.match} - {parlayGame.tip}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap text-gray-400">
                              Opklada iz sistema.
                            </td>
                            <td colSpan="4"></td>
                          </tr>
                        )
                    )}
                </React.Fragment>
              )
            )
          )}
        </tbody>
      </table>

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
                      {editor.bet.status}
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
