"use client";

import Link from "next/link";
import { useState } from "react";
import { COLORS, TemplateEditor } from "@/components/template-editor";
import { BORDER, Button, Card, PageTitle, Skeleton } from "@/components/ui";
import { uid, useApp, useExercises, useHydrated } from "@/lib/store";
import type { Template } from "@/lib/types";

export default function Fichas() {
  const hydrated = useHydrated();
  const templates = useApp((s) => s.templates);
  const remove = useApp((s) => s.deleteTemplate);
  const save = useApp((s) => s.saveTemplate);
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
          <div className="flex gap-2">
            <Link
              href="/personal"
              className="inline-flex items-center justify-center rounded-sm border border-line px-4 py-3 font-pixel text-[11px] uppercase text-chalk transition hover:border-plate-yellow hover:text-plate-yellow"
            >
              Sou personal
            </Link>
            <Button variant="red" onClick={() => setEditing(blank())}>
              + Nova ficha
            </Button>
          </div>
        )}
      </PageTitle>

      {editing ? (
        <TemplateEditor key={editing.id} initial={editing} onSave={save} onClose={() => setEditing(null)} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} className={`border-l-4 ${BORDER[t.color]}`}>
              <p className="font-display text-2xl uppercase leading-tight">{t.name}</p>
              {t.coach && <p className="mt-1 font-pixel text-[9px] uppercase text-plate-yellow">Do personal {t.coach.name || "sem nome"}</p>}
              <ul className="mt-3 space-y-1">
                {t.items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-3 text-sm">
                    <span className="truncate text-chalk-soft">{exercises.find((e) => e.id === it.exerciseId)?.name ?? "?"}</span>
                    <span className="shrink-0 font-pixel text-[9px] uppercase text-chalk-dim">
                      {it.sets}×{it.reps}
                      {it.kg ? ` · ${it.kg} kg` : ""} · {it.rest}s
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
