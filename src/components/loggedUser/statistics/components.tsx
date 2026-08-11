import React from "react";

/** Top-row summary card (total bets, balance, …). */
export function StatCard({
  icon,
  label,
  labelAction,
  value,
  valueClassName = "text-white",
  suffix,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  labelAction?: React.ReactNode;
  value: React.ReactNode;
  valueClassName?: string;
  suffix?: React.ReactNode;
  trailing?: React.ReactNode;
}): React.ReactNode {
  return (
    <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:bg-slate-800/80">
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <div className="mb-0.5 flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            {labelAction}
          </div>
          <p className={`text-xl font-bold leading-tight ${valueClassName}`}>
            {value}
            {suffix}
          </p>
        </div>
      </div>
      {trailing ?? (
        <div className="h-1 w-12 rounded-full bg-slate-800 transition-colors group-hover:bg-sky-500/30" />
      )}
    </div>
  );
}

/** Small tile used in the monthly-summary sidebar grid. */
export function MiniStat({
  value,
  label,
  valueClassName = "text-white",
  labelClassName = "text-slate-500",
  className = "border-slate-800 bg-slate-950/40 hover:bg-slate-800/40",
}: {
  value: React.ReactNode;
  label: string;
  valueClassName?: string;
  labelClassName?: string;
  className?: string;
}): React.ReactNode {
  return (
    <div className={`rounded-2xl border p-4 transition-colors ${className}`}>
      <p className={`font-mono text-2xl font-bold ${valueClassName}`}>{value}</p>
      <p className={`text-[10px] font-black uppercase tracking-wider ${labelClassName}`}>{label}</p>
    </div>
  );
}

/** Styled native <select>. */
export function PeriodSelect({
  value,
  onChange,
  children,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  children: React.ReactNode;
  className?: string;
}): React.ReactNode {
  return (
    <div className={`relative w-full ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer appearance-none rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-200 transition-all hover:border-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
      >
        {children}
      </select>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}): React.ReactNode {
  return (
    <div className="flex min-h-[450px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-800/50 bg-slate-950/30 p-10 text-center">
      <div className="mb-4 rounded-full bg-slate-800/50 p-6 text-slate-600">{icon}</div>
      <h3 className="text-xl font-bold text-slate-300">{title}</h3>
      <p className="mt-2 max-w-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
