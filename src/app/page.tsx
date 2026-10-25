"use client";

import Link from "next/link";
import { Heatmap } from "@/components/charts";
import { FrangoCard } from "@/components/frango-card";
import { TemplateList } from "@/components/template-list";
import { Button, Card, SectionTitle, Skeleton, Stat, relativeDay } from "@/components/ui";
import { dailyVolume, finished, fmtKg, personalRecords, sessionsThisWeek, sessionVolume, weeklyStreak, xpOf } from "@/lib/calc";
import { useNow } from "@/lib/clock";
import { useApp, useExercises, useHydrated } from "@/lib/store";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Madrugada, monstro?";
  if (h < 12) return "Bom dia, monstro.";
  if (h < 18) return "Boa tarde, monstro.";
  return "Boa noite, monstro.";
}

export default function Today() {
  const hydrated = useHydrated();
  const sessions = useApp((s) => s.sessions);
  const active = useApp((s) => s.active);
  const loadDemo = useApp((s) => s.loadDemo);
  const exercises = useExercises();
  const now = useNow(60_000);

  if (!hydrated) return <Skeleton />;

  const done = finished(sessions);
  const total = done.reduce((t, s) => t + sessionVolume(s), 0);
  const week = sessionsThisWeek(sessions);
  const streak = weeklyStreak(sessions);
  const prs = [...personalRecords(sessions).entries()].sort((a, b) => b[1].at - a[1].at).slice(0, 4);
  const nameOf = (id: string) => exercises.find((e) => e.id === id)?.name ?? id;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-1 font-display text-5xl uppercase leading-none sm:text-6xl">{greeting()}</h1>
      </div>

      <FrangoCard xp={xpOf(sessions)} />

      {done.length === 0 && (
        <Card className="border-plate-yellow/40">
          <p className="font-display text-2xl uppercase">Primeira vez por aqui?</p>
          <p className="mt-1 text-sm text-chalk-soft">
            Escolha uma ficha abaixo e comece. Ou carregue 6 semanas de treino de exemplo para ver os gráficos e o Frango evoluindo.
          </p>
          <Button variant="yellow" className="mt-4" onClick={loadDemo}>
            Carregar exemplo
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Treinos na semana" value={`${week}/3`} hint={week >= 3 ? "Meta batida!" : `Faltam ${3 - week}`} accent={week >= 3 ? "text-plate-green" : ""} />
        <Stat label="Semanas seguidas" value={streak} hint={streak ? "Não quebra a sequência" : "Comece hoje"} />
        <Stat label="Volume total" value={total >= 1000 ? `${Math.round(total / 1000)}t` : fmtKg(total)} hint={`${done.length} treinos`} />
        <Stat label="Recordes" value={personalRecords(sessions).size} hint="Exercícios com PR" accent="text-plate-yellow" />
      </div>

      <section>
        <SectionTitle aside={<Link href="/fichas" className="font-pixel text-[10px] uppercase text-chalk-dim hover:text-chalk">Editar fichas →</Link>}>
          {active ? "Treino em andamento" : "Bora treinar"}
        </SectionTitle>
        {active ? (
          <Link href="/treino" className="block rounded-sm bg-plate-yellow p-5 text-iron">
            <p className="font-pixel text-[10px] uppercase">Continuar</p>
            <p className="font-display text-3xl uppercase">{active.name}</p>
          </Link>
        ) : (
          <TemplateList />
        )}
      </section>

      <section>
        <SectionTitle aside={<span className="font-pixel text-[9px] uppercase text-chalk-dim">16 semanas</span>}>Frequência</SectionTitle>
        <Card>
          <Heatmap volumes={dailyVolume(sessions)} now={now} />
          <p className="mt-3 font-pixel text-[9px] uppercase text-chalk-dim">Cada quadrado é um dia · verde mais forte = mais volume</p>
        </Card>
      </section>

      {prs.length > 0 && (
        <section>
          <SectionTitle aside={<Link href="/progresso" className="font-pixel text-[10px] uppercase text-chalk-dim hover:text-chalk">Ver tudo →</Link>}>
            Últimos recordes
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {prs.map(([id, pr]) => (
              <Card key={id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{nameOf(id)}</p>
                  <p className="font-pixel text-[9px] uppercase text-chalk-dim">
                    {pr.set.kg} kg × {pr.set.reps} · {relativeDay(pr.at)}
                  </p>
                </div>
                <p className="shrink-0 font-display text-2xl text-plate-yellow">{pr.e1rm} kg</p>
              </Card>
            ))}
          </div>
          <p className="mt-2 font-pixel text-[9px] uppercase text-chalk-dim">Recorde = 1RM estimado (fórmula de Epley)</p>
        </section>
      )}
    </div>
  );
}
