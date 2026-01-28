import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
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
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-blue-900/20 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Insajder<span className="text-blue-500">.</span>Tips
          </h1>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl transition-all duration-300">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <Lock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white text-center mb-2">
            Postavite novu lozinku
          </h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            Vaša nova lozinka mora biti drugačija od prethodne.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2 ml-1">
                Nova Lozinka
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!!success}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2 ml-1">
                Potvrdite Lozinku
              </label>
              <input
                type="password"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!!success}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
            >
              {loading ? "Slanje..." : "Ažuriraj Lozinku"}
            </button>
          </form>

          <button
            onClick={() => navigate("/login")}
            className="w-full mt-6 flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Nazad na prijavu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;