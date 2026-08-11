import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import yamal from "../assets/yamal_login.jpg";
import { setUser } from "../redux/slices/UserSlice";
import RequestPasswordReset from "../components/RequestPasswordReset";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

const CURRENCIES = ["RSD", "EUR", "BAM"];

// Staggered reveal for the form fields (replays whenever the view changes).
const fieldsContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const fieldItem = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export default function Login({ mode }: { mode: string }): React.ReactNode {
  const [currentView, setCurrentView] = useState<string>(mode);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    defaultCurrency: "",
    password: "",
    errorMessage: null as string | null,
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const nav = useNavigate();
  const dispatch = useDispatch();

  const validateForm = (): boolean => {
    if (currentView === "register") {
      const forbidden = ["admin", "administrator", "support", "moderator", "insajder", "root", "vlasnik", "staff"];
      const userClean = formData.username.toLowerCase().trim();

      if (forbidden.some((word) => userClean.includes(word))) {
        setFormData((p) => ({ ...p, errorMessage: "Korisničko ime je rezervisano." }));
        return false;
      }
      if (userClean.length < 3) {
        setFormData((p) => ({ ...p, errorMessage: "Korisničko ime je prekratko." }));
        return false;
      }
      if (!formData.defaultCurrency) {
        setFormData((p) => ({ ...p, errorMessage: "Izaberite valutu klikom na jedno od polja." }));
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormData((p) => ({ ...p, errorMessage: "Unesite ispravan email." }));
      return false;
    }
    if (formData.password.length < 6) {
      setFormData((p) => ({ ...p, errorMessage: "Lozinka mora imati min. 6 karaktera." }));
      return false;
    }
    return true;
  };

  const handleAuth = async (action: "login" | "register") => {
    if (!validateForm()) return;
    setIsLoading(true);
    setFormData((p) => ({ ...p, errorMessage: null }));

    try {
      const endpoint = action === "login" ? "login" : "register";
      const body =
        action === "login"
          ? { email: formData.email, password: formData.password, rememberMe }
          : {
              email: formData.email,
              password: formData.password,
              username: formData.username,
              defaultCurrency: formData.defaultCurrency,
            };

      const res = await fetch(`/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Greška na serveru.");
      }

      if (action === "register") {
        setCurrentView("login");
        return;
      }

      const data = await res.json();
      localStorage.setItem("insajder_token", data.token);

      const userRes = await fetch("/user", {
        headers: { Authorization: `Bearer ${data.token}` },
      });

      if (!userRes.ok) throw new Error("Podaci nisu dostupni.");

      const user = await userRes.json();
      dispatch(
        setUser({
          _id: user.user._id,
          email: user.user.email,
          tier: user.user.tier,
          username: user.user.username,
          isAuthenticated: true,
          defaultCurrency: user.user.defaultCurrency,
          isVerified: user.user.isVerified,
          vc: user.user.verificationCode,
        })
      );

      nav("/");
    } catch (error: any) {
      setFormData((p) => ({ ...p, errorMessage: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const isRegister = currentView === "register";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#020b18] p-4">
      {/* Animated ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 110, damping: 18 }}
        className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-[#1a3050] bg-[#07131f]/60 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl lg:flex-row"
      >
        {/* ── BRAND / IMAGE PANEL ─────────────────────────────────────────── */}
        <div className="relative min-h-[250px] w-full overflow-hidden lg:min-h-[700px] lg:w-5/12">
          <motion.img
            src={yamal}
            className="absolute inset-0 h-full w-full object-cover brightness-90 grayscale-[0.2]"
            alt="Footballer"
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020b18] via-[#020b18]/20 to-transparent lg:bg-gradient-to-r" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute bottom-8 left-8 right-8"
          >
         
            <h1 className="text-5xl font-black italic tracking-tighter text-white sm:text-6xl">
              INSAJDER<span className="text-emerald-400">.</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">Pobeđuj više, kladi se pametnije.</p>
          </motion.div>
        </div>

        {/* ── FORM PANEL ──────────────────────────────────────────────────── */}
        <div className="flex w-full flex-col justify-center p-8 sm:p-16 lg:w-7/12">
          {currentView === "passreset" ? (
            <RequestPasswordReset setView={setCurrentView} />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAuth(isRegister ? "register" : "login");
              }}
              className="mx-auto w-full max-w-md"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  variants={fieldsContainer}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: isRegister ? 24 : -24, transition: { duration: 0.2 } }}
                >
                  <motion.header variants={fieldItem} className="mb-10">
                    <h2 className="mb-2 text-4xl font-black tracking-tight text-white">
                      {isRegister ? "Novi Nalog" : "Prijava"}
                    </h2>
                    <div className="h-1 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                  </motion.header>

                  <div className="space-y-4">
                    {isRegister && (
                      <>
                        <motion.div variants={fieldItem} className="mb-6 space-y-3">
                          <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Odaberi Valutu</label>
                          <div className="grid grid-cols-3 gap-2">
                            {CURRENCIES.map((curr) => {
                              const active = formData.defaultCurrency === curr.toLowerCase();
                              return (
                                <motion.button
                                  key={curr}
                                  type="button"
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => setFormData((p) => ({ ...p, defaultCurrency: curr.toLowerCase() }))}
                                  className={`rounded-xl border py-3 text-xs font-bold transition-colors ${
                                    active
                                      ? "border-blue-400 bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                                      : "border-white/5 bg-[#0b1c2e] text-slate-400 hover:border-white/20"
                                  }`}
                                >
                                  {curr}
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>

                        <motion.div variants={fieldItem} className="group relative">
                          <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400" />
                          <input
                            type="text"
                            placeholder="Korisničko Ime"
                            className="w-full rounded-2xl border border-white/5 bg-[#0b1c2e] py-4 pl-11 text-sm text-white outline-none transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                            onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                          />
                        </motion.div>
                      </>
                    )}

                    <motion.div variants={fieldItem} className="group relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400" />
                      <input
                        type="email"
                        placeholder="Email Adresa"
                        className="w-full rounded-2xl border border-white/5 bg-[#0b1c2e] py-4 pl-11 text-sm text-white outline-none transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                      />
                    </motion.div>

                    <motion.div variants={fieldItem} className="group relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400" />
                      <input
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="Lozinka"
                        className="w-full rounded-2xl border border-white/5 bg-[#0b1c2e] py-4 pl-11 pr-12 text-sm text-white outline-none transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                        onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
                      >
                        {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </motion.div>

                    <motion.div variants={fieldItem} className="flex items-center justify-between px-1">
                      <label className="group flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} className="hidden" />
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-lg border transition-all ${
                            rememberMe ? "border-blue-500 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]" : "border-white/10 bg-[#0b1c2e]"
                          }`}
                        >
                          <AnimatePresence>
                            {rememberMe && (
                              <motion.svg
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="h-3 w-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={3}
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </motion.svg>
                            )}
                          </AnimatePresence>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors group-hover:text-slate-300">
                          Zapamti me
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setCurrentView("passreset")}
                        className="text-[10px] font-black uppercase tracking-widest text-blue-400 transition-colors hover:text-blue-300"
                      >
                        Zaboravljena lozinka?
                      </button>
                    </motion.div>

                    <AnimatePresence>
                      {formData.errorMessage && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, x: 0 }}
                          animate={{ opacity: 1, height: "auto", x: [0, -8, 8, -5, 5, 0] }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ x: { duration: 0.4 } }}
                          className="flex items-center gap-3 overflow-hidden rounded-2xl border border-red-500/10 bg-red-500/5 p-4 text-[11px] font-bold tracking-wide text-red-400"
                        >
                          <AlertCircle size={14} className="shrink-0" />
                          {formData.errorMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    variants={fieldItem}
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.97 }}
                    className="mt-8 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-blue-900/30 transition-shadow hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : isRegister ? "Kreiraj Profil" : "Prijavi se"}
                  </motion.button>

                  <motion.div variants={fieldItem} className="mt-7">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
                        {isRegister ? "Vec imaš nalog?" : "Nemaš nalog?"}
                      </span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setCurrentView(isRegister ? "login" : "register")}
                      className="w-full rounded-2xl border border-blue-500/40 bg-blue-500/10 py-3.5 text-[11px] font-black uppercase tracking-[0.15em] text-blue-300 transition-all hover:border-blue-400/60 hover:bg-blue-500/20 hover:text-white hover:shadow-[0_0_24px_rgba(59,130,246,0.25)]"
                    >
                      {isRegister ? "Uloguj se" : "Registruj se besplatno"}
                    </motion.button>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
