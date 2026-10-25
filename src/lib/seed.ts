import type { Session } from "./types";

// Seis semanas de treino ABC com progressão, para quem quer ver o app funcionando antes de treinar.
const PLAN: Record<string, { name: string; color: Session["color"]; items: [string, number, number, number][] }> = {
  "ficha-a": {
    name: "Treino A · Peito e tríceps",
    color: "red",
    items: [
      ["supino-reto", 4, 8, 60],
      ["supino-inclinado", 3, 10, 22],
      ["crucifixo", 3, 12, 14],
      ["triceps-pulley", 3, 12, 25],
      ["triceps-frances", 3, 10, 14],
    ],
  },
  "ficha-b": {
    name: "Treino B · Costas e bíceps",
    color: "blue",
    items: [
      ["puxada-frente", 4, 10, 50],
      ["remada-curvada", 4, 8, 50],
      ["remada-unilateral", 3, 10, 24],
      ["rosca-direta", 3, 10, 25],
      ["rosca-martelo", 3, 12, 12],
    ],
  },
  "ficha-c": {
    name: "Treino C · Pernas e ombros",
    color: "yellow",
    items: [
      ["agachamento-livre", 4, 8, 70],
      ["leg-press", 3, 12, 160],
      ["mesa-flexora", 3, 12, 35],
      ["desenvolvimento", 4, 8, 35],
      ["elevacao-lateral", 3, 15, 8],
    ],
  },
};

export function demoSessions(now = Date.now()): Session[] {
  const out: Session[] = [];
  const day = 86_400_000;
  const order = ["ficha-a", "ficha-b", "ficha-c"];
  let n = 0;
  // Segunda, quarta e sexta das últimas seis semanas.
  for (let back = 41; back >= 1; back--) {
    const d = new Date(now - back * day);
    if (![1, 3, 5].includes(d.getDay())) continue;
    const key = order[n % 3];
    const week = Math.floor(n / 3);
    const plan = PLAN[key];
    d.setHours(19, 10, 0, 0);
    const start = d.getTime();
    out.push({
      id: `demo-${n}`,
      templateId: key,
      name: plan.name,
      color: plan.color,
      startedAt: start,
      endedAt: start + (52 + (n % 4) * 6) * 60_000,
      entries: plan.items.map(([exerciseId, sets, reps, base]) => {
        const kg = Math.round((base * (1 + week * 0.035)) / 2.5) * 2.5 || base;
        return {
          exerciseId,
          target: reps,
          rest: 90,
          sets: Array.from({ length: sets }, (_, i) => ({ kg, reps: i === sets - 1 && n % 2 ? reps - 2 : reps, done: true })),
        };
      }),
    });
    n++;
  }
  return out;
}
