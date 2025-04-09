import { useState } from "react";

export default function ArbitrageCalculator(): React.ReactNode {
  const [arbData, setArbData] = useState({
    odds1: null,
    odds2: null,
    stake: null,
    statusMessage: null,
    statusCode: null,
    result: null,
  });

  const calculate = (): void => {
    setArbData((prev) => ({ ...prev, statusMessage: null, result: null, statusCode: null }));

    const { odds1, odds2, stake } = arbData;

    // Check if inputs are valid
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
        statusMessage: "Molimo, unesite obe kvote kao i ulog.",
        statusCode: 0,
      }));
      return;
    }

    // Parse input values to numbers
    const odds1Num = parseFloat(odds1);
    const odds2Num = parseFloat(odds2);

    // Calculate total probability
    const totalProbability = (1 / odds1Num) + (1 / odds2Num);

    if (totalProbability >= 1) {
      setArbData((prev) => ({
        ...prev,
        statusMessage: "Sa ovim kvotama nije moguce sigurno kladjenje.",
        statusCode: 0,
      }));
      return;
    }

    // Calculate proportional stakes
    const stake1 = (1 / odds1Num) / totalProbability * stake;
    const stake2 = (1 / odds2Num) / totalProbability * stake;

    // Calculate the returns for both bets
    const return1 = stake1 * odds1Num;
    const return2 = stake2 * odds2Num;

    // Calculate profit
    const profit = Math.max(return1, return2) - stake;

    // Construct simple and direct result
    setArbData((prev: any) => ({
      ...prev,
      statusMessage: `Na ovom mecu je moguce sigurno kladjenje!`,
      statusCode: 1,
      result: { stake1, stake2, profit },
    }));
  };

  return (
    <div className="w-full min-h-screen flex justify-center items-center p-6 ">
      <div className="bg-gray-800/50 w-full max-w-2xl rounded-xl p-8 flex flex-col gap-y-6 shadow-xl">
        <span className="text-lg md:text-2xl font-bold text-white text-center">
          Kalkulator sigurnog kladjenja
        </span>
        <span className="text-gray-500 text-sm text-center">Unesite kvotu iz jedne kladionice, drugu iz druge i pogledajte potencijalan profit.</span>

        <input
          type="number"
          id="arb_odds1"
          className="p-4 rounded-lg border border-gray-400 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          placeholder="Unesite kvotu 1"
          onChange={(e) =>
            setArbData((prev: any) => ({ ...prev, odds1: e.target.value }))
          }
        />

        <input
          type="number"
          id="arb_odds2"
          className="p-4 rounded-lg border border-gray-400 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          placeholder="Unesite kvotu 2"
          onChange={(e) =>
            setArbData((prev: any) => ({ ...prev, odds2: e.target.value }))
          }
        />

        <input
          type="number"
          id="arb_stake"
          className="p-4 rounded-lg border border-gray-400 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          placeholder="Unesite ulog"
          onChange={(e) =>
            setArbData((prev: any) => ({ ...prev, stake: e.target.value }))
          }
        />

        <button
          className="mt-4 px-4 md:px-6 py-2 rounded-lg bg-blue-600 text-white text-xl font-semibold hover:bg-blue-700 transition duration-200 cursor-pointer"
          onClick={calculate}
        >
          Izračunaj
        </button>

        {arbData.statusMessage && (
          <div className="mt-6 text-lg text-gray-200">
            <div className={`font-semibold ${arbData?.statusCode === 0 ? "text-red-500" : "text-green-500"}`}>{arbData.statusMessage}</div>

            {arbData.result && (
              <div className="flex flex-col mt-4 space-y-3">
                <div className="text-xl text-gray-300">
                  Kvota 1 ulog:{" "}
                  <span className="font-bold text-white">{arbData?.result?.stake1.toFixed(0)} RSD</span>
                </div>
                <div className="text-xl text-gray-300">
                  Kvota 2 ulog:{" "}
                  <span className="font-bold text-white">{arbData?.result?.stake2.toFixed(0)} RSD</span>
                </div>
                <div className="text-xl text-gray-300">
                  Profit:{" "}
                  <span className="font-bold text-green-500">
                    +{arbData?.result?.profit.toFixed(2)} RSD
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
