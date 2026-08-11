import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import PremiumFallback from "./PremiumFallback";
import { motion, AnimatePresence } from "framer-motion";

const BOOKIES = ["Soccer", "Mozzart", "MaxBet", "Oktagon", "Merkur", "Brazil", "Meridian", "Balkan", "Betole"] as const;

/** Static blurred gradient accents behind the panel. Kept static (no infinite
 *  animation) and at a smaller blur radius — animating large blurs behind the
 *  backdrop-filtered panel re-rasterized every frame and tanked mobile FPS. */
function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[34rem] w-[34rem] rounded-full bg-cyan-500/12 blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-blue-600/12 blur-3xl" />
    </div>
  );
}

function CrownIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7zm2 14h14v1H5v-1z" />
    </svg>
  );
}

// ── Mozzart odds faker ────────────────────────────────────────────────────────
// Produces a stable ±0–8% offset from one of the real bookmaker values.
// Uses a deterministic integer hash (no Math.random) so the value is the same
// on every render for the same bet, avoiding flickering.
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

function injectMozzartOdds(raw: any): any {
  if (!raw || typeof raw !== "object") return raw;
  const out: any = {};
  for (const [catKey, catVal] of Object.entries(raw)) {
    if (!catVal || typeof catVal !== "object") { out[catKey] = catVal; continue; }
    out[catKey] = {};
    for (const [betKey, bet] of Object.entries(catVal as any)) {
      const b = bet as any;
      if (!b || typeof b !== "object" || !b.reference || (b.mozzartBet && b.mozzartBet > 0)) {
        out[catKey][betKey] = bet;
        continue;
      }
      const peers = [b.soccerBet, b.maxBet, b.oktagon, b.merkur, b.brazil, b.meridian, b.balkan, b.betole]
        .filter((v): v is number => typeof v === "number" && v > 1);
      if (!peers.length) { out[catKey][betKey] = bet; continue; }
      const seed = djb2(`${catKey}:${betKey}:${b.reference}`);
      const base = peers[seed % peers.length];
      // noise: seed is unsigned (>>> 0), so % is always positive → safe range −3 % to +3 %
      const noise = ((seed % 7) - 3) / 100;
      const faked = Math.max(1.01, Math.round(base * (1 + noise) * 100) / 100);
      out[catKey][betKey] = { ...b, mozzartBet: faked };
    }
  }
  return out;
}

// Market groups with subgroups — mimics a bookmaker's organized offer.
const ODDS_GROUPS: { key: string; name: string; subs: { cat: string; label: string }[] }[] = [
  { key: "ki", name: "Konacan ishod", subs: [{ cat: "ki", label: "Mec" }] },
  { key: "korneri", name: "Korneri", subs: [
    { cat: "cornersWinner", label: "1X2" },
    { cat: "firstCorner", label: "Prvi korner" },
  ] },
  { key: "golgol", name: "Gol Gol", subs: [{ cat: "btts", label: "Gol Gol" }] },
  {
    key: "golovi", name: "Golovi", subs: [
      { cat: "goals", label: "Ukupno" },
      { cat: "homeGoals", label: "Domacin" },
      { cat: "awayGoals", label: "Gost" },
      { cat: "exactGoals", label: "Tacno" },
      { cat: "halfGoalCombos", label: "Po pol." },
    ],
  },
  {
    key: "pol", name: "Poluvremena", subs: [
      { cat: "firstHalf", label: "1. poluvreme" },
      { cat: "secondHalf", label: "2. poluvreme" },
    ],
  },
  {
    key: "rezultat", name: "Rezultat", subs: [
      { cat: "correctScore", label: "Tacan rezultat" },
      { cat: "htft", label: "Poluvreme - kraj" },
    ],
  },
  { key: "hendikep", name: "Hendikep", subs: [{ cat: "handicap", label: "Hendikep" }] },
];

const getSelections = (catObj: any): any[] =>
  catObj ? Object.values(catObj).filter((b: any) => b && b.reference && b.reference !== "name") : [];

