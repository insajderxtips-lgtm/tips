import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SoccerLineUp from "react-soccer-lineup";
import { RootState } from "../../../redux/store";
import PremiumFallback from "../PremiumFallback";

interface RenderTipsProps {
  tier: "free" | "premium";
}

interface Tip {
  tip: string;
  type: string;
  tipTitle: string;
  analysis: string;
  date: String;
}

const RenderTips: React.FC<RenderTipsProps> = ({ tier }) => {
  // State management
  const currentUser = useSelector((state: RootState) => state.user);
  const [tips, setTips] = useState<Tip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const JWT = localStorage.getItem("insajder_token");
  const [currentGameStats, setCurrentGameStats] = useState({
    formations: {
      home: {
        squad: {},
        formation: null,
        missingPlayers: [],
      },
      away: {
        squad: {},
        formation: null,
        missingPlayers: [],
      },
    },
  });
  const [currentTab, setCurrentTab] = useState(null);
  useEffect(() => {
    document.title = "InsajderTips | Tipovi";
    const fetchTips = async () => {
      if (!JWT) {
        setError("Doslo je do greske. Molimo da se relogujete.");
        return;
      }

      setLoading(true);

      try {
        // Fetches the tips free or premium, dynamically, server checks JWT to make sure the user has that role.
        const response = await fetch(`http://localhost:1337/tips/${tier}/2`, {
          headers: {
            Authorization: `Bearer ${JWT}`,
          },
        });

        if (!response.ok && response.status === 403) {
          setError("Nemate pristup Premium tipovima.");
          return;
        }

        const json = await response.json();
        setTips(json);

        setError(null);
      } catch (error) {
        setError("Došlo je do greške prilikom učitavanja podataka.");
      } finally {
        setLoading(false);
      }
    };

    // On initial render, fetch the tips.
    fetchTips();
  }, [tier]);
  const setCurrentTabState = (index) => {
    setCurrentTab((prev) => {
      if (index === prev) {
        return null;
      }
      return index;
    });
  };

  const setCurrentGameState = (game: any) => {
    // Define the URLs for pregame-form and lineups
    const pregameFormUrl = `https://www.sofascore.com/api/v1/event/${game.gameId}/pregame-form`;
    const lineupsUrl = `https://www.sofascore.com/api/v1/event/${game.gameId}/lineups`;
    const gameDataUrl = `https://www.sofascore.com/api/v1/event/${game.gameId}`;
    const headToHeadUrl = game.headToHeadAPI;

    // Fetch both URLs in parallel using Promise.all
    Promise.all([
      fetch(pregameFormUrl),
      fetch(lineupsUrl),
      fetch(gameDataUrl),
      fetch(headToHeadUrl, {
        method: "GET",
      }),
    ])
      .then(([pregameFormRes, lineupsRes, gameDataRes, headtoHeadRes]) => {
        // Check if both responses are successful
        if (
          !pregameFormRes.ok ||
          !lineupsRes.ok ||
          !gameDataRes ||
          !headtoHeadRes
        ) {
          throw new Error("One or both fetch requests failed.");
        }

        // Parse both responses as JSON
        return Promise.all([
          pregameFormRes.json(),
          lineupsRes.json(),
          gameDataRes.json(),
          headtoHeadRes.json(),
        ]);
      })
      .then(
        async ([
          pregameFormJson,
          lineupsJson,
          gameDataJson,
          headToHeadJson,
        ]) => {
          // Handle the pregameForm response here
          // For example, you can set it directly to the state or use it in some other way
          // Then process the lineups and pregameForm data

          setCurrentGameStats((prev: any) => ({
            formations: {
              ...prev,
              home: {
                squad: {
                  gk: {
                    name:
                      lineupsJson?.home?.players?.[0]?.player?.name
                        .split(" ")
                        .map((part, index) =>
                          index === 0 ? part.charAt(0) + "." : part
                        )
                        .join(" ") || "Unknown",
                    number: lineupsJson?.home?.players?.[0]?.shirtNumber || 0,
                  },
                  df: lineupsJson?.home?.players
                    .filter(
                      (player) => player.position === "D" && !player.substitute
                    )
                    .map((player) => ({
                      name: player.player.name
                        .split(" ")
                        .map((part, index) =>
                          index === 0 ? part.charAt(0) + "." : part
                        )
                        .join(" "),
                      number: player.shirtNumber,
                    })),
                  cdm: lineupsJson?.home?.players
                    .filter(
                      (player) => player.position === "M" && !player.substitute
                    )
                    .map((player, index) =>
                      index < 2
                        ? {
                            name: player.player.name
                              .split(" ")
                              .map((part, index) =>
                                index === 0 ? part.charAt(0) + "." : part
                              )
                              .join(" "),
                            number: player.shirtNumber,
                          }
                        : null
                    )
                    .filter((player) => player !== null),
                  cam: lineupsJson?.home?.players
                    .filter(
                      (player) => player.position === "M" && !player.substitute
                    )
                    .map((player, index) =>
                      index === 2
                        ? {
                            name: player.player.name
                              .split(" ")
                              .map((part, index) =>
                                index === 0 ? part.charAt(0) + "." : part
                              )
                              .join(" "),
                            number: player.shirtNumber,
                          }
                        : null
                    )
                    .filter((player) => player !== null),
                  fw: lineupsJson?.home?.players
                    .filter(
                      (player) => player.position === "F" && !player.substitute
                    )
                    .map((player) => ({
                      name: player.player.name
                        .split(" ")
                        .map((part, index) =>
                          index === 0 ? part.charAt(0) + "." : part
                        )
                        .join(" "),
                      number: player.shirtNumber,
                    })),
                },
                missingPlayers: lineupsJson?.home?.missingPlayers || [],
                formation: lineupsJson?.home?.formation || "Unknown",
              },
              away: {
                squad: {
                  gk: {
                    name:
                      lineupsJson?.away?.players?.[0]?.player?.name
                        .split(" ")
                        .map((part, index) =>
                          index === 0 ? part.charAt(0) + "." : part
                        )
                        .join(" ") || "Unknown",
                    number: lineupsJson?.away?.players?.[0]?.shirtNumber || 0,
                  },
                  df: lineupsJson?.away?.players
                    .filter(
                      (player) => player.position === "D" && !player.substitute
                    )
                    .map((player) => ({
                      name: player.player.name
                        .split(" ")
                        .map((part, index) =>
                          index === 0 ? part.charAt(0) + "." : part
                        )
                        .join(" "),
                      number: player.shirtNumber,
                    })),
                  cdm: lineupsJson?.away?.players
                    .filter(
                      (player) => player.position === "M" && !player.substitute
                    )
                    .map((player, index) =>
                      index < 2
                        ? {
                            name: player.player.name
                              .split(" ")
                              .map((part, index) =>
                                index === 0 ? part.charAt(0) + "." : part
                              )
                              .join(" "),
                            number: player.shirtNumber,
                          }
                        : null
                    )
                    .filter((player) => player !== null),
                  cam: lineupsJson?.away?.players
                    .filter(
                      (player) => player.position === "M" && !player.substitute
                    )
                    .map((player, index) =>
                      index === 2
                        ? {
                            name: player.player.name
                              .split(" ")
                              .map((part, index) =>
                                index === 0 ? part.charAt(0) + "." : part
                              )
                              .join(" "),
                            number: player.shirtNumber,
                          }
                        : null
                    )
                    .filter((player) => player !== null),
                  fw: lineupsJson?.away?.players
                    .filter(
                      (player) => player.position === "F" && !player.substitute
                    )
                    .map((player) => ({
                      name: player.player.name
                        .split(" ")
                        .map((part, index) =>
                          index === 0 ? part.charAt(0) + "." : part
                        )
                        .join(" "),
                      number: player.shirtNumber,
                    })),
                },
                missingPlayers: lineupsJson?.away?.missingPlayers || [],
                formation: lineupsJson?.away?.formation || "Unknown",
              },
              analysis: {
                analysis: game.analysis,
                date: game.date,
                tip: game.tip,
                title: game.tipTitle,
                shortAnalysis: game.shortAnalysis,
                bestOdds: game.bestOdds,
              },
            },
            pregameForm: pregameFormJson, // {homeTeam.avgRating, homeTeam.form = array 0 l 1 w 2 w 3 l etc}
            matchData: gameDataJson.event, // {event: awayTeam.name, startTimestamp, venue, etc}
            headToHead: headToHeadJson.events.slice(0, 10),
          }));
        }
      )
      .catch((err) => console.error("Error fetching data:", err));
  };
  const gameStats = currentGameStats?.formations?.analysis;
  useEffect(() => {
    console.log(currentGameStats.headToHead);
  }, [currentGameStats]);
  if (currentUser.tier === "free" && tier === "premium") {
    return (
      <>
        <PremiumFallback />
      </>
    );
  }
  if (!currentUser.isAuthenticated) {
    return <div>NoAuth</div>;
  } else {
    return (
      <div className="bg-gray-950 shadow-xl p-6 w-full min-h-screen flex  py-10 h-max">
        {loading ? (
          <div className="text-xl text-gray-300">Učitavanje...</div>
        ) : tips.length === 0 ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-40">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-red-900/50 rounded-xl p-8 shadow-2xl shadow-red-950/50 max-w-md mx-4 text-center animate-pulse-slow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-red-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-600 mb-2">
                Nema dostupnih tipova
              </h3>
              <p className="text-gray-400 mb-4">
                Trenutno nema aktivnih tipova. Proverite kasnije ili pogledajte
                arhivu.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-max flex  flex-col xl:flex-row justify-center">
            <div className="w-full max-w-4xl   p-2 ">
              {Object.keys(currentGameStats.formations.home.squad).length >
              0 ? (
                <div>
                  <>
                    <div className="flex w-full gap-4">
                      {/* Home Team */}
                      <div className="mb-2 w-1/2 bg-gradient-to-br from-blue-900/40 to-gray-800/80 rounded-2xl p-4 shadow-lg shadow-blue-950/50 flex flex-col md:flex-row justify-between items-center border border-blue-800/30 hover:border-blue-500/50 transition-all duration-300">
                        <div className="text-xl font-bold text-white mb-2 md:mb-0 text-center md:text-left">
                          {currentGameStats.matchData.homeTeam.name}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            {currentGameStats?.pregameForm?.homeTeam?.form.map(
                              (form, index) => (
                                <div
                                  key={index}
                                  className={`w-8 h-8 flex items-center justify-center rounded-md font-bold ${
                                    form === "W"
                                      ? "bg-green-600/80 text-green-100"
                                      : form === "D"
                                      ? "bg-yellow-600/80 text-yellow-100"
                                      : "bg-red-600/80 text-red-100"
                                  }`}
                                >
                                  {form}
                                </div>
                              )
                            )}
                          </div>

                          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold shadow-md shadow-amber-900/30">
                            {currentGameStats?.pregameForm?.homeTeam?.avgRating}
                          </div>
                        </div>
                      </div>

                      {/* Away Team */}
                      <div className="mb-2 w-1/2 bg-gradient-to-br from-blue-900/40 to-gray-800/80 rounded-2xl p-4 shadow-lg shadow-blue-950/50 flex flex-col md:flex-row justify-between items-center border border-blue-800/30 hover:border-blue-500/50 transition-all duration-300">
                        <div className="text-xl font-bold text-white mb-2 md:mb-0 text-center md:text-left">
                          {currentGameStats.matchData.awayTeam.name}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            {currentGameStats?.pregameForm?.awayTeam?.form.map(
                              (form, index) => (
                                <div
                                  key={index}
                                  className={`w-8 h-8 flex items-center justify-center rounded-md font-bold ${
                                    form === "W"
                                      ? "bg-green-600/80 text-green-100"
                                      : form === "D"
                                      ? "bg-yellow-600/80 text-yellow-100"
                                      : "bg-red-600/80 text-red-100"
                                  }`}
                                >
                                  {form}
                                </div>
                              )
                            )}
                          </div>

                          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold shadow-md shadow-amber-900/30">
                            {currentGameStats?.pregameForm?.awayTeam?.avgRating}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>

                  <SoccerLineUp
                    homeTeam={currentGameStats.formations.home}
                    awayTeam={currentGameStats.formations.away}
                    size="responsive"
                    pattern="lines"
                    color="green"
                  />
                  <div className="bg-gray-900 w-full flex flex-col main-font">
                    <div className="text-center flex-col p-4 w-full bg-gray-800 flex justify-center gap-x-4 cursor-pointer select-none">
                      <div
                        className="flex justify-between items-center p-4 w-full cursor-pointer transition-all duration-300 
    hover:bg-purple-900/20 rounded-lg group"
                        onClick={() => setCurrentTabState(0)}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) =>
                          e.key === "Enter" && setCurrentTabState(0)
                        }
                      >
                        <span className="text-lg font-medium text-purple-100 group-hover:text-white">
                          Povrede i suspenzije
                        </span>

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className={`size-6 transition-transform duration-300 ease-in-out ${
                            currentTab === 0
                              ? "text-purple-400 rotate-180"
                              : "text-purple-300"
                          }`}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </div>
                      <div
                        className={`flex justify-around  p-2 gap-2 ${
                          currentTab === 0 ? "flex" : "hidden"
                        }`}
                      >
                        <div className=" mb-2 gap-2  w-1/2 h-max">
                          {currentGameStats?.formations?.home?.missingPlayers.map(
                            (missingPlayer: any) => {
                              return (
                                <div className="flex bg-gray-700 items-center gap-1 mb-2 justify-center  rounded-lg p-4 w-full">
                                  <div className="flex flex-col">
                                    <span>{missingPlayer.player.name}</span>
                                    <span
                                      className={`${
                                        missingPlayer.type === "missing"
                                          ? "text-red-500"
                                          : "text-yellow-500"
                                      }`}
                                    >
                                      {missingPlayer.type === "missing"
                                        ? "Ne igra."
                                        : "Možda ne igra."}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                        <div className=" w-1/2 h-max">
                          {currentGameStats?.formations?.away?.missingPlayers.map(
                            (missingPlayer: any) => {
                              return (
                                <div className="flex items-center gap-1 mb-2 bg-gray-700 rounded-lg p-4 w-full justify-center">
                                  <div className="flex flex-col">
                                    <span>{missingPlayer.player.name}</span>
                                    <span
                                      className={`${
                                        missingPlayer.type === "missing"
                                          ? "text-red-500"
                                          : "text-yellow-500"
                                      }`}
                                    >
                                      {missingPlayer.type === "missing"
                                        ? "Ne igra."
                                        : "Možda ne igra."}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-center p-4 w-full bg-gray-800 flex flex-col justify-center gap-x-4 cursor-pointer select-none border-t border-gray-700">
                      <div
                        className="flex justify-between items-center p-4 w-full cursor-pointer transition-all duration-300 
    hover:bg-purple-900/20 rounded-lg group"
                        onClick={() => setCurrentTabState(1)}
                      >
                        <span className="text-lg font-medium text-purple-100 group-hover:text-white">
                          Medjusobni mecevi
                        </span>

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className={`size-6 transition-transform duration-300 ease-in-out ${
                            currentTab === 1
                              ? "text-purple-400 rotate-180"
                              : "text-purple-300"
                          }`}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </div>

                      <div
                        className={`flex-col gap-y-2 ${
                          currentTab === 1 ? "flex" : "hidden"
                        }`}
                      >
                        {currentGameStats?.headToHead?.map((match) => {
                          const date = new Date(
                            match.startTimestamp * 1000
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          });

                          const homeScore = match.homeScore?.current;
                          const awayScore = match.awayScore?.current;

                          const isHomeWinner =
                            homeScore != null &&
                            awayScore != null &&
                            homeScore > awayScore;
                          const isAwayWinner =
                            homeScore != null &&
                            awayScore != null &&
                            awayScore > homeScore;

                          return (
                            <div
                              key={match.id}
                              className="flex flex-col md:flex-row justify-between items-center bg-gray-800 rounded-xl px-4 py-2 text-white shadow-md"
                            >
                              {/* Date */}
                              <div className="text-sm text-gray-400 w-full md:w-1/5 text-center md:text-left">
                                {date}
                              </div>

                              {/* Match Info */}
                              <div className="flex items-center justify-center gap-3 w-full md:w-4/5">
                                {/* Home Team */}
                                <div
                                  className={`font-semibold ${
                                    isHomeWinner ? "text-green-400" : ""
                                  }`}
                                >
                                  {match.homeTeam.name}
                                </div>

                                {/* Score */}
                                <div className="text-sm text-gray-300 min-w-[40px] text-center">
                                  {homeScore != null && awayScore != null
                                    ? `${homeScore} : ${awayScore}`
                                    : "vs"}
                                </div>

                                {/* Away Team */}
                                <div
                                  className={`font-semibold ${
                                    isAwayWinner ? "text-green-400" : ""
                                  }`}
                                >
                                  {match.awayTeam.name}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-center p-4 w-full bg-gray-800 flex justify-center relative gap-x-4 cursor-pointer select-none border-t border-gray-700 flex-col">
                      <div
                        className="flex justify-between items-center p-4 w-full cursor-pointer transition-all duration-300 
    hover:bg-purple-900/20 rounded-lg group"
                        onClick={() => setCurrentTabState(2)}
                      >
                        {" "}
                        <span className="text-lg font-medium text-purple-100 group-hover:text-white">
                          Analiza i najbolja kvota
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className={`size-6 transition-transform duration-300 ease-in-out ${
                            currentTab === 2
                              ? "text-purple-400 rotate-180"
                              : "text-purple-300"
                          }`}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </div>

                      <div
                        className={`my-6 flex flex-col bg-gray-900 rounded-md p-4 shadow-gray-500 shadow-md ${
                          currentTab === 2 ? "flex" : "hidden"
                        }`}
                      >
                        <span> {gameStats.analysis}</span>

                        <span className="my-2 flex flex-col">
                          Najbolju kvotu za ovaj tip ima{" "}
                          <span
                            className="bg-cyan-800/50 p-2 rounded-md relative"
                            onClick={() =>
                              window.open(gameStats?.bestOdds?.link, "_blank")
                            }
                          >
                            {gameStats?.bestOdds?.store}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="size-6 absolute -right-2 -top-2 -rotate-90"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59"
                              />
                            </svg>
                          </span>
                        </span>

                        <div className=" w-max absolute right-2 bottom-2 ">
                          Mi tipujemo: {gameStats.tip}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2 max-h-[600px] overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700/50 rounded-xl shadow-inner shadow-blue-900/20">
                  {tips.map((tip, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentGameState(tip)}
                      className="relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700/40 hover:border-blue-400/30 p-5 rounded-xl cursor-pointer transition-all duration-300  shadow-lg hover:shadow-xl shadow-black/20 group"
                    >
                      {/* Type Badge */}
                      <div
                        className={`inline-flex items-center gap-2 mb-4 ${
                          tip.type === "free"
                            ? "text-blue-400 bg-blue-900/20"
                            : "text-orange-300 bg-orange-900/20"
                        } px-3 py-1 rounded-full text-sm font-bold`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        {tip.type} tip
                      </div>

                      {/* Title */}
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-cyan-300 transition-all">
                        {tip.tipTitle}
                      </h2>

                      {/* Main Tip */}
                      <div className="mt-4 p-3 bg-gray-700/20 rounded-lg border border-gray-700/30 group-hover:border-blue-400/20">
                        <span className="text-sm font-semibold text-gray-400">
                          Mi tipujemo:
                        </span>
                        <span className="ml-2 text-xl font-black bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                          {tip.tip}
                        </span>
                      </div>

                      {/* Analysis */}
                      <div className="mt-4 text-gray-300 italic relative pl-4 border-l-4 border-gray-700/50 group-hover:border-cyan-400/50 transition-colors">
                        <div className="absolute top-0 left-0 text-2xl opacity-20">
                          “
                        </div>
                        <span className="font-medium text-gray-400 not-italic">
                          Analiza ukratko:
                        </span>{" "}
                        {tip.shortAnalysis}
                      </div>

                      {/* Date */}
                      <div className="absolute top-3 right-3 text-sm text-gray-500 group-hover:text-cyan-400 transition-colors font-mono">
                        {tip.date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
};

export default RenderTips;
