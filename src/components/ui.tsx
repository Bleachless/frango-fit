import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { PlateColor } from "@/lib/types";

export const BG: Record<PlateColor, string> = {
  red: "bg-plate-red",
  blue: "bg-plate-blue",
  yellow: "bg-plate-yellow",
  green: "bg-plate-green",
  white: "bg-chalk",
};
export const BORDER: Record<PlateColor, string> = {
  red: "border-plate-red",
  blue: "border-plate-blue",
  yellow: "border-plate-yellow",
  green: "border-plate-green",
  white: "border-chalk",
};
export const TEXT: Record<PlateColor, string> = {
  red: "text-plate-red",
  blue: "text-plate-blue",
  yellow: "text-plate-yellow",
  green: "text-plate-green",
  white: "text-chalk",
};

export function PageTitle({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-1 font-display text-5xl uppercase leading-none sm:text-6xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-sm border border-line bg-iron-2 p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-2xl uppercase">{children}</h2>
      {aside}
    </div>
  );
}

type Variant = "red" | "yellow" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  red: "bg-plate-red text-chalk shadow-[0_4px_0_#9c2a1c] active:translate-y-1 active:shadow-none",
  yellow: "bg-plate-yellow text-iron shadow-[0_4px_0_#a8801f] active:translate-y-1 active:shadow-none",
  ghost: "border border-line text-chalk hover:border-plate-yellow hover:text-plate-yellow",
  danger: "border border-plate-red/50 text-plate-red hover:bg-plate-red/10",
};

export function Button({ variant = "ghost", className = "", ...props }: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-4 py-3 font-pixel text-[11px] uppercase transition disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Stat({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: ReactNode; accent?: string }) {
  return (
    <div className="rounded-sm border border-line bg-iron-2 p-4">
      <p className="font-pixel text-[9px] uppercase text-chalk-dim">{label}</p>
      <p className={`mt-1 font-display text-3xl uppercase leading-none ${accent ?? ""}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-chalk-soft">{hint}</p>}
    </div>
  );
}

export function Skeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy>
      <div className="h-12 w-2/3 rounded-sm bg-iron-2" />
      <div className="h-40 rounded-sm bg-iron-2" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-sm bg-iron-2" />
        <div className="h-24 rounded-sm bg-iron-2" />
      </div>
    </div>
  );
}

export function relativeDay(ts: number, now = Date.now()) {
  const day = 86_400_000;
  const a = new Date(ts).setHours(0, 0, 0, 0);
  const b = new Date(now).setHours(0, 0, 0, 0);
  const diff = Math.round((b - a) / day);
  if (diff === 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff < 7) return `há ${diff} dias`;
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
