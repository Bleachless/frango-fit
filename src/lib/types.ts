export type Group = "Peito" | "Costas" | "Pernas" | "Glúteos" | "Ombros" | "Bíceps" | "Tríceps" | "Antebraço" | "Core";

export type Equip = "Barra" | "Halter" | "Máquina" | "Polia" | "Smith" | "Kettlebell" | "Peso corporal" | "Elástico";

export type PlateColor = "red" | "blue" | "yellow" | "green" | "white";

export type Exercise = { id: string; name: string; group: Group; equip?: Equip; custom?: boolean };

// Um exercício dentro da ficha: quantas séries, quantas repetições e quanto descanso.
// kg e note vêm em geral do personal: carga para começar e uma observação ("cadência 3-1-1").
export type TemplateItem = { exerciseId: string; sets: number; reps: number; rest: number; kg?: number; note?: string };

// coach: a ficha veio de um personal (plan identifica o envio, para atualizar sem duplicar).
export type Template = { id: string; name: string; color: PlateColor; items: TemplateItem[]; coach?: { plan: string; name: string } };

export type SetLog = { kg: number; reps: number; done: boolean };

export type Entry = { exerciseId: string; target: number; rest: number; sets: SetLog[]; note?: string };

export type Session = {
  id: string;
  templateId: string | null;
  name: string;
  color: PlateColor;
  startedAt: number;
  endedAt: number | null;
  entries: Entry[];
};
