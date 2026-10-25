import { dayKey, round, weekStart } from "@/lib/calc";

// Gráfico de linha simples em SVG: evolução de um exercício.
export function LineChart({
  points,
  unit = "kg",
  color = "#f3c13a",
}: {
  points: { at: number; value: number }[];
  unit?: string;
  color?: string;
}) {
  if (points.length === 0) return <p className="py-10 text-center text-sm text-chalk-dim">Sem dados ainda.</p>;
  const W = 600;
  const H = 220;
  const pad = { l: 44, r: 16, t: 16, b: 28 };
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.max(1, max * 0.1);
  const lo = min - span * 0.15;
  const hi = max + span * 0.15;
  const x = (i: number) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${path} L${x(points.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`;
  const ticks = [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.15];
  const best = values.indexOf(max);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={`Evolução de ${round(min)} a ${round(max)} ${unit}`}>
      <defs>
        <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#2b2d27" strokeDasharray="3 5" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6f6c64">
            {round(t)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#fill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={p.at}>
          <circle cx={x(i)} cy={y(p.value)} r={i === best ? 6 : 3.5} fill={i === best ? "#e5432f" : color} stroke="#0d0e0c" strokeWidth="2">
            <title>
              {new Date(p.at).toLocaleDateString("pt-BR")}: {round(p.value)} {unit}
            </title>
          </circle>
        </g>
      ))}
      <text x={pad.l} y={H - 8} fontSize="11" fill="#6f6c64">
        {new Date(points[0].at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
      </text>
      <text x={W - pad.r} y={H - 8} textAnchor="end" fontSize="11" fill="#6f6c64">
        {new Date(points[points.length - 1].at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
      </text>
    </svg>
  );
}

// Barras de volume por semana.
export function BarChart({ data }: { data: { week: number; volume: number; sessions: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.volume));
  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((d, i) => {
        const current = i === data.length - 1;
        return (
          <div key={d.week} className="flex h-full flex-1 flex-col justify-end gap-1.5">
            <span className="text-center font-pixel text-[8px] text-chalk-dim">{d.volume ? `${round(d.volume / 1000)}t` : ""}</span>
            <div
              className={`w-full rounded-t-sm ${current ? "bg-plate-yellow" : "bg-plate-blue/70"}`}
              style={{ height: `${Math.max(2, (d.volume / max) * 100)}%` }}
              title={`${d.sessions} treino(s), ${round(d.volume)} kg`}
            />
            <span className="text-center font-pixel text-[8px] text-chalk-dim">
              {new Date(d.week).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Mapa de frequência estilo GitHub: cada quadrado é um dia, mais forte quanto mais volume.
export function Heatmap({ volumes, now, weeks = 16 }: { volumes: Map<string, number>; now: number; weeks?: number }) {
  const day = 86_400_000;
  const start = weekStart(now) - (weeks - 1) * 7 * day;
  const max = Math.max(1, ...volumes.values());
  const today = dayKey(now);
  const cols = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const ts = start + (w * 7 + d) * day;
      const key = dayKey(ts);
      return { key, v: volumes.get(key) ?? 0, future: ts > now, today: key === today };
    }),
  );
  const tone = (v: number) => (v === 0 ? "bg-iron-3" : v < max * 0.33 ? "bg-plate-green/40" : v < max * 0.66 ? "bg-plate-green/70" : "bg-plate-green");
  return (
    <div className="overflow-x-auto">
      <div className="flex w-max gap-1">
        {cols.map((col, i) => (
          <div key={i} className="flex flex-col gap-1">
            {col.map((c) => (
              <span
                key={c.key}
                title={`${c.key}: ${c.v ? `${round(c.v)} kg` : "descanso"}`}
                className={`h-3.5 w-3.5 rounded-[2px] ${c.future ? "bg-transparent" : tone(c.v)} ${c.today ? "ring-1 ring-plate-yellow" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
