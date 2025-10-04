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
      <div className="flex flex-col gap-6 p-8  mx-auto bg-gray-900/80 text-white rounded-2xl shadow-2xl shadow-blue-500/10 border border-blue-500/20 backdrop-blur-lg">
        {/* Header with Icon */}
        <div className="text-center">
          <div className="inline-block p-3 bg-blue-500/10 rounded-full mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            Resetuj Svoju Šifru
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Unesite email da dobijete link za reset.
          </p>
        </div>

        {/* Email Input with Icon */}
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <input
            type="email"
            placeholder="Email adresa"
            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:border-blue-500 placeholder-gray-500 transition-all duration-300"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <button
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-blue-500/40 active:scale-95"
          onClick={handleReset}
        >
          <span className="drop-shadow-md">Resetuj šifru</span>
        </button>

        {/* Status Message */}
        {status && (
          <div
            className={`flex items-center gap-3 p-3 rounded-lg text-sm border ${
              status.startsWith("Uspe")
                ? "text-green-400 bg-green-900/50 border-green-700"
                : "text-red-400 bg-red-900/50 border-red-700"
            }`}
          >
            {status.startsWith("Uspe") ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{status}</span>
          </div>
        )}

        {/* Back to Login Link */}
        <div className="text-center">
          <button
            className="text-sm text-gray-400 hover:text-white hover:underline transition-colors duration-300 group"
            onClick={() => setView("login")}
          >
            Nazad na login
            <span className="ml-1 group-hover:translate-x-1 inline-block transition-transform duration-200">
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
