// src/components/loggedUser/Tips/RenderTips.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Info, AlertTriangle, BarChart2, Activity } from "lucide-react";

const RenderTips: React.FC<{ tier: "free" | "premium" }> = ({ tier }) => {
  const [currentTab, setCurrentTab] = useState<number | null>(null);

  const tips = [
    {
      league: "Premier League",
      date: "2025-11-03",
      tipTitle: "Manchester City vs Arsenal",
      tip: "Over 2.5 Goals",
      home: "Man City",
      away: "Arsenal",
      homeLogo:
        "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
      awayLogo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
      analysis:
        "Both sides have potent attacks and recent head-to-heads saw plenty of goals. Expect an open match.",
      type: "free",
    },
    {
      league: "Serie A",
      date: "2025-11-04",
      tipTitle: "Inter Milan vs Juventus",
      tip: "Inter to Win",
      home: "Inter",
      away: "Juventus",
      homeLogo:
        "https://upload.wikimedia.org/wikipedia/en/0/0c/Inter_Milan.svg",
      awayLogo:
        "https://upload.wikimedia.org/wikipedia/en/1/15/Juventus_FC_2017_logo.svg",
      analysis:
        "Inter are unbeaten in their last 10 home matches, while Juve have struggled on the road.",
      type: "premium",
    },
    {
      league: "La Liga",
      date: "2025-11-05",
      tipTitle: "Barcelona vs Real Madrid",
      tip: "Both Teams to Score",
      home: "Barcelona",
      away: "Real Madrid",
      homeLogo:
        "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
      awayLogo:
        "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
      analysis:
        "El Clásico rarely disappoints. Both sides are scoring freely this season.",
      type: "premium",
    },
  ];

  const filteredTips = tips.filter((t) => t.type === tier);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {filteredTips.map((tip, index) => {
        const open = currentTab === index;
        return (
          <div
            key={index}
            onClick={() => setCurrentTab(open ? null : index)}
            className={`relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 ${
              open
                ? "border-blue-500/40"
                : "border-gray-700/40 hover:border-blue-400/30"
            } p-5 rounded-xl cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl mb-6`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm uppercase tracking-wide text-gray-400">
                  {tip.league} • {tip.date}
                </span>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {tip.tipTitle}
                </h2>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  tip.type === "free"
                    ? "bg-blue-900/20 text-blue-400"
                    : "bg-orange-900/20 text-orange-300"
                }`}
              >
                {tip.type}
              </div>
            </div>

            {/* Short summary */}
            <div className="mt-3 flex justify-between items-center">
              <div className="text-gray-300">
                <span className="font-semibold">Tip:</span>{" "}
                <span className="text-green-400 font-bold">{tip.tip}</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <Star
                    key={i}
                    className="text-yellow-400 w-4 h-4 fill-yellow-400"
                  />
                ))}
              </div>
            </div>

            {/* Expanded view */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden mt-5"
                >
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/40">
                    {/* Match Info */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-center">
                        <img
                          src={tip.homeLogo}
                          alt={tip.home}
                          className="w-12 h-12 mx-auto"
                        />
                        <p className="text-gray-300 font-semibold mt-1">
                          {tip.home}
                        </p>
                      </div>
                      <div className="text-gray-500 text-sm">vs</div>
                      <div className="text-center">
                        <img
                          src={tip.awayLogo}
                          alt={tip.away}
                          className="w-12 h-12 mx-auto"
                        />
                        <p className="text-gray-300 font-semibold mt-1">
                          {tip.away}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-gray-400 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Activity size={16} /> Posed 55%
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart2 size={16} /> Sutevi 14–8
                      </div>
                      <div className="flex items-center gap-2">
                        <Info size={16} /> Forma: WWDLW
                      </div>
                    </div>

                    {/* Lineups */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="font-semibold text-blue-400 mb-1">
                          {tip.home} Lineup
                        </p>
                        <ul className="text-sm text-gray-400 space-y-1">
                          <li>Player A</li>
                          <li>Player B</li>
                          <li>Player C</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-cyan-400 mb-1">
                          {tip.away} Lineup
                        </p>
                        <ul className="text-sm text-gray-400 space-y-1">
                          <li>Player X</li>
                          <li>Player Y</li>
                          <li>Player Z</li>
                        </ul>
                      </div>
                    </div>

                    {/* Injuries */}
                    <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-2 text-red-400 font-semibold">
                        <AlertTriangle size={16} /> Povrede & Suspenzije
                      </div>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>Domaci: Player D (ankle) doubtful</li>
                        <li>Gost: Player Q (suspension)</li>
                      </ul>
                    </div>

                    {/* Tip Analysis */}
                    <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg p-4">
                      <p className="text-gray-200 text-sm leading-relaxed">
                        {tip.analysis}
                      </p>
                      <div className="mt-3 w-full bg-gray-700/40 h-3 rounded-full overflow-hidden">
                        <div className="bg-green-400 h-full w-[78%]" />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Confidence: 78%
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default RenderTips;
