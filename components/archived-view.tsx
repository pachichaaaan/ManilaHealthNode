"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2, Search, Trash2 } from "lucide-react";
import type { OwnerOption } from "./assignment-dialog";
import { Avatar } from "./avatar";
import { ClassificationBadge, StatusBadge, WbsBadge } from "./badges";
import { type Assignment, type Role } from "@/lib/types";
import { formatDate, formatHours } from "@/lib/utils";

const selectCls =
  "cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-gold/40";

type MemberGroup = { ownerId: string; member: string; accent: string; items: Assignment[] };

export function ArchivedView({
  assignments,
  role,
  owners,
  initialMember,
}: {
  assignments: Assignment[];
  role: Role;
  owners: OwnerOption[];
  initialMember?: string;
}) {
  const router = useRouter();
  const isLead = role === "lead";
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<Assignment[]>(assignments);
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState<string>(initialMember ?? "all");
  const [busy, setBusy] = useState<{ id: string; kind: "restore" | "delete" } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((a) => {
      if (isLead && memberFilter !== "all" && a.ownerId !== memberFilter) return false;
      if (q) {
        const hay = `${a.client} ${a.member} ${a.title ?? ""} ${a.keyPriority ?? ""} ${a.gnPocName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, isLead, memberFilter, search]);

  const groups = useMemo(() => {
    const map = new Map<string, MemberGroup>();
    for (const a of filtered) {
      let g = map.get(a.ownerId);
      if (!g) {
        g = { ownerId: a.ownerId, member: a.member, accent: a.ownerAccent, items: [] };
        map.set(a.ownerId, g);
      }
      g.items.push(a);
    }
    return [...map.values()].sort((x, y) => x.member.localeCompare(y.member));
  }, [filtered]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }

  async function restore(a: Assignment) {
    setBusy({ id: a.id, kind: "restore" });
    try {
      const res = await fetch(`/api/assignments/${a.id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((x) => x.id !== a.id));
      showToast("Restored to active");
      startTransition(() => router.refresh());
    } catch {
      showToast("Could not restore assignment");
    } finally {
      setBusy(null);
    }
  }

  async function remove(a: Assignment) {
    if (!window.confirm(`Permanently delete "${a.client}"? This can't be undone.`)) return;
    setBusy({ id: a.id, kind: "delete" });
    try {
      const res = await fetch(`/api/assignments/${a.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((x) => x.id !== a.id));
      showToast("Assignment deleted");
      startTransition(() => router.refresh());
    } catch {
      showToast("Could not delete assignment");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Archived</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {isLead ? "Completed work across the team, moved out of the active views." : "Your completed work, moved out of the active views."}{" "}
            {filtered.length} archived
            {pending && <span className="ml-2 text-ink-faint">· updating…</span>}
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search archived clients, people, priorities…"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
            />
          </div>
          {isLead && (
            <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} className={selectCls} aria-label="Filter by member">
              <option value="all">All members</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
          <Archive className="h-9 w-9 text-ink-faint" />
          <p className="mt-4 font-display text-lg font-semibold text-ink">
            {items.length === 0 ? "Nothing archived yet" : "No archived work matches"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-ink-soft">
            {items.length === 0
              ? "Use the Archive action on an assignment to move completed work here. It stays safe and can be restored anytime."
              : "Try a different member or search term."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <section key={g.ownerId} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-sm)]">
              <header className="flex items-center gap-3 border-b border-border bg-surface-2/40 px-4 py-3">
                <Avatar name={g.member} accent={g.accent} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{g.member}</div>
                  <div className="text-[11px] text-ink-faint">
                    {g.items.length} archived {g.items.length === 1 ? "item" : "items"}
                  </div>
                </div>
              </header>
              <ul className="divide-y divide-border">
                {g.items.map((a) => (
                  <li key={a.id} className="group flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-surface-2/40 sm:flex-row sm:items-center sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">{a.client}</div>
                      <div className="truncate text-xs text-ink-faint">
                        {a.title ?? a.role ?? "—"}
                        {a.endDate ? ` · ended ${formatDate(a.endDate)}` : ""}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ClassificationBadge value={a.classification} />
                      <StatusBadge value={a.status} />
                      <WbsBadge value={a.wbsProvided} />
                    </div>
                    <div className="shrink-0 tnum text-xs text-ink-soft sm:w-24 sm:text-right">
                      {formatHours(a.actualHours)} / {formatHours(a.estimatedHours)}
                    </div>
                    <div className="flex items-center gap-1 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => restore(a)}
                        disabled={busy?.id === a.id}
                        aria-label={`Restore ${a.client}`}
                        title="Restore to active"
                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-ink-soft transition-colors hover:border-border-strong hover:text-ink disabled:opacity-50"
                      >
                        {busy?.id === a.id && busy.kind === "restore" ? <Loader2 size={13} className="animate-spin" /> : <ArchiveRestore size={13} />}
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(a)}
                        disabled={busy?.id === a.id}
                        aria-label={`Delete ${a.client}`}
                        title="Delete permanently"
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-ink-faint transition-colors hover:bg-[color-mix(in_srgb,var(--stage-rose)_14%,transparent)] hover:text-stage-rose disabled:opacity-50"
                      >
                        {busy?.id === a.id && busy.kind === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {toast && (
        <div role="status" aria-live="polite" className="animate-fade-up fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-ink px-4 py-2 text-sm font-medium text-surface shadow-[var(--shadow-lg)] lg:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}
