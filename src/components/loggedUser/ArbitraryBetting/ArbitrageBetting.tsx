import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import PremiumFallback from "../PremiumFallback";
import ArbitrageCalculator from "./ArbitraryCalculator";
import { useEffect } from "react";

export default function ArbitrageBetting(): React.ReactNode {
  const currentUser = useSelector((state: RootState) => state?.user);
  if (currentUser.tier === "free") {
    return <PremiumFallback />;
  }
  useEffect(() => {
    document.title = "InsajderTips | Sigurno kladjenje";
  }, []);
  return (
    <div className="flex flex-col h-full w-[100%] mx-auto">
      <div className="w-full h-full p-2  ">
        <ArbitrageCalculator />
      </div>
    </div>
  );
}
