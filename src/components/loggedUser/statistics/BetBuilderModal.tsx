import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { CurrentBet } from "./types";

const MODES = [
  { value: "single", label: "SINGL" },
  { value: "parlay", label: "SISTEM" },
] as const;

const STATUSES = [
  { label: "aktivan", value: "active", activeColor: "bg-sky-500" },
  { label: "prolazan", value: "win", activeColor: "bg-emerald-500" },
  { label: "gubitan", value: "loss", activeColor: "bg-rose-500" },
] as const;

const inputBase =
  "w-full rounded-2xl border border-white/5 bg-slate-900/50 p-4 text-white outline-none transition-all placeholder:text-slate-700";

const fieldLabel = "text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1";

export default function BetBuilderModal({
  currency,
  mode,
  setMode,
  currentBet,
  setCurrentBet,
  parlay,
  status,
  addToParlay,
  removeParlayItem,
  onSave,
  onClose,
}: {
  currency?: string;
  mode: string;
  setMode: (mode: string) => void;
  currentBet: CurrentBet | null;
  setCurrentBet: (updater: (prev: any) => any) => void;
  parlay: CurrentBet[];
  status?: string;
  addToParlay: () => void;
  removeParlayItem: (index: number) => void;
  onSave: () => void;
  onClose: () => void;
}): React.ReactNode {
  const patch = (key: keyof CurrentBet, value: string) =>
    setCurrentBet((prev) => ({ ...prev, [key]: value }));

  const parlayTotalOdds = parlay.reduce((acc, i) => acc * Number(i.odds), 1);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl animate-in fade-in zoom-in duration-300">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 shadow-2xl">
          <div className="absolute -left-24 -top-24 h-64 w-64 animate-pulse bg-cyan-500/10 blur-[100px]" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 animate-pulse bg-purple-500/10 blur-[100px]" />

          <div className="relative p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">
                  Novi <span className="not-italic text-cyan-400">Tiket</span>
                </h2>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">
                  Popunite detalje opklade
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-slate-900 text-slate-400 transition-colors hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode switch */}
            <div className="mb-8 flex rounded-2xl border border-white/5 bg-slate-900 p-1">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => mode !== m.value && setMode(m.value)}
                  className={`flex-1 rounded-xl py-3 text-xs font-bold transition-all duration-300 ${
                    mode === m.value
                      ? "bg-white text-black shadow-lg"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Shared fields */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className={fieldLabel}>Utakmica</label>
                  <input
                    type="text"
                    placeholder="npr. Real Madrid - Barcelona"
                    onChange={(e) => patch("match", e.target.value)}
                    className={`${inputBase} focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={fieldLabel}>Tip</label>
                  <input
                    type="text"
                    placeholder="GG3+"
                    onChange={(e) => patch("tip", e.target.value)}
                    className={`${inputBase} focus:border-cyan-500/50`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={fieldLabel}>Kvota</label>
                  <input
                    type="number"
                    placeholder="1.85"
                    onChange={(e) => patch("odds", e.target.value)}
                    className={`${inputBase} font-mono text-lg text-cyan-400 focus:border-cyan-500/50`}
                  />
                </div>
              </div>

              {/* Single mode: stake + status */}
              {mode === "single" && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-5 duration-300">
                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Ulog ({currency || ""})
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      onChange={(e) => patch("stake", e.target.value)}
                      className={`${inputBase} p-5 font-mono text-xl text-emerald-400 shadow-inner focus:border-emerald-500/50`}
                    />
                  </div>

                  <div className="space-y-4 rounded-[2rem] border border-white/5 bg-slate-900/40 p-4">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Status Tiketa
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-700" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {STATUSES.map((s) => {
                        const active = currentBet?.status === s.value;
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => patch("status", s.value)}
                            className={`relative rounded-xl border py-3 text-[9px] font-black uppercase transition-all duration-300 md:text-[10px] ${
                              active
                                ? `scale-[1.02] border-transparent text-white shadow-xl ${s.activeColor}`
                                : "border-white/5 bg-slate-950/50 text-slate-500 hover:border-white/10"
                            }`}
                          >
                            {s.label}
                            {active && (
                              <span className="absolute inset-0 animate-pulse rounded-xl bg-white/20" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Parlay mode: list + total stake */}
              {mode === "parlay" && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-4 duration-300">
                  {parlay.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40">
                      <div className="scrollbar-hide max-h-40 space-y-1 overflow-y-auto p-2">
                        {parlay.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900 p-3"
                          >
                            <div>
                              <p className="text-xs font-bold text-white">{item.match}</p>
                              <p className="text-[10px] font-bold uppercase text-slate-500">{item.tip}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-bold text-cyan-400">{item.odds}</span>
                              <button
                                onClick={() => removeParlayItem(idx)}
                                className="text-slate-600 hover:text-red-400"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 bg-white/5 p-4">
                        <span className="text-[10px] font-black uppercase text-slate-500">Ukupna Kvota</span>
                        <span className="font-mono text-xl font-black text-white">
                          {parlayTotalOdds.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className={fieldLabel}>Ukupan Ulog ({currency})</label>
                    <input
                      type="number"
                      placeholder="Unesite ulog"
                      onChange={(e) => patch("stake", e.target.value)}
                      className={`${inputBase} font-mono text-lg text-purple-400 focus:border-purple-500/50`}
                    />
                  </div>
                </div>
              )}
            </div>

            {status && (
              <p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                {status}
              </p>
            )}

            {/* Footer */}
            <div className="mt-8 flex gap-3">
              {mode === "single" ? (
                <button
                  onClick={onSave}
                  className="flex-1 rounded-2xl bg-cyan-500 py-4 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 active:scale-95"
                >
                  Sačuvaj Tiket
                </button>
              ) : (
                <>
                  <button
                    onClick={addToParlay}
                    className="flex-1 rounded-2xl border border-white/10 bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 active:scale-95"
                  >
                    Dodaj Par
                  </button>
                  {parlay.length > 0 && (
                    <button
                      onClick={onSave}
                      className="flex-1 rounded-2xl bg-purple-500 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-400 active:scale-95"
                    >
                      Završi Sistem
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
