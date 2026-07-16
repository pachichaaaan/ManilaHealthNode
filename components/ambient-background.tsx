/**
 * Clean backdrop: the neutral theme background (from `body`) with a single very
 * soft purple glow up top — a whisper of brand, not a wash.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute left-1/2 top-[-32vh] h-[64vh] w-[110vw] -translate-x-1/2 rounded-[50%] blur-[130px]"
        style={{
          background: "radial-gradient(closest-side, color-mix(in srgb, var(--gold) 24%, transparent), transparent)",
          opacity: 0.3,
        }}
      />
    </div>
  );
}
