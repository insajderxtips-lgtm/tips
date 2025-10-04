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

      const res = await fetch(`/${endpoint}`, {
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

      const userRes = await fetch("/user", {
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
    <div className="w-full min-h-screen flex flex-col justify-center items-center p-4 bg-transparent relative isolate">
      {/* Background Glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl"
      >
        <div
          className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#007cf0] to-[#00dfd8] opacity-10 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        ></div>
      </div>

      <div className="w-full  max-w-5xl mx-auto flex flex-col lg:flex-row bg-gray-900/50 backdrop-blur-2xl border border-cyan-500/20 rounded-3xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Image Section - Corrected with overflow-hidden and specific rounding */}
        <div className="w-full lg:w-1/2 relative rounded-t-3xl lg:rounded-tr-none lg:rounded-l-3xl overflow-hidden">
          <img
            src={yamal}
            className="w-full h-64 lg:h-full object-cover object-center"
            alt="Football player in action"
          />
          {/* Gradient is now diagonal to better support top-left text */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/40 to-transparent"></div>
        </div>

        {/* Form Section */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 flex flex-col justify-center text-white">
          {currentView === "passreset" ? (
            <RequestPasswordReset view={currentView} setView={setCurrentView} />
          ) : (
            <>
              <h2 className="text-3xl sm:text-4xl font-bold mb-1 text-white">
                {currentView === "login" ? "Dobrodošao Nazad" : "Kreiraj Nalog"}
              </h2>
              <p className="text-cyan-200/70 mb-8">
                {currentView === "login"
                  ? "Uloguj se da nastaviš."
                  : "Popuni polja ispod za početak."}
              </p>

              <div className="space-y-4">
                {currentView === "register" && (
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01"
                        />
                      </svg>
                    </div>
                    <select
                      value={formData.defaultCurrency}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          defaultCurrency: e.target.value,
                        }))
                      }
                      className="w-full appearance-none rounded-xl pl-12 pr-10 py-3.5 bg-black/30 border border-cyan-600/30 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 focus:outline-none transition-all duration-300 text-white placeholder-gray-500 hover:bg-black/40"
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
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-cyan-400">
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
                )}

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
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
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    placeholder="Email Adresa"
                    className="w-full rounded-xl pl-12 p-3.5 bg-black/30 border border-cyan-600/30 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 focus:outline-none transition-all duration-300 text-white placeholder-gray-500 hover:bg-black/40"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                {currentView === "register" && (
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={formData.username}
                      placeholder="Korisničko Ime"
                      className="w-full rounded-xl pl-12 p-3.5 bg-black/30 border border-cyan-600/30 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 focus:outline-none transition-all duration-300 text-white placeholder-gray-500 hover:bg-black/40"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    value={formData.password}
                    placeholder="Lozinka"
                    className="w-full rounded-xl pl-12 p-3.5 bg-black/30 border border-cyan-600/30 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 focus:outline-none transition-all duration-300 text-white placeholder-gray-500 hover:bg-black/40 pr-12"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                  <button
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-cyan-300 transition-colors p-1"
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

                <div className="text-right">
                  <span
                    className="text-cyan-400 hover:text-cyan-200 cursor-pointer text-sm font-semibold transition-colors"
                    onClick={() => setCurrentView("passreset")}
                  >
                    Zaboravljena lozinka?
                  </span>
                </div>

                {formData.errorMessage && (
                  <div className="flex items-center gap-x-3 p-3 bg-red-900/30 rounded-xl border border-red-700/50 text-sm text-red-300">
                    <svg
                      className="w-5 h-5 text-red-400 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{formData.errorMessage}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 mt-8">
                <button
                  onClick={() =>
                    handleAuth(currentView === "login" ? "login" : "register")
                  }
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 text-base transform active:scale-[0.98] ${
                    isLoading
                      ? "bg-gray-700 cursor-not-allowed shadow-inner"
                      : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-400/40"
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
                      <span>Procesiranje...</span>
                    </>
                  ) : currentView === "login" ? (
                    "Uloguj se"
                  ) : (
                    "Napravi Nalog"
                  )}
                </button>
              </div>

              <p
                onClick={() =>
                  setCurrentView((prev) =>
                    prev === "login" ? "register" : "login"
                  )
                }
                className="text-center text-cyan-300 hover:text-white cursor-pointer transition-colors text-sm mt-8"
              >
                {currentView === "login" ? "Nemaš nalog? " : "Već imaš nalog? "}
                <span className="font-bold underline underline-offset-4">
                  {currentView === "login" ? "Registruj se" : "Uloguj se"}
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
