import { useState } from "react";
import { useNavigate, useOutlet, useParams } from "react-router";

export default function HowToPurchase() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const paymentData = [
    {
      title: "PayPal",
      description:
        "Proces je brz i jednostavan. Potrebno je da pratite nekoliko koraka na sajtu i odmah ćete dobiti pristup premium sadržaju nakon potvrde uplate.",
      url: "/kupi/paypal",
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
    <div className="w-full min-h-screen  p-6 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full  backdrop-blur-lg p-8 rounded-2xl shadow-2xl shadow-blue-950/50 text-white">
        {outlet ? (
          outlet
        ) : (
          <>
            <h2 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
              Kako mogu da kupim članstvo?
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
                  nav(`${paymentData[selectedOption].url}`, {
                    state: { selectedOption },
                  })
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

  const renderPaymentContent = () => {
    switch (paymentOption) {
      case "uplatnica":
        return (
         <StepOne />
        );

      case "paypal":
        return (
          <div className="w-full  text-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl shadow-blue-950/50 border border-cyan-500/50">
            <h2 className="text-center text-2xl md:text-3xl font-bold mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
              PayPal plaćanje
            </h2>

            <div className="flex flex-col items-center gap-4 md:gap-6">
              <div className="p-4 md:p-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 rounded-lg md:rounded-2xl border border-cyan-800/30 w-full max-w-xs md:max-w-md">
                <div className="flex items-center justify-center gap-3 md:gap-4 mb-3 md:mb-4">
                  <span className="text-3xl md:text-4xl">🇵🇸</span>
                  <div className="text-xl md:text-2xl font-bold">PayPal</div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm md:text-base">
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
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    <span>Instant aktivacija</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400 text-sm md:text-base">
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
                    <span>256-bit SSL enkripcija</span>
                  </div>
                </div>
              </div>

              <button className="bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 px-6 py-3 md:px-8 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base text-black font-semibold transition-all duration-300 hover:shadow-lg md:hover:shadow-2xl hover:shadow-yellow-500/30 w-full max-w-xs md:max-w-md flex items-center justify-center gap-2">
                <span className="text-xl md:text-2xl">🇵🇸</span>
                Nastavi na PayPal
              </button>
            </div>
          </div>
        );

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
    <div className="w-full min-h-screen   md:p-6 flex flex-col items-center justify-center ">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-2xl">
        {renderPaymentContent()}
      </div>
    </div>
  );
}
export function StepOne() {
  const nav = useNavigate()
  return (
    <div className="w-full min-h-screen md:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-2xl text-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl shadow-blue-950/50 border border-cyan-500/50">
        <h2 className="text-center text-2xl md:text-3xl font-bold mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Insajder clanarina 
        </h2>

        {/* Uplatnica Example */}
        <div className="mb-6 md:mb-8 bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-black font-mono">
            <div className="flex justify-between border-b-2 border-black pb-2 mb-4">
              <div>
                <h3 className="font-bold text-lg">PRIMER UPLATNICE</h3>
                <p className="text-sm">Naziv primaoca: <span className="font-semibold">PREMIUM SERVIS DOO</span></p>
                <p className="text-sm">Adresa: <span className="font-semibold">Bulevar Kralja Aleksandra 123</span></p>
                <p className="text-sm">Šifra plaćanja: <span className="font-semibold">289</span></p>
              </div>
              <div className="text-right">
                <p className="text-sm">Broj računa: <span className="font-semibold">840-1234567890123-45</span></p>
                <p className="text-sm">Poziv na broj: <span className="font-semibold">123456789</span></p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm">Ime i prezime platoca:</p>
                <div className="h-6 border-b border-black mb-2"></div>
                <p className="text-sm">Adresa platoca:</p>
                <div className="h-6 border-b border-black mb-2"></div>
                <p className="text-sm">Svrha uplate:</p>
                <div className="h-6 border-b border-black font-semibold">PREMIUM ČLANARINA 12 MESECI</div>
              </div>
              <div className="text-right">
                <p className="text-sm">Iznos:</p>
                <div className="h-6 border-b border-black font-semibold text-lg">4,990.00 RSD</div>
                <p className="text-sm mt-4">Datum:</p>
                <div className="h-6 border-b border-black"></div>
              </div>
            </div>
            
            <div className="text-center text-xs mt-6">
              <p>Molimo popunite sve potrebne podatke i uplatite iznos na navedeni račun</p>
              <p className="mt-1">Nakon uplate, slikajte uplatnicu i otpremite je na sledećem koraku</p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-center mb-6 md:mb-8">
          <button className="bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-3 md:px-8 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base text-white font-semibold transition-all duration-300 hover:shadow-lg md:hover:shadow-2xl hover:shadow-cyan-500/30 w-full max-w-xs md:max-w-md flex items-center justify-center gap-2">
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Preuzmi primer uplatnice (PDF)
          </button>
        </div>

        {/* Instructions */}
        <div className="space-y-4 md:space-y-6">
          <h3 className="text-lg md:text-xl font-semibold text-cyan-400 mb-2 md:mb-3">Uputstvo</h3>
          
          {[
            {
              number: 1,
              title: "Unos podataka",
              text: "Unesite sve podatke kako su i na slici, uverite se dvaputa."
            },
            {
              number: 2,
              title: "Uplata",
              text: "Nakon sto ste upisali sve podatke na uplatnicu, uplatite iznos u najblizoj banci, menjacnici ili posti."
            },
            {
              number: 3,
              title: "Slanje dokaza",
              text: "Nakon uplate potrebno je slikati uplatnicu sa pecatom i stisnuti na nastavi (ispod) ili ovde."
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
                <p className="text-xs md:text-sm text-gray-300">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="mt-6 md:mt-8 flex justify-center">
          <button onClick={() => nav("potvrda")} className="bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-6 py-3 md:px-8 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base text-white font-semibold transition-all duration-300 hover:shadow-lg md:hover:shadow-2xl hover:shadow-green-500/30 w-full max-w-xs md:max-w-md flex items-center justify-center gap-2">
            Nastavi na slanje uplatnice
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
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}