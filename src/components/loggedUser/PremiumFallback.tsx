import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useNavigate } from "react-router";

const PREMIUM_FEATURES = {
  stats: {
    title: "Napredne Statistike",
    description:
      "Pristupite ekskluzivnim statistikama i analizama koje vam pomažu da donosite bolje odluke.",
    benefits: [
      "Detaljne performanse timova",
      "Istorijske statistike",
      "Prediktivne analize",
      "Ekskluzivni grafikoni",
    ],
  },
  default: {
    title: "Premium Funkcije",
    description: "Otključajte ekskluzivne funkcije sa Premium članstvom.",
    benefits: [
      "Pristup svim premium tipovima",
      "Napredne analize",
      "Pracenje statistika",
      "Pronalazac najbolje kvote",
      "Kalkulator sigurnog kladjenja",
    ],
  },
};

export default function PremiumFallback({
  pageType = "default",
}: {
  premiumType: string;
  pageType?: keyof typeof PREMIUM_FEATURES;
}): React.ReactNode {
  const currentUser = useSelector((state: RootState) => state.user);
  const features = PREMIUM_FEATURES[pageType] || PREMIUM_FEATURES.default;
  const nav = useNavigate();

  return (
    <div className="w-full h-full flex justify-center items-center p-6 bg-gradient-to-br from-[#020420] to-[#13143e]">
      <div className="max-w-2xl w-full bg-gradient-to-br from-blue-900/30 to-cyan-900/20 rounded-xl border border-cyan-800/30 shadow-2xl shadow-blue-950/30 p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            {features.title}
          </h2>

          <p className="text-cyan-100">
            Pozdrav{" "}
            <span className="font-semibold text-cyan-300">
              {currentUser.username}
            </span>
            , ova funkcionalnost je dostupna samo premium korisnicima.
          </p>

          <p className="text-cyan-200/80">{features.description}</p>

          <div className="py-4 space-y-3">
            {features.benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-blue-900/20 rounded-lg border border-cyan-800/30"
              >
                <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs">
                  {index + 1}
                </div>
                <span className="text-cyan-100">{benefit}</span>
              </div>
            ))}
          </div>

          <button
            className="w-full max-w-xs mx-auto bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 flex items-center justify-center gap-2"
            onClick={() => nav("/kupi")}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Nadogradi na Premium
          </button>
        </div>
      </div>
    </div>
  );
}
