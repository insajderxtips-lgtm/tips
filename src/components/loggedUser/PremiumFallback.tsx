import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, Lock, CheckCircle2, ArrowRight, BarChart2, TrendingUp, Layers, Target } from "lucide-react";
import statisticsPicture from "../../assets/stats.png";
import statisticsPicture2 from "../../assets/stats2.png";
import bestOddsImg from "../../assets/bestodds.png";
import arbitrageImg from "../../assets/arbitrage.png";

const PREMIUM_FEATURES = {
  stats: {
    title: "Napredne Statistike",
    description: "Pratite sopstvene rezultate po godini, mesecu i danu. Vidite gde grešite i gde blistajte.",
    benefits: [
      "Pregled po mesecima i danima",
      "Grafovi profita i win-rate-a",
      "Analiza slabih i jakih tačaka",
    ],
    images: [statisticsPicture, statisticsPicture2],
    Icon: BarChart2,
    accent: "cyan",
  },
  tips: {
    title: "Premium Tipovi",
    description: "Detaljna profesionalna analiza mečeva sa startnim postavama, povredama i procenom sigurnosti.",
    benefits: [
      "Detaljna analiza svakog meča",
      "Startne postave i povrede igrača",
      "Mečevi visoke sigurnosti",
      "Ekskluzivni insider informacije",
    ],
    images: [],
    Icon: Target,
    accent: "amber",
  },
  najboljekvote: {
    title: "Pronalazač Kvota",
    description: "Skeniramo više kladionica u realnom vremenu kako biste uvek igrali po najvećoj kvoti.",
    benefits: [
      "Poređenje svih kladionica odjednom",
      "Tiket sa najvećim ukupnim koeficijentom",
      "Ažuriranje kvota u realnom vremenu",
    ],
    images: [bestOddsImg],
    Icon: TrendingUp,
    accent: "blue",
  },
  arbitrage: {
    title: "Arbitražni Kalkulator",
    description: "Iskoristite razlike u kvotama i ostvarite siguran profit bez obzira na ishod meča.",
    benefits: [
      "Automatsko pronalaženje arbitraže",
      "Siguran profit bez obzira na ishod",
      "Precizni izračuni uloga",
    ],
    images: [arbitrageImg],
    Icon: Layers,
    accent: "violet",
  },
  default: {
    title: "Premium Pristup",
    description: "Otključajte sve ekskluzivne funkcije i povedite svoje klađenje na viši nivo.",
    benefits: [
      "Pristup svim premium tipovima",
      "Napredne analize i statistike",
      "Pronalazač najboljje kvote",
      "Arbitražni kalkulator",
    ],
    images: [],
    Icon: Lock,
    accent: "cyan",
  },
} as const;

type FeatureKey = keyof typeof PREMIUM_FEATURES;

const ACCENT = {
  cyan:   { badge: "bg-cyan-500/10 border-cyan-500/25 text-cyan-400", icon: "bg-cyan-500/10 text-cyan-400", dot: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]", btn: "bg-cyan-400 hover:bg-cyan-300" },
  amber:  { badge: "bg-amber-500/10 border-amber-500/25 text-amber-400", icon: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]", btn: "bg-amber-400 hover:bg-amber-300" },
  blue:   { badge: "bg-blue-500/10 border-blue-500/25 text-blue-400", icon: "bg-blue-500/10 text-blue-400", dot: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]", btn: "bg-blue-400 hover:bg-blue-300" },
  violet: { badge: "bg-violet-500/10 border-violet-500/25 text-violet-400", icon: "bg-violet-500/10 text-violet-400", dot: "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]", btn: "bg-violet-400 hover:bg-violet-300" },
};

