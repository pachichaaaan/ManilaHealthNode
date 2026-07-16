"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Pencil, Power, Trash2, UserPlus } from "lucide-react";
import { Avatar } from "./avatar";
import { TiltCard } from "./tilt-card";
import { UserDialog } from "./user-dialog";
import { ROLE_META, type PublicUser } from "@/lib/types";
import { cn, formatHours } from "@/lib/utils";

export type MemberStatRow = { userId: string; total: number; active: number; plusOne: number; hours: number };

export function TeamAdmin({
  users,
  stats,
  currentUserId,
}: {
  users: PublicUser[];
  stats: MemberStatRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{ open: boolean; user: PublicUser | null }>({ open: false, user: null });
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const statMap = useMemo(() => new Map(stats.map((s) => [s.userId, s])), [stats]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }
  function onSaved(msg: string) {
    setDialog({ open: false, user: null });
    showToast(msg);
    startTransition(() => router.refresh());
  }
  async function patch(u: PublicUser, body: Record<string, unknown>, okMsg: string) {
    setBusyId(u.id);
    const res = await fetch(`/api/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusyId(null);
    if (res.ok) {
      showToast(okMsg);
      startTransition(() => router.refresh());
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(d.error ?? "Action failed.");
    }
  }
  function resetPassword(u: PublicUser) {
    const pw = window.prompt(`New password for ${u.name} (min 6 chars):`);
    if (pw == null) return;
    if (pw.length < 6) {
      showToast("Password must be at least 6 characters.");
      return;
    }
    void patch(u, { password: pw }, "Password reset");
  }
  async function remove(u: PublicUser) {
    if (!window.confirm(`Delete ${u.name}'s account and all their assignments? This can't be undone.`)) return;
    setBusyId(u.id);
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) {
      showToast("Account deleted");
      startTransition(() => router.refresh());
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(d.error ?? "Could not delete account.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Team</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Manage accounts and see each member&apos;s load.
            {pending && <span className="ml-2 text-ink-faint">· updating…</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ open: true, user: null })}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-surface transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <UserPlus size={16} />
          Add member
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {users.map((u) => {
          const st = statMap.get(u.id);
          const isSelf = u.id === currentUserId;
          const isLead = u.role === "lead";
          return (
            <TiltCard key={u.id} max={4}>
              <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-sm)]", !u.active && "opacity-70")}>
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} accent={u.accent} size={46} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-display text-base font-semibold text-ink">{u.name}</span>
                      {isSelf && <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">You</span>}
                    </div>
                    <div className="truncate text-xs text-ink-faint">{u.email}</div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{
                      background: isLead ? "var(--gold-tint)" : "color-mix(in srgb, var(--stage-slate) 14%, transparent)",
                      color: isLead ? "var(--gold-text)" : "var(--stage-slate-fg)",
                    }}
                  >
                    {ROLE_META[u.role].label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {[
                    { k: "Total", v: st?.total ?? 0 },
                    { k: "Active", v: st?.active ?? 0 },
                    { k: "Plus 1", v: st?.plusOne ?? 0 },
                    { k: "Hours", v: formatHours(st?.hours ?? 0) },
                  ].map((m) => (
                    <div key={m.k} className="rounded-lg bg-surface-2/50 py-2">
                      <div className="tnum font-display text-base font-semibold text-ink">{m.v}</div>
                      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{m.k}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setDialog({ open: true, user: u })} disabled={busyId === u.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-50">
                    <Pencil size={13} /> Edit
                  </button>
                  <button type="button" onClick={() => resetPassword(u)} disabled={busyId === u.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-50">
                    <KeyRound size={13} /> Reset password
                  </button>
                  {!isSelf && (
                    <>
                      <button type="button" onClick={() => patch(u, { active: !u.active }, u.active ? "Account deactivated" : "Account reactivated")} disabled={busyId === u.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-50">
                        <Power size={13} /> {u.active ? "Deactivate" : "Activate"}
                      </button>
                      <button type="button" onClick={() => remove(u)} disabled={busyId === u.id} className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink-faint transition-colors hover:border-stage-rose hover:text-stage-rose disabled:opacity-50">
                        <Trash2 size={13} /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </TiltCard>
          );
        })}
      </div>

      {dialog.open && (
        <UserDialog user={dialog.user} onClose={() => setDialog({ open: false, user: null })} onSaved={onSaved} />
      )}

      {toast && (
        <div role="status" aria-live="polite" className="animate-fade-up fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-ink px-4 py-2 text-sm font-medium text-surface shadow-[var(--shadow-lg)] lg:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}
