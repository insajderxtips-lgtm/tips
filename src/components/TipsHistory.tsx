import { useEffect, useState } from "react";

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
  const [activeFilter, setActiveFilter] = useState<
    "all" | "fudbal" | "kosarka" | "tenis"
  >("all");
  const [tipStats, setTipStats] = useState([]);
  useEffect(() => {
    fetch("http://localhost:1337/tipStats").then((res) => {
      res.json().then((json) => {
        setTipStats([...json]);
      });
    });
  }, []);

  const filteredBets = tipStats.filter((bet) => {
    const sportMatch = activeFilter === "all" || bet.sport === activeFilter;
    return sportMatch;
  });

  const stats = {
    totalBets: tipStats.length,
    wins: tipStats.filter((b) => b.status === "win").length,
    losses: tipStats.filter((b) => b.status === "loss").length,
    profit: tipStats.reduce((sum, bet) => sum + bet.profit, 0),
    roi:
      tipStats.length > 0
        ? (tipStats.reduce((sum, bet) => sum + bet.profit, 0) /
            tipStats.reduce((sum, bet) => sum + bet.stake, 0)) *
          100
        : 0,
  };
  function getSportIcon(sport: string) {
    switch (sport) {
      case "fudbal":
        return "⚽";
      case "kosarka":
        return "🏀";
      case "tenis":
        return "🎾";
      default:
        return "";
    }
  }
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl">
      {/* Header with animated gradient */}
      <div className="flex flex-col md:flex-row  items-start md:items-center mb-8 gap-x-24 gap-y-2">
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
            Naše statistike
          </h1>
          <p className="text-gray-400/90 mt-1 text-sm md:text-base">
            Statistika tipova InsajderTips grupe
          </p>
          <div className="absolute -bottom-1 left-0 h-0.5 w-24 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full" />
        </div>

        {/* Enhanced filter chips */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 border border-gray-700/50 shadow-sm">
            {["all", "fudbal", "kosarka", "tenis"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={`px-3 py-1.5 rounded-lg text-xs md:text-sm capitalize transition-all duration-200 ${
                  activeFilter === filter
                    ? "bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-md"
                    : "text-gray-300 hover:bg-gray-700/50"
                }`}
              >
                {filter === "all"
                  ? "Svi sportovi"
                  : `${getSportIcon(filter)} ${filter}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Glowing stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Ukupno tipova"
          value={stats.totalBets}
          icon="📊"
          color="from-gray-600 to-gray-700"
          trend={stats.totalBets > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="Prolaz"
          value={stats.wins}
          icon="✅"
          color="from-green-600 to-emerald-700"
          trend="up"
        />
        <StatCard
          title="Pad"
          value={stats.losses}
          icon="❌"
          color="from-red-600 to-rose-700"
          trend="down"
        />
        <StatCard
          title="Procenat prolaza"
          value={`${((stats.wins / stats.totalBets) * 100 || 0).toFixed(1)}%`}
          icon="📈"
          color="from-purple-600 to-indigo-700"
          trend={stats.wins / stats.totalBets > 0.5 ? "up" : "down"}
        />
      </div>

      {/* Premium table with glass effect */}
      <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-2xl shadow-black/20 overflow-hidden">
        <div className="relative max-h-[calc(100vh-200px)] overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700/50 scrollbar-thumb-rounded-full">
          <table className="min-w-full divide-y divide-gray-700/50">
            <thead className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 sticky top-0 z-10">
              <tr>
                {[
                  "Meč",
                  "Sport",
                  "Tip",
                  "Kvota",
                  "Ulog",
                  "Status",
                  "Profit",
                  "Grupa",
                  "Datum",
                ].map((header, idx) => (
                  <th
                    key={idx}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-300/90 uppercase tracking-wider ${
                      idx === 0
                        ? "sticky left-0 bg-gradient-to-b from-gray-800/95 to-gray-900/95 z-20 rounded-tl-xl"
                        : idx === 8
                        ? "rounded-tr-xl"
                        : ""
                    }`}
                  >
                    <div className="flex items-center">
                      {header}
                      {idx > 1 && (
                        <svg
                          className="ml-1 h-3 w-3 text-gray-500 hover:text-cyan-400 transition-colors cursor-pointer"
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
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50 bg-gradient-to-b from-gray-900/50 to-gray-950/50">
              {filteredBets.length > 0 ? (
                filteredBets.map((bet) => (
                  <tr
                    key={bet.id}
                    className="hover:bg-gray-800/40 transition-colors duration-150 group"
                  >
                    <td className="px-4 py-3 whitespace-nowrap relative sticky left-0 bg-gradient-to-r from-gray-900/95 to-gray-800/95 group-hover:from-gray-800/95 group-hover:to-gray-700/95 z-10">
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="text-sm font-medium text-white flex items-center min-w-[120px]">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="truncate max-w-[150px]">
                          {bet.match}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center min-w-[80px]">
                        <span className="text-lg mr-2">
                          {getSportIcon(bet.sport)}
                        </span>
                        <span className="text-sm text-gray-300 capitalize hidden md:inline">
                          {bet.sport}
                        </span>
                        <span className="text-sm text-gray-300 capitalize md:hidden">
                          {bet.sport.slice(0, 3)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent min-w-[60px]">
                        {bet.tip}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-200 min-w-[50px]">
                        {bet.odds}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-200 min-w-[60px]">
                        {bet.stake}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border min-w-[70px] justify-center ${
                          bet.status === "win"
                            ? "bg-green-900/20 text-green-400 border-green-500/30"
                            : bet.status === "loss"
                            ? "bg-red-900/20 text-red-400 border-red-500/30"
                            : "bg-yellow-900/20 text-yellow-400 border-yellow-500/30"
                        }`}
                      >
                        {bet.status === "win"
                          ? "Prolaz"
                          : bet.status === "loss"
                          ? "Pad"
                          : "Čekanje"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium flex items-center min-w-[70px] ${
                          bet.profit >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {bet.profit >= 0 ? (
                          <svg
                            className="w-3 h-3 mr-1 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-3 h-3 mr-1 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                        {bet.profit >= 0 ? "+" : ""}
                        {bet.profit.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-400/90 min-w-[80px] truncate max-w-[100px]">
                        {bet.grupa}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-400/90 min-w-[90px]">
                        <span className="hidden md:inline">
                          {new Date(bet.date).toLocaleDateString("sr-RS", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="md:hidden">
                          {new Date(bet.date).toLocaleDateString("sr-RS", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg
                        className="w-12 h-12 mb-4 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-lg font-medium">
                        Nema pronađenih tipova
                      </p>
                      <p className="text-sm mt-1">
                        Promenite filtere da biste videli rezultate
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
