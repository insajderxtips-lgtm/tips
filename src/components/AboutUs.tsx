import { useEffect, useState } from "react";
import footballer from "../assets/footballer.png";
import "../index.css";
import { useLocation } from "react-router";

export default function AboutUs(): React.ReactNode {
  useEffect(() => {
    document.title = "Insajder | O Nama";
  }, []);

  const location = useLocation();
  const expandItem = location.state?.expandItem;
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>(
    {}
  );

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

  const accordionData = [
    {
      title: "O Nama",
      content:
        "Insajder je napredna platforma za sportsko klađenje koja korisnicima omogućava efikasno upravljanje bankom, praćenje najboljih kvota na tržištu, izračunavanje arbitražnih opklada, detaljnu analizu statistike i pristup premium i besplatnim tipovima – sve na jednom mestu za pametnije i profitabilnije klađenje.",
    },
    {
      title: "Kako funkcioniše ova platforma?",
      content:
        "Insajder platforma omogućava korisnicima pristup različitim funkcijama u zavisnosti od vrste naloga. Besplatni korisnici mogu pratiti samo besplatne tipove. Lite korisnici dobijaju pristup premium tipovima, dok Premium korisnici imaju pun pristup svim funkcijama uključujući bankroll menadžment, pregled kvota, arbitražni kalkulator i detaljne analize.",
    },
    {
      title: "Šta je arbitražno klađenje?",
      content:
        "Arbitražno klađenje (sure betting) je strategija koja omogućava siguran profit iskorišćavanjem razlika u kvotama kod različitih kladionica. Premium korisnici imaju pristup našem arbitražnom kalkulatoru koji automatski pronalazi sigurne opklade i izračunava optimalne uloge za maksimalan profit.",
    },
    {
      title: "Kako mogu da upravljam svojim bankrollom na Insajder platformi?",
      content:
        "Premium korisnici mogu unositi detalje o svakoj opkladi. Sistem automatski ažurira bankroll i statistiku nakon završetka utakmica, pružajući tačan uvid u stanje računa i pomažući optimizaciju klađenja.",
    },
    {
      title: "Kako mogu da kupim članstvo na Insajder platformi?",
      content: (
        <div className="flex flex-col gap-2">
          <p>Za kupovinu Lite/Premium članstva, možete koristiti:</p>
          <div className="border-l-2 pl-3 bg-gray-900/20 rounded-sm border-emerald-500/30 hover:border-emerald-400/50 transition-colors">
            <strong>PayPal / kartica:</strong> Brz i jednostavan proces. Nakon
            uplate odmah dobijate pristup.
          </div>
          <div className="border-l-2 pl-3 bg-gray-900/20 rounded-sm border-emerald-500/30 hover:border-emerald-400/50 transition-colors">
            <strong>Uplatnica:</strong> Uploadujte sliku uplate, naši admini će
            vam odobriti pristup u kratkom roku.
          </div>
          <div className="border-l-2 pl-3 bg-gray-900/20 rounded-sm border-emerald-500/30 hover:border-emerald-400/50 transition-colors">
            Ako imate problema, kontaktirajte nas putem Instagrama ili forme na
            sajtu.
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full mx-auto flex flex-col items-center justify-center p-4 sm:p-6 min-h-screen bg-transparent">
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 relative z-10">
        {/* Title with a vibrant gradient and hover effect */}
        <h1
          className="raceFont text-4xl sm:text-5xl md:text-6xl text-center 
               transition-all duration-700 delay-300 ease 
               bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 
                 mt-6 font-extrabold tracking-wide drop-shadow-lg 
                 hover:scale-105 hover:tracking-widest cursor-pointer
                 initial-opacity-0 initial-translate-y-[-20px]"
        >
          INSAJDERTIPS
        </h1>
      </div>

      {/* Accordion Container: The main glassmorphism element */}
      <div
        className="mt-8 mb-12 bg-white/10 backdrop-blur-xl border border-white/20 
                  rounded-3xl p-4 sm:p-6 md:p-8 w-full max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto 
                  shadow-2xl shadow-black/30 transform transition-all duration-1000 delay-500 ease 
                  initial-opacity-0 initial-translate-y-[20vh] space-y-4 sm:space-y-5"
      >
        {accordionData.map((item, index) => (
          <div
            key={index}
            className="flex flex-col p-4 rounded-xl cursor-pointer 
                   bg-white/5 border border-white/10 
                   hover:bg-white/15 hover:border-white/20 
                   transition-all duration-300 group"
            onClick={() => toggleAccordionItem(index)}
          >
            <div className="flex justify-between items-center text-slate-100 group-hover:text-white">
              <span className="text-base sm:text-lg font-semibold group-hover:font-bold transition-all duration-200">
                {item.title}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`size-6 sm:size-7 text-blue-300 group-hover:text-blue-200 transform transition-transform duration-300 ${
                  openSections[index] ? "rotate-90" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
            <div
              className={`${
                openSections[index]
                  ? "max-h-96 opacity-100 pt-3"
                  : "max-h-0 opacity-0 pt-0"
              } text-slate-200 text-sm sm:text-base mt-2 
             overflow-hidden transition-all duration-500 ease-in-out
             border-l-2 border-blue-400/50 pl-4`}
            >
              {item.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
