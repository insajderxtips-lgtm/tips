import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import logo from "../../assets/insider_logo.png";
import { logout } from "../../redux/slices/UserSlice";
import { RootState } from "../../redux/store";
import { useState } from "react";

export default function Sidebar(): React.ReactNode {
  const currentUser = useSelector((state: RootState) => state.user);
  const nav = useNavigate();
  const dispatch = useDispatch();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const LogOff = () => {
    dispatch(logout());
    nav("/");
  };

  return (
    <>
      {/* Burger Menu Button (Only visible when sidebar is closed) */}
      {!sidebarVisible && (
        <button
          className="fixed top-4 left-4 hover:-scale-[0.85]  bg-gray-800 p-2 cursor-pointer rounded-md z-90 sm:block opacity-80 border"
          onClick={() => setSidebarVisible(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="white"
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

      {/* Sidebar */}
      <div
        className={`bg-gray-900/80 backdrop-blur-xl transition-transform duration-300 ease-in-out border-r select-none border-cyan-500/20 fixed left-0 top-0 h-full w-[280px] flex flex-col z-50
  ${sidebarVisible ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
          <div
            className="cursor-pointer flex items-center gap-3"
            onClick={() => nav("/")}
          >
            <img src={logo} className="w-10 h-10" alt="Logo" />
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

        {/* Main Navigation */}
        <nav className="flex-grow p-4 space-y-2">
          {/* Active link with glow animation. The active classes should be applied conditionally based on the current route. */}
          <a
            role="button"
            onClick={() => nav("/")}
            className="flex items-center gap-4 py-3 px-4 rounded-lg font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 animate-active-glow"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Početna</span>
          </a>

          <a
            role="button"
            onClick={() => nav("/freetips")}
            className="flex items-center gap-4 py-3 px-4 rounded-lg font-medium text-gray-300 hover:bg-gray-800/60 hover:text-white transition-colors"
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
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <span>Free Tipovi</span>
          </a>

          <a
            role="button"
            onClick={() => nav("/premiumtips")}
            className="flex items-center gap-4 py-3 px-4 rounded-lg font-bold text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 transition-colors"
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
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <span>Premium Tipovi</span>
          </a>

          <a
            role="button"
            onClick={() => nav("/statistike")}
            className="flex items-center gap-4 py-3 px-4 rounded-lg font-medium text-gray-300 hover:bg-gray-800/60 hover:text-white transition-colors"
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>Moje Statistike</span>
          </a>

          <a
            role="button"
            onClick={() => nav("/arbitragebetting")}
            className="flex items-center gap-4 py-3 px-4 rounded-lg font-medium text-gray-300 hover:bg-gray-800/60 hover:text-white transition-colors"
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span>Arbitražno Klađenje</span>
          </a>

          <a
            role="button"
            onClick={() => nav("/najboljekvote")}
            className="flex items-center gap-4 py-3 px-4 rounded-lg font-medium text-gray-300 hover:bg-gray-800/60 hover:text-white transition-colors"
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
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
            <span>Najbolje Kvote</span>
          </a>
        </nav>

        {/* CTA / Footer */}
        <div className="p-4 mt-auto border-t border-cyan-500/20 space-y-4">
          {currentUser.tier === "FREE" && (
            <button
              onClick={() => nav("/kupi")}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Postani Član</span>
            </button>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => nav("/my-account")}
              className="flex-1 bg-gray-800/60 text-gray-300 font-medium py-2 px-3 rounded-md hover:bg-gray-700/80 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Nalog</span>
            </button>
            <button
              onClick={LogOff}
              className="bg-red-600/20 text-red-400 font-medium p-2 rounded-md hover:bg-red-600/40 hover:text-red-300 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
          <div className="text-center text-gray-500 text-xs">
            podrska@insajder.tips
          </div>
        </div>
      </div>
    </>
  );
}
