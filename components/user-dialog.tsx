"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";
import { ACCENTS, ROLES, ROLE_META, type PublicUser, type Role } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

export function UserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: PublicUser | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isEdit = Boolean(user);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "member");
  const [title, setTitle] = useState(user?.title ?? "");
  const [accent, setAccent] = useState(user?.accent ?? "sky");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (!isEdit && password.length < 6) {
      setError("Set a password of at least 6 characters.");
      return;
    }
    setSaving(true);
    const base = { name: name.trim(), email: email.trim(), role, title: title.trim() || null, accent };
    const payload = isEdit
      ? password
        ? { ...base, password }
        : base
      : { ...base, password };
    try {
      const res = await fetch(isEdit ? `/api/users/${user!.id}` : "/api/users", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save the account.");
        setSaving(false);
        return;
      }
      onSaved(isEdit ? "Account updated" : "Member added");
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="animate-fade-in absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="user-dialog-title" className="animate-pop-in relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-[var(--shadow-lg)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="user-dialog-title" className="font-display text-lg font-semibold text-ink">{isEdit ? "Edit account" : "New member"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          <Field label="Full name">
            <input ref={firstRef} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" maxLength={120} />
          </Field>
          <Field label="Email">
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" maxLength={160} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_META[r].label}</option>
                ))}
              </select>
            </Field>
            <Field label="Accent">
              <select className={inputCls} value={accent} onChange={(e) => setAccent(e.target.value)}>
                {ACCENTS.map((c) => (
                  <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Title (optional)">
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Consultant" maxLength={80} />
          </Field>
          <Field label={isEdit ? "New password (leave blank to keep)" : "Password"}>
            <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? "••••••••" : "At least 6 characters"} autoComplete="new-password" />
          </Field>

          {error && (
            <p role="alert" className="rounded-lg bg-[color-mix(in_srgb,var(--stage-rose)_12%,transparent)] px-3 py-2 text-sm text-stage-rose">{error}</p>
          )}

          <div className="mt-1 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-surface transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? "Save changes" : "Add member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
