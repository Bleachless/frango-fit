"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { lastPerformance, prsBrokenBy, sessionVolume, suggestLoad } from "./calc";
import { EXERCISES } from "./exercises";
import { demoSessions } from "./seed";
import type { Exercise, Group, Session, SetLog, Template, TemplateItem } from "./types";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "ficha-a",
    name: "Treino A · Peito e tríceps",
    color: "red",
    items: [
      { exerciseId: "supino-reto", sets: 4, reps: 8, rest: 120 },
      { exerciseId: "supino-inclinado", sets: 3, reps: 10, rest: 90 },
      { exerciseId: "crucifixo", sets: 3, reps: 12, rest: 60 },
      { exerciseId: "triceps-pulley", sets: 3, reps: 12, rest: 60 },
      { exerciseId: "triceps-frances", sets: 3, reps: 10, rest: 60 },
    ],
  },
  {
    id: "ficha-b",
    name: "Treino B · Costas e bíceps",
    color: "blue",
    items: [
      { exerciseId: "puxada-frente", sets: 4, reps: 10, rest: 90 },
      { exerciseId: "remada-curvada", sets: 4, reps: 8, rest: 120 },
      { exerciseId: "remada-unilateral", sets: 3, reps: 10, rest: 60 },
      { exerciseId: "rosca-direta", sets: 3, reps: 10, rest: 60 },
      { exerciseId: "rosca-martelo", sets: 3, reps: 12, rest: 60 },
    ],
  },
  {
    id: "ficha-c",
    name: "Treino C · Pernas e ombros",
    color: "yellow",
    items: [
      { exerciseId: "agachamento-livre", sets: 4, reps: 8, rest: 150 },
      { exerciseId: "leg-press", sets: 3, reps: 12, rest: 90 },
      { exerciseId: "mesa-flexora", sets: 3, reps: 12, rest: 60 },
      { exerciseId: "desenvolvimento", sets: 4, reps: 8, rest: 90 },
      { exerciseId: "elevacao-lateral", sets: 3, reps: 15, rest: 45 },
    ],
  },
];

export type FinishSummary = {
  session: Session;
  volume: number;
  prs: ReturnType<typeof prsBrokenBy>;
};

type State = {
  customExercises: Exercise[];
  templates: Template[];
  sessions: Session[];
  active: Session | null;
  muted: boolean;
  lastSummary: FinishSummary | null;

  addExercise: (name: string, group: Group) => string;
  saveTemplate: (t: Template) => void;
  deleteTemplate: (id: string) => void;

  startSession: (templateId: string | null) => void;
  updateSet: (entry: number, set: number, patch: Partial<SetLog>) => void;
  addSet: (entry: number) => void;
  removeSet: (entry: number, set: number) => void;
  addEntry: (exerciseId: string) => void;
  removeEntry: (entry: number) => void;
  finishSession: () => FinishSummary | null;
  cancelSession: () => void;
  deleteSession: (id: string) => void;

  toggleMute: () => void;
  loadDemo: () => void;
  importData: (raw: string) => boolean;
  resetAll: () => void;
};

