import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import PremiumFallback from "./PremiumFallback";

// Component for the Modal/Tooltip
function TipTooltip({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-gray-800 border-2 border-cyan-500 rounded-xl shadow-2xl p-6 text-center transform scale-100 transition-transform duration-300">
        <h3 className="text-xl font-bold text-cyan-400 mb-3">Pomoc</h3>
        <p className="text-gray-200 mb-6">
          Klikom na željeni{" "}
          <span className="font-semibold text-white bg-cyan-600/30 px-1 py-0.5 rounded">
            Tip
          </span>{" "}
          u tabeli automatski ga dodajete na svoj{" "}
          <span className="font-semibold text-white bg-blue-600/30 px-1 py-0.5 rounded">
            Tiket
          </span>{" "}
          (dole desno).
        </p>
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-md shadow-cyan-500/20"
        >
          Razumem
        </button>
      </div>
    </div>
  );
}

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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [betslip, setBetslip] = useState([]);
  const [isSlipVisible, setIsSlipVisible] = useState(false);
  const [tipSearch, setTipSearch] = useState(null);

  // --- NEW STATE FOR TOOLTIP ---
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    document.title = "InsajderTips | Najbolje kvote";

    // --- NEW LOGIC FOR TOOLTIP ---
    const hasSeenTooltip = localStorage.getItem("hasSeenOddsTooltip");
    if (!hasSeenTooltip) {
      setShowTooltip(true);
    }
  }, []);

  // --- NEW HANDLER TO DISMISS TOOLTIP AND SET LOCAL STORAGE ---
  const handleTooltipClose = () => {
    setShowTooltip(false);
    localStorage.setItem("hasSeenOddsTooltip", "true");
  };

  const filteredOdds = useMemo(() => {
    if (!tipSearch) return gameOdds;

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
            MaxBet: bet.maxBet || 1.0,
            Mozzart: bet.mozzartBet || 1.0,
            Soccer: bet.soccerBet || 1.0,
            Oktagon: bet.oktagon || 1.0,
            WinnerBet: bet.winnerbet || 1.0,
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

          if (!res.ok) {
            const responseText = await res.text();
            console.error(
              "Server returned error. Response text:",
              responseText
            );

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
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen p-4 bg-gray-950 relative font-sans">
      {/* --- RENDER TOOLTIP CONDITIONALLY --- */}
      {showTooltip && <TipTooltip onClose={handleTooltipClose} />}

      {/* Main Content Card */}
      <div className="w-full max-w-5xl bg-gray-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-3xl shadow-2xl shadow-cyan-500/10 flex flex-col">
        {/* Stage 1: Search for a Game */}
        {!selectedGame ? (
          <div className="p-6 sm:p-8">
            {/* Search Input and Button */}
            <div className="flex flex-col sm:flex-row gap-3 w-full relative group">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Pretraži meč po timovima"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  // --- ADDED onKeyDown HANDLER HERE ---
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      find();
                    }
                  }}
                  className="w-full bg-gray-800/60 border-2 border-gray-700 rounded-xl py-4 pl-6 pr-14 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 hover:border-gray-600 transition-all duration-300 shadow-inner"
                />
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
              <button
                onClick={find}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl shadow-cyan-500/20 hover:shadow-cyan-400/30 flex items-center justify-center gap-2"
              >
                <span>Pronađi</span>
              </button>
            </div>

            {/* Upcoming Games List */}
            <div className="mt-8 space-y-3 overflow-y-auto max-h-[65vh] pr-2 scrollbar-thin scrollbar-thumb-cyan-700/50 scrollbar-track-transparent">
              {upcomingGames.map((game, index) => (
                <div
                  key={index}
                  onClick={() => selectGameById(index)}
                  className="relative bg-gray-800/70 hover:bg-gray-800/90 border border-gray-700/50 rounded-2xl p-5 cursor-pointer shadow-lg transition-all duration-300 hover:border-cyan-500/30 hover:shadow-cyan-500/10  group"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 text-xl font-bold text-white">
                        <span>{game.home}</span>
                        <span className="px-2 py-1 text-xs bg-gray-700/50 rounded-md text-gray-300">
                          vs
                        </span>
                        <span>{game.away}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-300 border-t md:border-t-0 md:border-l border-gray-700 pt-3 md:pt-0 md:pl-6">
                      <svg
                        className="h-5 w-5 text-cyan-500"
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
                      <span>
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
          /* Stage 2: View Odds for a Selected Game */
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-cyan-500/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <button
                    className="flex items-center gap-2 text-sm text-cyan-300 hover:text-white transition-colors mb-2"
                    onClick={handleBackButtonClick}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      ></path>
                    </svg>
                    <span>Svi Mečevi</span>
                  </button>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {selectedGame.home}{" "}
                    <span className="text-cyan-400">vs</span>{" "}
                    {selectedGame.away}
                  </h2>
                </div>
                <div className="relative w-full sm:w-72">
                  <input
                    onChange={(e) => setTipSearch(e?.target?.value)}
                    type="text"
                    placeholder="Pronađi tip (npr. GG3+)"
                    value={tipSearch}
                    className="w-full bg-gray-800/60 border-2 border-gray-700 rounded-xl py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                  {tipSearch && (
                    <button
                      onClick={() => setTipSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-2xl"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Odds Table */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="p-10 text-center text-cyan-300 text-xl">
                  Učitavanje kvota...
                </div>
              ) : (
                <div className="max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-transparent border border-gray-700/50 rounded-lg shadow-inner shadow-gray-900">
                  <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-900/90 backdrop-blur-sm z-20 shadow-md">
                      <tr>
                        {[
                          "Tip",
                          "Soccer",
                          "Mozzart",
                          "MaxBet",
                          "Oktagon",
                          "WinnerBet",
                        ].map((header, idx) => (
                          <th
                            key={idx}
                            className={`px-6 py-4 font-extrabold tracking-wide ${
                              idx === 0
                                ? "text-left text-cyan-300 w-[15%]" // Reduced width for the 'Tip' column
                                : "text-center text-gray-300 w-auto"
                            }`}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {Object.keys(filteredOdds).map((category) => (
                        <React.Fragment key={category}>
                          {/* Category Header Row (Clickable) */}
                          <tr
                            onClick={() => toggleCategory(category)}
                            className="bg-gray-800/60 hover:bg-gray-800/80 cursor-pointer transition-colors"
                          >
                            <td colSpan={6} className="px-6 py-3">
                              <div className="flex items-center gap-3 font-bold text-lg text-cyan-300">
                                <svg
                                  className={`h-5 w-5 transform transition-transform duration-300 ${
                                    expandedCategory === category
                                      ? "rotate-0"
                                      : "-rotate-90"
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
                                <span>{filteredOdds[category].name}</span>
                              </div>
                            </td>
                          </tr>

                          {/* Bet Rows (Only visible when expanded) */}
                          {expandedCategory === category &&
                            Object.values(filteredOdds[category]).map(
                              (bet, idx) => {
                                if (!bet.reference || bet.reference === "name")
                                  return null;

                                const odds = {
                                  soccerBet: bet.soccerBet || 0,
                                  mozzartBet: bet.mozzartBet || 0,
                                  maxBet: bet.maxBet || 0,
                                  oktagon: bet.oktagon || 0,
                                  winner: bet.winnerbet || 0,
                                };
                                const highestOdd = Math.max(
                                  ...Object.values(odds)
                                );

                                return (
                                  <tr
                                    key={`${category}-${idx}`}
                                    className="bg-gray-900/20 hover:bg-gray-800/40 transition-colors"
                                  >
                                    {/* Bet Type Name */}
                                    <td
                                      onClick={() => addToSlip(bet)}
                                      className="px-6 py-3 font-medium text-gray-100 cursor-pointer hover:text-cyan-400 sticky left-0 bg-gray-900/60 transition-all border-r border-gray-700/50 z-10"
                                    >
                                      {bet.reference}
                                    </td>

                                    {/* Odds Values */}
                                    {Object.entries(odds).map(
                                      ([key, value]) => (
                                        <td
                                          key={key}
                                          className="px-6 py-3 text-center transition-colors"
                                        >
                                          <span
                                            className={`
                                                                    inline-block min-w-[55px] px-3 py-1 rounded-lg text-base font-mono font-bold transition-all duration-200 
                                                                    ${
                                                                      value ===
                                                                        highestOdd &&
                                                                      value > 0
                                                                        ? "bg-green-600/30 text-green-300 shadow-lg shadow-green-700/50 scale-105"
                                                                        : "text-gray-300 bg-gray-800/40"
                                                                    }
                                                                `}
                                          >
                                            {value > 0 ? (
                                              value.toFixed(2)
                                            ) : (
                                              <span className="text-gray-600/80 font-normal">
                                                -
                                              </span>
                                            )}
                                          </span>
                                        </td>
                                      )
                                    )}
                                  </tr>
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

      {/* Floating Bet Slip */}
      <div
        className={`fixed bottom-0 right-0 sm:right-4 w-full sm:w-96 z-40 transition-transform duration-500 ease-in-out ${
          isSlipVisible
            ? "translate-y-0"
            : "translate-y-[calc(100%-4rem)] sm:translate-y-[calc(100%-3.5rem)]"
        }`}
      >
        <button
          onClick={() => setIsSlipVisible(!isSlipVisible)}
          className="w-full py-3 sm:py-2.5 px-4 flex items-center justify-between bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 sm:rounded-t-xl shadow-lg"
        >
          <span className="text-white font-bold text-lg flex items-center gap-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              ></path>
            </svg>
            Tiket ({betslip.length})
          </span>
          <svg
            className={`h-6 w-6 text-white transform transition-transform duration-300 ${
              isSlipVisible ? "" : "rotate-180"
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
        <div className="bg-gray-900/80 backdrop-blur-xl border-x border-b border-cyan-500/20 sm:rounded-b-xl max-h-[70vh] flex flex-col">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {betslip.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Tiket je prazan.
              </div>
            ) : (
              betslip.map((bet, index) => (
                <div
                  key={index}
                  className="bg-gray-800/70 p-3 rounded-lg border border-gray-700/50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-cyan-300 text-sm">
                        {bet.home} vs {bet.away}
                      </p>
                      <p className="text-lg font-bold text-white mt-1">
                        {bet.tip}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromSlip(bet);
                      }}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {betslip.length > 0 && (
            <div className="border-t border-cyan-500/20 p-4 bg-gray-900/50">
              <p className="text-sm text-cyan-300 mb-2">
                Najbolja ukupna kvota:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {Object.keys(betslip[0].odds).map((bookie) => {
                  const totalOdds = betslip.reduce(
                    (total, bet) => total * (bet.odds[bookie] || 1),
                    1
                  );
                  const isBest =
                    totalOdds ===
                    Math.max(
                      ...Object.keys(betslip[0].odds).map((b) =>
                        betslip.reduce(
                          (total, bet) => total * (bet.odds[b] || 1),
                          1
                        )
                      )
                    );
                  return (
                    <div
                      key={bookie}
                      className={`p-2 rounded-md text-center ${
                        isBest
                          ? "bg-green-500/20 text-green-300"
                          : "bg-gray-800/50 text-gray-400"
                      }`}
                    >
                      <div className="font-mono text-base font-bold">
                        {totalOdds.toFixed(2)}
                      </div>
                      <div className="text-[0.65rem] opacity-80">{bookie}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
