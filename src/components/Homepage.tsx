import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "../redux/store";
import Chatbox from "./loggedUser/Chatbox";
import TipsHistory from "./TipsHistory";
import Verification from "./Verification";
import stats from "../assets/stats.png";
import stats2 from "../assets/stats2.png";

// ── DATE HELPERS ─────────────────────────────────────────────────────────────
// Strips Serbian diacritics (č→c, š→s, ž→z, ć→c, đ→dj) — the brand font lacks them.
const deburr = (s: unknown): string =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "dj")
    .replace(/Đ/g, "Dj");

const getFormattedDate = (daysOffset = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

const getDateLabel = (offset: number): string => {
  if (offset === 0) return "Danas";
  if (offset === 1) return "Sutra";
  if (offset === 2) return "Prekosutra";
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("sr-Latn", { day: "numeric", month: "short" });
};

type SportKey = "fudbal" | "kosarka" | "tenis" | "hokej";

interface MatchEvent {
  id: string;
  sport: SportKey;
  league: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  time: string;
  /** Epoch seconds for chronological sorting within a sport. */
  startTs: number;
}

// Sport metadata: display name, emoji "ball", and accent colour used for grouping headers.
const SPORTS: Record<SportKey, { label: string; icon: string; accent: string; dot: string }> = {
  fudbal: { label: "Fudbal", icon: "⚽", accent: "text-emerald-400", dot: "bg-emerald-500" },
  kosarka: { label: "Kosarka", icon: "🏀", accent: "text-orange-400", dot: "bg-orange-500" },
  tenis: { label: "Tenis", icon: "🎾", accent: "text-lime-400", dot: "bg-lime-500" },
  hokej: { label: "Hokej", icon: "🏒", accent: "text-sky-400", dot: "bg-sky-500" },
};

const SPORT_ORDER: SportKey[] = ["fudbal", "kosarka", "tenis", "hokej"];

const normalizeSport = (raw: unknown): SportKey => {
  const s = String(raw || "").toLowerCase();
  if (s.includes("basket") || s.includes("kosar")) return "kosarka";
  if (s.includes("tennis") || s.includes("tenis")) return "tenis";
  if (s.includes("hockey") || s.includes("hokej")) return "hokej";
  return "fudbal";
};

// ── STATIC DATA (hoisted so it is not re-created on every render) ─────────────
const DATE_OFFSETS = [-1, 0, 1, 2] as const;

const ACCENTS = {
  emerald: { bar: "bg-emerald-500", text: "text-emerald-400" },
  blue: { bar: "bg-blue-500", text: "text-blue-400" },
  amber: { bar: "bg-amber-500", text: "text-amber-400" },
  violet: { bar: "bg-violet-500", text: "text-violet-400" },
} as const;

type AccentKey = keyof typeof ACCENTS;

const PREMIUM_FEATURES = [
  {
    iconPath:
      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    bg: "bg-blue-500/10 border-blue-500/20",
    iconColor: "text-blue-400",
    title: "Kompletna analiza",
    desc: "Kompletna analiza meca nasih tipstera sa svim relevantnim podacima.",
  },
  {
    iconPath:
      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    bg: "bg-violet-500/10 border-violet-500/20",
    iconColor: "text-violet-400",
    title: "Sastavi i povrede",
    desc: "Detaljne informacije o povredama, kaznama i dostupnosti igraca.",
  },
  {
    iconPath: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    iconColor: "text-cyan-400",
    title: "Forma i medjusobni mecevi",
    desc: "Analiza forme poslednjih 5 meceva i istorija medjusobnih susreta.",
  },
];

const ODDS_FEATURES = [
  {
    iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    bg: "bg-blue-500/10 border-blue-500/20",
    iconColor: "text-blue-400",
    title: "Instant pretraga",
    desc: "Nas sistem automatski proverava kvote u vise kladionica i prikazuje najpovoljniju opciju.",
  },
  {
    iconPath: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    bg: "bg-violet-500/10 border-violet-500/20",
    iconColor: "text-violet-400",
    title: "Sastavite tiket",
    desc: "Sastavite tiket i mi cemo automatski prikazati najvecu dostupnu kvotu kombinujuci najbolje opcije.",
  },
  {
    iconPath:
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    iconColor: "text-cyan-400",
    title: "Povecajte profit",
    desc: "Kombinovanjem najboljih kvota mozete povecati dobit i do 30% na istim opkladama.",
  },
];

const TESTIMONIALS = [
  { name: "Marko T.", city: "Beograd", text: "Za 3 meseca sam povecao bankroll za 140%. Analize su brutalno precizne.", roi: "+140%", months: "3 meseca" },
  { name: "Stefan K.", city: "Novi Sad", text: "Pronalazac kvota mi stedi u proseku 15-20% po tiketu. Ne znam kako sam ziveo bez njega.", roi: "+23%/mes", months: "6 meseci" },
  { name: "Nikola P.", city: "Nis", text: "Konacno imam sistem pracenja opklada. Sada znam tacno sta radim dobro, a sta lose.", roi: "+67%", months: "5 meseci" },
];

const FORM_RESULTS = ["W", "W", "D", "L", "W"];

// ── SHARED PRIMITIVES ─────────────────────────────────────────────────────────
function LoadingSpinner({ color = "border-emerald-400" }: { color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className={`h-5 w-5 animate-spin rounded-full border-2 ${color} border-t-transparent`} />
      <span className="text-[11px] uppercase tracking-widest text-slate-500">Ucitavanje...</span>
    </div>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10">
      <span className="text-[11px] font-semibold text-rose-400">{text}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10">
      <span className="text-[11px] italic text-slate-600">{text}</span>
    </div>
  );
}

function StarRating({ className = "text-xs" }: { className?: string }) {
  return (
    <div className={`flex gap-0.5 text-amber-400 ${className}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>★</span>
      ))}
    </div>
  );
}

/** Reveals its children once when scrolled into view. */
function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

function StatCard({ label, value, color, sub, delay = 0 }: { label: string; value: string; color: AccentKey; sub?: string; delay?: number }) {
  const accent = ACCENTS[color];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      className="group relative overflow-hidden rounded-2xl border border-[#1a3050] bg-[#0b1628] p-4 transition-colors duration-300 hover:border-[#2a4d75]"
      style={{ willChange: "transform, opacity" }}
    >
      <div className={`absolute left-0 top-0 h-[2px] w-full ${accent.bar} origin-left`}
        style={{ transform: "scaleX(0)", animation: `expandX 0.7s ${delay + 0.15}s cubic-bezier(0.22,1,0.36,1) forwards` }}
      />
      <div className={`absolute -right-8 -top-8 h-20 w-20 rounded-full ${accent.bar} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-10`} />
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`font-mono text-2xl font-black leading-none ${accent.text}`}>{value}</p>
      {sub && <p className="mt-1.5 text-[10px] text-slate-600">{sub}</p>}
    </motion.div>
  );
}

/** Reusable dark glass panel used across the dashboard. */
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-[#132236] bg-[#07131f] ${className}`}>{children}</div>
  );
}

function FeatureItem({
  iconPath,
  bg,
  iconColor,
  title,
  desc,
  delay = 0,
}: {
  iconPath: string;
  bg: string;
  iconColor: string;
  title: string;
  desc: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="group flex items-start gap-5 transition-transform duration-300 hover:translate-x-1.5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${bg}`}>
          <svg className={`h-6 w-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={iconPath} />
          </svg>
        </div>
        <div>
          <h3 className="raceFont mb-1.5 text-lg text-white">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
        </div>
      </div>
    </Reveal>
  );
}

const QUICK_ACTIONS = [
  {
    label: "Moje Statistike",
    sub: "Prati svoje opklade detaljno",
    to: "/statistike",
    tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    glow: "group-hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.5)]",
    iconPath:
      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    label: "Najbolje Kvote",
    sub: "Uporedi kvote kladionica",
    to: "/najboljekvote",
    tone: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    glow: "group-hover:shadow-[0_0_30px_-8px_rgba(59,130,246,0.5)]",
    iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  {
    label: "Arbitraza",
    sub: "Arbitraza kalkulator",
    to: "/arbitragebetting",
    tone: "border-violet-500/20 bg-violet-500/10 text-violet-400",
    glow: "group-hover:shadow-[0_0_30px_-8px_rgba(139,92,246,0.5)]",
    iconPath: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
  {
    label: "Premium Tipovi",
    sub: "Premium tipovi visoke prolaznosti",
    to: "/premiumtips",
    tone: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    glow: "group-hover:shadow-[0_0_30px_-8px_rgba(245,158,11,0.5)]",
    iconPath: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Dobro jutro";
  if (h < 18) return "Dobar dan";
  return "Dobro vece";
}

/** Self-contained ticking clock so only this node re-renders each second. */
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-right">
      <p className="font-mono text-2xl font-black tabular-nums text-white md:text-3xl">
        {now.toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {now.toLocaleDateString("sr-Latn", { weekday: "long", day: "numeric", month: "long" })}
      </p>
    </div>
  );
}

function QuickAction({ action, delay }: { action: (typeof QUICK_ACTIONS)[number]; delay: number }) {
  const nav = useNavigate();
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2, ease: "easeOut" } }}
      whileTap={{ scale: 0.97 }}
      onClick={() => nav(action.to)}
      style={{ willChange: "transform, opacity" }}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-[#1a3050] bg-[#0b1628] p-4 text-left transition-colors hover:border-[#2a4d75] ${action.glow}`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${action.tone}`}>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={action.iconPath} />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-white">{action.label}</p>
        <p className="truncate text-[11px] text-slate-500">{action.sub}</p>
      </div>
      <svg className="h-4 w-4 shrink-0 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}

// ── LIVE ODDS TEASER (logged-out conversion driver) ───────────────────────────
function TeaserCrown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7zm2 14h14v1H5v-1z" />
    </svg>
  );
}

// One bet outcome (e.g. "1", "GG", "2+") shown across all bookmakers — same design as BestOdds.
function OutcomeRow({ m, market, ci, onPick }: { m: any; market: any; ci: number; onPick: () => void }) {
  const label = market.outcomes[ci];
  const books = market.rows
    .map((r: any) => ({ name: r.name, val: r.vals[ci] }))
    .filter((b: any) => typeof b.val === "number");
  if (!books.length) return null;
  const highest = Math.max(...books.map((b: any) => Number(b.val) || 0), 0);
  const bestBook = market.best[ci];

  const disp =
    market.key === "1x2" && label === "1" ? `${deburr(m.home)} pobedjuje`
    : market.key === "1x2" && label === "2" ? `${deburr(m.away)} pobedjuje`
    : market.key === "1x2" && label === "X" ? "Nereseno"
    : `${market.label} · ${label}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(); } }}
      className="group cursor-pointer select-none rounded-xl border border-white/5 bg-[#0b1c2e]/60 p-3 transition-all hover:border-cyan-400/50 hover:bg-cyan-500/[0.06] sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white sm:text-base">{disp}</p>
          {bestBook && (
            <p className="mt-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">Najbolja · {bestBook}</p>
          )}
        </div>
        {highest > 0 && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center rounded-lg bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-300 group-hover:flex">
              + Tiket
            </span>
            <div className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 px-3.5 py-2 text-black shadow-lg shadow-cyan-500/20 transition-transform group-hover:scale-105">
              <TeaserCrown className="h-4 w-4 text-amber-300" />
              <span className="font-mono text-base font-black leading-none">{highest.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {books.map((b: any, i: number) => {
          const val = Number(b.val) || 0;
          const isBest = val === highest && val > 0;
          return (
            <div
              key={i}
              className={`relative flex flex-col items-center gap-0.5 rounded-lg py-2 transition-colors ${
                isBest
                  ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-black ring-2 ring-cyan-300/50"
                  : "bg-white/5 text-gray-300 group-hover:bg-white/[0.08]"
              }`}
            >
              {isBest && <TeaserCrown className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 text-amber-300 drop-shadow" />}
              <span className={`text-[8px] font-black uppercase tracking-wider ${isBest ? "text-black/60" : "text-gray-500"}`}>{b.name}</span>
              <span className="font-mono text-sm font-bold">{val > 0 ? val.toFixed(2) : "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Market catalogue we support, grouped into main tabs + sub-tabs (like the big sites).
// Only the "1X2" main tab is unlocked; each sub maps to a real market for that tab.
const TEASER_MAIN_TABS = [
  { label: "1X2", subs: ["Mec", "1. poluvreme", "2. poluvreme"], markets: ["1x2", "pp", "dp"] },
  { label: "Dupla sansa", subs: ["Mec", "1. poluvreme", "2. poluvreme"] },
  { label: "Ukupno golova", subs: ["Ukupno", "Domacin", "Gost", "1. pol.", "2. pol."] },
  { label: "Oba tima daju gol", subs: ["Mec", "1. poluvreme", "2. poluvreme"] },
  { label: "Tacan rezultat", subs: ["Mec", "1. poluvreme", "2. poluvreme"] },
  { label: "Hendikep", subs: ["Mec", "1. poluvreme"] },
  { label: "Poluvreme - kraj", subs: [] },
  { label: "Kombinacije", subs: ["Ishod & golovi", "Ishod & GG", "Dupla sansa & gol."] },
  { label: "Tacno golova", subs: ["Ukupno", "Domacin", "Gost"] },
  { label: "Specijali", subs: ["Multigolovi", "Dupla pobeda", "Sigurna pobeda"] },
];

function LockMini({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 11V7a5 5 0 0110 0v4M5 11h10a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" />
    </svg>
  );
}

function MatchCompareTabs({ m, nav }: { m: any; nav: (p: string) => void }) {
  const [mainTab, setMainTab] = useState(0);
  const [subTab, setSubTab] = useState(0);
  const main = TEASER_MAIN_TABS[mainTab];
  const locked = mainTab !== 0;

  const t = new Date(m.kickOff);
  const time = t.toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit" });
  const day = deburr(t.toLocaleDateString("sr-Latn", { day: "2-digit", month: "short" }));

  // For the unlocked tab the sub picks a real market; locked tabs reuse 1X2 as the blurred backdrop.
  const marketKey = main.markets ? main.markets[Math.min(subTab, main.markets.length - 1)] : "1x2";
  const market =
    m.markets.find((mk: any) => mk.key === marketKey) ||
    m.markets.find((mk: any) => mk.key === "1x2") ||
    m.markets[0];

  const selectMain = (i: number) => { setMainTab(i); setSubTab(0); };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#07131f]/80 shadow-2xl">
      {/* match header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/5 bg-[#0b1c2e]/60 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-cyan-400">{deburr(m.league)}</p>
          <p className="truncate text-base font-black text-white sm:text-lg">
            {deburr(m.home)} <span className="font-normal text-slate-600">vs</span> {deburr(m.away)}
          </p>
        </div>
        <span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-slate-300">
          {day} · {time}
        </span>
      </div>

      {/* main market tabs */}
      <div className="scrollbar-hide flex gap-1.5 overflow-x-auto border-b border-white/5 px-3 py-2.5">
        {TEASER_MAIN_TABS.map((mt, i) => (
          <button
            key={mt.label}
            onClick={() => selectMain(i)}
            className={`flex shrink-0 items-center gap-1 rounded-lg px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wide transition-colors ${
              i === mainTab
                ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-black"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            }`}
          >
            {i > 0 && <LockMini className={`h-3 w-3 ${i === mainTab ? "text-black/70" : "text-slate-600"}`} />}
            {mt.label}
          </button>
        ))}
      </div>

      {/* contextual sub-tabs for the active main tab (only when it has any) */}
      {main.subs.length > 0 && (
        <div className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-white/5 bg-[#0b1c2e]/40 px-3 py-2">
          {main.subs.map((s, i) => (
            <button
              key={s}
              onClick={() => setSubTab(i)}
              className={`shrink-0 rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                i === subTab
                  ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30"
                  : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* content: 1X2 unlocked, everything else locked behind registration */}
      <div className="relative">
        <div className={`space-y-2.5 p-3 sm:p-4 ${locked ? "pointer-events-none select-none blur-[5px]" : ""}`} aria-hidden={locked}>
          {market.outcomes.map((_: string, ci: number) => (
            <OutcomeRow key={ci} m={m} market={market} ci={ci} onPick={() => nav("/register")} />
          ))}
        </div>

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#07131f]/50 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-cyan-500/20 bg-[#0b1c2e]/95 p-6 text-center shadow-[0_0_50px_-14px_rgba(34,211,238,0.5)]">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
                <LockMini className="h-5 w-5" />
              </div>
              <h3 className="raceFont mb-1 text-base text-white">
                Registruj se
              </h3>
              <p className="mb-4 text-sm text-slate-400">
                Napravi <b className="text-white">besplatan nalog</b> — registracija traje 30 sekundi.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => nav("/register")}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-black shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02]"
              >
                Registruj se besplatno
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OddsTeaser({ teaser, nav }: { teaser: any[]; nav: (p: string) => void }) {
  const main = teaser?.[0];
  if (!main) return null;

  return (
    <div className="relative w-full select-none overflow-hidden bg-gradient-to-b from-[#020912] via-[#050f1e] to-[#020912] px-6 py-20">
      {/* animated background accents (cheap opacity pulses) */}
      <div className="pointer-events-none absolute left-1/4 top-8 h-72 w-72 animate-pulse rounded-full bg-cyan-500/[0.07] blur-[110px]" style={{ animationDuration: "9s" }} />
      <div className="pointer-events-none absolute bottom-8 right-1/4 h-72 w-72 animate-pulse rounded-full bg-blue-600/[0.07] blur-[110px]" style={{ animationDuration: "11s", animationDelay: "1.5s" }} />

      <div className="relative mx-auto max-w-5xl">
        {/* heading — staggered reveal */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="mb-8 text-center"
        >
       
          <motion.h2 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="raceFont mb-4 text-3xl tracking-tight text-white md:text-5xl">
            Uporedi{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">vise kladionica</span>{" "}
            
          </motion.h2>
          <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="mx-auto max-w-xl text-base text-slate-400">
            Za svako trziste prikazujemo kvote svih kladionica i oznacavamo <b className="text-white">najbolju</b>. 
          </motion.p>
        </motion.div>

        {/* benefit strip — staggered, hover-reactive */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }}
          className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {ODDS_FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -3, scale: 1.02 }}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#0b1c2e]/50 p-3.5 transition-colors hover:border-cyan-400/30"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${f.bg}`}>
                <svg className={`h-4 w-4 ${f.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.iconPath} />
                </svg>
              </span>
              <span className="text-xs font-bold text-slate-300">{f.title}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* live comparison — spring entrance + pulsing glow ring */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 130, damping: 20 }}
          className="relative"
        >
          <div className="pointer-events-none absolute -inset-1 animate-pulse rounded-[1.6rem] bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-cyan-500/15 blur-xl" style={{ animationDuration: "7s" }} />
          <div className="relative">
            <MatchCompareTabs m={main} nav={nav} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Free vs premium comparison (shows what a free account gets vs paid).
const FREE_VS_PREMIUM = [
  { label: "Besplatni tip dana", free: true, premium: true },
  { label: "Premium tip (Admin igra)", free: false, premium: true },
  { label: "Detaljna analiza meca", free: false, premium: true },
  { label: "Postave i povrede", free: false, premium: true },
  { label: "Ko nudi najbolju kvotu", free: false, premium: true },
  { label: "Mecevi visoke sigurnosti", free: false, premium: true },
];

function CheckMark() {
  return (
    <svg className="mx-auto h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function CrossMark() {
  return (
    <svg className="mx-auto h-3.5 w-3.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Homepage(): React.ReactNode {
  const isLoggedIn = useSelector((state: RootState) => state.user.isAuthenticated);
  const isVerified = useSelector((state: RootState) => state.user.isVerified);
  const username = useSelector((state: RootState) => state.user.username);
  const tier = useSelector((state: RootState) => state.user.tier);
  const nav = useNavigate();

  const [chatOpen, setChatOpen] = useState(false);

  // Landing-page teaser odds (logged-out only)
  const [teaser, setTeaser] = useState<any[]>([]);
  useEffect(() => {
    if (isLoggedIn) return;
    let alive = true;
    fetch("/teaser-odds")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => alive && Array.isArray(d) && setTeaser(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isLoggedIn]);

  // Widget A – Dropping Odds
  const [droppingOdds, setDroppingOdds] = useState<any[]>([]);
  const [droppingLoading, setDroppingLoading] = useState(true);
  const [droppingError, setDroppingError] = useState<string | null>(null);
  const [dropSort, setDropSort] = useState<"drop" | "time" | "odds">("drop");
  const [dropSport, setDropSport] = useState<"sve" | SportKey>("sve");

  // Normalize each raw dropping-odds item once (sport, numbers, timestamp) for filtering & sorting.
const droppingProcessed = useMemo(() => {
  const odds = Array.isArray(droppingOdds) ? droppingOdds : [];

  return odds.map((item: any, idx: number) => {
    const ts =
      typeof item.timestamp === "number"
        ? item.timestamp * 1000
        : item.date
        ? new Date(item.date).getTime()
        : 0;

    return {
      raw: item,
      idx,
      sport: normalizeSport(
        item.sport?.name ||
          item.sport ||
          item.sportName ||
          item.category
      ),
      drop: Math.round(Number(item.dropPercentage || 0)),
      current: Number(item.currentOdd || 0),
      ts,
    };
  });
}, [droppingOdds]);

  const droppingSports = useMemo(
    () => SPORT_ORDER.filter((s) => droppingProcessed.some((d) => d.sport === s)),
    [droppingProcessed]
  );

  const droppingVisible = useMemo(() => {
    const filtered =
      dropSport === "sve"
        ? droppingProcessed
        : droppingProcessed.filter((d) => d.sport === dropSport);
    const sorted = [...filtered];
    if (dropSort === "drop") sorted.sort((a, b) => b.drop - a.drop);
    else if (dropSort === "time") sorted.sort((a, b) => a.ts - b.ts);
    else sorted.sort((a, b) => a.current - b.current); // lowest current odds first
    return sorted;
  }, [droppingProcessed, dropSport, dropSort]);

  // Widget B – Upcoming Matches
  const [dateOffset, setDateOffset] = useState<number>(0);
  const [matches, setMatches] = useState<MatchEvent[]>([]);
  const [matchesLoading, setMatchesLoading] = useState<boolean>(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<"sve" | SportKey>("sve");

  // Sports that actually have matches for the selected day (so we don't show empty filters).
  const availableSports = useMemo(
    () => SPORT_ORDER.filter((s) => matches.some((m) => m.sport === s)),
    [matches]
  );

  // Matches grouped by sport, each group time-sorted, in canonical sport order.
  const groupedMatches = useMemo(() => {
    const visible =
      sportFilter === "sve" ? matches : matches.filter((m) => m.sport === sportFilter);
    return SPORT_ORDER.map((sport) => ({
      sport,
      items: visible
        .filter((m) => m.sport === sport)
        .sort((a, b) => a.startTs - b.startTs),
    })).filter((g) => g.items.length > 0);
  }, [matches, sportFilter]);

  // Dashboard KPIs (derived from real results + active tips)
  const [kpis, setKpis] = useState<{ winRate: number; activeTips: number; avgOdds: number } | null>(null);

  // ── FETCH DROPPING ODDS ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDroppingOdds = async () => {
      setDroppingLoading(true);
      setDroppingError(null);
      try {
        const response = await fetch("/dropping-odds");
        if (!response.ok) throw new Error("Server je vratio gresku.");
        const resJson = await response.json();
        if (resJson.success) setDroppingOdds(resJson.data);
        else setDroppingError("Nije moguce obraditi podatke sa API-ja.");
      } catch (err: any) {
        console.error("Frontend error:", err.message);
        setDroppingError("Padovi kvota trenutno nisu dostupni.");
      } finally {
        setDroppingLoading(false);
      }
    };
    if (isLoggedIn && isVerified) fetchDroppingOdds();
  }, [isLoggedIn, isVerified]);

  // ── COMPUTE DASHBOARD KPIs ─────────────────────────────────────────────────
  // Prolaznost meseca = % premium results won this month.
  // Prosecna kvota     = average odds across all premium results.
  // Aktivni tipovi     = number of currently-active tips (free + premium).
  useEffect(() => {
    if (!isLoggedIn || !isVerified) return;
    const token = localStorage.getItem("insajder_token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

    const countActiveTips = async (type: string) => {
      try {
        const res = await fetch(`/tips/${type}`, { headers: authHeaders });
        if (!res.ok) return 0; // 404 (none) / 403 (no access) → 0
        const json = await res.json();
        return Array.isArray(json) ? json.length : 0;
      } catch {
        return 0;
      }
    };

    (async () => {
      try {
        const statsRes = await fetch("/tipStats");
        const stats = statsRes.ok ? await statsRes.json() : [];
        const premium = Array.isArray(stats) ? stats.filter((s: any) => s.grupa === "premium") : [];

        const now = new Date();
        const thisMonth = premium.filter((s: any) => {
          const d = new Date(s.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const wins = thisMonth.filter((s: any) => s.status === "win").length;
        const settled = thisMonth.filter((s: any) => s.status === "win" || s.status === "loss").length;
        const winRate = settled > 0 ? Math.round((wins / settled) * 100) : 0;

        const oddsVals = premium.map((s: any) => Number(s.odds)).filter((v: number) => v > 0);
        const avgOdds = oddsVals.length ? oddsVals.reduce((a: number, b: number) => a + b, 0) / oddsVals.length : 0;

        const [free, prem] = await Promise.all([countActiveTips("free"), countActiveTips("premium")]);

        setKpis({ winRate, avgOdds, activeTips: free + prem });
      } catch {
        setKpis({ winRate: 0, avgOdds: 0, activeTips: 0 });
      }
    })();
  }, [isLoggedIn, isVerified]);

  // ── FETCH UPCOMING MATCHES ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchMatches = async () => {
      if (!isLoggedIn || !isVerified) return;
      setMatchesLoading(true);
      setMatchesError(null);
      const dateString = getFormattedDate(dateOffset);
      try {
        const response = await fetch(`/matches?date=${dateString}`);
        if (!response.ok) throw new Error(`Server vratio status: ${response.status}`);
        const data = await response.json();
        const extractedMatches: MatchEvent[] = [];
        if (data && Array.isArray(data.Sctns)) {
          data.Sctns.forEach((section: any) => {
            const sport = normalizeSport(section.sport);
            if (section.Ts && Array.isArray(section.Ts.Evs)) {
              section.Ts.Evs.forEach((event: any) => {
                const startTs = typeof event.Est === "number" ? event.Est : 0;
                const matchTime = startTs
                  ? new Date(startTs * 1000).toLocaleTimeString("sr-RS", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A";
                extractedMatches.push({
                  id: event.Eid ? event.Eid.toString() : Math.random().toString(),
                  sport,
                  league: section.Ts.CompN || section.Ts.Snm || SPORTS[sport].label,
                  homeTeam: event.T1?.[0]?.Nm || "Nepoznato",
                  awayTeam: event.T2?.[0]?.Nm || "Nepoznato",
                  status: event.Eps || "NS",
                  time: matchTime,
                  startTs,
                });
              });
            }
          });
        }
        setMatches(extractedMatches);
      } catch (err: any) {
        console.error("Greska na frontendu:", err);
        setMatchesError(err.message || "Greska pri prikazivanju utakmica");
      } finally {
        setMatchesLoading(false);
      }
    };
    fetchMatches();
  }, [dateOffset, isLoggedIn, isVerified]);

  // ── VERIFIED USER DASHBOARD ────────────────────────────────────────────────
  if (isLoggedIn) {
    if (!isVerified) return <Verification />;

    return (
      <motion.div
        className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#020b18] font-sans text-slate-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ willChange: "opacity" }}
      >
        {/* ── HEADER BAR ──────────────────────────────────────────────────── */}
        <motion.div
          className="flex w-full items-center justify-between border-b border-[#0f2540] px-4 pb-4 pt-6 md:px-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ willChange: "transform, opacity" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg shadow-emerald-900/30">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L4.5 13.5H11L10 22L20.5 10.5H14L13 2Z" />
              </svg>
            </div>
            <div>
              <span className="text-[13px] font-black tracking-tight text-white">
                INSAJDER<span className="text-emerald-400">TIPS</span>
              </span>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">kladi se pametnije</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-[#1a3050] bg-[#0b1c32] px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">online</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => nav("/my-account")}
              className="group flex items-center gap-2.5 rounded-xl border border-[#1a3050] bg-[#0b1c32] py-1.5 pl-3 pr-1.5 transition-colors hover:border-[#2a4d75]"
            >
              <span className="hidden text-[11px] font-bold text-slate-300 group-hover:text-white sm:block">{username}</span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-white ${tier === "premium" ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-blue-500 to-indigo-600"}`}>
                {username?.[0]?.toUpperCase() || "?"}
              </div>
            </motion.button>
          </div>
        </motion.div>

        <div className="flex flex-col gap-5 px-4 py-6 md:px-8">
          {/* ── COMMAND BAR (greeting + clock + KPIs) ──────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ willChange: "transform, opacity" }}
            className="relative overflow-hidden rounded-2xl border border-[#1a3050] bg-[#0b1628] p-5 md:p-6"
          >
            <div className="relative flex flex-col gap-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${
                        tier === "premium"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-slate-600/40 bg-slate-700/20 text-slate-400"
                      }`}
                    >
                      {tier === "premium" ? "Premium clan" : "Free nalog"}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{getGreeting()}</span>
                  </div>
                  <h1 className="truncate text-2xl font-black tracking-tight text-white md:text-3xl">
                    {username || "Igracu"}
                  </h1>
                </div>
                <div className="hidden shrink-0 sm:block">
                  <LiveClock />
                </div>
              </div>

              {tier !== "premium" ? (
                /* Free → premium upsell: the concrete reason to pay */
                <div className="flex flex-col gap-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 11V7a5 5 0 0110 0v4M5 11h10a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" />
                      </svg>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Premium</span>
                    </div>
                    <h2 className="text-lg font-black leading-tight text-white">Otkljucaj Admin tiket i premium analize</h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      Detaljne analize sa postavama i povredama, mecevi visoke sigurnosti i tip koji Admin licno igra.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["Admin pick", "Postave i povrede", "Visoka sigurnost"].map((t) => (
                        <span key={t} className="rounded-md border border-[#1a3050] bg-[#0a1422] px-2 py-1 text-[10px] font-bold text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => nav("/kupi")}
                    className="shrink-0 rounded-xl bg-amber-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-[#1a1100] transition-colors hover:bg-amber-400"
                  >
                    Kupi Premium
                  </motion.button>
                </div>
              ) : (
                /* Premium → clean status strip (real data only) */
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[#132236] bg-[#0a1422] px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">Premium aktivan</p>
                      <p className="text-[11px] text-slate-500">Pristup svim tipovima i alatima</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-2xl font-black leading-none text-blue-400">{kpis ? kpis.activeTips : "—"}</p>
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500">Aktivnih tipova</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── QUICK ACTIONS ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map((action, i) => (
              <QuickAction key={action.to} action={action} delay={0.12 + i * 0.06} />
            ))}
          </div>

          {/* ── LIVE SECTION ───────────────────────────────────────────────── */}
          <motion.div
            className="flex items-center gap-3 pt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Uzivo</span>
            <div className="h-px flex-1 bg-[#132236]" />
          </motion.div>

          {/* ── TWO WIDGETS ────────────────────────────────────────────────── */}
          <motion.div
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ willChange: "transform, opacity" }}
          >
            {/* ── WIDGET A: DROPPING ODDS ──────────────────────────────────── */}
            <Panel className="flex flex-col">
              <div className="flex flex-col gap-3 border-b border-[#132236] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <span className="block h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="absolute inset-0 block h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-60" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Pad Kvota</span>
                  </div>
                  <span className="rounded-lg border border-[#132236] bg-[#0b1c2e] px-2 py-1 font-mono text-[10px] text-slate-600">
                    {droppingVisible.length} signala
                  </span>
                </div>

                {/* Sort selector */}
                <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#132236] bg-[#050d17] p-1">
                  {([
                    { key: "drop", label: "Najveci pad" },
                    { key: "time", label: "Vreme" },
                    { key: "odds", label: "Kvota" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setDropSort(opt.key)}
                      className={`rounded-lg py-1.5 text-[10px] font-semibold transition-all duration-200 ${
                        dropSort === opt.key
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                          : "text-slate-500 hover:bg-[#0b1c2e] hover:text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Sport filter chips (only sports present) */}
                {droppingSports.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setDropSport("sve")}
                      className={`rounded-full border px-3 py-1 text-[10px] font-bold transition-all ${
                        dropSport === "sve"
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                          : "border-[#132236] bg-[#0b1c2e] text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Sve
                    </button>
                    {droppingSports.map((s) => (
                      <button
                        key={s}
                        onClick={() => setDropSport(s)}
                        className={`flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold transition-all ${
                          dropSport === s
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                            : "border-[#132236] bg-[#0b1c2e] text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span>{SPORTS[s].icon}</span>
                        {SPORTS[s].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800 max-h-[340px] flex-1 space-y-2 overflow-y-auto p-3">
                {droppingLoading && <LoadingSpinner color="border-emerald-400" />}
                {droppingError && <ErrorMessage text="Padovi kvota trenutno nisu dostupni." />}
                {!droppingLoading && !droppingError && droppingVisible.length === 0 && (
                  <EmptyState text="Trenutno nema detektovanih padova kvota." />
                )}
                {!droppingLoading &&
                  !droppingError &&
                  droppingVisible.map(({ raw: item, idx, sport, drop, current }) => {
                    const league = item.league?.name || "Sve lige";
                    const homeTeam = item.homeTeam?.name || "Domacin";
                    const awayTeam = item.awayTeam?.name || "Gost";
                    const marketLabel = item.marketLabel || item.betName || "Konacan ishod";
                    const selection = item.selection || "N/A";
                    const tip = `${marketLabel} · ${selection}`;
                    const opening = Number(item.openingOdd || 0);
                    let matchTime = "N/A";
                    if (item.timestamp) {
                      matchTime = new Date(item.timestamp * 1000).toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit" });
                    } else if (item.date) {
                      matchTime = new Date(item.date).toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit" });
                    }
                    const uniqueKey = item.fixtureId ? `${item.fixtureId}-${item.selection}-${idx}` : `drop-${idx}`;
                    const dropSeverity = drop >= 20 ? "text-rose-400" : drop >= 12 ? "text-orange-400" : "text-amber-400";

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        key={uniqueKey}
                        className="group flex cursor-pointer items-center gap-3 rounded-xl border border-[#132236] bg-[#0b1c2e] p-3.5 transition-all duration-200 hover:border-emerald-500/30 hover:bg-[#0d2035]"
                      >
                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-950/60">
                          <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                          </svg>
                          <span className={`text-[9px] font-black ${dropSeverity}`}>-{drop}%</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-1.5">
                            <span className="shrink-0 text-[11px] leading-none" title={SPORTS[sport].label}>
                              {SPORTS[sport].icon}
                            </span>
                            <span className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-500">{league}</span>
                            <span className="text-[9px] text-slate-700">·</span>
                            <span className="shrink-0 font-mono text-[9px] text-slate-600">{matchTime}</span>
                          </div>
                          <p className="truncate text-[12px] font-bold text-slate-100 transition-colors group-hover:text-white">
                            {homeTeam} <span className="font-normal text-slate-600">vs</span> {awayTeam}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="max-w-full break-words rounded-md border border-blue-900/50 bg-blue-950/50 px-2 py-0.5 font-mono text-[10px] leading-snug text-blue-300">
                              {tip}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="font-mono text-[10px] text-slate-600 line-through">{opening.toFixed(2)}</div>
                          <div className="font-mono text-[14px] font-black text-emerald-400">{current.toFixed(2)}</div>
                          <div className={`font-mono text-[9px] font-bold ${dropSeverity}`}>▼ {drop}%</div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </Panel>

            {/* ── WIDGET B: UPCOMING MATCHES ───────────────────────────────── */}
            <Panel className="flex flex-col">
              <div className="flex flex-col gap-3 border-b border-[#132236] px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Utakmice</span>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => nav("/najboljekvote")}
                    className="group flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 transition-colors hover:bg-emerald-500/20"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Najbolje kvote
                  </motion.button>
                </div>

                {/* Date selector */}
                <div className="grid grid-cols-4 gap-1 rounded-xl border border-[#132236] bg-[#050d17] p-1">
                  {DATE_OFFSETS.map((offset) => (
                    <button
                      key={offset}
                      onClick={() => setDateOffset(offset)}
                      className={`rounded-lg py-1.5 text-[10px] font-semibold transition-all duration-200 ${
                        dateOffset === offset
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                          : "text-slate-500 hover:bg-[#0b1c2e] hover:text-slate-300"
                      }`}
                    >
                      {getDateLabel(offset)}
                    </button>
                  ))}
                </div>

                {/* Sport filter chips (only sports present that day) */}
                {availableSports.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSportFilter("sve")}
                      className={`rounded-full border px-3 py-1 text-[10px] font-bold transition-all ${
                        sportFilter === "sve"
                          ? "border-blue-500/40 bg-blue-500/15 text-blue-300"
                          : "border-[#132236] bg-[#0b1c2e] text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Sve
                    </button>
                    {availableSports.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSportFilter(s)}
                        className={`flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold transition-all ${
                          sportFilter === s
                            ? "border-blue-500/40 bg-blue-500/15 text-blue-300"
                            : "border-[#132236] bg-[#0b1c2e] text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span>{SPORTS[s].icon}</span>
                        {SPORTS[s].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="max-h-[320px] flex-1 space-y-3 overflow-y-auto p-3">
                {matchesLoading && <LoadingSpinner color="border-blue-400" />}
                {matchesError && <ErrorMessage text={matchesError} />}
                {!matchesLoading && !matchesError && groupedMatches.length === 0 && (
                  <EmptyState text="Nema zakazanih meceva za odabrani dan." />
                )}
                {!matchesLoading &&
                  !matchesError &&
                  groupedMatches.map(({ sport, items }) => (
                    <div key={sport} className="space-y-1.5">
                      {/* Sport group header with "ball" icon */}
                      <div className="sticky top-0 z-10 flex items-center gap-2 bg-[#07131f]/95 px-1 py-1 backdrop-blur-sm">
                        <span className="text-base leading-none">{SPORTS[sport].icon}</span>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${SPORTS[sport].accent}`}>
                          {SPORTS[sport].label}
                        </span>
                        <div className="h-px flex-1 bg-[#132236]" />
                        <span className="rounded-md bg-[#0b1c2e] px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
                          {items.length}
                        </span>
                      </div>

                      {items.map((match) => (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25 }}
                          className="group flex items-center gap-3 rounded-xl border border-[#132236] bg-[#0b1c2e] px-3.5 py-2.5 transition-all duration-150 hover:border-blue-500/25 hover:bg-[#0d2035]"
                        >
                          <div className="shrink-0 text-center">
                            <span className="block font-mono text-[11px] font-black text-slate-200">{match.time}</span>
                            {match.status === "NS" && (
                              <span className="text-[8px] font-bold tracking-wider text-blue-400">NS</span>
                            )}
                          </div>
                          <div className="h-7 w-px shrink-0 bg-[#1a3050]" />
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${SPORTS[match.sport].dot}`}
                            title={SPORTS[match.sport].label}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="mb-0.5 truncate text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                              {match.league}
                            </p>
                            <p className="truncate text-[12px] font-semibold text-slate-200 transition-colors group-hover:text-white">
                              {match.homeTeam} <span className="font-normal text-slate-600">vs</span> {match.awayTeam}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ))}
              </div>
            </Panel>
          </motion.div>

          {/* ── TIPS HISTORY ───────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
          >
          <Panel>
            <div className="flex items-center gap-4 border-b border-[#132236] px-5 py-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nasi Rezultati</span>
              <div className="h-px flex-1 bg-[#132236]" />
            </div>
            <div className="p-4">
              <TipsHistory />
            </div>
          </Panel>
          </motion.div>
        </div>

        {/* ── FLOATING CHAT ──────────────────────────────────────────────────── */}
        <div className="fixed bottom-6 right-6 z-50 flex w-[calc(100vw-3rem)] flex-col items-end gap-3 sm:w-auto">
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="flex h-[70vh] w-full flex-col overflow-hidden rounded-2xl border border-[#1a3050] bg-[#07131f] shadow-2xl shadow-black/60 sm:h-[480px] sm:w-[380px]"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-[#132236] bg-[#0b1c2e] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    <span className="text-[12px] font-bold tracking-wide text-white">Chat</span>
                  </div>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#132236] text-slate-400 transition-colors hover:bg-[#1a3050] hover:text-white"
                    aria-label="Zatvori chat"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Chatbox />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setChatOpen((v) => !v)}
            className="group relative flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-900/40 transition-colors duration-200 hover:bg-blue-500"
            aria-label="Toggle community chat"
          >
            {!chatOpen && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                !
              </span>
            )}
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={chatOpen ? 2 : 1.8} viewBox="0 0 24 24">
              {chatOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
              )}
            </svg>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // ── LOGGED-OUT LANDING PAGE ────────────────────────────────────────────────
  return (
    <div className="absolute left-0 top-0 flex h-max w-full flex-col overflow-x-hidden bg-[#020912]">
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div className="relative flex min-h-screen min-w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#020912] via-[#04101e] to-[#020912] px-6 pt-20 min-[880px]:flex-row xl:justify-around">
        {/* Static background glows (kept static for smooth scrolling) */}
        <div className="pointer-events-none absolute left-1/3 top-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-600/[0.07] blur-[120px]" />

        {/* Hero copy */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          className="z-10 flex w-full max-w-[680px] flex-col text-center min-[880px]:text-left"
        >
          {[
            <div key="badge" className="mb-6 flex justify-center min-[880px]:justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">InsajderTips</span>
              </div>
            </div>,
            <h1 key="title" className="raceFont mb-6 text-4xl leading-[1.05] tracking-tight text-white md:text-6xl">
              <span className="block bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                Pobedjuj vise,
              </span>
              <span className="mt-1 block">
                kladi se{" "}
                <span className="relative inline-block text-blue-400">
                  pametnije
                  <span className="absolute -bottom-1.5 left-0 h-px w-full bg-gradient-to-r from-blue-500 to-transparent" />
                </span>
                .
              </span>
            </h1>,
            <p key="lead" className="font-main mx-auto mb-8 max-w-[500px] text-lg leading-relaxed text-slate-400 min-[880px]:mx-0 md:text-xl">
              Premium tipovi, detaljne analize i <span className="font-semibold text-white">pronalazac najboljih kvota</span>. Sve sto ti
              treba za profit na <span className="border-b border-blue-500/30 text-blue-400">jednom mestu</span>.
            </p>,
            <div key="proof" className="mb-10 flex items-center justify-center gap-6 min-[880px]:justify-start">
              <div className="flex -space-x-2">
                {["M", "S", "N", "A"].map((l, i) => (
                  <div
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#020b18] bg-gradient-to-br from-blue-500 to-indigo-600 text-[9px] font-black text-white"
                  >
                    {l}
                  </div>
                ))}
              </div>
              <div className="text-sm text-slate-400">
                <span className="font-bold text-white">120+</span> clanova zaradjuje
              </div>
              <StarRating />
            </div>,
            <div key="cta" className="flex flex-col justify-center gap-3 sm:flex-row min-[880px]:justify-start">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => nav("/onama")}
                className="group relative overflow-hidden rounded-xl bg-blue-600 px-8 py-4 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="raceFont relative text-sm font-bold tracking-widest text-white">SAZNAJ VISE</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => nav("/login")}
                className="raceFont rounded-xl border border-[#1a3050] bg-[#0b1c32]/60 px-8 py-4 text-sm tracking-widest text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-[#2a4d75] hover:bg-[#0f2540]"
              >
                PRIDRUZI SE
              </motion.button>
            </div>,
          ].map((child, i) => (
            <motion.div key={i} variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}>
              {child}
            </motion.div>
          ))}
        </motion.div>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="relative mt-14 rounded-2xl border border-[#1a3050]/60 bg-[#0b1c32]/40 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-md min-[880px]:mt-0"
        >
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
            <img
              src={stats}
              className="h-auto max-w-full rounded-xl object-cover opacity-95 lg:max-w-[520px] xl:max-w-[700px]"
              alt="Betting Tips Preview"
            />
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── LIVE ODDS TEASER (drives registration) ──────────────────────────── */}
      {teaser.length > 0 && <OddsTeaser teaser={teaser} nav={nav} />}

      {/* ── PREMIUM TIPS SECTION ────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#020912] via-[#050f1e] to-[#020912] px-6 py-24">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-full -translate-x-1/2 animate-pulse bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.07),transparent_65%)]" style={{ animationDuration: "10s" }} />

        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-16 text-center">
            <div className="mb-4 inline-block rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5">
              <span className="raceFont text-[10px] uppercase tracking-[0.2em] text-blue-400">InsajderTips</span>
            </div>
            <h2 className="raceFont mb-5 text-4xl tracking-tight text-white md:text-6xl">
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Premium Tipovi</span>
            </h2>
            <p className="font-main mx-auto max-w-2xl text-lg leading-relaxed text-slate-400">
              Detaljne analize meceva, sastavi, povrede i izostanci kao i dodatne informacije.
            </p>
          </Reveal>

          <div className="flex flex-col items-start gap-14 lg:flex-row">
            <div className="w-full space-y-10 lg:w-[45%]">
              {PREMIUM_FEATURES.map((f, i) => (
                <FeatureItem key={f.title} {...f} delay={i * 0.1} />
              ))}
            </div>

            {/* Demo tip card */}
            <Reveal delay={0.2} className="w-full lg:w-[55%]">
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group relative overflow-hidden rounded-[1.75rem] border border-[#1a3050] bg-[#0b1c32] shadow-2xl transition-colors hover:border-blue-500/40"
              >
                {/* hover glow */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/15 opacity-0 blur-[70px] transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative border-b border-[#1a3050] bg-gradient-to-b from-[#0f2540]/60 to-transparent p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="raceFont rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] tracking-widest text-blue-400">
                      PREMIUM ANALIZA
                    </span>
                    <span className="font-main text-[10px] uppercase tracking-widest text-slate-600">Premier Liga</span>
                  </div>
                  <h3 className="raceFont mb-3 text-2xl text-white md:text-3xl">Liverpool vs Man City</h3>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      21.09.2025
                    </span>
                    <span>17:30h</span>
                  </div>
                </div>

                <div className="space-y-6 p-7">
                  <div className="relative overflow-hidden rounded-2xl border border-blue-500/25 bg-[#050d17] p-5">
                    <div className="absolute right-0 top-0 p-4 opacity-[0.06]">
                      <svg className="h-14 w-14 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <p className="raceFont mb-2 text-[9px] uppercase tracking-widest text-slate-600">Predlozeni Tip</p>
                    <div className="flex items-end justify-between">
                      <div className="text-xl font-bold text-white md:text-2xl">Manchester City X</div>
                      <motion.div
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        className="raceFont text-2xl font-black text-blue-400"
                      >
                        @ 3.90
                      </motion.div>
                    </div>
                  </div>

                  <div>
                    <p className="raceFont mb-3 text-[9px] uppercase tracking-[0.2em] text-slate-600">Forma (poslednjih 5)</p>
                    <div className="flex gap-2">
                      {FORM_RESULTS.map((r, i) => (
                        <div
                          key={i}
                          className={`raceFont flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-black ${
                            r === "W"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : r === "D"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="group/peek relative">
                    <p className="raceFont mb-3 text-[9px] uppercase tracking-[0.2em] text-slate-600">Kljucna Analiza</p>
                    {/* Blurred sneak peek — un-blurs slightly on hover to tease the real content */}
                    <div className="select-none space-y-2.5 opacity-40 blur-sm transition-all duration-500 group-hover/peek:opacity-60 group-hover/peek:blur-[2px]">
                      <div className="h-3 w-full rounded bg-slate-700/60" />
                      <div className="h-3 w-[88%] rounded bg-slate-700/60" />
                      <div className="h-3 w-[94%] rounded bg-slate-700/60" />
                      <div className="h-3 w-[75%] rounded bg-slate-700/60" />
                    </div>
                    <div className="mt-4 flex justify-center">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => nav("/register")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-300 transition-colors hover:bg-blue-500/20"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 11V7a5 5 0 0110 0v4M5 11h10a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" />
                        </svg>
                        Registruj se da vidis punu analizu
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* ── FREE TIPS SECTION (free vs premium) ─────────────────────────────── */}
      <div className="relative w-full select-none overflow-hidden bg-gradient-to-b from-[#020912] via-[#050f1e] to-[#020912] px-6 py-24">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-full -translate-x-1/2 animate-pulse bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.07),transparent_65%)]" style={{ animationDuration: "11s" }} />

        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-14 text-center">
            <div className="mb-4 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5">
              <span className="raceFont text-[10px] uppercase tracking-[0.2em] text-emerald-400">Free</span>
            </div>
            <h2 className="raceFont mb-5 text-4xl tracking-tight text-white md:text-6xl">
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Besplatni Tipovi</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              Svaki dan delimo <b className="text-white">besplatne tipove</b> svim registrovanim clanovima. 
            </p>
          </Reveal>

          <div className="mx-auto max-w-3xl">
            {/* Free vs Premium comparison (full width) */}
            <Reveal>
              <div className="flex flex-col rounded-[1.75rem] border border-[#1a3050] bg-[#0b1c32]/60 p-7 sm:p-9">
                <h3 className="raceFont mb-1 text-2xl text-white">Besplatno vs Premium</h3>
                <p className="mb-7 text-base text-slate-400">Krenni besplatno, nadogradi na Premium kad pozelis vise.</p>

                <motion.div
                  className="overflow-hidden rounded-xl border border-white/5"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
                >
                  <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr] bg-[#07131f]">
                    <div className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-600">Sta dobijas</div>
                    <div className="px-2 py-3 text-center text-[11px] font-black uppercase tracking-wider text-emerald-400">Besplatno</div>
                    <div className="bg-blue-500/[0.06] px-2 py-3 text-center text-[11px] font-black uppercase tracking-wider text-blue-400">Premium</div>
                  </div>
                  {FREE_VS_PREMIUM.map((row) => (
                    <motion.div
                      key={row.label}
                      variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="grid grid-cols-[1.8fr_0.8fr_0.8fr] border-t border-white/5"
                    >
                      <div className="px-5 py-4 text-left text-sm font-medium text-slate-300">{row.label}</div>
                      <div className="flex items-center justify-center py-4">{row.free ? <CheckMark /> : <CrossMark />}</div>
                      <div className="flex items-center justify-center bg-blue-500/[0.03] py-4">{row.premium ? <CheckMark /> : <CrossMark />}</div>
                    </motion.div>
                  ))}
                </motion.div>

                <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => nav("/register")}
                    className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-900/30 transition-transform hover:scale-[1.02]"
                  >
                    Napravi besplatan nalog
                  </motion.button>
        
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* ── STATISTICS SECTION ──────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#020912] via-[#050f1e] to-[#020912] px-6 py-24">
        <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-blue-600/[0.07] blur-[130px]" style={{ animationDuration: "10s" }} />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-96 w-96 animate-pulse rounded-full bg-indigo-600/[0.07] blur-[130px]" style={{ animationDuration: "12s", animationDelay: "1.5s" }} />

        <div className="mx-auto max-w-6xl">
          <div className="mb-20 flex flex-col items-center gap-16 lg:flex-row">
            <Reveal className="space-y-6 text-center lg:w-1/2 lg:text-left">
              <h2 className="raceFont text-4xl leading-[1.08] text-white md:text-5xl lg:text-6xl">
                Pratite napredne
                <span className="mt-2 block text-blue-400">statistike opklada</span>
              </h2>
              <p className="font-main mx-auto max-w-lg text-lg leading-relaxed text-slate-400 lg:mx-0">
                Pratite vase opklade po godini, mesecu i danu. <span className="font-semibold text-white">Nema vise nagadjanja</span> — u
                svakom trenutku vidis tacno gde si u plusu.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="relative lg:w-1/2">
              <div className="absolute inset-0 rounded-full bg-blue-500/8 blur-[90px]" />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ scale: 1.02, y: 0 }}
                className="group relative rounded-2xl border border-[#1a3050] bg-[#0b1c32]/50 p-2 shadow-2xl transition-colors hover:border-blue-500/40"
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-blue-500/0 transition-all duration-500 group-hover:ring-blue-500/25" />
                <img src={stats2} alt="Statistics Dashboard Preview" className="w-full rounded-xl" />
              </motion.div>
            </Reveal>
          </div>
        </div>
      </div>

{/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#020912] via-[#050f1e] to-[#020912] px-6 py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.08),transparent_65%)]" />
        <Reveal className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="raceFont mb-4 text-4xl leading-tight text-white md:text-5xl">
            Spreman da pocnes <span className="text-blue-400">da zaradjujes?</span>
          </h2>
          <p className="mb-10 text-lg text-slate-400">Pridruzi se ostalim clanovima koji vec koriste Insajder za profit.</p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => nav("/login")}
            className="raceFont group relative overflow-hidden rounded-2xl bg-blue-600 px-12 py-5 text-sm font-bold tracking-widest text-white shadow-[0_0_50px_rgba(37,99,235,0.35)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative">PRIDRUZI SE!</span>
          </motion.button>
        </Reveal>
      </div>
    </div>
  );
}
