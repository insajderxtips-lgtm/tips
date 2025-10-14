import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import stats from "../assets/stats.png";
import { RootState } from "../redux/store";
import Chatbox from "./loggedUser/Chatbox";
import TipsHistory from "./TipsHistory";

export default function Homepage(): React.ReactNode {
  const isLoggedIn = useSelector(
    (state: RootState) => state.user.isAuthenticated
  );
  const nav = useNavigate();
  if (isLoggedIn) {
    return (
      <div className="flex flex-col w-full h-full">
        <Chatbox />
        <TipsHistory />
      </div>
    );
  } else {
    return (
      <div className="h-max w-full flex flex-col absolute top-0 left overflow-x-hidden">
        <div className="min-h-screen min-w-full pt-22 flex flex-col min-[880px]:flex-row items-center justify-center xl:justify-between  overflow-x-hidden">
          {/* Text Content (Left Side) - Enhanced Slide-in */}
          <div
            className="flex flex-col  raceFont text-xl p-6 rounded-lg shadow-lg max-w-[600px] w-full text-center text-white lg:ml-12 
    starting:opacity-0 starting:-translate-x-[100vw] md:starting:-translate-x-[40vw] 
    when:animate-in when:fade-in when:slide-in-from-left 
    transition-all duration-300 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] delay-100"
          >
            <span className="font-bold text-xl md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-300">
              Pobedjuj više,
            </span>

            <span className="font-bold text-xl md:text-4xl mt-2">
              kladi se{" "}
              <span className="text-blue-400 animate-[text-glow_3s_ease-in-out_infinite]">
                pametnije
              </span>
              .
            </span>

            <p className="text-sm font-main tracking-wide mt-6 leading-6 opacity-90">
              Premium tipovi, detaljne analize, praćenje i statistike opklada,
              arbitražno klađenje, pronalazač najboljih kvota —{" "}
              <span className="font-bold text-blue-400 underline underline-offset-4 decoration-2">
                sve na jednom mestu!
              </span>
            </p>

            <button
              onClick={() => nav("/onama")}
              className="mt-6 relative bg-gradient-to-r from-blue-600 to-blue-800 rounded-full px-2 py-2 md: px-4 md:py-6 cursor-pointer text-lg font-medium text-white overflow-hidden 
      transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-900/40
      ring-2 ring-blue-500/50 ring-offset-2 ring-offset-transparent"
            >
              SAZNAJ VIŠE
              <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
            </button>
          </div>

          {/* Image Content (Right Side) - Enhanced 3D Effect */}
          <div
            className="relative p-12 xl:mr-12 
    starting:opacity-0 starting:translate-x-[100vw] md:starting:translate-x-[60vw] 
    when:animate-in when:fade-in when:slide-in-from-right 
    transition-all duration-500 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] delay-200"
          >
            <div className="relative md:p-12 xl:mr-24">
              <div className="relative perspective-1000">
                <img
                  src={stats}
                  className="max-w-full h-auto object-cover lg:max-w-[500px] xl:max-w-[800px] rounded-xl shadow-2xl shadow-blue-950/70 relative z-10 
            transform-style-preserve-3d hover:rotate-y-6 hover:translate-z-20 transition-transform duration-500"
                  alt="Betting Tips Preview"
                  style={{
                    boxShadow: "0px 40px 60px -15px rgba(59, 130, 246, 0.5)",
                    transform: "rotateY(-5deg) rotateX(2deg)",
                  }}
                />
                {/* Glow effect */}
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-xl z-0 -translate-z-10"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="py-12 w-full bg-[radial-gradient(ellipse_at_top,_rgba(0,0,80,0.3)_5%,_rgba(2,3,27,1)_30%)] px-4 ">
          {/* Hero Section */}
          <div className="max-w-6xl mx-auto text-center mb-16 relative pt-12">
            <div className="absolute -top-10 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2"></div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 px-4 transition-transform duration-1000">
              <span className="bg-gradient-to-r from-blue-400 to-purple-300 bg-clip-text text-transparent">
                Premium Tipovi
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Detaljne studije utakmica sa statistikom, sastavima, povredama i
              premium analizama.
            </p>
          </div>

          {/* Feature Showcase - Now single column on mobile */}
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 px-4">
            {/* Left Column - Full width on mobile */}
            <div className="w-full lg:w-1/2 space-y-8">
              {/* Analysis Feature */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Kompletna analiza
                  </h3>
                  <p className="text-gray-300">
                    Svaka utakmica je detaljno analizirana, na Vama je samo da
                    postavite opkladu.
                  </p>
                </div>
              </div>

              {/* Lineups Feature */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Sastavi i povrede
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Precizne informacije o očekivanim sastavima i ključnim
                    odsustvima:
                  </p>
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium text-red-400">
                          Odsutni (Liverpool):
                        </p>
                        <p className="text-gray-400">
                          Salah • Van Dijk • Alisson
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-red-400">
                          Odsutni (Man City):
                        </p>
                        <p className="text-gray-400">De Bruyne • Grealish</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Feature */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Forma i trendovi
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Grafički prikaz forme timova poslednjih utakmica:
                  </p>
                  <div className="flex gap-2">
                    {["W", "W", "D", "L", "W"].map((result, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          result === "W"
                            ? "bg-green-500/20 text-green-400"
                            : result === "D"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tipster Analysis */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Analiza tipsera
                  </h3>
                  <p className="text-gray-300">
                    Kao najvaznija stvar, dobijate tip kao i licnu analizu naseg
                    tipsera.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Full width on mobile, appears after left content */}
            <div className="w-full lg:w-1/2  lg:mt-0">
              <div className="bg-gray-900 border border-blue-500/30 rounded-xl overflow-hidden shadow-2xl shadow-blue-500/20">
                <div className="bg-gradient-to-r from-blue-900/50 to-blue-900/20 p-4 border-b border-blue-500/20">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="text-sm font-medium text-blue-400">
                      PREMIUM TIP • FUDBAL
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2">
                    Liverpool vs Manchester City
                  </h3>
                  <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-300 mt-1 gap-1">
                    <span>Premier League • 21.09.2025</span>
                    <span>17:30</span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Recommended Bet */}
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                      <span className="font-medium text-white">TIP:</span>
                    </div>
                    <div className="text-lg font-bold text-center py-2 bg-gray-900 rounded">
                      Manchester City X @ 3.90
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Najvisu kvotu ima MozzartBet. [LINK]
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">
                      KLJUČNA ANALIZA:
                    </h4>
                    {/* Added `select-none` to prevent copying */}
                    <ul className="space-y-3 text-gray-300 blur-sm select-none">
                      {/* Text has been replaced with generic placeholders */}
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Sed do eiusmod tempor incididunt ut labore et dolore
                        magna.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Ut enim ad minim veniam, quis nostrud exercitation
                        ullamco.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Duis aute irure dolor in reprehenderit in voluptate
                        velit esse.
                      </li>
                    </ul>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                      <div className="text-xs text-gray-400">
                        XG (poslednjih 5)
                      </div>
                      <div className="font-bold text-white">2.1 - 1.4</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                      <div className="text-xs text-gray-400">
                        Procenat posedanja
                      </div>
                      <div className="font-bold text-white">48% - 52%</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                      <div className="text-xs text-gray-400">Šutevi/okvir</div>
                      <div className="font-bold text-white">14.2 - 16.8</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                      <div className="text-xs text-gray-400">Ocena tima</div>
                      <div className="font-bold text-white">82 - 88</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/80 border-t border-gray-800 p-4 text-center">
                  <button
                    className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm transition-all w-full sm:w-auto"
                    onClick={() => nav("/login")}
                  >
                    POSTANI CLAN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full bg-[radial-gradient(ellipse_at_center,rgba(36,33,80,0.3)_0%,rgba(2,3,27,1)_70%)] py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <section className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 pt-8 mb-24">
              <div className="lg:w-1/2 space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight text-center lg:text-left">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-300 bg-clip-text text-transparent">
                    Pratite napredne statistike
                  </span>
                  <br />
                  <span className="text-blue-400">vaših opklada</span>
                </h2>
                <p className="text-xl text-gray-300 text-center lg:text-left max-w-lg mx-auto lg:mx-0">
                  Sve što vam treba na jednom mestu za pametnije klađenje
                </p>

                {/* Mobile Image */}
                <div className="lg:hidden mt-10 max-w-md mx-auto">
                  <img
                    src={stats}
                    alt="Statistics Dashboard Preview"
                    className="rounded-xl border border-blue-500/30 shadow-lg w-full"
                  />
                </div>
              </div>

              {/* Desktop Image */}
              <div className="hidden lg:block lg:w-1/2">
                <img
                  src={stats}
                  alt="Statistics Dashboard Preview"
                  className="rounded-xl border border-blue-500/30 shadow-lg w-full max-w-2xl"
                />
              </div>
            </section>

            {/* Features Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm h-full">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 text-center">
                  Evidentirajte opklade
                </h3>
                <p className="text-gray-300 text-center">
                  Jednostavno unesite svoje opklade sa svim parametrima i biće
                  trajno sačuvane.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm h-full">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 text-center">
                  Analizirajte rezultate
                </h3>
                <p className="text-gray-300 text-center">
                  Detaljna statistika i grafikoni vam pomažu da identifikujete
                  jake i slabe tačke.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm h-full">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 text-center">
                  Istorija klađenja
                </h3>
                <p className="text-gray-300 text-center">
                  Sortirajte vaše opklade po godini, mesecu, danu.
                </p>
              </div>
            </section>
          </div>
        </div>
        <div className="w-full bg-[radial-gradient(ellipse_at_top,_rgba(36,33,80,0.3)_0%,_rgba(2,3,27,1)_70%)] py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <section className="text-center mb-16 relative">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl -z-10"></div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-purple-300 bg-clip-text text-transparent">
                  Pronalazač Najboljih Kvota
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Automatski skenirajte desetine kladionica i pronađite
                najpovoljnije kvote za vaše opklade u realnom vremenu.
              </p>
            </section>

            {/* Feature Showcase */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
              {/* Left Column - Features */}
              <div className="space-y-8">
                {/* Feature 1 */}
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Instant pretraga
                    </h3>
                    <p className="text-gray-300">
                      Naš sistem automatski proverava kvote u svim većim
                      kladionicama i prikazuje vam najpovoljniju opciju za vašu
                      opkladu.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Optimalni tiketi
                    </h3>
                    <p className="text-gray-300">
                      Sastavite tiket na našem sajtu i mi ćemo vam automatski
                      prikazati
                      <span className="font-bold text-blue-300">
                        {" "}
                        najveću dostupnu kvotu
                      </span>{" "}
                      za ceo tiket kombinujući najbolje opcije iz svih
                      kladionica.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-cyan-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Povećajte profit
                    </h3>
                    <p className="text-gray-300">
                      Ne donirajte novac kladionicama - kombinovanjem najboljih
                      kvota možete{" "}
                      <span className="font-bold text-green-400">
                        povećati dobit i do 30%
                      </span>{" "}
                      na istim opkladama.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Demo */}
              <div className="relative">
                <div className="border border-blue-500/30 rounded-xl overflow-hidden bg-gray-800/80 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm font-medium text-blue-400">
                      Fudbal • Premier Liga
                    </div>
                    <div className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded">
                      NAJBOLJE KOMBINACIJE
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Match 1 */}
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 gap-2 flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium text-white">
                          Man City vs Arsenal GG3+
                        </div>
                        <div className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                          Soccerbet @1.85
                        </div>
                      </div>
                    </div>

                    {/* Match 2 */}
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 flex flex-col gap-2">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium text-white">
                          Bayern vs Dortmund X-1
                        </div>
                        <div className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded">
                          Mozzart @4.00
                        </div>
                      </div>
                    </div>

                    {/* Match 3 */}
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 flex flex-col gap-2">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium text-white">
                          PSG vs Lyon - PSG -1.5
                        </div>
                        <div className="text-xs bg-amber-900/30 text-amber-400 px-2 py-1 rounded">
                          Meridian @2.10
                        </div>
                      </div>
                    </div>

                    {/* Ticket summary */}
                    <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-4 rounded-lg border border-blue-500/30 mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-300">Ukupna kvota:</span>
                        <span className="text-xl font-bold text-white">
                          15.54
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Uloženo:</span>
                        <span className="text-gray-300">1,000 RSD</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Moguća dobit:</span>
                        <span className="text-green-400 font-medium">
                          15,540 RSD
                        </span>
                      </div>
                    </div>

                    {/* Bookmakers comparison */}
                    <div className="mt-4 border-t border-gray-700 pt-4">
                      <div className="text-sm text-cyan-400 mb-2 text-center">
                        Ukupne kvote po kladionicama:
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-1 rounded text-center bg-green-900/40 text-green-300">
                          <div className="font-mono text-sm">15.54</div>
                          <div className="text-[0.6rem] opacity-80">
                            Mozzart
                          </div>
                        </div>
                        <div className="p-1 rounded text-center bg-gray-900/20 text-gray-400">
                          <div className="font-mono text-sm">14.25</div>
                          <div className="text-[0.6rem] opacity-80">
                            Soccerbet
                          </div>
                        </div>
                        <div className="p-1 rounded text-center bg-gray-900/20 text-gray-400">
                          <div className="font-mono text-sm">13.86</div>
                          <div className="text-[0.6rem] opacity-80">
                            Meridian
                          </div>
                        </div>
                        <div className="p-1 rounded text-center bg-gray-900/20 text-gray-400">
                          <div className="font-mono text-sm">14.91</div>
                          <div className="text-[0.6rem] opacity-80">Merkur</div>
                        </div>
                        <div className="p-1 rounded text-center bg-gray-900/20 text-gray-400">
                          <div className="font-mono text-sm">14.03</div>
                          <div className="text-[0.6rem] opacity-80">
                            Superbet
                          </div>
                        </div>
                        <div className="p-1 rounded text-center bg-gray-900/20 text-gray-400">
                          <div className="font-mono text-sm">13.45</div>
                          <div className="text-[0.6rem] opacity-80">Maxbet</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-blue-300 text-center">
                        *Kombinacijom najboljih kvota iz različitih kladionica
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-4xl mx-auto text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                <span className="text-blue-400">Sastavite savršen tiket</span>{" "}
                sa najboljim kombinacijama kvota
              </h3>
              <p className="text-gray-300 max-w-3xl mx-auto mb-6">
                Naš sistem vam omogućava da kombinujete najpovoljnije kvote iz
                različitih kladionica u jedan tiket, maksimizirajući vašu
                potencijalnu dobit.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => nav("/login")}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-medium"
                >
                  Sastavi svoj tiket
                </button>
                <button
                  onClick={() => nav("/onama")}
                  className="px-8 py-3 border border-blue-500/30 text-blue-300 rounded-lg font-medium"
                >
                  Kako funkcioniše?
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }
}
