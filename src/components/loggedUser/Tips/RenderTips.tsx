import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ShieldCheck, Zap, Loader2, SearchX, Crown, Check, X, Lock } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import PremiumFallback from "../PremiumFallback";

interface RenderTipsProps {
  tier: "free" | "premium";
}

const RenderTips: React.FC<RenderTipsProps> = ({ tier }) => {
  const currentUserTier = useSelector((state: RootState) => state.user.tier);
  const [tips, setTips] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canViewPremium = useMemo(() => {
    return tier !== "premium" || currentUserTier === "premium";
  }, [tier, currentUserTier]);

  useEffect(() => {
    if (!canViewPremium) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const fetchTips = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/tips/${tier}`, { 
          signal: controller.signal, 
          cache: "no-store" 
        });

        if (res.status === 404) {
          if (!controller.signal.aborted) {
            setTips([]);
            setLoading(false);
          }
          return;
        }

        if (!res.ok) throw new Error("Server error");
        
        const data = await res.json();
        
        if (!controller.signal.aborted) {
          setTips(Array.isArray(data) ? data.filter(tip => tip.type === tier) : []);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Fetch error:", err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchTips();

    return () => controller.abort();
  }, [tier, canViewPremium]);

  if (!canViewPremium) return <PremiumFallback pageType="tips" />;

  if (loading) return (
    <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Učitavanje...</p>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans">
      {tips.length === 0 ? (
        <div className="w-full py-32 flex flex-col items-center justify-center text-center">
          <SearchX className="w-12 h-12 text-slate-800 mb-4" />
          <h3 className="text-xl font-black italic text-white uppercase tracking-tight">Trenutno nema dostupnih tipova</h3>
        </div>
      ) : (
        tips.map((tip, index) => {
          const isOpen = currentTab === index;
          const isPremium = tip.type === "premium";

          return (
            <motion.div 
              key={tip._id || index} 
              layout 
              className={`relative overflow-hidden rounded-[2.5rem] border transition-all duration-500 ${isOpen ? "bg-slate-900 border-white/10 shadow-2xl" : "bg-slate-900/40 border-white/5"}`}
            >
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 px-6 py-1 rounded-b-2xl text-[9px] font-black uppercase tracking-[0.2em] ${isPremium ? "bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "bg-slate-800 text-slate-400"}`}>
                {isPremium ? "Premium Tip" : "FREE Tip"}
              </div>

              <div onClick={() => setCurrentTab(isOpen ? null : index)} className="p-8 md:p-10 cursor-pointer pt-12">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="flex -space-x-4 shrink-0">
                      <img src={tip.homeLogo} className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-3xl bg-slate-950 p-3 border border-white/5 shadow-xl" alt="H" />
                      <img src={tip.awayLogo} className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-3xl bg-slate-950 p-3 border border-white/10 relative z-10 shadow-xl" alt="A" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isPremium ? "text-cyan-500" : "text-emerald-400"}`}>{tip.league}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(tip.date).toLocaleDateString('sr-RS')}</span>
                      </div>
                      <h3 className="text-2xl md:text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
                        {tip.home} <span className="text-slate-700 not-italic mx-1">vs</span> {tip.away}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-8 border-t lg:border-t-0 border-white/5 pt-6 lg:pt-0">
                    <div className="text-left lg:text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Prognoza</p>
                      <div className={`px-6 py-3 rounded-2xl text-slate-950 shadow-xl ${isPremium ? "bg-cyan-500" : "bg-white"}`}>
                        <span className="text-lg md:text-2xl font-black italic uppercase leading-none">{tip.tip}</span>
                      </div>
                    </div>
                    <div className={`p-4 rounded-full transition-all ${isOpen ? 'bg-white text-slate-950 rotate-180' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                      <ChevronDown size={24} />
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <div className="px-8 md:px-10 pb-10">
                      {!isPremium ? (
                        <div className="pt-10 border-t border-white/5 space-y-8">
                          <div className="text-center max-w-2xl mx-auto space-y-3">
                            <h4 className="text-xl md:text-2xl font-black text-white uppercase italic">Ovaj meč i tip je deo besplatne ponude.</h4>
                            <p className="text-sm text-slate-400 font-medium">Premium tipovi sadrže skroz drugacije mečeve, detaljnu profesionalnu analizu, postave pre meča, formu, povrede kao i medjusobne mečeve.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                            <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-white/5 flex flex-col items-center text-center">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Besplatan Član</span>
                              <ul className="space-y-4 w-full text-xs font-bold">
                                <li className="flex items-center justify-between text-slate-300">Tip meča <Check size={16} className="text-emerald-500" /></li>
                                <li className="flex items-center justify-between text-slate-500">Detaljna analiza <X size={16} className="text-red-500" /></li>
                                <li className="flex items-center justify-between text-slate-500">Startne postave <X size={16} className="text-red-500" /></li>
                                <li className="flex items-center justify-between text-slate-500">Povrede i izostanci <X size={16} className="text-red-500" /></li>
                              </ul>
                            </div>

                            <div className="bg-cyan-500/10 p-8 rounded-[2rem] border-2 border-cyan-500/30 flex flex-col items-center text-center relative overflow-hidden">
                              <div className="absolute top-4 right-4"><Crown size={20} className="text-cyan-500" /></div>
                              <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-6">Premium Član</span>
                              <ul className="space-y-4 w-full mb-8 text-xs font-bold text-white">
                                <li className="flex items-center justify-between">Mečevi <Check size={16} className="text-cyan-500" /></li>
                                <li className="flex items-center justify-between">Analiza <Check size={16} className="text-cyan-500" /></li>
                                <li className="flex items-center justify-between">Postave <Check size={16} className="text-cyan-500" /></li>
                                <li className="flex items-center justify-between">Povrede <Check size={16} className="text-cyan-500" /></li>
                              </ul>
                              <a href="/kupi" className="w-full py-4 bg-cyan-500 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform">
                                Nadogradi Nalog (30 €)
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-10 border-t border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-10">
                          <div className="lg:col-span-4 space-y-6">
                            <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Sigurnost</p>
                              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${tip.confidencePercent}%` }} className="h-full bg-cyan-500" />
                              </div>
              
                            </div>
                            <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-[2rem]">
                              <h5 className="text-[10px] font-black text-red-500 uppercase flex items-center gap-2 mb-4">
                                <Lock size={14} /> Izostanci
                              </h5>
                              <div className="space-y-4 text-xs">
                                <div>
                                  <p className="font-black text-slate-600 uppercase mb-1">{tip.home}</p>
                                  <p className="text-slate-300 font-medium">{tip.injuries?.home?.join(", ") || "Nema podataka"}</p>
                                </div>
                                <div className="pt-3 border-t border-white/5">
                                  <p className="font-black text-slate-600 uppercase mb-1">{tip.away}</p>
                                  <p className="text-slate-300 font-medium">{tip.injuries?.away?.join(", ") || "Nema podataka"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="lg:col-span-8 space-y-8">
                            <div className="bg-slate-950/30 p-8 rounded-[2rem] border border-white/5">
                              <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <ShieldCheck size={14} /> Insajder Analiza
                              </h4>
                              <p className="text-base text-slate-300 leading-relaxed font-medium italic">{tip.analysis}</p>
                              {tip.bestOdds && (
                                <a
                                  href={tip.bestOdds.startsWith("http") ? tip.bestOdds : `https://${tip.bestOdds}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-6 inline-block w-full text-center py-4 bg-emerald-500 text-slate-950 font-black uppercase rounded-2xl hover:bg-emerald-600 transition-colors shadow-lg"
                                >
                                  Pogledaj Najbolju Kvotu
                                </a>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-8 bg-slate-950/50 p-8 rounded-[2rem] border border-white/5">
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-600 uppercase mb-4 border-b border-white/5 pb-2 truncate">Postava: {tip.home}</p>
                                <ul className="space-y-2">
                                  {tip.lineups?.home?.map((p: any, i: number) => <li key={i} className="text-xs text-slate-300 flex items-center gap-2 truncate font-medium"><span className="w-1 h-1 rounded-full bg-cyan-500" /> {p}</li>)}
                                </ul>
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-600 uppercase mb-4 border-b border-white/5 pb-2 truncate">Postava: {tip.away}</p>
                                <ul className="space-y-2">
                                  {tip.lineups?.away?.map((p: any, i: number) => <li key={i} className="text-xs text-slate-300 flex items-center gap-2 truncate font-medium"><span className="w-1 h-1 rounded-full bg-cyan-500" /> {p}</li>)}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
      )}
    </div>
  );
};

export default RenderTips;