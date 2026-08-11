import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ShieldCheck,
  Loader2,
  SearchX,
  Crown,
  Check,
  X,
  Lock,
  Flame,
  CalendarDays,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import PremiumFallback from "../PremiumFallback";
import { useNavigate } from "react-router";
import { logout } from "../../../redux/slices/UserSlice";

interface RenderTipsProps {
  tier: "free" | "premium";
}

/* ------------------------------------------------------------------ */
/*  Team logo with graceful fallback to initials                       */
/* ------------------------------------------------------------------ */
const TeamLogo: React.FC<{ src?: string; name?: string; accent?: boolean }> = ({
  src,
  name = "",
  accent,
}) => {
  const [errored, setErrored] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const base =
    "w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-[#0b1628] p-3 shadow-xl flex items-center justify-center shrink-0";

  if (!src || errored) {
    return (
      <div
        className={`${base} border ${
          accent ? "border-blue-500/30 z-10 relative" : "border-[#1a3050]"
        }`}
      >
        <span className="text-lg md:text-xl font-black italic text-slate-400 tracking-tighter">
          {initials || "?"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      onError={() => setErrored(true)}
      loading="lazy"
      alt={name}
      className={`${base} object-contain border ${
        accent ? "border-white/10 z-10 relative" : "border-[#1a3050]"
      }`}
    />
  );
};

const RenderTips: React.FC<RenderTipsProps> = ({ tier }) => {
  const currentUserTier = useSelector((state: RootState) => state.user.tier);
  const [tips, setTips] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canViewPremium = useMemo(() => {
    return tier !== "premium" || currentUserTier === "premium";
  }, [tier, currentUserTier]);
  const nav = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!canViewPremium) return;

    const activeToken = localStorage.getItem("insajder_token");

    if (!activeToken) {
      dispatch(logout());
      nav("/");
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchTips = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/tips/${tier}`, {
          signal: controller.signal,
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${activeToken}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 401 || res.status === 403) {
          dispatch(logout());
          nav("/");
          return;
        }

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
          setTips(Array.isArray(data) ? data.filter((tip) => tip.type === tier) : []);
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

  if (loading)
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">
          Učitavanje...
        </p>
      </div>
    );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              tier === "premium"
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {tier === "premium" ? <Crown size={20} /> : <Flame size={20} />}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white leading-none">
              {tier === "premium" ? "Premium Tipovi" : "Besplatni Tipovi"}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mt-1">
              {tips.length} {tips.length === 1 ? "aktivan tip" : "aktivnih tipova"}
            </p>
          </div>
        </div>
      </div>

      {tips.length === 0 ? (
        <div className="w-full py-32 flex flex-col items-center justify-center text-center rounded-[2.5rem] border border-[#1a3050] bg-[#07131f]/50">
          <SearchX className="w-12 h-12 text-slate-800 mb-4" />
          <h3 className="text-xl font-black italic text-white uppercase tracking-tight">
            Trenutno nema dostupnih tipova
          </h3>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Proverite ponovo uskoro — novi mečevi stižu svakog dana.
          </p>
        </div>
      ) : (
        tips.map((tip, index) => {
          const isOpen = currentTab === index;
          const isPremium = tip.type === "premium";
          // Lineups only make sense for team sports (football). Tennis & co. ship
          // empty lineups, so hide the whole "Postava" block when there are none.
          const hasLineups =
            (tip.lineups?.home?.length || 0) + (tip.lineups?.away?.length || 0) > 0;

          return (
            <motion.div
              key={tip._id || index}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`group relative overflow-hidden rounded-[2.5rem] border transition-all duration-500 ${
                isOpen
                  ? "bg-[#0b1c32] border-[#2a4d75] shadow-[0_20px_60px_-20px_rgba(59,130,246,0.35)]"
                  : "bg-[#07131f]/70 border-[#1a3050] hover:border-[#2a4d75] hover:shadow-[0_20px_50px_-25px_rgba(59,130,246,0.25)]"
              }`}
            >
              {/* Ambient glow */}
              <div
                className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full blur-[90px] transition-opacity duration-500 ${
                  isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                } ${isPremium ? "bg-blue-500/20" : "bg-emerald-500/15"}`}
              />

              {/* Badge */}
              <div
                className={`absolute top-0 left-1/2 -translate-x-1/2 px-6 py-1 rounded-b-2xl text-[9px] font-black uppercase tracking-[0.2em] z-20 ${
                  isPremium
                    ? "bg-blue-500 text-slate-950 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                    : "bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                }`}
              >
                {isPremium ? "Premium Tip" : "FREE Tip"}
              </div>

              {/* Header row */}
              <div
                onClick={() => setCurrentTab(isOpen ? null : index)}
                className="relative z-10 p-8 md:p-10 cursor-pointer pt-12"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="flex -space-x-4 shrink-0">
                      <TeamLogo src={tip.homeLogo} name={tip.home} />
                      <TeamLogo src={tip.awayLogo} name={tip.away} accent />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest ${
                            isPremium ? "text-blue-400" : "text-emerald-400"
                          }`}
                        >
                          {tip.league}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                          <CalendarDays size={11} />
                          {tip.date ? new Date(tip.date).toLocaleDateString("sr-RS") : "—"}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
                        {tip.home}{" "}
                        <span className="text-slate-700 not-italic mx-1">vs</span> {tip.away}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-8 border-t lg:border-t-0 border-[#1a3050] pt-6 lg:pt-0">
                    <div className="text-left lg:text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                        Prognoza
                      </p>
                      <div
                        className={`px-6 py-3 rounded-2xl text-slate-950 shadow-xl ${
                          isPremium ? "bg-blue-500" : "bg-white"
                        }`}
                      >
                        <span className="text-lg md:text-2xl font-black italic uppercase leading-none">
                          {tip.tip}
                        </span>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.4 }}
                      className={`p-4 rounded-full transition-colors ${
                        isOpen
                          ? "bg-white text-slate-950"
                          : "bg-slate-800 text-slate-500 group-hover:bg-slate-700"
                      }`}
                    >
                      <ChevronDown size={24} />
                    </motion.div>
                  </div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10"
                  >
                    <div className="px-8 md:px-10 pb-10">
                      {!isPremium ? (
                        <div className="pt-10 border-t border-[#1a3050] space-y-8">
                          <div className="text-center max-w-2xl mx-auto space-y-3">
                            <h4 className="text-xl md:text-2xl font-black text-white uppercase italic">
                              Ovaj meč i tip su deo besplatne ponude.
                            </h4>
                            <p className="text-sm text-slate-400 font-medium">
                              Premium tipovi sadrže skroz drugačije mečeve, detaljnu profesionalnu
                              analizu, postave pre meča, formu, povrede kao i međusobne mečeve.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                            <div className="bg-[#0b1628] p-8 rounded-[2rem] border border-[#1a3050] flex flex-col items-center text-center">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">
                                Besplatan Član
                              </span>
                              <ul className="space-y-4 w-full text-xs font-bold">
                                <li className="flex items-center justify-between text-slate-300">
                                  Tip meča <Check size={16} className="text-emerald-500" />
                                </li>
                                <li className="flex items-center justify-between text-slate-500">
                                  Detaljna analiza <X size={16} className="text-red-500" />
                                </li>
                                <li className="flex items-center justify-between text-slate-500">
                                  Startne postave <X size={16} className="text-red-500" />
                                </li>
                                <li className="flex items-center justify-between text-slate-500">
                                  Povrede i izostanci <X size={16} className="text-red-500" />
                                </li>
                              </ul>
                            </div>

                            <div className="bg-blue-500/10 p-8 rounded-[2rem] border-2 border-blue-500/30 flex flex-col items-center text-center relative overflow-hidden">
                              <div className="absolute top-4 right-4">
                                <Crown size={20} className="text-blue-400" />
                              </div>
                              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6">
                                Premium Član
                              </span>
                              <ul className="space-y-4 w-full mb-8 text-xs font-bold text-white">
                                <li className="flex items-center justify-between">
                                  Tip meča <Check size={16} className="text-blue-400" />
                                </li>
                                <li className="flex items-center justify-between">
                                  Analiza <Check size={16} className="text-blue-400" />
                                </li>
                                <li className="flex items-center justify-between">
                                  Postave <Check size={16} className="text-blue-400" />
                                </li>
                                <li className="flex items-center justify-between">
                                  Povrede <Check size={16} className="text-blue-400" />
                                </li>
                                <li className="flex items-center justify-between">
                                  Mečevi visoke sigurnosti{" "}
                                  <Check size={16} className="text-blue-400" />
                                </li>
                              </ul>
                              <a
                                href="/kupi"
                                className="w-full py-4 bg-blue-500 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform"
                              >
                                Nadogradi Nalog (30 €)
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-10 border-t border-[#1a3050] grid grid-cols-1 lg:grid-cols-12 gap-10">
                          <div className="lg:col-span-4 space-y-6">
                            <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-[2rem]">
                              <h5 className="text-[10px] font-black text-red-500 uppercase flex items-center gap-2 mb-4">
                                <Lock size={14} /> Izostanci
                              </h5>
                              <div className="space-y-4 text-xs">
                                <div>
                                  <p className="font-black text-slate-600 uppercase mb-1">
                                    {tip.home}
                                  </p>
                                  <p className="text-slate-300 font-medium">
                                    {tip.injuries?.home?.join(", ") || "Nema podataka"}
                                  </p>
                                </div>
                                <div className="pt-3 border-t border-[#1a3050]">
                                  <p className="font-black text-slate-600 uppercase mb-1">
                                    {tip.away}
                                  </p>
                                  <p className="text-slate-300 font-medium">
                                    {tip.injuries?.away?.join(", ") || "Nema podataka"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="lg:col-span-8 space-y-8">
                            <div className="bg-[#0b1628]/60 p-8 rounded-[2rem] border border-[#1a3050]">
                              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <ShieldCheck size={14} /> Insajder Analiza
                              </h4>
                              <p className="text-base text-slate-300 leading-relaxed font-medium italic">
                                {tip.analysis}
                              </p>
                              {tip.bestOdds && (
                                <a
                                  href={
                                    tip.bestOdds.startsWith("http")
                                      ? tip.bestOdds
                                      : `https://${tip.bestOdds}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-6 inline-block w-full text-center py-4 bg-emerald-500 text-slate-950 font-black uppercase rounded-2xl hover:bg-emerald-600 transition-colors shadow-lg"
                                >
                                  Pogledaj Najbolju Kvotu
                                </a>
                              )}
                            </div>
                            {hasLineups && (
                              <div className="grid grid-cols-2 gap-8 bg-[#0b1628] p-8 rounded-[2rem] border border-[#1a3050]">
                                <div className="min-w-0">
                                  <p className="text-[9px] font-black text-slate-600 uppercase mb-4 border-b border-[#1a3050] pb-2 truncate">
                                    Postava: {tip.home}
                                  </p>
                                  <ul className="space-y-2">
                                    {tip.lineups?.home?.map((p: any, i: number) => (
                                      <li
                                        key={i}
                                        className="text-xs text-slate-300 flex items-center gap-2 truncate font-medium"
                                      >
                                        <span className="w-1 h-1 rounded-full bg-blue-500" /> {p}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] font-black text-slate-600 uppercase mb-4 border-b border-[#1a3050] pb-2 truncate">
                                    Postava: {tip.away}
                                  </p>
                                  <ul className="space-y-2">
                                    {tip.lineups?.away?.map((p: any, i: number) => (
                                      <li
                                        key={i}
                                        className="text-xs text-slate-300 flex items-center gap-2 truncate font-medium"
                                      >
                                        <span className="w-1 h-1 rounded-full bg-blue-500" /> {p}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
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
