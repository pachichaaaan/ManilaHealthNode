import { cn, initials } from "@/lib/utils";

const SOLID: Record<string, string> = {
  gold: "var(--stage-gold)",
  sky: "var(--stage-sky)",
  emerald: "var(--stage-emerald)",
  rose: "var(--stage-rose)",
  slate: "var(--stage-slate)",
  violet: "var(--accent-violet)",
};

const FG: Record<string, string> = {
  gold: "var(--stage-gold-fg)",
  sky: "var(--stage-sky-fg)",
  emerald: "var(--stage-emerald-fg)",
  rose: "var(--stage-rose-fg)",
  slate: "var(--stage-slate-fg)",
  violet: "var(--accent-violet)",
};

export function Avatar({
  name,
  accent = "slate",
  size = 36,
  className,
}: {
  name: string;
  accent?: string;
  size?: number;
  className?: string;
}) {
  const solid = SOLID[accent] ?? SOLID.slate;
  const fg = FG[accent] ?? FG.slate;
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-display font-semibold",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: `color-mix(in srgb, ${solid} 18%, var(--surface))`,
        color: fg,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${solid} 38%, transparent)`,
      }}
      title={name}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
