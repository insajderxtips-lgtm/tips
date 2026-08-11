import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

const DIGITS = [
  { char: "4", className: "text-white" },
  { char: "0", className: "bg-gradient-to-b from-blue-400 to-indigo-500 bg-clip-text text-transparent" },
  { char: "4", className: "text-white" },
];

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Stranica nije pronadjena.";
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020b18] p-6">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-blue-600/12 blur-3xl"
      />

      <div className="relative z-10 max-w-2xl text-center">
        <div className="mb-12 flex justify-center">
          {DIGITS.map((d, i) => (
            <motion.span
              key={i}
              className={`inline-block text-[120px] font-black leading-none md:text-[180px] ${d.className}`}
              animate={{ y: [0, -18, 0] }}
              transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
            >
              {d.char}
            </motion.span>
          ))}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 text-3xl font-bold text-white md:text-4xl"
        >
          Ova stranica <span className="text-blue-400">nije pronadjena.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mb-10 max-w-lg text-lg text-slate-400"
        >
          Tražena stranica ne postoji ili je privremeno nedostupna
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col justify-center gap-4 sm:flex-row"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(-1)}
            className="rounded-xl border border-[#1a3050] bg-[#0b1c2e] px-8 py-3 text-white transition-colors hover:border-[#2a4d75] hover:bg-[#0d2035]"
          >
            Nazad
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/")}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-white shadow-lg shadow-blue-900/30 transition-shadow hover:shadow-[0_0_24px_rgba(59,130,246,0.4)]"
          >
            Pocetna
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
