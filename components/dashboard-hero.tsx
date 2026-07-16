import type { ReactNode } from "react";
import { WebglBackground } from "./webgl-background";

/** A dark WebGL masthead for the dashboard. The shader degrades to a CSS
 *  gradient on mobile / reduced-motion (see WebglBackground). */
export function DashboardHero({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1c] shadow-[var(--shadow-md)]">
      <WebglBackground className="absolute inset-0 block h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0a0f1c]/80 via-[#0a0f1c]/25 to-transparent" />
      <div className="relative z-10 p-6 sm:p-8">{children}</div>
    </div>
  );
}
