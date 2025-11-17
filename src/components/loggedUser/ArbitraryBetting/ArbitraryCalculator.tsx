"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

// Component for the Onboarding Modal/Tooltip
function ArbExplanationModal({ onClose }): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-gray-950/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
        className="relative w-full max-w-lg bg-gray-800 border-2 border-blue-500/50 rounded-2xl shadow-2xl shadow-blue-500/20 p-8 transform"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <Info size={36} className="text-blue-400 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-white tracking-wide">
            Šta je Sigurno Klađenje (Arbitraža)?
          </h3>
        </div>

        <div className="space-y-4 text-gray-300">
          <p>
            Sigurno klađenje ("Arbitrage Betting") nastaje kada različite
            kladionice imaju dovoljno velike razlike u kvotama za sve moguće
            ishode jednog meča, tako da je matematički moguće uložiti novac na
            <span className="font-semibold text-white"> svaki ishod</span> i
            ostvariti{" "}
            <span className="font-bold text-green-400">siguran profit</span>,
            bez obzira na konačan rezultat.
          </p>
          <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
            <h4 className="font-semibold text-blue-300 mb-1">
              Kako koristim kalkulator?
            </h4>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>
                Unesite <span className="text-cyan-400">Kvotu 1</span> (npr. iz
                Kladionice A) i <span className="text-cyan-400">Kvotu 2</span>{" "}
                (iz Kladionice B).
              </li>
              <li>
                Unesite vaš željeni{" "}
                <span className="text-cyan-400">Ukupan Ulog</span>.
              </li>
              <li>
                Kalkulator će vam reći da li je arbitraža moguća i prikazati
                <span className="text-white font-medium">
                  {" "}
                  tačne iznose uloga
                </span>
                koje morate uplatiti na svaku kvotu da biste garantovali profit.
              </li>
            </ol>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="mt-8 w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
        >
          Razumem
        </motion.button>
      </motion.div>
    </div>
  );
}

