import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import PremiumFallback from "./PremiumFallback";
import { motion, AnimatePresence } from "framer-motion";

function TipTooltip({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md bg-gray-800 border-2 border-cyan-500 rounded-xl shadow-2xl p-6 text-center"
      >
        <h3 className="text-xl font-bold text-cyan-400 mb-3">Pomoć</h3>
        <p className="text-gray-200 mb-6">
          Klikom na željeni{" "}
          <span className="font-semibold text-white bg-cyan-600/30 px-1 py-0.5 rounded">Tip</span>{" "}
          u tabeli automatski ga dodajete na svoj{" "}
          <span className="font-semibold text-white bg-blue-600/30 px-1 py-0.5 rounded">Tiket</span>{" "}
          (dole desno).
        </p>
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-md shadow-cyan-500/20"
        >
          Razumem
        </button>
      </motion.div>
    </div>
  );
}

export default function BestOdds() {
  const currentUserTier = useSelector((state: RootState) => state.user.tier);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [upcomingGames, setUpcomingGames] = useState<any[] | null>(null);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [gameOdds, setGameOdds] = useState<any>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [betslip, setBetslip] = useState<any[]>([]);
  const [isSlipVisible, setIsSlipVisible] = useState(false);
  const [tipSearch, setTipSearch] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.title = "InsajderTips | Najbolje kvote";
    if (!localStorage.getItem("hasSeenOddsTooltip")) {
      setShowTooltip(true);
    }
  }, []);

  const handleTooltipClose = useCallback(() => {
    setShowTooltip(false);
    localStorage.setItem("hasSeenOddsTooltip", "true");
  }, []);

  const filteredOdds = useMemo(() => {
    if (!tipSearch) return gameOdds;
    const result: any = {};
    const query = tipSearch.toLowerCase();
    
    Object.keys(gameOdds).forEach((category) => {
      const categoryData = gameOdds[category];
      if (categoryData.name) {
        const filteredTips: any = {};
        Object.keys(categoryData).forEach((key) => {
          const tip = categoryData[key];
          if (tip?.reference && tip.reference.toLowerCase().includes(query)) {
            filteredTips[key] = tip;
          }
        });

        if (Object.keys(filteredTips).length > 0) {
          result[category] = { ...categoryData, ...filteredTips };
        }
      }
    });
    return result;
  }, [gameOdds, tipSearch]);

  const addToSlip = useCallback((bet: any) => {
    if (!selectedGame) return;
    const matchKey = `${selectedGame.home} vs ${selectedGame.away}`;
    
    setBetslip(prev => [
      ...prev.filter(item => `${item.home} vs ${item.away}` !== matchKey),
      {
        home: selectedGame.home,
        away: selectedGame.away,
        tip: bet.reference,
        odds: {
          MaxBet: bet.maxBet || 1.0,
          Mozzart: bet.mozzartBet || 1.0,
          Soccer: bet.soccerBet || 1.0,
          Oktagon: bet.oktagon || 1.0,
          Merkur: bet.merkur || 1.0,
          Brazil: bet.brazil || 1.0,
        },
      }
    ]);
    if (!isSlipVisible) setIsSlipVisible(true);
  }, [selectedGame, isSlipVisible]);

  const removeFromSlip = useCallback((bet: any) => {
    setBetslip(prev => prev.filter(item => 
      !(item.home === bet.home && item.away === bet.away && item.tip === bet.tip)
    ));
  }, []);

  const find = useCallback(() => {
    if (searchQuery.length < 3) return;
    setLoading(true);
    fetch(`/oddsChecker/getSearch/${searchQuery}`)
      .then(res => res.json())
      .then(json => {
        setUpcomingGames(json);
        setLoading(false);
      })
      .catch(() => {
        setUpcomingGames([]);
        setLoading(false);
      });
  }, [searchQuery]);

  const selectGameById = useCallback((index: number) => {
    if (!upcomingGames) return;
    const game = upcomingGames[index];
    if (!game) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setSelectedGame(game);
    setTipSearch("");

    fetch("/oddsChecker/getOdds/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        home: game.home,
        away: game.away,
        date: game.kickOffTime,
        soccerId: game.id,
        searchQuery,
        sport: game.sport,
      }),
    })
    .then(res => res.json())
    .then(json => {
      if (!controller.signal.aborted) {
        setGameOdds(json);
        setLoading(false);
      }
    })
    .catch(err => {
      if (err.name !== "AbortError") setLoading(false);
    });
  }, [upcomingGames, searchQuery]);

  if (currentUserTier === "free") return <PremiumFallback />;

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen p-2 sm:p-4 bg-gray-950 relative font-sans text-slate-200">
      <AnimatePresence>
        {showTooltip && <TipTooltip onClose={handleTooltipClose} />}
      </AnimatePresence>

      <div className="w-full max-w-6xl bg-gray-900/40 backdrop-blur-2xl border border-white/5 rounded-2xl sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        {!selectedGame ? (
          <div className="p-4 sm:p-10">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Pretraži timove (npr. Real Madrid)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && find()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-4 sm:py-5 pl-5 pr-14 text-base sm:text-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <svg className={`h-5 w-5 sm:h-6 sm:w-6 text-cyan-500 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button onClick={find} className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 sm:py-5 px-10 rounded-xl sm:rounded-2xl transition-all shadow-lg active:scale-95">
                Pronađi
              </button>
            </div>

            <motion.div 
              layout
              className="mt-6 sm:mt-10 space-y-3 sm:space-y-4 overflow-y-auto max-h-[60vh] pr-1 sm:pr-2 custom-scrollbar"
            >
              <AnimatePresence mode="popLayout">
                {upcomingGames && upcomingGames.length > 0 ? (
                  upcomingGames.map((game, index) => (
                    <motion.div 
                      key={`${game.home}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      onClick={() => selectGameById(index)} 
                      className="group bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 cursor-pointer transition-all hover:border-cyan-500/50"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                        <div className="flex items-center gap-3 sm:gap-6">
                          <div className="flex-1 md:flex-none md:min-w-[120px] text-left md:text-right">
                            <span className="text-white font-bold text-sm sm:text-xl block md:inline">{game.home}</span>
                          </div>
                          <div className="bg-cyan-500/10 rounded-lg px-2 sm:px-3 py-1 shrink-0">
                            <span className="text-cyan-400 text-[10px] sm:text-xs font-black">VS</span>
                          </div>
                          <div className="flex-1 md:flex-none md:min-w-[120px] text-right md:text-left">
                            <span className="text-white font-bold text-sm sm:text-xl block md:inline">{game.away}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-4 text-[11px] sm:text-sm text-gray-400 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                          <span className="font-medium">
                            {new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(game.kickOffTime))}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : upcomingGames !== null && !loading ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center space-y-4"
                  >
                    <div className="p-6 bg-white/5 rounded-full border border-dashed border-white/10">
                      <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Nema pronađenih mečeva</h3>
                      <p className="text-gray-400 max-w-xs mt-2">
                        Izgleda da nema zakazanih utakmica za ovaj upit. Probaj da skratiš naziv tima ili proveri kucanje.
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 sm:p-10 border-b border-white/5 bg-white/[0.02]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                <div>
                  <button className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-cyan-500 hover:text-cyan-400 mb-2 sm:mb-4 transition-colors" onClick={() => setSelectedGame(null)}>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Nazad na listu
                  </button>
                  <h2 className="text-xl sm:text-3xl md:text-5xl font-black text-white tracking-tight break-words">
                    {selectedGame.home} <span className="text-cyan-500/40 mx-1 sm:mx-2">—</span> {selectedGame.away}
                  </h2>
                </div>
                <input
                  onChange={(e) => setTipSearch(e.target.value)}
                  type="text"
                  placeholder="Filtriraj tipove..."
                  value={tipSearch}
                  className="w-full lg:w-80 bg-black/40 border border-white/10 rounded-xl py-3 sm:py-4 px-4 sm:px-5 text-sm sm:text-base text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* THE FIX: Added overflow-x-auto to this container and ensured table is scrollable */}
            <div className="flex-1 overflow-x-auto p-2 sm:p-8 custom-scrollbar">
              {loading ? (
                <div className="p-10 sm:p-20 text-center">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-cyan-500 font-bold uppercase text-xs">Ažuriranje kvota...</p>
                </div>
              ) : (
                <div className="min-w-[800px] inline-block w-full align-middle">
                  <div className="overflow-hidden rounded-xl border border-white/5 bg-black/10">
                    <table className="w-full text-xs sm:text-sm text-left table-fixed">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="w-[180px] sm:w-[220px] px-4 sm:px-6 py-4 sm:py-5 font-black text-gray-400 uppercase text-[9px] sm:text-[10px]">Market i Tip</th>
                          {["Soccer", "Mozzart", "MaxBet", "Oktagon", "Merkur", "Brazil"].map(b => (
                            <th key={b} className="px-1 sm:px-2 py-4 sm:py-5 text-center font-bold text-gray-500 text-[9px] sm:text-[10px] uppercase">{b}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {Object.keys(filteredOdds).map(category => (
                          <React.Fragment key={category}>
                            <tr onClick={() => setExpandedCategory(expandedCategory === category ? null : category)} className="bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer transition-colors">
                              <td colSpan={7} className="px-4 sm:px-6 py-3 sm:py-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <motion.div 
                                    animate={{ rotate: expandedCategory === category ? 0 : -90 }}
                                    className="p-1 rounded bg-cyan-500/20 text-cyan-500"
                                  >
                                    <svg className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                  </motion.div>
                                  <span className="font-black text-white uppercase text-[11px] sm:text-sm">{filteredOdds[category].name}</span>
                                </div>
                              </td>
                            </tr>
                            {expandedCategory === category && Object.values(filteredOdds[category]).map((bet: any, idx) => {
                              if (!bet.reference || bet.reference === "name") return null;
                              
                              const currentOddsValues = [
                                bet.soccerBet || 0, 
                                bet.mozzartBet || 0, 
                                bet.maxBet || 0, 
                                bet.oktagon || 0, 
                                bet.merkur || 0,
                                bet.brazil || 0,
                              ];
                              const highest = Math.max(...currentOddsValues);

                              return (
                                <motion.tr 
                                  key={idx} 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="group hover:bg-cyan-500/[0.02] transition-colors"
                                >
                                  <td className="px-4 sm:px-6 py-4 sm:py-5 cursor-pointer" onClick={() => addToSlip(bet)}>
                                    <div className="flex flex-col">
                                      <span className="text-white font-bold group-hover:text-cyan-400 transition-colors text-[11px] sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                        {bet.reference === "1" ? `${selectedGame.home} POBEĐUJE` : bet.reference === "2" ? `${selectedGame.away} POBEĐUJE` : bet.reference === "x" ? "NEREŠENO" : bet.reference}
                                      </span>
                                      <span className="text-[8px] sm:text-[9px] text-gray-500 uppercase font-black">Klikni za dodavanje</span>
                                    </div>
                                  </td>
                                  {currentOddsValues.map((val, i) => (
                                    <td key={i} className="px-1 sm:px-1.5 py-3 sm:py-4 text-center">
                                      <button
                                        disabled={val <= 0}
                                        onClick={() => addToSlip(bet)}
                                        className={`w-full max-w-[65px] sm:max-w-[80px] py-2 sm:py-3 rounded-lg font-mono font-bold text-[10px] sm:text-sm transition-all ${val === highest && val > 0 ? "bg-cyan-500 text-black shadow-lg scale-105" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
                                      >
                                        {val > 0 ? val.toFixed(2) : "—"}
                                      </button>
                                    </td>
                                  ))}
                                </motion.tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="text-center py-4 text-[9px] sm:text-[10px] font-black text-gray-600 uppercase">Sve kvote se ažuriraju u realnom vremenu</div>
      </div>

      <div className={`fixed bottom-0 right-0 sm:right-8 w-full sm:w-[500px] z-50 transition-all duration-500 ${isSlipVisible ? "translate-y-0" : "translate-y-[calc(100%-60px)] sm:translate-y-[calc(100%-70px)]"}`}>
        <div onClick={() => setIsSlipVisible(!isSlipVisible)} className="cursor-pointer bg-cyan-600 p-4 sm:p-5 sm:rounded-t-3xl flex items-center justify-between shadow-2xl active:bg-cyan-700">
          <div className="flex items-center gap-3">
            <div className="bg-white text-cyan-600 w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm">{betslip.length}</div>
            <span className="text-white font-black uppercase tracking-widest text-[10px] sm:text-xs">Tiket</span>
          </div>
          <svg className={`h-4 w-4 sm:h-5 sm:w-5 text-white transition-transform duration-300 ${isSlipVisible ? 'rotate-0' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth={3}/></svg>
        </div>

        <div className="bg-gray-950 border-x border-white/5 h-[400px] sm:h-[520px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4 custom-scrollbar">
            {betslip.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20"><p className="text-[10px] sm:text-xs uppercase font-black">Tiket je prazan</p></div>
            ) : (
              <AnimatePresence>
                {betslip.map((bet) => (
                  <motion.div 
                    key={`${bet.home}-${bet.tip}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="bg-white/[0.03] border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl relative group"
                  >
                    <button onClick={() => removeFromSlip(bet)} className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg hover:bg-red-600 transition-colors">✕</button>
                    <span className="text-[10px] sm:text-xs text-gray-400 block truncate">{bet.home} – {bet.away}</span>
                    <div className="text-white font-bold text-sm sm:text-lg">{bet.tip === "1" ? "1" : bet.tip === "2" ? "2" : bet.tip}</div>
                    <div className="text-right"><span className="text-[10px] sm:text-[11px] text-gray-500 font-mono">Max Kvota: {Math.max(...Object.values(bet.odds as any)).toFixed(2)}</span></div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
          {betslip.length > 0 && (
            <div className="p-4 sm:p-6 bg-black/60 border-t border-white/10">
              <div className="grid grid-cols-6 gap-1 sm:gap-2">
                {["Soccer", "Mozzart", "MaxBet", "Oktagon", "Merkur", "Brazil"].map(bookie => {
                  const total = betslip.reduce((t, b) => t * (b.odds[bookie] || 1), 1);
                  return (
                    <div key={bookie} className="p-1 sm:p-2 bg-white/5 rounded-lg border border-white/5 text-center">
                      <div className="text-[9px] sm:text-[13px] font-black text-cyan-400 font-mono">
                        {total > 1 ? total.toFixed(2) : "—"}
                      </div>
                      <div className="text-[6px] sm:text-[8px] uppercase font-bold text-gray-600">{bookie}</div>
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