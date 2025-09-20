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
        className={`bg-gray-950 transition-transform duration-300 border-r  select-none border-blue-950 fixed left-0 top-0 h-screen w-[250px] flex flex-col p-4 items-center text-white z-50
        ${sidebarVisible ? "translate-x-0 " : "-translate-x-full "}`}
      >
        {/* Close Button (Only visible when sidebar is open) */}
        {sidebarVisible && (
          <button
            className="absolute  top-4 right-4 bg-gray-700 p-2 rounded-md cursor-pointer"
            onClick={() => setSidebarVisible(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="white"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M6.225 4.811a1 1 0 011.414 0L12 9.172l4.361-4.361a1 1 0 111.414 1.414L13.414 10.586l4.361 4.361a1 1 0 01-1.414 1.414L12 12.828l-4.361 4.361a1 1 0 01-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 010-1.414z"
              />
            </svg>
          </button>
        )}

        {/* Logo */}
        <div className="cursor-pointer mb-6" onClick={() => nav("/")}>
          <img src={logo} className="w-12 h-12 md:w-16 md:h-16" alt="Logo" />
        </div>

        {/* Navigation Links */}
        <div className="w-full flex flex-col gap-4 flex-grow">
          <div
            className="p-2 cursor-pointer hover:bg-gray-800 rounded-md flex items-center gap-2"
            onClick={() => nav("/")}
          >
            <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
              <path d="M3 10l9-7 9 7v10a1 1 0 01-1 1h-6v-7H9v7H4a1 1 0 01-1-1V10z" />
            </svg>
            Početna
          </div>
          <div
            className="p-2 cursor-pointer hover:bg-gray-800 text-gray-300 rounded-md flex items-center gap-2"
            onClick={() => nav("/freetips")}
          >
            <svg className="w-5 h-5" fill="gray" viewBox="0 0 24 24">
              <path d="M5 3v18l7-4 7 4V3H5z" />
            </svg>
            Free Tipovi
          </div>
          <div
            className="p-2 cursor-pointer hover:bg-gray-800 text-gold font-bold rounded-md flex items-center gap-2"
            onClick={() => nav("/premiumtips")}
          >
            <svg
              className="w-5 h-5"
              fill="gold"
              viewBox="http://www.w3.org/2000/svg"
            >
              <path d="M12 2l3 7h7l-5 5 2 7-6-4-6 4 2-7-5-5h7z" />
            </svg>
            Premium Tipovi
          </div>
          <div
            className="p-2 cursor-pointer hover:bg-gray-800 rounded-md flex items-center gap-2"
            onClick={() => nav("/statistike")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="cyan"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
            Moje Statistike
          </div>
          <div
            className="p-2 cursor-pointer hover:bg-gray-800 rounded-md flex items-center gap-2"
            onClick={() => nav("/arbitragebetting")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="green"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
            Arbitrazno kladjenje
          </div>
          <div
            className="p-2 cursor-pointer hover:bg-gray-800 rounded-md flex items-center gap-2"
            onClick={() => nav("/najboljekvote")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              className="size-6"
            >
              {/* First Bar */}
              <path
                stroke="green"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.242 5.992h12"
              />

              {/* Second Bar */}
              <path
                stroke="blue"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.24 11.995H20.24"
              />

              {/* Third Bar */}
              <path
                stroke="red"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.24 17.994h12"
              />

              {/* Additional Icons */}
              <path
                stroke="purple"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 1 1 1.591 1.59l-1.83 1.83h2.16M2.99 15.745h1.125a1.125 1.125 0 0 1 0 2.25H3.74m0-.002h.375a1.125 1.125 0 0 1 0 2.25H2.99"
              />
            </svg>
            Najbolje kvote
          </div>
          {/* Premium Purchase */}
          {currentUser.tier === "FREE" && (
            <div
              className="p-2 mt-auto mb-2 flex justify-center cursor-pointer bg-yellow-600 text-white rounded-md flex items-center gap-2"
              onClick={() => nav("/premiumtips")}
            >
              <svg
                className="w-5 h-5"
                fill="white"
                viewBox="http://www.w3.org/2000/svg"
              >
                <path d="M12 2l3 7h7l-5 5 2 7-6-4-6 4 2-7-5-5h7z" />
              </svg>
              Kupi Premium
            </div>
          )}
        </div>

        {/* Account & Logout */}
        <div className="w-full flex flex-col gap-2">
          {currentUser.tier === "free" && (
            <button
              className="bg-blue-600 w-full p-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              onClick={() => nav("/kupi")}
            >
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4 0-8 2-8 5v3h16v-3c0-3-4-5-8-5z" />
              </svg>
              Postani clan
            </button>
          )}
          <button
            className="bg-blue-600 w-full p-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
            onClick={() => nav("/my-account")}
          >
            <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
              <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4 0-8 2-8 5v3h16v-3c0-3-4-5-8-5z" />
            </svg>
            Moj nalog
          </button>
          <button
            className="bg-red-600 w-full p-2 rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
            onClick={LogOff}
          >
            <svg
              className="w-5 h-5"
              fill="white"
              viewBox="http://www.w3.org/2000/svg"
            >
              <path d="M16 17v-2h-4v-2h4V9l4 4-4 4zM4 4h10v2H4v12h10v2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
            Odjava
          </button>
          <div className=" text-center text-gray-400 text-sm bg-gray-900/50 rounded-md w-max mx-auto px-4 py-1">
            podrska@insajder.tips
          </div>
        </div>
      </div>
    </>
  );
}
