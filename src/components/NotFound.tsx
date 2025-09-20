import { useEffect } from "react";
import { useNavigate } from "react-router";

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Stranica nije pronadjena.";
  }, []);

  return (
    <div className="min-h-screen  mx-auto  flex items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        {/* Floating 404 text with individual animation */}
        <div className="relative mb-12">
          <span className="text-[120px] md:text-[180px] font-bold text-white opacity-90 inline-block animate-float1">
            4
          </span>
          <span className="text-[120px] md:text-[180px] font-bold text-cyan-300 inline-block animate-float2">
            0
          </span>
          <span className="text-[120px] md:text-[180px] font-bold text-white opacity-90 inline-block animate-float3">
            4
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent rounded-full blur-xl -z-10"></div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ova stranica <span className="text-cyan-300">nije pronadjena.</span>
        </h1>

        <p className="text-lg text-indigo-200 mb-10 max-w-lg mx-auto">
          Tražena stranica ne postoji ili je privremeno nedostupna
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            Nazad
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            Pocetna
          </button>
        </div>

        {/* Floating stars decoration */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-white/80 animate-twinkle"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-cyan-300/80 animate-twinkle-delay"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-white/60 animate-twinkle"></div>
      </div>
    </div>
  );
};

export default NotFound;
