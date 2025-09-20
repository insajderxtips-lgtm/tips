import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router";
import logo from "../assets/insider_logo.png";
import { RootState } from "../redux/store";

export default function Navbar(): React.ReactNode {
  const navItems = [
    { text: "Početna", url: "/" },
    { text: "O nama", url: "/onama" },
    { text: "Uloguj se", url: "/login" },
  ];

  const location = useLocation();
  const [selectedUrl, setSelectedUrl] = useState<string>("");
  const nav = useNavigate();
  const userData = useSelector((state: RootState) => state.user);

  useEffect(() => {
    setSelectedUrl(location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="flex  mx-auto  w-full   z-50 select-none fixed  top-0  bg-[radial-gradient(rgba(36,22,80,0.01)_0%,rgba(2,3,27,0.5)_100%)]
 "
    >
      <div onClick={() => nav("/")}>
        <img src={logo} className="w-14 h-14 md:w-24 md:h-24 cursor-pointer" />
      </div>
      <div className="flex w-full justify-center items-center gap-4 md:gap-8 relative uppercase ">
        {navItems.map((navItem, index) => (
          <Link
            to={navItem.url}
            key={navItem.url}
            className={`text-sm font-bold ${index === 3 && "text-gold"} ${
              selectedUrl === navItem.url ? "text-blue-500" : ""
            } ${
              index === navItems.length - 1 &&
              `bg-blue-900 p-3 px-6 rounded-full hover:bg-blue-950 text-white transition-colors duration-150 absolute right-4 hidden md:flex md:${
                userData.username === null && "block"
              } ${userData.username != null && "hidden"}`
            }`}
          >
            {navItem.text}
          </Link>
        ))}
        <div
          className={`text-sm font-bold group cursor-pointer`}
          onClick={() => nav("/login")}
        >
          <span>Kupi Premium</span>
        </div>
        <div className=" absolute right-3" onClick={() => nav("/login")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6 flex md:hidden"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
