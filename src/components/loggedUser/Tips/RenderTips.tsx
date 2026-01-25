import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ShieldCheck, Star, Zap, AlertTriangle, Loader2, Trophy, Users, SearchX } from "lucide-react";
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const canViewPremium = tier !== "premium" || currentUser.tier === "premium";

  useEffect(() => {
    if (!canViewPremium) return;
    
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchTips = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/tips/${tier}`, { signal, cache: "no-store" });
        
        if (res.status === 404) {
          setTips([]);
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error("Server error");
        
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const filtered = data.filter(tip => tip.type === tier);
          setTips(filtered);
        } else {
          setTips([]);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTips();
    return () => abortControllerRef.current?.abort();
  }, [tier, canViewPremium]);

  const renderForm = (form: string | undefined) => {
    if (!form) return <span className="text-[9px] text-slate-700 font-black">N/A</span>;
    return (
      <div className="flex gap-1 justify-center lg:justify-start">
        {form.split("").map((char, i) => (
          <span key={i} className={`text-[10px] font-black ${char === "W" ? "text-emerald-400" : char === "L" ? "text-red-500" : "text-slate-500"}`}>
            {char}
          </span>
        ))}
      </div>
    );
  };

  if (!canViewPremium) return <PremiumFallback pageType="tips" />;

  if (loading) return (
    <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Učitavanje...</p>
    </div>
  );

  if (tips.length === 0) return (
    <div className="w-full py-32 flex flex-col items-center justify-center text-center">
      <SearchX className="w-12 h-12 text-slate-800 mb-4" />
      <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Trenutno nema dostupnih tipova</h3>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 10px; }
      `}</style>

      {tips.map((tip, index) => {
        const isOpen = currentTab === index;
        const hasLineups = tip.lineups?.home?.length > 0 && tip.lineups?.away?.length > 0;

        return (
          <motion.div
            key={tip._id || index}
            layout
            className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 ${
              isOpen ? "bg-slate-900 border-cyan-500/30 shadow-2xl" : "bg-slate-900/40 border-white/5"
            }`}
          >
            <div onClick={() => setCurrentTab(isOpen ? null : index)} className="p-6 md:p-8 cursor-pointer">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex -space-x-4 shrink-0">
                    <img src={tip.homeLogo} className="w-14 h-14 md:w-16 md:h-16 object-contain rounded-2xl bg-slate-950 p-2 border border-white/5" alt="H" />
                    <img src={tip.awayLogo} className="w-14 h-14 md:w-16 md:h-16 object-contain rounded-2xl bg-slate-950 p-2 border border-white/10 relative z-10" alt="A" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest truncate">{tip.league}</span>
                      <span className="text-[9px] font-bold text-slate-500 shrink-0">{new Date(tip.date).toLocaleDateString('sr-RS')}</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black italic text-white uppercase tracking-tighter leading-none truncate">
                      {tip.home} <span className="text-cyan-500 not-italic mx-1">VS</span> {tip.away}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                  <div className="text-left md:text-right">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Prognoza</p>
                    <div className={`px-5 py-2 rounded-xl text-slate-950 ${tier === "premium" ? "bg-cyan-500" : "bg-emerald-400"}`}>
                      <span className="text-sm md:text-lg font-black italic uppercase leading-none">{tip.tip}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl border transition-all ${isOpen ? 'bg-white text-slate-950' : 'bg-slate-950 text-slate-500 border-white/5'}`}>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <div className="px-6 md:px-8 pb-8">
                    <div className="pt-8 border-t border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-8">
                      
                      <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-white/5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Sigurnost</p>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-6">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${tip.confidencePercent}%` }} className={`h-full ${tier === "premium" ? "bg-cyan-500 shadow-[0_0_10px_#06b6d4]" : "bg-emerald-400 shadow-[0_0_10px_#34d399]"}`} />
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                              <span className="text-[10px] font-black text-white uppercase truncate max-w-[120px] font-sans">{tip.home}</span>
                              {renderForm(tip.stats?.form)}
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                              <span className="text-[10px] font-black text-white uppercase truncate max-w-[120px] font-sans">{tip.away}</span>
                              {renderForm(tip.stats?.form)}
                            </div>
                          </div>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-[2rem] space-y-4">
                          <h5 className="text-[10px] font-black text-red-500 uppercase flex items-center gap-2">
                            <AlertTriangle size={14} /> Izostanci
                          </h5>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[9px] font-black text-slate-600 uppercase mb-1 font-sans">{tip.home}</p>
                              <p className="text-xs text-slate-300 font-medium leading-relaxed font-sans">{tip.injuries?.home?.join(", ") || "Nema podataka"}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5">
                              <p className="text-[9px] font-black text-slate-600 uppercase mb-1 font-sans">{tip.away}</p>
                              <p className="text-xs text-slate-300 font-medium leading-relaxed font-sans">{tip.injuries?.away?.join(", ") || "Nema podataka"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-8 space-y-6 min-w-0">
                        <div className="relative rounded-[2rem] bg-slate-950/50 border border-white/5 overflow-hidden">
                          <div className="p-6 md:p-8">
                            <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2 ${tier === "premium" ? "text-cyan-500" : "text-emerald-400"}`}>
                              <ShieldCheck size={14} /> {tier === "premium" ? "Insajder Analiza" : "Ekspert Analiza"}
                            </h4>
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar pr-4">
                              <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium italic font-sans">
                                {tip.analysis || "Analiza se učitava..."}
                              </p>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                          </div>
                        </div>

                        <div className="p-6 md:p-8 rounded-[2rem] bg-slate-950/50 border border-white/5">
                          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                            <Users size={14} /> Startne Postave
                          </h4>
                          {hasLineups ? (
                            <div className="grid grid-cols-2 gap-8">
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-600 uppercase mb-4 border-b border-white/5 pb-2 truncate font-sans">{tip.home}</p>
                                <ul className="space-y-2">
                                  {tip.lineups.home.map((player: string, i: number) => (
                                    <li key={i} className="text-[11px] md:text-xs text-slate-300 flex items-center gap-2 truncate font-sans">
                                      <span className="w-1 h-1 shrink-0 rounded-full bg-emerald-500" /> {player}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-600 uppercase mb-4 border-b border-white/5 pb-2 truncate font-sans">{tip.away}</p>
                                <ul className="space-y-2">
                                  {tip.lineups.away.map((player: string, i: number) => (
                                    <li key={i} className="text-[11px] md:text-xs text-slate-300 flex items-center gap-2 truncate font-sans">
                                      <span className="w-1 h-1 shrink-0 rounded-full bg-emerald-500" /> {player}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-6 text-center">
                              <Star className="w-6 h-6 text-slate-800 mb-3" />
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-sans">
                                Postave biće u Live sekciji 60m pre meča
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

export default RenderTips;