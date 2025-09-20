import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
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
  const token = localStorage.getItem("insajder_token");

  useEffect(() => {
    if (token && protectionMode === "loggedOut") {
      nav("/");
    } else if (!token && (protectionMode === "loggedIn" || protectionMode === "verified")) {
      nav("/");
    } else if (token && protectionMode === "verified" && !verified) {
      nav("/verifikuj");
    }
  }, [token, protectionMode, verified, nav]);

  return <>{children}</>;
}
