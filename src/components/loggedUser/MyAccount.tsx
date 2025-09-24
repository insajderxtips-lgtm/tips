import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, setUser } from "../../redux/slices/UserSlice";
import { useNavigate } from "react-router";
import { RootState } from "../../redux/store";

export default function MyAccount(): React.ReactNode {
  const [newUsername, setNewUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const JWT = localStorage.getItem("insajder_token");
  const currentUser = useSelector((state: RootState) => state.user);
  const [currencies] = useState(["RSD", "EUR", "BAM"]);
  const [selectedCurrency, setSelectedCurrency] = useState(
    currentUser.defaultCurrency
  );
  const nav = useNavigate();
  const dispatch = useDispatch();

  // ====================
  // Currency update
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
  const resetStatistics = async () => {
    const confirmed = window.confirm(
      "Da li ste sigurni da želite resetovati statistiku? Ova akcija je trajna i ne može se poništiti!"
    );
    if (!confirmed) return;

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
        alert("Statistika je uspešno resetovana!");
      } else {
        alert("Greška pri resetovanju: " + result.message);
      }
    } catch (error) {
      console.error("Error resetting statistics:", error);
      alert("Došlo je do greške pri resetovanju statistike.");
    }
  };

  // ====================
  // Logoff
  // ====================
  const LogOff = () => {
    dispatch(logout());
    nav("/");
  };

  // ====================
  // Save username
  // ====================
  const saveChanges = useCallback(() => {
    setError(null);
    if (
      !newUsername ||
      newUsername.length < 4 ||
      newUsername === currentUser?.username ||
      newUsername === "admin" ||
      newUsername === "administrator"
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

  useEffect(() => {
    document.title = "InsajderTips | Moj nalog";
  }, []);

  return (
    <div className="w-full  max-w-4xl h-max my-auto mx-auto p-6 lg:p-10 rounded-2xl bg-slate-900/50 backdrop-blur-lg border border-slate-700 shadow-2xl shadow-blue-950/50">
      {/* User info and inputs */}
      <div className="mb-6 bg-slate-800/40 p-5 lg:p-8 rounded-xl border border-slate-700 flex flex-col lg:flex-row items-center gap-8">
        {/* Avatar */}
        <div className="relative group flex-shrink-0">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative w-28 rounded-full bg-slate-900 flex items-center justify-center p-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-16 h-16 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </div>
        </div>

        {/* User info and forms */}
        <div className="flex-1 w-full flex flex-col gap-4">
          {/* Username and tier */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
              {currentUser?.username}
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 text-slate-400 text-sm sm:text-base">
              <span>{currentUser?.email}</span>
              <span
                className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold text-white tracking-wider ${
                  currentUser?.tier === "premium"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-500/20"
                    : currentUser?.tier === "free"
                    ? "bg-gradient-to-r from-gray-600 to-slate-500"
                    : "bg-gradient-to-r from-teal-500 to-emerald-500"
                }`}
              >
                {currentUser?.tier}
              </span>
            </div>
          </div>

          {/* Form elements */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Change username..."
              className="flex-1 bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-3
              focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
              placeholder-slate-500 text-slate-200 transition-all duration-300"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            {newUsername && (
              <button
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500
              text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-cyan-500/30 
              transition-all duration-300 transform hover:scale-105"
                onClick={saveChanges}
              >
                Save
              </button>
            )}
          </div>

          {/* Currency selector for non-free users */}
          {currentUser?.tier !== "free" && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
              <div className="flex-1">
                <label className="text-sm font-medium text-sky-200 mb-2 block">
                  Default currency:
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-3
                    focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
                    text-slate-200 transition-all duration-300 appearance-none"
                >
                  {currencies.map((cur) => (
                    <option key={cur} value={cur} className="bg-slate-800">
                      {cur}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCurrency !== currentUser?.defaultCurrency && (
                <button
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
                  text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-purple-500/30 
                  transition-all duration-300 transform hover:scale-105"
                  onClick={saveCurrency}
                >
                  Save
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={LogOff}
          className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500
          text-white font-semibold py-2.5 rounded-lg shadow-lg hover:shadow-red-500/30 
          transition-all duration-300 transform hover:scale-105"
        >
          Izloguj se
        </button>

        {currentUser?.tier !== "free" && (
          <button
            onClick={resetStatistics}
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500
            text-white font-semibold py-2.5 rounded-lg shadow-lg hover:shadow-amber-500/30 
            transition-all duration-300 transform hover:scale-105"
          >
            Resetuj Statistiku
          </button>
        )}
      </div>

      {/* Error / success message */}
      {error && (
        <div
          className={`mt-4 p-3 rounded-lg border text-sm ${
            error.startsWith("Uspešno")
              ? "bg-green-900/30 border-green-700 text-green-300"
              : "bg-red-900/30 border-red-700 text-red-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 flex-shrink-0"
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
          </div>
        </div>
      )}
    </div>
  );
}
