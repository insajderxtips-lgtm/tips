import { useLocation, useNavigate } from "react-router";
import { useState, FC, ReactNode, useEffect } from "react";
import { useDispatch } from "react-redux";

// --- Mocking Redux and Assets for self-contained example ---

// In your actual app, you would import these from 'react-redux'
// For this example, we mock them to make the component runnable.

const useSelector = (selector: (state: any) => any) => {
  // Mock state that would come from your Redux store
  const mockState = {
    user: {
      tier: "free",
      // You can add other user properties here if needed
    },
  };
  return selector(mockState);
};

// Mock the logout action creator
const logout = () => ({ type: "user/logout" });

// Define a simple RootState type for the mock
type RootState = {
  user: {
    tier: string;
  };
};

// Replace the local logo import with a placeholder URL
const logo = "https://placehold.co/100x100/0E7490/FFFFFF?text=I";

// --- End of Mocking ---

export default function Sidebar(): ReactNode {
  const currentUser = useSelector((state: RootState) => state.user);

  const nav = useNavigate();
  const dispatch = useDispatch();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const LogOff = () => {
    dispatch(logout());
    nav("/");
  };

  const links = [
    {
      path: "/",
      label: "Početna",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
    },
    {
      path: "/freetips",
      label: "Free Tipovi",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      ),
    },
    {
      path: "/premiumtips",
      label: "Premium Tipovi",
      isPremium: true,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      ),
    },
    {
      path: "/statistike",
      label: "Moje Statistike",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
    },
    {
      path: "/arbitragebetting",
      label: "Arbitražno Klađenje",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      ),
    },
    {
      path: "/najboljekvote",
      label: "Najbolje Kvote",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h7"
        />
      ),
    },
  ];

  const baseLinkClasses =
    "flex items-center gap-4 py-3 px-4 rounded-lg transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-cyan-500";

  return (
    <>
      {!sidebarVisible && (
        <button
          className="fixed top-4 left-4 hover:scale-95 transition-transform bg-gray-800 p-2 cursor-pointer rounded-md z-40 sm:block opacity-80 border border-gray-700"
          onClick={() => setSidebarVisible(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      <div
        className={`bg-gray-900/90 backdrop-blur-xl transition-transform duration-300 ease-in-out border-r select-none border-cyan-500/20 fixed left-0 top-0 h-full w-[280px] flex flex-col z-50 shadow-2xl shadow-black/40
        ${sidebarVisible ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 shrink-0">
          <div
            className="cursor-pointer flex items-center gap-3 group mx-auto"
            onClick={() => nav("/")}
          >
            <span className="testFont text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">
              Insajder
            </span>
          </div>
          <button
            className="p-2 rounded-full text-gray-400 hover:bg-gray-800/60 hover:text-white transition-colors"
            onClick={() => setSidebarVisible(false)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const isActive = currentPath === link.path;
            let activeClasses, inactiveClasses;

            if (link.isPremium) {
              activeClasses =
                "bg-amber-500/10 text-amber-300 font-bold border-l-4 border-amber-400";
              inactiveClasses =
                "font-bold text-amber-400 hover:bg-amber-500/10 hover:text-amber-300";
            } else {
              activeClasses =
                "bg-cyan-500/10 text-cyan-300 font-semibold border-l-4 border-cyan-400";
              inactiveClasses =
                "text-gray-400 hover:bg-gray-800/60 hover:text-white font-medium";
            }

            return (
              <a
                key={link.path}
                role="button"
                onClick={() => {
                  nav(link.path);
                }}
                className={`${baseLinkClasses} ${
                  isActive ? activeClasses : inactiveClasses
                }`}
              >
                <svg
                  className="w-6 h-6 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {link.icon}
                </svg>
                <span>{link.label}</span>
              </a>
            );
          })}
        </nav>

        <>
          {/* The button is now correctly hidden for users with "PREMIUM" or "premium" tier */}
          {console.log("Tier value:", currentUser?.tier)}
          {currentUser?.tier?.trim().toLowerCase() === "free" && (
            <div className="p-4">
              <button
                onClick={() => nav("/kupi")}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ease-in-out transform hover:shadow-lg hover:shadow-amber-500/40 hover:scale-105 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-lg">Kupi Premium</span>
              </button>
            </div>
          )}

          {/* Redesigned Footer Section */}
          <div className="p-4 mt-auto border-t-2 border-blue-500/10 space-y-4 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => nav("/my-account")}
                className="flex-1 bg-slate-800/60 text-slate-300 font-medium py-2.5 px-3 rounded-lg hover:bg-slate-700/80 hover:text-white transition-colors flex items-center justify-center gap-2 group"
              >
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                <span>Nalog</span>
              </button>
              <button
                onClick={LogOff}
                className="bg-red-900/40 text-red-400 p-2.5 rounded-lg hover:bg-red-800/60 hover:text-red-300 transition-colors group"
                aria-label="Odjavi se"
              >
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
              </button>
            </div>
            <div className="text-center text-slate-500 text-xs pt-2">
              <a
                href="mailto:podrska@insajder.tips"
                className="hover:text-slate-300 transition-colors"
              >
                podrska@insajder.tips
              </a>
            </div>
          </div>
        </>
      </div>
    </>
  );
}
