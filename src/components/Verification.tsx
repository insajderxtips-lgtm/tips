import React, { useState, useRef, useEffect, ClipboardEvent, KeyboardEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Mail } from "lucide-react";
import { RootState } from "../redux/store";
import { setUser } from "../redux/slices/UserSlice";
import { useNavigate } from "react-router";

const COOLDOWN = 30;

const Verifikacija: React.FC = () => {
  const [otp, setOtp]               = useState<string[]>(new Array(6).fill(""));
  const [message, setMessage]       = useState("");
  const [status, setStatus]         = useState<"success" | "error" | "">("");
  const [cooldown, setCooldown]     = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs                   = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef                    = useRef<ReturnType<typeof setInterval> | null>(null);

  const email    = useSelector((state: RootState) => state.user?.email);
  const user     = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const nav      = useNavigate();

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCooldown = () => {
    setCooldown(COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && inputRefs.current[index + 1]) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const finalCode = otp.join("");
    if (finalCode.length < 6 || !email) {
      setStatus("error");
      setMessage("Unesite kompletan 6-cifreni kod.");
      return;
    }

    setIsVerifying(true);
    setMessage("");
    setStatus("");

    try {
      const res  = await fetch("/verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, code: finalCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Greška pri verifikaciji.");
        return;
      }

      setStatus("success");
      setMessage("Nalog je uspešno verifikovan!");
      dispatch(setUser({ ...user, isVerified: true }));
      setTimeout(() => nav("/"), 1800);
    } catch {
      setStatus("error");
      setMessage("Greška na mreži. Pokušajte ponovo.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;

    startCooldown();
    setMessage("");
    setStatus("");

    try {
      const res  = await fetch("/resend-code", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();

      setStatus(res.ok ? "success" : "error");
      setMessage(data.message || (res.ok ? "Kod je poslat!" : "Greška pri slanju."));
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch {
      setStatus("error");
      setMessage("Greška na mreži. Pokušajte ponovo.");
    }
  };

  const isFull    = otp.every((d) => d !== "");
  const isSuccess = status === "success";

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4">
      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-500/8 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative w-full max-w-md"
      >
        {/* Card — no border, shadow only */}
        <div className="overflow-hidden rounded-3xl bg-[#07131f]/80 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl">

          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400" />

          <div className="px-8 pb-8 pt-8 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 220, damping: 16 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
            >
              <ShieldCheck className="h-10 w-10 text-blue-400" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-2 text-3xl font-black tracking-tight text-white"
            >
              Email Verifikacija
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8 flex items-center justify-center gap-2 text-sm text-slate-400"
            >
              <Mail className="h-4 w-4 text-slate-500" />
              <span>
                Kod je poslat na{" "}
                <span className="font-semibold text-blue-400">{email}</span>
              </span>
            </motion.div>

            {/* OTP inputs */}
            <div className="mb-8 flex items-center justify-center gap-3">
              {otp.map((digit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.06, type: "spring", stiffness: 200, damping: 18 }}
                  className="relative"
                >
                  <motion.input
                    whileFocus={{ scale: 1.08 }}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={digit}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`h-14 w-11 rounded-xl bg-[#0b1c2e] text-center text-2xl font-bold text-white outline-none transition-all duration-200 sm:h-16 sm:w-13 ${
                      digit
                        ? "shadow-[0_0_0_2px_rgba(59,130,246,0.6),0_0_20px_rgba(59,130,246,0.15)]"
                        : "shadow-[0_0_0_1.5px_rgba(30,60,90,0.8)] focus:shadow-[0_0_0_2px_rgba(59,130,246,0.5),0_0_20px_rgba(59,130,246,0.1)]"
                    }`}
                  />
                  {/* Bottom fill indicator */}
                  <motion.div
                    animate={{ scaleX: digit ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute bottom-0 left-1/2 h-0.5 w-6 origin-left -translate-x-1/2 rounded-full bg-blue-500"
                  />
                </motion.div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <motion.button
                whileHover={isFull && !isVerifying ? { scale: 1.02, y: -1 } : {}}
                whileTap={isFull && !isVerifying ? { scale: 0.97 } : {}}
                onClick={handleVerify}
                disabled={!isFull || isVerifying}
                className={`relative w-full overflow-hidden rounded-xl py-3.5 text-base font-bold transition-all duration-300 ${
                  isFull && !isVerifying
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_8px_32px_rgba(59,130,246,0.35)]"
                    : "bg-[#0b1c2e] text-slate-600 cursor-not-allowed"
                }`}
              >
                <AnimatePresence mode="wait">
                  {isVerifying ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                      />
                      Proveravam...
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Potvrdi kod
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Resend */}
              <button
                onClick={handleResend}
                disabled={cooldown > 0}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm transition-all duration-200 ${
                  cooldown > 0
                    ? "cursor-not-allowed text-slate-600"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${cooldown > 0 ? "text-slate-700" : "text-slate-500"}`} />
                {cooldown > 0 ? (
                  <span>
                    Pošalji ponovo za{" "}
                    <span className="font-mono font-bold text-slate-500">{cooldown}s</span>
                  </span>
                ) : (
                  "Niste dobili kod? Pošalji ponovo"
                )}
              </button>
            </div>

            {/* Status message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className={`flex items-start gap-2.5 rounded-xl p-3.5 text-sm ${
                      isSuccess
                        ? "bg-emerald-500/10 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]"
                        : "bg-red-500/10 text-red-300 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <span className="text-left leading-relaxed">{message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating hint below card */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-5 text-center text-xs text-slate-600"
        >
          Proverite spam/junk folder ukoliko niste dobili email.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Verifikacija;
