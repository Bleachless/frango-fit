import type { SVGProps } from "react";

export const PALETTE: Record<string, string> = {
  k: "#1a1612", // contorno
  W: "#f4efe6", // pena
  w: "#c9c0ae", // pena na sombra
  e: "#0d0e0c", // olho
  R: "#e5432f", // crista
  Y: "#f3c13a", // bico e pés
  B: "#3b7be0", // faixa de cabeça
  b: "#8d9188", // barra
  g: "#4a4d45", // ferro escuro
  // Anilha: P é a cor da anilha, Q o brilho e h o miolo. Trocados por anilha.
  P: "#e5432f",
  Q: "#f07a68",
  h: "#151613",
};

// Aplica uma camada por cima da base; "." mantém o pixel de baixo.
const overlay = (base: string[], layer: Record<number, string>) =>
  base.map((row, y) => {
    const l = layer[y];
    if (!l) return row;
    return [...row].map((c, x) => (l[x] && l[x] !== "." ? l[x] : c)).join("");
  });

const mirror = (rows: string[]) => rows.map((r) => r + [...r].reverse().join(""));

// O Frango, de perfil, voando para a direita.
const FRANGO_BODY = [
  "....................",
  "............RR.R....",
  "...........kRRRRk...",
  "..........kWWWWWWk..",
  "..........kWWWWeWWk.",
  "..........kWWWWWWWYY",
  "..k.......kWWWWWWRk.",
  ".kWk.....kWWWWWWWRk.",
  ".kWWk...kWWWWWWWWk..",
  ".kWWWkkkWWWWWWWWWk..",
  "..kWWWWWWWWWWWWWWk..",
  "..kwWWWWWWWWWWWWwk..",
  "...kwwWWWWWWWWwwk...",
  "....kkwwwwwwwwkk....",
  ".......Y....Y.......",
  "......YY...YY.......",
];

const WING_UP = {
  4: ".....kk",
  5: "....kWWk",
  6: "....kWWWk",
  7: ".....kWWWk",
  8: "......kwWWk",
  9: ".......kwwk",
};

const WING_DOWN = {
  9: ".......kkkk",
  10: "......kwWWWk",
  11: "......kWWWWWk",
  12: ".......kWWWWk",
  13: "........kWWk",
  14: ".........kk",
};

const HEADBAND = { 3: "...........BBBBBB" };

const flyUp = overlay(FRANGO_BODY, WING_UP);
const flyDown = overlay(FRANGO_BODY, WING_DOWN);

export const FRANGO = {
  up: flyUp,
  down: flyDown,
  fitUp: overlay(flyUp, HEADBAND),
  fitDown: overlay(flyDown, HEADBAND),
};

// Visual do Frango em cada nível: a faixa muda de cor e, no topo, ele ganha óculos escuros.
// Óculos escuros com um pontinho de brilho na lente.
const SHADES = { 4: ".............kWkkk", 5: "..............kk" };
const BAND_COLORS = ["", "#3b7be0", "#e5432f", "#f3c13a", "#f3c13a"];

export function frangoFor(level: number, wingUp: boolean) {
  let rows = wingUp ? FRANGO.up : FRANGO.down;
  if (level >= 1) rows = overlay(rows, HEADBAND);
  if (level >= 4) rows = overlay(rows, SHADES);
  return { rows, colors: level >= 1 ? { B: BAND_COLORS[level] } : undefined };
}

// O Frango de frente, para levantar a barra no minigame.
const LIFTER_BASE = mirror([
  "......RR",
  ".....RRR",
  "....kkkk",
  "...kWWWW",
  "...kWeWW",
  "...kWWWY",
  "...kWWWR",
  "..kWWWWW",
  ".kWWWWWW",
  ".kWWWWWW",
  ".kwWWWWW",
  ".kwwWWWW",
  "..kwwwww",
  "...kkkkk",
  "....Y...",
  "...YY...",
]);

const wings = (layer: Record<number, string>) =>
  Object.fromEntries(Object.entries(layer).map(([y, half]) => [y, half.padEnd(8, ".") + [...half.padEnd(8, ".")].reverse().join("")]));

export const LIFTER = {
  rack: overlay(LIFTER_BASE, wings({ 6: "kk", 7: "kWk", 8: "kWW", 9: ".kW" })),
  press: overlay(LIFTER_BASE, wings({ 0: "kk", 1: "kWk", 2: "kWk", 3: ".kWk", 4: ".kWk", 5: "..k", 6: "..k" })),
  // Onde as asas seguram a barra em cada pose.
  barRow: { rack: 7, press: 0 },
};

// Junta pixels vizinhos da mesma cor num retângulo só, para o SVG ficar leve.
function runs(rows: string[], palette: Record<string, string>) {
  const out: { x: number; y: number; w: number; c: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let w = 1;
      while (row[x + w] === c) w++;
      if (c !== "." && palette[c]) out.push({ x, y, w, c: palette[c] });
      x += w;
    }
  });
  return out;
}

export function PixelGroup({
  rows,
  x = 0,
  y = 0,
  flip = false,
  colors,
}: {
  rows: string[];
  x?: number;
  y?: number;
  flip?: boolean;
  colors?: Record<string, string>;
}) {
  const palette = colors ? { ...PALETTE, ...colors } : PALETTE;
  const w = rows[0].length;
  return (
    <g transform={`translate(${x} ${y})${flip ? ` translate(${w} 0) scale(-1 1)` : ""}`}>
      {runs(rows, palette).map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </g>
  );
}

export function Pixels({
  rows,
  flip,
  colors,
  ...props
}: { rows: string[]; flip?: boolean; colors?: Record<string, string> } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={`0 0 ${rows[0].length} ${rows.length}`} shapeRendering="crispEdges" aria-hidden {...props}>
      <PixelGroup rows={rows} flip={flip} colors={colors} />
    </svg>
  );
}

// Anilha olímpica desenhada a partir de um círculo em grade.
export function plateRows(size: number) {
  const c = (size - 1) / 2;
  const R = size / 2;
  const rows: string[] = [];
  for (let y = 0; y < size; y++) {
    let row = "";
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > R) row += ".";
      else if (d > R - 1.2) row += "k";
      else if (d > R - 2.4) row += x + y < size - 3 ? "Q" : "P";
      else if (d > R - 3.4) row += "k";
      else if (d > size * 0.17) row += "P";
      else if (d > size * 0.1) row += "g";
      else row += "h";
    }
    rows.push(row);
  }
  return rows;
}

export const PLATE_COLORS = {
  red: { P: "#e5432f", Q: "#f07a68" },
  blue: { P: "#3b7be0", Q: "#79a6ee" },
  yellow: { P: "#f3c13a", Q: "#f8d97f" },
  green: { P: "#3fae6d", Q: "#7ccb9b" },
  white: { P: "#d9d3c6", Q: "#f4efe6" },
} as const;

export type PlateColor = keyof typeof PLATE_COLORS;

export function Plate({ size = 24, color = "red", ...props }: { size?: number; color?: PlateColor } & SVGProps<SVGSVGElement>) {
  return <Pixels rows={plateRows(size)} colors={PLATE_COLORS[color]} {...props} />;
}

export function DumbbellIcon(props: SVGProps<SVGSVGElement>) {
  const rows = [
    ".kk........kk.",
    "kPPk......kPPk",
    "kPPkkkkkkkkPPk",
    "kPPkbbbbbbkPPk",
    "kPPkkkkkkkkPPk",
    "kPPk......kPPk",
    ".kk........kk.",
  ];
  return <Pixels rows={rows} {...props} />;
}
