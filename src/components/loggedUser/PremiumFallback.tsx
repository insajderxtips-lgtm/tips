import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useNavigate, useLocation } from "react-router";
import statisticsPicture from "../../assets/stats.png"; 
import statisticsPicture2 from "../../assets/stats2.png"; 
import bestOddsImg from "../../assets/bestodds.png";
import arbitrageImg from "../../assets/arbitrage.png";
import premTipsImg from "../../assets/premtips.png";

const PREMIUM_FEATURES = {
  stats: {
    title: "Napredne Statistike",
    description: "Pratite sopstvene statistike po godini, mesecu, danu, vidite vase prednosti i mane, gde manje a gde vise gresite.",
    benefits: [],
    image: [statisticsPicture, statisticsPicture2],
    alt: "Prikaz napredne statistike"
  },
  najboljekvote: {
    title: "Pronalazač Najboljih Kvota",
    description: "Skeniramo više kladionica u realnom vremenu kako biste uvek igrali po najvećoj kvoti na tržištu.",
    benefits: [
      "Pronađi najbolju kvotu u sekundi",
      "Sastavi tiket i vidi najveći profit",
      "Brzi linkovi ka kladionicama",
    ],
    alt: "Prikaz poređenja kvota",
    image: [bestOddsImg],
  },
  arbitrage: {
    title: "Arbitražni Kalkulator",
    description: "Iskoristite razlike u kvotama i ostvarite siguran profit bez obzira na ishod meča.",
    benefits: ["Razlike u kvotama vam donose siguran profit"],
    alt: "Arbitražno klađenje prikaz",
    image: [arbitrageImg],
  },
  default: {
    title: "Premium Funkcije",
    description: "Otključajte ekskluzivne funkcije sa Premium članstvom.",
    benefits: [
      "Pristup svim premium tipovima",
      "Napredne analize",
      "Praćenje statistika",
      "Pronalazač najbolje kvote",
    ],
    image: [premTipsImg],
    alt: "Premium paket"
  },
};

export default function PremiumFallback({
  pageType = "default",
}: {
  pageType?: keyof typeof PREMIUM_FEATURES;
}): React.ReactNode {
  const currentUser = useSelector((state: RootState) => state.user);
  const nav = useNavigate();
  const location = useLocation();

  const getActiveType = (): keyof typeof PREMIUM_FEATURES => {
    const path = location.pathname.toLowerCase();
    if (path.includes("statistike")) return "stats";
    if (path.includes("najboljekvote") || path.includes("najbolje-kvote")) return "najboljekvote";
    if (path.includes("arbitraz") || path.includes("arbitrage")) return "arbitrage";
    return pageType;
  };

  const activeType = getActiveType();
  const activeFeatures = PREMIUM_FEATURES[activeType] || PREMIUM_FEATURES.default;
  const isMultiImage = activeFeatures.image.length > 1;

  return (
    <div className="w-full min-h-screen flex justify-center items-center p-4 md:p-10 bg-[#020420]">
      {/* Outer Shell */}
      <div className="max-w-6xl w-full flex flex-col lg:flex-row bg-[#0a0b1e] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        {/* LEFT: Text Section */}
        <div className="lg:w-[45%] p-8 md:p-14 flex flex-col justify-center bg-gradient-to-br from-[#13143e] to-[#0a0b1e] relative">
          <div className="relative z-10 space-y-8">
            <div className="w-fit px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              Premium Access
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tighter">
                {activeFeatures.title}
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Pozdrav <span className="text-cyan-400 font-bold">{currentUser.username}</span>, 
                ova funkcija je zaključana. Postani deo tima za pristup.
              </p>
            </div>

            {activeFeatures.benefits.length > 0 && (
              <div className="space-y-3">
                {activeFeatures.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                    {b}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => nav("/kupi")}
              className="group relative w-full inline-flex items-center justify-center px-8 py-5 font-black text-black transition-all duration-200 bg-white rounded-xl hover:bg-cyan-400 active:scale-95"
            >
              AKTIVIRAJ PREMIUM
            </button>
          </div>
        </div>

        {/* RIGHT: Image Section - Now with Conditional Centering */}
        <div className={`lg:w-[55%] bg-black/40 p-6 md:p-10 flex flex-col gap-6 lg:border-l border-white/5 ${!isMultiImage ? 'justify-center items-center' : 'justify-start'}`}>
          {activeFeatures.image.map((img, idx) => (
            <div 
              key={idx}
              className={`rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.01] bg-[#020420] ${!isMultiImage ? 'w-full max-w-[500px]' : 'w-full'}`}
            >
              <img 
                src={img} 
                alt={activeFeatures.alt}
                className="w-full h-auto object-cover opacity-90"
              />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}