"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";

const inputCls =
  "w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (next.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) {
        setError(data.error ?? "Could not update your password.");
        return;
      }
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  }

  const field = (
    id: string,
    label: string,
    value: string,
    setValue: (v: string) => void,
    autoComplete: string,
    withToggle = false,
  ) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
      <div className="relative">
        <LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          id={id}
          type={withToggle && show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={inputCls}
          placeholder="••••••••"
        />
        {withToggle && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2.5 top-1/2 grid -translate-y-1/2 cursor-pointer place-items-center text-ink-faint transition-colors hover:text-ink"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-4" noValidate>
      {field("current-password", "Current password", current, setCurrent, "current-password")}
      {field("new-password", "New password", next, setNext, "new-password", true)}
      {field("confirm-password", "Confirm new password", confirm, setConfirm, "new-password")}

      {error && (
        <p role="alert" className="rounded-lg bg-[color-mix(in_srgb,var(--stage-rose)_14%,transparent)] px-3 py-2 text-sm text-stage-rose">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-[color-mix(in_srgb,var(--stage-emerald)_14%,transparent)] px-3 py-2 text-sm text-stage-emerald">
          <Check size={15} /> Password updated.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-ink text-sm font-semibold text-surface transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        Update password
      </button>
    </form>
  );
}
