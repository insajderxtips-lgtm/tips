import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import stats from "../assets/stats.png";
import stats2 from "../assets/stats2.png";
import bestOdds from "../assets/bestodds.png";
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
      <div className="flex flex-col w-full max-w-full overflow-x-hidden">
        <Chatbox />
        <TipsHistory />
      </div>
    );
  } else {
    return (
      <div className="h-max w-full flex flex-col absolute top-0 left overflow-x-hidden bg-[#020617]">
 <div className="min-h-screen min-w-full pt-20 flex flex-col min-[880px]:flex-row items-center justify-center xl:justify-around overflow-hidden bg-transpent ">
  {/* Text Content (Left Side) */}
  <div className="flex flex-col p-8 rounded-3xl max-w-[700px] w-full text-center min-[880px]:text-left text-white z-20 transition-all duration-700 delay-100">
    
    <div className="space-y-2 mb-6">
      <h1 className="raceFont text-4xl md:text-6xl tracking-tight leading-tight">
        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400">
          Pobedjuj više,
        </span>
        <span className="block mt-1">
          kladi se{" "}
          <span className="relative inline-block text-blue-400">
            pametnije
            <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"></span>
          </span>
          .
        </span>
      </h1>
    </div>

    <p className="font-main text-slate-400 text-lg md:text-xl leading-relaxed max-w-[500px] mx-auto min-[880px]:mx-0">
      Premium tipovi, detaljne analize i 
      <span className="text-white font-semibold"> pronalazač najboljih kvota</span>. 
      Sve što ti treba za profit na{" "}
      <span className="text-blue-400 border-b border-blue-500/30">jednom mestu</span>.
    </p>

    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center min-[880px]:justify-start">
      <button
        onClick={() => nav("/onama")}
        className="group relative px-8 py-4 bg-blue-600 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative raceFont text-sm tracking-widest font-bold">
          SAZNAJ VIŠE
        </span>
      </button>
      
      <button onClick={() => nav("/login")} className="px-8 py-4 rounded-xl border border-slate-700 bg-slate-800/40 backdrop-blur-sm hover:bg-slate-800 transition-colors raceFont text-sm tracking-widest">
        PRIDRUŽI SE
      </button>
    </div>
  </div>

  {/* Image Content (Right Side) */}
  <div className="relative p-6 mt-12 min-[880px]:mt-0 perspective-2000">
    {/* Decorative Glows - Adjusted for the new BG */}
    <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-500/10 blur-[100px] rounded-full" />
    <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-indigo-500/10 blur-[100px] rounded-full" />

    <div className="relative transition-all duration-700 ease-out hover:rotate-y-0 transform rotate-y-[-12deg] rotate-x-[8deg]">
      <div className="relative z-10 p-1.5 bg-slate-800/50 rounded-2xl backdrop-blur-md border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <img
          src={stats}
          className="max-w-full h-auto object-cover lg:max-w-[550px] xl:max-w-[750px] rounded-xl"
          alt="Betting Tips Preview"
        />
        
        {/* Subtle Inner Glow on Image */}
        <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-inset ring-white/10" />
      </div>


    </div>
  </div>
</div>
<div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#020617] to-transparent pointer-events-none" />
<div className="py-20 w-full bg-transparent relative overflow-hidden px-4">
  {/* Background Decorative Elements */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.08)_0%,_transparent_70%)] pointer-events-none"></div>

  {/* Hero Section */}
  <div className="max-w-6xl mx-auto text-center mb-20 relative">
    <div className="inline-block px-4 py-1.5 mb-4 rounded-full border border-blue-500/20 bg-blue-500/5 backdrop-blur-md">
      <span className="raceFont text-[10px] tracking-[0.2em] text-blue-400 uppercase">InsajderTips</span>
    </div>
    <h2 className="raceFont text-4xl md:text-6xl text-white mb-6 tracking-tight">
      <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
        Premium Tipovi
      </span>
    </h2>
    <p className="font-main text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
      Detaljne analize mečeva, sastavi, povrede i izostanci kao i dodatne informacije.
    </p>
  </div>

  {/* Feature Showcase */}
  <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-start">
    
    {/* Left Column - Features */}
    <div className="w-full lg:w-[45%] space-y-12">
      
      {/* Feature Item 1 */}
      <div className="group flex gap-6 items-start transition-all duration-300 hover:translate-x-2">
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/20">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="raceFont text-lg text-white mb-2 group-hover:text-blue-400 transition-colors">Kompletna analiza</h3>
          <p className="text-slate-400 leading-snug">Kompletna analiza meča naših tipstera.</p>
        </div>
      </div>

      {/* Feature Item 2 - Sastavi */}
      <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
        <div className="flex gap-4 items-center mb-2">
           <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center">
             <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
           </div>
           <h3 className="raceFont text-lg text-white">Sastavi i povrede</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-[11px] font-main tracking-wider">
           <div className="space-y-1">
             <p className="text-rose-400 font-bold uppercase tracking-widest opacity-80">Odsutni (LIV)</p>
             <p className="text-slate-300">Salah, Van Dijk, Alisson</p>
           </div>
           <div className="space-y-1 border-l border-white/10 pl-4">
             <p className="text-rose-400 font-bold uppercase tracking-widest opacity-80">Odsutni (MCI)</p>
             <p className="text-slate-300">De Bruyne, Grealish</p>
           </div>
        </div>
      </div>

      {/* Feature Item 3 - Form */}
      <div className="flex gap-6 items-start">
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </div>
        <div>
          <h3 className="raceFont text-lg text-white mb-3">Forma i medjusobni mecevi.</h3>
          <div className="flex gap-2.5">
            {["W", "W", "D", "L", "W"].map((result, i) => (
              <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] raceFont border ${
                result === "W" ? "bg-green-500/10 border-green-500/40 text-green-400" :
                result === "D" ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-400" :
                "bg-red-500/10 border-red-500/40 text-red-400"
              }`}>
                {result}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Right Column - The Ticket Card */}
    <div className="w-full lg:w-[55%] relative group">
      {/* Abstract background glow behind card */}
      <div className="absolute inset-0 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all duration-700"></div>

      <div className="relative bg-[#161e2f] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        {/* Card Header */}
        <div className="p-8 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex justify-between items-center mb-4">
            <span className="px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] raceFont tracking-widest">PREMIUM ANALIZA</span>
            <span className="text-slate-500 text-[11px] font-main uppercase tracking-widest">Premier Liga</span>
          </div>
          <h3 className="text-2xl md:text-3xl raceFont text-white mb-2">Liverpool vs Man City</h3>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> 21.09.2025</span>
            <span>17:30h</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-8 space-y-8">
          {/* Tip Section */}
          <div className="relative p-6 rounded-2xl bg-[#0f172a] border border-blue-500/30 overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
             </div>
             <p className="text-xs text-slate-500 raceFont uppercase mb-3 tracking-widest">Predloženi Tip</p>
             <div className="flex justify-between items-end">
                <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">Manchester City X</div>
                <div className="text-3xl font-black text-blue-400 raceFont">@ 3.90</div>
             </div>
          </div>

          {/* Analysis (Blurred) */}
          <div className="space-y-4">
            <h4 className="text-[10px] raceFont text-slate-500 uppercase tracking-[0.2em]">Ključna Analiza</h4>
            <div className="space-y-3 blur-md select-none opacity-50">
              <div className="h-4 bg-slate-700 rounded-md w-full animate-pulse"></div>
              <div className="h-4 bg-slate-700 rounded-md w-[90%] animate-pulse"></div>
              <div className="h-4 bg-slate-700 rounded-md w-[95%] animate-pulse"></div>
            </div>
          </div>




        </div>
      </div>
    </div>

  </div>
</div>
<div className="w-full bg-[#030712] py-24 px-4 relative overflow-hidden">
  {/* Subtle Ambient Background Glows */}
  <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

<div className="max-w-6xl mx-auto">
  {/* Hero Section */}
  <section className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 mb-32">
    <div className="lg:w-1/2 space-y-8 text-center lg:text-left">

      
      <h2 className="raceFont text-4xl md:text-5xl lg:text-6xl text-white leading-[1.1]">
        Pratite napredne 
        <span className="block text-blue-400 mt-2">statistike opklada</span>
      </h2>
      
      <p className="font-main text-lg md:text-xl text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
        Pratite vaše sopstvene opklade po godini, mesecu i danu. <span className="text-white">Nema više nagađanja</span> — u svakom trenutku vidiš tačno gde si u plusu, a gde praviš greške.
      </p>


    </div>

    {/* Desktop Image Section */}
    <div className="lg:w-1/2 relative group">
      <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/15 transition-colors" />
      <div className="relative p-2 bg-slate-800/40 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl transform rotate-1 group-hover:rotate-0 transition-transform duration-500">
        <img
          src={stats2}
          alt="Statistics Dashboard Preview"
          className="rounded-xl w-full"
        />
      </div>
    </div>
  </section>
</div>
</div>
  <div className="w-full bg-gradient-to-b from-[#030712] to-[#020617] py-16 px-4">
  <div className="max-w-6xl mx-auto">
    {/* Header Section */}
    <section className="text-center mb-16 relative">
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-950/20 rounded-full blur-3xl -z-10"></div>

      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
        <span className="bg-gradient-to-r from-blue-400 to-purple-300 bg-clip-text text-transparent">
          Pronalazač Najboljih Kvota
        </span>
      </h1>
      <p className="text-xl text-gray-300 max-w-3xl mx-auto">
        Automatski skenirajte vise kladionica i pronađite
        najpovoljnije kvote za vaše opklade u realnom vremenu.
      </p>
    </section>

    {/* Feature Showcase */}
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
      {/* Left Column - Features */}
      <div className="space-y-8">
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
              Naš sistem automatski proverava kvote u vise kladionicama i prikazuje vam najpovoljniju opciju za vašu opkladu.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 mt-1">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Sastavite tiket</h3>
            <p className="text-gray-300">
              Sastavite tiket na našem sajtu i mi ćemo vam automatski prikazati
              <span className="font-bold text-blue-300"> najveću dostupnu kvotu </span>
              za ceo tiket kombinujući najbolje opcije.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 mt-1">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Povećajte profit</h3>
            <p className="text-gray-300">
              Ne donirajte novac kladionicama - kombinovanjem najboljih kvota možete
              <span className="font-bold text-green-400"> povećati dobit i do 30% </span>
              na istim opkladama.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - THE IMAGE */}
      <div className="relative group w-full h-full flex items-center justify-center">
        {/* Pozadinski sjaj za dubinu */}
        <div className="absolute -inset-4 bg-blue-600/10 rounded-full blur-3xl -z-10 group-hover:bg-blue-600/20 transition-all duration-700"></div>
        
        <div className="w-full border border-blue-500/20 rounded-2xl overflow-hidden bg-[#0a0f1d] shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] transform transition-transform duration-500 hover:scale-[1.01]">
          {/* Mockup header da izgleda kao prozor aplikacije */}
          <div className="bg-[#111827] px-4 py-2 border-b border-white/5 flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
          </div>

          <img 
            src={bestOdds} 
            alt="Best Odds Real-time" 
            className="w-full h-auto block object-contain"
          />
        </div>
      </div>
    </section>

    {/* CTA Section */}
    <section className="max-w-4xl mx-auto text-center">
      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
        <span className="text-blue-400">Sastavite savršen tiket</span> sa najboljim kombinacijama kvota
      </h3>
      <p className="text-gray-300 max-w-3xl mx-auto mb-6">
        Naš sistem vam omogućava da kombinujete najpovoljnije kvote iz različitih kladionica u jedan tiket, maksimizirajući vašu dobit.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => nav("/login")}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-medium hover:brightness-110 transition-all shadow-lg shadow-blue-500/20"
        >
          Sastavi svoj tiket
        </button>
        <button
          onClick={() => nav("/onama")}
          className="px-8 py-3 border border-blue-500/30 text-blue-300 rounded-lg font-medium hover:bg-blue-500/10 transition-all"
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
