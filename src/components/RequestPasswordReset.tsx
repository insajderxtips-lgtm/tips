import { useState } from "react";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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

  return (
    <div className="max-w-md mx-auto w-full">
      {/* Back Button */}
      <button
        onClick={() => setView("login")}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-8 transition-colors group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Nazad
      </button>

      <header className="mb-10">
        <h2 className="text-4xl font-black text-white tracking-tight mb-2">
          Reset Lozinke
        </h2>
        <div className="h-1 w-10 bg-cyan-500 rounded-full" />
        <p className="text-slate-500 text-xs font-medium mt-4">
          Unesite email adresu povezanu sa vašim nalogom kako biste dobili kod za resetovanje.
        </p>
      </header>

      <form onSubmit={handleReset} className="space-y-6">
        {/* Email Input */}
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="email"
            placeholder="Email Adresa"
            value={email}
            className="w-full rounded-2xl pl-11 py-4 bg-slate-950/40 border border-white/5 focus:border-cyan-500/50 outline-none text-white text-sm transition-all"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Status Messages */}
        {status && (
          <div
            className={`flex items-start gap-3 p-4 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-300 ${
              status.type === "success"
                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/5 border-red-500/20 text-red-400"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            )}
            <span className="text-xs font-bold leading-relaxed">
              {status.message}
            </span>
          </div>
        )}

        {/* Submit Button */}
        <button
          disabled={isLoading || status?.type === "success"}
          className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:hover:shadow-none text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : status?.type === "success" ? (
            "Link Poslat"
          ) : (
            "Pošalji Zahtev"
          )}
        </button>
      </form>

      {/* Footer Hint */}
      <div className="text-center mt-10">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.1em]">
          Niste dobili email? Proverite spam ili pokušajte ponovo za 2 minuta.
        </p>
      </div>
    </div>
  );
}