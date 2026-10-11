import { useLocation, useNavigate } from "react-router";
import { useState, ReactNode, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

const logout = () => ({ type: "user/logout" });

type RootState = {
  user: {
    tier: string;
  };
};

const LINKS = [
  {
    path: "/",
    label: "Početna",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    path: "/freetips",
    label: "Free Tipovi",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />,
  },
  {
    path: "/premiumtips",
    label: "Premium Tipovi",
    isPremium: true,
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
  },
  {
    path: "/statistike",
    label: "Moje Statistike",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  },
  {
    path: "/arbitragebetting",
    label: "Arbitražno Klađenje",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
  },
  {
    path: "/najboljekvote",
    label: "Najbolje Kvote",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />,
  },
];

// Framer-motion variants for staggered nav reveal.
const navContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
};
const navItem = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export default function Sidebar(): ReactNode {
  const currentUser = useSelector((state: RootState) => state.user);
  const nav = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const currentPath = location.pathname;

  const handleLogOff = useCallback(() => {
    dispatch(logout());
    nav("/");
  }, [dispatch, nav]);

  const handleNavigation = useCallback(
    (path: string) => {
      nav(path);
      if (window.innerWidth < 640) setSidebarVisible(false);
    },
    [nav]
  );

  const isFreeTier = useMemo(() => currentUser?.tier?.trim().toLowerCase() === "free", [currentUser?.tier]);

  return (
    <>
      {/* ── HAMBURGER TRIGGER ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {!sidebarVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-[#1a3050] bg-[#0b1c32]/80 text-white shadow-lg shadow-black/40 backdrop-blur-md transition-colors hover:border-[#2a4d75]"
            onClick={() => setSidebarVisible(true)}
            aria-label="Otvori meni"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sidebarVisible && (
          <>
            {/* ── BACKDROP ──────────────────────────────────────────────────────
               Plain opaque scrim — no backdrop-filter. backdrop-blur is recomputed
               every frame on mobile and was the main cause of the laggy open. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarVisible(false)}
              className="fixed inset-0 z-40 bg-black/65"
            />

            {/* ── PANEL ─────────────────────────────────────────────────────────
               Opaque background (no backdrop-blur) so the slide is a pure
               transform — cheap to composite on phones. */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              style={{ willChange: "transform" }}
              className="fixed left-0 top-0 z-50 flex h-full w-[280px] select-none flex-col overflow-hidden border-r border-[#1a3050] bg-[#07131f] shadow-2xl shadow-black/60"
            >
              {/* ── HEADER ──────────────────────────────────────────────────── */}
              <div className="relative flex shrink-0 items-center justify-between border-b border-[#1a3050] p-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group flex cursor-pointer items-center gap-2.5"
                  onClick={() => handleNavigation("/")}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg shadow-emerald-900/30 transition-transform group-hover:rotate-6">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 2L4.5 13.5H11L10 22L20.5 10.5H14L13 2Z" />
                    </svg>
                  </div>
                  <span className="text-lg font-black tracking-tight text-white">
                    INSAJDER<span className="text-emerald-400">TIPS</span>
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-[#1a3050]/60 hover:text-white"
                  onClick={() => setSidebarVisible(false)}
                  aria-label="Zatvori meni"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* ── NAV ─────────────────────────────────────────────────────── */}
              <motion.nav
                variants={navContainer}
                initial="hidden"
                animate="visible"
                className="relative flex-grow space-y-1.5 overflow-y-auto p-4"
              >
                {LINKS.map((link) => {
                  const isActive = currentPath === link.path;
                  const premium = link.isPremium;

                  const textClass = isActive
                    ? premium
                      ? "text-amber-300 font-bold"
                      : "text-white font-semibold"
                    : premium
                    ? "text-amber-400 font-bold hover:text-amber-300"
                    : "text-slate-400 font-medium hover:text-white";

                  return (
                    <motion.button
                      key={link.path}
                      variants={navItem}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavigation(link.path)}
                      className={`group relative flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors duration-200 focus:outline-none ${textClass}`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                          className={`absolute inset-0 rounded-xl border-l-4 ${
                            premium
                              ? "border-amber-400 bg-amber-500/10"
                              : "border-cyan-400 bg-cyan-500/10"
                          }`}
                        />
                      )}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-xl bg-[#1a3050]/0 transition-colors group-hover:bg-[#1a3050]/40" />
                      )}
                      <svg className="relative z-10 h-6 w-6 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {link.icon}
                      </svg>
                      <span className="relative z-10">{link.label}</span>
                      {premium && (
                        <span className="relative z-10 ml-auto rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-400">
                        P
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </motion.nav>

              {/* ── FOOTER ──────────────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="relative mt-auto shrink-0"
              >
                {isFreeTier && (
                  <div className="p-4">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleNavigation("/kupi")}
                      className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-4 py-3 font-bold text-white shadow-lg shadow-amber-900/30 transition-shadow hover:shadow-amber-500/40"
                    >
                      {/* Sweeping shine */}
                      <motion.div
                        className="absolute inset-0 -skew-x-12 bg-white/25"
                        initial={{ x: "-150%" }}
                        animate={{ x: "150%" }}
                        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
                        style={{ width: "40%" }}
                      />
                      <svg className="relative h-6 w-6 transition-transform group-hover:rotate-12" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="relative text-lg">Kupi Premium</span>
                    </motion.button>
                  </div>
                )}

                <div className="space-y-4 border-t border-[#1a3050] p-4">
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleNavigation("/my-account")}
                      className="group flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0b1c2e] py-2.5 px-3 font-medium text-slate-300 transition-colors hover:bg-[#0d2035] hover:text-white"
                    >
                      <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span>Nalog</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={handleLogOff}
                      className="group rounded-lg bg-red-950/50 p-2.5 text-red-400 transition-colors hover:bg-red-900/60 hover:text-red-300"
                      aria-label="Odjavi se"
                    >
                      <svg className="h-5 w-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                    </motion.button>
                  </div>
                  <div className="pt-1 text-center text-[10px] text-slate-500">
                    <a href="mailto:insajderxtips@gmail.com" className="transition-colors hover:text-slate-300">
                      insajderxtips@gmail.com
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
