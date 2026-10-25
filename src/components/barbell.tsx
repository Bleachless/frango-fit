// Barra vista de lado, com as anilhas olímpicas de cada lado na cor e no tamanho certos.
const STYLE: Record<number, { h: number; w: number; c: string }> = {
  25: { h: 100, w: 18, c: "#e5432f" },
  20: { h: 100, w: 16, c: "#3b7be0" },
  15: { h: 86, w: 14, c: "#f3c13a" },
  10: { h: 72, w: 12, c: "#3fae6d" },
  5: { h: 52, w: 10, c: "#d9d3c6" },
  2.5: { h: 40, w: 8, c: "#e5432f" },
  1.25: { h: 32, w: 7, c: "#a9a59a" },
};

export function Barbell({ plates }: { plates: number[] }) {
  const side = (reverse: boolean) => {
    const list = reverse ? [...plates].reverse() : plates;
    return list.map((p, i) => {
      const s = STYLE[p] ?? STYLE[1.25];
      return (
        <span
          key={`${p}-${i}`}
          className="anim-pop shrink-0 rounded-[3px] border border-black/40"
          style={{ height: `calc(var(--plate) * ${s.h / 100})`, width: s.w, background: s.c, animationDelay: `${i * 40}ms` }}
          title={`${p} kg`}
        />
      );
    });
  };
  return (
    <div className="flex items-center" style={{ ["--plate" as string]: "clamp(5rem, 22vw, 8rem)" }} aria-label={`Anilhas por lado: ${plates.join(", ") || "nenhuma"}`}>
      <div className="h-3 w-4 shrink-0 bg-chalk-dim sm:w-10" />
      <div className="flex shrink-0 items-center gap-[2px]">{side(true)}</div>
      <div className="h-6 w-2 shrink-0 bg-chalk-soft" />
      <div className="h-2.5 min-w-8 flex-1 bg-gradient-to-b from-chalk-soft to-chalk-dim" />
      <div className="h-6 w-2 shrink-0 bg-chalk-soft" />
      <div className="flex shrink-0 items-center gap-[2px]">{side(false)}</div>
      <div className="h-3 w-4 shrink-0 bg-chalk-dim sm:w-10" />
    </div>
  );
}
