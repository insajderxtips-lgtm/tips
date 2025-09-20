import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import PremiumFallback from "./PremiumFallback";

export default function BestOdds() {
  const currentUser = useSelector((state: RootState) => state.user);
  if (currentUser.tier === "free") {
    return <PremiumFallback />;
  }
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gameOdds, setGameOdds] = useState({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null); // State for tracking expanded categories
  const [betslip, setBetslip] = useState([]);
  const [isSlipVisible, setIsSlipVisible] = useState(false);
  const [tipSearch, setTipSearch] = useState(null);
  useEffect(() => {
    document.title = "InsajderTips | Najbolje kvote";
  }, []);

  const filteredOdds = useMemo(() => {
    if (!tipSearch) return gameOdds; // Return original if no search

    const result = {};

    Object.keys(gameOdds).forEach((category) => {
      const categoryData = gameOdds[category];

      if (categoryData.name) {
        const filteredTips = {};

        Object.keys(categoryData).forEach((key) => {
          const tip = categoryData[key];

          if (
            tip?.reference &&
            tip.reference.toLowerCase().includes(tipSearch.toLowerCase())
          ) {
            filteredTips[key] = tip;
          }
        });

        if (Object.keys(filteredTips).length > 0) {
          result[category] = {
            name: categoryData.name,
            ...filteredTips,
          };
        }
      }
    });

    return result;
  }, [gameOdds, tipSearch]);

  const addToSlip = (bet) => {
    const exists = betslip.some(
      (bet) => bet.home === selectedGame.home && bet.away === selectedGame.away
    );
    if (!exists) {
      setBetslip((prev) => [
        ...prev,
        {
          home: selectedGame.home,
          away: selectedGame.away,
          tip: bet.reference,
          odds: {
            MaxBet: bet.maxBet || 1.0, // Default to 1.0 if null

            Mozzart: bet.mozzartBet || 1.0,
            Soccer: bet.soccerBet || 1.0,
            Oktagon: bet.oktagon || 1.0,
          },
        },
      ]);
    }
  };
  const removeFromSlip = (bet) => {
    setBetslip((prev) =>
      prev.filter(
        (item) =>
          !(
            item.home === bet.home &&
            item.away === bet.away &&
            item.tip === bet.tip
          )
      )
    );
  };

  const find = () => {
    if (searchQuery && searchQuery.length >= 3) {
      fetch(`/oddsChecker/getSearch/${searchQuery}`, {
        method: "GET",
      })
        .then((res) => res.json())
        .then((json) => setUpcomingGames([...json]));
    }
  };

  const selectGameById = useCallback(
    (id: number) => {
      setLoading(true);
      const game = upcomingGames[id];

      fetch("/oddsChecker/getOdds/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          home: game.home,
          away: game.away,
          date: game.kickOffTime,
          soccerId: game.id,
          searchQuery: searchQuery,
          sport: game.sport,
        }),
      })
        .then(async (res) => {
          console.log("Server response status:", res.status);
          console.log(
            "Server response headers:",
            Object.fromEntries([...res.headers])
          );

          // First, check if response is OK
          if (!res.ok) {
            // Try to get the response text to see what the server actually returned
            const responseText = await res.text();
            console.error(
              "Server returned error. Response text:",
              responseText
            );

            // Try to parse as JSON, but if it fails, use the raw text
            try {
              const errorData = JSON.parse(responseText);
              console.error("Server error details (JSON):", errorData);
              throw new Error(
                `Server error: ${res.status} - ${
                  errorData.error || responseText
                }`
              );
            } catch (e) {
              console.error("Server returned non-JSON error:", responseText);
              throw new Error(`Server error: ${res.status} - ${responseText}`);
            }
          }

          // If response is OK, parse as JSON
          return res.json();
        })
        .then((json) => {
          console.log(json);
          setGameOdds(json);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Fetch error:", error);
          console.error(
            "Error fetching odds for game:",
            game.home,
            "vs",
            game.away
          );
          setLoading(false);
        });

      setSelectedGame(game);
    },
    [upcomingGames, searchQuery]
  );

  const handleBackButtonClick = () => setSelectedGame(null);

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category); // Toggle category visibility
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      <div className="max-w-4xl bg-gray-950 border  p-4 rounded-xl shadow-xl space-y-8 w-[90%] mx-auto">
        <div className="flex flex-col gap-3 w-full relative group">
          {/* Search Input */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Pretraga meča..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
        w-full bg-gray-800 border-2 border-gray-700/50
        rounded-xl py-4 px-6 text-lg text-white
        placeholder-gray-500
        focus:outline-none focus:border-cyan-400/50
        focus:ring-4 focus:ring-cyan-900/30
        hover:border-gray-600
        transition-all duration-300
        backdrop-blur-sm
        shadow-lg shadow-black/10
        group-hover:shadow-cyan-500/5
        pr-16
      `}
            />

            {/* Search Icon */}
            <svg
              className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500 group-focus-within:text-cyan-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Find Button */}
          <button
            onClick={find}
            className={`
      w-full bg-gradient-to-r from-cyan-500 to-blue-600
      hover:from-cyan-400 hover:to-blue-500
      text-white font-semibold
      py-4 px-8 rounded-xl
      transition-all duration-300
      hover:scale-[1.02] active:scale-[0.98]
      shadow-xl hover:shadow-2xl
      shadow-cyan-500/20 hover:shadow-cyan-500/30
      flex items-center justify-center gap-2
    `}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Pronađi
          </button>
        </div>

        {!selectedGame ? (
          <div className="space-y-4 overflow-y-auto max-h-[600px] p-4">
            <div className="space-y-3">
              {upcomingGames.map((game, index) => (
                <div
                  key={index}
                  onClick={() => selectGameById(index)}
                  className={`
        relative overflow-hidden
        bg-gradient-to-br from-gray-800/90 to-gray-900/80
        hover:from-gray-700/90 hover:to-gray-800/80
        border border-gray-700/50
        rounded-xl p-5 cursor-pointer
        shadow-lg shadow-black/10
        transition-all duration-300
        hover:shadow-cyan-500/10 hover:border-cyan-500/30
        hover:scale-[1.01] active:scale-[0.99]
        group
      `}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Teams */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {game.home}
                        </span>
                        <span className="px-2 py-1 bg-gray-700/50 text-sm rounded-md text-gray-300">
                          vs
                        </span>
                        <span className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {game.away}
                        </span>
                      </div>

                      {/* League name (if available) */}
                      {game.league && (
                        <p className="mt-1 text-sm text-gray-400">
                          {game.league}
                        </p>
                      )}
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-cyan-500/80"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-300">
                        {new Intl.DateTimeFormat("sr-RS", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(game.kickOffTime))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className=" w-full">
            <div className="flex w-full my-2">
              <button
                className="bg-gray-700 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition duration-200 ease-in-out cursor-pointer"
                onClick={handleBackButtonClick}
              >
                Nazad
              </button>
              {Object.keys(gameOdds).length > 0 && (
                <div className="relative flex items-center w-full ml-4">
                  <input
                    onChange={(e) => setTipSearch(e?.target?.value)}
                    type="text"
                    placeholder="Pronađi tip (Primer: 1&D2+, GG3+)"
                    value={tipSearch}
                    className="px-3 py-2 text-base placeholder-gray-500 text-white rounded-lg border w-full mr-1 pr-10"
                  />
                  {tipSearch && (
                    <button
                      onClick={() => setTipSearch("")}
                      className="absolute right-3 text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="text-3xl font-extrabold text-white mb-6 flex w-full justify-between items-center">
              {selectedGame.home} vs {selectedGame.away}
            </div>
            <div className=" mt-6 max-h-[600px] overflow-auto shadow-lg rounded-xl bg-gray-800">
              {loading ? (
                <div className="p-4 h-full w-full flex justify-center items-center loader">
                  Učitavanje kvota...
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto rounded-xl shadow-2xl shadow-cyan-900/20">
                  <table className="min-w-full bg-gray-900 backdrop-blur-sm border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="relative">
                        {["Tip", "Soccer", "Mozzart", "MaxBet", "Oktagon"].map(
                          (header, idx) => (
                            <th
                              key={idx}
                              className={`
              px-6 py-4 text-lg font-bold tracking-wide
              ${idx === 0 ? "text-cyan-400" : ""}
              ${idx === 1 ? "text-green-400" : ""}
              ${idx === 2 ? "text-orange-400" : ""}
              ${idx === 3 ? "text-green-300" : ""}
              bg-gray-900/80 backdrop-blur-sm
              border-b-2 border-gray-700
              hover:bg-gray-800/50 transition-colors duration-300
            `}
                            >
                              {header}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-700/50">
                      {Object.keys(filteredOdds).map((category) => (
                        <React.Fragment key={category}>
                          {/* Category Header Row */}
                          <tr
                            onClick={() => toggleCategory(category)}
                            className=" group cursor-pointer hover:bg-gray-800/40 transition-colors duration-200"
                          >
                            <td colSpan={4} className="px-6 py-4">
                              <div
                                className={`flex items-center space-x-3 ${
                                  expandedCategory === category
                                    ? "text-cyan-400"
                                    : "text-gray-200"
                                }`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`h-5 w-5 transform transition-all duration-300 ${
                                    expandedCategory === category
                                      ? "-rotate-90"
                                      : ""
                                  }`}
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-lg font-semibold tracking-tight">
                                  {filteredOdds[category].name}
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Content */}
                          {expandedCategory === category &&
                            Object.values(filteredOdds[category]).map(
                              (bet: any, idx) => {
                                const odds = {
                                  soccerBet: bet.soccerBet ?? 0,
                                  mozzartBet: bet.mozzartBet ?? 0,
                                  maxBet: bet.maxBet ?? 0,

                                  oktagon: bet.oktagon ?? 0,
                                };
                                const highestOdd = Math.max(
                                  ...Object.values(odds)
                                );

                                return (
                                  bet.reference &&
                                  bet.reference !== "name" && (
                                    <tr
                                      key={idx}
                                      className="hover:bg-gray-800/20 even:bg-gray-900/10  transition-colors duration-150"
                                    >
                                      <td
                                        onClick={() => addToSlip(bet)}
                                        className="px-6 py-3 text-center font-medium text-cyan-300 cursor-pointer sticky left-0  hover:bg-gray-800/70 bg-gray-800/50 backdrop-blur-sm z-10"
                                      >
                                        {bet.reference}
                                      </td>

                                      {Object.entries(odds).map(
                                        ([key, value]) => (
                                          <td
                                            key={key}
                                            className={`
                          px-6 py-3 text-center text-lg font-medium
                          ${
                            value === highestOdd
                              ? "bg-green-600/40 text-green-200"
                              : "text-gray-300"
                          }
                          transition-all duration-200
                        `}
                                          >
                                            <span className="inline-block min-w-[40px] px-2 py-1 rounded-md">
                                              {value || (
                                                <span className="text-gray-500">
                                                  -
                                                </span>
                                              )}
                                            </span>
                                          </td>
                                        )
                                      )}
                                    </tr>
                                  )
                                );
                              }
                            )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className={`absolute bottom-0 right-2 w-80`}>
        {/* Toggle Button (unchanged) */}
        <button
          onClick={() => setIsSlipVisible(!isSlipVisible)}
          className={`
      w-full  py-2 px-4 flex items-center justify-between
      bg-gray-800 hover:bg-gray-700 rounded-t-md
      border border-gray-700/50 border-b-0
      transition-colors duration-200
    `}
        >
          <span className="text-cyan-400 font-medium">
            Tiket ({betslip.length})
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 text-cyan-400 transform transition-transform duration-200 ${
              isSlipVisible ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Betslip Content */}
        {isSlipVisible && (
          <div className="bg-gray-900 rounded-b-md rounded-tl-md border border-gray-700/50">
            <div className="max-h-96 overflow-y-auto p-2 space-y-3">
              {betslip.length === 0 ? (
                <div className="text-center py-6 text-gray-500 italic">
                  Nema opklada. Dodajte opkladu tako sto pretrazite mec i
                  kliknete na tip.
                </div>
              ) : (
                <>
                  {betslip.map((bet, index) => (
                    <div
                      key={index}
                      className={`
                  relative overflow-hidden
                  bg-gradient-to-br from-gray-800/90 to-gray-900/80
                  border border-gray-700/50
                  rounded-xl p-4
                  shadow-lg shadow-black/10
                  transition-all duration-300
                  hover:shadow-cyan-500/10 hover:border-cyan-500/30
                  group
                `}
                    >
                      <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />

                      <div className="relative z-10">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-cyan-400">
                                {bet.home}
                              </span>
                              <span className="text-gray-400 text-xs">vs</span>
                              <span className="font-medium text-cyan-400">
                                {bet.away}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="px-2 py-1 bg-gray-700/50 text-xs rounded-md text-gray-300">
                                {bet.tip}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromSlip(bet);
                            }}
                            className={`
                        p-2 rounded-lg
                        text-gray-400 hover:text-red-400
                        hover:bg-gray-700/50
                        transition-all duration-200
                      `}
                            aria-label="Remove bet"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Odds Comparison - Minimalist Version */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {Object.entries(bet.odds).map(([bookie, odd]) => (
                            <div
                              key={bookie}
                              className={`text-xs px-2 py-1 rounded ${
                                odd === Math.max(...Object.values(bet.odds))
                                  ? "bg-green-900/30 text-green-400"
                                  : "bg-gray-800/30 text-gray-400"
                              }`}
                            >
                              {bookie}: <span className="font-mono">{odd}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Best Parlay Summary */}
                  <div className="sticky bottom-0  backdrop-blur-sm border-t border-gray-700 p-3 z-50">
                    <div className="text-sm text-cyan-400 mb-1">
                      Najveca kvota:
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-xs">
                      {Object.keys(betslip[0].odds).map((bookie) => {
                        const totalOdds = betslip.reduce(
                          (total, bet) => total * bet.odds[bookie],
                          1
                        );
                        const isBest =
                          totalOdds ===
                          Math.max(
                            ...Object.keys(betslip[0].odds).map((b) =>
                              betslip.reduce(
                                (total, bet) => total * bet.odds[b],
                                1
                              )
                            )
                          );

                        return (
                          <div
                            key={bookie}
                            className={`p-1 rounded text-center ${
                              isBest
                                ? "bg-green-900/40 text-green-300"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            <div className="font-mono text-sm">
                              {totalOdds.toFixed(2)}
                            </div>
                            <div className="text-[0.6rem] opacity-80">
                              {bookie}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
