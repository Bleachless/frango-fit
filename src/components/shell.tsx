"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DumbbellIcon, frangoFor, Pixels } from "./pixel";
import { levelOf, minutes, xpOf } from "@/lib/calc";
import { useNow } from "@/lib/clock";
import { useApp, useHydrated } from "@/lib/store";

const NAV = [
  { href: "/", label: "Hoje", icon: "M1 6h2v5H1zM5 3h2v8H5zM9 0h2v11H9z" },
  { href: "/fichas", label: "Fichas", icon: "M1 0h9v11H1zM3 2v1h5V2zM3 5v1h5V5zM3 8v1h3V8z" },
  { href: "/treino", label: "Treino", icon: "" },
  { href: "/progresso", label: "Progresso", icon: "M0 10h11v1H0zM1 7h2v2H1zM4 4h2v5H4zM7 6h2v3H7zM9 1h2v8H9z" },
  { href: "/ferramentas", label: "Ferramentas", icon: "M1 4h9v3H1zM0 2h2v7H0zM9 2h2v7H9z" },
];

function NavIcon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg viewBox="0 0 11 11" className={`h-4 w-4 ${active ? "text-plate-yellow" : "text-chalk-dim"}`} shapeRendering="crispEdges" aria-hidden>
      <path fill="currentColor" d={d} />
    </svg>
  );
}

function MuteButton() {
  const muted = useApp((s) => s.muted);
  const toggle = useApp((s) => s.toggleMute);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? "Ligar sons" : "Desligar sons"}
      aria-pressed={!muted}
      className="flex h-9 w-9 items-center justify-center rounded-sm border border-line text-chalk-soft hover:border-plate-yellow hover:text-plate-yellow"
    >
      <svg viewBox="0 0 9 7" className="h-3 w-auto" shapeRendering="crispEdges" aria-hidden>
        <path fill="currentColor" d="M0 2h2V1h1V0h1v7H3V6H2V5H0z" />
        {muted ? (
          <path fill="currentColor" d="M5 2h1v1h1V2h1v1H7v1h1v1H7V4H6v1H5V4h1V3H5z" />
        ) : (
          <path fill="currentColor" d="M5 2h1v3H5zM7 1h1v5H7z" />
        )}
      </svg>
    </button>
  );
}

// Aviso flutuante de treino em andamento, visível fora da tela de treino.
function ActiveBanner() {
  const active = useApp((s) => s.active);
  const path = usePathname();
  const now = useNow(30_000);
  if (!active || path === "/treino") return null;
  return (
    <Link
      href="/treino"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between rounded-sm bg-plate-yellow px-4 py-3 text-iron shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-80"
    >
      <span>
        <span className="block font-pixel text-[9px] uppercase">Treino em andamento · {minutes(now - active.startedAt)} min</span>
        <span className="block font-display text-lg uppercase leading-tight">{active.name}</span>
      </span>
      <span className="font-pixel text-[10px] uppercase">Voltar →</span>
    </Link>
  );
}

function MiniFrango() {
  const sessions = useApp((s) => s.sessions);
  const hydrated = useHydrated();
  const level = levelOf(hydrated ? xpOf(sessions) : 0);
  const f = frangoFor(level.index, true);
  return (
    <div className="flex items-center gap-3 rounded-sm border border-line bg-iron-2 p-3">
      <Pixels rows={f.rows} colors={f.colors} className="h-9 w-auto" />
      <div className="min-w-0">
        <p className="font-display text-lg uppercase leading-none">{level.name}</p>
        <div className="mt-1.5 h-1.5 w-28 bg-iron-3">
          <div className="h-full bg-plate-yellow" style={{ width: `${level.progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const active = useApp((s) => s.active);
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[15rem_minmax(0,1fr)]">
      {/* Barra lateral no desktop */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r border-line bg-iron-2/60 p-5 lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <DumbbellIcon className="h-3 w-6" />
          <span className="font-display text-2xl uppercase">
            Frango Fit<span className="text-plate-red">.</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-sm px-3 py-2.5 font-pixel text-[11px] uppercase transition ${
                isActive(n.href) ? "bg-iron-3 text-chalk" : "text-chalk-dim hover:text-chalk"
              }`}
            >
              {n.icon ? (
                <NavIcon d={n.icon} active={isActive(n.href)} />
              ) : (
                <span className={`h-4 w-4 rounded-full border-4 ${active ? "border-plate-yellow" : "border-plate-red"}`} />
              )}
              {n.label}
              {n.href === "/treino" && active && <span className="anim-blink ml-auto h-2 w-2 bg-plate-yellow" />}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <MiniFrango />
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[9px] uppercase text-chalk-dim">Sem login · offline</span>
            <MuteButton />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Topo no celular */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-iron/85 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <DumbbellIcon className="h-3 w-6" />
            <span className="font-display text-xl uppercase">
              Frango Fit<span className="text-plate-red">.</span>
            </span>
          </Link>
          <MuteButton />
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">{children}</main>
      </div>

      <ActiveBanner />

      {/* Navegação inferior no celular, com o botão de treino no meio */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-iron/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        {NAV.map((n) =>
          n.href === "/treino" ? (
            <Link key={n.href} href={n.href} className="relative flex flex-col items-center justify-end pb-2" aria-label="Treino">
              <span
                className={`absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-iron shadow-[0_6px_20px_-6px_rgba(0,0,0,0.9)] ${
                  active ? "bg-plate-yellow" : "bg-plate-red"
                }`}
              >
                <span className="h-5 w-5 rounded-full border-[5px] border-iron/80" />
              </span>
              <span className={`font-pixel text-[9px] uppercase ${isActive(n.href) ? "text-chalk" : "text-chalk-dim"}`}>
                {active ? "Em curso" : "Treinar"}
              </span>
            </Link>
          ) : (
            <Link key={n.href} href={n.href} className="flex flex-col items-center gap-1 py-2.5">
              <NavIcon d={n.icon} active={isActive(n.href)} />
              <span className={`font-pixel text-[9px] uppercase ${isActive(n.href) ? "text-chalk" : "text-chalk-dim"}`}>
                {n.label === "Ferramentas" ? "Mais" : n.label}
              </span>
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
