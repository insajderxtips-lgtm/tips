import React, { useState, useRef, ClipboardEvent, KeyboardEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setUser } from "../redux/slices/UserSlice";
import { useNavigate } from "react-router";

const Verifikacija: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "">("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = useSelector((state: RootState) => state.user?.email);
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const nav = useNavigate();

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    if (paste.length === 6 && /^\d+$/.test(paste)) {
      const newOtp = paste.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    setMessage("");
    setStatus("");

    const finalCode = otp.join("");

    if (finalCode.length < 6 || !email) {
      setStatus("error");
      setMessage("Došlo je do greške. Unesite kompletan kod.");
      return;
    }

    try {
      const res = await fetch("/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: finalCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Greška pri verifikaciji.");
        return;
      }

      setStatus("success");
      setMessage("Uspešno ste verifikovali nalog!");
      dispatch(setUser({ ...user, isVerified: true }));

      setTimeout(() => {
        nav("/");
      }, 1500);
    } catch (err) {
      console.error("Greška:", err);
      setStatus("error");
      setMessage("Došlo je do greške na mreži ili serveru.");
    }
  };

  const handleResend = async () => {
    if (!email) {
      setStatus("error");
      setMessage("Email nije dostupan.");
      return;
    }

    if (resendDisabled) return;

    setResendDisabled(true);
    setTimeout(() => setResendDisabled(false), 30000); // 30s cooldown

    try {
      const res = await fetch("/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Greška pri slanju koda.");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Novi kod je poslat na vašu email adresu.");

      // Optionally, clear OTP inputs after resending
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error("Greška:", err);
      setStatus("error");
      setMessage("Došlo je do greške na mreži ili serveru.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4 bg-slate-950">
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] [mask-image:linear-gradient(to_bottom,white_40%,transparent_90%)]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-blue-900/30 rounded-full blur-3xl animate-pulse-slow"></div>

      <div className="relative w-full max-w-md">
        <div className="relative bg-black/60 backdrop-blur-2xl border-2 border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 text-center">
          <div className="mx-auto w-16 h-16 mb-6 flex items-center justify-center bg-slate-900/50 border-2 border-blue-800/50 rounded-2xl shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold mb-2 text-slate-100">
            Email Verifikacija
          </h1>

          <p className="text-slate-400 text-sm mb-8">
            Unesite 6-cifreni kod poslat na{" "}
            <span className="font-semibold text-blue-300">{email}</span>.
          </p>

          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
            {otp.map((data, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold text-slate-100 
                           bg-slate-900/70 border-2 border-slate-700 rounded-xl
                           focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 
                           transition-all duration-300 ease-in-out"
              />
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleVerify}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 p-3.5 rounded-xl font-bold text-lg
                         text-white shadow-lg shadow-blue-900/40 hover:shadow-indigo-900/40
                         transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
            >
              Potvrdi
            </button>

            <button
              onClick={handleResend}
              disabled={resendDisabled}
              className={`text-sm transition-colors duration-200 ${
                resendDisabled
                  ? "text-slate-700 cursor-not-allowed"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Niste dobili kod?{" "}
              <span className="font-semibold text-blue-400 hover:text-blue-300">
                Pošalji ponovo
              </span>
            </button>
          </div>

          {message && (
            <div className="mt-6">
              <div
                className={`p-3 rounded-lg border text-sm flex items-center justify-center gap-2
                ${
                  status === "success"
                    ? "bg-green-900/30 border-green-700 text-green-300"
                    : "bg-red-900/30 border-red-700 text-red-300"
                }`}
              >
                <span>{message}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verifikacija;
