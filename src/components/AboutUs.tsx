import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

const ACCORDION_DATA: { title: string; content: React.ReactNode }[] = [
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
        <div className="rounded-md border-l-2 border-emerald-500/40 bg-[#0b1c2e] py-2 pl-3 transition-colors hover:border-emerald-400/60">
          <strong className="text-emerald-400">Uplatnica:</strong> Uploadujte sliku uplate, naši admini će vam odobriti pristup u kratkom roku.
        </div>
        <div className="rounded-md border-l-2 border-emerald-500/40 bg-[#0b1c2e] py-2 pl-3 transition-colors hover:border-emerald-400/60">
          <strong className="text-emerald-400">Western Union:</strong> Nakon uplate unesite MTCN kod na sajtu i nakon provere dobijate Premium status.
        </div>
      </div>
    ),
  },
];

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
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="relative isolate flex min-h-screen w-full flex-col items-center justify-center bg-[#020b18] p-4 sm:p-6">
      {/* Animated ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center justify-center py-8 sm:py-12"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">O Platformi</span>
        </div>
        <h1 className="raceFont bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-center text-4xl font-extrabold tracking-wide text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] sm:text-5xl md:text-6xl">
          INSAJDERTIPS
        </h1>
        <p className="mt-3 max-w-md text-center text-sm text-slate-400">
          Sve što treba da znaš o platformi, na jednom mestu.
        </p>
      </motion.div>

      {/* Accordion */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
        className="relative z-10 mx-auto mb-12 mt-8 w-full max-w-xl space-y-3 rounded-3xl border border-[#1a3050] bg-[#07131f]/60 p-4 shadow-2xl backdrop-blur-2xl sm:p-6 md:p-8 lg:max-w-3xl xl:max-w-4xl"
      >
        {ACCORDION_DATA.map((item, index) => {
          const isOpen = !!openSections[index];
          return (
            <motion.div
              key={index}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              onClick={() => toggleAccordionItem(index)}
              className={`group cursor-pointer rounded-2xl border transition-colors duration-300 ${
                isOpen
                  ? "border-blue-500/30 bg-[#0b1c2e]"
                  : "border-[#1a3050] bg-[#0b1628] hover:border-[#2a4d75] hover:bg-[#0b1c2e]"
              }`}
            >
              <div className="flex flex-col p-4">
                <div className="flex items-center justify-between text-slate-100 group-hover:text-white">
                  <span className="text-base font-semibold sm:text-lg">{item.title}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className={`ml-4 flex-shrink-0 rounded-full p-1 transition-colors ${
                      isOpen ? "bg-blue-500/15" : "bg-white/5 group-hover:bg-white/10"
                    }`}
                  >
                    <svg
                      className={`size-6 transition-colors ${isOpen ? "text-blue-400" : "text-slate-400 group-hover:text-blue-300"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </motion.div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 border-l-2 border-blue-400/50 pl-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                        {item.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
