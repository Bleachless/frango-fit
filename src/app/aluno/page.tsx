"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { BORDER, Button, Card, PageTitle, Skeleton } from "@/components/ui";
import { EXERCISES } from "@/lib/exercises";
import { decodePlan } from "@/lib/plan";
import { useApp, useHydrated } from "@/lib/store";

function subscribeHash(cb: () => void) {
  addEventListener("hashchange", cb);
  return () => removeEventListener("hashchange", cb);
}

// Página que o aluno abre: mostra as fichas do personal e adiciona no app dele.
export default function Aluno() {
  const hydrated = useHydrated();
  const code = useSyncExternalStore(
    subscribeHash,
    () => location.hash.slice(1),
    () => "",
  );
  const templates = useApp((s) => s.templates);
  const importPlan = useApp((s) => s.importPlan);
  const startSession = useApp((s) => s.startSession);
  const router = useRouter();
  const [done, setDone] = useState<{ updated: boolean; count: number } | null>(null);

  if (!hydrated) return <Skeleton />;

  const plan = decodePlan(code);
  if (!plan || plan.templates.length === 0) {
    return (
      <Card className="mx-auto mt-10 max-w-md text-center">
        <p className="font-display text-3xl uppercase">Link pela metade</p>
        <p className="mt-2 text-sm text-chalk-soft">Pede pro seu personal mandar o link de novo, inteirinho.</p>
        <Link href="/fichas" className="mt-5 inline-block font-pixel text-[11px] uppercase text-plate-yellow">
          Ir pras minhas fichas →
        </Link>
      </Card>
    );
  }

  const names = new Map([...EXERCISES, ...plan.exercises].map((e) => [e.id, e.name]));
  const already = templates.some((t) => t.coach?.plan === plan.id);
  const mine = templates.filter((t) => t.coach?.plan === plan.id);

  return (
    <div>
      <PageTitle eyebrow={`Do personal ${plan.coach || "sem nome"}`} title={plan.student ? `Fichas de ${plan.student}` : "Suas fichas novas"} />

      {plan.note && (
        <Card className="mb-6 border-l-4 border-plate-yellow">
          <p className="font-pixel text-[9px] uppercase text-chalk-dim">Recado</p>
          <p className="mt-1 whitespace-pre-line text-chalk">{plan.note}</p>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {plan.templates.map((t) => (
          <Card key={t.id} className={`border-l-4 ${BORDER[t.color]}`}>
            <p className="font-display text-2xl uppercase leading-tight">{t.name}</p>
            <ul className="mt-3 space-y-1.5">
              {t.items.map((it, i) => (
                <li key={i} className="text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="truncate text-chalk-soft">{names.get(it.exerciseId) ?? "?"}</span>
                    <span className="shrink-0 font-pixel text-[9px] uppercase text-chalk-dim">
                      {it.sets}×{it.reps}
                      {it.kg ? ` · ${it.kg} kg` : ""} · {it.rest}s
                    </span>
                  </div>
                  {it.note && <p className="text-xs text-plate-yellow">✎ {it.note}</p>}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-20 mt-8 lg:bottom-6">
        {done ? (
          <Card className="anim-pop border-plate-green/60">
            <p className="font-display text-2xl uppercase text-plate-green">{done.updated ? "Fichas atualizadas!" : "Fichas adicionadas!"}</p>
            <p className="mt-1 text-sm text-chalk-soft">
              {done.count} {done.count === 1 ? "ficha está" : "fichas estão"} no seu Frango Fit. A carga do personal entra na primeira vez de cada exercício.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {mine[0] && (
                <Button
                  variant="red"
                  onClick={() => {
                    startSession(mine[0].id);
                    router.push("/treino");
                  }}
                >
                  Começar {mine[0].name}
                </Button>
              )}
              <Link
                href="/fichas"
                className="inline-flex items-center justify-center rounded-sm border border-line px-4 py-3 font-pixel text-[11px] uppercase text-chalk hover:border-plate-yellow hover:text-plate-yellow"
              >
                Ver minhas fichas
              </Link>
            </div>
          </Card>
        ) : (
          <Button variant="yellow" className="w-full py-4 text-sm" onClick={() => setDone(importPlan(plan))}>
            {already ? "Atualizar minhas fichas" : "Adicionar ao meu Frango Fit"}
          </Button>
        )}
      </div>
    </div>
  );
}
