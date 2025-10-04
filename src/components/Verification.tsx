import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setUser } from "../redux/slices/UserSlice";
import { useNavigate } from "react-router";

const Verifikacija: React.FC = () => {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"success" | "error" | null>(null);

  const email = useSelector((state: RootState) => state.user?.email);
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const nav = useNavigate();

  const handleVerify = async () => {
    setMessage("");
    setStatus(null);

    if (!code || !email) {
      setStatus("error");
      setMessage("❌ Došlo je do greške. Unesite kod ili se ulogujte opet.");
      return;
    }

    try {
      const res = await fetch("/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(`❌ ${data.message || "Greška pri verifikaciji."}`);
        return;
      }

      setStatus("success");
      setMessage("✅ Uspešno ste verifikovali nalog!");
      dispatch(setUser({ ...user, isVerified: true }));
      nav("/");
    } catch (err) {
      console.error("Greška:", err);
      setStatus("error");
      setMessage("❌ Došlo je do greške na mreži ili serveru.");
    }
  };

  const handleResend = () => {
    // TODO: Replace with actual /resend-code API call
    setStatus("success");
    setMessage("📨 Novi kod je poslat.");
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4">
      <div className="bg-gray-900 text-white rounded-2xl p-8 shadow-2xl w-full max-w-md animate-fade-in">
        <h1 className="text-3xl font-bold mb-4 text-center text-purple-300">
          Potvrdi Email
        </h1>

        <p className="text-gray-400 text-sm text-center mb-6">
          Unesite verifikacioni kod koji smo vam poslali na email.
        </p>
        <p className="text-gray-400 text-sm text-center mb-6">
          Ukoliko nema koda, proverite spam poruke ili posaljite opet.
        </p>

        <input
          type="text"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Unesi kod"
          className="w-full p-3 mb-4 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          onClick={handleVerify}
          className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-200 p-3 rounded-lg font-semibold"
        >
          Potvrdi Kod
        </button>

        {message && (
          <div
            className={`mt-4 text-center text-sm ${
              status === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            className="text-sm text-purple-400 hover:underline"
            onClick={handleResend}
          >
            Nisam dobio kod? Pošalji ponovo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Verifikacija;
