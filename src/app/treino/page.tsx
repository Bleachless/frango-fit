"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExercisePicker } from "@/components/exercise-picker";
import { frangoFor, Pixels } from "@/components/pixel";
import { TemplateList } from "@/components/template-list";
import { BORDER, Button, Card, PageTitle, Skeleton, TEXT } from "@/components/ui";
import { e1rm, fmtKg, lastPerformance, levelOf, personalRecords, round, sessionVolume, suggestLoad, xpOf } from "@/lib/calc";
import { useNow } from "@/lib/clock";
import { sfx } from "@/lib/sfx";
import { useApp, useExercises, useHydrated, type FinishSummary } from "@/lib/store";
import type { Entry, SetLog } from "@/lib/types";

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(s % 60).padStart(2, "0")}`;
};

function Stepper({ value, onChange, step, label, decimals = 1 }: { value: number; onChange: (n: number) => void; step: number; label: string; decimals?: number }) {
  return (
    <div className="flex min-w-0 items-stretch overflow-hidden rounded-sm border border-line bg-iron">
      <button type="button" onClick={() => onChange(Math.max(0, round(value - step, decimals)))} className="w-8 shrink-0 text-chalk-dim hover:bg-iron-3 hover:text-chalk" aria-label={`Diminuir ${label}`}>
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={0}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        onFocus={(e) => e.target.select()}
        className="w-full min-w-0 bg-transparent py-2 text-center text-base font-medium tabular-nums outline-none"
      />
      <button type="button" onClick={() => onChange(round(value + step, decimals))} className="w-8 shrink-0 text-chalk-dim hover:bg-iron-3 hover:text-chalk" aria-label={`Aumentar ${label}`}>
        +
      </button>
    </div>
  );
}

function RestTimer({ endAt, total, onAdd, onSkip }: { endAt: number; total: number; onAdd: () => void; onSkip: () => void }) {
  const now = useNow(250);
  const left = endAt - now;
  const done = left <= 0;
  return (
    <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 overflow-hidden rounded-sm border border-line bg-iron-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.9)] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-96">
      <div className="h-1.5 bg-iron-3">
        <div className={`h-full ${done ? "bg-plate-green" : "bg-plate-yellow"}`} style={{ width: `${Math.max(0, Math.min(1, left / total)) * 100}%` }} />
      </div>
      <div className="flex items-center gap-3 p-3">
        <div className="flex-1">
          <p className="font-pixel text-[9px] uppercase text-chalk-dim">{done ? "Descanso acabou" : "Descanso"}</p>
          <p className={`font-display text-3xl tabular-nums ${done ? "text-plate-green" : ""}`}>{done ? "Bora!" : clock(left)}</p>
        </div>
        {!done && (
          <Button className="px-3 py-2" onClick={onAdd}>
            +15s
          </Button>
        )}
        <Button variant={done ? "yellow" : "ghost"} className="px-3 py-2" onClick={onSkip}>
          {done ? "Ok" : "Pular"}
        </Button>
      </div>
    </div>
  );
}

function SetRow({
  index,
  set,
  pr,
  onChange,
  onToggle,
  onRemove,
}: {
  index: number;
  set: SetLog;
  pr: boolean;
  onChange: (p: Partial<SetLog>) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div className={`grid grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,0.85fr)_2.75rem] items-center gap-2 rounded-sm p-1.5 ${set.done ? "bg-plate-green/10" : ""}`}>
      <button type="button" onDoubleClick={onRemove} title="Dois cliques remove a série" className="text-center font-pixel text-[10px] text-chalk-dim">
        {index + 1}
      </button>
      <Stepper label="carga em kg" value={set.kg} step={2.5} onChange={(kg) => onChange({ kg })} />
      <Stepper label="repetições" value={set.reps} step={1} decimals={0} onChange={(reps) => onChange({ reps })} />
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={set.done}
        aria-label={set.done ? "Desmarcar série" : "Marcar série como feita"}
        className={`relative flex h-11 items-center justify-center rounded-sm border-2 font-pixel text-sm transition ${
          set.done ? "border-plate-green bg-plate-green text-iron" : "border-line text-chalk-dim hover:border-plate-green"
        }`}
      >
        ✓
        {pr && set.done && (
          <span className="anim-pop absolute -right-1.5 -top-2.5 rounded-sm bg-plate-yellow px-1 font-pixel text-[8px] text-iron">PR!</span>
        )}
      </button>
    </div>
  );
}

function EntryCard({ entry, index, onRest }: { entry: Entry; index: number; onRest: (seconds: number) => void }) {
  const exercises = useExercises();
  const sessions = useApp((s) => s.sessions);
  const updateSet = useApp((s) => s.updateSet);
  const addSet = useApp((s) => s.addSet);
  const removeSet = useApp((s) => s.removeSet);
  const removeEntry = useApp((s) => s.removeEntry);
  const ex = exercises.find((e) => e.id === entry.exerciseId);
  const last = useMemo(() => lastPerformance(sessions, entry.exerciseId), [sessions, entry.exerciseId]);
  const tip = suggestLoad(last, entry.target);
  const record = useMemo(() => personalRecords(sessions).get(entry.exerciseId)?.e1rm ?? null, [sessions, entry.exerciseId]);
  const allDone = entry.sets.length > 0 && entry.sets.every((s) => s.done);

  return (
    <Card className={allDone ? "border-plate-green/50" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-pixel text-[9px] uppercase text-chalk-dim">
            {ex?.group} · meta {entry.target} reps
          </p>
          <h2 className="font-display text-2xl uppercase leading-tight">{ex?.name ?? "Exercício"}</h2>
        </div>
        <button
          type="button"
          onClick={() => confirm(`Tirar ${ex?.name} deste treino?`) && removeEntry(index)}
          className="shrink-0 font-pixel text-[9px] uppercase text-chalk-dim hover:text-plate-red"
        >
          Remover
        </button>
      </div>

      <div className="mt-2 rounded-sm bg-iron px-3 py-2 text-xs text-chalk-soft">
        {last ? (
          <>
            <span className="text-chalk-dim">Última vez:</span> {last.sets.map((s) => `${s.kg}×${s.reps}`).join(" · ")}
            <span className="mt-0.5 block text-plate-yellow">↗ {tip.note}</span>
          </>
        ) : (
          tip.note
        )}
      </div>

      <div className="mt-3 grid grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,0.85fr)_2.75rem] gap-2 px-1.5 font-pixel text-[8px] uppercase text-chalk-dim">
        <span>#</span>
        <span className="text-center">kg</span>
        <span className="text-center">reps</span>
        <span />
      </div>
      <div className="mt-1 space-y-1">
        {entry.sets.map((s, si) => {
          const isPr = record !== null && e1rm(s.kg, s.reps) > record;
          return (
            <SetRow
              key={si}
              index={si}
              set={s}
              pr={isPr}
              onChange={(p) => updateSet(index, si, p)}
              onRemove={() => removeSet(index, si)}
              onToggle={() => {
                const done = !s.done;
                updateSet(index, si, { done });
                if (!done) return;
                if (isPr) sfx.record();
                else sfx.coin();
                onRest(entry.rest);
              }}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => addSet(index)}
        className="mt-2 w-full rounded-sm border border-dashed border-line py-2 font-pixel text-[10px] uppercase text-chalk-dim hover:border-plate-yellow hover:text-plate-yellow"
      >
        + Série
      </button>
    </Card>
  );
}

function Summary({ summary, onClose }: { summary: FinishSummary; onClose: () => void }) {
  const sessions = useApp((s) => s.sessions);
  const exercises = useExercises();
  const after = levelOf(xpOf(sessions));
  const before = levelOf(xpOf(sessions.filter((s) => s.id !== summary.session.id)));
  const leveledUp = after.index > before.index;
  const f = frangoFor(after.index, true);
  const sets = summary.session.entries.reduce((t, e) => t + e.sets.length, 0);
  const duration = (summary.session.endedAt ?? summary.session.startedAt) - summary.session.startedAt;

  useEffect(() => {
    if (leveledUp || summary.prs.length) sfx.record();
    else sfx.perfect();
  }, [leveledUp, summary.prs.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4">
      <div className="anim-pop max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-md border border-line bg-iron-2 sm:rounded-md">
        <div className="flex h-2">
          <span className="flex-1 bg-plate-red" />
          <span className="flex-1 bg-plate-blue" />
          <span className="flex-1 bg-plate-yellow" />
          <span className="flex-1 bg-plate-green" />
        </div>
        <div className="p-6 text-center">
          <Pixels rows={f.rows} colors={f.colors} className="anim-bob mx-auto h-20 w-auto" />
          <p className="mt-3 font-pixel text-[10px] uppercase text-plate-yellow">{leveledUp ? `Subiu de nível: ${after.name}!` : "Treino pago!"}</p>
          <p className="font-display text-4xl uppercase leading-none">{summary.session.name}</p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <div>
              <p className="font-display text-3xl">{fmtKg(summary.volume)}</p>
              <p className="font-pixel text-[8px] uppercase text-chalk-dim">Volume</p>
            </div>
            <div>
              <p className="font-display text-3xl">{sets}</p>
              <p className="font-pixel text-[8px] uppercase text-chalk-dim">Séries</p>
            </div>
            <div>
              <p className="font-display text-3xl">{clock(duration)}</p>
              <p className="font-pixel text-[8px] uppercase text-chalk-dim">Tempo</p>
            </div>
          </div>
          {summary.prs.length > 0 && (
            <div className="mt-6 text-left">
              <p className="font-pixel text-[10px] uppercase text-plate-yellow">{summary.prs.length} recorde(s) novo(s)</p>
              <ul className="mt-2 space-y-1.5">
                {summary.prs.map((p) => (
                  <li key={p.exerciseId} className="flex justify-between gap-3 rounded-sm bg-iron px-3 py-2 text-sm">
                    <span className="truncate">{exercises.find((e) => e.id === p.exerciseId)?.name}</span>
                    <span className="shrink-0 font-pixel text-[10px] text-plate-yellow">
                      {p.set.kg}×{p.set.reps}
                      {p.previous ? ` (+${round(p.e1rm - p.previous)})` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link href="/progresso" className="rounded-sm border border-line px-4 py-3 font-pixel text-[11px] uppercase hover:border-plate-yellow">
              Progresso
            </Link>
            <Button variant="yellow" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Treino() {
  const hydrated = useHydrated();
  const active = useApp((s) => s.active);
  const addEntry = useApp((s) => s.addEntry);
  const finishSession = useApp((s) => s.finishSession);
  const cancelSession = useApp((s) => s.cancelSession);
  const now = useNow(1000);
  const [rest, setRest] = useState<{ endAt: number; total: number } | null>(null);
  const [picking, setPicking] = useState(false);
  const [summary, setSummary] = useState<FinishSummary | null>(null);
  const beeped = useRef(0);

  // Fim do descanso: apita e vibra no celular, uma vez só.
  useEffect(() => {
    if (!rest || now < rest.endAt || beeped.current === rest.endAt) return;
    beeped.current = rest.endAt;
    sfx.timer();
    navigator.vibrate?.([200, 100, 200]);
  }, [now, rest]);

  if (!hydrated) return <Skeleton />;

  if (summary) return <Summary summary={summary} onClose={() => setSummary(null)} />;

  if (!active) {
    return (
      <div>
        <PageTitle eyebrow="Escolha a ficha" title="Treinar" />
        <TemplateList />
      </div>
    );
  }

  const volume = sessionVolume(active);
  const doneSets = active.entries.reduce((t, e) => t + e.sets.filter((s) => s.done).length, 0);
  const totalSets = active.entries.reduce((t, e) => t + e.sets.length, 0);

  const finish = () => {
    if (doneSets === 0) {
      if (confirm("Nenhuma série marcada. Descartar este treino?")) cancelSession();
      return;
    }
    if (doneSets < totalSets && !confirm(`Faltam ${totalSets - doneSets} séries. Finalizar mesmo assim?`)) return;
    const s = finishSession();
    setRest(null);
    if (s) setSummary(s);
  };

  return (
    <div className="pb-24">
      <div className={`sticky top-[calc(3.6rem+env(safe-area-inset-top))] z-20 -mx-4 mb-5 border-b border-line bg-iron/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`font-pixel text-[9px] uppercase ${TEXT[active.color]}`}>Em andamento · {clock(now - active.startedAt)}</p>
            <p className="truncate font-display text-2xl uppercase leading-tight">{active.name}</p>
          </div>
          <Button variant="red" className="shrink-0 px-3 py-2.5" onClick={finish}>
            Finalizar
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 bg-iron-3">
            <div className="h-full bg-plate-green transition-all" style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
          </div>
          <span className="font-pixel text-[9px] uppercase text-chalk-dim">
            {doneSets}/{totalSets} séries · {fmtKg(volume)}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4">
        {active.entries.map((e, i) => (
          <EntryCard key={`${e.exerciseId}-${i}`} entry={e} index={i} onRest={(seconds) => setRest({ endAt: Date.now() + seconds * 1000, total: seconds * 1000 })} />
        ))}
        {active.entries.length === 0 && <p className="text-sm text-chalk-soft">Treino livre: adicione o primeiro exercício.</p>}
        <Button className={`w-full border-dashed py-4 ${BORDER[active.color]}`} onClick={() => setPicking(true)}>
          + Adicionar exercício
        </Button>
        <button
          type="button"
          onClick={() => confirm("Descartar este treino? Nada vai ser salvo.") && cancelSession()}
          className="w-full py-2 font-pixel text-[10px] uppercase text-chalk-dim hover:text-plate-red"
        >
          Descartar treino
        </button>
      </div>

      {rest && (
        <RestTimer
          endAt={rest.endAt}
          total={rest.total}
          onAdd={() => setRest((r) => (r ? { endAt: r.endAt + 15_000, total: r.total + 15_000 } : r))}
          onSkip={() => setRest(null)}
        />
      )}
      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(id) => {
            addEntry(id);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
