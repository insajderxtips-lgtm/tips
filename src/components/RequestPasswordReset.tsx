import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const fieldsContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const fieldItem = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export default function ResetPassword({ setView }) {
  const [status, setStatus] = useState(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setStatus(null);

    // Basic Validation
    if (!email || !email.includes("@") || email.length <= 4 || !email.includes(".")) {
      setStatus({
        type: "error",
        message: "Molimo Vas, unesite ispravnu email adresu.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/requestPasswordResetCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Došlo je do greške.");
      }

      setStatus({
        type: "success",
        message: "Link je poslat! Proverite email (i SPAM folder).",
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSuccess = status?.type === "success";

  return (
    <motion.div variants={fieldsContainer} initial="hidden" animate="visible" className="mx-auto w-full max-w-md">
      {/* Back Button */}
      <motion.button
        variants={fieldItem}
        onClick={() => setView("login")}
        className="group mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" /> Nazad
      </motion.button>

      <motion.header variants={fieldItem} className="mb-10">
        <h2 className="mb-2 text-4xl font-black tracking-tight text-white">Reset Lozinke</h2>
        <div className="h-1 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
        <p className="mt-4 text-xs font-medium text-slate-500">
          Unesite email adresu povezanu sa vašim nalogom kako biste dobili kod za resetovanje.
        </p>
      </motion.header>

      <form onSubmit={handleReset} className="space-y-6">
        {/* Email Input */}
        <motion.div variants={fieldItem} className="group relative">
          <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400" />
          <input
            type="email"
            placeholder="Email Adresa"
            value={email}
            className="w-full rounded-2xl border border-white/5 bg-[#0b1c2e] py-4 pl-11 text-sm text-white outline-none transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            onChange={(e) => setEmail(e.target.value)}
          />
        </motion.div>

        {/* Status Messages */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, height: 0, x: 0 }}
              animate={{ opacity: 1, height: "auto", x: isSuccess ? 0 : [0, -8, 8, -5, 5, 0] }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ x: { duration: 0.4 } }}
              className={`flex items-start gap-3 overflow-hidden rounded-2xl border p-4 ${
                isSuccess
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                  : "border-red-500/20 bg-red-500/5 text-red-400"
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              )}
              <span className="text-xs font-bold leading-relaxed">{status.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.button
          variants={fieldItem}
          disabled={isLoading || isSuccess}
          whileHover={{ scale: isLoading || isSuccess ? 1 : 1.02 }}
          whileTap={{ scale: isLoading || isSuccess ? 1 : 0.97 }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-blue-900/30 transition-shadow hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:hover:shadow-lg"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isSuccess ? "Link Poslat" : "Pošalji Zahtev"}
        </motion.button>
      </form>

      {/* Footer Hint */}
      <motion.div variants={fieldItem} className="mt-10 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
          Niste dobili email? Proverite spam ili pokušajte ponovo za 2 minuta.
        </p>
      </motion.div>
    </motion.div>
  );
}
