"use client";

import { useMemo, useState } from "react";
import { BarChart, LineChart } from "@/components/charts";
import { BORDER, Button, Card, PageTitle, SectionTitle, Skeleton, Stat, relativeDay } from "@/components/ui";
import { exerciseHistory, finished, fmtKg, minutes, personalRecords, round, sessionVolume, weeklyVolume } from "@/lib/calc";
import { useApp, useExercises, useHydrated } from "@/lib/store";

export default function Progresso() {
  const hydrated = useHydrated();
  const sessions = useApp((s) => s.sessions);
  const deleteSession = useApp((s) => s.deleteSession);
  const loadDemo = useApp((s) => s.loadDemo);
  const exercises = useExercises();
  const [picked, setPicked] = useState<string | null>(null);
  const [metric, setMetric] = useState<"e1rm" | "maxKg">("e1rm");
  const [open, setOpen] = useState<string | null>(null);

  const prs = useMemo(() => personalRecords(sessions), [sessions]);
  // Exercícios com histórico, do mais treinado para o menos.
  const trained = useMemo(() => {
    const count = new Map<string, number>();
    for (const s of finished(sessions)) for (const e of s.entries) count.set(e.exerciseId, (count.get(e.exerciseId) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [sessions]);

  if (!hydrated) return <Skeleton />;

  const nameOf = (id: string) => exercises.find((e) => e.id === id)?.name ?? id;
  const done = finished(sessions);

  if (done.length === 0) {
    return (
      <div>
        <PageTitle eyebrow="Seus números" title="Progresso" />
        <Card>
          <p className="font-display text-2xl uppercase">Nada para mostrar ainda</p>
          <p className="mt-1 text-sm text-chalk-soft">Faça o primeiro treino ou carregue o exemplo para ver os gráficos.</p>
          <Button variant="yellow" className="mt-4" onClick={loadDemo}>
            Carregar exemplo
          </Button>
        </Card>
      </div>
    );
  }

  const current = picked ?? trained[0];
  const history = exerciseHistory(sessions, current);
  const first = history[0]?.[metric] ?? 0;
  const lastV = history[history.length - 1]?.[metric] ?? 0;
  const gain = first ? ((lastV - first) / first) * 100 : 0;
  const weeks = weeklyVolume(sessions, 8);

  return (
    <div className="space-y-8">
      <PageTitle eyebrow="Seus números" title="Progresso" />

      <section>
        <SectionTitle>Evolução por exercício</SectionTitle>
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <select
              value={current}
              onChange={(e) => setPicked(e.target.value)}
              className="rounded-sm border border-line bg-iron px-3 py-2.5 text-sm outline-none focus:border-plate-yellow"
              aria-label="Exercício"
            >
              {trained.map((id) => (
                <option key={id} value={id}>
                  {nameOf(id)}
                </option>
              ))}
            </select>
            <div className="flex gap-1" role="tablist">
              {(
                [
                  ["e1rm", "1RM estimado"],
                  ["maxKg", "Carga máxima"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={metric === k}
                  onClick={() => setMetric(k)}
                  className={`rounded-sm border px-3 py-2 font-pixel text-[9px] uppercase ${
                    metric === k ? "border-plate-yellow text-plate-yellow" : "border-line text-chalk-dim"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Começou" value={`${round(first)}`} hint="kg" />
            <Stat label="Agora" value={`${round(lastV)}`} hint="kg" />
            <Stat label="Evolução" value={`${gain >= 0 ? "+" : ""}${round(gain)}%`} accent={gain > 0 ? "text-plate-green" : ""} hint={`${history.length} treinos`} />
          </div>
          <div className="mt-4">
            <LineChart points={history.map((p) => ({ at: p.at, value: p[metric] }))} />
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle aside={<span className="font-pixel text-[9px] uppercase text-chalk-dim">8 semanas</span>}>Volume semanal</SectionTitle>
        <Card>
          <BarChart data={weeks} />
        </Card>
      </section>

      <section>
        <SectionTitle aside={<span className="font-pixel text-[9px] uppercase text-chalk-dim">{prs.size} exercícios</span>}>Recordes pessoais</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {[...prs.entries()]
            .sort((a, b) => b[1].e1rm - a[1].e1rm)
            .map(([id, pr]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setPicked(id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex items-center justify-between gap-3 rounded-sm border border-line bg-iron-2 px-4 py-3 text-left hover:border-plate-yellow"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{nameOf(id)}</span>
                  <span className="font-pixel text-[9px] uppercase text-chalk-dim">
                    {pr.set.kg} kg × {pr.set.reps} · {relativeDay(pr.at)}
                  </span>
                </span>
                <span className="shrink-0 font-display text-2xl text-plate-yellow">{pr.e1rm}</span>
              </button>
            ))}
        </div>
      </section>

      <section>
        <SectionTitle aside={<span className="font-pixel text-[9px] uppercase text-chalk-dim">{done.length} treinos</span>}>Histórico</SectionTitle>
        <div className="space-y-2">
          {[...done].reverse().map((s) => (
            <div key={s.id} className={`rounded-sm border-l-4 bg-iron-2 ${BORDER[s.color]}`}>
              <button type="button" onClick={() => setOpen(open === s.id ? null : s.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                <span className="min-w-0">
                  <span className="block truncate font-display text-xl uppercase">{s.name}</span>
                  <span className="font-pixel text-[9px] uppercase text-chalk-dim">
                    {new Date(s.startedAt).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })} ·{" "}
                    {s.endedAt ? `${minutes(s.endedAt - s.startedAt)} min` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-xl">{fmtKg(sessionVolume(s))}</span>
                  <span className="font-pixel text-[9px] uppercase text-chalk-dim">{open === s.id ? "fechar" : "detalhes"}</span>
                </span>
              </button>
              {open === s.id && (
                <div className="anim-pop border-t border-line px-4 py-3">
                  <ul className="space-y-1.5">
                    {s.entries.map((e, i) => (
                      <li key={i} className="flex justify-between gap-3 text-sm">
                        <span className="truncate text-chalk-soft">{nameOf(e.exerciseId)}</span>
                        <span className="shrink-0 font-pixel text-[9px] text-chalk">{e.sets.map((x) => `${x.kg}×${x.reps}`).join(" · ")}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => confirm("Apagar este treino do histórico?") && deleteSession(s.id)}
                    className="mt-3 font-pixel text-[9px] uppercase text-chalk-dim hover:text-plate-red"
                  >
                    Apagar treino
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
