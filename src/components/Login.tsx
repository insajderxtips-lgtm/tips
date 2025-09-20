import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import yamal from "../assets/yamal_login.jpg";
import { setUser } from "../redux/slices/UserSlice";
import RequestPasswordReset from "../components/RequestPasswordReset";

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
  const [resetStatus, setResetStatus] = useState(null);

  const nav = useNavigate();
  const dispatch = useDispatch();

  const validateForm = (): boolean => {
    if (currentView === "register") {
      if (
        !formData.defaultCurrency ||
        formData.defaultCurrency === "Izaberite vasu valutu"
      ) {
        setFormData((prev) => ({
          ...prev,
          errorMessage: "Molimo izaberite valutu",
        }));
        return false;
      }
      if (formData.password.length < 6) {
        setFormData((prev) => ({
          ...prev,
          errorMessage: "Lozinka mora imati najmanje 6 karaktera",
        }));
        return false;
      }
      if (!formData.username.trim()) {
        setFormData((prev) => ({
          ...prev,
          errorMessage: "Korisničko ime je obavezno",
        }));
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormData((prev) => ({
        ...prev,
        errorMessage: "Unesite validnu email adresu",
      }));
      return false;
    }

    if (formData.password.length < 6) {
      setFormData((prev) => ({
        ...prev,
        errorMessage: "Lozinka mora imati najmanje 6 karaktera",
      }));
      return false;
    }

    return true;
  };

  const handleAuth = async (action: "login" | "register") => {
    if (!validateForm()) return;

    setIsLoading(true);
    setFormData((prev) => ({ ...prev, errorMessage: null }));

    try {
      const endpoint = action === "login" ? "login" : "register";
      const body =
        action === "login"
          ? { email: formData.email, password: formData.password }
          : {
              email: formData.email,
              password: formData.password,
              username: formData.username,
              defaultCurrency: formData.defaultCurrency,
            };

      const res = await fetch(`http://localhost:1337/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Došlo je do greške");
      }

      if (action === "register") {
        setCurrentView("login");
        return;
      }

      const data = await res.json();
      localStorage.setItem("insajder_token", data.token);

      const userRes = await fetch("http://localhost:1337/user", {
        headers: { Authorization: `Bearer ${data.token}` },
      });

      if (!userRes.ok)
        throw new Error("Neuspelo dobavljanje korisničkih podataka");

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
    } catch (error) {
      setFormData((prev) => ({
        ...prev,
        errorMessage:
          error instanceof Error ? error.message : "Došlo je do greške",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-center items-center p-4 sm:p-6 lg:my-16">
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row bg-slate-900/40 backdrop-blur-2xl border-2 border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">
        <div className="relative w-full lg:w-5/12 flex items-center justify-center p-6 lg:p-8 min-h-[300px] lg:min-h-full bg-gradient-to-br from-blue-900/20 to-cyan-900/10 rounded-t-3xl lg:rounded-l-3xl lg:rounded-t-none overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InRyYW5zcGFyZW50Ii8+PGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iMTAwJSIgeTI9IjEwMCUiIHN0cm9rZT0iIzAwZmZmZjE1IiBzdHJva2Utd2lkdGg9IjAuNiIvPjxsaW5lIHgxPSIxMDAlIiB5MT0iMCIgeDI9IjAiIHkyPSIxMDAlIiBzdHJva2U9IiMwMGZmZmYxNSIgc3Ryb2tlLXdpZHRoPSIwLjYiLz48L25zdmc+')] opacity-20"></div>

          <img
            src={yamal}
            className="w-full h-full object-cover rounded-2xl border-2 border-cyan-700/20 shadow-2xl shadow-cyan-950/50
                   transition-all duration-700 ease-out hover:scale-[1.03] transform-gpu z-10"
            alt="Football player in action"
          />
        </div>

        <div className="w-full lg:w-7/12 p-6 sm:p-8 flex flex-col justify-center text-white relative z-10">
          {currentView === "passreset" ? (
            <RequestPasswordReset view={currentView} setView={setCurrentView} />
          ) : (
            <>
              <h2
                className="text-3xl sm:text-4xl font-bold text-center mb-6 
                         bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400"
              >
                {currentView === "login" ? "Ulogujte se" : "Registrujte se"}
              </h2>

              <div className="space-y-5">
                {currentView === "register" && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-cyan-200/90 text-sm font-medium tracking-wide">
                      Valuta
                    </label>
                    <div className="relative">
                      <select
                        value={formData.defaultCurrency}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            defaultCurrency: e.target.value,
                          }))
                        }
                        className="w-full appearance-none rounded-xl px-4 py-3 pr-10 bg-black/40 border border-cyan-600/40 focus:border-cyan-400
                               focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all duration-300 text-white
                               hover:bg-black/50 cursor-pointer shadow-lg shadow-black/30"
                      >
                        <option
                          value=""
                          disabled
                          className="text-gray-400 bg-slate-800"
                        >
                          Izaberi svoju valutu
                        </option>
                        <option value="rsd" className="bg-slate-800 text-white">
                          RSD
                        </option>
                        <option value="eur" className="bg-slate-800 text-white">
                          EUR
                        </option>
                        <option value="bam" className="bg-slate-800 text-white">
                          BAM
                        </option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-cyan-400">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-2">
                  <label className="text-cyan-200/90 text-sm font-medium tracking-wide">
                    Email Adresa
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    placeholder="tvoj.email@gmail.com"
                    className="rounded-xl p-3 bg-black/40 border border-cyan-600/40 focus:ring-2 focus:ring-cyan-500/50
                           focus:border-cyan-400 transition-all duration-300 text-white placeholder-gray-500
                           hover:bg-black/50 shadow-lg shadow-black/30"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                {currentView === "register" && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-cyan-200/90 text-sm font-medium tracking-wide">
                      Korisnicko ime
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      placeholder="tvoje_ime"
                      className="rounded-xl p-3 bg-black/40 border border-cyan-600/40 focus:ring-2 focus:ring-cyan-500/50
                             focus:border-cyan-400 transition-all duration-300 text-white placeholder-gray-500
                             hover:bg-black/50 shadow-lg shadow-black/30"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}

                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-cyan-200/90 text-sm font-medium tracking-wide">
                      Lozinka
                    </label>
                    <span
                      className="text-cyan-400 hover:text-cyan-200 cursor-pointer text-xs font-semibold transition-colors"
                      onClick={() => setCurrentView("passreset")}
                    >
                      Zaboravljena lozinka?
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      value={formData.password}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl p-3 bg-black/40 border border-cyan-600/40 focus:ring-2 focus:ring-cyan-500/50
                             focus:border-cyan-400 transition-all duration-300 text-white placeholder-gray-500
                             hover:bg-black/50 pr-12 shadow-lg shadow-black/30"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                    />
                    <button
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-cyan-300 transition-colors"
                    >
                      {isPasswordVisible ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {formData.errorMessage && (
                  <div className="flex items-center gap-x-2 p-3 bg-red-900/40 rounded-xl border-2 border-red-700/50 text-sm text-red-300">
                    <svg
                      className="w-5 h-5 text-red-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{formData.errorMessage}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 mt-6">
                <button
                  onClick={() =>
                    handleAuth(currentView === "login" ? "login" : "register")
                  }
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 text-base
                          transform active:scale-[0.98]
                          ${
                            isLoading
                              ? "bg-gray-700 cursor-not-allowed shadow-inner"
                              : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-400/40 shadow-lg shadow-blue-900/50"
                          }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>
                        {currentView === "login"
                          ? "Logging in..."
                          : "Registering..."}
                      </span>
                    </>
                  ) : currentView === "login" ? (
                    "Uloguj se"
                  ) : (
                    "Napravi nalog"
                  )}
                </button>
              </div>

              <p
                onClick={() =>
                  setCurrentView((prev) =>
                    prev === "login" ? "register" : "login"
                  )
                }
                className="text-center text-cyan-300 hover:text-white cursor-pointer transition-colors text-sm mt-6"
              >
                {currentView === "login" ? "Nemas nalog? " : "Vec imas nalog? "}
                <span className="font-bold underline underline-offset-4">
                  {currentView === "login" ? "Registruj se" : "Uloguj se"}
                </span>
              </p>

              <div
                className="testFont flex justify-center items-center text-4xl sm:text-5xl 
                       bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400
                       mt-auto pt-6 text-center"
              >
                INSAJDER.TIPS
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
