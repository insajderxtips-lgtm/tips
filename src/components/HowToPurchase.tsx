import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useOutlet, useParams } from "react-router";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  Info,
  AlertTriangle,
  FileText,
  X,
  ShieldCheck,
  Banknote,
  Building2,
  Lock,
  Upload,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { RootState } from "../redux/store";
import uplatnica from "../assets/uplatnica.jpg";

// ── Borderless glass helpers ──────────────────────────────────────────────────
const GLASS = "rounded-2xl bg-[#07131f]/80 shadow-[0_24px_64px_rgba(0,0,0,0.7)] backdrop-blur-2xl";
const INNER = "rounded-xl bg-[#0b1c2e]/80";

// ── Payment method definitions ────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: "western",
    title: "Western Union",
    subtitle: "Gotovinom na šalteru",
    description: "Uplatite gotovinu na najbližem WU punktu i potvrdite MTCN brojem.",
    Icon: Banknote,
    glow: "rgba(245,158,11,0.25)",
    orb: "rgba(245,158,11,0.08)",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    subtitleColor: "text-amber-400/70",
    activeRing: "shadow-[0_0_0_2px_rgba(245,158,11,0.5),0_0_60px_rgba(245,158,11,0.15)]",
    btn: "from-amber-500 to-orange-500",
    btnShadow: "shadow-[0_8px_32px_rgba(245,158,11,0.4)]",
    tag: "Popularan",
    tagStyle: "bg-amber-500/15 text-amber-400",
    url: "/kupi/western",
    available: true,
  },
  {
    id: "uplatnica",
    title: "Uplatnica",
    subtitle: "Banka · Pošta · Menjačnica",
    description: "Platite uplatnicom i pošaljite nam sliku potvrde sa pečatom.",
    Icon: Building2,
    glow: "rgba(59,130,246,0.25)",
    orb: "rgba(59,130,246,0.08)",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    subtitleColor: "text-blue-400/70",
    activeRing: "shadow-[0_0_0_2px_rgba(59,130,246,0.5),0_0_60px_rgba(59,130,246,0.15)]",
    btn: "from-blue-600 to-indigo-600",
    btnShadow: "shadow-[0_8px_32px_rgba(59,130,246,0.4)]",
    tag: null,
    tagStyle: "",
    url: "/kupi/uplatnica",
    available: true,
  },
] as const;

type MethodId = (typeof PAYMENT_METHODS)[number]["id"];

