import type { Entry, Session, SetLog } from "./types";

const DAY = 86_400_000;

export const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
export const fmtKg = (n: number) => `${round(n).toLocaleString("pt-BR")} kg`;

// ---------- Datas ----------

export function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Segunda-feira 00:00 da semana do timestamp.
export function weekStart(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7;
  return d.getTime() - dow * DAY;
}

export const finished = (sessions: Session[]) => sessions.filter((s) => s.endedAt !== null).sort((a, b) => a.startedAt - b.startedAt);

// ---------- Volume e força ----------

export const setVolume = (s: SetLog) => (s.done ? s.kg * s.reps : 0);
export const entryVolume = (e: Entry) => e.sets.reduce((t, s) => t + setVolume(s), 0);
export const sessionVolume = (s: Session) => s.entries.reduce((t, e) => t + entryVolume(e), 0);
export const doneSets = (s: Session) => s.entries.reduce((t, e) => t + e.sets.filter((x) => x.done).length, 0);

// 1RM estimado pela fórmula de Epley.
export const e1rm = (kg: number, reps: number) => (reps <= 0 || kg <= 0 ? 0 : reps === 1 ? kg : kg * (1 + reps / 30));

export function bestSet(e: Entry) {
  let best: SetLog | null = null;
  for (const s of e.sets) if (s.done && (!best || e1rm(s.kg, s.reps) > e1rm(best.kg, best.reps))) best = s;
  return best;
}

// Evolução de um exercício ao longo das sessões.
export function exerciseHistory(sessions: Session[], exerciseId: string) {
  const points: { at: number; e1rm: number; maxKg: number; volume: number; best: SetLog }[] = [];
  for (const s of finished(sessions)) {
    for (const e of s.entries) {
      if (e.exerciseId !== exerciseId) continue;
      const b = bestSet(e);
      if (!b) continue;
      points.push({
        at: s.startedAt,
        e1rm: round(e1rm(b.kg, b.reps)),
        maxKg: Math.max(...e.sets.filter((x) => x.done).map((x) => x.kg)),
        volume: entryVolume(e),
        best: b,
      });
    }
  }
  return points;
}

// Recorde pessoal (melhor 1RM estimado) de cada exercício.
export function personalRecords(sessions: Session[]) {
  const prs = new Map<string, { e1rm: number; set: SetLog; at: number }>();
  for (const s of finished(sessions)) {
    for (const e of s.entries) {
      const b = bestSet(e);
      if (!b) continue;
      const v = e1rm(b.kg, b.reps);
      const cur = prs.get(e.exerciseId);
      if (!cur || v > cur.e1rm) prs.set(e.exerciseId, { e1rm: round(v), set: b, at: s.startedAt });
    }
  }
  return prs;
}

// Recordes que uma sessão quebrou em relação ao que existia antes dela.
export function prsBrokenBy(session: Session, before: Session[]) {
  const old = personalRecords(before.filter((s) => s.id !== session.id && s.startedAt < session.startedAt));
  const out: { exerciseId: string; e1rm: number; set: SetLog; previous: number | null }[] = [];
  for (const e of session.entries) {
    const b = bestSet(e);
    if (!b) continue;
    const v = round(e1rm(b.kg, b.reps));
    const prev = old.get(e.exerciseId)?.e1rm ?? null;
    if (prev === null || v > prev) out.push({ exerciseId: e.exerciseId, e1rm: v, set: b, previous: prev });
  }
  return out;
}

// ---------- Carga progressiva ----------

export function lastPerformance(sessions: Session[], exerciseId: string, excludeId?: string) {
  const list = finished(sessions).filter((s) => s.id !== excludeId);
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i].entries.find((x) => x.exerciseId === exerciseId && x.sets.some((s) => s.done));
    if (e) return { at: list[i].startedAt, sets: e.sets.filter((s) => s.done) };
  }
  return null;
}

