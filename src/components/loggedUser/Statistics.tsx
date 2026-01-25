import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import "../../index.css";
import { RootState } from "../../redux/store";
import PremiumFallback from "./PremiumFallback";
import UserBets from "./UserBets";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface Statistics {
  _id: string;
  email: string;
  password: string;
  tier: string;
  username: string;
  statistics: {
    totalBets: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    totalProfit: number;
    initialInvestment: number;
    monthlyStats: MonthlyStat[];
    avgBetAmount: number;
    averageReturnOnInvestment: number;
  };
  updatedAt: string;
  defaultCurrency: string;
}

interface CurrentBet {
  match: String | null;
  tip: String | null;
  stake: number | null;
  odds: number | null;
  status: String;
}
interface MonthlyStat {
  month: string;
  profit: number;
  loss: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  avgBetAmount: number;
  bets: [];
}
enum Month {
  Januar = 0,
  Februar = 1,
  Mart = 2,
  April = 3,
  Maj = 4,
  Jun = 5,
  Jul = 6,
  Avgust = 7,
  Septembar = 8,
  Oktobar = 9,
  Novembar = 10,
  Decembar = 11,
}

export default function Statistics(): React.ReactNode {
  const currentUser = useSelector((state: RootState) => state.user); // The user, used to check if premium on the client.
  if (currentUser.tier === "free") {
    return <PremiumFallback />;
  }
  const [error, setError] = useState<{ message: string } | null>(null);
  const [bankCapital, setBankCapital] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentBet, setCurrentBet] = useState<CurrentBet | CurrentBet[]>({
    // Current bet the user is creating.
    match: null,
    tip: null,
    stake: null,
    odds: null,
    status: "active",
  });
  const [userStats, setUserStats] = useState<Statistics>(); // Statistics of the user account.
  const [betBuilder, setBetBuilder] = useState({
    // BetBuilder UI.
    status: "",
    visible: false,
    mode: "single",
  });

  const currentMonth = new Date().getMonth();
  const today = new Date().getDate();

  const JWT = localStorage.getItem("insajder_token");
  const defaultCurrency = userStats?.defaultCurrency;
  const [lineMode, setLineMode] = useState({ month: currentMonth, day: 0 }); // Main statistic you see, tracks when user switches to a specific day, 0 = whole month
  const currentMonthStats = userStats?.statistics?.monthlyStats[lineMode.month];
  const [parlay, setParlay] = useState<CurrentBet[]>([]); // BetBuilder parlay mode items
  const [parlayStatus, setParlayStatus] = useState("active");
  const [areTodayBetsVisible, setAreTodayBetsVisible] = useState(false);

  const addToParlay = () => {
    // Adds an item to a parlay bet.
    if (!currentBet.tip || !currentBet.odds || !currentBet.match) {
      console.error("Invalid bet data. Cannot add to parlay.");
      return;
    }

    setParlay((prevParlay: any) => {
      const updatedParlay = [
        ...prevParlay,
        {
          tip: currentBet.tip,
          odds: currentBet.odds,
          match: currentBet.match,
        },
      ];

      return updatedParlay;
    });
  };
  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
          drawOnChartArea: false,
        },
        ticks: {
          color: "#94a3b8", // slate-400
          font: {
            size: 12,
            weight: "500",
          },
          padding: 4,
          autoSkipPadding: 10,
        },
      },
      y: {
        position: "left",
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "#7dd3fc", // sky-300
          font: {
            size: 12,
            weight: "600",
          },
          callback: (value) => `${value}%`,
          padding: 5,
        },
      },
      y2: {
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "#f87171", // red-400
          font: {
            size: 12,
            weight: "600",
          },
          callback: (value) => `${Number(value).toFixed(0)}`,
          padding: 5,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "center",
        labels: {
          color: "#e2e8f0", // slate-200
          font: {
            size: 14,
            weight: "bold",
          },
          padding: 16,
          boxWidth: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        // Your existing tooltip configuration can go here
      },
    },
    layout: {
      padding: {
        top: 15,
        bottom: 5,
        left: 15,
        right: 15,
      },
    },
  };
  const StatCard = ({ icon, title, value, variant = "neutral" }) => {
    const styles = {
      neutral: {
        glow: "from-sky-500/10 via-transparent",
        hoverBorder: "hover:border-sky-500/40",
        iconColor: "text-sky-400",
        valueColor: "text-white",
      },
      success: {
        glow: "from-green-500/10 via-transparent",
        hoverBorder: "hover:border-green-500/40",
        iconColor: "text-green-400",
        valueColor: "text-green-400",
      },
      danger: {
        glow: "from-red-500/10 via-transparent",
        hoverBorder: "hover:border-red-500/40",
        iconColor: "text-red-400",
        valueColor: "text-red-400",
      },
    };

    const selectedStyle = styles[variant] || styles.neutral;

    return (
      <div
        className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 transition-all duration-300 ${selectedStyle.hoverBorder}`}
      >
        <div
          className={`absolute -right-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-gradient-radial ${selectedStyle.glow} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
        ></div>

        <div className="relative z-10 flex items-center gap-4">
          <div className={`flex-shrink-0 text-3xl ${selectedStyle.iconColor}`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase text-slate-500">
              {title}
            </p>
            <p className={`text-2xl font-bold ${selectedStyle.valueColor}`}>
              {value}
            </p>
          </div>
        </div>
      </div>
    );
  };
  const removeParlayItem = (index: number) => {
    // Removes an item from the parlay bet.
    setParlay((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index)
    );
  };
  const getDailyStats = () => {
    // Get statistics for the day chosen by the user and return as object.
    let winCount = 0;
    let lossCount = 0;
    let totalActives = 0;
    let profit = 0;

    const data =
      userStats?.statistics?.monthlyStats?.[lineMode?.month]?.bets?.[
        lineMode?.day
      ];

    // Return early if `data` doesn't exist
    if (!data) {
      return {
        totalWins: 0,
        totalLosses: 0,
        winPercentage: "0.00",
        profit: 0,
        totalActives: 0,
      };
    }

    if (Array.isArray(data)) {
      // If bet is a parlay bet
      data.forEach((bet) => {
        if (Array.isArray(bet)) {
          const status = bet[0]?.status;
          const stake = bet[0]?.stake;
          const totalOdds = bet[0]?.totalOdds;

          if (status === "win") {
            winCount += 1;
            profit += Number(((stake * totalOdds - stake) * 100) / 100);
          } else if (status === "loss") {
            lossCount += 1;
            profit -= stake;
          } else {
            totalActives += 1; // Active bet
          }
        } else {
          const status = bet?.status;
          const stake = bet?.stake;
          const odds = bet?.odds;

          if (status === "win") {
            winCount += 1;
            profit += Number(((stake * odds - stake) * 100) / 100);
          } else if (status === "loss") {
            lossCount += 1;
            profit -= stake;
          } else {
            totalActives += 1; // Active bet
          }
        }
      });
    }

    const totalBets = winCount + lossCount;

    const winPercentage =
      totalBets > 0 ? ((winCount / totalBets) * 100).toFixed(2) : "0.00";

    return {
      totalWins: winCount,
      totalLosses: lossCount,
      winPercentage,
      profit: Number(profit).toFixed(2),
      totalActives,
    };
  };
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const todays = new Date();
  const daysInMonth = getDaysInMonth(todays.getFullYear(), todays.getMonth());

  const getAmountOfBetsPerDay = () => {
    const forMonth = userStats?.statistics?.monthlyStats[lineMode.month].bets;

    if (!forMonth) {
      console.log("Data not available yet");
      return;
    }

    const data = forMonth.map((day) => (day ? day.length : 0));

    return data;
  };

  const dailyStats = useMemo(
    () => getDailyStats(),
    [lineMode.month, lineMode.day]
  );
  const amountOfBets = getAmountOfBetsPerDay();

const saveCurrentBet = async () => {
  if (
    !currentBet ||
    Object.values(currentBet).some((val) => val == null || val === "")
  ) {
    setBetBuilder((prev) => ({
      ...prev,
      status: "Došlo je do greške. Molimo popunite svako polje.",
    }));
    return;
  }

  const stake = Number(currentBet.stake);
  const isParlay = parlay.length > 0;
  const odds = isParlay
    ? parlay.reduce((acc, g) => acc * Number(g.odds), 1)
    : Number(currentBet.odds);

  if (odds >= 10000) {
    setBetBuilder((prev) => ({ ...prev, status: "Došlo je do greške." }));
    return;
  }

  setBetBuilder((prev) => ({ ...prev, status: "Azuriranje..." }));

  if (!currentBet || !currentBet.stake) {
    console.error("Invalid bet or stake.");
    return;
  }

  const todayDate = new Date().toLocaleDateString("en-us");
  const uuid = uuidv4();

  // Ensure today's array exists
  const todayBets =
    userStats?.statistics.monthlyStats[currentMonth].bets[today] || [];

  // Build bet object
  const betToSave = isParlay
    ? {
        type: "parlay",
        games: parlay.map((g) => ({
          match: g.match,
          tip: g.tip,
          odds: g.odds,
          status: g.status,
        })),
        stake: stake,
        odds: odds,
        status: currentBet.status,
        date: todayDate,
        betId: uuid,
      }
    : {
        type: "single",
        match: currentBet.match,
        tip: currentBet.tip,
        stake: stake,
        odds: odds,
        status: currentBet.status,
        date: todayDate,
        betId: uuid,
      };

  todayBets.push(betToSave);
  userStats.statistics.monthlyStats[currentMonth].bets[today] = todayBets;

  // Investment & profit logic
  let investmentChange = 0;
  let monthlyProfitChange = 0;

  if (currentBet.status === "active" || currentBet.status === "loss") {
    investmentChange = -stake;
    monthlyProfitChange = currentBet.status === "loss" ? -stake : 0;
  } else if (currentBet.status === "win") {
    investmentChange = stake * (odds - 1);
    monthlyProfitChange = stake * (odds - 1);
  }

  // Update stats
  userStats.statistics.totalBets += 1;
  userStats.statistics.monthlyStats[currentMonth].totalBets += 1;
  userStats.statistics.initialInvestment += investmentChange;
  userStats.statistics.monthlyStats[currentMonth].monthlyProfit +=
    monthlyProfitChange;

  if (currentBet.status === "win") {
    userStats.statistics.monthlyStats[currentMonth].totalWins += 1;
  } else if (currentBet.status === "loss") {
    userStats.statistics.monthlyStats[currentMonth].totalLosses += 1;
  }

  try {
    const response = await fetch("/updateStatistics", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + JWT,
      },
      body: JSON.stringify({
        updates: [
          {
            updatePath: "statistics.totalBets",
            newValue: userStats.statistics.totalBets,
            increment: false,
          },
          {
            updatePath: "statistics.initialInvestment",
            newValue: userStats.statistics.initialInvestment,
            increment: false,
          },
          {
            updatePath: `statistics.monthlyStats.${currentMonth}.monthlyProfit`,
            newValue:
              userStats.statistics.monthlyStats[currentMonth].monthlyProfit,
            increment: false,
          },
          {
            updatePath: `statistics.monthlyStats.${currentMonth}.totalBets`,
            newValue:
              userStats.statistics.monthlyStats[currentMonth].totalBets,
            increment: false,
          },
          {
            updatePath: `statistics.monthlyStats.${currentMonth}.totalWins`,
            newValue:
              userStats.statistics.monthlyStats[currentMonth].totalWins,
            increment: false,
          },
          {
            updatePath: `statistics.monthlyStats.${currentMonth}.totalLosses`,
            newValue:
              userStats.statistics.monthlyStats[currentMonth].totalLosses,
            increment: false,
          },
          {
            updatePath: `statistics.monthlyStats.${currentMonth}.bets.${today}`,
            newValue: betToSave,
            increment: false,
            push: true,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    setBetBuilder((prev) => ({
      ...prev,
      status: "Vaša opklada je uspešno sačuvana!",
    }));
  } catch (error) {
    console.error(error);
    setError({ message: "Došlo je do greške." });
  }
};


const getBets = useCallback(
  (month: string | number, day: string | number, all: boolean) => {
    if (!userStats?.statistics?.monthlyStats) return [];

    // Case 1: Fetch absolutely everything
    if (all) {
      return userStats.statistics.monthlyStats.reduce((acc, m) => {
        if (Array.isArray(m?.bets)) {
          // Flattening days and filtering out nulls
          const flattened = m.bets.flat().filter(Boolean);
          return [...acc, ...flattened];
        }
        return acc;
      }, []);
    }

    // Convert month to number to ensure we can index the array
    const monthIdx = typeof month === 'string' ? parseInt(month, 10) : month;
    const monthData = userStats.statistics.monthlyStats[monthIdx];

    if (!monthData || !monthData.bets) return [];

    // Case 2: Specific Month + Day
    if (month !== null && day !== null) {
      const dayIdx = typeof day === 'string' ? parseInt(day, 10) : day;
      const dayBets = monthData.bets[dayIdx];
      
      // Ensure we return an array, even if the day is empty/null
      return Array.isArray(dayBets) ? dayBets : [];
    } 
    
    // Case 3: Whole Month
    if (month !== null) {
      return monthData.bets.flatMap((d) => d || []);
    }

    return [];
  },
  [userStats?.statistics]
);
  const labels = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i === 0 ? 1 : i; // Ensure first day is 1
    return `${day} ${Month[lineMode.month]}`;
  });

  const getWinLossForGraph = () => {
    if (lineMode.day === 0) {
      // all

      const days = userStats?.statistics?.monthlyStats[lineMode.month].bets;
      console.log(days);
      var data = [];
      days?.map((day) => {
        if (!day) {
          data.push(0);
        } else {
          let winCount = 0;
          let lossCount = 0;

          day.map((bet) => {
            if (Array.isArray(bet)) {
              // parlay
              if (bet[0].status === "win") {
                winCount++;
              } else if (bet[0].status === "loss") {
                lossCount++;
              }
            } else {
              if (bet.status === "win") {
                winCount++;
              } else if (bet.status === "loss") {
                lossCount++;
              }
            }
          });

          const totalBets = winCount + lossCount;
          const percentage =
            totalBets > 0 ? Math.ceil((winCount / totalBets) * 100) : 0;
          data.push(percentage);
        }
      });
      return data;
    } else {
      // If user selected a specific day

      const dailyBets =
        userStats?.statistics?.monthlyStats[lineMode.month]?.bets[lineMode.day];
      if (!dailyBets)
        return {
          winCount: 0,
          lossCount: 0,
          totalBets: 0,
          winPercentage: 0,
          profit: 0,
        };

      let winCount = 0;
      let lossCount = 0;
      let totalBets = 0;
      let profit = 0;

      dailyBets.forEach((bet) => {
        if (!bet) return;

        if (Array.isArray(bet)) {
          // Handling parlays
          const allWon = bet.every((game) => game.status === "win");
          const anyLost = bet.some((game) => game.status === "loss");

          if (allWon) {
            winCount++;
            profit += bet.reduce(
              (acc, game) => acc + (game.stake * game.odds - game.stake),
              0
            );
          } else if (anyLost) {
            lossCount++;
            profit -= bet.reduce((acc, game) => acc + game.stake, 0);
          }

          totalBets++;
        } else {
          if (bet.status === "win") {
            winCount++;
            profit += bet.stake * bet.odds - bet.stake;
          } else if (bet.status === "loss") {
            lossCount++;
            profit -= bet.stake;
          }
          totalBets++;
        }
      });

      const winPercentage = totalBets > 0 ? (winCount / totalBets) * 100 : 0;
      return { winCount, lossCount, totalBets, winPercentage, profit };
    }
  };

  const winLossData = useMemo(
    () => getWinLossForGraph(),
    [userStats, lineMode.day, lineMode.month]
  );

  const chartData = {
    // Chart.js object data
    labels: lineMode.day ? [""] : labels, // Single day will use an empty label
    datasets: [
      {
        label: "% Pobede po danu",
        data: Array.isArray(winLossData)
          ? winLossData
          : [winLossData.totalBets],
        borderColor: "skyblue",
        backgroundColor: "skyblue",
        yAxisID: "y",
      },
      {
        label: "Opklade po danu",
        data: amountOfBets,
        borderColor: "orangered",
        backgroundColor: "orangered",
        borderWidth: 2,
        yAxisID: "y2",
      },
    ],
  };

  const doughAllTime = {
    labels: ["Prolaznost", "Padovi"],
    datasets: [
      {
        data: [
          userStats?.statistics?.totalWins,
          userStats?.statistics?.totalLosses,
        ],
        backgroundColor: ["#4CAF50", "crimson"],
        borderWidth: 0,
      },
    ],
  };
  const doughMonthly = {
    labels: ["Prolaznost", "Padovi"],
    datasets: [
      {
        data: [currentMonthStats?.totalWins, currentMonthStats?.totalLosses],
        backgroundColor: ["#4CAF50", "crimson"],
        borderWidth: 0,
      },
    ],
  };
  const updateCapital = (val: number) => {
    if (val >= 20000000) {
      return;
    }
    setBankCapital(val);
  };

  const updateInitialCapital = () => {
    // If the user has just bought a premium, his money is at 0. when user chooses initial capital, we save the capital to the server.
    if (bankCapital) {
      fetch("/updateCapital", {
        headers: {
          Authorization: "Bearer " + JWT,
          "Content-Type": "application/json",
        },
        method: "PUT",
        body: JSON.stringify({
          initialInvestment: bankCapital,
        }),
      }).then((res) => {
        if (!res.ok) {
          setError({ message: "Doslo je do greske sa serverom." });
          return;
        }

        setError({
          message: `Vas pocetni kapital od ${bankCapital} ${defaultCurrency?.toUpperCase()} je uspesno sacuvan.`,
        });
        userStats.statistics.initialInvestment = bankCapital;
      });
    }
  };
  useEffect(() => {
    document.title = "InsajderTips | Statistike";

    if (!currentUser.username || !JWT) {
      setError({
        message: "Doslo je do greske. Molimo da se ulogujete ponovo.",
      });
      return;
    }
    const { username } = currentUser;
    // Fetch statistics
    fetch("/statistics/" + username, {
      headers: { Authorization: "Bearer " + JWT },
    }).then((res) => {
      if (!res.ok) {
        setLoading(false);
        return;
      }
      res.json().then((json) => {
        setUserStats(json);

        setLoading(false);
      });
    });
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full justify-center items-center flex text-center">
        <span className="text-xl">Ucitavanje...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex justify-center items-center">
      <div className="h-full w-[100%]  flex ml-auto md:mx-auto">
        <div className="my-2 w-full flex flex-col  ">
          {!userStats?.statistics?.initialInvestment ? (
            <div className="h-full w-full flex flex-col justify-center items-center p-6">
              <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] shadow-2xl border border-gray-700 rounded-2xl p-8 max-w-lg text-center">
                <h2 className="text-xl font-bold text-white mb-4">
                  Početni kapital nije postavljen
                </h2>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                  Da biste pravilno pratili svoju investiciju i ostvareni
                  profit, potrebno je da unesete svoj početni kapital.
                </p>

                <div className="w-full">
                  <input
                    type="number"
                    onChange={(e) => updateCapital(Number(e.target.value))}
                    placeholder={`Unesite kapital (${defaultCurrency?.toUpperCase()})`}
                    className="w-full border border-gray-600 bg-gray-800 text-white text-center text-lg p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] transition"
                  />
                  {bankCapital && bankCapital > 0 && (
                    <button
                      onClick={() => updateInitialCapital()}
                      className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold mt-4 rounded-lg py-3 transition-all"
                    >
                      Sačuvaj kapital
                    </button>
                  )}
                  {error && (
                    <p
                      className={`mt-4 text-sm p-3 rounded-lg ${
                        error.message.startsWith("Vas")
                          ? "bg-[#10b981] text-white"
                          : "bg-[#ef4444] text-white"
                      }`}
                    >
                      {error.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="w-full bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-2 border-indigo-900/30 shadow-2xl shadow-indigo-900/20 rounded-t-lg">
                <div className="w-full bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-2 border-indigo-900/30 shadow-2xl shadow-indigo-900/20 rounded-t-lg relative">
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center py-4">
                      {/* Title is centered using justify-center */}
                      <span className="raceFont text-md md:text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(59,130,246,0.5)]">
                        Moje Statistike kladjenja
                      </span>

                      {/* Button is ABSOLUTELY positioned to the right. 
          It will ignore the title's centering and sit on the far right. */}
                      {userStats?.statistics?.initialInvestment && (
                        <button
                          onClick={() =>
                            !betBuilder.visible &&
                            setBetBuilder((prev) => ({
                              ...prev,
                              visible: true,
                            }))
                          }
                          className="group flex items-center justify-center rounded-full 
                     bg-slate-800/70 text-white transition-all duration-300 ease-in-out 
                     border border-sky-600 shadow-md shadow-sky-800/50 
                     hover:scale-105 hover:bg-sky-700 hover:shadow-sky-500/80 
                     focus:outline-none focus:ring-4 focus:ring-sky-500/50 
                     
                     // POSITIONING: Absolute, centered vertically, locked to the right
                     absolute right-4 top-1/2 -translate-y-1/2 sm:right-6 lg:right-8
                     
                     // MOBILE STYLES: Tiny button, no text
                     p-2 text-sm whitespace-nowrap gap-0 sm:gap-2
                     
                     // DESKTOP STYLES: Full button with text
                     sm:px-4 sm:py-2 sm:text-sm sm:font-semibold"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5 sm:h-5 sm:w-5 text-sky-400 transition-transform duration-300 group-hover:text-white group-hover:rotate-45"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {/* Hide text on mobile (default) and show it on screens larger than 'sm' */}
                          <span className="hidden sm:inline whitespace-nowrap">
                            Dodaj Opkladu
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            <div className="grid grid-cols-1 gap-3 p-2 md:grid-cols-2 lg:gap-4">
  {/* Card 1: Total Bets */}
  <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:bg-slate-800/80">
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-1.125 0-2.062.938-1.976 2.062a48.424 48.424 0 001.123 5.801" />
        </svg>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ukupno opklada</p>
        <p className="text-xl font-bold text-white leading-tight">
          {userStats?.statistics?.totalBets || 0}
        </p>
      </div>
    </div>
    <div className="h-1 w-12 rounded-full bg-slate-800 group-hover:bg-sky-500/30 transition-colors"></div>
  </div>

  {/* Card 2: Total Balance */}
  <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:bg-slate-800/80">
    <div className="flex items-center gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${userStats?.statistics?.initialInvestment > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25" />
        </svg>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ukupno Stanje</p>
        <p className={`text-xl font-bold leading-tight ${userStats?.statistics?.initialInvestment > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {Math.round(userStats?.statistics?.initialInvestment || 0)}
          <span className="ml-1 text-xs font-medium text-slate-500 font-sans">{defaultCurrency}</span>
        </p>
      </div>
    </div>
    <div className={`h-6 rounded-lg px-2 flex items-center text-[10px] font-black tracking-tighter uppercase ${userStats?.statistics?.initialInvestment > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
      {userStats?.statistics?.initialInvestment > 0 ? '↑' : '↓'}
    </div>
  </div>
</div>
              <div className="flex flex-col w-full  mx-auto  gap-2 0 p-1 md:p-4 ">
             <div className="flex h-fit min-w-full flex-col gap-6 p-2 lg:flex-row">
  {/* Main Stats Area */}
  <div className="flex w-full flex-col space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-xl shadow-2xl sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-800/60 pb-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Mesečni <span className="text-sky-400">pregled</span>
        </h2>
        <p className="text-sm text-slate-500">Detaljna analiza vaših rezultata</p>
      </div>

      <div className="flex w-full gap-3 sm:w-auto">
        <div className="relative w-full sm:w-40">
          <select
            className="w-full cursor-pointer appearance-none rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-200 transition-all hover:border-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            onChange={(e) =>
              setLineMode((prev) => ({
                ...prev,
                month: e.target.value,
              }))
            }
            value={lineMode.month}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index} value={index} className="bg-slate-900">
                {Month[index]}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-48">
          <select
            className="w-full cursor-pointer appearance-none rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-200 transition-all hover:border-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            value={lineMode.day}
            onChange={(e) => {
              const newDay = parseInt(e.target.value, 10);
              setLineMode((prev) => ({ ...prev, day: newDay }));
            }}
          >
            <option value={0} className="bg-slate-900 text-slate-300">
              Ceo mesec
            </option>
            {Array.from({ length: daysInMonth }).map((_, index) => (
              <option key={index + 1} value={index + 1} className="bg-slate-900 text-slate-300">
                {index + 1}. {Month[lineMode.month]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>

    <div className="min-h-[400px] w-full">
      {!userStats?.statistics?.monthlyStats[lineMode.month] ||
      userStats.statistics.monthlyStats[lineMode.month].totalBets <= 0 ? (
        <div className="flex min-h-[450px] w-full flex-col items-center justify-center rounded-3xl bg-slate-950/30 border-2 border-dashed border-slate-800/50 p-10 text-center">
          <div className="rounded-full bg-slate-800/50 p-6 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-12 w-12 text-slate-600"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-300">Nema pronađenih opklada</h3>
          <p className="mt-2 max-w-xs text-slate-500">
            Izgleda da niste uneli nikakve podatke za ovaj period.
          </p>
        </div>
      ) : lineMode.day === 0 ? (
        <div className="relative h-[400px] w-full md:h-[550px] p-2">
          <Line
            data={chartData}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
                x: { grid: { display: false }, border: { display: false } }
              }
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-5">
            <div className="h-[380px] xl:col-span-2 rounded-2xl bg-slate-950/20 p-4 border border-slate-800/50">
              <Bar
                data={{
                  labels: [""],
                  datasets: [
                    { label: "Dobitni", data: [dailyStats?.totalWins], backgroundColor: "#10b981", borderRadius: 8 },
                    dailyStats?.totalActives > 0 ? { label: "Aktivni", data: [dailyStats?.totalActives], backgroundColor: "#64748b", borderRadius: 8 } : null,
                    { label: "Gubitni", data: [dailyStats?.totalLosses], backgroundColor: "#ef4444", borderRadius: 8 },
                  ].filter(Boolean),
                }}
                options={{
                  scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } },
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
            
            <div className="xl:col-span-3 rounded-2xl border border-slate-800 bg-slate-950/20 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/30">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Statistika</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Vrednost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr className="group transition-colors hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-medium text-slate-300">Ukupno opklada</td>
                    <td className="px-6 py-4 text-white font-mono">{userStats?.statistics?.monthlyStats[lineMode.month]?.bets[lineMode.day]?.length || 0}</td>
                  </tr>
                  <tr className="group transition-colors hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-medium text-slate-300">Dobitnih opklada</td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">{dailyStats?.totalWins}</td>
                  </tr>
                  <tr className="group transition-colors hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-medium text-slate-300">Ostvaren profit</td>
                    <td className={`px-6 py-4 font-mono font-bold ${dailyStats?.profit <= 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {Number(dailyStats?.profit || 0).toFixed(2)} {defaultCurrency}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Accordion List */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/20">
            <button
              onClick={() => setAreTodayBetsVisible(!areTodayBetsVisible)}
              className="flex w-full items-center justify-between p-5 font-bold text-white transition-all hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></div>
                <span>Opklade ovog dana</span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-6 w-6 text-slate-500 transition-transform duration-500 ${areTodayBetsVisible ? "rotate-180" : ""}`}
              >
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${areTodayBetsVisible ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto p-4 bg-slate-900/40 border-t border-slate-800/50">
              <UserBets
        bets={getBets(lineMode.month, lineMode.day, false)}
        userStats={userStats?.statistics}
        setUserStats={setUserStats}
      />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Sidebar Summary Card */}
  <div className="group relative min-w-[320px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl transition-all duration-500 hover:border-sky-500/40">
    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/5 blur-[80px] transition-opacity group-hover:opacity-100"></div>

    <div className="relative z-10 flex flex-col space-y-8">
      <div className="border-b border-slate-800/60 pb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Statistika Meseca</h3>
        <p className={`mt-2 text-4xl font-black tracking-tighter ${currentMonthStats?.monthlyProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {currentMonthStats?.monthlyProfit >= 0 ? "+" : ""}
          {currentMonthStats?.monthlyProfit?.toFixed(2) || "0.00"}
          <span className="ml-2 text-lg font-medium opacity-60 font-sans">{defaultCurrency}</span>
        </p>
      </div>

      <div className="relative flex h-64 items-center justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white">
            {currentMonthStats?.totalBets ? Math.round((currentMonthStats.totalWins / currentMonthStats.totalBets) * 100) : 0}%
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Prolaz</span>
        </div>
        <div className="h-full w-full drop-shadow-[0_0_15px_rgba(56,189,248,0.2)]">
          <Doughnut data={doughMonthly} options={{ cutout: '82%', plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition-colors hover:bg-slate-800/40">
          <p className="text-2xl font-bold text-white font-mono">{currentMonthStats?.totalBets || 0}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ukupno</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition-colors hover:bg-slate-800/40">
          <p className="text-2xl font-bold text-sky-400 font-mono">{currentMonthStats?.totalBets - currentMonthStats?.totalWins - currentMonthStats?.totalLosses || 0}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Aktivnih</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4 transition-colors hover:bg-emerald-500/10">
          <p className="text-2xl font-bold text-emerald-400 font-mono">{currentMonthStats?.totalWins || 0}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Dobitnih</p>
        </div>
        <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-4 transition-colors hover:bg-red-500/10">
          <p className="text-2xl font-bold text-red-400 font-mono">{currentMonthStats?.totalLosses || 0}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-red-600">Gubitnih</p>
        </div>
      </div>
    </div>
  </div>
</div>

        <div className="flex h-full w-full flex-col overflow-hidden rounded-[1.5rem] border border-white/[0.05] bg-slate-950/20 shadow-2xl backdrop-blur-md">
  {/* Header: More refined, less "heavy" */}
  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.05] bg-slate-900/40 px-5 py-3 backdrop-blur-md">
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]"></div>
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        Poslednje Opklade
      </h3>
    </div>
  </div>

  {/* Scroll Area: Improved spacing and fade-out effect */}
  <div className="relative flex-1 overflow-hidden">
    {/* Subtle gradient overlay to fade content at the very bottom */}
    <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-12 w-full bg-gradient-to-t from-slate-950/50 to-transparent"></div>
    
    <div className="h-full space-y-1 overflow-y-auto p-3 scrollbar-hide">
      <UserBets
        bets={getBets("", "", true)}
        userStats={userStats?.statistics}
        setUserStats={setUserStats}
      />
    </div>
  </div>
</div>
              </div>
            </>
          )}
        </div>

        {betBuilder.visible && (
      <div className="z-50 fixed inset-0 flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
  <div className="w-full max-w-2xl transform transition-all animate-in fade-in zoom-in duration-300">
    {/* Decorative outer glow wrap */}
    <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-white/20 via-transparent to-white/5 shadow-2xl">
      <div className="bg-[#0f172a]/95 backdrop-blur-2xl rounded-[23px] border border-white/10 overflow-hidden relative shadow-inner">
        
        {/* Subtle background flare */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 blur-[100px] pointer-events-none"></div>

        {/* Header */}
        <div className="px-8 pt-8 pb-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white italic">
                KREIRAJ <span className="text-cyan-400 not-italic">OPKLADU</span>
              </h2>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Mode Selector - Modern Segmented Control */}
        <div className="px-8 mb-8">
          <div className="bg-black/40 p-1.5 rounded-2xl flex gap-1 border border-white/5">
            <button
              onClick={() => betBuilder.mode !== "single" && setBetBuilder((prev) => ({ ...prev, mode: "single" }))}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-500 ${
                betBuilder.mode === "single"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              SINGL
            </button>
            <button
              onClick={() => betBuilder.mode !== "parlay" && setBetBuilder((prev) => ({ ...prev, mode: "parlay" }))}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-500 ${
                betBuilder.mode === "parlay"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              SISTEM
            </button>
          </div>
        </div>

        {/* Main Form Body */}
        <div className="px-8 pb-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Match Input */}
            <div className="group space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Naziv utakmice</label>
              <div className="relative">
                <input
                  onChange={(e) => setCurrentBet((prev) => ({ ...prev, match: e.target.value }))}
                  type="text"
                  className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 text-white rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all placeholder:text-gray-600"
                  placeholder="npr. Real Madrid - Barcelona"
                />
              </div>
            </div>

            {/* Tip Input */}
            <div className="group space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">TIP</label>
              <input
                onChange={(e) => setCurrentBet((prev) => ({ ...prev, tip: e.target.value }))}
                type="text"
                className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 text-white rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all placeholder:text-gray-600"
                placeholder="npr. GG3+"
              />
            </div>

            {/* Odds Input */}
            <div className="group space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Kvota</label>
              <input
                type="number"
                onChange={(e) => setCurrentBet((prev) => ({ ...prev, odds: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 text-cyan-400 font-mono text-lg rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                step="0.01"
                placeholder="1.85"
              />
            </div>

            {/* Stake Input (Single) */}
            {betBuilder.mode === "single" && (
              <div className="group space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Ulog ({currentUser.defaultCurrency})</label>
                <input
                  type="number"
                  onChange={(e) => setCurrentBet((prev) => ({ ...prev, stake: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 text-emerald-400 font-mono text-lg rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  placeholder="100"
                />
              </div>
            )}
          </div>

          {/* Status Chips (Single Only) */}
          {betBuilder.mode === "single" && (
            <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Status:</span>
              <div className="flex gap-2">
                {[
                  { id: "active", label: "Aktivan", color: "cyan" },
                  { id: "win", label: "Dobitan", color: "emerald" },
                  { id: "loss", label: "Gubitan", color: "red" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentBet((prev) => ({ ...prev, status: s.id }))}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                      currentBet?.status === s.id
                        ? `bg-${s.color}-500/20 border-${s.color}-500 text-${s.color}-400 shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                        : "bg-transparent border-white/10 text-gray-500 hover:border-white/20"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parlay Table Section */}
          {betBuilder.mode === "parlay" && parlay?.length > 0 && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-black/30 rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3">Događaj</th>
                      <th className="px-4 py-3 text-right">Kvota</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parlay.map((bet, index) => (
                      <tr key={index} className="group hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-white">{bet.match}</p>
                          <p className="text-xs text-gray-500">{bet.tip}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-cyan-400 font-bold">{bet.odds}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => removeParlayItem(index)} className="text-gray-600 hover:text-red-400 transition-colors">
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Parlay Summary Card */}
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 flex justify-between items-center border-t border-white/10">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Ukupna Kvota</p>
                    <p className="text-2xl font-black text-white tracking-tighter">
                      {parlay.reduce((total, el) => total * el.odds, 1).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Status Listića</p>
                    <select
                      onChange={(e) => setParlayStatus(e.target.value)}
                      className="bg-transparent text-cyan-400 font-bold text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="active">Aktivan</option>
                      <option value="win">Dobitan</option>
                      <option value="loss">Gubitan</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Ukupan Ulog (€)</label>
                <input
                  type="number"
                  onChange={(e) => setCurrentBet((prev) => ({ ...prev, stake: e.target.value }))}
                  className="w-full mt-1 bg-white/5 border border-white/10 focus:border-purple-500/50 text-white rounded-xl p-4 focus:outline-none transition-all"
                  placeholder="Unesite ulog za ceo sistem"
                />
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {betBuilder.mode === "single" ? (
              <button
                onClick={saveCurrentBet}
                className="flex-[2] py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-cyan-400 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
              >
                SAČUVAJ OPKLADU
              </button>
            ) : (
              <>
                <button
                  onClick={() => addToParlay()}
                  className="flex-1 py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-white/20 transition-all active:scale-[0.98]"
                >
                  DODAJ PAR
                </button>
                {parlay?.length > 0 && (
                  <button
                    onClick={saveCurrentBet}
                    className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                  >
                    FINALIŠI SISTEM
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => {
                setCurrentBet(null);
                setBetBuilder((prev) => ({ ...prev, visible: false, status: null }));
                setParlar([]);
              }}
              className="flex-1 py-4 bg-transparent text-gray-500 rounded-2xl font-bold uppercase tracking-widest text-xs hover:text-white transition-all"
            >
              ODUSTANI
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
        )}
      </div>
    </div>
  );
}
const TrashIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

const XMarkIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const PlusCircleIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const XCircleIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
