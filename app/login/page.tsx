import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { KeystoneMark, Logo } from "@/components/logo";

const HIGHLIGHTS = [
  "Members manage their own BD & +1 work",
  "Leads get full team oversight + account control",
  "Import straight from your tracker workbook",
];

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg p-4 sm:p-6">
      {/* soft brand glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-30vh] h-[62vh] w-[110vw] -translate-x-1/2 rounded-[50%] blur-[130px]"
        style={{
          background: "radial-gradient(closest-side, color-mix(in srgb, var(--gold) 22%, transparent), transparent)",
          opacity: 0.35,
        }}
      />

      <div className="relative z-10 w-full max-w-4xl animate-fade-up overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-lg)]">
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          {/* brand */}
          <div
            className="relative hidden flex-col justify-between gap-6 border-r border-border p-8 lg:flex xl:p-10"
            style={{ background: "linear-gradient(160deg, color-mix(in srgb, var(--gold) 9%, var(--surface)), var(--surface))" }}
          >
            <Logo />
            <div className="flex justify-center py-2">
              <KeystoneMark className="h-24 w-24 animate-float [filter:drop-shadow(0_12px_30px_color-mix(in_srgb,var(--gold)_35%,transparent))]" />
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
