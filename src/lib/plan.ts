// Ficha do personal para o aluno: vai inteira no link, compactada depois do "#".
// Não passa por servidor e funciona até mandando o QR Code na academia.
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { EXERCISES, GROUPS } from "./exercises";
import type { Exercise, Group, PlateColor, Template } from "./types";

export type Plan = {
  id: string;
  coach: string;
  student: string;
  note: string;
  templates: Template[];
  exercises: Exercise[]; // exercícios criados pelo personal (os da biblioteca vão só pelo id)
};

const COLORS: PlateColor[] = ["red", "blue", "yellow", "green", "white"];
const KNOWN = new Set(EXERCISES.map((e) => e.id));
const str = (x: unknown, max: number) => (typeof x === "string" ? x.slice(0, max) : "");
const num = (x: unknown, min: number, max: number) => (typeof x === "number" && Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : min);

// Monta o plano a partir das fichas, levando junto só os exercícios próprios que elas usam.
export function buildPlan(p: Omit<Plan, "exercises">, custom: Exercise[]): Plan {
  const used = new Set(p.templates.flatMap((t) => t.items.map((i) => i.exerciseId)));
  return { ...p, exercises: custom.filter((e) => used.has(e.id) && !KNOWN.has(e.id)) };
}

// Formato curto: listas posicionais em vez de objetos, para o link (e o QR Code) ficarem menores.
export function encodePlan(plan: Plan) {
  const exIndex = new Map(plan.exercises.map((e, i) => [e.id, i]));
  const data = [
    1,
    plan.id,
    plan.coach,
    plan.student,
    plan.note,
    plan.exercises.map((e) => [e.name, GROUPS.indexOf(e.group)]),
    plan.templates.map((t) => [
      t.name,
      COLORS.indexOf(t.color),
      t.items.map((it) => {
        const ref = exIndex.has(it.exerciseId) ? exIndex.get(it.exerciseId)! : it.exerciseId;
        const row: unknown[] = [ref, it.sets, it.reps, it.rest];
        if (it.kg || it.note) row.push(it.kg ?? 0);
        if (it.note) row.push(it.note);
        return row;
      }),
    ]),
  ];
  return compressToEncodedURIComponent(JSON.stringify(data));
}

export function decodePlan(code: string): Plan | null {
  try {
    const raw = decompressFromEncodedURIComponent(code);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!Array.isArray(d) || d[0] !== 1) return null;
    const id = str(d[1], 40);
    const exercises: Exercise[] = (Array.isArray(d[5]) ? d[5] : []).slice(0, 100).map((e: unknown[], i: number) => ({
      id: `plan-${id}-${i}`,
      name: str(e?.[0], 60) || "Exercício",
      group: (GROUPS[num(e?.[1], 0, GROUPS.length - 1)] ?? "Core") as Group,
      custom: true,
    }));
    const templates: Template[] = (Array.isArray(d[6]) ? d[6] : []).slice(0, 14).map((t: unknown[], k: number) => ({
      id: `plan-${id}-t${k}`,
      name: str(t?.[0], 60) || `Treino ${String.fromCharCode(65 + k)}`,
      color: COLORS[num(t?.[1], 0, COLORS.length - 1)] ?? "red",
      items: (Array.isArray(t?.[2]) ? (t[2] as unknown[][]) : [])
        .slice(0, 30)
        .map((it) => {
          const ref = it?.[0];
          const exerciseId = typeof ref === "number" ? exercises[ref]?.id : KNOWN.has(str(ref, 60)) ? str(ref, 60) : undefined;
          if (!exerciseId) return null;
          const kg = num(it[4], 0, 1000);
          const note = str(it[5], 120);
          return {
            exerciseId,
            sets: Math.round(num(it[1], 1, 20)),
            reps: Math.round(num(it[2], 1, 100)),
            rest: Math.round(num(it[3], 0, 900)),
            ...(kg ? { kg } : {}),
            ...(note ? { note } : {}),
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    }));
    return { id, coach: str(d[2], 40), student: str(d[3], 40), note: str(d[4], 400), templates, exercises };
  } catch {
    return null;
  }
}

// Junta o plano no app do aluno: cria os exercícios próprios que faltam (reaproveita se já existir um com o
// mesmo nome e grupo) e troca as fichas que vieram antes desse mesmo envio, em vez de duplicar.
export function mergePlan(
  current: { templates: Template[]; customExercises: Exercise[] },
  plan: Plan,
  newId: () => string,
): { templates: Template[]; customExercises: Exercise[]; updated: boolean } {
  const key = (e: Exercise) => `${e.name.trim().toLowerCase()}|${e.group}`;
  const customExercises = [...current.customExercises];
  const map = new Map<string, string>();
  for (const e of plan.exercises) {
    const existing = customExercises.find((c) => key(c) === key(e));
    if (existing) map.set(e.id, existing.id);
    else {
      const id = `custom-${newId()}`;
      customExercises.push({ id, name: e.name, group: e.group, custom: true });
      map.set(e.id, id);
    }
  }
  const updated = current.templates.some((t) => t.coach?.plan === plan.id);
  const kept = current.templates.filter((t) => t.coach?.plan !== plan.id);
  const incoming = plan.templates.map((t) => ({
    ...t,
    id: newId(),
    coach: { plan: plan.id, name: plan.coach },
    items: t.items.map((it) => ({ ...it, exerciseId: map.get(it.exerciseId) ?? it.exerciseId })),
  }));
  return { templates: [...kept, ...incoming], customExercises, updated };
}
