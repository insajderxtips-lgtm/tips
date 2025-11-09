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
    const odds = Number(currentBet.odds);
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
    todayBets.push({
      match: currentBet?.match,
      tip: currentBet?.tip,
      stake: currentBet?.stake,
      odds: currentBet?.odds,
      status: currentBet?.status,
      date: todayDate,
      betId: uuid,
    });
    userStats.statistics.monthlyStats[currentMonth].bets[today] = todayBets;

    // Single bet logic
    let investmentChange = 0;
    let monthlyProfitChange = 0;

    if (currentBet.status === "active" || currentBet.status === "loss") {
      investmentChange = -stake;
      monthlyProfitChange = currentBet.status === "loss" ? -stake : 0;
    } else if (currentBet.status === "win") {
      investmentChange = stake * (odds - 1);
      monthlyProfitChange = stake * (odds - 1);
    }

    // ✅ Manually increment locally (once)
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
              increment: false, // send full value, not increment
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
              newValue: {
                match: currentBet.match,
                tip: currentBet.tip,
                stake: currentBet.stake,
                odds: currentBet.odds,
                date: todayDate,
                status: currentBet.status,
                betId: uuid,
              },
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
    (month: string, day: string, all: boolean) => {
      // Gets the bets used for UserBets component to show in a table.
      // All = get all user bets ever
      // Month + Day = specific date for the bet list
      // Month = monthly bets
      if (all) {
        let bets: any[] = [];

        userStats?.statistics?.monthlyStats?.forEach((month) => {
          if (Array.isArray(month?.bets)) {
            bets.push(...month.bets.flat().filter((bet) => bet));
          }
        });

        return bets;
      }

      if (month && day) {
        return userStats?.statistics.monthlyStats[month].bets[day];
      } else if (month) {
        return (
          userStats?.statistics?.monthlyStats[month].bets?.flatMap(
            (day) => day || []
          ) || []
        );
      }
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
              <div className="flex justify-center relative p-4 bg-gradient-to-r from-indigo-900/20 to-purple-900/20  border-2 border-indigo-900/30 shadow-2xl shadow-indigo-900/20">
                <span className="raceFont text-md md:text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(59,130,246,0.5)] hover:scale-105 transition-transform duration-300">
                  Moje Statistike kladjenja
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                <StatCard
                  title="Ukupno opklada"
                  value={userStats?.statistics?.totalBets || 0}
                  variant="neutral"
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-8 w-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-1.125 0-2.062.938-1.976 2.062a48.424 48.424 0 001.123 5.801c.065.21.1.433.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75c0-.231-.035-.454-.1-.664M6.75 15H4.875c-1.125 0-2.062.938-1.976 2.062a48.424 48.424 0 001.123 5.801c.065.21.1.433.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75c0-.231-.035-.454-.1-.664M13.5 15H12"
                      />
                    </svg>
                  }
                />

                <StatCard
                  title="Ukupno Stanje"
                  value={`${Math.round(
                    userStats?.statistics?.initialInvestment || 0
                  )} ${defaultCurrency}`}
                  variant={
                    userStats?.statistics?.initialInvestment > 0
                      ? "success"
                      : "danger"
                  }
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-8 w-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414-.336.75-.75.75h-.75m0-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75-.75v-.75m0 0l-3.75-3.75M3 12h18"
                      />
                    </svg>
                  }
                />
              </div>

              <div className="flex flex-col w-full  mx-auto  gap-2 0 p-1 md:p-4 ">
                <div className="min-w-full h-fit flex gap-2  flex-col min-[1230px]:flex-row">
                  <div className="flex h-full w-full flex-col space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-lg sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <h2 className="text-xl font-bold text-sky-400 sm:text-2xl">
                        Mesečni pregled
                      </h2>
                      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <select
                          className="w-full  cursor-pointer rounded-lg border-2 border-slate-700 bg-slate-800/60 px-4 py-2.5 text-slate-300 transition-all placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 sm:w-auto"
                          onChange={(e) =>
                            setLineMode((prev) => ({
                              ...prev,
                              month: e.target.value,
                            }))
                          }
                          value={lineMode.month}
                        >
                          {Array.from({ length: 12 }, (_, index) => (
                            <option
                              key={index}
                              value={index}
                              className="bg-slate-800 text-slate-300"
                            >
                              {Month[index]}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full cursor-pointer rounded-lg border-2 border-slate-700 bg-slate-800/60 px-4 py-2.5 text-slate-300 transition-all placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 sm:w-auto"
                          value={lineMode.day}
                          onChange={(e) => {
                            const newDay = parseInt(e.target.value, 10);
                            setLineMode((prev) => ({ ...prev, day: newDay }));
                          }}
                        >
                          <option
                            value={0}
                            className="bg-slate-800 text-slate-300"
                          >
                            Ceo mesec
                          </option>
                          {Array.from({ length: daysInMonth }).map(
                            (_, index) => (
                              <option
                                key={index + 1}
                                value={index + 1}
                                className="bg-slate-800 text-slate-300"
                              >
                                {index + 1}. {Month[lineMode.month]}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="h-full w-full">
                      {!userStats?.statistics?.monthlyStats[lineMode.month] ||
                      userStats.statistics.monthlyStats[lineMode.month]
                        .totalBets <= 0 ? (
                        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-2xl bg-slate-900/50 p-6 text-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-16 w-16 text-slate-700"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                            />
                          </svg>
                          <h3 className="mt-4 text-xl font-semibold text-slate-400">
                            Nemate Opklada
                          </h3>
                          <p className="text-slate-500">
                            Nema unetih opklada za izabrani mesec.
                          </p>
                        </div>
                      ) : lineMode.day === 0 ? (
                        <div className="relative h-[350px] w-full md:h-[500px]">
                          <Line
                            data={chartData}
                            options={{
                              maintainAspectRatio: false,
                              responsive: true,
                            }}
                            className="min-h-[300px]"
                          />
                        </div>
                      ) : chartData.datasets[0].data.length > 0 &&
                        chartData.datasets[0].data.some((d) => d > 0) ? (
                        <div className="flex flex-col gap-6">
                          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                            <div className="h-[350px] xl:col-span-2">
                              <Bar
                                data={{
                                  labels: [""],
                                  datasets: [
                                    {
                                      label: "Dobitni",
                                      data: [dailyStats?.totalWins],
                                      backgroundColor: "rgba(34, 197, 94, 0.7)",
                                    },
                                    dailyStats?.totalActives > 0
                                      ? {
                                          label: "Aktivni",
                                          data: [dailyStats?.totalActives],
                                          backgroundColor:
                                            "rgba(107, 114, 128, 0.7)",
                                        }
                                      : null,
                                    {
                                      label: "Gubitni",
                                      data: [dailyStats?.totalLosses],
                                      backgroundColor: "rgba(239, 68, 68, 0.7)",
                                    },
                                  ].filter(Boolean),
                                }}
                                options={{
                                  scales: { y: { beginAtZero: true } },
                                  responsive: true,
                                  maintainAspectRatio: false,
                                }}
                                className="w-full h-80"
                              />
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-800/30 xl:col-span-3">
                              <table className="min-w-full table-auto text-sm">
                                <thead className="bg-slate-700/50">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-300">
                                      Statistika za {lineMode.day}.{" "}
                                      {Month[lineMode.month]}
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-300">
                                      Vrednost
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/60">
                                  <tr className="transition-colors hover:bg-slate-700/40">
                                    <td className="px-4 py-3 font-medium">
                                      Ukupno opklada
                                    </td>
                                    <td className="px-4 py-3">
                                      {userStats?.statistics?.monthlyStats[
                                        lineMode.month
                                      ]?.bets[lineMode.day]?.length || 0}
                                    </td>
                                  </tr>
                                  <tr className="transition-colors hover:bg-slate-700/40">
                                    <td className="px-4 py-3 font-medium">
                                      Dobitnih opklada
                                    </td>
                                    <td className="px-4 py-3 text-green-400">
                                      {dailyStats?.totalWins}
                                    </td>
                                  </tr>
                                  <tr className="transition-colors hover:bg-slate-700/40">
                                    <td className="px-4 py-3 font-medium">
                                      Gubitnih opklada
                                    </td>
                                    <td className="px-4 py-3 text-red-400">
                                      {dailyStats?.totalLosses}
                                    </td>
                                  </tr>
                                  <tr className="transition-colors hover:bg-slate-700/40">
                                    <td className="px-4 py-3 font-medium">
                                      Ostvaren profit
                                    </td>
                                    <td
                                      className={`px-4 py-3 font-semibold ${
                                        dailyStats?.profit <= 0
                                          ? "text-red-400"
                                          : "text-green-400"
                                      }`}
                                    >
                                      {Number(dailyStats?.profit || 0).toFixed(
                                        2
                                      )}{" "}
                                      {defaultCurrency}
                                    </td>
                                  </tr>
                                  <tr className="transition-colors hover:bg-slate-700/40">
                                    <td className="px-4 py-3 font-medium">
                                      Procenat prolaza
                                    </td>
                                    <td className="px-4 py-3">
                                      {Number(
                                        dailyStats?.winPercentage || 0
                                      ).toFixed(2)}
                                      %
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-800/30">
                            <button
                              onClick={() =>
                                setAreTodayBetsVisible(!areTodayBetsVisible)
                              }
                              className="flex w-full items-center justify-between bg-slate-700/50 p-4 text-left font-bold text-slate-200 transition-colors hover:bg-slate-700/80 focus:outline-none"
                            >
                              <span>Opklade ovog dana</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className={`h-5 w-5 transform transition-transform duration-300 ${
                                  areTodayBetsVisible ? "rotate-180" : ""
                                }`}
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                            <div
                              className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                                areTodayBetsVisible
                                  ? "grid-rows-[1fr]"
                                  : "grid-rows-[0fr]"
                              }`}
                            >
                              <div className="overflow-hidden">
                                <div className="max-h-[400px] overflow-y-auto p-4">
                                  <UserBets
                                    userStats={userStats?.statistics || {}}
                                    bets={getBets(
                                      lineMode.month,
                                      lineMode.day,
                                      null
                                    )}
                                    setBets={null}
                                    setUserStats={setUserStats}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-2xl bg-slate-900/50 p-6 text-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-16 w-16 text-slate-700"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12.75h-7.5"
                            />
                          </svg>
                          <h3 className="mt-4 text-xl font-semibold text-slate-400">
                            Nema Podataka
                          </h3>
                          <p className="text-slate-500">
                            Nema unetih opklada za izabrani dan.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="group relative flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-lg transition-all duration-300 hover:border-sky-500/30 sm:p-6">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                    <div className="relative z-10 flex flex-col space-y-6">
                      <div className="border-b border-slate-800 pb-4">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                          Statistike meseca
                        </h3>
                        <p
                          className={`mt-1 text-3xl font-bold ${
                            currentMonthStats?.monthlyProfit >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {currentMonthStats?.monthlyProfit >= 0 ? "+" : ""}
                          {currentMonthStats?.monthlyProfit?.toFixed(2) ||
                            "0.00"}{" "}
                          {defaultCurrency}
                        </p>
                      </div>

                      <div className="relative flex h-56 items-center justify-center sm:h-60">
                        <Doughnut data={doughMonthly} options={null} />
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-3xl font-bold text-sky-300">
                            {currentMonthStats?.totalBets
                              ? Math.round(
                                  (currentMonthStats.totalWins /
                                    currentMonthStats.totalBets) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                          <span className="text-sm font-medium text-slate-500">
                            Prolaz
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3 text-center">
                          <p className="text-2xl font-semibold text-sky-400">
                            {currentMonthStats?.totalBets || 0}
                          </p>
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Ukupno
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3 text-center">
                          <p className="text-2xl font-semibold text-slate-400">
                            {currentMonthStats?.totalBets -
                              currentMonthStats?.totalWins -
                              currentMonthStats?.totalLosses || 0}
                          </p>
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Aktivnih
                          </p>
                        </div>
                        <div className="rounded-lg border border-green-500/20 bg-green-900/30 p-3 text-center">
                          <p className="text-2xl font-semibold text-green-400">
                            {currentMonthStats?.totalWins || 0}
                          </p>
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Dobitnih
                          </p>
                        </div>
                        <div className="rounded-lg border border-red-500/20 bg-red-900/30 p-3 text-center">
                          <p className="text-2xl font-semibold text-red-400">
                            {currentMonthStats?.totalLosses || 0}
                          </p>
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Gubitnih
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex h-max w-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-lg">
                  <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/70 p-4 backdrop-blur-sm">
                    <h3 className="text-center text-base font-bold uppercase tracking-wider text-sky-400 sm:text-lg">
                      Poslednje Opklade
                    </h3>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    <UserBets
                      bets={getBets("", "", true)}
                      userStats={userStats?.statistics}
                      setUserStats={setUserStats}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        {userStats?.statistics?.initialInvestment && (
          <div className="fixed bottom-6 right-6 z-40 pointer-events-none">
            <div className="relative flex items-center">
              <button
                onClick={() =>
                  !betBuilder.visible &&
                  setBetBuilder((prev) => ({ ...prev, visible: true }))
                }
                className="group opacity-50 hover:opacity-100 pointer-events-auto flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 px-5 py-3 font-semibold text-white shadow-lg shadow-sky-900/40 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-sky-800/50 focus:outline-none focus:ring-4 focus:ring-sky-500/50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Dodaj Opkladu</span>
              </button>
            </div>
          </div>
        )}

        {betBuilder.visible && (
          <div className="z-50 fixed inset-0 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
            {/* Main container with advanced glass morphism */}
            <div className="w-full max-w-2xl">
              {/* Gradient border effect */}
              <div className="relative p-[1px] rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-transparent">
                {/* Main content */}
                <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl shadow-black/50 overflow-hidden relative">
                  {/* Animated glow effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  {/* Header with subtle underline animation */}
                  <div className="px-6 pt-6 pb-4 text-center relative">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(56,182,255,0.3)]">
                      Kreiraj opkladu
                    </h2>
                    <div className="mt-2 h-[2px] w-24 mx-auto bg-gradient-to-r from-transparent via-cyan-500/70 to-transparent"></div>
                  </div>

                  {/* Bet type selector - enhanced toggle */}
                  <div className="flex justify-center gap-2 mb-6 px-6">
                    <button
                      onClick={() =>
                        betBuilder.mode !== "single" &&
                        setBetBuilder((prev) => ({ ...prev, mode: "single" }))
                      }
                      className={`relative px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
                        betBuilder.mode === "single"
                          ? "text-white shadow-lg"
                          : "text-gray-400 hover:text-gray-300 bg-gray-800/50"
                      }`}
                    >
                      <span className="relative z-10">Singl</span>
                      {betBuilder.mode === "single" && (
                        <span className="absolute inset-0 bg-gradient-to-r from-green-600/90 to-emerald-600/90 rounded-full shadow-[0_0_12px_-2px_rgba(16,185,129,0.5)]"></span>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        betBuilder.mode !== "parlay" &&
                        setBetBuilder((prev) => ({ ...prev, mode: "parlay" }))
                      }
                      className={`relative px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
                        betBuilder.mode === "parlay"
                          ? "text-white shadow-lg"
                          : "text-gray-400 hover:text-gray-300 bg-gray-800/50"
                      }`}
                    >
                      <span className="relative z-10">Sistem</span>
                      {betBuilder.mode === "parlay" && (
                        <span className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 rounded-full shadow-[0_0_12px_-2px_rgba(59,130,246,0.5)]"></span>
                      )}
                    </button>
                  </div>

                  {/* Form container with perfect spacing */}
                  <div className="px-6 pb-6 space-y-5">
                    {/* Input fields with floating label effect */}
                    <div className="space-y-4">
                      {/* Match input */}
                      <div className="relative">
                        <input
                          onChange={(e) =>
                            setCurrentBet((prev) => ({
                              ...prev,
                              match: e.target.value,
                            }))
                          }
                          type="text"
                          className="peer w-full bg-gray-800/70 border border-gray-700/50 focus:border-cyan-500/50 text-white rounded-lg p-3.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder-transparent transition-all"
                          placeholder=" "
                        />
                        <label className="absolute left-3.5 top-2 text-gray-400 text-xs pointer-events-none transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:top-2 peer-focus:text-xs peer-focus:text-cyan-400">
                          Meč
                        </label>
                      </div>

                      {/* Tip input */}
                      <div className="relative">
                        <input
                          onChange={(e) =>
                            setCurrentBet((prev) => ({
                              ...prev,
                              tip: e.target.value,
                            }))
                          }
                          type="text"
                          className="peer w-full bg-gray-800/70 border border-gray-700/50 focus:border-cyan-500/50 text-white rounded-lg p-3.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder-transparent transition-all"
                          placeholder=" "
                        />
                        <label className="absolute left-3.5 top-2 text-gray-400 text-xs pointer-events-none transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:top-2 peer-focus:text-xs peer-focus:text-cyan-400">
                          Tip
                        </label>
                      </div>

                      {/* Odds input */}
                      <div className="relative">
                        <input
                          type="number"
                          onChange={(e) =>
                            setCurrentBet((prev) => ({
                              ...prev,
                              odds: e.target.value,
                            }))
                          }
                          className="peer w-full bg-gray-800/70 border border-gray-700/50 focus:border-cyan-500/50 text-white rounded-lg p-3.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder-transparent transition-all"
                          placeholder=" "
                          step="0.01"
                          min="1.01"
                        />
                        <label className="absolute left-3.5 top-2 text-gray-400 text-xs pointer-events-none transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:top-2 peer-focus:text-xs peer-focus:text-cyan-400">
                          Kvota
                        </label>
                      </div>

                      {/* Stake input (conditional) */}
                      {betBuilder.mode === "single" && (
                        <div className="relative">
                          <input
                            type="number"
                            onChange={(e) =>
                              setCurrentBet((prev) => ({
                                ...prev,
                                stake: e.target.value,
                              }))
                            }
                            className="peer w-full bg-gray-800/70 border border-gray-700/50 focus:border-cyan-500/50 text-white rounded-lg p-3.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder-transparent transition-all"
                            placeholder=" "
                          />
                          <label className="absolute left-3.5 top-2 text-gray-400 text-xs pointer-events-none transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:top-2 peer-focus:text-xs peer-focus:text-cyan-400">
                            Ulog
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Status selector for single bets - redesigned */}
                    {betBuilder.mode === "single" && (
                      <div className="pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <span className="text-sm text-gray-400">Status:</span>
                          <div className="flex gap-2 flex-wrap">
                            {["active", "win", "loss"].map((status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  setCurrentBet((prev) => ({ ...prev, status }))
                                }
                                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all flex items-center ${
                                  currentBet?.status === status
                                    ? status === "win"
                                      ? "bg-green-900/50 text-green-300 border border-green-600/50 shadow-[0_0_8px_-2px_rgba(5,150,105,0.3)]"
                                      : status === "loss"
                                      ? "bg-red-900/50 text-red-300 border border-red-600/50 shadow-[0_0_8px_-2px_rgba(220,38,38,0.3)]"
                                      : "bg-gray-800 text-cyan-300 border border-cyan-600/50 shadow-[0_0_8px_-2px_rgba(6,182,212,0.3)]"
                                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/70"
                                }`}
                              >
                                {status === "active" && (
                                  <span className="w-2 h-2 rounded-full bg-cyan-500 mr-1.5 animate-pulse"></span>
                                )}
                                {status === "active"
                                  ? "Aktivan"
                                  : status === "win"
                                  ? "Dobitan"
                                  : "Gubitan"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Parlay section - enhanced */}
                    {betBuilder.mode === "parlay" && parlay.length > 0 && (
                      <div className="space-y-4 pt-2">
                        {/* Parlay table - compact design */}
                        <div className="border border-gray-700/50 rounded-xl overflow-hidden">
                          <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-sm z-10">
                                <tr className="text-gray-300 text-left border-b border-gray-700/50">
                                  <th className="p-3 font-medium">Meč</th>
                                  <th className="p-3 font-medium">Tip</th>
                                  <th className="p-3 font-medium">Kvota</th>
                                  <th className="p-3 w-10">
                                    <button
                                      onClick={() => setParlay([])}
                                      className="text-red-400 hover:text-red-300 transition-colors flex items-center justify-end w-full"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700/50">
                                {parlay.map((bet, index) => (
                                  <tr
                                    key={index}
                                    className="hover:bg-gray-800/50 transition-colors"
                                  >
                                    <td className="p-3 text-gray-200">
                                      {bet.match}
                                    </td>
                                    <td className="p-3 text-gray-300">
                                      {bet.tip}
                                    </td>
                                    <td className="p-3 text-cyan-400 font-medium">
                                      {bet.odds}
                                    </td>
                                    <td className="p-3 text-right">
                                      <button
                                        onClick={() => removeParlayItem(index)}
                                        className="text-gray-500 hover:text-red-400 transition-colors"
                                      >
                                        <XMarkIcon className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Parlay summary - card style */}
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Ukupna kvota:</span>
                            <span className="text-xl font-bold text-cyan-400">
                              {parlay
                                .reduce((total, el) => total * el.odds, 1)
                                .toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Status:</span>
                            <div className="relative">
                              <select
                                onChange={(e) =>
                                  setParlayStatus(e.target.value)
                                }
                                className={`appearance-none bg-gray-900/70 pl-3 pr-8 py-1.5 rounded-lg font-medium ${
                                  parlayStatus === "win"
                                    ? "text-green-400"
                                    : parlayStatus === "loss"
                                    ? "text-red-400"
                                    : "text-cyan-400"
                                } border ${
                                  parlayStatus === "win"
                                    ? "border-green-600/50"
                                    : parlayStatus === "loss"
                                    ? "border-red-600/50"
                                    : "border-cyan-600/50"
                                }`}
                              >
                                <option
                                  value="active"
                                  className="bg-gray-800 text-cyan-400"
                                >
                                  Aktivan
                                </option>
                                <option
                                  value="win"
                                  className="bg-gray-800 text-green-400"
                                >
                                  Dobitan
                                </option>
                                <option
                                  value="loss"
                                  className="bg-gray-800 text-red-400"
                                >
                                  Gubitan
                                </option>
                              </select>
                              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-current pointer-events-none" />
                            </div>
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              onChange={(e) =>
                                setCurrentBet((prev) => ({
                                  ...prev,
                                  stake: e.target.value,
                                }))
                              }
                              className="w-full bg-gray-800/70 border border-gray-700/50 focus:border-cyan-500/50 text-white rounded-lg p-3.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder-transparent transition-all"
                              placeholder=" "
                            />
                            <label className="absolute left-3.5 top-2 text-gray-400 text-xs pointer-events-none transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:top-2 peer-focus:text-xs peer-focus:text-cyan-400">
                              Ukupan ulog
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons - perfectly spaced */}
                  <div className="px-6 pb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {betBuilder.mode === "single" ? (
                        <button
                          onClick={saveCurrentBet}
                          className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                          Kreiraj opkladu
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => addToParlay()}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <PlusCircleIcon className="w-5 h-5" />
                            Dodaj u sistem
                          </button>
                          {parlay.length > 0 && (
                            <button
                              onClick={saveCurrentBet}
                              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                              Kreiraj sistem
                            </button>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => {
                          setCurrentBet(null);
                          setBetBuilder((prev) => ({
                            ...prev,
                            visible: false,
                          }));
                        }}
                        className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <XCircleIcon className="w-5 h-5" />
                        Otkaži
                      </button>
                    </div>
                  </div>

                  {/* Status message - animated */}
                  {betBuilder.status && (
                    <div
                      className={`px-6 pb-6 animate-fade-in ${
                        betBuilder.status.startsWith("V")
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-lg border ${
                          betBuilder.status.startsWith("V")
                            ? "bg-green-900/20 border-green-600/30"
                            : "bg-red-900/20 border-red-600/30"
                        } text-center`}
                      >
                        {betBuilder.status}
                      </div>
                    </div>
                  )}
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
