"use client";

import { useState } from "react";
import { ExercisePicker } from "@/components/exercise-picker";
import { BG, BORDER, Button, Card, PageTitle, Skeleton } from "@/components/ui";
import { uid, useApp, useExercises, useHydrated } from "@/lib/store";
import type { PlateColor, Template, TemplateItem } from "@/lib/types";

const COLORS: PlateColor[] = ["red", "blue", "yellow", "green", "white"];

function NumberField({ label, value, onChange, step = 1, min = 0 }: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-pixel text-[8px] uppercase text-chalk-dim">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        className="w-full rounded-sm border border-line bg-iron px-2 py-2 text-center text-sm tabular-nums outline-none focus:border-plate-yellow"
      />
    </label>
  );
}

function Editor({ initial, onClose }: { initial: Template; onClose: () => void }) {
  const save = useApp((s) => s.saveTemplate);
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
              <div className="mt-3 grid grid-cols-3 gap-2">
                <NumberField label="Séries" value={it.sets} min={1} onChange={(n) => setItem(i, { sets: n })} />
                <NumberField label="Reps" value={it.reps} min={1} onChange={(n) => setItem(i, { reps: n })} />
                <NumberField label="Descanso (s)" value={it.rest} step={15} onChange={(n) => setItem(i, { rest: n })} />
              </div>
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
            save({ ...t, name: t.name.trim() });
            onClose();
          }}
        >
          Salvar ficha
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

export default function Fichas() {
  const hydrated = useHydrated();
  const templates = useApp((s) => s.templates);
  const remove = useApp((s) => s.deleteTemplate);
  const exercises = useExercises();
  const [editing, setEditing] = useState<Template | null>(null);

  if (!hydrated) return <Skeleton />;

  const blank = (): Template => ({
    id: uid(),
    name: `Treino ${String.fromCharCode(65 + templates.length)}`,
    color: COLORS[templates.length % COLORS.length],
    items: [],
  });

  return (
    <div>
      <PageTitle eyebrow="Suas fichas" title="Fichas">
        {!editing && (
          <Button variant="red" onClick={() => setEditing(blank())}>
            + Nova ficha
          </Button>
        )}
      </PageTitle>

      {editing ? (
        <Editor key={editing.id} initial={editing} onClose={() => setEditing(null)} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} className={`border-l-4 ${BORDER[t.color]}`}>
              <p className="font-display text-2xl uppercase leading-tight">{t.name}</p>
              <ul className="mt-3 space-y-1">
                {t.items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-3 text-sm">
                    <span className="truncate text-chalk-soft">{exercises.find((e) => e.id === it.exerciseId)?.name ?? "?"}</span>
                    <span className="shrink-0 font-pixel text-[9px] uppercase text-chalk-dim">
                      {it.sets}×{it.reps} · {it.rest}s
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                <Button className="flex-1 py-2" onClick={() => setEditing(t)}>
                  Editar
                </Button>
                <Button
                  variant="danger"
                  className="py-2"
                  onClick={() => confirm(`Apagar a ficha "${t.name}"? O histórico continua salvo.`) && remove(t.id)}
                >
                  Apagar
                </Button>
              </div>
            </Card>
          ))}
          {templates.length === 0 && <p className="text-sm text-chalk-soft">Nenhuma ficha ainda. Crie a primeira!</p>}
        </div>
      )}
    </div>
  );
}