export default function ArbitrageCalculator(): JSX.Element {
  const [arbData, setArbData] = useState({
    odds1: "",
    odds2: "",
    stake: "",
    statusMessage: null as string | null,
    statusCode: null as number | null,
    result: null as { stake1: number; stake2: number; profit: number } | null,
  });

  // --- NEW STATE FOR TOOLTIP ---
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    // --- NEW LOGIC FOR TOOLTIP ---
    const hasSeenArbExplanation = localStorage.getItem("hasSeenArbExplanation");
    if (!hasSeenArbExplanation) {
      setShowExplanation(true);
    }
  }, []);

  // --- NEW HANDLER TO DISMISS TOOLTIP AND SET LOCAL STORAGE ---
  const handleExplanationClose = () => {
    setShowExplanation(false);
    localStorage.setItem("hasSeenArbExplanation", "true");
  };

  const calculate = (): void => {
    setArbData((prev) => ({
      ...prev,
      statusMessage: null,
      result: null,
      statusCode: null,
    }));

    const { odds1, odds2, stake } = arbData;

    if (
      !odds1 ||
      !odds2 ||
      !stake ||
      isNaN(Number(odds1)) ||
      isNaN(Number(odds2)) ||
      isNaN(Number(stake)) ||
      parseFloat(odds1) <= 1 ||
      parseFloat(odds2) <= 1 ||
      parseFloat(stake) <= 0
    ) {
      setArbData((prev) => ({
        ...prev,
        statusMessage:
          "Molimo unesite ispravne pozitivne kvote (>1.0) i ulog (>0).",
        statusCode: 0,
      }));
      return;
    }

    const odds1Num = parseFloat(odds1);
    const odds2Num = parseFloat(odds2);
    const stakeNum = parseFloat(stake);

    // Arb formula: 1/odds1 + 1/odds2 < 1 (for two-way market)
    const totalProbability = 1 / odds1Num + 1 / odds2Num;
    const margin = (1 - totalProbability) * 100;

    if (totalProbability >= 1) {
      setArbData((prev) => ({
        ...prev,
        statusMessage: `Sa ovim kvotama nije moguće sigurno klađenje. Margina je: ${margin.toFixed(
          2
        )}%`,
        statusCode: 0,
      }));
      return;
    }

    // Calculating optimal stakes
    const stake1 = (1 / odds1Num / totalProbability) * stakeNum;
    const stake2 = (1 / odds2Num / totalProbability) * stakeNum;

    // Calculating profit (Both returns should be the same, but we check max for safety)
    const return1 = stake1 * odds1Num;
    // const return2 = stake2 * odds2Num; // Not strictly needed, should equal return1
    const profit = return1 - stakeNum;

    setArbData((prev) => ({
      ...prev,
      statusMessage: `Na ovom meču je moguće sigurno klađenje! Profit: ${margin.toFixed(
        2
      )}%`,
      statusCode: 1,
      result: { stake1, stake2, profit },
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") calculate();
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <AnimatePresence>
        {/* --- RENDER TOOLTIP CONDITIONALLY --- */}
        {showExplanation && (
          <ArbExplanationModal onClose={handleExplanationClose} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-3xl bg-gray-900/60 backdrop-blur-md border border-gray-700/60 rounded-2xl shadow-2xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white tracking-tight"
          >
            Kalkulator sigurnog klađenja
          </motion.h1>
          <p className="text-gray-400 text-sm mt-2">
            Unesite kvote iz različitih kladionica i izračunajte optimalan ulog
          </p>
        </div>

        {/* Inputs */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { id: "odds1", label: "Kvota 1", value: arbData.odds1 },
            { id: "odds2", label: "Kvota 2", value: arbData.odds2 },
            { id: "stake", label: "Ukupan ulog", value: arbData.stake },
          ].map((input, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
            >
              <label
                htmlFor={`arb_${input.id}`}
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                {input.label}
              </label>
              <input
                type="number"
                id={`arb_${input.id}`}
                className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800/60 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={input.value}
                onChange={(e) =>
                  setArbData((prev) => ({
                    ...prev,
                    [input.id]: e.target.value,
                  }))
                }
                onKeyPress={handleKeyPress}
                step="0.01"
                min="1.01"
              />
            </motion.div>
          ))}
        </div>

        {/* Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={calculate}
          className="mt-6 flex items-center justify-center gap-2 px-6 py-3 w-full md:w-auto mx-auto rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-cyan-700/30 transition-all duration-300"
        >
          <Calculator size={20} />
          Izračunaj
        </motion.button>

        {/* Results */}
        <AnimatePresence>
          {arbData.statusMessage && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className={`mt-8 p-5 rounded-xl border ${
                arbData.statusCode === 1
                  ? "bg-green-900/20 border-green-800/40"
                  : "bg-red-900/20 border-red-800/40"
              }`}
            >
              <div
                className={`flex items-center gap-2 font-semibold ${
                  arbData.statusCode === 1 ? "text-green-400" : "text-red-400"
                }`}
              >
                {arbData.statusCode === 1 ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertTriangle size={18} />
                )}
                {arbData.statusMessage}
              </div>

              {arbData.result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-5 grid md:grid-cols-3 gap-4 text-gray-200"
                >
                  <div className="bg-green-800/10 border border-green-700/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">
                      Ulog na kvotu 1
                    </p>
                    <p className="text-xl font-bold text-white">
                      {arbData.result.stake1.toFixed(0)} RSD
                    </p>
                  </div>
                  <div className="bg-green-800/10 border border-green-700/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">
                      Ulog na kvotu 2
                    </p>
                    <p className="text-xl font-bold text-white">
                      {arbData.result.stake2.toFixed(0)} RSD
                    </p>
                  </div>
                  <div className="bg-green-800/10 border border-green-700/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">
                      Očekivani profit
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      +{arbData.result.profit.toFixed(2)} RSD
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-gray-500 text-center mt-6">
          Kalkulator vam pomaže da ravnomerno rasporedite ulog i osigurate
          profit bez obzira na ishod.
        </p>
      </motion.div>
    </div>
  );
}
