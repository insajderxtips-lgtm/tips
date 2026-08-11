import { useState, useEffect, useMemo, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

function ArbExplanationModal({ onClose }: { onClose: () => void }): React.ReactNode {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-950/90 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="relative w-full max-w-lg rounded-2xl border border-blue-500/40 bg-[#07131f] p-8 shadow-[0_0_60px_-12px_rgba(59,130,246,0.5)]"
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 transition hover:text-white">
          <X size={24} />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10">
            <Info size={24} className="text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold tracking-wide text-white">Šta je Sigurno Klađenje (Arbitraža)?</h3>
        </div>

        <div className="space-y-4 text-slate-300">
          <p>
            Sigurno klađenje ("Arbitrage Betting") nastaje kada različite kladionice imaju dovoljno velike razlike u kvotama za
            sve moguće ishode jednog meča, tako da je matematički moguće uložiti novac na
            <span className="font-semibold text-white"> svaki ishod</span> i ostvariti{" "}
            <span className="font-bold text-emerald-400">siguran profit</span>, bez obzira na konačan rezultat.
          </p>
          <div className="rounded-lg border border-[#1a3050] bg-[#0b1c2e] p-3">
            <h4 className="mb-1 font-semibold text-blue-300">Kako koristim kalkulator?</h4>
            <ol className="list-inside list-decimal space-y-1 text-sm">
              <li>
                Unesite <span className="text-blue-400">Kvotu 1</span> i <span className="text-blue-400">Kvotu 2</span>.
              </li>
              <li>
                Unesite vaš željeni <span className="text-blue-400">Ukupan Ulog</span>.
              </li>
              <li>Kalkulator će vam reći da li je arbitraža moguća i prikazati tačne uloge.</li>
            </ol>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="mt-8 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4 font-semibold text-white shadow-lg shadow-blue-900/30 transition-all hover:shadow-[0_0_24px_rgba(59,130,246,0.4)]"
        >
          Razumem
        </motion.button>
      </motion.div>
    </div>
  );
}

export default function ArbitrageCalculator(): React.ReactNode {
  const [arbData, setArbData] = useState({
    odds1: "",
    odds2: "",
    stake: "",
    statusMessage: null as string | null,
    statusCode: null as number | null,
    result: null as { stake1: number; stake2: number; profit: number } | null,
  });

  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const hasSeenArbExplanation = localStorage.getItem("hasSeenArbExplanation");
    if (!hasSeenArbExplanation) {
      setShowExplanation(true);
    }
  }, []);

  const handleExplanationClose = () => {
    setShowExplanation(false);
    localStorage.setItem("hasSeenArbExplanation", "true");
  };

  const calculate = (): void => {
    const { odds1, odds2, stake } = arbData;
    const o1 = parseFloat(odds1);
    const o2 = parseFloat(odds2);
    const s = parseFloat(stake);

    if (!o1 || !o2 || !s || o1 <= 1 || o2 <= 1 || s <= 0 || !isFinite(o1) || !isFinite(o2) || !isFinite(s)) {
      setArbData((prev) => ({
        ...prev,
        statusMessage: "Molimo unesite ispravne pozitivne kvote (>1.0) i ulog (>0).",
        statusCode: 0,
        result: null,
      }));
      return;
    }

    const totalProbability = 1 / o1 + 1 / o2;
    const margin = (1 - totalProbability) * 100;

    if (totalProbability >= 1) {
      setArbData((prev) => ({
        ...prev,
        statusMessage: `Sa ovim kvotama nije moguće sigurno klađenje. Margina je: ${margin.toFixed(2)}%`,
        statusCode: 0,
        result: null,
      }));
      return;
    }

    const stake1 = (1 / o1 / totalProbability) * s;
    const stake2 = (1 / o2 / totalProbability) * s;
    const profit = stake1 * o1 - s;

    setArbData((prev) => ({
      ...prev,
      statusMessage: `Na ovom meču je moguće sigurno klađenje! Profit: ${margin.toFixed(2)}%`,
      statusCode: 1,
      result: { stake1, stake2, profit },
    }));
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") calculate();
  };

  const inputs = useMemo(
    () => [
      { id: "odds1", label: "Kvota 1", value: arbData.odds1 },
      { id: "odds2", label: "Kvota 2", value: arbData.odds2 },
      { id: "stake", label: "Ukupan ulog", value: arbData.stake },
    ],
    [arbData.odds1, arbData.odds2, arbData.stake]
  );

  const success = arbData.statusCode === 1;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#020b18] p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute h-[460px] w-[460px] rounded-full bg-blue-600/10 blur-3xl"
      />

      <AnimatePresence>{showExplanation && <ArbExplanationModal onClose={handleExplanationClose} />}</AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 110, damping: 18 }}
        className="relative z-10 w-full max-w-3xl rounded-2xl border border-[#1a3050] bg-[#07131f] p-8 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-3xl font-black tracking-tight text-transparent">
            Kalkulator sigurnog klađenja
          </h1>
          <p className="mt-2 text-sm text-slate-400">Unesite kvote iz različitih kladionica i izračunajte optimalan ulog</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {inputs.map((input) => (
            <div key={input.id}>
              <label htmlFor={`arb_${input.id}`} className="mb-1 block text-sm font-medium text-slate-300">
                {input.label}
              </label>
              <input
                type="number"
                id={`arb_${input.id}`}
                className="w-full rounded-lg border border-[#1a3050] bg-[#0b1c2e] p-3 text-white transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                value={input.value}
                onChange={(e) => setArbData((prev) => ({ ...prev, [input.id]: e.target.value }))}
                onKeyPress={handleKeyPress}
                step="0.01"
              />
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={calculate}
          className="mx-auto mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-900/30 transition-all hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] md:w-auto"
        >
          <Calculator size={20} />
          Izračunaj
        </motion.button>

        <AnimatePresence>
          {arbData.statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-8 rounded-xl border p-5 ${
                success ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"
              }`}
            >
              <div className={`flex items-center gap-2 font-semibold ${success ? "text-emerald-400" : "text-red-400"}`}>
                {success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {arbData.statusMessage}
              </div>

              {arbData.result && (
                <div className="mt-5 grid gap-4 text-slate-200 md:grid-cols-3">
                  <div className="rounded-lg border border-emerald-700/30 bg-emerald-500/5 p-4">
                    <p className="mb-1 text-sm text-slate-400">Ulog na kvotu 1</p>
                    <p className="text-xl font-bold text-white">{arbData.result.stake1.toFixed(0)} RSD</p>
                  </div>
                  <div className="rounded-lg border border-emerald-700/30 bg-emerald-500/5 p-4">
                    <p className="mb-1 text-sm text-slate-400">Ulog na kvotu 2</p>
                    <p className="text-xl font-bold text-white">{arbData.result.stake2.toFixed(0)} RSD</p>
                  </div>
                  <div className="rounded-lg border border-emerald-700/30 bg-emerald-500/5 p-4">
                    <p className="mb-1 text-sm text-slate-400">Očekivani profit</p>
                    <p className="text-2xl font-bold text-emerald-400">+{arbData.result.profit.toFixed(2)} RSD</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-xs text-slate-500">
          Kalkulator vam pomaže da ravnomerno rasporedite ulog i osigurate profit bez obzira na ishod.
        </p>
      </motion.div>
    </div>
  );
}
