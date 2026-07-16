"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { AssignmentDialog, type OwnerOption } from "./assignment-dialog";
import { Avatar } from "./avatar";
import { ClassificationBadge, StatusBadge, WbsBadge } from "./badges";
import {
  CLASSIFICATIONS,
  CLASSIFICATION_META,
  PRIORITY_META,
  STATUSES,
  STATUS_META,
  type Assignment,
  type Classification,
  type Role,
  type Status,
} from "@/lib/types";
import { formatDate, formatHours } from "@/lib/utils";

type ClassFilter = Classification | "all";
type StatusFilter = Status | "all";

const selectCls =
  "cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-gold/40";

export function AssignmentsView({
  assignments,
  role,
  currentUserId,
  owners,
}: {
  assignments: Assignment[];
  role: Role;
  currentUserId: string;
  owners: OwnerOption[];
}) {
  const router = useRouter();
  const isLead = role === "lead";
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<ClassFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [dialog, setDialog] = useState<{ open: boolean; assignment: Assignment | null }>({ open: false, assignment: null });
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      assignments.filter((a) => {
        if (classFilter !== "all" && a.classification !== classFilter) return false;
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        if (isLead && ownerFilter !== "all" && a.ownerId !== ownerFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          if (
            !a.client.toLowerCase().includes(q) &&
            !a.member.toLowerCase().includes(q) &&
            !(a.gnPocName ?? "").toLowerCase().includes(q) &&
            !(a.keyPriority ?? "").toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      }),
    [assignments, classFilter, statusFilter, ownerFilter, search, isLead],
  );

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }
  function onSaved(msg: string) {
    setDialog({ open: false, assignment: null });
    showToast(msg);
    startTransition(() => router.refresh());
  }
  async function onDelete(a: Assignment) {
    if (!window.confirm(`Delete "${a.client}"? This can't be undone.`)) return;
    setDeletingId(a.id);
    const res = await fetch(`/api/assignments/${a.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      showToast("Assignment deleted");
      startTransition(() => router.refresh());
    } else {
      showToast("Could not delete assignment");
    }
  }
  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!window.confirm(`Import "${file.name}"?\n\nThis replaces all assignments with the workbook's Master Tracker rows (new members get an auto-created account).`)) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      setImporting(false);
      if (!res.ok) {
        showToast(data.error ?? "Import failed.");
        return;
      }
      const extra = data.accountsCreated ? ` · ${data.accountsCreated} new account${data.accountsCreated === 1 ? "" : "s"}` : "";
      showToast(`Imported ${data.imported} assignment${data.imported === 1 ? "" : "s"}${extra}`);
      startTransition(() => router.refresh());
    } catch {
      setImporting(false);
      showToast("Import failed. Check the file and try again.");
    }
  }

  const hasFilters = search.trim() !== "" || classFilter !== "all" || statusFilter !== "all" || ownerFilter !== "all";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Assignments</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {isLead ? "Every member's BD & +1 work." : "Your BD & +1 work."} {filtered.length} of {assignments.length}
            {pending && <span className="ml-2 text-ink-faint">· updating…</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLead && (
            <>
              <input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={onImportFile} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                title="Import from a BD_Plus1_Tracker .xlsx (replaces current data)"
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-sm font-medium text-ink-soft transition-colors hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
              >
                {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {importing ? "Importing…" : "Import"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setDialog({ open: true, assignment: null })}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-surface transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Plus size={16} />
            Add assignment
          </button>
        </div>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients, people, priorities…" className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40" />
        </div>
        {isLead && (
          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className={selectCls} aria-label="Filter by member">
            <option value="all">All members</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        )}
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value as ClassFilter)} className={selectCls} aria-label="Filter by type">
          <option value="all">All types</option>
          {CLASSIFICATIONS.map((c) => (
            <option key={c} value={c}>{CLASSIFICATION_META[c].label}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectCls} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {STATUSES.map((sv) => (
            <option key={sv} value={sv}>{STATUS_META[sv].label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          hasFilters={hasFilters}
          onAdd={() => setDialog({ open: true, assignment: null })}
          onClear={() => {
            setSearch("");
            setClassFilter("all");
            setStatusFilter("all");
            setOwnerFilter("all");
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-sm)]">
          <div className="hidden grid-cols-[1.7fr_0.7fr_0.7fr_0.8fr_0.8fr_0.7fr_64px] gap-3 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint md:grid">
            <span>Assignment</span>
            <span>Type</span>
            <span>Status</span>
            <span className="text-right">Hours</span>
            <span>WBS</span>
            <span className="text-right">End</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((a) => (
              <li
                key={a.id}
                className="group grid grid-cols-1 gap-2 border-l-2 px-4 py-3 transition-colors hover:bg-surface-2/50 md:grid-cols-[1.7fr_0.7fr_0.7fr_0.8fr_0.8fr_0.7fr_64px] md:items-center md:gap-3"
                style={{ borderLeftColor: `var(--stage-${PRIORITY_META[a.priority].tone})` }}
              >
                <button type="button" onClick={() => setDialog({ open: true, assignment: a })} className="flex min-w-0 cursor-pointer items-center gap-2.5 text-left">
                  {isLead && <Avatar name={a.member} accent={a.ownerAccent} size={30} />}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{a.client}</span>
                    <span className="block truncate text-xs text-ink-faint">
                      {isLead ? a.member : a.role ?? "—"}
                      {a.gnPocName ? ` · POC ${a.gnPocName}` : ""}
                    </span>
                  </span>
                </button>
                <div><ClassificationBadge value={a.classification} /></div>
                <div><StatusBadge value={a.status} /></div>
                <div className="md:text-right">
                  <span className="tnum text-sm font-semibold text-ink">{formatHours(a.actualHours)}</span>
                  <span className="text-xs text-ink-faint"> / {formatHours(a.estimatedHours)}</span>
                </div>
                <div><WbsBadge value={a.wbsProvided} /></div>
                <div className="text-xs text-ink-soft md:text-right">{formatDate(a.endDate)}</div>
                <div className="flex items-center gap-1 md:justify-end md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                  <button type="button" onClick={() => setDialog({ open: true, assignment: a })} aria-label={`Edit ${a.client}`} className="grid h-7 w-7 cursor-pointer place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => onDelete(a)} disabled={deletingId === a.id} aria-label={`Delete ${a.client}`} className="grid h-7 w-7 cursor-pointer place-items-center rounded-md text-ink-faint transition-colors hover:bg-[color-mix(in_srgb,var(--stage-rose)_14%,transparent)] hover:text-stage-rose disabled:opacity-50">
                    {deletingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dialog.open && (
        <AssignmentDialog
          owners={owners}
          canAssign={isLead}
          defaultOwnerId={currentUserId}
          assignment={dialog.assignment}
          onClose={() => setDialog({ open: false, assignment: null })}
          onSaved={onSaved}
        />
      )}

      {toast && (
        <div role="status" aria-live="polite" className="animate-fade-up fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-ink px-4 py-2 text-sm font-medium text-surface shadow-[var(--shadow-lg)] lg:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasFilters, onAdd, onClear }: { hasFilters: boolean; onAdd: () => void; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
      <ClipboardList className="h-9 w-9 text-ink-faint" />
      <p className="mt-4 font-display text-lg font-semibold text-ink">{hasFilters ? "No assignments match your filters" : "No assignments yet"}</p>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">{hasFilters ? "Try clearing the filters." : "Add your first BD or +1 assignment to start tracking."}</p>
      <button type="button" onClick={hasFilters ? onClear : onAdd} className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-surface transition-transform hover:scale-[1.02]">
        {hasFilters ? "Clear filters" : <><Plus size={16} /> Add assignment</>}
      </button>
    </div>
  );
}
