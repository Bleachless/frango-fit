"use client";

import { useSyncExternalStore } from "react";

// Relógio compartilhado: só lê a hora no navegador (no servidor devolve 0),
// assim a pré-renderização não congela um horário errado.
type Tick = { value: number; listeners: Set<() => void>; timer: ReturnType<typeof setInterval> | null };
const ticks = new Map<number, Tick>();

function tick(ms: number) {
  let t = ticks.get(ms);
  if (!t) {
    t = { value: Date.now(), listeners: new Set(), timer: null };
    ticks.set(ms, t);
  }
  return t;
}

function subscribe(ms: number, cb: () => void) {
  const t = tick(ms);
  t.listeners.add(cb);
  t.timer ??= setInterval(() => {
    t.value = Date.now();
    t.listeners.forEach((l) => l());
  }, ms);
  return () => {
    t.listeners.delete(cb);
    if (t.listeners.size === 0 && t.timer) {
      clearInterval(t.timer);
      t.timer = null;
    }
  };
}

export function useNow(ms = 1000) {
  return useSyncExternalStore(
    (cb) => subscribe(ms, cb),
    () => tick(ms).value,
    () => 0,
  );
}
