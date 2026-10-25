"use client";

import { useMemo, useState } from "react";
import { Button } from "./ui";
import { EQUIPS, GROUPS } from "@/lib/exercises";
import { useApp, useExercises } from "@/lib/store";
import type { Equip, Group } from "@/lib/types";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Painel para escolher um exercício da biblioteca ou criar um novo.
export function ExercisePicker({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const all = useExercises();
  const addExercise = useApp((s) => s.addExercise);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<Group | "Todos">("Todos");
  const [equip, setEquip] = useState<Equip | "Todos">("Todos");
  const [newGroup, setNewGroup] = useState<Group>("Peito");

  const list = useMemo(
    () =>
      all.filter(
        (e) =>
          (group === "Todos" || e.group === group) &&
          (equip === "Todos" || e.equip === equip) &&
          norm(`${e.name} ${e.group} ${e.equip ?? ""}`).includes(norm(q)),
      ),
    [all, group, equip, q],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="anim-pop flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-md border border-line bg-iron-2 sm:rounded-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Escolher exercício"
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <p className="font-display text-2xl uppercase">Escolher exercício</p>
          <button type="button" onClick={onClose} className="font-pixel text-[10px] uppercase text-chalk-dim hover:text-chalk">
            Fechar
          </button>
        </div>
        <div className="space-y-3 p-4">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar: supino, smith, glúteo, polia..."
            className="w-full rounded-sm border border-line bg-iron px-3 py-2.5 text-sm outline-none placeholder:text-chalk-dim focus:border-plate-yellow"
          />
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {(["Todos", ...GROUPS] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={`shrink-0 rounded-sm border px-2.5 py-1 font-pixel text-[9px] uppercase ${
                  group === g ? "border-plate-yellow text-plate-yellow" : "border-line text-chalk-dim"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {(["Todos", ...EQUIPS] as const).map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setEquip(x)}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${
                  equip === x ? "border-plate-blue bg-plate-blue/15 text-chalk" : "border-line text-chalk-dim"
                }`}
              >
                {x === "Todos" ? "Qualquer equipamento" : x}
              </button>
            ))}
          </div>
          <p className="font-pixel text-[9px] uppercase text-chalk-dim">{list.length} exercícios</p>
        </div>
        <ul className="flex-1 overflow-y-auto px-2 pb-2">
          {list.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onPick(e.id)}
                className="flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2.5 text-left hover:bg-iron-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{e.name}</span>
                  {e.equip && <span className="text-[11px] text-chalk-dim">{e.equip}</span>}
                </span>
                <span className="shrink-0 font-pixel text-[9px] uppercase text-chalk-dim">{e.custom ? "seu" : e.group}</span>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="px-3 py-4 text-sm text-chalk-dim">Nenhum exercício com esse nome.</li>}
        </ul>
        {q.trim().length > 2 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line p-4">
            <span className="text-xs text-chalk-soft">Criar “{q.trim()}” em</span>
            <select
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value as Group)}
              className="rounded-sm border border-line bg-iron px-2 py-1.5 text-xs"
            >
              {GROUPS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <Button variant="yellow" className="ml-auto py-2" onClick={() => onPick(addExercise(q, newGroup))}>
              Criar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
