import { useState } from "react";

export default function ArbitrageCalculator(): React.ReactNode {
  const [arbData, setArbData] = useState({
    odds1: "",
    odds2: "",
    stake: "",
    statusMessage: null,
    statusCode: null,
    result: null,
  });

  const calculate = (): void => {
    setArbData((prev) => ({
      ...prev,
      statusMessage: null,
      result: null,
      statusCode: null,
    }));

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
    const stakeNum = parseFloat(stake);

    // Calculate total probability
    const totalProbability = 1 / odds1Num + 1 / odds2Num;

    if (totalProbability >= 1) {
      setArbData((prev) => ({
        ...prev,
        statusMessage: "Sa ovim kvotama nije moguće sigurno klađenje.",
        statusCode: 0,
      }));
      return;
    }

    // Calculate proportional stakes
    const stake1 = (1 / odds1Num / totalProbability) * stakeNum;
    const stake2 = (1 / odds2Num / totalProbability) * stakeNum;

    // Calculate the returns for both bets
    const return1 = stake1 * odds1Num;
    const return2 = stake2 * odds2Num;

    // Calculate profit
    const profit = Math.max(return1, return2) - stakeNum;

    setArbData((prev: any) => ({
      ...prev,
      statusMessage: `Na ovom meču je moguće sigurno klađenje!`,
      statusCode: 1,
      result: { stake1, stake2, profit },
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      calculate();
    }
  };

  return (
    <div className="w-full min-h-screen flex justify-center items-center p-6 bg-gray-950">
      <div className="bg-gray-950 w-full max-w-3xl rounded-xl p-8 flex flex-col gap-y-6 shadow-xl border border-gray-700">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Kalkulator sigurnog klađenja
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Unesite kvote iz različitih kladionica i izračunajte optimalan ulog
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="arb_odds1"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Kvota 1
            </label>
            <input
              type="number"
              id="arb_odds1"
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              value={arbData.odds1}
              onChange={(e) =>
                setArbData((prev: any) => ({ ...prev, odds1: e.target.value }))
              }
              onKeyPress={handleKeyPress}
              step="0.01"
              min="1.01"
            />
          </div>

          <div>
            <label
              htmlFor="arb_odds2"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Kvota 2
            </label>
            <input
              type="number"
              id="arb_odds2"
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              value={arbData.odds2}
              onChange={(e) =>
                setArbData((prev: any) => ({ ...prev, odds2: e.target.value }))
              }
              onKeyPress={handleKeyPress}
              step="0.01"
              min="1.01"
            />
          </div>

          <div>
            <label
              htmlFor="arb_stake"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Ukupan ulog
            </label>
            <input
              type="number"
              id="arb_stake"
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              value={arbData.stake}
              onChange={(e) =>
                setArbData((prev: any) => ({ ...prev, stake: e.target.value }))
              }
              onKeyPress={handleKeyPress}
              min="100"
            />
          </div>
        </div>

        <button
          className="mt-4 px-6 py-3 rounded-lg bg-blue-600 text-white text-lg font-semibold hover:bg-blue-700 transition duration-200 cursor-pointer flex items-center justify-center gap-2"
          onClick={calculate}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
          Izračunaj
        </button>

        {arbData.statusMessage && (
          <div className="mt-6">
            <div
              className={`p-4 rounded-lg ${
                arbData?.statusCode === 0
                  ? "bg-red-900/20 border border-red-800/50"
                  : "bg-green-900/20 border border-green-800/50"
              }`}
            >
              <div
                className={`font-semibold ${
                  arbData?.statusCode === 0 ? "text-red-400" : "text-green-400"
                }`}
              >
                {arbData.statusMessage}
              </div>

              {arbData.result && (
                <div className="mt-4 space-y-3 text-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-700/10 border-teal-500/20 border p-3 rounded-lg">
                      <div className="text-sm text-gray-400">
                        Ulog na kvotu 1
                      </div>
                      <div className="text-xl font-bold text-white">
                        {arbData.result.stake1.toFixed(0)} RSD
                      </div>
                    </div>
                    <div className="bg-green-700/10 border-teal-500/20 border p-3 rounded-lg">
                      <div className="text-sm text-gray-400">
                        Ulog na kvotu 2
                      </div>
                      <div className="text-xl font-bold text-white">
                        {arbData.result.stake2.toFixed(0)} RSD
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-700/10 border-teal-500/20 border p-3 rounded-lg">
                    <div className="text-sm text-gray-400">
                      Očekivani profit
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      +{arbData.result.profit.toFixed(2)} RSD
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>
            Kalkulator vam pomaže da ravnomerno rasporedite ulog kako biste
            osigurali profit bez obzira na ishod.
          </p>
        </div>
      </div>
    </div>
  );
}
