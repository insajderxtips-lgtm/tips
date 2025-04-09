import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import yamal from "../assets/yamal_login.jpg";
import { setUser } from "../redux/slices/UserSlice";

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

      const res = await fetch(`https://9e60-109-93-175-89.ngrok-free.app/${endpoint}`, {
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

      const userRes = await fetch("https://9e60-109-93-175-89.ngrok-free.app/user", {
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
    <div className="max-w-[90%] mx-auto h-full p-2 flex justify-center items-center">
      <div className="w-full p-4 flex flex-col md:flex-row md:gap-x-6 bg-gradient-to-br from-blue-900/10 to-cyan-900/20 rounded-2xl shadow-2xl shadow-blue-950/50 backdrop-blur-sm">
        {/* Image Container */}
        <div className="h-max w-full mb-4 bg-gradient-to-br from-cyan-900/10 to-blue-900/10 p-4 rounded-xl border border-cyan-800/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InRyYW5zcGFyZW50Ii8+PGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iMTAwJSIgeTI9IjEwMCUiIHN0cm9rZT0iIzAwZmZmZjIwIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIxMDAlIiB5MT0iMCIgeDI9IjAiIHkyPSIxMDAlIiBzdHJva2U9IiMwMGZmZmYyMCIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] opacity-10" />
          <img
            src={yamal}
            className="w-full max-h-[300px] md:max-h-[450px] object-cover rounded-md border border-cyan-800/30 shadow-lg shadow-cyan-950/30
            transition-all duration-700 ease-out hover:scale-[1.03] transform-gpu"
            alt="Login background"
          />
        </div>

        {/* Form Container */}
        <div className="w-full relative flex flex-col space-y-4">
          {/* Currency Select (Register only) */}
          {currentView === "register" && (
            <div className="flex flex-col space-y-1 animate-fade-in">
              <label className="text-cyan-300 text-sm">Valuta</label>
              <select
                value={formData.defaultCurrency}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultCurrency: e.target.value,
                  }))
                }
                className="rounded-lg p-3 bg-black/30 border border-cyan-800/40 focus:ring-2 focus:ring-cyan-500 
                focus:border-transparent transition-all duration-300 text-white hover:bg-black/40 cursor-pointer"
              >
                <option value="">Izaberite vašu valutu</option>
                <option value="rsd">RSD</option>
                <option value="eur">EUR</option>
                <option value="bam">BAM</option>
              </select>
            </div>
          )}

          {/* Email Input */}
          <div className="flex flex-col space-y-1 animate-fade-in">
            <label className="text-cyan-300 text-sm">Email adresa</label>
            <input
              type="email"
              value={formData.email}
              placeholder="Vaša e-mail adresa"
              className="rounded-lg p-3 bg-black/30 border border-cyan-800/40 focus:ring-2 focus:ring-cyan-500 
              focus:border-transparent transition-all duration-300 text-white placeholder-gray-400 
              hover:bg-black/40 hover:shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)]"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>

          {/* Username Input (Register only) */}
          {currentView === "register" && (
            <div className="flex flex-col space-y-1 animate-fade-in">
              <label className="text-cyan-300 text-sm">Korisničko ime</label>
              <input
                type="text"
                value={formData.username}
                placeholder="Vaše korisničko ime"
                className="rounded-lg p-3 bg-black/30 border border-cyan-800/40 focus:ring-2 focus:ring-cyan-500 
                focus:border-transparent transition-all duration-300 text-white placeholder-gray-400 
                hover:bg-black/40 hover:shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)]"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </div>
          )}

          {/* Password Input */}
          <div className="flex flex-col space-y-1 animate-fade-in">
            <label className="text-cyan-300 text-sm">Vaša lozinka</label>
            <div className="relative">
              <input
                type={isPasswordVisible ? "text" : "password"}
                value={formData.password}
                placeholder="Lozinka"
                className="w-full rounded-lg p-3 bg-black/30 border border-cyan-800/40 focus:ring-2 focus:ring-cyan-500 
                focus:border-transparent transition-all duration-300 text-white placeholder-gray-400 
                hover:bg-black/40 pr-12"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
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

          {/* Remember Me */}
          <div className="flex items-center gap-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              className="rounded-md bg-black/30 border border-cyan-800/40 checked:bg-cyan-500 
              focus:ring-cyan-500 h-5 w-5 transition-colors"
            />
            <label
              htmlFor="rememberMe"
              className="text-cyan-300 text-sm cursor-pointer"
            >
              Zapamti me
            </label>
          </div>

          {/* Error Message */}
          {formData.errorMessage && (
            <div className="flex items-center gap-x-2 p-3 bg-red-900/30 rounded-lg border border-red-800/40 animate-shake">
              <svg
                className="w-5 h-5 text-red-400"
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
              <span className="text-red-300 text-sm">
                {formData.errorMessage}
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={() =>
              handleAuth(currentView === "login" ? "login" : "register")
            }
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2
            ${
              isLoading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/20"
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
                {currentView === "login"
                  ? "Prijavljivanje..."
                  : "Registracija..."}
              </>
            ) : currentView === "login" ? (
              "Ulogujte se"
            ) : (
              "Registrujte se"
            )}
          </button>

          {/* Toggle View */}
          <p
            onClick={() =>
              setCurrentView((prev) =>
                prev === "login" ? "register" : "login"
              )
            }
            className="text-center text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors text-sm underline underline-offset-4"
          >
            {currentView === "login"
              ? "Nemate nalog? Registrujte se."
              : "Imate nalog? Ulogujte se."}
          </p>

          {/* Branding */}
          <div
            className="testFont flex justify-center items-center text-3xl md:text-4xl xl:text-5xl 
            bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 mt-4"
          >
            INSAJDER.TIPS
          </div>
        </div>
      </div>
    </div>
  );
}
