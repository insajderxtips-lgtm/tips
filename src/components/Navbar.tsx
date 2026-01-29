import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router";
import logo from "../assets/insider_logo.png";
import { RootState } from "../redux/store";

export default function Navbar(): React.ReactNode {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedUrl, setSelectedUrl] = useState<string>("");
  const userData = useSelector((state: RootState) => state.user);

  const navItems = [
    { text: "Početna", url: "/" },
    { text: "O nama", url: "/onama" },
  ];

  useEffect(() => {
    setSelectedUrl(location.pathname);
  }, [location.pathname]);

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] px-3 py-4 md:px-6 md:py-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative h-16 md:h-20 flex items-center justify-between px-4 md:px-6 bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          {/* 1. Left Section: Logo (Flex-1 ensures it pushes middle to center) */}
          <div className="flex-1 flex items-center">
            <div 
              onClick={() => navigate("/")} 
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <img src={logo} alt="Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]" />
            </div>
          </div>

          {/* 2. Middle Section: Navigation (Perfectly Centered) */}
          <div className="flex items-center gap-5 md:gap-10">
            {navItems.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className={`relative text-[10px] md:text-xs font-black uppercase tracking-[0.25em] transition-all duration-300 ${
                  selectedUrl === item.url ? "text-white" : "text-slate-500 hover:text-slate-200"
                }`}
              >
                {item.text}
                {selectedUrl === item.url && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-500 rounded-full shadow-[0_0_8px_#38bdf8]"></span>
                )}
              </Link>
            ))}
            
            {/* Desktop Premium Button */}
            <Link
              to="/login"
              className="hidden lg:block text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-amber-400 hover:text-amber-200 transition-all hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]"
            >
              Kupi Premium
            </Link>
          </div>

          {/* 3. Right Section: Action Buttons (Flex-1 pushes middle to center) */}
          <div className="flex-1 flex justify-end items-center gap-3">
            {!userData.username ? (
              <>
                {/* Clear Login Button */}
                <button
                  onClick={() => navigate("/login")}
                  className="group relative flex items-center justify-center px-5 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl overflow-hidden transition-all active:scale-95"
                >
                  {/* Button Background & Border */}
                  <div className="absolute inset-0 bg-white group-hover:bg-sky-400 transition-colors duration-300"></div>
                  
                  {/* Text */}
                  <span className="relative z-10 text-black font-black text-[10px] md:text-xs uppercase tracking-tighter">
                    Uloguj se
                  </span>
                </button>

                {/* Mobile Login Icon (Visible only if user wants tiny icon on mobile) */}
                <button 
                  onClick={() => navigate("/login")}
                  className="hidden md:hidden text-white/50 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
                  </svg>
                </button>
              </>
            ) : (
              <div 
                onClick={() => navigate("/profile")}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <span className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
                  {userData.username}
                </span>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-xs">{userData.username[0].toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}