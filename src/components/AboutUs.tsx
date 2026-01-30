import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router";

export default function AboutUs(): React.ReactNode {
  useEffect(() => {
    document.title = "Insajder | O Nama";
  }, []);

  const location = useLocation();
  const expandItem = location.state?.expandItem;
  
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (typeof expandItem === "number") {
      setOpenSections({ [expandItem]: true });
    }
  }, [expandItem]);

  const toggleAccordionItem = (index: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const accordionData = useMemo(() => [
    {
      title: "O Nama",
      content:
        "Insajder je napredna platforma za sportsko klađenje koja korisnicima omogućava efikasno upravljanje bankom, praćenje najboljih kvota na tržištu, izračunavanje arbitražnih opklada, detaljnu analizu statistike i pristup premium i besplatnim tipovima – sve na jednom mestu za pametnije i profitabilnije klađenje.",
    },
    {
      title: "Kako funkcioniše ova platforma?",
      content:
        "Insajder platforma omogućava korisnicima pristup različitim funkcijama u zavisnosti od vrste naloga. Besplatni korisnici mogu pratiti samo besplatne tipove. Premium korisnici imaju pun pristup svim funkcijama uključujući bankroll menadžment, pregled kvota, arbitražni kalkulator i detaljne analize.",
    },
    {
      title: "Šta je arbitražno klađenje?",
      content:
        "Arbitražno klađenje (sure betting) je strategija koja omogućava siguran profit iskorišćavanjem razlika u kvotama kod različitih kladionica. Premium korisnici imaju pristup našem arbitražnom kalkulatoru koji automatski pronalazi sigurne opklade i izračunava optimalne uloge za maksimalan profit.",
    },
    {
      title: "Kako mogu da kupim članstvo na Insajder platformi?",
      content: (
        <div className="flex flex-col gap-2">
          <p>Za kupovinu Premium članstva, možete koristiti:</p>
          <div className="border-l-2 pl-3 bg-gray-900/20 rounded-sm border-emerald-500/30 hover:border-emerald-400/50 transition-colors">
            <strong>Uplatnica:</strong> Uploadujte sliku uplate, naši admini će vam odobriti pristup u kratkom roku.
          </div>
          <div className="border-l-2 pl-3 bg-gray-900/20 rounded-sm border-emerald-500/30 hover:border-emerald-400/50 transition-colors">
            <strong>Western Union:</strong> Nakon uplate unesite MTCN kod na sajtu i nakon provere dobijate Premium status.
          </div>
        </div>
      ),
    },
  ], []);

  return (
    <div className="w-full mx-auto flex flex-col items-center justify-center p-4 sm:p-6 min-h-screen bg-transparent relative isolate">
      {/* Background Glow */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl">
        <div
          className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#6a0dad] to-[#8a2be2] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="flex flex-col items-center justify-center py-8 sm:py-12 relative z-10">
        <h1 className="raceFont text-4xl sm:text-5xl md:text-6xl text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-fuchsia-400 mt-6 font-extrabold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-700 hover:scale-105 hover:tracking-widest cursor-pointer">
          INSAJDERTIPS
        </h1>
      </div>

      <div className="mt-8 mb-12 bg-gray-900/20 backdrop-blur-2xl border border-purple-500/20 rounded-3xl p-4 sm:p-6 md:p-8 w-full max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto shadow-2xl space-y-4">
        {accordionData.map((item, index) => (
          <div
            key={index}
            className={`rounded-2xl border border-white/10 transition-all duration-300 ease-in-out ${
              openSections[index] ? "bg-white/10" : "bg-white/5 hover:bg-white/10"
            } hover:-translate-y-1 hover:border-white/20`}
            onClick={() => toggleAccordionItem(index)}
          >
            <div className="flex flex-col p-4 cursor-pointer group">
              <div className="flex justify-between items-center text-slate-100 group-hover:text-white">
                <span className="text-base sm:text-lg font-semibold">{item.title}</span>
                <div className="flex-shrink-0 ml-4 p-1 rounded-full bg-white/5 group-hover:bg-white/10">
                  <svg
                    className={`size-6 text-purple-400 group-hover:text-fuchsia-400 transform transition-transform duration-500 ${
                      openSections[index] ? "rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openSections[index] ? "max-h-[500px] mt-4 opacity-100" : "max-h-0 mt-0 opacity-0"
                }`}
              >
                <div className="text-gray-300 text-sm sm:text-base border-l-2 border-purple-400/50 pl-4 leading-relaxed">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}