"use client";

import { useApp } from "./store";

// Sons 8-bit sintetizados na hora, sem arquivo de áudio. Respeitam o botão de mudo.
let ctx: AudioContext | null = null;

function audio() {
  if (useApp.getState().muted) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

type Note = { f: number; to?: number; at?: number; dur?: number; type?: OscillatorType; vol?: number };

function play(notes: Note[]) {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  for (const n of notes) {
    const t = now + (n.at ?? 0);
    const dur = n.dur ?? 0.1;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = n.type ?? "square";
    osc.frequency.setValueAtTime(n.f, t);
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t + dur);
    gain.gain.setValueAtTime(n.vol ?? 0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
}

function noise(dur = 0.2, vol = 0.06) {
  const ac = audio();
  if (!ac) return;
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.buffer = buffer;
  src.connect(gain).connect(ac.destination);
  src.start();
}

const seq = (freqs: number[], step: number, extra: Partial<Note> = {}) =>
  freqs.map((f, i) => ({ f, at: i * step, dur: step * 0.95, ...extra }));

export const sfx = {
  click: () => play([{ f: 660, dur: 0.04, vol: 0.03 }]),
  start: () => play(seq([523, 659, 784, 1047], 0.07)),
  jump: () => play([{ f: 380, to: 820, dur: 0.12, vol: 0.04 }]),
  coin: () => play([{ f: 988, dur: 0.06 }, { f: 1319, at: 0.06, dur: 0.12 }]),
  lift: () => play([{ f: 392, to: 784, dur: 0.12, vol: 0.045 }]),
  perfect: () => play(seq([784, 988, 1175, 1568], 0.05, { vol: 0.045 })),
  rep: (n: number) => play([{ f: 440 + (n % 12) * 40, dur: 0.035, vol: 0.03 }]),
  hurt: () => {
    noise(0.15, 0.05);
    play([{ f: 220, to: 90, dur: 0.22, type: "sawtooth", vol: 0.04 }]);
  },
  gameOver: () => play(seq([392, 330, 262, 196], 0.13, { type: "triangle", vol: 0.07 })),
  record: () => play(seq([523, 659, 784, 1047, 784, 1047], 0.09, { vol: 0.05 })),
  timer: () => play(seq([660, 660, 880], 0.18, { vol: 0.06 })),
  cluck: () => play([{ f: 900, to: 600, dur: 0.06, vol: 0.035 }, { f: 1000, to: 650, at: 0.08, dur: 0.07, vol: 0.035 }]),
  plate: () => play([{ f: 140, to: 70, dur: 0.18, type: "triangle", vol: 0.12 }]),
};