// ── 3-D tilt wrapper ──────────────────────────────────────────────────────────
function TiltCard({ children, className = "", disabled = false }: { children: React.ReactNode; className?: string; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={disabled ? {} : { rotateX, rotateY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Already premium ───────────────────────────────────────────────────────────
function AlreadyPremium() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className={`max-w-md w-full p-10 text-center ${GLASS}`}
      >
        <motion.div initial={{ scale: 0.5, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 14 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_50px_rgba(245,158,11,0.4)]"
        >
          <Sparkles className="h-10 w-10 text-white" />
        </motion.div>
        <h2 className="mb-2 text-3xl font-black text-white">Premium</h2>
        <p className="mb-4 text-lg font-bold text-amber-400">Već ste Premium korisnik!</p>
        <p className="text-sm text-slate-400 leading-relaxed">Hvala Vam na pretplati. Uživajte u svim premium funkcijama.</p>
      </motion.div>
    </div>
  );
}

// ── Trust strip ───────────────────────────────────────────────────────────────
function TrustStrip() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
      className="mt-8 flex items-center justify-center gap-8 flex-wrap"
    >
      {[
        { Icon: ShieldCheck, label: "Sigurna kupovina" },
        { Icon: Lock, label: "Zaštita podataka" },
        { Icon: Clock, label: "Aktivacija u 24h" },
      ].map(({ Icon, label }) => (
        <div key={label} className="flex items-center gap-2 text-slate-700">
          <Icon className="h-3.5 w-3.5" />
          <span className="text-xs">{label}</span>
        </div>
      ))}
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HowToPurchase() {
  const [selectedId, setSelectedId] = useState<MethodId | null>(null);
  const loggedIn = useSelector((state: RootState) => state.user.isAuthenticated);
  const tier     = useSelector((state: RootState) => state.user.tier);
  const outlet   = useOutlet();
  const nav      = useNavigate();

  if (tier === "premium") return <AlreadyPremium />;

  const selected = PAYMENT_METHODS.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Ambient background orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      {outlet ? (
        outlet
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
          className="relative w-full max-w-3xl"
        >
          {/* Hero */}
          <div className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-5 py-2 shadow-[0_0_0_1px_rgba(245,158,11,0.12)]"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Premium Članarina</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, type: "spring", stiffness: 160, damping: 22 }}
              className="mb-4 text-5xl font-black text-white sm:text-6xl"
            >
              Postanite{" "}
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                Premium
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
              className="mb-6 text-slate-500 sm:text-lg"
            >
              Izaberite način plaćanja i dobijte pristup svim premium sadržajima
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="inline-block rounded-2xl bg-[#07131f]/60 px-8 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            >
              <span className="text-4xl font-black text-white">20 €</span>
              <span className="ml-1.5 text-slate-500">/ mesec</span>
              <div className="mt-0.5 text-xs text-slate-700">≈ 2.300 RSD</div>
            </motion.div>
          </div>

          {/* Method cards */}
          <div className="grid gap-5 sm:grid-cols-2">
            {PAYMENT_METHODS.map((method, i) => {
              const active = selectedId === method.id;
              return (
                <motion.div key={method.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.1, type: "spring", stiffness: 150, damping: 20 }}
                >
                  <TiltCard disabled={!method.available}>
                    <motion.button
                      whileHover={method.available ? { y: -4 } : {}}
                      whileTap={method.available ? { scale: 0.97 } : {}}
                      onClick={() => method.available && setSelectedId(method.id)}
                      disabled={!method.available}
                      className={`relative flex w-full flex-col items-start gap-4 rounded-2xl p-5 text-left transition-all duration-300 backdrop-blur-xl ${
                        active
                          ? `bg-[#0d1f33] ${method.activeRing}`
                          : method.available
                          ? "bg-[#07131f]/60 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-[#0b1c2e]/80 hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
                          : "cursor-not-allowed bg-[#07131f]/30 opacity-50 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                      }`}
                    >
                      {/* Active radial orb */}
                      {active && (
                        <motion.div layoutId="card-orb" className="absolute inset-0 rounded-2xl"
                          style={{ background: `radial-gradient(ellipse at 50% 0%, ${method.orb} 0%, transparent 70%)` }}
                        />
                      )}

                      {/* Tag */}
                      {method.tag && (
                        <span className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${method.tagStyle}`}>
                          {method.tag}
                        </span>
                      )}

                      {/* Icon */}
                      <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl ${method.iconBg}`}>
                        <method.Icon className={`h-6 w-6 ${method.iconColor}`} />
                        {active && (
                          <motion.div layoutId="icon-glow" className="absolute inset-0 rounded-xl"
                            style={{ boxShadow: `0 0 20px ${method.glow}` }} />
                        )}
                      </div>

                      {/* Text */}
                      <div className="relative flex-1">
                        <p className={`mb-0.5 text-[11px] font-semibold uppercase tracking-wider ${method.subtitleColor}`}>
                          {method.subtitle}
                        </p>
                        <h3 className="mb-2 text-lg font-black text-white">{method.title}</h3>
                        <p className="text-xs leading-relaxed text-slate-500">{method.description}</p>
                      </div>

                      {/* Selection dot */}
                      <div
                        className={`relative flex h-5 w-5 shrink-0 self-end items-center justify-center rounded-full transition-all duration-300 ${
                          active ? `bg-gradient-to-br ${method.btn}` : "bg-[#0b1c2e] shadow-[0_0_0_1.5px_rgba(30,60,90,0.8)]"
                        }`}
                        style={active ? { boxShadow: `0 0 12px ${method.glow}` } : {}}
                      >
                        <AnimatePresence>
                          {active && (
                            <motion.span
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            >
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              {!selected ? (
                <motion.div key="placeholder"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}
                  className="flex h-14 items-center justify-center rounded-2xl bg-[#07131f]/40 text-sm text-slate-700"
                >
                  Odaberite način plaćanja
                </motion.div>
              ) : (
                <motion.button
                  key={selected.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => loggedIn ? nav(selected.url, { state: { selectedId } }) : nav("/login")}
                  className={`flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r ${selected.btn} font-bold text-white text-base transition-all ${selected.btnShadow}`}
                >
                  Nastavi sa {selected.title}
                  <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <TrustStrip />
        </motion.div>
      )}
    </div>
  );
}

// ── StepTwo — outlet inside HowToPurchase ─────────────────────────────────────
export function StepTwo() {
  const { paymentOption } = useParams();
  const nav               = useNavigate();
  const [view, setView]   = useState(1);
  const [mtcn, setMtcn]   = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus]       = useState<{ success: boolean | null; message: string }>({ success: null, message: "" });
  const email    = useSelector((state: RootState) => state?.user?.email);
  const username = useSelector((state: RootState) => state?.user?.username);

  const validateWestern = async () => {
    if (!mtcn || mtcn.length !== 10 || [...mtcn].some((c) => isNaN(Number(c)))) {
      setStatus({ success: false, message: "MTCN mora imati tačno 10 cifara (samo brojevi)" });
      return;
    }
    setIsLoading(true);
    setStatus({ success: null, message: "" });
    try {
      const res  = await fetch("/addPayment", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userEmail: email, userName: username, paymentType: "western", mtcn }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ success: true, message: "Uspešno potvrđeno!" });
      } else if (res.status === 429) {
        setStatus({ success: false, message: data.message || "Prekoračen broj pokušaja. Pokušajte ponovo kasnije." });
      } else {
        throw new Error(data.message || "Greška pri obradi uplate");
      }
    } catch (err: any) {
      setStatus({ success: false, message: err.message || "Greška pri slanju podataka" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = () => { setMtcn(""); setView(1); setStatus({ success: null, message: "" }); };

  const renderContent = () => {
    switch (paymentOption) {
      case "uplatnica": return <StepOne />;
      case "western":
        if (status.success) return <WesternSuccess mtcn={mtcn} onReset={resetFlow} />;
        if (view === 1) return <WesternInfo onContinue={() => setView(2)} />;
        return <WesternMTCN mtcn={mtcn} setMtcn={setMtcn} isLoading={isLoading} status={status} onBack={() => setView(1)} onSubmit={validateWestern} />;
      default:
        return (
          <div className={`p-8 text-center ${GLASS}`}>
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-400" />
            <h2 className="mb-2 text-xl font-bold text-red-400">Greška pri plaćanju</h2>
            <p className="text-sm text-red-300/70">Odabrani način plaćanja nije validan.</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ x: -3 }}
        onClick={() => nav("/kupi")}
        className="mb-6 inline-flex items-center gap-2 rounded-xl bg-[#07131f]/60 px-4 py-2 text-sm text-slate-500 shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-colors hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Nazad na izbor
      </motion.button>
      {renderContent()}
    </div>
  );
}

// ── Western Union: Info view ──────────────────────────────────────────────────
function WesternInfo({ onContinue }: { onContinue: () => void }) {
  const STEPS = [
    { text: <>Idite do najbliže <strong className="text-white">menjačnice, pošte ili banke</strong> koja nudi Western Union (ili platite online na <strong className="text-white">wu.com</strong>).</> },
    { text: <>Recite da želite da <strong className="text-white">pošaljete novac</strong> putem Western Uniona u Srbiju.</> },
    { text: <>Nakon uplate dobićete <strong className="text-white">10-cifreni MTCN broj</strong> — sačuvajte ga.</> },
    { text: <>Kliknite <strong className="text-white">„Nastavi na potvrdu"</strong> i unesite MTCN.</> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${GLASS} overflow-hidden`}>
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Banknote className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Western Union</h2>
            <p className="text-xs text-slate-600">Pratite korake ispod</p>
          </div>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-amber-500/20 via-transparent to-transparent" />

      <div className="space-y-5 p-6">
        <div className={`${INNER} p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/70">Podaci za uplatu</p>
          <div className="space-y-3">
            {[
              { label: "Primaoc", value: "Bogdan Djakovic" },
              { label: "Država",  value: "Srbija" },
              { label: "Iznos",   value: "20 EUR · ≈ 2.300 RSD", highlight: true },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-slate-600">{label}</span>
                <span className={`text-sm font-semibold ${highlight ? "text-amber-400" : "text-white"}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }} className="flex gap-3"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-400">
                {i + 1}
              </span>
              <p className="text-sm text-slate-400 leading-relaxed">{step.text}</p>
            </motion.li>
          ))}
        </ol>

        <div className="flex gap-2.5 rounded-xl bg-blue-500/5 p-3.5 shadow-[0_0_0_1px_rgba(59,130,246,0.08)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400/60" />
          <p className="text-xs text-blue-400/60 leading-relaxed">
            Nakon unosa MTCN-a, proverićemo uplatu i aktivirati Premium u roku od 24h.
          </p>
        </div>

        <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }} onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 font-bold text-black shadow-[0_8px_32px_rgba(245,158,11,0.35)] transition-all hover:shadow-[0_12px_40px_rgba(245,158,11,0.45)]"
        >
          Nastavi na potvrdu <ArrowRight className="h-5 w-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Western Union: MTCN input ─────────────────────────────────────────────────
function WesternMTCN({ mtcn, setMtcn, isLoading, status, onBack, onSubmit }: {
  mtcn: string; setMtcn: (v: string) => void;
  isLoading: boolean; status: { success: boolean | null; message: string };
  onBack: () => void; onSubmit: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${GLASS} overflow-hidden`}>
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent px-6 py-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b1c2e]/80 text-slate-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-black text-white">MTCN broj</h2>
            <p className="text-xs text-slate-600">10-cifreni broj sa vaše potvrde</p>
          </div>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-amber-500/20 via-transparent to-transparent" />

      <div className="space-y-5 p-6">
        <div className={`flex gap-3 ${INNER} p-4`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
            <Info className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold text-amber-400/80">Gde da nađem MTCN?</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              MTCN je <strong className="text-white">10-cifreni broj</strong> koji se nalazi na vašoj Western Union potvrdi o uplati.
            </p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-400">MTCN broj</label>
          <div className="relative">
            <input
              type="text" inputMode="numeric" maxLength={10} placeholder="1234567890"
              value={mtcn} onChange={(e) => setMtcn(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl bg-[#0b1c2e]/80 px-4 py-3.5 font-mono text-2xl tracking-[0.3em] text-white placeholder-slate-800 outline-none transition-all shadow-[0_0_0_1.5px_rgba(20,40,70,0.8)] focus:shadow-[0_0_0_2px_rgba(245,158,11,0.4),0_0_30px_rgba(245,158,11,0.1)]"
            />
            <ShieldCheck className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700" />
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-xs text-slate-700">Samo cifre · bez razmaka</span>
            <span className={`font-mono text-xs ${mtcn.length === 10 ? "text-emerald-500" : "text-slate-700"}`}>{mtcn.length}/10</span>
          </div>
        </div>

        <AnimatePresence>
          {status.message && (
            <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className={`flex items-start gap-2.5 rounded-xl p-3.5 text-sm overflow-hidden ${
                status.success === false
                  ? "bg-red-500/8 text-red-300 shadow-[0_0_0_1px_rgba(239,68,68,0.15)]"
                  : "bg-blue-500/8 text-blue-300 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]"
              }`}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -1 }}
          whileTap={{ scale: isLoading ? 1 : 0.97 }}
          onClick={onSubmit}
          disabled={isLoading || mtcn.length !== 10}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 font-bold text-black shadow-[0_8px_32px_rgba(245,158,11,0.35)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading
            ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-5 w-5 rounded-full border-2 border-black/20 border-t-black" /> Proveravam...</>
            : <><Check className="h-5 w-5" strokeWidth={3} /> Potvrdi uplatu</>
          }
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Western Union: Success ────────────────────────────────────────────────────
function WesternSuccess({ mtcn, onReset }: { mtcn: string; onReset: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      className={`${GLASS} overflow-hidden`}
    >
      <div className="flex flex-col items-center bg-gradient-to-b from-emerald-500/10 to-transparent px-6 py-10">
        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 14 }}
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]"
        >
          <CheckCircle2 className="h-10 w-10 text-white" />
        </motion.div>
        <h3 className="text-2xl font-black text-white">Uspešno poslato!</h3>
        <p className="mt-1 text-sm text-emerald-400/80">Uplata je primljena na obradu</p>
      </div>

      <div className="space-y-4 p-6">
        <p className="text-center text-sm text-slate-500 leading-relaxed">
          Ukoliko je sve u redu, Premium pristup će biti aktiviran u što kraćem roku.
        </p>
        <div className={`${INNER} p-4`}>
          <p className="mb-1 text-xs text-slate-600">Broj transakcije (MTCN)</p>
          <p className="font-mono text-2xl tracking-[0.25em] text-white">{mtcn}</p>
        </div>
        <div className="flex gap-2 rounded-xl bg-blue-500/5 p-3 shadow-[0_0_0_1px_rgba(59,130,246,0.08)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400/60" />
          <p className="text-xs text-blue-400/60">
            Podrška:{" "}
            <a href="mailto:podrska@insajder.tips" className="font-semibold text-blue-400 underline">podrska@insajder.tips</a>
          </p>
        </div>
        <button onClick={onReset}
          className="w-full rounded-xl bg-[#0b1c2e]/80 py-3 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
        >
          Zatvori
        </button>
      </div>
    </motion.div>
  );
}

// ── StepOne (Uplatnica) ───────────────────────────────────────────────────────
export function StepOne() {
  const [currentImage, setCurrentImage] = useState<File | null>(null);
  const userEmail = useSelector((state: RootState) => state?.user?.email);
  const username  = useSelector((state: RootState) => state?.user?.username);
  const [status, setStatus]     = useState<{ code: number | null; message: string | null }>({ code: null, message: null });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setStatus({ code: null, message: null }); }, [currentImage]);

  const confirmPayment = async () => {
    if (!currentImage || !userEmail) return;
    setUploading(true);
    setStatus({ code: null, message: null });
    const form = new FormData();
    form.append("file", currentImage);
    form.append("userEmail", userEmail);
    form.append("userName", username);
    form.append("paymentType", "uplatnica");
    try {
      const res  = await fetch("/addPayment", { method: "POST", body: form });
      const data = await res.json();
      setStatus({ code: res.status, message: data.message || (res.ok ? "Slika je uspešno poslata!" : "Greška.") });
    } catch {
      setStatus({ code: 400, message: "Greška u komunikaciji sa serverom." });
    } finally {
      setUploading(false);
    }
  };

  const STEPS = [
    { title: "Popunite uplatnicu", text: "Unesite sve podatke tačno kao na slici. Žiro: 160-6000001475315-20" },
    { title: "Izvršite uplatu",    text: "Uplatite iznos u najbližoj banci, menjačnici ili pošti." },
    { title: "Pošaljite dokaz",    text: "Slikajte uplatnicu sa pečatom i uploadujte je ispod." },
  ];

  const isSuccess = status.code === 200;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`w-full ${GLASS} overflow-hidden`}>
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <Building2 className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Uplata putem uplatnice</h2>
            <p className="text-xs text-slate-600">Banka · Pošta · Menjačnica</p>
          </div>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-blue-500/20 via-transparent to-transparent" />

      <div className="space-y-5 p-6">
        <div className="overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <img src={uplatnica} alt="Uplatnica" className="w-full" />
        </div>

        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className={`flex gap-3 ${INNER} p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-xs font-bold text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]">
                {i + 1}
              </span>
              <div>
                <p className="mb-0.5 text-sm font-semibold text-blue-400/80">{step.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{step.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Pošaljite potvrdu</p>
          <AnimatePresence mode="wait">
            {!currentImage ? (
              <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <label htmlFor="paymentFile"
                  className="flex cursor-pointer flex-col items-center gap-3 rounded-xl bg-[#0b1c2e]/60 px-6 py-8 text-center transition-all hover:bg-blue-500/5 shadow-[inset_0_0_0_1.5px_rgba(30,60,100,0.5)] hover:shadow-[inset_0_0_0_1.5px_rgba(59,130,246,0.3),0_0_30px_rgba(59,130,246,0.05)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.12)]">
                    <Upload className="h-6 w-6 text-blue-400/70" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-sm font-semibold text-white">Kliknite za upload</p>
                    <p className="text-xs text-slate-600">Slika ili PDF · Uplatnica mora imati pečat</p>
                  </div>
                </label>
                <input id="paymentFile" type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) setCurrentImage(e.target.files[0]); }} />
              </motion.div>
            ) : (
              <motion.div key="selected" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className={`flex items-center gap-3 ${INNER} px-4 py-3`}>
                  <FileText className="h-5 w-5 shrink-0 text-emerald-400/80" />
                  <span className="flex-1 truncate text-sm text-white">{currentImage.name}</span>
                  <button onClick={() => setCurrentImage(null)} className="rounded-lg p-1 text-slate-600 transition-colors hover:text-red-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <AnimatePresence>
                  {status.message && (
                    <motion.div initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className={`flex items-start gap-2 rounded-xl p-3.5 text-sm overflow-hidden ${
                        isSuccess
                          ? "bg-emerald-500/8 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]"
                          : "bg-red-500/8 text-red-300 shadow-[0_0_0_1px_rgba(239,68,68,0.15)]"
                      }`}
                    >
                      {isSuccess ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                      {status.message}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isSuccess && (
                  <motion.button
                    whileHover={{ scale: uploading ? 1 : 1.02, y: uploading ? 0 : -1 }}
                    whileTap={{ scale: uploading ? 1 : 0.97 }}
                    onClick={confirmPayment}
                    disabled={uploading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 font-bold text-white shadow-[0_8px_32px_rgba(59,130,246,0.35)] transition-all disabled:opacity-50"
                  >
                    {uploading
                      ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white" /> Šaljem...</>
                      : <><Upload className="h-5 w-5" /> Pošalji uplatnicu</>
                    }
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
