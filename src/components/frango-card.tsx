"use client";

import { useEffect, useState } from "react";
import { frangoFor, Pixels } from "./pixel";
import { LEVELS, levelOf } from "@/lib/calc";
import { sfx } from "@/lib/sfx";

const POKES = [
  "Treino é igual commit: todo dia um pouquinho.",
  "Cadê a carga progressiva? Sobe esse peso!",
  "Hidratou hoje? Bebe água, monstro.",
  "Asa é músculo. Treino asa todo dia.",
  "Pó branco na asa? É giz, juro.",
];

// O Frango evolui com o XP: volume levantado, treinos feitos e recordes batidos.
export function FrangoCard({ xp }: { xp: number }) {
  const level = levelOf(xp);
  const [up, setUp] = useState(true);
  const [line, setLine] = useState<string>(level.line);

  useEffect(() => {
    const t = setInterval(() => setUp((u) => !u), 180);
    return () => clearInterval(t);
  }, []);

  const f = frangoFor(level.index, up);

  return (
    <div className="relative overflow-hidden rounded-sm border border-line bg-iron-2">
      <div className="absolute inset-x-0 top-0 flex h-1.5">
        <span className="flex-1 bg-plate-red" />
        <span className="flex-1 bg-plate-blue" />
        <span className="flex-1 bg-plate-yellow" />
        <span className="flex-1 bg-plate-green" />
      </div>
      <div className="flex items-center gap-5 p-5 sm:gap-8 sm:p-6">
        <button
          type="button"
          onClick={() => {
            sfx.cluck();
            setLine(POKES[Math.floor(Math.random() * POKES.length)]);
          }}
          className="anim-bob shrink-0"
          aria-label="Cutucar o Frango"
        >
          <Pixels rows={f.rows} colors={f.colors} className="h-20 w-auto sm:h-28" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-pixel text-[9px] uppercase text-chalk-dim">
            Nível {level.index + 1} de {LEVELS.length}
          </p>
          <p className="font-display text-4xl uppercase leading-none sm:text-5xl">{level.name}</p>
          <p key={line} className="anim-pop mt-2 text-sm text-chalk-soft">
            “{line}”
          </p>
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-sm bg-iron-3">
              <div className="h-full bg-plate-yellow transition-all duration-700" style={{ width: `${level.progress * 100}%` }} />
            </div>
            <p className="mt-1.5 font-pixel text-[9px] uppercase text-chalk-dim">
              {xp.toLocaleString("pt-BR")} XP
              {level.next ? ` · faltam ${(level.next.min - xp).toLocaleString("pt-BR")} para ${level.next.name}` : " · nível máximo, BIRL!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
