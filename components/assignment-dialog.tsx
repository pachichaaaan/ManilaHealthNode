"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";
import {
  CLASSIFICATIONS,
  CLASSIFICATION_META,
  KEY_PRIORITIES,
  OFFERINGS,
  PRIORITIES,
  PRIORITY_META,
  STATUSES,
  STATUS_META,
  WBS_META,
  WBS_STATES,
  type Assignment,
  type Classification,
  type Priority,
  type Status,
  type WbsState,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export type OwnerOption = { id: string; name: string };

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40";

function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-soft">
        {label}
        {required && <span className="ml-0.5 text-stage-rose">*</span>}
      </span>
      {children}
    </label>
  );
}

const toDateInput = (v: string | null) => (v && v !== "TBD" ? v.slice(0, 10) : "");

export function AssignmentDialog({
  owners,
  canAssign,
  defaultOwnerId,
  assignment,
  onClose,
  onSaved,
}: {
  owners: OwnerOption[];
  canAssign: boolean; // leads may choose the owner
  defaultOwnerId?: string;
  assignment: Assignment | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isEdit = Boolean(assignment);
  const [ownerId, setOwnerId] = useState(assignment?.ownerId ?? defaultOwnerId ?? owners[0]?.id ?? "");
  const [role, setRole] = useState(assignment?.role ?? "Consultant");
  const [title, setTitle] = useState(assignment?.title ?? "Strategy and Consulting");
  const [client, setClient] = useState(assignment?.client ?? "");
  const [classification, setClassification] = useState<Classification>(assignment?.classification ?? "bd");
  const [gnPocName, setGnPocName] = useState(assignment?.gnPocName ?? "");
  const [gnPocEmail, setGnPocEmail] = useState(assignment?.gnPocEmail ?? "");
  const [keyPriority, setKeyPriority] = useState(assignment?.keyPriority ?? "");
  const [offering, setOffering] = useState(assignment?.offering ?? "");
  const [startDate, setStartDate] = useState(toDateInput(assignment?.startDate ?? null));
  const [endTbd, setEndTbd] = useState(assignment?.endDate === "TBD");
  const [endDate, setEndDate] = useState(toDateInput(assignment?.endDate ?? null));
  const [wbsProvided, setWbsProvided] = useState<WbsState>(assignment?.wbsProvided ?? "no");
  const [wbsCode, setWbsCode] = useState(assignment?.wbsCode ?? "");
  const [estimatedHours, setEstimatedHours] = useState(assignment ? String(assignment.estimatedHours) : "");
  const [actualHours, setActualHours] = useState(assignment ? String(assignment.actualHours) : "0");
  const [priority, setPriority] = useState<Priority>(assignment?.priority ?? "medium");
  const [status, setStatus] = useState<Status>(assignment?.status ?? "active");
  const [notes, setNotes] = useState(assignment?.notes ?? "");
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
    const required: [string, string][] = [
      [client, "Client / organisation"],
      [title, "Assignment title"],
      [role, "Role / grade"],
      [gnPocName, "GN POC"],
      [gnPocEmail, "GN POC email"],
      [estimatedHours, "Estimated hours"],
      [actualHours, "Actual hours"],
      [wbsCode, "WBS code"],
    ];
    const missing = required.find(([v]) => !String(v).trim());
    if (missing) {
      setError(`${missing[1]} is required.`);
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(gnPocEmail.trim())) {
      setError("Enter a valid GN POC email.");
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      role: role.trim() || null,
      title: title.trim() || null,
      client: client.trim(),
      classification,
      gnPocName: gnPocName.trim() || null,
      gnPocEmail: gnPocEmail.trim() || null,
      keyPriority: keyPriority.trim() || null,
      offering: offering.trim() || null,
      startDate: startDate || null,
      endDate: endTbd ? "TBD" : endDate || null,
      wbsProvided,
      wbsCode: wbsCode.trim() || null,
      estimatedHours: Number(estimatedHours || 0),
      actualHours: Number(actualHours || 0),
      priority,
      status,
      notes: notes.trim() || null,
    };
    if (canAssign) payload.ownerId = ownerId;
    try {
      const res = await fetch(isEdit ? `/api/assignments/${assignment!.id}` : "/api/assignments", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save the assignment.");
        setSaving(false);
        return;
      }
      onSaved(isEdit ? "Assignment updated" : "Assignment added");
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="animate-fade-in absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-dialog-title"
        className="animate-pop-in relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-[var(--shadow-lg)] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="assignment-dialog-title" className="font-display text-lg font-semibold text-ink">
            {isEdit ? "Edit assignment" : "New assignment"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-3 gap-2">
            {CLASSIFICATIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setClassification(c)}
                className={cn(
                  "cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  classification === c ? "border-gold bg-[var(--gold-tint)] text-ink" : "border-border text-ink-soft hover:border-border-strong",
                )}
              >
                {CLASSIFICATION_META[c].label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client / organisation" required>
              <input ref={firstRef} aria-required="true" className={inputCls} value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Elevance Health" maxLength={160} />
            </Field>
            {canAssign ? (
              <Field label="Owner">
                <select className={inputCls} value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Assignment title" required>
                <input aria-required="true" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
              </Field>
            )}
            {canAssign && (
              <Field label="Assignment title" required>
                <input aria-required="true" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
              </Field>
            )}
            <Field label="Role / grade" required>
              <input aria-required="true" className={inputCls} value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} />
            </Field>
            <Field label="GN POC" required>
              <input aria-required="true" className={inputCls} value={gnPocName} onChange={(e) => setGnPocName(e.target.value)} placeholder="Global Network contact" maxLength={120} />
            </Field>
            <Field label="GN POC email" required>
              <input aria-required="true" className={inputCls} type="email" value={gnPocEmail} onChange={(e) => setGnPocEmail(e.target.value)} placeholder="name@accenture.com" maxLength={160} />
            </Field>
            <Field label="Key priority (for +1)">
              <select className={inputCls} value={keyPriority} onChange={(e) => setKeyPriority(e.target.value)}>
                <option value="">— Select —</option>
                {keyPriority && !(KEY_PRIORITIES as readonly string[]).includes(keyPriority) && (
                  <option value={keyPriority}>{keyPriority}</option>
                )}
                {KEY_PRIORITIES.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="Offering / practice (for +1)">
              <select className={inputCls} value={offering} onChange={(e) => setOffering(e.target.value)}>
                <option value="">— Select —</option>
                {offering && !(OFFERINGS as readonly string[]).includes(offering) && (
                  <option value={offering}>{offering}</option>
                )}
                {OFFERINGS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Estimated hours" required>
              <input aria-required="true" className={inputCls} inputMode="numeric" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value.replace(/[^0-9]/g, ""))} placeholder="120" />
            </Field>
            <Field label="Actual hours" required>
              <input aria-required="true" className={inputCls} inputMode="numeric" value={actualHours} onChange={(e) => setActualHours(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" />
            </Field>
            <Field label="Start date">
              <input className={inputCls} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Target end date">
              <div className="flex items-center gap-2">
                <input className={cn(inputCls, endTbd && "opacity-50")} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={endTbd} />
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-ink-soft">
                  <input type="checkbox" checked={endTbd} onChange={(e) => setEndTbd(e.target.checked)} className="accent-[var(--gold)]" />
                  TBD
                </label>
              </div>
            </Field>
            <Field label="WBS provided?">
              <select className={inputCls} value={wbsProvided} onChange={(e) => setWbsProvided(e.target.value as WbsState)}>
                {WBS_STATES.map((w) => (
                  <option key={w} value={w}>{WBS_META[w].label}</option>
                ))}
              </select>
            </Field>
            <Field label="WBS code" required>
              <input aria-required="true" className={inputCls} value={wbsCode} onChange={(e) => setWbsCode(e.target.value)} placeholder="WBS-XXXXXXX" maxLength={60} />
            </Field>
            <Field label="Priority">
              <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_META[p].label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                {STATUSES.map((sv) => (
                  <option key={sv} value={sv}>{STATUS_META[sv].label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea className={cn(inputCls, "min-h-20 resize-y")} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context, next steps…" maxLength={2000} />
          </Field>

          {error && (
            <p role="alert" className="rounded-lg bg-[color-mix(in_srgb,var(--stage-rose)_12%,transparent)] px-3 py-2 text-sm text-stage-rose">
              {error}
            </p>
          )}

          <div className="mt-1 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-surface transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? "Save changes" : "Add assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
