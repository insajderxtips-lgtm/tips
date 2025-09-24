import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useOutlet, useParams } from "react-router";
import { RootState } from "../redux/store";
import uplatnica from "../assets/uplatnica.jpg";

export default function HowToPurchase() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const loggedIn = useSelector(
    (state: RootState) => state.user.isAuthenticated
  );
  const tier = useSelector((state: RootState) => state.user.tier);
  if (tier === "premium") {
    return (
      <div className="w-full h-full flex justify-center items-center bg-gradient-to-br from-gray-950 to-blue-950">
        <div className="max-w-md p-8 rounded-xl shadow-lg bg-gray-900 text-center animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Premium</h2>
          <p className="text-purple-600 mb-6">Vi ste vec Premium korisnik!</p>
          <p className="text-gray-400 mb-6">
            Hvala Vam za pretplatu na InsajderTips.
          </p>
        </div>
      </div>
    );
  }
  const paymentData = [
    {
      title: "Western Union",
      description:
        "Proces je brz i jednostavan. Potrebno je da pratite nekoliko koraka na sajtu i odmah ćete dobiti pristup premium sadržaju nakon potvrde uplate.",
      url: "/kupi/western",
    },
    {
      title: "Uplatnica",
      description:
        "Potrebno je da izvršite uplatu i zatim uploadujete sliku uplatnice na naš sajt. Nakon što primimo sliku, naši administratori će u što kraćem roku ažurirati vaš nalog i omogućiti vam pristup svim premium funkcijama.",
      url: "/kupi/uplatnica",
    },
    {
      title: "Kartica",
      description:
        "Kupovina karticom se vrsi preko Stripe sigurne platforme. Nakon uspesne transakcije Premium pretplata ce automatski biti aktivirana.",
      url: "/kupi/kartica",
    },
  ];
  const outlet = useOutlet();
  const nav = useNavigate();
  return (
    <div className="w-full min-h-screen  md:p-6 flex flex-col items-center justify-center">
      <div className="md:max-w-4xl w-full  backdrop-blur-lg p-8 rounded-2xl shadow-2xl shadow-blue-950/50 text-white">
        {outlet ? (
          outlet
        ) : (
          <>
            <h2 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
              Kako mogu da kupim članarinu?
            </h2>

            <div className="mb-8 text-center">
              <p className="text-xl text-cyan-200 mb-4">
                Odaberite preferirani način plaćanja
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {paymentData.map((paymentMethod, index) => (
                <div
                  key={index}
                  className={`group relative p-6 rounded-xl transition-all duration-300 cursor-pointer
                  ${
                    selectedOption === index
                      ? "bg-gradient-to-br from-cyan-700/30 to-blue-700/30 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                      : "bg-gray-900/30 hover:bg-gray-800/50 border-2 border-transparent hover:border-cyan-500/30"
                  }`}
                  onClick={() => setSelectedOption(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className={`text-xl font-semibold mb-1 ${
                          selectedOption === index
                            ? "text-cyan-400"
                            : "text-white"
                        }`}
                      >
                        {paymentMethod.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {paymentMethod.description}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center 
                    ${selectedOption === index ? "bg-cyan-500" : "bg-gray-700"} 
                    transition-colors duration-300`}
                    >
                      {selectedOption === index && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  {selectedOption === index && (
                    <div className="absolute -inset-1 rounded-xl bg-cyan-500/10 blur-md z-[-1]" />
                  )}
                </div>
              ))}
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-cyan-500/80 italic">
                <span className="text-cyan-400">Napomena:</span> Odaberite
                željeni način plaćanja za nastavak.
              </p>

              <button
                className={`w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2
                ${
                  selectedOption === null
                    ? "bg-gray-700/30 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transform hover:-translate-y-0.5 shadow-lg hover:shadow-cyan-500/30"
                }`}
                onClick={() =>
                  loggedIn
                    ? nav(`${paymentData[selectedOption].url}`, {
                        state: { selectedOption },
                      })
                    : nav("/login")
                }
              >
                {selectedOption !== null && (
                  <svg
                    className="w-5 h-5 animate-bounce"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                )}
                {selectedOption === null
                  ? "Odaberite opciju prvo"
                  : "Nastavi na plaćanje"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
export function StepTwo() {
  const { paymentOption } = useParams();
  const [view, setView] = useState(1);
  const [mtcn, setMtcn] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ success: null, message: "" });
  const email = useSelector((state: RootState) => state?.user?.email);
  const username = useSelector((state: RootState) => state?.user?.username);

  const validateWestern = async () => {
    if (
      !mtcn ||
      mtcn.length !== 10 ||
      [...mtcn].some((char) => isNaN(Number(char)))
    ) {
      setStatus({
        success: false,
        message: "MTCN mora imati tačno 10 cifara (samo brojevi)",
      });
      return;
    }

    setIsLoading(true);
    setStatus({ success: null, message: "" });

    try {
      const response = await fetch("/addPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: email,
          userName: username,
          paymentType: "western",
          mtcn: mtcn,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          success: true,
          message:
            "Uspešno potvrđeno! Premium će biti aktiviran u roku od 24h.",
        });
      } else {
        throw new Error(data.message || "Došlo je do greške pri obradi uplate");
      }
    } catch (error) {
      setStatus({
        success: false,
        message: error.message || "Došlo je do greške pri slanju podataka",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const resetFlow = () => {
    setMtcn(null);
    setView(1);
    setStatus({ success: null, message: "" });
  };

  const renderPaymentContent = () => {
    switch (paymentOption) {
      case "uplatnica":
        return <StepOne />;

      case "western":
        if (view === 1) {
          return (
            <div className="w-full  text-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl shadow-blue-950/50 border border-cyan-500/50 bg-gradient-to-br from-blue-900/30 to-blue-950/50">
              {/* Title */}
              <h2 className="text-center text-2xl md:text-3xl font-bold mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                Western Union plaćanje
              </h2>

              <div className="flex flex-col items-center gap-4 md:gap-6">
                {/* Instructions Box */}
                <div className="p-4 md:p-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 rounded-lg md:rounded-2xl border border-cyan-800/30 w-full max-w-xs md:max-w-md">
                  <div className="flex items-center justify-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="text-xl md:text-2xl font-bold">
                      Uputstvo za plaćanje
                    </div>
                  </div>

                  <ol className="space-y-3 text-sm md:text-base text-blue-100">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 font-bold">1.</span>
                      <span>
                        Idite do najbliže <strong>menjačnice</strong> ili{" "}
                        <strong>pošte</strong> koja prima Western Union uplate
                        (ili{" "}
                        <strong>
                          preko{" "}
                          <span className="text-gold cursor-pointer">
                            sajta.
                          </span>
                        </strong>
                        )
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 font-bold">2.</span>
                      <span>
                        Recite da želite da <strong>pošaljete novac</strong>{" "}
                        putem Western Uniona
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 font-bold">3.</span>
                      <span>
                        Nakon uplate, dobicete 10-cifreni MTCN broj koji
                        identifikuje vas transfer, sacuvajte ga.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 font-bold">4.</span>
                      <span>
                        Nakon svega, stisnite na dugme ispod 'Nastavi na
                        potvrdu'.
                      </span>
                    </li>
                  </ol>

                  <div className="mt-4 p-3 bg-blue-800/20 rounded-lg border border-blue-700/30">
                    <p className="text-xs md:text-sm text-blue-200">
                      <strong>Napomena:</strong> Nakon što uploadujete potvrdu,
                      proverićemo vašu uplatu i aktivirati premium nalog u roku
                      od 24h.
                    </p>
                  </div>
                </div>

                {/* Payment Details Box */}
                <div className="p-4 md:p-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 rounded-lg md:rounded-2xl border border-cyan-800/30 w-full max-w-xs md:max-w-md">
                  <h3 className="text-center text-lg md:text-xl font-bold mb-3 text-yellow-400">
                    Podaci za uplatu
                  </h3>
                  <div className="space-y-2 text-sm md:text-base">
                    <div className="flex justify-between">
                      <span className="text-blue-200">Primaoc:</span>
                      <span className="font-mono">[Bogdan Djakovic]</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Država:</span>
                      <span>Srbija</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Iznos:</span>
                      <span className="font-bold text-yellow-400">
                        29.99 EUR (3500 RSD)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Continue Button */}
                <button
                  onClick={() => setView(2)}
                  className="bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 px-6 py-3 md:px-8 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base text-black font-semibold transition-all duration-300 hover:shadow-lg md:hover:shadow-2xl hover:shadow-yellow-500/30 w-full max-w-xs md:max-w-md flex items-center justify-center gap-2"
                >
                  Nastavi na potvrdu
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        } else if (view === 2) {
          if (status.success) {
            return (
              <div className="w-full h-full flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {/* Header */}
                  <div className="bg-green-100 dark:bg-green-900/30 p-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      Uspešno poslato!
                    </h3>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-center">
                      Vaša uplata je potvrđena. Ukoliko je sve u redu, Premium
                      će biti aktiviran na vas nalog u sto kracem roku.
                    </p>
                    <div className="text-gray-400">
                      Ukoliko imate problema, javite se na nas email!
                    </div>
                    <div className="text-center">podrska@insajder.tips</div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Broj transakcije (MTCN):
                      </p>
                      <p className="font-mono text-lg text-gray-800 dark:text-gray-100">
                        {mtcn}
                      </p>
                    </div>

                    <button
                      onClick={resetFlow}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                    >
                      Zatvori
                    </button>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div className="w-full text-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl shadow-blue-950/50 border border-cyan-500/50 bg-gradient-to-br from-blue-900/30 to-blue-950/50">
                {/* Title */}
                <button
                  onClick={() => setView(1)}
                  className="bg-orange-500 rounded-md p-2 cursor-pointer my-2"
                >
                  Nazad
                </button>
                <h2 className="text-center text-2xl md:text-3xl font-bold mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                  Unesite MTCN broj
                </h2>

                <div className="flex flex-col items-center gap-6 md:gap-8">
                  {/* Instruction Card */}
                  <div className="p-4 md:p-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 rounded-lg md:rounded-2xl border border-cyan-800/30 w-full max-w-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-yellow-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-yellow-400">
                        Gde da nađem MTCN broj?
                      </h3>
                    </div>
                    <p className="text-sm md:text-base text-blue-100">
                      MTCN (Money Transfer Control Number) je{" "}
                      <strong>10-cifreni broj</strong> koji se nalazi na vašoj
                      WU potvrdi. To je jedinstveni broj koji nam omogućava da
                      proverimo vašu uplatu.
                    </p>
                  </div>

                  {/* MTCN Input Form */}
                  <div className="w-full max-w-md space-y-6">
                    <div className="relative">
                      <label
                        htmlFor="mtcn"
                        className="block text-sm font-medium text-blue-200 mb-2"
                      >
                        Unesite MTCN broj:
                      </label>
                      <div className="relative">
                        <input
                          onChange={(e) => setMtcn(e.target.value)}
                          type="text"
                          id="mtcn"
                          name="mtcn"
                          maxLength={10}
                          placeholder="1234567890"
                          className="w-full px-4 py-3 md:px-5 md:py-4 bg-blue-900/30 border border-cyan-500/50 rounded-lg md:rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono text-lg"
                          pattern="\d{10}"
                          required
                        />
                        <div className="absolute right-3 top-3.5 text-blue-300">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-blue-300">
                        Mora tačno 10 cifara (bez razmaka ili crtica)
                      </p>
                    </div>

                    {status.message && (
                      <div className="bg-blue-900 p-2 mx-auto text-center rounded-full">
                        {status?.message}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      onClick={validateWestern}
                      className="w-full bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 px-6 py-3 md:px-8 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base text-black font-semibold transition-all duration-300 hover:shadow-lg md:hover:shadow-2xl hover:shadow-yellow-500/30 flex items-center justify-center gap-2 mt-4"
                    >
                      Potvrdi uplatu
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          }
        }

      case "kartica":
        return (
          <div className="w-full bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] text-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl shadow-blue-950/50 border border-purple-500/50">
            <h2 className="text-center text-2xl md:text-3xl font-bold mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              Kreditna/Debitna kartica
            </h2>

            <div className="flex flex-col items-center gap-4 md:gap-6">
              <div className="p-4 md:p-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 rounded-lg md:rounded-2xl border border-cyan-800/30 w-full max-w-xs md:max-w-md">
                <div className="flex items-center justify-center gap-3 md:gap-4 mb-3 md:mb-4">
                  <span className="text-3xl md:text-4xl">💳</span>
                  <div className="text-xl md:text-2xl font-bold">
                    Sigurna transakcija
                  </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-2 text-purple-400 text-sm md:text-base">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span>3D Secure protekcija</span>
                  </div>
                  <div className="flex items-center gap-2 text-pink-400 text-sm md:text-base">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>PCI DSS sertifikovano</span>
                  </div>
                </div>
              </div>

              <button className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-3 md:px-8 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base text-white font-semibold transition-all duration-300 hover:shadow-lg md:hover:shadow-2xl hover:shadow-purple-500/30 w-full max-w-xs md:max-w-md flex items-center justify-center gap-2">
                <span className="text-xl md:text-2xl">🔒</span>
                Nastavi na plaćanje
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full max-w-xs md:max-w-md mx-auto p-4 md:p-6 bg-gradient-to-br from-red-900/30 to-rose-900/20 rounded-lg md:rounded-2xl border-2 border-red-800/50 text-center">
            <div className="text-red-400 text-4xl md:text-6xl mb-3 md:mb-4">
              ⚠️
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-red-400 mb-2">
              Greška pri plaćanju
            </h2>
            <p className="text-xs md:text-sm text-red-300">
              Odabrani način plaćanja nije validan. Molimo vratite se nazad i
              pokušajte ponovo.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-full   md:p-6 flex flex-col items-center justify-center ">
      <div className="w-full  max-w-md md:max-w-lg lg:max-w-2xl">
        {renderPaymentContent()}
      </div>
    </div>
  );
}
export function StepOne() {
  const [currentImage, setCurrentImage] = useState(null);
  const userEmail = useSelector((state: RootState) => state?.user?.email);
  const username = useSelector((state: RootState) => state?.user?.username);
  const [status, setStatus] = useState({ status: null, message: null });
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    setStatus({ status: null, message: null });
  }, [currentImage]);
  const confirmPayment = async () => {
    if (!currentImage || !userEmail) {
      console.error("Missing image or email");
      return;
    }
    setUploading(true);
    setStatus({ status: null, message: null });

    const formData = new FormData();
    formData.append("image", currentImage);

    try {
      // 1. Upload to ImgBB
      const imgbbResponse = await fetch(
        `https://api.imgbb.com/1/upload?key=5af3555a7b86283ddc9c73904655cb26`,
        {
          method: "POST",
          body: formData,
        }
      );

      const imgbbData = await imgbbResponse.json();

      if (!imgbbData.success) {
        setStatus({
          status: 400,
          message:
            "Doslo je do greske sa uploadovanjem slike. Molimo kontaktirajte podrsku (podrska@insajder.tips)",
        });
        setUploading(false);
        throw new Error(imgbbData.error?.message || "Image upload failed");
      }

      // 2. Save to your backend
      const backendResponse = await fetch("/addPayment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: userEmail,
          userName: username,
          paymentType: "uplatnica",
          imageUrl: imgbbData.data.display_url,
        }),
      });

      const backendData = await backendResponse.json();

      if (!backendResponse.ok) {
        setUploading(false);
        setStatus({
          status: 400,
          message:
            "Doslo je do greske sa uploadovanjem slike. Molimo kontaktirajte podrsku (podrska@insajder.tips)",
        });
        throw new Error(backendData.message || "Failed to save payment");
      }

      console.log("Payment successfully processed!", backendData);
      setUploading(false);
      setStatus({
        status: 200,
        message:
          "Uspesno ste poslali sliku nasim administratorima! Ukoliko je sve u redu, Premium ce biti aktiviran u sto kracem mogucem roku.",
      });
      // Add success notification here
    } catch (err) {
      setStatus({
        status: 400,
        message:
          "Vec ste nam poslali sliku uplatnice u poslednja 24h. Ukoliko imate problema, javite nam se (podrska@insajder.tips)",
      });
      setUploading(false);
      // Add error notification here
    }
  };
  return (
    <div className="w-full min-h-screen md:p-6 flex flex-col items-center justify-center">
      <div className="w-full text-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl shadow-blue-950/50 border border-cyan-500/50">
        <h2 className="text-center text-2xl md:text-3xl font-bold mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Insajder clanarina
        </h2>

        <img src={uplatnica} />

        {/* Instructions */}
        <div className="space-y-4 md:space-y-6">
          <h3 className="text-lg md:text-xl font-semibold text-cyan-400 mb-2 md:mb-3 my-2">
            Uputstvo
          </h3>

          {[
            {
              number: 1,
              title: "Unos podataka",
              text: "Unesite sve podatke kako su i na slici, uverite se dvaputa. (Ziro = 160-6000001475315-20)",
            },
            {
              number: 2,
              title: "Uplata",
              text: "Nakon sto ste upisali sve podatke na uplatnicu, uplatite iznos u najblizoj banci, menjacnici ili posti.",
            },
            {
              number: 3,
              title: "Slanje dokaza",
              text: "Nakon uplate potrebno je slikati uplatnicu sa pecatom i stisnuti na nastavi (ispod) ili ovde.",
            },
          ].map((step) => (
            <div
              key={step.number}
              className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 rounded-lg md:rounded-xl border border-cyan-800/30"
            >
              <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm md:text-base">
                {step.number}
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-cyan-400 mb-1 md:mb-2">
                  {step.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-300">{step.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="mt-6 md:mt-8 flex flex-col items-center gap-4">
          {/* Main button with hidden file input */}
          <div className="relative w-full">
            <button className="w-full bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-6 py-3 md:px-8 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base text-white font-semibold transition-all duration-300 hover:shadow-lg md:hover:shadow-2xl hover:shadow-green-500/30 flex items-center justify-center gap-2 group">
              <span>Nastavi na slanje uplatnice</span>
              <svg
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>

            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="paymentFileInput"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setCurrentImage(e.target.files[0]);
                  // Optional: auto-submit or show preview
                }
              }}
              accept="image/*,.pdf" // Specify accepted file types
            />
          </div>

          {/* File name display (appears after selection) */}
          {currentImage && (
            <>
              <div className="flex items-center gap-2 text-sm text-emerald-500 bg-gray-900/50 border px-4 py-2 rounded-lg">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>{currentImage.name}</span>
                <button
                  onClick={() => setCurrentImage(null)}
                  className="text-emerald-500 hover:text-emerald-700 ml-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <button
                className={`
    w-full p-2 rounded-md text-center transition-all duration-200
    ${
      uploading
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer shadow-md hover:shadow-lg"
    }
    flex items-center justify-center gap-2
  `}
                disabled={uploading}
                onClick={confirmPayment}
              >
                {uploading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Šaljem...</span>
                  </>
                ) : (
                  "KLIKNI OVDE DA POŠALJEŠ!"
                )}
              </button>
              {status.message && (
                <div
                  className={`${
                    status.message.startsWith("Vec")
                      ? "text-red-500"
                      : "text-green-500"
                  } font-bold text-center`}
                >
                  {status.message}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
