"use client";

import { useState } from "react";
import { ExercisePicker } from "./exercise-picker";
import { BG, BORDER, Button, Card } from "./ui";
import { useExercises } from "@/lib/store";
import type { PlateColor, Template, TemplateItem } from "@/lib/types";

export const COLORS: PlateColor[] = ["red", "blue", "yellow", "green", "white"];

function NumberField({ label, value, onChange, step = 1, min = 0 }: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-pixel text-[8px] uppercase text-chalk-dim">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        className="w-full rounded-sm border border-line bg-iron px-2 py-2 text-center text-sm tabular-nums outline-none focus:border-plate-yellow"
      />
    </label>
  );
}

// Editor de uma ficha: usado nas fichas da pessoa e no modo personal.
export function TemplateEditor({
  initial,
  onSave,
  onClose,
  saveLabel = "Salvar ficha",
}: {
  initial: Template;
  onSave: (t: Template) => void;
  onClose: () => void;
  saveLabel?: string;
}) {
  const exercises = useExercises();
  const [t, setT] = useState<Template>(initial);
  const [picking, setPicking] = useState(false);

  const setItem = (i: number, patch: Partial<TemplateItem>) =>
    setT((x) => ({ ...x, items: x.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) }));
  const move = (i: number, d: number) =>
    setT((x) => {
      const items = [...x.items];
      const j = i + d;
      if (j < 0 || j >= items.length) return x;
      [items[i], items[j]] = [items[j], items[i]];
      return { ...x, items };
    });

  return (
    <Card className={`border-l-4 ${BORDER[t.color]}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1">
          <span className="font-pixel text-[9px] uppercase text-chalk-dim">Nome da ficha</span>
          <input
            value={t.name}
            onChange={(e) => setT({ ...t, name: e.target.value })}
            className="rounded-sm border border-line bg-iron px-3 py-2.5 font-display text-xl uppercase outline-none focus:border-plate-yellow"
          />
        </label>
        <div>
          <span className="font-pixel text-[9px] uppercase text-chalk-dim">Cor da anilha</span>
          <div className="mt-1 flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setT({ ...t, color: c })}
                aria-label={`Cor ${c}`}
                aria-pressed={t.color === c}
                className={`h-9 w-9 rounded-full border-4 ${BG[c]} ${t.color === c ? "border-chalk" : "border-iron"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <ol className="mt-5 space-y-2">
        {t.items.map((it, i) => {
          const ex = exercises.find((e) => e.id === it.exerciseId);
          return (
            <li key={`${it.exerciseId}-${i}`} className="rounded-sm border border-line bg-iron p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    <span className="mr-2 font-pixel text-[10px] text-chalk-dim">{i + 1}</span>
                    {ex?.name ?? "Exercício removido"}
                  </p>
                  <p className="font-pixel text-[8px] uppercase text-chalk-dim">{ex?.group}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => move(i, -1)} className="h-8 w-8 rounded-sm border border-line text-chalk-dim hover:text-chalk" aria-label="Subir">
                    ↑
                  </button>
                  <button type="button" onClick={() => move(i, 1)} className="h-8 w-8 rounded-sm border border-line text-chalk-dim hover:text-chalk" aria-label="Descer">
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setT({ ...t, items: t.items.filter((_, k) => k !== i) })}
                    className="h-8 w-8 rounded-sm border border-plate-red/40 text-plate-red"
                    aria-label="Remover"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <NumberField label="Séries" value={it.sets} min={1} onChange={(n) => setItem(i, { sets: n })} />
                <NumberField label="Reps" value={it.reps} min={1} onChange={(n) => setItem(i, { reps: n })} />
                <NumberField label="Descanso (s)" value={it.rest} step={15} onChange={(n) => setItem(i, { rest: n })} />
                <NumberField label="Carga (kg)" value={it.kg ?? 0} step={0.5} onChange={(n) => setItem(i, { kg: n || undefined })} />
              </div>
              <input
                value={it.note ?? ""}
                onChange={(e) => setItem(i, { note: e.target.value.slice(0, 120) || undefined })}
                placeholder="Observação (ex.: cadência 3-1-1, pegada fechada)"
                aria-label={`Observação de ${ex?.name ?? "exercício"}`}
                className="mt-2 w-full rounded-sm border border-line bg-iron-2 px-2 py-1.5 text-xs outline-none placeholder:text-chalk-dim focus:border-plate-yellow"
              />
            </li>
          );
        })}
      </ol>

      <Button className="mt-3 w-full border-dashed" onClick={() => setPicking(true)}>
        + Adicionar exercício
      </Button>

      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="yellow"
          disabled={!t.name.trim() || t.items.length === 0}
          onClick={() => {
            onSave({ ...t, name: t.name.trim() });
            onClose();
          }}
        >
          {saveLabel}
        </Button>
      </div>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(id) => {
            setT((x) => ({ ...x, items: [...x.items, { exerciseId: id, sets: 3, reps: 10, rest: 90 }] }));
            setPicking(false);
          }}
        />
      )}
    </Card>
  );
}
