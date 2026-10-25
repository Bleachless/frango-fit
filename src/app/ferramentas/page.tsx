"use client";

import { useRef, useState } from "react";
import { Barbell } from "@/components/barbell";
import { Button, Card, PageTitle, SectionTitle, Skeleton } from "@/components/ui";
import { e1rm, PLATES, platesFor, round } from "@/lib/calc";
import { sfx } from "@/lib/sfx";
import { useApp, useHydrated } from "@/lib/store";

const BARS = [20, 15, 10];
const PERCENTS = [100, 95, 90, 85, 80, 75, 70, 65, 60];
// Repetições aproximadas para cada % do 1RM (inverso da fórmula de Epley).
const repsAt = (pct: number) => (pct >= 100 ? 1 : Math.max(1, Math.round(30 * (100 / pct - 1))));

function PlateCalculator() {
  const [total, setTotal] = useState(100);
  const [bar, setBar] = useState(20);
  const r = platesFor(total, bar);

  return (
    <Card>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="flex flex-col gap-1">
          <span className="font-pixel text-[9px] uppercase text-chalk-dim">Peso total na barra (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            step={2.5}
            min={0}
            value={total}
            onChange={(e) => setTotal(Math.max(0, Number(e.target.value) || 0))}
            className="rounded-sm border border-line bg-iron px-3 py-2.5 font-display text-3xl outline-none focus:border-plate-yellow"
          />
        </label>
        <div>
          <span className="font-pixel text-[9px] uppercase text-chalk-dim">Barra</span>
          <div className="mt-1 flex gap-1">
            {BARS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBar(b)}
                aria-pressed={bar === b}
                className={`rounded-sm border px-3 py-3 font-pixel text-[10px] ${bar === b ? "border-plate-yellow text-plate-yellow" : "border-line text-chalk-dim"}`}
              >
                {b} kg
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {[-10, -5, -2.5, 2.5, 5, 10].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setTotal((t) => Math.max(0, round(t + d, 2)));
              sfx.plate();
            }}
            className="rounded-sm border border-line px-2.5 py-1.5 font-pixel text-[9px] text-chalk-soft hover:border-plate-yellow"
          >
            {d > 0 ? "+" : ""}
            {d}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-6 max-w-xl overflow-hidden">
        <Barbell plates={r.plates} />
      </div>

      <div className="mt-4 rounded-sm bg-iron px-4 py-3 text-sm">
        {total < bar ? (
          <span className="text-plate-red">Menos que a barra sozinha ({bar} kg).</span>
        ) : r.plates.length === 0 ? (
          <span>Só a barra. Aquecimento, né?</span>
        ) : (
          <>
            <span className="text-chalk-dim">Por lado:</span> <span className="font-medium">{r.plates.join(" + ")} kg</span>
            {!r.possible && <span className="mt-1 block text-plate-yellow">Faltam {r.leftover} kg que não fecham com as anilhas comuns.</span>}
          </>
        )}
      </div>
      <p className="mt-2 font-pixel text-[8px] uppercase text-chalk-dim">Anilhas: {PLATES.join(" · ")} kg</p>
    </Card>
  );
}

function OneRepMax() {
  const [kg, setKg] = useState(80);
  const [reps, setReps] = useState(8);
  const max = round(e1rm(kg, reps));
  return (
    <Card>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-pixel text-[9px] uppercase text-chalk-dim">Carga (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            value={kg}
            onChange={(e) => setKg(Math.max(0, Number(e.target.value) || 0))}
            className="rounded-sm border border-line bg-iron px-3 py-2.5 font-display text-2xl outline-none focus:border-plate-yellow"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-pixel text-[9px] uppercase text-chalk-dim">Repetições</span>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(Math.max(0, Math.round(Number(e.target.value) || 0)))}
            className="rounded-sm border border-line bg-iron px-3 py-2.5 font-display text-2xl outline-none focus:border-plate-yellow"
          />
        </label>
      </div>
      <p className="mt-5 font-pixel text-[9px] uppercase text-chalk-dim">Seu 1RM estimado</p>
      <p className="font-display text-6xl text-plate-yellow">{max} kg</p>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="font-pixel text-[8px] uppercase text-chalk-dim">
            <th className="py-1 text-left font-normal">% do 1RM</th>
            <th className="py-1 text-right font-normal">Carga</th>
            <th className="py-1 text-right font-normal">Reps aprox.</th>
          </tr>
        </thead>
        <tbody>
          {PERCENTS.map((p) => (
            <tr key={p} className="border-t border-line">
              <td className="py-1.5">{p}%</td>
              <td className="py-1.5 text-right tabular-nums">{round((max * p) / 100)} kg</td>
              <td className="py-1.5 text-right tabular-nums text-chalk-soft">{repsAt(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function DataTools() {
  const loadDemo = useApp((s) => s.loadDemo);
  const importData = useApp((s) => s.importData);
  const resetAll = useApp((s) => s.resetAll);
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const exportData = () => {
    const { templates, sessions, customExercises } = useApp.getState();
    const blob = new Blob([JSON.stringify({ app: "frango-fit", version: 1, templates, sessions, customExercises }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `frango-fit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg("Backup baixado.");
  };

  return (
    <Card>
      <p className="text-sm text-chalk-soft">
        Tudo fica salvo só neste aparelho, sem conta e sem servidor. Faça backup para levar para outro celular.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button onClick={exportData}>Baixar backup</Button>
        <Button onClick={() => file.current?.click()}>Importar backup</Button>
        <Button
          variant="yellow"
          onClick={() => {
            if (confirm("Trocar seu histórico por 6 semanas de exemplo?")) {
              loadDemo();
              setMsg("Exemplo carregado. Olha o Frango!");
            }
          }}
        >
          Carregar exemplo
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm("Apagar TUDO: fichas, treinos e recordes? Não dá para desfazer.")) {
              resetAll();
              setMsg("Tudo zerado. Recomeço é treino também.");
            }
          }}
        >
          Apagar tudo
        </Button>
      </div>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setMsg(importData(await f.text()) ? "Backup importado!" : "Arquivo inválido.");
          e.target.value = "";
        }}
      />
      {msg && <p className="anim-pop mt-3 font-pixel text-[10px] uppercase text-plate-yellow">{msg}</p>}
    </Card>
  );
}

export default function Ferramentas() {
  const hydrated = useHydrated();
  if (!hydrated) return <Skeleton />;
  return (
    <div className="space-y-8">
      <PageTitle eyebrow="Calculadoras e dados" title="Ferramentas" />
      <section>
        <SectionTitle>Quanto de anilha?</SectionTitle>
        <PlateCalculator />
      </section>
      <section>
        <SectionTitle>Calculadora de 1RM</SectionTitle>
        <OneRepMax />
      </section>
      <section>
        <SectionTitle>Seus dados</SectionTitle>
        <DataTools />
      </section>
      <p className="pb-4 text-center font-pixel text-[9px] uppercase text-chalk-dim">
        Frango Fit · código aberto ·{" "}
        <a href="https://github.com/Bleachless/frango-fit" className="text-plate-yellow" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </p>
    </div>
  );
}
