import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { KeystoneMark, Logo } from "@/components/logo";
import { WebglBackground } from "@/components/webgl-background";

const HIGHLIGHTS = [
  "Members manage their own BD & +1 work",
  "Leads get full team oversight + account control",
  "Import straight from your tracker workbook",
];

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0a0f1c] p-4 sm:p-6">
      <WebglBackground className="absolute inset-0 block h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-black/10" />

      <div className="relative z-10 w-full max-w-4xl animate-fade-up overflow-hidden rounded-2xl border border-white/10 bg-surface/70 shadow-[var(--shadow-lg)] backdrop-blur-2xl">
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          {/* brand */}
          <div className="relative hidden flex-col justify-between gap-6 border-r border-border/60 p-8 lg:flex xl:p-10">
            <Logo />
            <div className="flex justify-center py-2">
              <KeystoneMark className="h-28 w-28 animate-float text-ink [filter:drop-shadow(0_14px_34px_color-mix(in_srgb,var(--gold)_45%,transparent))]" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold leading-[1.08] tracking-tight text-ink xl:text-4xl">
                Track the work.
                <br />
                <span className="text-gradient-gold">Crown it with a Plus 1.</span>
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
                One home for the team&apos;s BD and +1 assignments — members manage their own,
                the lead sees and steers everyone&apos;s.
              </p>
              <ul className="mt-6 flex flex-col gap-2.5">
                {HIGHLIGHTS.map((h) => (
                  <li key={h} className="flex items-center gap-3 text-sm text-ink-soft">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--gold-tint)] text-gold-text">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2.5 6.2 4.8 8.5 9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* form */}
          <div className="p-7 sm:p-9">
            <div className="mb-6 lg:hidden">
              <Logo />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Welcome back</h2>
            <p className="mt-1.5 text-sm text-ink-soft">Sign in to your team&apos;s tracker.</p>
            <div className="mt-7">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
