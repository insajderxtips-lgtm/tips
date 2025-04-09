import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, setUser } from "../../redux/slices/UserSlice";
import { useNavigate } from "react-router";
import { RootState } from "../../redux/store";

export default function MyAccount(): React.ReactNode {
  const [newUsername, setNewUsername] = useState<string>(""); // Default to empty string
  const [error, setError] = useState<string | null>(null);
  const JWT = localStorage.getItem("insajder_token");
  const currentUser = useSelector((state: RootState) => state.user);
  const nav = useNavigate();
  const dispatch = useDispatch();

  const LogOff = () => {
    dispatch(logout());
    nav("/");
  };

  const saveChanges = useCallback(() => {
    setError(null); // Clear previous error messages

    // Basic validation for the new username
    if (
      !newUsername ||
      newUsername.length < 4 ||
      newUsername === currentUser?.username
    ) {
      setError("Ime mora biti duže od 3 karaktera i drugačije od prethodnog.");
      return;
    }

    // Sending the request to update the username
    fetch("https://9e60-109-93-175-89.ngrok-free.app/updateName", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + JWT,
      },
      body: JSON.stringify({
        newName: newUsername,
        oldName: currentUser?.username,
      }),
    })
      .then((res) => {
        if (res.ok) {
          dispatch(
            setUser({
              ...currentUser,
              username: newUsername, // Only updating the username in Redux
            })
          );
          setError("Uspešno ste promenili korisničko ime!");
        } else {
          setError("Došlo je do greške prilikom ažuriranja korisničkog imena.");
        }
      })
      .catch(() => {
        setError("Došlo je do greške prilikom komunikacije sa serverom.");
      });
  }, [newUsername, currentUser, dispatch, JWT]);
  useEffect(() => {
    document.title = "InsajderTips | Moj nalog";
  }, []);

  return (
    <div className="w-[90%] my-auto flex flex-col mx-auto h-max md:w-[60%] p-6 rounded-2xl bg-gradient-to-br from-blue-900/40 to-indigo-900/30 backdrop-blur-sm border border-blue-800/30 shadow-2xl shadow-blue-950/50">
      <div className="mb-4 bg-gradient-to-tr from-blue-900/30 to-cyan-900/20 p-6 rounded-xl border border-blue-800/30">
        <div className="flex flex-col justify-center items-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-1 shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-16 text-cyan-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </div>
          </div>

          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
            {currentUser?.username}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-2 text-cyan-300">
            <span>{currentUser?.email}</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentUser?.tier === "premium"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : currentUser?.tier === "free"
                  ? "bg-gradient-to-r from-gray-600 to-slate-500"
                  : "bg-gradient-to-r from-teal-500 to-emerald-500"
              }`}
            >
              {currentUser?.tier}
            </span>
          </div>
        </div>

        <input
          type="text"
          placeholder={`${currentUser?.username} - Promeni`}
          className="mt-6 w-full bg-black/30 border border-cyan-800/40 rounded-lg px-4 py-3 
        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
        placeholder-cyan-500/60 text-cyan-300 transition-all duration-300"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
      </div>

      {newUsername && (
        <button
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500
        text-white font-medium py-2.5 rounded-lg shadow-lg hover:shadow-cyan-500/20 
        transition-all duration-300 mb-3"
          onClick={saveChanges}
        >
          Sačuvaj promene
        </button>
      )}

      <button
        onClick={LogOff}
        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500
      text-white font-medium py-2.5 rounded-lg shadow-lg hover:shadow-red-500/20 
      transition-all duration-300"
      >
        Izloguj se
      </button>

      {error && (
        <div
          className={`mt-4 p-3 rounded-lg border ${
            error.startsWith("Uspešno")
              ? "bg-green-900/30 border-green-800/40 text-green-400"
              : "bg-red-900/30 border-red-800/40 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {error.startsWith("Uspešno") ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              )}
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
