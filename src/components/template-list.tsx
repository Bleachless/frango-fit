"use client";

import { useRouter } from "next/navigation";
import { BG, BORDER, relativeDay } from "./ui";
import { finished } from "@/lib/calc";
import { sfx } from "@/lib/sfx";
import { useApp, useExercises } from "@/lib/store";

// Lista de fichas para começar um treino com um toque.
export function TemplateList() {
  const router = useRouter();
  const templates = useApp((s) => s.templates);
  const sessions = useApp((s) => s.sessions);
  const active = useApp((s) => s.active);
  const startSession = useApp((s) => s.startSession);
  const exercises = useExercises();
  const done = finished(sessions);

  // Sugere a ficha feita há mais tempo, para manter o rodízio ABC.
  const lastOf = (id: string) => [...done].reverse().find((s) => s.templateId === id)?.startedAt ?? 0;
  const next = [...templates].sort((a, b) => lastOf(a.id) - lastOf(b.id))[0]?.id;

  const start = (id: string | null) => {
    if (active && !confirm("Já tem um treino em andamento. Descartar e começar outro?")) return;
    startSession(id);
    sfx.start();
    router.push("/treino");
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {templates.map((t) => {
        const last = lastOf(t.id);
        const names = t.items.map((i) => exercises.find((e) => e.id === i.exerciseId)?.name ?? "?");
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => start(t.id)}
            className={`group relative overflow-hidden rounded-sm border-l-4 bg-iron-2 p-4 text-left transition hover:bg-iron-3 ${BORDER[t.color]}`}
          >
            {t.id === next && done.length > 0 && (
              <span className="absolute right-3 top-3 rounded-sm bg-plate-yellow px-1.5 py-0.5 font-pixel text-[8px] uppercase text-iron">
                Próximo
              </span>
            )}
            <p className="pr-16 font-display text-2xl uppercase leading-tight">{t.name}</p>
            <p className="mt-1 line-clamp-1 text-xs text-chalk-soft">{names.join(" · ")}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-pixel text-[9px] uppercase text-chalk-dim">
                {t.items.length} exercícios · {last ? `último ${relativeDay(last)}` : "nunca feito"}
              </span>
              <span className={`rounded-sm px-2 py-1 font-pixel text-[9px] uppercase text-iron ${BG[t.color]}`}>Começar</span>
            </div>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => start(null)}
        className="rounded-sm border border-dashed border-line p-4 text-left text-chalk-soft transition hover:border-plate-yellow hover:text-plate-yellow"
      >
        <p className="font-display text-2xl uppercase">Treino livre</p>
        <p className="mt-1 text-xs">Monte na hora, exercício por exercício.</p>
      </button>
    </div>
  );
}
