import { describe, expect, it } from "vitest";
import { buildPlan, decodePlan, encodePlan, mergePlan } from "./plan";
import type { Exercise, Template } from "./types";

const custom: Exercise[] = [
  { id: "custom-abc", name: "Remada no TRX", group: "Costas", custom: true },
  { id: "custom-xyz", name: "Exercício que não está na ficha", group: "Core", custom: true },
];

const templates: Template[] = [
  {
    id: "t1",
    name: "Treino A · Peito",
    color: "red",
    items: [
      { exerciseId: "supino-reto", sets: 4, reps: 8, rest: 120, kg: 40, note: "cadência 3-1-1" },
      { exerciseId: "crucifixo", sets: 3, reps: 12, rest: 60 },
    ],
  },
  { id: "t2", name: "Treino B · Costas", color: "blue", items: [{ exerciseId: "custom-abc", sets: 3, reps: 15, rest: 45, kg: 0, note: "pés à frente" }] },
];

const plan = buildPlan({ id: "p1", coach: "Carla", student: "João", note: "Bebe água!", templates }, custom);
let n = 0;
const newId = () => `id${++n}`;

describe("plano do personal", () => {
  it("leva só os exercícios próprios que as fichas usam", () => {
    expect(plan.exercises.map((e) => e.name)).toEqual(["Remada no TRX"]);
  });

  it("vai e volta pelo link sem perder carga, observação nem o exercício próprio", () => {
    const back = decodePlan(encodePlan(plan))!;
    expect(back.coach).toBe("Carla");
    expect(back.student).toBe("João");
    expect(back.note).toBe("Bebe água!");
    expect(back.templates).toHaveLength(2);
    expect(back.templates[0].items[0]).toEqual({ exerciseId: "supino-reto", sets: 4, reps: 8, rest: 120, kg: 40, note: "cadência 3-1-1" });
    expect(back.templates[0].items[1]).toEqual({ exerciseId: "crucifixo", sets: 3, reps: 12, rest: 60 });
    const trx = back.templates[1].items[0];
    expect(back.exercises.find((e) => e.id === trx.exerciseId)?.name).toBe("Remada no TRX");
    expect(trx.note).toBe("pés à frente");
  });

  it("link quebrado ou exercício desconhecido não derrubam nada", () => {
    expect(decodePlan("lixo")).toBeNull();
    const weird = decodePlan(encodePlan({ ...plan, exercises: [], templates: [{ ...templates[0], items: [{ exerciseId: "nao-existe", sets: 3, reps: 10, rest: 60 }] }] }))!;
    expect(weird.templates[0].items).toEqual([]);
  });

  it("importa criando o exercício próprio e marcando de quem veio", () => {
    const back = decodePlan(encodePlan(plan))!;
    const out = mergePlan({ templates: [], customExercises: [] }, back, newId);
    expect(out.updated).toBe(false);
    expect(out.customExercises).toHaveLength(1);
    expect(out.templates.map((t) => t.coach)).toEqual([
      { plan: "p1", name: "Carla" },
      { plan: "p1", name: "Carla" },
    ]);
    expect(out.templates[1].items[0].exerciseId).toBe(out.customExercises[0].id);
  });

  it("mandar de novo atualiza as fichas no lugar e reaproveita o exercício", () => {
    const back = decodePlan(encodePlan(plan))!;
    const mine: Template = { id: "minha", name: "Minha ficha", color: "green", items: [] };
    const first = mergePlan({ templates: [mine], customExercises: [] }, back, newId);
    const v2 = decodePlan(encodePlan({ ...plan, templates: [templates[1]] }))!;
    const second = mergePlan(first, v2, newId);
    expect(second.updated).toBe(true);
    expect(second.templates.map((t) => t.name)).toEqual(["Minha ficha", "Treino B · Costas"]);
    expect(second.customExercises).toHaveLength(1);
  });
});
