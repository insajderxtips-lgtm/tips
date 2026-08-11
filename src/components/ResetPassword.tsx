import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token nije validan ili je istekao.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) return setError("Nedostaje sigurnosni token.");
    if (password.length < 6) return setError("Lozinka mora imati bar 6 karaktera.");
    if (password !== confirmPassword) return setError("Lozinke se ne poklapaju.");

    setLoading(true);
    try {
      const res = await fetch("/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Lozinka je uspešno promenjena!");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setError(data.message || "Došlo je do greške.");
      }
    } catch (err) {
      setError("Server nije dostupan. Pokušajte kasnije.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020b18] px-4">
      {/* Animated ambient glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-[10%] -top-[10%] h-[460px] w-[460px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-[10%] -left-[10%] h-[460px] w-[460px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black italic tracking-tighter text-white">
            INSAJDER<span className="text-emerald-400">.</span>
          </h1>
        </div>

        <div className="rounded-3xl border border-[#1a3050] bg-[#07131f]/70 p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <motion.div
            initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 16 }}
            className="mb-6 flex justify-center"
          >
            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 p-3">
              <Lock className="h-8 w-8 text-blue-400" />
            </div>
          </motion.div>

          <h2 className="mb-2 text-center text-xl font-bold text-white">Postavite novu lozinku</h2>
          <p className="mb-8 text-center text-sm text-slate-400">Vaša nova lozinka mora biti drugačija od prethodne.</p>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, height: 0, x: 0 }}
                animate={{ opacity: 1, height: "auto", x: [0, -8, 8, -5, 5, 0] }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ x: { duration: 0.4 } }}
                className="mb-6 flex items-center gap-3 overflow-hidden rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                key="ok"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 flex items-center gap-3 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
              >
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-slate-300">Nova Lozinka</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-[#1a3050] bg-[#0b1c2e] py-3.5 pl-4 pr-12 text-white transition-all placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!!success}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-slate-300">Potvrdite Lozinku</label>
              <input
                type="password"
                className="w-full rounded-xl border border-[#1a3050] bg-[#0b1c2e] px-4 py-3.5 text-white transition-all placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!!success}
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading || !!success}
              whileHover={{ scale: loading || success ? 1 : 1.02 }}
              whileTap={{ scale: loading || success ? 1 : 0.98 }}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-900/30 transition-shadow hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Slanje..." : "Ažuriraj Lozinku"}
            </motion.button>
          </form>

          <button
            onClick={() => navigate("/login")}
            className="group mt-6 flex w-full items-center justify-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Nazad na prijavu
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
