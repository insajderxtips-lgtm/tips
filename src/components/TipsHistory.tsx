import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Bet = {
  id: string;
  match: string;
  tip: string;
  odds: number;
  stake: number;
  status: "win" | "loss";
  date: string;
  sport: "fudbal" | "kosarka" | "tenis";
  profit: number;
  grupa: "free" | "premium";
};

type SortConfig = { key: keyof Bet; direction: "asc" | "desc" } | null;

const FILTERS = ["sve", "fudbal", "kosarka", "tenis"] as const;
const COLUMNS = ["meč", "tip", "kvota", "status", "datum"] as const;

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}.`;
};

const getGroupStats = (bets: Bet[]) => {
  const wins = bets.filter((b) => b.status === "win").length;
  const wr = bets.length > 0 ? ((wins / bets.length) * 100).toFixed(1) : "0";
  return { wins, wr };
};

function TableSection({
  title,
  bets,
  type,
  isOpen,
  onToggle,
  sortConfig,
  onSort,
}: {
  title: string;
  bets: Bet[];
  type: "free" | "premium";
  isOpen: boolean;
  onToggle: () => void;
  sortConfig: SortConfig;
  onSort: (key: keyof Bet) => void;
}) {
  const { wins, wr } = getGroupStats(bets);
  const isPremium = type === "premium";

  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className="group flex w-full flex-col gap-3 rounded-xl border border-[#1a3050] bg-[#0b1628] p-3.5 transition-all hover:border-[#2a4d75] hover:bg-[#0b1c2e] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-2 w-2 rounded-full ${
              isPremium ? "bg-amber-400 shadow-[0_0_10px_#fbbf24]" : "bg-sky-500 shadow-[0_0_10px_#0ea5e9]"
            }`}
          />
          <h3 className="text-sm font-black uppercase italic tracking-tight text-white">{title}</h3>
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">{bets.length}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Win-rate bar */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#1a3050] sm:w-32">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${wr}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              />
            </div>
            <span className="font-mono text-xs font-black text-emerald-400">{wr}%</span>
          </div>
          <span className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:inline">
            {wins} pob.
          </span>
          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-slate-500">
            ▼
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-1 max-w-full overflow-x-auto rounded-xl border border-[#1a3050] bg-[#07131f]">
              <table className="min-w-[600px] divide-y divide-[#1a3050] lg:min-w-full">
                <thead className="bg-white/5">
                  <tr>
                    {COLUMNS.map((h) => (
                      <th
                        key={h}
                        onClick={() => onSort(h as keyof Bet)}
                        className="cursor-pointer px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500 transition-colors hover:text-white"
                      >
                        {h} {sortConfig?.key === h && (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a3050]">
                  {bets.map((bet) => (
                    <tr key={bet.id} className="transition-colors hover:bg-white/5">
                      <td className="px-4 py-2 text-xs font-bold text-white">{bet.match}</td>
                      <td className="px-4 py-2 font-mono text-xs font-bold text-blue-400">{bet.tip}</td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-300">{Number(bet.odds).toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase ${
                            bet.status === "win"
                              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20"
                          }`}
                        >
                          {bet.status === "win" ? "prolaz" : "gubitan"}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-[10px] text-slate-500">{formatDate(bet.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TipsHistory() {
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("sve");
  const [tipStats, setTipStats] = useState<Bet[]>([]);
  const [expandedGroups, setExpandedGroups] = useState({ free: false, premium: false });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "date", direction: "desc" });

  useEffect(() => {
    fetch("/tipStats").then((res) => res.json().then((json) => setTipStats(json)));
  }, []);

  const requestSort = (key: keyof Bet) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const sortedBets = useMemo(() => {
    const items = [...tipStats];
    if (sortConfig !== null) {
      items.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [tipStats, sortConfig]);

  const filtered = sortedBets.filter((b) => activeFilter === "sve" || b.sport === activeFilter);
  const premiumBets = filtered.filter((b) => b.grupa === "premium");
  const freeBets = filtered.filter((b) => b.grupa === "free");

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Učinak naših tipova
        </p>
        <div className="flex w-full overflow-x-auto rounded-lg border border-[#1a3050] bg-[#0b1628] p-1 sm:w-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-[10px] font-black uppercase transition-all sm:flex-none ${
                activeFilter === f ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow" : "text-slate-500 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <TableSection
        title="Premium Tipovi"
        bets={premiumBets}
        type="premium"
        isOpen={expandedGroups.premium}
        onToggle={() => setExpandedGroups((p) => ({ ...p, premium: !p.premium }))}
        sortConfig={sortConfig}
        onSort={requestSort}
      />
      <TableSection
        title="Besplatni Tipovi"
        bets={freeBets}
        type="free"
        isOpen={expandedGroups.free}
        onToggle={() => setExpandedGroups((p) => ({ ...p, free: !p.free }))}
        sortConfig={sortConfig}
        onSort={requestSort}
      />
    </div>
  );
}
