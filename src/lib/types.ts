export type Group = "Peito" | "Costas" | "Pernas" | "Ombros" | "Bíceps" | "Tríceps" | "Core";

export type PlateColor = "red" | "blue" | "yellow" | "green" | "white";

export type Exercise = { id: string; name: string; group: Group; custom?: boolean };

// Um exercício dentro da ficha: quantas séries, quantas repetições e quanto descanso.
export type TemplateItem = { exerciseId: string; sets: number; reps: number; rest: number };

export type Template = { id: string; name: string; color: PlateColor; items: TemplateItem[] };

export type SetLog = { kg: number; reps: number; done: boolean };

export type Entry = { exerciseId: string; target: number; rest: number; sets: SetLog[] };

export type Session = {
  id: string;
  templateId: string | null;
  name: string;
  color: PlateColor;
  startedAt: number;
  endedAt: number | null;
  entries: Entry[];
};
