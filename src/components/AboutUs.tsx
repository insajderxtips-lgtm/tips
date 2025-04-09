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

  return (
    <div className="w-full mx-auto flex flex-col md:text-lg h-max p-2 overflow-hidden  min-h-screen">
      <div className="flex flex-col items-center overflow-hidden justify-around py-12 relative">
        <div className="absolute inset-0  z-0" />
        <img
          src={footballer}
          className="w-64 transition-all duration-1000 ease-in-out starting:opacity-10 starting:-translate-x-[10vw]  rounded-full p-2  hover:shadow-purple-900/50 hover:scale-105 cursor-pointer z-10"
        />
        <div className="text-3xl starting:-translate-y-[20px] starting:opacity-0 transition-all duration-1000 delay-450 ease testFont bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-300 mt-6 hover:scale-105">
          INSAJDER TIM
        </div>
      </div>

      <div className="mt-5 bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] rounded-2xl p-6 w-[90%] md:max-w-[70%] lg:max-w-[60%] mx-auto starting:opacity-0 starting:translate-y-[50vh] transition-all duration-1000 ease delay-700 overflow-hidden shadow-2xl shadow-blue-900/20">
        <div
          className="flex flex-col justify-between w-[100%] cursor-pointer select-none p-2 border-b border-blue-800/40 hover:bg-blue-900/10 rounded-lg transition-colors"
          onClick={() => toggleAccordionItem(0)}
        >
          <div className="flex justify-between">
            <span className="text-blue-100/90 hover:text-blue-50">O Nama</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className={`size-6 transition-transform text-blue-400 ${
                openSections[0] ? "rotate-90" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5"
              />
            </svg>
          </div>
          <div
            className={`${
              openSections[0] ? "flex" : "hidden"
            } p-2 border-l-2 border-blue-500/30 bg-gradient-to-r from-blue-900/10 to-transparent m-2 rounded-r-lg`}
          >
            Insajder je napredna platforma za sportsko klađenje koja korisnicima
            omogućava efikasno upravljanje bankom, praćenje najboljih kvota na
            tržištu, izračunavanje arbitražnih opklada, detaljnu analizu
            statistike i pristup premium i besplatnim tipovima – sve na jednom
            mestu za pametnije i profitabilnije klađenje.
          </div>
        </div>

        <div
          className="flex flex-col justify-between w-[100%] cursor-pointer select-none p-2 border-b border-blue-800/40 hover:bg-blue-900/10 rounded-lg transition-colors"
          onClick={() => toggleAccordionItem(1)}
        >
          <div className="flex justify-between">
            <span className="text-blue-100/90 hover:text-blue-50">
              Kako funkcionise ova platforma?
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className={`size-6 transition-transform text-blue-400 ${
                openSections[1] ? "rotate-90" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5"
              />
            </svg>
          </div>
          <div
            className={`${
              openSections[1] ? "flex" : "hidden"
            } p-2 border-l-2 border-blue-500/30 bg-gradient-to-r from-blue-900/10 to-transparent m-2 rounded-r-lg`}
          >
            Insajder platforma omogućava korisnicima pristup različitim
            funkcijama u zavisnosti od vrste naloga. mogu se registrovati i
            pratiti samo besplatne tipove. Lite korisnici imaju mogućnost
            registracije i pristupa premium tipovima, dok Premium korisnici
            dobijaju kompletan paket funkcionalnosti, uključujući bankroll
            menadžment, pregled najboljih kvota, arbitražni kalkulator, detaljne
            statistike i analize mečeva.
          </div>
        </div>

        <div
          className="flex flex-col justify-between w-[100%] cursor-pointer select-none p-2 border-b border-blue-800/40 hover:bg-blue-900/10 rounded-lg transition-colors"
          onClick={() => toggleAccordionItem(2)}
        >
          <div className="flex justify-between">
            <span className="text-blue-100/90 hover:text-blue-50">
              Šta je arbitražno klađenje?
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className={`size-6 transition-transform text-blue-400 ${
                openSections[2] ? "rotate-90" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5"
              />
            </svg>
          </div>
          <div
            className={`${
              openSections[2] ? "flex" : "hidden"
            } p-2 border-l-2 border-blue-500/30 bg-gradient-to-r from-blue-900/10 to-transparent m-2 rounded-r-lg`}
          >
            Arbitražno klađenje (sure betting) je strategija koja omogućava
            igračima da ostvare siguran profit iskorišćavanjem razlika u kvotama
            kod različitih kladionica. Ova tehnika funkcioniše tako što se
            postavljaju opklade na sve moguće ishode jednog događaja kod
            različitih kladionica, pri čemu je dobitak zagarantovan bez obzira
            na krajnji ishod meča. Kako bi se arbitražno klađenje uspešno
            primenilo, potrebno je brzo pronaći i izračunati odgovarajuće kvote,
            što može biti komplikovano bez pravih alata. Zato Premium korisnici
            na Insajder platformi imaju pristup našem arbitražnom kalkulatoru,
            koji automatski pronalazi sigurne opklade i izračunava optimalne
            uloge za maksimalan profit.
          </div>
        </div>

        <div
          className="flex flex-col justify-between w-[100%] cursor-pointer select-none p-2 border-b border-blue-800/40 hover:bg-blue-900/10 rounded-lg transition-colors"
          onClick={() => toggleAccordionItem(3)}
        >
          <div className="flex justify-between">
            <span className="text-blue-100/90 hover:text-blue-50">
              Kako mogu da upravljam svojim bankrollom na Insajder platformi?
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className={`size-6 transition-transform text-blue-400 ${
                openSections[3] ? "rotate-90" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5"
              />
            </svg>
          </div>
          <div
            className={`${
              openSections[3] ? "flex" : "hidden"
            } p-2 border-l-2 border-blue-500/30 bg-gradient-to-r from-blue-900/10 to-transparent m-2 rounded-r-lg`}
          >
            Premium korisnici mogu uneti detalje o svakoj opkladi (kao što su
            igra, ulog, kvote i vrsta opklade). Nakon što se utakmica završi,
            sistem automatski ažurira vaš bankroll i statistiku, izračunavajući
            dobitak ili gubitak na osnovu ishoda igre. Tako ćete uvek imati
            tačan uvid u stanje svog bankroll-a, dok platforma automatski prati
            sve vaše uloge i rezultate, omogućavajući vam da optimizujete
            klađenje i upravljate kapitalom na najbolji način.
          </div>
        </div>

        <div
          className="flex flex-col justify-between w-[100%] cursor-pointer select-none p-2 border-b border-blue-800/40 hover:bg-blue-900/10 rounded-lg transition-colors"
          onClick={() => toggleAccordionItem(4)}
        >
          <div className="flex justify-between">
            <span className="text-blue-100/90 hover:text-blue-50">
              Kako mogu da kupim članstvo na Insajder platformi?
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className={`size-6 transition-transform text-blue-400 ${
                openSections[4] ? "rotate-90" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5"
              />
            </svg>
          </div>
          <div
            className={`${
              openSections[4] ? "flex flex-col gap-y-2" : "hidden"
            } p-2 border-l-2 border-blue-500/30 bg-gradient-to-r from-blue-900/10 to-transparent m-2 rounded-r-lg`}
          >
            Za kupovinu Lite/Premium članstva, možete koristiti nekoliko opcija
            plačanja: PayPal, karticu ili uplatnicu.
            <div className="border-l-2 pl-2 bg-gray-900/20 rounded-sm border-emerald-500/30 hover:border-emerald-400/50 transition-colors">
              PayPal i kartica: Proces je brz i jednostavan. Potrebno je da
              pratite nekoliko koraka na sajtu i odmah ćete dobiti pristup
              premium sadržaju nakon potvrde uplate.
            </div>
            <div className="border-l-2 pl-2 bg-gray-900/20 rounded-sm border-emerald-500/30 hover:border-emerald-400/50 transition-colors">
              Uplatnica: Ako se odlučite za uplatu putem uplatnice, potrebno je
              da izvršite uplatu i zatim uploadujete sliku uplatnice na naš
              sajt. Nakon što primimo sliku, naši administratori će u što kraćem
              roku ažurirati vaš nalog i omogućiti vam pristup svim premium
              funkcijama.
            </div>
            <div className="border-l-2 pl-2 bg-gray-900/20 rounded-sm border-emerald-500/30 hover:border-emerald-400/50 transition-colors">
              Ukoliko imate bilo kakvih problema ili nedoumica tokom procesa
              kupovine, možete nas kontaktirati putem Instagram-a ili direktno
              putem kontakt forme na sajtu, i rado ćemo vam pomoći.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
