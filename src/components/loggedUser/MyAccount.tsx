import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, setUser } from "../../redux/slices/UserSlice";
import { useNavigate } from "react-router";
import { RootState } from "../../redux/store";
import { motion, AnimatePresence } from "framer-motion";

export default function MyAccount(): React.ReactNode {
  const [newUsername, setNewUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("RSD");

  const JWT = localStorage.getItem("insajder_token");
  const currentUser = useSelector((state: RootState) => state.user);
  const nav = useNavigate();
  const dispatch = useDispatch();

  const currencies = ["RSD", "EUR", "BAM"];

  useEffect(() => {
    setSelectedCurrency(currentUser?.defaultCurrency || "RSD");
  }, [currentUser]);

  // ====================
  // Save username
  // ====================
  const saveChanges = useCallback(() => {
    setError(null);
    if (
      !newUsername ||
      newUsername.length < 4 ||
      newUsername === currentUser?.username ||
      ["admin", "administrator"].includes(newUsername.toLowerCase())
    ) {
      setError("Ime mora biti duže od 3 karaktera i drugačije od prethodnog.");
      return;
    }

    fetch("/updateName", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + JWT,
      },
      body: JSON.stringify({
        newName: newUsername,
        oldName: currentUser?.username,
      }),
    })
      .then((res) => {
        if (res.ok) {
          dispatch(setUser({ ...currentUser, username: newUsername }));
          setError("Uspešno ste promenili korisničko ime!");
        } else {
          setError("Došlo je do greške prilikom ažuriranja korisničkog imena.");
        }
      })
      .catch(() => {
        setError("Došlo je do greške prilikom komunikacije sa serverom.");
      });
  }, [newUsername, currentUser, dispatch, JWT]);

  // ====================
  // Save currency
  // ====================
  const saveCurrency = async () => {
    try {
      const res = await fetch("/api/user/currency", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
        body: JSON.stringify({ currency: selectedCurrency }),
      });

      const data = await res.json();
      if (res.ok) {
        dispatch(
          setUser({ ...currentUser, defaultCurrency: selectedCurrency })
        );
        setError(
          `Uspešno ažurirana valuta na ${selectedCurrency.toUpperCase()}`
        );
      } else {
        setError(data?.message || "Neuspešno ažuriranje valute");
      }
    } catch (err) {
      console.error(err);
      setError("Neuspešno ažuriranje valute");
    }
  };

  // ====================
  // Reset statistics
  // ====================
  const handleConfirmReset = async () => {
    setLoadingReset(true);
    try {
      const response = await fetch("/resetStatistics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
      });
      const result = await response.json();
      if (response.ok) {
        setError("Statistika je uspešno resetovana!");
      } else {
        setError("Greška pri resetovanju: " + result.message);
      }
    } catch (err) {
      console.error(err);
      setError("Došlo je do greške pri resetovanju statistike.");
    } finally {
      setLoadingReset(false);
      setShowConfirmModal(false);
    }
  };

  // ====================
  // Logoff
  // ====================
  const LogOff = () => {
    dispatch(logout());
    nav("/");
  };

  // Auto-hide toast after 4s
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  // Title
  useEffect(() => {
    document.title = "InsajderTips | Moj nalog";
  }, []);

  return (
    <div className="w-full max-w-5xl min-h-[80vh] my-auto mx-auto p-4 lg:p-6 flex items-center justify-center">
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 bg-gray-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-3xl shadow-2xl shadow-cyan-500/10 p-6 sm:p-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-1 flex flex-col items-center text-center p-6 bg-gray-800/40 rounded-2xl border border-gray-700/50 relative overflow-hidden"
        >
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="relative w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center p-1 shadow-2xl z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-20 h-20 text-cyan-400 transition-colors duration-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white z-10">
            {currentUser?.username}
          </h2>
          <p className="mt-1 text-slate-400 z-10">{currentUser?.email}</p>
          <span
            className={`mt-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider flex items-center gap-2 z-10 ${
              currentUser?.tier === "premium"
                ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                : "bg-gray-600/20 text-gray-300 border border-gray-600/30"
            }`}
          >
            {currentUser?.tier?.toUpperCase()}
          </span>
        </motion.div>

        {/* Settings & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-2 flex flex-col gap-8"
        >
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Podešavanja Naloga
            </h3>
            <div className="space-y-6 p-6 bg-gray-800/40 rounded-2xl border border-gray-700/50">
              {/* Change Username */}
              <div>
                <label className="text-sm font-medium text-cyan-200 mb-2 block">
                  Promeni korisničko ime
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Novo korisničko ime..."
                    className="flex-1 bg-gray-900/70 border-2 border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-slate-500 text-slate-200 transition-all"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                  <button
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    onClick={saveChanges}
                    disabled={!newUsername}
                  >
                    Sačuvaj
                  </button>
                </div>
              </div>

              {/* Currency Selector */}
              {currentUser?.tier !== "free" && (
                <div>
                  <label className="text-sm font-medium text-cyan-200 mb-2 block">
                    Podesi valutu
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="flex-1 bg-gray-900/70 border-2 border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-200 transition-all appearance-none"
                    >
                      {currencies.map((cur) => (
                        <option key={cur} value={cur} className="bg-slate-800">
                          {cur}
                        </option>
                      ))}
                    </select>
                    <button
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                      onClick={saveCurrency}
                      disabled={
                        selectedCurrency === currentUser?.defaultCurrency
                      }
                    >
                      Sačuvaj
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-800/40 rounded-2xl border border-gray-700/50 p-6 flex flex-col sm:flex-row gap-4">
            {currentUser?.tier !== "free" && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex-1 bg-amber-600/80 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg transition-all hover:scale-105 shadow-md"
              >
                Resetuj Statistiku
              </button>
            )}
            <button
              onClick={LogOff}
              className="flex-1 bg-red-600/80 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg transition-all hover:scale-105 shadow-md"
            >
              Izloguj se
            </button>
          </div>
        </motion.div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gray-900 border border-amber-600/40 rounded-2xl p-8 max-w-sm text-center shadow-xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-xl font-semibold text-white mb-3">
                  Resetovati statistiku?
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  Ova akcija je <span className="text-red-400">trajna</span> i
                  ne može se poništiti!
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    className="px-5 py-2.5 bg-gray-700/70 hover:bg-gray-700 rounded-lg text-slate-200 font-medium transition-all"
                    onClick={() => setShowConfirmModal(false)}
                    disabled={loadingReset}
                  >
                    Odustani
                  </button>
                  <button
                    onClick={handleConfirmReset}
                    disabled={loadingReset}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-all"
                  >
                    {loadingReset ? "Resetujem..." : "Da, resetuj"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              className={`fixed bottom-6 left-1/2 -translate-x-1/2 p-4 rounded-lg border text-sm flex items-center gap-3 z-50
                ${
                  error.startsWith("Uspešno")
                    ? "bg-green-900/80 backdrop-blur-md border-green-700 text-green-300"
                    : "bg-red-900/80 backdrop-blur-md border-red-700 text-red-300"
                }`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {error.startsWith("Uspešno") ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
                  />
                )}
              </svg>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
