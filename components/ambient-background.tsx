/**
 * App-wide ambient depth: drifting gold/sky/violet light + a perspective grid
 * floor. Pure CSS (GPU transforms), theme-aware, and frozen under reduced-motion.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />
      <div className="ambient-glow ambient-glow-3" />
      <div className="ambient-grid" />
    </div>
  );
}
