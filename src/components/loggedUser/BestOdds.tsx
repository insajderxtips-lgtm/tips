import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import PremiumFallback from "./PremiumFallback";

// Component for the Modal/Tooltip
function TipTooltip({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-gray-800 border-2 border-cyan-500 rounded-xl shadow-2xl p-6 text-center transform scale-100 transition-transform duration-300">
        <h3 className="text-xl font-bold text-cyan-400 mb-3">Pomoć</h3>
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

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    document.title = "InsajderTips | Najbolje kvote";

    const hasSeenTooltip = localStorage.getItem("hasSeenOddsTooltip");
    if (!hasSeenTooltip) {
      setShowTooltip(true);
    }
  }, []);

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
    // Create a unique key for this match
    const matchKey = `${selectedGame.home} vs ${selectedGame.away}`;

    // Remove any existing tip for this same match
    setBetslip((prev) =>
      prev.filter((item) => {
        const itemMatchKey = `${item.home} vs ${item.away}`;
        return itemMatchKey !== matchKey;
      })
    );

    // Add the new tip
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
        },
      },
    ]);
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
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Server error: ${res.status} - ${text}`);
          }
          return res.json();
        })
        .then((json) => {
          setGameOdds(json);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Fetch error:", error);
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
    <div className="flex flex-col items-center justify-center w-full min-h-screen p-4 bg-gray-950 relative font-sans text-slate-200">
      {showTooltip && <TipTooltip onClose={handleTooltipClose} />}

      <div className="w-full max-w-6xl bg-gray-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        {!selectedGame ? (
          <div className="p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row gap-4 w-full relative group">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Pretraži timove..."
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") find();
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-6 pr-14 text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 hover:bg-white/10 transition-all duration-300"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <svg className="h-6 w-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={find}
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-5 px-10 rounded-2xl transition-all active:scale-95 shadow-lg shadow-cyan-900/20"
              >
                Pronađi
              </button>
            </div>

            <div className="mt-10 space-y-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
              {upcomingGames.map((game, index) => (
                <div
                  key={index}
                  onClick={() => selectGameById(index)}
                  className="group relative bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:border-cyan-500/50"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end min-w-[120px]">
                        <span className="text-white font-bold text-xl">{game.home}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-cyan-500/10 rounded-lg px-3 py-1">
                        <span className="text-cyan-400 text-xs font-black uppercase tracking-widest">VS</span>
                      </div>
                      <div className="flex flex-col items-start min-w-[120px]">
                        <span className="text-white font-bold text-xl">{game.away}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                      <svg className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">
                        {new Intl.DateTimeFormat("en-us", {
                          day: "2-digit",
                          month: "short",
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
          <div className="flex flex-col h-full">
            <div className="p-6 sm:p-10 border-b border-white/5 bg-white/[0.02]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <button
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-500 hover:text-cyan-400 transition-colors mb-4"
                    onClick={handleBackButtonClick}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Nazad na listu
                  </button>
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                    {selectedGame.home} <span className="text-cyan-500/40 mx-2">—</span> {selectedGame.away}
                  </h2>
                </div>
                <div className="relative w-full lg:w-80">
                  <input
                    onChange={(e) => setTipSearch(e?.target?.value)}
                    type="text"
                    placeholder="Filtriraj tipove (npr. Golovi)"
                    value={tipSearch}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-8 custom-scrollbar">
              {loading ? (
                <div className="p-20 text-center">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-cyan-500 font-bold uppercase tracking-widest text-xs">Ažuriranje kvota...</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/5 shadow-2xl bg-black/10">
                  <table className="min-w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-6 py-5 font-black text-gray-400 uppercase tracking-widest text-[10px]">Market i Tip</th>
                        {["Soccer", "Mozzart", "MaxBet", "Oktagon"].map((bookie) => (
                          <th key={bookie} className="px-4 py-5 text-center font-bold text-gray-500 text-[10px] uppercase tracking-widest">{bookie}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.keys(filteredOdds).map((category) => (
                        <React.Fragment key={category}>
                          <tr
                            onClick={() => toggleCategory(category)}
                            className="bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer transition-colors"
                          >
                            <td colSpan={6} className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-1 rounded bg-cyan-500/20 text-cyan-500 transition-transform duration-300 ${expandedCategory === category ? 'rotate-0' : '-rotate-90'}`}>
                                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <span className="font-black text-white uppercase tracking-tight">
                                  {filteredOdds[category].name}
                                </span>
                              </div>
                            </td>
                          </tr>

                          {expandedCategory === category &&
                            Object.values(filteredOdds[category]).map((bet, idx) => {
                              if (!bet.reference || bet.reference === "name") return null;

                              const odds = {
                                soccerBet: bet.soccerBet || 0,
                                mozzartBet: bet.mozzartBet || 0,
                                maxBet: bet.maxBet || 0,
                                oktagon: bet.oktagon || 0,
                              };
                              const highestOdd = Math.max(...Object.values(odds));

                              return (
                                <tr key={`${category}-${idx}`} className="group hover:bg-cyan-500/[0.02] transition-colors">
                                  <td
                                    onClick={() => addToSlip(bet)}
                                    className="px-6 py-5 cursor-pointer"
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-white font-bold text-base group-hover:text-cyan-400 transition-colors">
                                        {bet.reference === "1" ? (
                                          <>{selectedGame.home} POBEĐUJE</>
                                        ) : bet.reference === "2" ? (
                                          <>{selectedGame.away} POBEĐUJE</>
                                        ) : bet.reference?.toLowerCase() === "x" ? (
                                          <>NEREŠENO</>
                                        ) : (
                                          bet.reference
                                        )}
                                      </span>
                                      <span className="text-[9px] text-gray-500 group-hover:text-cyan-500/60 uppercase font-black tracking-widest transition-colors">
                                        {filteredOdds[category].name.toLowerCase().includes("golova") ? "UKUPNO GOLOVA" : "KLIKNI ZA DODAVANJE"}
                                      </span>
                                    </div>
                                  </td>

                                  {Object.entries(odds).map(([key, value]) => (
                                    <td key={key} className="px-2 py-4 text-center">
                                      <button
                                        disabled={value <= 0}
                                        onClick={() => addToSlip(bet)}
                                        className={`
                                          w-full max-w-[85px] py-3.5 rounded-xl font-mono font-bold text-sm transition-all
                                          ${value === highestOdd && value > 0 
                                            ? "bg-cyan-500 text-black shadow-[0_0_25px_rgba(6,182,212,0.3)] scale-105" 
                                            : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                                          }
                                          ${value <= 0 ? "opacity-10 cursor-not-allowed" : "cursor-pointer active:scale-90"}
                                        `}
                                      >
                                        {value > 0 ? value.toFixed(2) : "—"}
                                      </button>
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                  
                </div>
                
              )}
            </div>
            
          </div>
          
          
        )}
        <span className="text-center my-auto mb-6 font-bold">USKORO SVE KLADIONICE DOSTUPNE!</span>
      </div>

      {/* Floating Betslip */}
      <div
        className={`fixed bottom-0 right-0 sm:right-8 w-full sm:w-[420px] z-50 transition-all duration-500 ease-in-out ${
          isSlipVisible ? "translate-y-0" : "translate-y-[calc(100%-70px)]"
        }`}
      >
        <div 
          onClick={() => setIsSlipVisible(!isSlipVisible)}
          className="cursor-pointer bg-cyan-600 p-5 sm:rounded-t-3xl flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white text-cyan-600 w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm">
              {betslip.length}
            </div>
            <span className="text-white font-black uppercase tracking-widest text-xs">Pregled Tiketa</span>
          </div>
          <svg className={`h-5 w-5 text-white transition-transform duration-500 ${isSlipVisible ? 'rotate-0' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <div className="bg-gray-950 border-x border-white/5 h-[520px] flex flex-col shadow-2xl">
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {betslip.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-700">
                <svg className="w-12 h-12 mb-3 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-xs uppercase font-black tracking-tighter opacity-40">Dodajte tipove na vaš tiket</p>
              </div>
            ) : (
              betslip.map((bet, index) => (
                <div key={index} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl relative group hover:bg-white/[0.05] transition-all">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromSlip(bet); }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold shadow-lg"
                  >
                    ✕
                  </button>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">{bet.home} – {bet.away}</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-white font-bold text-lg leading-none">
                        {bet.tip === "1" ? `${bet.home} POBEĐUJE` : 
                         bet.tip === "2" ? `${bet.away} POBEĐUJE` : 
                         bet.tip?.toLowerCase() === "x" ? "NEREŠENO" : bet.tip}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-[11px] text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded">
                      Max: {Math.max(...Object.values(bet.odds)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {betslip.length > 0 && (
            <div className="p-6 bg-black/60 border-t border-white/10 backdrop-blur-md">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] block mb-4">Ukupne kvote po kladionicama</span>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(betslip[0].odds).map((bookie) => {
                  const totalOdds = betslip.reduce((total, bet) => total * (bet.odds[bookie] || 1), 1);
                  const maxTotal = Math.max(...Object.keys(betslip[0].odds).map((b) => betslip.reduce((total, bet) => total * (bet.odds[b] || 1), 1)));
                  const isBest = totalOdds === maxTotal && totalOdds > 1;
                  
                  return (
                    <div key={bookie} className={`p-2.5 rounded-xl border transition-all duration-300 ${isBest ? "bg-cyan-500/10 border-cyan-500/50" : "bg-white/5 border-transparent opacity-40"}`}>
                      <div className={`text-sm font-black font-mono leading-none mb-1 ${isBest ? "text-cyan-400" : "text-gray-400"}`}>
                        {totalOdds.toFixed(2)}
                      </div>
                      <div className="text-[8px] uppercase font-bold text-gray-600 truncate">{bookie}</div>
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