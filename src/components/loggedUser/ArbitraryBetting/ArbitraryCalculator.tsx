"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ArbitrageCalculator(): JSX.Element {
  const [arbData, setArbData] = useState({
    odds1: "",
    odds2: "",
    stake: "",
    statusMessage: null as string | null,
    statusCode: null as number | null,
    result: null as { stake1: number; stake2: number; profit: number } | null,
  });

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
      isNaN(Number(stake))
    ) {
      setArbData((prev) => ({
        ...prev,
        statusMessage: "Molimo unesite obe kvote i ulog.",
        statusCode: 0,
      }));
      return;
    }

    const odds1Num = parseFloat(odds1);
    const odds2Num = parseFloat(odds2);
    const stakeNum = parseFloat(stake);

    const totalProbability = 1 / odds1Num + 1 / odds2Num;

    if (totalProbability >= 1) {
      setArbData((prev) => ({
        ...prev,
        statusMessage: "Sa ovim kvotama nije moguće sigurno klađenje.",
        statusCode: 0,
      }));
      return;
    }

    const stake1 = (1 / odds1Num / totalProbability) * stakeNum;
    const stake2 = (1 / odds2Num / totalProbability) * stakeNum;
    const return1 = stake1 * odds1Num;
    const return2 = stake2 * odds2Num;
    const profit = Math.max(return1, return2) - stakeNum;

    setArbData((prev) => ({
      ...prev,
      statusMessage: "Na ovom meču je moguće sigurno klađenje!",
      statusCode: 1,
      result: { stake1, stake2, profit },
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") calculate();
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
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
                min="1"
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
