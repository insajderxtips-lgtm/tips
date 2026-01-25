import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";

type BetWrapper = {
  bet: any; // single bet object OR parlay object (bet.type === "parlay")
  monthIndex: number;
  dayIndex: number;
  idxInDay: number;
  key: string;
};

export default function UserBets({
  bets, // optional - if you already normalized bets elsewhere
  userStats,
  setUserStats,
  removeBet: propRemoveBet,
  saveChanges: propSaveChanges,
}: {
  bets?: any;
  userStats: any;
  setUserStats: any;
  removeBet?: (b: any) => Promise<void>;
  saveChanges?: () => Promise<void>;
}) {
  const [openParlayKey, setOpenParlayKey] = useState<string | null>(null);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  const [editor, setEditor] = useState<any>({
    visible: false,
    parlay: false,
    bet: null,
    newStatus: "active",
    editorStatus: null,
  });

  const JWT = typeof window !== "undefined" ? localStorage.getItem("insajder_token") || "" : "";

  const toggleParlay = (key: string) => setOpenParlayKey(openParlayKey === key ? null : key);
  const toggleMonth = (monthYear: string) => setOpenMonths((s) => ({ ...s, [monthYear]: !s[monthYear] }));

  // Build groups from userStats.monthlyStats preserving parlay objects
  const groupedBets = useMemo(() => {
    const groups: Record<string, BetWrapper[]> = {};

    // If consumer passed in `bets` directly (already normalized), use that path:
    if (Array.isArray(bets) && bets.length > 0) {
      // assume bets are top-level bet objects or parlay objects
      bets.forEach((b: any, i: number) => {
        const dateStr = b?.date || "Nepoznat";
        const parts = (dateStr + "").split("/");
        const month = parts[0] ? parseInt(parts[0], 10) - 1 : new Date().getMonth();
        const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
        const monthYear = isNaN(month) || isNaN(year)
          ? "Nepoznat Datum"
          : new Date(year, month, 1).toLocaleString("sr-Latn", { month: "long", year: "numeric" });

        if (!groups[monthYear]) groups[monthYear] = [];
        groups[monthYear].push({ bet: b, monthIndex: month, dayIndex: 0, idxInDay: i, key: `${monthYear}-${i}` });
      });

      return groups;
    }

    if (!userStats?.statistics?.monthlyStats) return groups;

    userStats.statistics.monthlyStats.forEach((monthObj: any, monthIndex: number) => {
      const monthLabel = monthObj?.month || new Date(new Date().getFullYear(), monthIndex, 1).toLocaleString("sr-Latn", { month: "long", year: "numeric" });
      if (!groups[monthLabel]) groups[monthLabel] = [];

      const days = Array.isArray(monthObj?.bets) ? monthObj.bets : [];

      days.forEach((dayBets: any, dayIndex: number) => {
        if (!Array.isArray(dayBets)) return; // skip null days
        dayBets.forEach((betObj: any, idxInDay: number) => {
          // push the bet object as-is (parlay stays a single object with .games)
          groups[monthLabel].push({
            bet: betObj,
            monthIndex,
            dayIndex,
            idxInDay,
            key: `${monthIndex}-${dayIndex}-${idxInDay}`,
          });
        });
      });
    });

    return groups;
  }, [bets, userStats]);

  // Editor helpers
  const openEditor = (wrapped: BetWrapper) => {
    const isParlay = wrapped.bet?.type === "parlay";
    const main = wrapped.bet;
    setEditor({
      visible: true,
      parlay: isParlay,
      bet: wrapped,
      newStatus: main?.status || "active",
      editorStatus: null,
    });
  };
  const closeEditor = () => setEditor((s) => ({ ...s, visible: false, bet: null, editorStatus: null }));

  // If caller passed removeBet/saveChanges, use them; otherwise no-op or minimal server calls:
  const removeBet = propRemoveBet
    ? propRemoveBet
    : async (wrapped: BetWrapper) => {
        try {
          const bet = wrapped.bet;
          const betId = bet?.betId || bet?.parlayId || bet?._id;
          if (!betId) return;
          await fetch("/removeBet", {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + JWT },
            body: JSON.stringify({ betId }),
          });
          // optimistic UI update: remove from local state
          setUserStats((prev: any) => {
            if (!prev?.statistics) return prev;
            const next = structuredClone(prev);
            const monthly = next.statistics.monthlyStats?.[wrapped.monthIndex];
            if (!monthly?.bets) return next;
            const day = monthly.bets[wrapped.dayIndex];
            if (!Array.isArray(day)) return next;
            monthly.bets[wrapped.dayIndex] = day.filter((b: any, i: number) => i !== wrapped.idxInDay);
            return next;
          });
        } catch (err) {
          console.error("removeBet error", err);
        }
      };

  const saveChanges = propSaveChanges
    ? propSaveChanges
    : async () => {
        // placeholder if the parent doesn't provide saveChanges
        console.warn("saveChanges not provided");
      };

  // Utilities for display
  const formatOdds = (b: any) => {
    if (!b) return "-";
    if (b.type === "parlay") {
      // parlay may store odds top-level, otherwise compute from games
      const oddsVal = b.odds ?? b.totalOdds;
      if (oddsVal) return Number(oddsVal).toFixed(2);
      if (Array.isArray(b.games)) {
        const prod = b.games.reduce((acc: number, g: any) => acc * Number(g.odds || 1), 1);
        return prod.toFixed(2);
      }
      return "-";
    }
    return Number(b.odds ?? 0).toFixed(2);
  };

  const getBetId = (b: any) => b?.betId || b?.parlayId || b?._id || null;

  return (
    <div className="relative max-h-[calc(100vh-200px)] overflow-auto select-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700/50">
      <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-sm">
              <tr>
                <th className="sticky left-0 z-20 bg-slate-900/80 py-4 pl-6 pr-4 text-left text-base font-semibold text-white">Meč</th>
                <th className="px-4 py-4 text-left text-base font-semibold text-white">Tip</th>
                <th className="px-4 py-4 text-left text-base font-semibold text-white">Kvota</th>
                <th className="px-4 py-4 text-left text-base font-semibold text-white">Ulog</th>
                <th className="px-4 py-4 text-left text-base font-semibold text-white">Status</th>
                <th className="px-4 py-4 text-left text-base font-semibold text-white">Datum</th>
                <th className="relative py-4 pl-4 pr-6"><span className="sr-only">Delete</span></th>
              </tr>
            </thead>

            <tbody>
              {Object.entries(groupedBets).map(([monthYear, monthBets]) => (
                <React.Fragment key={monthYear}>
                  <tr onClick={() => toggleMonth(monthYear)} className="bg-slate-900/70 cursor-pointer sticky top-[57px] z-[5] transition-colors hover:bg-slate-800">
                    <td colSpan={7} className="py-3 px-6 text-base font-bold text-white tracking-wider">
                      <div className="flex items-center gap-3">
                        <svg className={`h-5 w-5 transition-transform ${openMonths[monthYear] ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="capitalize">{monthYear}</span>
                        <span className="ml-auto text-sm font-normal text-slate-400">{monthBets.length} opklada</span>
                      </div>
                    </td>
                  </tr>

                  {openMonths[monthYear] && monthBets.map((wrapped: BetWrapper, idx: number) => {
                    const bet = wrapped.bet;
                    const isParlay = bet?.type === "parlay";
                    const main = bet;
                    const status = main?.status ?? "active";

                    const statusBorderClass = status === "win" ? "border-green-500" : status === "loss" ? "border-red-500" : "border-sky-500";
                    const statusBadgeClass = status === "win" ? "bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20" : status === "loss" ? "bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20" : "bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20";

                    // unique key for toggling
                    const uniqueKey = wrapped.key;

                    if (!isParlay) {
                      return (
                        <tr key={uniqueKey} className="transition-colors hover:bg-slate-800/40">
                          <td className={`whitespace-nowrap py-5 pl-6 pr-4 text-base font-medium text-white sticky left-0 bg-slate-900/50 border-l-4 ${statusBorderClass}`}>{bet.match}</td>
                          <td className="whitespace-nowrap px-4 py-5 text-base text-slate-400">{bet.tip}</td>
                          <td className="whitespace-nowrap px-4 py-5 text-base text-slate-400"><span className="inline-flex items-center rounded-lg bg-slate-700/60 px-2.5 py-1.5 text-sm font-semibold text-sky-300">{formatOdds(bet)}</span></td>
                          <td className="whitespace-nowrap px-4 py-5 text-base font-semibold text-white">{bet.stake ?? "-"}</td>
                          <td className="whitespace-nowrap px-4 py-5 text-base">
                            <button onClick={() => openEditor(wrapped)} className={`inline-flex items-center gap-x-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold ${statusBadgeClass}`}>{status === "active" && <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></div>}{status}</button>
                          </td>
                          <td className="whitespace-nowrap px-4 py-5 text-base text-slate-500">{bet.date}</td>
                          <td className="relative whitespace-nowrap py-5 pl-4 pr-6 text-right text-base font-medium">
                            <button onClick={() => removeBet(wrapped)} className="p-1 rounded-full text-slate-500 transition-colors hover:text-red-400 hover:bg-slate-800">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21..."/></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    // Parlay summary row
                    return (
                      <React.Fragment key={uniqueKey}>
                        <tr onClick={() => toggleParlay(uniqueKey)} className="cursor-pointer bg-slate-800/20 transition-colors hover:bg-slate-800/50">
                          <td className={`whitespace-nowrap py-5 pl-6 pr-4 text-base font-medium text-sky-300 sticky left-0 bg-slate-900/50 border-l-4 ${statusBorderClass}`}>
                            <div className="flex items-center gap-2">
                              <span>[Sistem {Array.isArray(bet.games) ? bet.games.length : "?"} meča]</span>
                              <svg className={`h-5 w-5 transition-transform ${openParlayKey === uniqueKey ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-4 py-5 text-base text-slate-500">-</td>

                          <td className="whitespace-nowrap px-4 py-5 text-base text-slate-400">
                            <span className="inline-flex items-center rounded-lg bg-slate-700/60 px-2.5 py-1.5 text-sm font-semibold text-sky-300">{formatOdds(bet)}</span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-5 text-base font-semibold text-white">{bet.stake ?? "-"}</td>

                          <td className="whitespace-nowrap px-4 py-5 text-base">
                            <button onClick={(e) => { e.stopPropagation(); openEditor(wrapped); }} className={`inline-flex items-center gap-x-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold ${statusBadgeClass}`}>
                              {status === "active" && <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></div>}{status}
                            </button>
                          </td>

                          <td className="whitespace-nowrap px-4 py-5 text-base text-slate-500">{bet.date}</td>

                          <td className="relative whitespace-nowrap py-5 pl-4 pr-6 text-right text-base font-medium">
                            <button onClick={(e) => { e.stopPropagation(); removeBet(wrapped); }} className="p-1 rounded-full text-slate-500 transition-colors hover:text-red-400 hover:bg-slate-800">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21..."/></svg>
                            </button>
                          </td>
                        </tr>

                        {/* expanded games */}
                        {openParlayKey === uniqueKey && Array.isArray(bet.games) && bet.games.map((g: any, gi: number) => (
                          <tr key={`${uniqueKey}-sub-${gi}`} className="transition-colors hover:bg-slate-800/40">
                            <td className="py-5 pl-12 pr-4 text-base font-medium text-white">{g.match}</td>
                            <td className="px-4 py-5 text-base text-slate-400">{g.tip}</td>
                            <td className="px-4 py-5 text-base text-slate-400"><span className="inline-flex items-center rounded-lg bg-slate-700/60 px-2.5 py-1.5 text-sm font-semibold text-sky-300">{Number(g.odds ?? 0).toFixed(2)}</span></td>
                            <td className="px-4 py-5 text-base font-semibold text-white">-</td>
                            <td className="px-4 py-5 text-base"><span className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-sm font-semibold ${g.status === "win" ? "bg-green-500/10 text-green-400 ring-1 ring-green-500/20" : g.status === "loss" ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/20" : "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20"}`}>{g.status ?? "active"}</span></td>
                            <td className="px-4 py-5 text-base text-slate-500">{g.date ?? bet.date}</td>
                            <td className="px-4 py-5"></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal (simple) */}
      {editor.visible &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-96 rounded-2xl bg-slate-900 p-6 text-white shadow-xl">
              <h2 className="text-xl font-bold mb-4">Ažuriraj Status</h2>
              <select value={editor.newStatus} onChange={(e) => setEditor((p) => ({ ...p, newStatus: e.target.value }))} className="rounded-md bg-slate-800 px-3 py-2 text-white w-full mb-4">
                <option value="active">Active</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={closeEditor} className="rounded-lg bg-gray-700 px-4 py-2 hover:bg-gray-600">Cancel</button>
                <button onClick={async () => { await saveChanges(); closeEditor(); }} className="rounded-lg bg-sky-500 px-4 py-2 hover:bg-sky-400">Save</button>
              </div>
              {editor.editorStatus && <p className="mt-2 text-sm text-slate-400">{editor.editorStatus}</p>}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
