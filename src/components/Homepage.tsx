import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import stats from "../assets/stats.png";
import stats1 from "../assets/stats2.png";
import stats2 from "../assets/stats3.png";
import { RootState } from "../redux/store";
import Chatbox from "./loggedUser/Chatbox";

export default function Homepage(): React.ReactNode {
  const isLoggedIn = useSelector(
    (state: RootState) => state.user.isAuthenticated
  );
  const nav = useNavigate();
  if (isLoggedIn) {
    return (
      <div className="flex flex-col w-full h-full">
        <Chatbox />
      </div>
    );
  } else {
    return (
      <div className=" h-max  w-full flex flex-col absolute top-0 left">
        <div className=" min-h-screen w-full pt-22 flex flex-col min-[880px]:flex-row items-center justify-center xl:justify-between bg-[radial-gradient(rgba(36,33,80,1)_0%,rgba(2,3,27,1)_0%)] overflow-hidden">
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

    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 px-4">
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
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Kompletna analiza</h3>
          <p className="text-gray-300">
            Naši tipseri su veoma iskusni u sportovima i analiziraju
            svaku utakmicu detaljno, na Vama je samo da postavite
            opkladu.
          </p>
        </div>
      </div>

      {/* Lineups Feature */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Sastavi i povrede</h3>
          <p className="text-gray-300 mb-3">
            Precizne informacije o očekivanim sastavima i ključnim odsustvima:
          </p>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm">
              <div>
                <p className="font-medium text-red-400">Odsutni (Liverpool):</p>
                <p className="text-gray-400">Salah • Van Dijk • Alisson</p>
              </div>
              <div>
                <p className="font-medium text-red-400">Odsutni (Man City):</p>
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
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Forma i trendovi</h3>
          <p className="text-gray-300 mb-3">
            Grafički prikaz forme timova u poslednjih 5 utakmica:
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
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Analiza tipsera</h3>
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
            <div className="text-sm font-medium text-blue-400">PREMIUM TIP • FUDBAL</div>
          </div>
          <h3 className="text-xl font-bold text-white mt-2">Liverpool vs Manchester City</h3>
          <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-300 mt-1 gap-1">
            <span>Premier League • 10.03.2024</span>
            <span>20:45</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Recommended Bet */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
              <span className="font-medium text-white">TIP:</span>
              <span className="text-green-400 font-bold">+EV</span>
            </div>
            <div className="text-lg font-bold text-center py-2 bg-gray-900 rounded">
              Manchester City 2 @ 1.85
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Najvisu kvotu ima MozzartBet.
            </div>
          </div>

          {/* Analysis */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">KLJUČNA ANALIZA:</h4>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                Liverpool bez 3 ključna igrača (Salah, Van Dijk, Alisson)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                City ima 7 pobeda u poslednjih 8 gostovanja na Anfieldu
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                Haaland u formi - 5 golova u poslednje 3 utakmice
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                Liverpool samo 1 pobeda u poslednja 4 susreta sa top 5 timovima
              </li>
            </ul>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
              <div className="text-xs text-gray-400">XG (poslednjih 5)</div>
              <div className="font-bold text-white">2.1 - 1.4</div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
              <div className="text-xs text-gray-400">Procenat posedanja</div>
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
          <button className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm transition-all w-full sm:w-auto" onClick={() => nav("/kupi")}>
            POSTANI CLAN
          </button>
        </div>
      </div>
    </div>
  </div>

</div>
<div className=" w-full bg-[radial-gradient(ellipse_at_center,_rgba(36,33,80,0.3)_0%,_rgba(2,3,27,1)_70%)] py-20 px-4">
  <div className="max-w-6xl mx-auto space-y-20"> {/* Added vertical spacing container */}
    
    {/* Hero Section with Image */}
    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 pt-5"> {/* Added padding-top */}
      <div className="lg:w-1/2 space-y-8"> {/* Increased spacing */}
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight  text-center"> {/* Larger text */}
          <span className="bg-gradient-to-r from-blue-400 to-purple-300 bg-clip-text text-transparent">
            Pratite napredne statistike
          </span>
          <br />
          <span className="text-blue-400">vaših opklada</span>
        </h2>
        <p className="text-xl text-gray-300 mb-8"> {/* Larger paragraph */}
          Sve što vam treba na jednom mestu za pametnije klađenje
        </p>
        
        {/* Mobile Image - More margin */}
        <div className="lg:hidden relative my-10 group max-w-md mx-auto">
          <img
            src={stats}
            alt="Statistics Dashboard Preview"
            className="rounded-xl border border-blue-500/30 shadow-2xl shadow-blue-500/20 w-full"
          />
        </div>
      </div>
      
      {/* Desktop Image - Better proportions */}
      <div className="hidden lg:block lg:w-1/2 relative  h-[400px] group "> {/* Fixed height */}
        <img
          src={stats}
          alt="Statistics Dashboard Preview"
          className="absolute h-full w-full object-contain rounded-xl border border-blue-500/30 shadow-2xl shadow-blue-500/20 transform transition-transform duration-500 group-hover:-translate-y-2"
          style={{
            transform: "rotateY(-5deg) rotateX(2deg)",
            boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)"
          }}
        />
      </div>
    </div>

    {/* Feature Cards - Better spacing */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12"> {/* Added vertical padding */}
      {/* Card 1 */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 h-full"> {/* Fixed height */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-blue-500/20 flex items-center justify-center"> {/* Larger icon */}
          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-white mb-4 text-center"> {/* Larger heading */}
          Evidentirajte opklade
        </h3>
        <p className="text-gray-300 text-lg text-center"> {/* Larger text */}
          Jednostavno unesite svoje opklade sa svim parametrima i bice trajno sacuvane.
        </p>
      </div>

      {/* Card 2 */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 h-full">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-purple-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-white mb-4 text-center">
          Analizirajte rezultate
        </h3>
        <p className="text-gray-300 text-lg text-center">
          Detaljna statistika i grafikoni vam pomažu da identifikujete jake i slabe tačke.
        </p>
      </div>

      {/* Card 3 */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300 h-full">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-white mb-4 text-center">
          Istorija kladjenja
        </h3>
        <p className="text-gray-300 text-lg text-center">
         Sortirajte vase opklade po godini, mesecu, danu.
        </p>
      </div>
    </div>
  </div>
</div>
<div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_rgba(36,33,80,0.3)_0%,_rgba(2,3,27,1)_70%)] py-20 px-4 overflow-hidden">
  {/* Animated Header */}
  <div className="max-w-6xl mx-auto text-center mb-16 relative">
    <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl -z-10"></div>
    
    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
      <span className="bg-gradient-to-r from-blue-400 to-purple-300 bg-clip-text text-transparent">
        Pronalazač Najboljih Kvota
      </span>
    </h1>
    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
      Automatski skenirajte desetine kladionica i pronađite najpovoljnije kvote za vaše opklade u realnom vremenu.
    </p>
  </div>

  {/* Feature Showcase */}
  <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
    {/* Left Column - Feature Explanation */}
    <div className="space-y-8">
      {/* Feature 1 */}
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0 mt-1">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Instant pretraga</h3>
          <p className="text-gray-300">
            Naš sistem automatski proverava kvote u svim većim kladionicama i prikazuje vam najpovoljniju opciju za vašu opkladu.
          </p>
        </div>
      </div>

      {/* Feature 2 */}
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0 mt-1">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Poređenje u realnom vremenu</h3>
          <p className="text-gray-300">
            Sve kvote koje vidite su u realnom vremenu.
          </p>
        </div>
      </div>

      {/* Feature 3 */}
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0 mt-1">
          <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Povecajte profit</h3>
          <p className="text-gray-300">
            Ne donirajte novac kladionicama, samo mala razlika u kvoti moze da znaci puno.
          </p>
        </div>
      </div>
    </div>

    {/* Right Column - Visual Demo */}
    <div className="relative h-full">
      <div className=" relative h-full z-10 border border-blue-500/30 rounded-xl overflow-hidden shadow-2xl shadow-blue-500/20 transform rotate-1 hover:rotate-0 transition-transform duration-500">
        {/* Replace with your actual odds checker screenshot */}
        <div className="bg-gray-800/80 p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium text-blue-400">Fudbal • Premier Liga</div>
            <div className="text-xs text-gray-400">Osveženo pre 25s</div>
          </div>
          
          <div className="space-y-4">
            {/* Match row */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-white">Man City vs Arsenal</div>
                <div className="text-xs text-green-400">+2.3% vrednost</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-900/30 p-2 rounded">
                  <div className="text-xs text-gray-400">Soccerbet</div>
                  <div className="font-bold text-blue-400">2.10</div>
                </div>
                <div className="bg-purple-900/30 p-2 rounded border border-purple-500/30">
                  <div className="text-xs text-gray-400">Meridian</div>
                  <div className="font-bold text-purple-400">2.15</div>
                </div>
                <div className="bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-400">Mozzart</div>
                  <div className="font-bold text-white">2.05</div>
                </div>
              </div>
            </div>
            
            {/* Second match row */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-white">Bayern vs Dortmund</div>
                <div className="text-xs text-green-400">+1.8% vrednost</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-900/30 p-2 rounded">
                  <div className="text-xs text-gray-400">Soccerbet</div>
                  <div className="font-bold text-blue-400">1.80</div>
                </div>
                <div className="bg-purple-900/30 p-2 rounded border border-purple-500/30">
                  <div className="text-xs text-gray-400">Meridian</div>
                  <div className="font-bold text-purple-400">1.85</div>
                </div>
                <div className="bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-400">Mozzart</div>
                  <div className="font-bold text-white">1.75</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl -z-10"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-xl -z-10"></div>
    </div>
  </div>

  {/* Value Proposition Section */}
  <div className="max-w-4xl mx-auto mt-24 text-center">
    <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
      <span className="text-blue-400">Povećajte svoju dobit</span> koristeći najbolje kvote na tržištu
    </h3>
    <p className="text-gray-300 max-w-3xl mx-auto mb-8">
      Naš alat vam omogućava da maksimizirete potencijalnu dobit pronalaženjem najpovoljnijih kvota u svakom trenutku.
      Prosečno povećanje dobiti korisnika: <span className="font-bold text-green-400">+12.7%</span>
    </p>
    
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button 
        onClick={() => nav("/kupi")}
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all"
      >
        Postani clan
      </button>
    </div>
  </div>
</div>

      </div>
    );
  }
}
