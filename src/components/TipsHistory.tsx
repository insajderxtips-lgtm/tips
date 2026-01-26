import { useEffect, useState, useMemo } from "react";

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

export default function TipsHistory() {
  const [activeFilter, setActiveFilter] = useState<"all" | "fudbal" | "kosarka" | "tenis">("all");
  const [tipStats, setTipStats] = useState<Bet[]>([]);
  const [expandedGroups, setExpandedGroups] = useState({ free: true, premium: true });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Bet; direction: "asc" | "desc" } | null>({
    key: "date",
    direction: "desc",
  });

  useEffect(() => {
    fetch("/tipStats").then((res) => res.json().then((json) => setTipStats(json)));
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}.`;
  };

  const requestSort = (key: keyof Bet) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const sortedBets = useMemo(() => {
    let items = [...tipStats];
    if (sortConfig !== null) {
      items.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [tipStats, sortConfig]);

  const filtered = sortedBets.filter(b => activeFilter === "all" || b.sport === activeFilter);
  const premiumBets = filtered.filter(b => b.grupa === "premium");
  const freeBets = filtered.filter(b => b.grupa === "free");

  const getGroupStats = (bets: Bet[]) => {
    const wins = bets.filter(b => b.status === "win").length;
    const wr = bets.length > 0 ? ((wins / bets.length) * 100).toFixed(1) : "0";
    return { wins, wr };
  };

  const totalStats = {
    profit: tipStats.reduce((sum, b) => sum + Number(b.profit), 0),
    total: tipStats.length
  };

  const TableSection = ({ title, bets, type }: { title: string; bets: Bet[]; type: "free" | "premium" }) => {
    const { wins, wr } = getGroupStats(bets);
    return (
      <div className="mb-3">
        <button
          onClick={() => setExpandedGroups(p => ({ ...p, [type]: !p[type] }))}
          className="w-full flex items-center justify-between p-3 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-xl hover:bg-slate-800/60 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${type === "premium" ? "bg-purple-500 shadow-[0_0_10px_#a855f7]" : "bg-cyan-500 shadow-[0_0_10px_#06b6d4]"}`} />
            <h3 className="text-sm font-black uppercase tracking-tight text-white italic">{title}</h3>
            <div className="flex gap-2 ml-2 text-[10px] font-bold uppercase tracking-widest">
              <span className="text-emerald-400">Pobeda: {wins}</span>
              <span className="text-slate-500">|</span>
              <span className="text-cyan-400">WR: {wr}%</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Total: {bets.length}</span>
            </div>
          </div>
          <span className={`text-slate-500 transition-transform ${expandedGroups[type] ? "rotate-180" : ""}`}>▼</span>
        </button>

        {expandedGroups[type] && (
          <div className="mt-1 overflow-x-auto rounded-xl border border-white/5 bg-slate-950/20">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-white/5">
                <tr>
                  {["meč", "tip", "kvota", "status", "profit", "datum"].map((h) => (
                    <th key={h} onClick={() => requestSort(h as any)} className="px-4 py-2 text-left text-[9px] font-black text-slate-500 uppercase cursor-pointer hover:text-white">
                      {h} {sortConfig?.key === h && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bets.map((bet) => (
                  <tr key={bet.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2 text-xs font-bold text-white">{bet.match}</td>
                    <td className="px-4 py-2 text-xs font-mono font-bold text-cyan-400">{bet.tip}</td>
                    <td className="px-4 py-2 text-xs font-mono text-slate-300">{Number(bet.odds).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[9px] font-black uppercase ${bet.status === "win" ? "text-emerald-400" : "text-rose-400"}`}>
                        {bet.status === "win" ? "prolaz" : "gubitan"}
                      </span>
                    </td>
                    <td className={`px-4 py-2 text-xs font-black ${Number(bet.profit) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {Number(bet.profit) >= 0 ? "+" : ""}{Number(bet.profit).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-[10px] font-mono text-slate-500">{formatDate(bet.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto px-4 py-6 w-full max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Naši rezultati</h1>
        </div>
        <div className="flex bg-slate-900/80 p-1 rounded-lg border border-white/5">
          {["all", "fudbal", "kosarka", "tenis"].map((f) => (
            <button key={f} onClick={() => setActiveFilter(f as any)} className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${activeFilter === f ? "bg-white text-black" : "text-slate-500 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <TableSection title="Premium Tipovi" bets={premiumBets} type="premium" />
      <TableSection title="Besplatni Tipovi" bets={freeBets} type="free" />
    </div>
  );
}