// ── Image lightbox ─────────────────────────────────────────────────────────────
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="relative max-h-[90vh] max-w-[95vw] overflow-auto rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={src}
            alt={alt}
            className="block max-h-[90vh] w-auto rounded-2xl shadow-2xl"
            style={{ touchAction: "pinch-zoom" }}
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>

        {/* Close hint */}
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/30">
          Kliknite van slike za zatvaranje
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Zoomable image card ────────────────────────────────────────────────────────
function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen(true)}
        className="group relative cursor-zoom-in overflow-hidden rounded-2xl bg-black/40 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
      >
        <img src={src} alt={alt} className="w-full h-auto object-cover opacity-90 transition-opacity group-hover:opacity-100" />
        {/* Zoom hint overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20">
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-4 w-4 text-white" />
            <span className="text-xs font-semibold text-white">Uvećaj</span>
          </div>
        </div>
        {/* Mobile tap hint — always visible, fades on hover */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm sm:hidden">
          <ZoomIn className="h-3.5 w-3.5 text-white/70" />
          <span className="text-[10px] text-white/70">Tapni za uvećanje</span>
        </div>
      </motion.div>

      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PremiumFallback({ pageType = "default" }: { pageType?: FeatureKey }) {
  const currentUser = useSelector((state: RootState) => state.user);
  const nav = useNavigate();
  const location = useLocation();

  const getActiveType = (): FeatureKey => {
    const path = location.pathname.toLowerCase();
    if (path.includes("statistike")) return "stats";
    if (path.includes("premiumtips") || path.includes("premium-tips")) return "tips";
    if (path.includes("najboljekvote") || path.includes("najbolje-kvote")) return "najboljekvote";
    if (path.includes("arbitraz") || path.includes("arbitrage")) return "arbitrage";
    return pageType;
  };

  const activeType = getActiveType();
  const f = PREMIUM_FEATURES[activeType];
  const colors = ACCENT[f.accent];
  const hasImages = f.images.length > 0;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#030712] p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className={`w-full overflow-hidden rounded-3xl border border-white/[0.07] bg-[#080d1a] shadow-[0_40px_100px_rgba(0,0,0,0.7)] ${hasImages ? "max-w-6xl" : "max-w-2xl"}`}
      >
        <div className={`flex flex-col ${hasImages ? "lg:flex-row" : ""}`}>

          {/* ── Left / main text panel ─────────────────────────────────────── */}
          <div className={`flex flex-col justify-center p-8 md:p-12 ${hasImages ? "lg:w-[45%]" : "w-full"} relative`}>
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/[0.02] blur-3xl" />

            <div className="relative space-y-7">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${colors.badge}`}
              >
                <Lock className="h-3 w-3" />
                Premium pristup
              </motion.div>

              {/* Title + description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-3"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors.icon}`}>
                  <f.Icon className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                  {f.title}
                </h2>
                <p className="text-sm leading-relaxed text-slate-400 md:text-base">
                  Pozdrav{" "}
                  <span className="font-semibold text-white">{currentUser.username}</span>,{" "}
                  {f.description}
                </p>
              </motion.div>

              {/* Benefits */}
              {f.benefits.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="space-y-2.5"
                >
                  {f.benefits.map((benefit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.28 + i * 0.06 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${colors.icon.split(" ")[1]}`} />
                      <span className="text-sm text-slate-300">{benefit}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="space-y-3 pt-1"
              >
                <button
                  onClick={() => nav("/kupi")}
                  className={`group flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-4 font-bold text-black shadow-lg transition-all active:scale-[0.97] ${colors.btn}`}
                >
                  Aktiviraj Premium
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <p className="text-center text-xs text-slate-600">
                  Jednokratna mesečna pretplata · Bez automatskog obnavljanja
                </p>
              </motion.div>
            </div>
          </div>

          {/* ── Right: image panel (only when images exist) ────────────────── */}
          {hasImages && (
            <div className="flex flex-col justify-center gap-5 border-t border-white/[0.05] bg-black/30 p-6 md:p-10 lg:w-[55%] lg:border-l lg:border-t-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Slike
              </p>
              {f.images.map((img, idx) => (
                <ZoomableImage key={idx} src={img} alt={f.title} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