const entryFor = (sessions: Session[], item: TemplateItem) => {
  const s = suggestLoad(lastPerformance(sessions, item.exerciseId), item.reps);
  return {
    exerciseId: item.exerciseId,
    target: item.reps,
    rest: item.rest,
    sets: Array.from({ length: item.sets }, () => ({ kg: s.kg, reps: item.reps, done: false })),
  };
};

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      customExercises: [],
      templates: DEFAULT_TEMPLATES,
      sessions: [],
      active: null,
      muted: false,
      lastSummary: null,

      addExercise: (name, group) => {
        const id = `custom-${uid()}`;
        set((s) => ({ customExercises: [...s.customExercises, { id, name: name.trim(), group, custom: true }] }));
        return id;
      },
      saveTemplate: (t) =>
        set((s) => ({
          templates: s.templates.some((x) => x.id === t.id) ? s.templates.map((x) => (x.id === t.id ? t : x)) : [...s.templates, t],
        })),
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      startSession: (templateId) => {
        const { templates, sessions } = get();
        const t = templates.find((x) => x.id === templateId);
        set({
          active: {
            id: uid(),
            templateId,
            name: t?.name ?? "Treino livre",
            color: t?.color ?? "white",
            startedAt: Date.now(),
            endedAt: null,
            entries: t ? t.items.map((item) => entryFor(sessions, item)) : [],
          },
        });
      },
      updateSet: (ei, si, patch) =>
        set((s) => {
          if (!s.active) return s;
          const entries = s.active.entries.map((e, i) =>
            i !== ei ? e : { ...e, sets: e.sets.map((x, j) => (j !== si ? x : { ...x, ...patch })) },
          );
          return { active: { ...s.active, entries } };
        }),
      addSet: (ei) =>
        set((s) => {
          if (!s.active) return s;
          const entries = s.active.entries.map((e, i) => {
            if (i !== ei) return e;
            const last = e.sets[e.sets.length - 1] ?? { kg: 0, reps: e.target, done: false };
            return { ...e, sets: [...e.sets, { kg: last.kg, reps: last.reps, done: false }] };
          });
          return { active: { ...s.active, entries } };
        }),
      removeSet: (ei, si) =>
        set((s) => {
          if (!s.active) return s;
          const entries = s.active.entries.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.filter((_, j) => j !== si) }));
          return { active: { ...s.active, entries } };
        }),
      addEntry: (exerciseId) =>
        set((s) => {
          if (!s.active) return s;
          const entry = entryFor(s.sessions, { exerciseId, sets: 3, reps: 10, rest: 90 });
          return { active: { ...s.active, entries: [...s.active.entries, entry] } };
        }),
      removeEntry: (ei) =>
        set((s) => (s.active ? { active: { ...s.active, entries: s.active.entries.filter((_, i) => i !== ei) } } : s)),

      finishSession: () => {
        const { active, sessions } = get();
        if (!active) return null;
        const session: Session = {
          ...active,
          endedAt: Date.now(),
          // Guarda só o que foi feito de verdade.
          entries: active.entries.map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) })).filter((e) => e.sets.length > 0),
        };
        const summary: FinishSummary = { session, volume: sessionVolume(session), prs: prsBrokenBy(session, sessions) };
        set({ sessions: [...sessions, session], active: null, lastSummary: summary });
        return summary;
      },
      cancelSession: () => set({ active: null }),
      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      toggleMute: () => set((s) => ({ muted: !s.muted })),
      loadDemo: () => set({ sessions: demoSessions(), templates: DEFAULT_TEMPLATES, active: null }),
      importData: (raw) => {
        try {
          const data = JSON.parse(raw) as Partial<State>;
          if (!Array.isArray(data.sessions) || !Array.isArray(data.templates)) return false;
          set({
            sessions: data.sessions,
            templates: data.templates,
            customExercises: Array.isArray(data.customExercises) ? data.customExercises : [],
            active: null,
          });
          return true;
        } catch {
          return false;
        }
      },
      resetAll: () => set({ customExercises: [], templates: DEFAULT_TEMPLATES, sessions: [], active: null, lastSummary: null }),
    }),
    {
      name: "frango-fit",
      version: 1,
      partialize: (s) => ({
        customExercises: s.customExercises,
        templates: s.templates,
        sessions: s.sessions,
        active: s.active,
        muted: s.muted,
      }),
    },
  ),
);

// Os dados moram no navegador: até carregarem, as telas mostram um esqueleto em vez de piscar vazio.
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useApp.persist.onFinishHydration(cb),
    () => useApp.persist.hasHydrated(),
    () => false,
  );
}

export function useExercises() {
  const custom = useApp((s) => s.customExercises);
  return custom.length ? [...EXERCISES, ...custom] : EXERCISES;
}

