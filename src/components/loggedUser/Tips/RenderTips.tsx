// src/components/loggedUser/Tips/RenderTips.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, AlertTriangle, BarChart2, Activity } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import PremiumFallback from "../PremiumFallback";

interface RenderTipsProps {
  tier: "free" | "premium";
}

const RenderTips: React.FC<RenderTipsProps> = ({ tier }) => {
  const currentUser = useSelector((state: RootState) => state.user);

  const [tips, setTips] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if user can view this tier
  const canViewPremium = tier !== "premium" || currentUser.tier === "premium";

  // Fetch tips with retries and abort support
  useEffect(() => {
    if (!canViewPremium) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setTips([]);
    setError(null);

    let attempt = 1;
    const maxAttempts = 3;

    const fetchTips = async () => {
      while (attempt <= maxAttempts) {
        try {
          const res = await fetch(`/tips/${tier}`, {
            signal,
            cache: "no-store",
          });
          if (!res.ok) {
            if (res.status === 404)
              throw new Error("Nije pronađen ni jedan tip.");
            throw new Error(`Fetch failed with status ${res.status}`);
          }
          const data = await res.json();
          if (!Array.isArray(data)) throw new Error("Invalid data format.");
          setTips(data);
          setError(null);
          setLoading(false);
          return;
        } catch (err: any) {
          if (err.name === "AbortError") return; // fetch aborted
          console.error(`Attempt ${attempt} failed: ${err.message}`);
          attempt++;
          if (attempt > maxAttempts) {
            setError(err.message);
            setTips([]);
            setLoading(false);
            return;
          }
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    };

    fetchTips();

    return () => abortControllerRef.current?.abort();
  }, [tier, canViewPremium]);

  // Conditionally render fallback if user cannot view premium
  if (!canViewPremium) {
    return <PremiumFallback pageType="tips" />;
  }

  if (loading)
    return (
      <div className="w-full text-center py-10 text-gray-400">
        Učitavanje tipova...
      </div>
    );

  if (error)
    return (
      <div className="w-full text-center py-10 text-red-400">
        Greška: {error}
      </div>
    );

  if (!tips.length)
    return (
      <div className="w-full text-center py-10 text-gray-400">
        Nema dostupnih tipova.
      </div>
    );

  // Helper to render form letters with colors
  const renderForm = (form: string | undefined) => {
    if (!form) return null;
    return (
      <div className="flex justify-center gap-1 mt-1">
        {form.split("").map((char, i) => {
          const color =
            char === "W"
              ? "text-green-400"
              : char === "L"
              ? "text-red-400"
              : "text-gray-400";
          return (
            <span key={i} className={`font-semibold ${color}`}>
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {tips.map((tip, index) => {
        const open = currentTab === index;

        return (
          <div
            key={tip._id?.$oid || index}
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
                  {tip.league} •{" "}
                  {new Date(tip.date).toLocaleDateString("sr-RS", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {tip.tipTitle || `${tip.home} vs ${tip.away}`}
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

            {/* Tip summary */}
            <div className="mt-3 flex justify-between items-center">
              <div className="text-gray-300">
                <span className="font-semibold">Tip:</span>{" "}
                <span className="text-green-400 font-bold">{tip.tip}</span>
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
                        {renderForm(tip.homeForm)}
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
                        {renderForm(tip.awayForm)}
                      </div>
                    </div>

                    {/* Lineups */}
                    {tip.lineups && (
                      <div className="flex justify-between gap-x-12 mb-4 max-w-[95%] mx-auto">
                        <div>
                          <p className="font-semibold text-blue-400 mb-1 text-center">
                            Postava
                          </p>
                          <ul className="text-sm text-gray-400 space-y-1 text-center">
                            {tip.lineups.home?.length ? (
                              tip.lineups.home.map((p: string, i: number) => (
                                <li key={i}>{p}</li>
                              ))
                            ) : (
                              <li>Nema podataka</li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-400 mb-1 text-center">
                            Postava
                          </p>
                          <ul className="text-sm text-gray-400 space-y-1 text-center">
                            {tip.lineups.away?.length ? (
                              tip.lineups.away.map((p: string, i: number) => (
                                <li key={i}>{p}</li>
                              ))
                            ) : (
                              <li>Nema podataka</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Injuries */}
                    {tip.injuries && (
                      <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2 text-red-400 font-semibold">
                          <AlertTriangle size={16} /> Povrede & Suspenzije
                        </div>
                        <ul className="text-sm text-gray-300 space-y-1">
                          {tip.injuries.home?.length ? (
                            tip.injuries.home.map((p: string, i: number) => (
                              <li key={i}>Domaći: {p}</li>
                            ))
                          ) : (
                            <li>Domaći: nema povreda</li>
                          )}
                          {tip.injuries.away?.length ? (
                            tip.injuries.away.map((p: string, i: number) => (
                              <li key={i}>Gosti: {p}</li>
                            ))
                          ) : (
                            <li>Gosti: nema povreda</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Tip Analysis */}
                    <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg p-4">
                      <p className="text-gray-200 text-sm leading-relaxed">
                        {tip.analysis || "Nema analize za ovaj tip."}
                      </p>
                      {tip.confidencePercent && (
                        <>
                          <div className="mt-3 w-full bg-gray-700/40 h-3 rounded-full overflow-hidden">
                            <div
                              className="bg-green-400 h-full"
                              style={{ width: `${tip.confidencePercent}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Sigurnost: {tip.confidencePercent}%
                          </p>
                        </>
                      )}
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
