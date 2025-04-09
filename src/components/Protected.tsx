import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Protected({
  children,
  protectionMode,
}: {
  children: React.ReactNode;
  protectionMode: "loggedIn" | "loggedOut";
}): React.ReactNode {
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("insajder_token");
    if (token && protectionMode === "loggedOut") {
      nav("/");
    } else if (!token && protectionMode === "loggedIn") {
      nav("/");
    }
  }, []);

  return <>{children}</>;
}