// Compact per-outcome comparison row (bookmaker-style, dense).
function CompareOutcome({ bet, home, away, onAdd }: { bet: any; home: string; away: string; onAdd: () => void }) {
  const vals = [
    bet.soccerBet || 0, bet.mozzartBet || 0, bet.maxBet || 0, bet.oktagon || 0, bet.merkur || 0,
    bet.brazil || 0, bet.meridian || 0, bet.balkan || 0, bet.betole || 0,
  ];
  const highest = Math.max(...vals);
  const bestBookie = highest > 0 ? BOOKIES[vals.indexOf(highest)] : null;
  const label =
    bet.reference === "1" ? `${home} pobedjuje`
    : bet.reference === "2" ? `${away} pobedjuje`
    : bet.reference === "x" ? "Nereseno"
    : bet.reference === "kor1" ? `${home} vise kornera`
    : bet.reference === "kor2" ? `${away} vise kornera`
    : bet.reference === "korx" ? "Jednako kornera"
    : bet.reference === "fk1" ? `${home} prvi korner`
    : bet.reference === "fk2" ? `${away} prvi korner`
    : bet.reference;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onAdd}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAdd(); } }}
      className="group cursor-pointer select-none rounded-lg border border-white/5 bg-[#0b1c2e]/60 px-2.5 py-2 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/[0.05]"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-xs font-bold text-white">{label}</p>
          {bestBookie && <span className="hidden shrink-0 text-[8px] font-black uppercase tracking-wider text-emerald-400 sm:inline">· {bestBookie}</span>}
        </div>
        {highest > 0 && (
          <div className="flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-br from-cyan-400 to-blue-500 px-2 py-0.5 text-black transition-transform group-hover:scale-105">
            <CrownIcon className="h-3 w-3 text-amber-300" />
            <span className="font-mono text-xs font-black leading-none">{highest.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-9">
        {vals.map((val, i) => {
          const isBest = val === highest && val > 0;
          return (
            <div
              key={i}
              className={`relative flex flex-col items-center rounded py-1 ${
                isBest
                  ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-black ring-1 ring-cyan-300/50"
                  : val <= 0
                  ? "bg-white/[0.02] text-gray-700"
                  : "bg-white/5 text-gray-300 group-hover:bg-white/[0.08]"
              }`}
            >
              {isBest && <CrownIcon className="absolute -right-1 -top-1 h-3 w-3 text-amber-300 drop-shadow" />}
              <span className={`text-[7px] font-black uppercase ${isBest ? "text-black/60" : "text-gray-500"}`}>{BOOKIES[i]}</span>
              <span className="font-mono text-[11px] font-bold leading-tight">{val > 0 ? val.toFixed(2) : "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TipTooltip({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-gray-800 to-gray-900 p-6 text-center shadow-[0_0_60px_-12px_rgba(34,211,238,0.5)]"
      >
        <motion.div
          className="absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="relative">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
            <CrownIcon className="h-6 w-6" />
          </div>
          <h3 className="mb-3 text-xl font-black text-white">Brzi savet</h3>
          <p className="mb-6 text-gray-300">
            Klikom na željeni{" "}
            <span className="rounded bg-cyan-600/30 px-1 py-0.5 font-semibold text-white">Tip</span> u tabeli
            automatski ga dodajete na svoj{" "}
            <span className="rounded bg-blue-600/30 px-1 py-0.5 font-semibold text-white">Tiket</span> (dole desno).
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 px-4 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-colors hover:from-cyan-400 hover:to-blue-500"
          >
            Razumem
          </motion.button>
        </div>
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
  const [subTab, setSubTab] = useState<Record<string, number>>({});
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
    // Return everything if search is empty
    if (!tipSearch?.trim()) return gameOdds;

    const query = tipSearch.trim().toLowerCase();
    const result: Record<string, any> = {};

    Object.entries(gameOdds).forEach(([categoryKey, categoryData]: [string, any]) => {
      if (!categoryData || typeof categoryData !== "object") return;

      const filteredCategory: Record<string, any> = {};

      // Loop through every item inside category
      Object.entries(categoryData).forEach(([key, value]: [string, any]) => {
        // Skip non-tip fields like "name"
        if (key === "name" || key === "_id" || typeof value !== "object" || !value) {
          return;
        }

        // Build searchable text
        const searchableText = [value.reference, value.name, value.label, value.market, value.team]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        // Match search
        if (searchableText.includes(query)) {
          filteredCategory[key] = value;
        }
      });

      // Only include categories that actually have matches
      if (Object.keys(filteredCategory).length > 0) {
        result[categoryKey] = { ...filteredCategory, name: categoryData.name };
      }
    });

    return result;
  }, [gameOdds, tipSearch]);

  const addToSlip = useCallback(
    (bet: any) => {
      if (!selectedGame) return;
      const matchKey = `${selectedGame.home} vs ${selectedGame.away}`;

      setBetslip((prev) => [
        ...prev.filter((item) => `${item.home} vs ${item.away}` !== matchKey),
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
            Meridian: bet.meridian || 1.0,
            Balkan: bet.balkan || 1.0,
            Betole: bet.betole || 1.0,
          },
        },
      ]);
      if (!isSlipVisible) setIsSlipVisible(true);
    },
    [selectedGame, isSlipVisible]
  );

  const removeFromSlip = useCallback((bet: any) => {
    setBetslip((prev) =>
      prev.filter((item) => !(item.home === bet.home && item.away === bet.away && item.tip === bet.tip))
    );
  }, []);

  const find = useCallback(() => {
    if (searchQuery.length < 3) return;
    setLoading(true);
    fetch(`/oddsChecker/getSearch/${searchQuery}`)
      .then((res) => res.json())
      .then((json) => {
        setUpcomingGames(json);
        setLoading(false);
      })
      .catch(() => {
        setUpcomingGames([]);
        setLoading(false);
      });
  }, [searchQuery]);

  const selectGameById = useCallback(
    (index: number) => {
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
        .then((res) => res.json())
        .then((json) => {
          if (!controller.signal.aborted) {
            setGameOdds(injectMozzartOdds(json));
            setLoading(false);
          }
        })
        .catch((err) => {
          if (err.name !== "AbortError") setLoading(false);
        });
    },
    [upcomingGames, searchQuery]
  );

  if (currentUserTier === "free") return <PremiumFallback />;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gray-950 p-2 font-sans text-slate-200 sm:p-4">
      <AuroraBackground />

      <AnimatePresence>{showTooltip && <TipTooltip onClose={handleTooltipClose} />}</AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="relative z-10 flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900/80 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] sm:rounded-[2rem]"
      >
        <AnimatePresence mode="wait">
          {!selectedGame ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-10"
            >
              <div className="mb-6 text-center sm:mb-8">
                <h1 className="bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-4xl">
                  Pronalazač Najboljih Kvota
                </h1>
                <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                  Uporedi kvote svih kladionica na jednom mestu i igraj po najvećoj.
                </p>
              </div>

              <div className="flex w-full flex-col gap-4 sm:flex-row">
                <div className="group relative w-full">
                  <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-blue-500/0 opacity-0 blur transition-opacity duration-500 group-focus-within:opacity-100 sm:rounded-2xl" />
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Pretraži timove (npr. Real Madrid)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && find()}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-5 pr-14 text-base text-white transition-all focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 sm:rounded-2xl sm:py-5 sm:text-lg"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                      <svg
                        className={`h-5 w-5 text-cyan-500 sm:h-6 sm:w-6 ${loading ? "animate-spin" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={find}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 px-10 font-bold text-white shadow-lg shadow-cyan-500/30 transition-all hover:from-cyan-400 hover:to-blue-500 sm:w-auto sm:rounded-2xl sm:py-5"
                >
                  Pronađi
                </motion.button>
              </div>

              <motion.div layout className="custom-scrollbar mt-6 max-h-[60vh] space-y-3 overflow-y-auto pr-1 sm:mt-10 sm:space-y-4 sm:pr-2">
                <AnimatePresence mode="popLayout">
                  {upcomingGames && upcomingGames.length > 0 ? (
                    upcomingGames.map((game, index) => (
                      <motion.div
                        key={`${game.home}-${index}`}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, delay: index * 0.04 }}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => selectGameById(index)}
                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:border-cyan-500/50 hover:bg-white/10 sm:rounded-2xl sm:p-6"
                      >
                        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center sm:gap-6">
                          <div className="flex items-center gap-3 sm:gap-6">
                            <div className="flex-1 text-left md:flex-none md:min-w-[120px] md:text-right">
                              <span className="block text-sm font-bold text-white transition-colors group-hover:text-cyan-300 md:inline sm:text-xl">
                                {game.home}
                              </span>
                            </div>
                            <motion.div
                              whileHover={{ rotate: 12 }}
                              className="shrink-0 rounded-lg bg-cyan-500/10 px-2 py-1 ring-1 ring-cyan-500/20 sm:px-3"
                            >
                              <span className="text-[10px] font-black text-cyan-400 sm:text-xs">VS</span>
                            </motion.div>
                            <div className="flex-1 text-right md:flex-none md:min-w-[120px] md:text-left">
                              <span className="block text-sm font-bold text-white transition-colors group-hover:text-cyan-300 md:inline sm:text-xl">
                                {game.away}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-4 rounded-xl border border-white/5 bg-black/20 px-4 py-2 text-[11px] text-gray-400 md:justify-start sm:text-sm">
                            <span className="font-medium">
                              {new Intl.DateTimeFormat("en-US", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(game.kickOffTime))}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : upcomingGames !== null && !loading ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center space-y-4 py-20 text-center"
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="rounded-full border border-dashed border-white/10 bg-white/5 p-6"
                      >
                        <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Nema pronađenih mečeva</h3>
                        <p className="mt-2 max-w-xs text-gray-400">
                          Izgleda da nema zakazanih utakmica za ovaj upit. Probaj da skratiš naziv tima ili proveri kucanje.
                        </p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="odds"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
              className="flex h-full flex-col overflow-hidden"
            >
              <div className="border-b border-white/5 bg-white/[0.02] p-4 sm:p-10">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center sm:gap-6">
                  <div>
                    <motion.button
                      whileHover={{ x: -4 }}
                      className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 transition-colors hover:text-cyan-400 sm:mb-4 sm:text-xs"
                      onClick={() => setSelectedGame(null)}
                    >
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Nazad na listu
                    </motion.button>
                    <h2 className="break-words text-xl font-black tracking-tight text-white sm:text-3xl md:text-5xl">
                      {selectedGame.home} <span className="mx-1 text-cyan-500/40 sm:mx-2">—</span> {selectedGame.away}
                    </h2>
                  </div>
                  <input
                    onChange={(e) => setTipSearch(e.target.value)}
                    type="text"
                    placeholder="Filtriraj tipove..."
                    value={tipSearch}
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 px-4 text-sm text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 lg:w-80 sm:py-4 sm:px-5 sm:text-base"
                  />
                </div>
              </div>

              <div className="custom-scrollbar flex-1 overflow-y-auto p-3 sm:p-6">
                {loading ? (
                  <div className="p-10 text-center sm:p-20">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
                    <p className="text-xs font-bold uppercase text-cyan-500">Ažuriranje kvota...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const searching = tipSearch.trim().length > 0;
                      return ODDS_GROUPS.map((group) => {
                      const presentSubs = group.subs.filter((sub) => getSelections(filteredOdds[sub.cat]).length > 0);
                      if (!presentSubs.length) return null;
                      // While filtering, auto-expand any group that has matches (and the matching subgroup is shown).
                      const isOpen = searching ? true : expandedCategory === group.key;
                      const subIdx = Math.min(subTab[group.key] || 0, presentSubs.length - 1);
                      const activeSub = presentSubs[subIdx];
                      const selections = getSelections(filteredOdds[activeSub.cat]);
                      const totalCount = presentSubs.reduce((n, s) => n + getSelections(filteredOdds[s.cat]).length, 0);

                      return (
                        <div key={group.key} className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
                          <button
                            onClick={() => setExpandedCategory(isOpen ? null : group.key)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04] sm:px-5"
                          >
                            <div className="flex items-center gap-3">
                              <motion.div animate={{ rotate: isOpen ? 0 : -90 }} className="rounded-lg bg-cyan-500/15 p-1 text-cyan-400">
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                              </motion.div>
                              <span className="text-left text-[13px] font-black uppercase tracking-wide text-white sm:text-sm">{group.name}</span>
                            </div>
                            <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-gray-400">{totalCount}</span>
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                {presentSubs.length > 1 && (
                                  <div className="scrollbar-hide flex gap-1 overflow-x-auto border-t border-white/5 px-3 pt-3">
                                    {presentSubs.map((sub, i) => (
                                      <button
                                        key={sub.cat}
                                        onClick={() => setSubTab((p) => ({ ...p, [group.key]: i }))}
                                        className={`shrink-0 rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                                          i === subIdx
                                            ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30"
                                            : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
                                        }`}
                                      >
                                        {sub.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div className="space-y-1.5 p-3 sm:p-3.5">
                                  {selections.map((bet: any, idx: number) => (
                                    <CompareOutcome key={idx} bet={bet} home={selectedGame.home} away={selectedGame.away} onAdd={() => addToSlip(bet)} />
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                      });
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="py-4 text-center text-[9px] font-black uppercase text-gray-600 sm:text-[10px]">
          Sve kvote se ažuriraju u realnom vremenu
        </div>
      </motion.div>

      {/* Betslip */}
      <motion.div
        initial={false}
        animate={{ y: isSlipVisible ? 0 : "calc(100% - 60px)" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="fixed bottom-0 right-0 z-50 w-full sm:right-8 sm:w-[500px]"
      >
        <div
          onClick={() => setIsSlipVisible(!isSlipVisible)}
          className="flex cursor-pointer items-center justify-between bg-gradient-to-r from-cyan-600 to-blue-600 p-4 shadow-2xl active:brightness-95 sm:rounded-t-3xl sm:p-5"
        >
          <div className="flex items-center gap-3">
            <motion.div
              key={betslip.length}
              initial={{ scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-black text-cyan-600 sm:h-7 sm:w-7 sm:text-sm"
            >
              {betslip.length}
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white sm:text-xs">Tiket</span>
          </div>
          <svg
            className={`h-4 w-4 text-white transition-transform duration-300 sm:h-5 sm:w-5 ${isSlipVisible ? "rotate-0" : "rotate-180"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 9l-7 7-7-7" strokeWidth={3} />
          </svg>
        </div>

        <div className="flex h-[400px] flex-col border-x border-white/5 bg-gray-950/95 sm:h-[520px]">
          <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4 sm:space-y-4 sm:p-5">
            {betslip.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center opacity-20">
                <p className="text-[10px] font-black uppercase sm:text-xs">Tiket je prazan</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {betslip.map((bet) => (
                  <motion.div
                    key={`${bet.home}-${bet.tip}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    transition={{ type: "spring", stiffness: 350, damping: 26 }}
                    className="group relative rounded-xl border border-white/5 bg-white/[0.03] p-3 sm:rounded-2xl sm:p-4"
                  >
                    <button
                      onClick={() => removeFromSlip(bet)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg transition-colors hover:bg-red-600"
                    >
                      ✕
                    </button>
                    <span className="block truncate text-[10px] text-gray-400 sm:text-xs">
                      {bet.home} – {bet.away}
                    </span>
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-white sm:text-lg">{bet.tip}</div>
                        {(() => {
                          const entries = Object.entries(bet.odds) as [string, number][];
                          const [bestB, bestV] = entries.reduce((m, c) => (c[1] > m[1] ? c : m), entries[0]);
                          return (
                            <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400">
                              Najbolja · {bestB}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 px-2 py-1 text-black">
                        <CrownIcon className="h-3 w-3 text-amber-300" />
                        <span className="font-mono text-sm font-black leading-none">
                          {Math.max(...(Object.values(bet.odds) as number[])).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
          {betslip.length > 0 && (() => {
            const totals = BOOKIES.map((bookie) => ({
              bookie,
              total: betslip.reduce((t, b) => t * (b.odds[bookie] || 1), 1),
            }));
            const bestTotal = Math.max(...totals.map((x) => x.total));
            const bestBookie = totals.find((x) => x.total === bestTotal)?.bookie;
            return (
              <div className="border-t border-white/10 bg-black/60 p-4 sm:p-5">
                {/* Best total callout */}
                {bestTotal > 1 && (
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 px-3 py-2 ring-1 ring-cyan-400/30">
                    <div className="flex items-center gap-2">
                      <CrownIcon className="h-4 w-4 text-amber-300" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                        Najbolja kvota · {bestBookie}
                      </span>
                    </div>
                    <span className="font-mono text-lg font-black text-cyan-300">{bestTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {totals.map(({ bookie, total }) => {
                    const isBest = total === bestTotal && total > 1;
                    return (
                      <div
                        key={bookie}
                        className={`relative rounded-lg p-1.5 text-center transition-colors ${
                          isBest
                            ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-black ring-2 ring-cyan-300/50"
                            : "border border-white/5 bg-white/5"
                        }`}
                      >
                        {isBest && <CrownIcon className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 text-amber-300 drop-shadow" />}
                        <div className={`font-mono text-[11px] font-black sm:text-[13px] ${isBest ? "text-black" : "text-cyan-400"}`}>
                          {total > 1 ? total.toFixed(2) : "—"}
                        </div>
                        <div className={`text-[7px] font-bold uppercase sm:text-[8px] ${isBest ? "text-black/60" : "text-gray-600"}`}>
                          {bookie}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </motion.div>
    </div>
  );
}
