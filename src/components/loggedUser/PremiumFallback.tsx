import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useNavigate, useLocation } from "react-router";
import footballerImg from "../../assets/footballer.png"; // ✅ IMPORT IMAGE PROPERLY
import statisticsPicture from "../../assets/stats3.png"; // ✅ IMPORT IMAGE PROPERLY

const PREMIUM_FEATURES = {
  stats: {
    title: "Napredne Statistike",
    description: "Pristupite ekskluzivnim statistikama i analizama koje vam pomažu da donosite bolje odluke.",
    benefits: [
      "Detaljne performanse timova",
      "Istorijske statistike",
      "Prediktivne analize",
      "Ekskluzivni grafikoni",
    ],
    image: statisticsPicture,
    alt: "Prikaz napredne statistike"
  },
  najboljekvote: {
    title: "Pronalazač Najboljih Kvota",
    description: "Skeniramo desetine kladionica u realnom vremenu kako biste uvek igrali po najvećoj kvoti na tržištu.",
    benefits: [
      "Poređenje kvota uživo",
      "Automatska kalkulacija profita",
      "Istorija kretanja kvota",
      "Brzi linkovi ka kladionicama",
    ],
    image: footballerImg,
    alt: "Prikaz poređenja kvota"
  },
  default: {
    title: "Premium Funkcije",
    description: "Otključajte ekskluzivne funkcije sa Premium članstvom.",
    benefits: [
      "Pristup svim premium tipovima",
      "Napredne analize",
      "Praćenje statistika",
      "Pronalazač najbolje kvote",
      "Kalkulator sigurnog klađenja",
    ],
    image: footballerImg,
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

    return pageType;
  };

  const activeType = getActiveType();
  const activeFeatures = PREMIUM_FEATURES[activeType] || PREMIUM_FEATURES.default;

  console.log("--- DEBUG PREMIUM FALLBACK ---");
  console.log("Current Pathname:", location.pathname);
  console.log("Determined Type:", activeType);

  return (
    <div className="w-full min-h-screen flex justify-center items-center p-6 bg-gradient-to-br from-[#020420] to-[#13143e]">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-[#0a0b1e]/50 rounded-2xl border border-cyan-800/30 p-8 md:p-12 shadow-2xl backdrop-blur-md">

        <div className="space-y-8 order-2 lg:order-1">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              {activeFeatures.title}
            </h2>

            <p className="text-cyan-100 text-lg">
              Pozdrav <span className="font-bold text-cyan-400">{currentUser.username}</span>, 
              ova funkcija je dostupna samo našim Premium članovima.
            </p>

            <p className="text-cyan-200/60 text-lg leading-relaxed">
              {activeFeatures.description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {activeFeatures.benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-blue-900/10 rounded-xl border border-cyan-500/10 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-cyan-50 text-sm md:text-base font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          <button
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 transform hover:-translate-y-1"
            onClick={() => nav("/kupi")}
          >
            Postani Premium Član
          </button>
        </div>

        <div className="order-1 lg:order-2 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#020420]">
            <img 
              src={activeFeatures.image} 
              alt={activeFeatures.alt}
              className="w-full h-auto object-cover opacity-80 grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#020420] via-transparent to-transparent opacity-60"></div>

            <div className="absolute top-4 right-4 bg-cyan-500/20 backdrop-blur-md border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-300 text-xs font-bold uppercase tracking-tighter">
              Demo Prikaz
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
