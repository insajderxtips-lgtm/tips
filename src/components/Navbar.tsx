import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import logo from "../assets/insider_logo.png";
import { RootState } from "../redux/store";

const NAV_ITEMS = [
  { text: "Početna", url: "/" },
  { text: "O nama", url: "/onama" },
];

export default function Navbar(): React.ReactNode {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedUrl, setSelectedUrl] = useState<string>("");
  const userData = useSelector((state: RootState) => state.user);

  useEffect(() => {
    setSelectedUrl(location.pathname);
  }, [location.pathname]);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="fixed left-0 top-0 z-[100] w-full px-3 py-4 md:px-6 md:py-6"
    >
      <div className="mx-auto max-w-7xl">
        <div className="relative flex h-16 items-center justify-between rounded-[1.5rem] border border-[#1a3050] bg-[#07131f]/60 px-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl md:h-20 md:rounded-[2.5rem] md:px-6">
          {/* Left: Logo */}
          <div className="flex flex-1 items-center">
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="cursor-pointer"
            >
              <img
                src={logo}
                alt="Logo"
                className="h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(56,189,248,0.3)] md:h-14 md:w-14"
              />
            </motion.div>
          </div>

          {/* Middle: Navigation */}
          <div className="flex items-center gap-5 md:gap-10">
            {NAV_ITEMS.map((item) => {
              const active = selectedUrl === item.url;
              return (
                <Link
                  key={item.url}
                  to={item.url}
                  className={`relative text-[10px] font-black uppercase tracking-[0.25em] transition-colors duration-300 md:text-xs ${
                    active ? "text-white" : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {item.text}
                  {active && (
                    <motion.span
                      layoutId="navbar-active"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-sky-500 shadow-[0_0_8px_#38bdf8]"
                    />
                  )}
                </Link>
              );
            })}

            <Link
              to="/login"
              className="hidden text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 transition-all hover:text-amber-200 hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.4)] md:text-xs lg:block"
            >
              PRISTUP
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-1 items-center justify-end gap-3">
            {!userData.username ? (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/login")}
                className="group relative flex items-center justify-center overflow-hidden rounded-xl px-5 py-2 md:rounded-2xl md:px-8 md:py-3"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 group-hover:from-sky-400 group-hover:to-blue-500" />
                <span className="relative z-10 text-[10px] font-black uppercase tracking-tighter text-white md:text-xs">
                  Uloguj se
                </span>
              </motion.button>
            ) : (
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/profile")}
                className="group flex cursor-pointer items-center gap-3"
              >
                <span className="hidden text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-white md:block">
                  {userData.username}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-blue-500 to-indigo-700 shadow-lg md:h-10 md:w-10">
                  <span className="text-xs font-black text-white">{userData.username[0].toUpperCase()}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
