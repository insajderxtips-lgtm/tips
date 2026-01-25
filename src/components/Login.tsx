import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import yamal from "../assets/yamal_login.jpg";
import { setUser } from "../redux/slices/UserSlice";
import RequestPasswordReset from "../components/RequestPasswordReset";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, Coins } from "lucide-react";

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
      
      if (forbidden.some(word => userClean.includes(word))) {
        setFormData(p => ({ ...p, errorMessage: "Korisničko ime je rezervisano." }));
        return false;
      }
      if (userClean.length < 3) {
        setFormData(p => ({ ...p, errorMessage: "Korisničko ime je prekratko." }));
        return false;
      }
      if (!formData.defaultCurrency) {
        setFormData(p => ({ ...p, errorMessage: "Izaberite valutu klikom na jedno od polja." }));
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormData(p => ({ ...p, errorMessage: "Unesite ispravan email." }));
      return false;
    }
    if (formData.password.length < 6) {
      setFormData(p => ({ ...p, errorMessage: "Lozinka mora imati min. 6 karaktera." }));
      return false;
    }
    return true;
  };

  const handleAuth = async (action: "login" | "register") => {
    if (!validateForm()) return;
    setIsLoading(true);
    setFormData(p => ({ ...p, errorMessage: null }));

    try {
      const endpoint = action === "login" ? "login" : "register";
      const body = action === "login" 
        ? { email: formData.email, password: formData.password, rememberMe } 
        : { email: formData.email, password: formData.password, username: formData.username, defaultCurrency: formData.defaultCurrency };

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
      dispatch(setUser({
        _id: user.user._id,
        email: user.user.email,
        tier: user.user.tier,
        username: user.user.username,
        isAuthenticated: true,
        defaultCurrency: user.user.defaultCurrency,
        isVerified: user.user.isVerified,
        vc: user.user.verificationCode,
      }));

      nav("/");
    } catch (error: any) {
      setFormData(p => ({ ...p, errorMessage: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-[#020617]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-slate-900/20 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10">
        
        <div className="w-full lg:w-5/12 relative min-h-[250px] lg:min-h-[700px]">
          <img src={yamal} className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] brightness-90" alt="Footballer" />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-950 via-slate-950/10 to-transparent" />
          
          <div className="absolute bottom-10 left-10">
            <h1 className="text-6xl font-black text-white italic tracking-tighter">
              INSAJDER<span className="text-cyan-500">.</span>
            </h1>
          </div>
        </div>

        <div className="w-full lg:w-7/12 p-8 sm:p-16 flex flex-col justify-center">
          {currentView === "passreset" ? (
            <RequestPasswordReset setView={setCurrentView} />
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleAuth(currentView === "login" ? "login" : "register"); }} className="max-w-md mx-auto w-full">
              <header className="mb-10">
                <h2 className="text-4xl font-black text-white tracking-tight mb-2">
                  {currentView === "login" ? "Prijava" : "Novi Nalog"}
                </h2>
                <div className="h-1 w-10 bg-cyan-500 rounded-full" />
              </header>

              <div className="space-y-4">
                {currentView === "register" && (
                  <>
                    <div className="space-y-3 mb-6">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Odaberi Valutu</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['RSD', 'EUR', 'BAM'].map((curr) => (
                                <button
                                    key={curr}
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, defaultCurrency: curr.toLowerCase() }))}
                                    className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                                        formData.defaultCurrency === curr.toLowerCase() 
                                        ? "bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                                        : "bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/20"
                                    }`}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400" />
                      <input
                        type="text"
                        placeholder="Korisničko Ime"
                        className="w-full rounded-2xl pl-11 py-4 bg-slate-950/40 border border-white/5 focus:border-cyan-500/50 outline-none text-white text-sm"
                        onChange={(e) => setFormData(p => ({ ...p, username: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400" />
                  <input
                    type="email"
                    placeholder="Email Adresa"
                    className="w-full rounded-2xl pl-11 py-4 bg-slate-950/40 border border-white/5 focus:border-cyan-500/50 outline-none text-white text-sm"
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400" />
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="Lozinka"
                    className="w-full rounded-2xl pl-11 pr-12 py-4 bg-slate-950/40 border border-white/5 focus:border-cyan-500/50 outline-none text-white text-sm"
                    onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  />
                  <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} className="hidden" />
                    <div className={`w-5 h-5 rounded-lg border transition-all flex items-center justify-center ${rememberMe ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'border-white/10 bg-slate-950/40'}`}>
                      {rememberMe && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                    </div>
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-slate-300">Zapamti me</span>
                  </label>
                  <button type="button" onClick={() => setCurrentView("passreset")} className="text-[10px] text-cyan-500 hover:text-cyan-400 font-black uppercase tracking-widest">Zaboravljena lozinka?</button>
                </div>

                {formData.errorMessage && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-400 text-[11px] font-bold tracking-wide">
                    <AlertCircle size={14} />
                    {formData.errorMessage}
                  </div>
                )}
              </div>

              <button
                disabled={isLoading}
                className="w-full mt-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all active:scale-95"
              >
                {isLoading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : (currentView === "login" ? "Prijavi se" : "Kreiraj Profil")}
              </button>

              <div className="text-center mt-8">
                <button type="button" onClick={() => setCurrentView(currentView === "login" ? "register" : "login")} className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
                  {currentView === "login" ? "Nemaš nalog? Registruj se" : "Imaš nalog? Uloguj se"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}