// Bateu todas as repetições da última vez? Sobe a carga. Senão, repete até bater.
export function suggestLoad(last: ReturnType<typeof lastPerformance>, targetReps: number) {
  if (!last || last.sets.length === 0) return { kg: 0, note: "Primeira vez: comece leve e anote." };
  const top = Math.max(...last.sets.map((s) => s.kg));
  const hitAll = last.sets.every((s) => s.reps >= targetReps);
  if (hitAll) {
    const step = top >= 40 ? 2.5 : top >= 10 ? 2 : 1;
    return { kg: round(top + step), note: `Bateu ${targetReps} reps em tudo: +${step} kg` };
  }
  return { kg: top, note: "Repete a carga até bater todas as reps" };
}

// ---------- Frequência ----------

export function weeklyStreak(sessions: Session[], now = Date.now()) {
  const weeks = new Set(finished(sessions).map((s) => weekStart(s.startedAt)));
  let w = weekStart(now);
  if (!weeks.has(w)) w -= 7 * DAY; // A semana atual ainda pode estar começando.
  let streak = 0;
  while (weeks.has(w)) {
    streak++;
    w -= 7 * DAY;
  }
  return streak;
}

export function sessionsThisWeek(sessions: Session[], now = Date.now()) {
  const w = weekStart(now);
  return finished(sessions).filter((s) => s.startedAt >= w).length;
}

export function dailyVolume(sessions: Session[]) {
  const map = new Map<string, number>();
  for (const s of finished(sessions)) map.set(dayKey(s.startedAt), (map.get(dayKey(s.startedAt)) ?? 0) + sessionVolume(s));
  return map;
}

export function weeklyVolume(sessions: Session[], weeks = 8, now = Date.now()) {
  const start = weekStart(now) - (weeks - 1) * 7 * DAY;
  const out = Array.from({ length: weeks }, (_, i) => ({ week: start + i * 7 * DAY, volume: 0, sessions: 0 }));
  for (const s of finished(sessions)) {
    const i = Math.floor((weekStart(s.startedAt) - start) / (7 * DAY));
    if (i >= 0 && i < weeks) {
      out[i].volume += sessionVolume(s);
      out[i].sessions++;
    }
  }
  return out;
}

// ---------- Nível do Frango ----------

export const LEVELS = [
  { min: 0, name: "Frango", line: "Todo monstro já foi frango um dia." },
  { min: 1000, name: "Frango Fit", line: "Ganhou a faixa. Agora é sério." },
  { min: 4000, name: "Marombeiro", line: "Já pede foto no espelho." },
  { min: 12000, name: "Monstro", line: "Saindo da jaula!" },
  { min: 30000, name: "Bambam", line: "Ajuda o maluco que tá doente!" },
] as const;

export function xpOf(sessions: Session[]) {
  const done = finished(sessions);
  const volume = done.reduce((t, s) => t + sessionVolume(s), 0);
  return Math.round(volume / 100) + done.length * 50 + personalRecords(done).size * 25;
}

export function levelOf(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].min) i++;
  const next = LEVELS[i + 1];
  const progress = next ? (xp - LEVELS[i].min) / (next.min - LEVELS[i].min) : 1;
  return { index: i, ...LEVELS[i], next, progress: Math.min(1, progress) };
}

// ---------- Anilhas ----------

export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] as const;

// Quais anilhas colocar de cada lado para chegar no peso total.
export function platesFor(total: number, bar: number, available: readonly number[] = PLATES) {
  let side = round((total - bar) / 2, 3);
  const plates: number[] = [];
  if (side < 0) return { plates, leftover: round(total - bar), possible: false };
  for (const p of available) {
    while (side >= p - 1e-9) {
      plates.push(p);
      side = round(side - p, 3);
    }
  }
  return { plates, leftover: round(side * 2, 2), possible: side < 1e-9 };
}

export const minutes = (ms: number) => Math.max(1, Math.round(ms / 60_000));
