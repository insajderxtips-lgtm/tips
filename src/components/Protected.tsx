import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router"; // Corrected import
import { RootState } from "../redux/store";

export default function Protected({
  children,
  protectionMode,
}: {
  children: React.ReactNode;
  protectionMode: "loggedIn" | "loggedOut" | "verified";
}): React.ReactNode {
  const nav = useNavigate();
  const verified = useSelector((state: RootState) => state.user.isVerified);

  // This line now works because we will save the token to localStorage again
  const token = localStorage.getItem("insajder_token");

  useEffect(() => {
    // A logged-in user tries to access a page for logged-out users (like /login)
    if (token && protectionMode === "loggedOut") {
      nav("/");
    }
    // A logged-out user tries to access a page for logged-in users
    else if (
      !token &&
      (protectionMode === "loggedIn" || protectionMode === "verified")
    ) {
      nav("/");
    }
    // A logged-in but unverified user tries to access a verified-only page
    else if (token && protectionMode === "verified" && !verified) {
      nav("/verifikuj");
    }
  }, [token, protectionMode, verified, nav]);

  return <>{children}</>;
}
