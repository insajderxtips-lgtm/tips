import { useState } from "react";
import { useNavigate } from "react-router";

export default function ResetPassword({ view, setView }) {
  const nav = useNavigate();
  const [status, setStatus] = useState(null);
  const [email, setEmail] = useState(null);
  const handleReset = async () => {
    setStatus(null);
    if (
      !email ||
      !email.includes("@") ||
      email.length <= 4 ||
      !email.includes(".")
    ) {
      setStatus(
        "Molimo Vas, unesite email adresu naloga kojem zelite promeniti sifru."
      );
      return;
    }
    const response = await fetch("/requestPasswordResetCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Došlo je do greške.");
    }

    setStatus(
      "Uspešno smo poslali link za reset lozinke. Proverite svoju email poštu (uključujući SPAM)."
    );
  };
  return (
    <div>
      <div className="flex flex-col gap-5 p-8 max-w-md mx-auto bg-gray-900 text-white rounded-xl shadow-2xl min-w-full border border-gray-800 backdrop-blur-sm bg-opacity-90">
        <span className="text-center text-2xl font-bold bg-gradient-to-r from-blue-400 to-gray-400 bg-clip-text text-transparent">
          Resetuj svoju šifru
        </span>

        <div className="relative">
          <input
            type="email"
            placeholder="Email adresa"
            className="w-full px-5 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 transition-all duration-200"
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="absolute inset-0 rounded-lg border border-blue-500 opacity-0 hover:opacity-30 pointer-events-none transition-opacity duration-300"></div>
        </div>

        <button
          className="w-full bg-gradient-to-r from-blue-600 to-gray-600 hover:from-blue-500 hover:to-gray-900 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-blue-500/20 active:scale-95"
          onClick={handleReset}
        >
          <span className="drop-shadow-md">Resetuj šifru</span>
        </button>

        <div
          className="text-center py-2 px-4 rounded-md transition-colors duration-300 text-gray-400 hover:text-white cursor-pointer group"
          onClick={() => setView("login")}
        >
          <span className="group-hover:underline">Nazad na login</span>
          <span className="ml-2 group-hover:translate-x-1 inline-block transition-transform">
            →
          </span>
        </div>

        {status && (
          <div
            className={`mt-2 p-3  rounded-lg  text-sm animate-pulse ${
              status.startsWith("Uspe")
                ? "border text-green-500 bg-green-900/50 border-green-700"
                : "text-red-500 bg-red-900/50 border-red-700"
            }`}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
