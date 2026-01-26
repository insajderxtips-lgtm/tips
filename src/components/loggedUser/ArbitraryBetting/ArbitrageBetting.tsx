import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import PremiumFallback from "../PremiumFallback";
import ArbitrageCalculator from "./ArbitraryCalculator";
import { useEffect } from "react";

export default function ArbitrageBetting(): React.ReactNode {
  const tier = useSelector((state: RootState) => state?.user?.tier);

  useEffect(() => {
    document.title = "InsajderTips | Sigurno kladjenje";
  }, []);

  if (tier === "free") {
    return <PremiumFallback />;
  }

  return (
    <div className="flex flex-col h-full w-full mx-auto">
      <div className="w-full h-full p-2">
        <ArbitrageCalculator />
      </div>
    </div>
  );
}