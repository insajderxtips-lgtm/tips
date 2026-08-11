import React from "react";
import { createPortal } from "react-dom";

export default function EditBalanceModal({
  defaultCurrency,
  value,
  onChange,
  onSave,
  onClose,
  isUpdating,
}: {
  defaultCurrency?: string;
  value: number;
  onChange: (value: number) => void;
  onSave: () => void;
  onClose: () => void;
  isUpdating: boolean;
}): React.ReactNode {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-gray-950/90 backdrop-blur-md animate-in fade-in duration-300"
      />
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="mb-6 text-center">
          <h3 className="mb-2 text-xl font-bold text-white">Promeni bilans</h3>
          <p className="text-sm text-slate-400">Unesite novi iznos vašeg bilansa</p>
        </div>

        <div className="relative mb-8">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder="0"
            className="w-full rounded-2xl border border-slate-700 bg-black/40 px-6 py-4 text-center text-2xl font-bold text-cyan-400 transition-all focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase text-slate-500">
            {defaultCurrency}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onSave}
            disabled={isUpdating}
            className="w-full rounded-2xl bg-cyan-600 py-4 font-bold text-white shadow-lg shadow-cyan-900/20 transition-all hover:bg-cyan-500 active:scale-95 disabled:opacity-50"
          >
            {isUpdating ? "Sačuvaj..." : "Sačuvaj Promene"}
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-white/5 py-4 font-bold text-slate-400 transition-all hover:bg-white/10"
          >
            Odustani
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
