"use client";

import { motion, useReducedMotion } from "motion/react";
import { BlurText } from "@/components/blur-text";
import { LoginForm } from "@/components/login-form";
import { KeystoneMark, Logo } from "@/components/logo";

const HIGHLIGHTS = [
  "Members manage their own BD & +1 work",
  "Leads get full team oversight + account control",
  "Import straight from your tracker workbook",
];

/**
 * The sign-in scene: a dark, drifting backdrop with frosted chrome on top.
 *
 * Scoped `dark` regardless of the user's theme — the glass and the glows only
 * read against a dark field, and this is the one screen with no theme toggle.
 * The app itself stays light.
 */
export function LoginScene() {
  const reduced = useReducedMotion();

  // Shared entrance: rise out of a blur. Matches BlurText's vocabulary so the
  // whole scene resolves as one gesture rather than several unrelated ones.
  const rise = (delay: number) => ({
    initial: reduced ? { opacity: 0 } : { filter: "blur(10px)", opacity: 0, y: 20 },
    animate: reduced ? { opacity: 1 } : { filter: "blur(0px)", opacity: 1, y: 0 },
    transition: { duration: reduced ? 0.2 : 0.7, ease: "easeOut" as const, delay: reduced ? 0 : delay },
  });

  return (
    <div className="dark relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#05070f] p-4 sm:p-6">
      {/* Backdrop: drifting brand light over a perspective grid receding to the
          horizon. Pure CSS — the ambient system already ships these. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-glow ambient-glow-1" />
        <div className="ambient-glow ambient-glow-2" />
        <div className="ambient-glow ambient-glow-3" />
        <div className="ambient-grid" />
      </div>

      <motion.div
        {...rise(0.1)}
        className="liquid-glass relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl"
      >
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          {/* brand */}
          <div className="relative hidden flex-col justify-between gap-6 p-8 lg:flex xl:p-10">
            <motion.div {...rise(0.3)}>
              <Logo />
            </motion.div>

            <motion.div {...rise(0.4)} className="flex justify-center py-2">
              <KeystoneMark className="h-24 w-24 animate-float [filter:drop-shadow(0_12px_30px_color-mix(in_srgb,var(--gold)_45%,transparent))]" />
            </motion.div>

            <div>
              <BlurText
                text="Track the work."
                delay={0.5}
                className="font-display text-3xl font-semibold leading-[1.08] tracking-tight text-white xl:text-4xl"
              />
              <BlurText
                text="Crown it with a Plus 1."
                delay={0.8}
                className="font-display text-3xl font-semibold leading-[1.08] tracking-tight xl:text-4xl"
                wordClassName="text-gradient-gold"
              />

              <motion.p {...rise(1.1)} className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                One home for the team&apos;s BD and +1 assignments — members manage their own,
                the lead sees and steers everyone&apos;s.
              </motion.p>

              <ul className="mt-6 flex flex-col gap-2.5">
                {HIGHLIGHTS.map((h, i) => (
                  <motion.li
                    key={h}
                    {...rise(1.3 + i * 0.1)}
                    className="liquid-glass flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4 text-sm text-white/80"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--gold)] text-white">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2.5 6.2 4.8 8.5 9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {h}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* form */}
          <div className="relative p-7 sm:p-9">
            <motion.div {...rise(0.3)} className="mb-6 lg:hidden">
              <Logo />
            </motion.div>
            <motion.h2 {...rise(0.5)} className="font-display text-2xl font-semibold tracking-tight text-white">
              Welcome back
            </motion.h2>
            <motion.p {...rise(0.65)} className="mt-1.5 text-sm text-white/60">
              Sign in to your team&apos;s tracker.
            </motion.p>
            <motion.div {...rise(0.8)} className="mt-7">
              <LoginForm />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
