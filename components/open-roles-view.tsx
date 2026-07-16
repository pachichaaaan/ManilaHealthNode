"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, MapPin, Search, SlidersHorizontal, Star, Trash2, X } from "lucide-react";
import { priorityTone, roleStatusTone, type OpenRole, type Tone } from "@/lib/types";
import { cn } from "@/lib/utils";

const selectCls =
  "cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-gold/40 max-w-[46vw] sm:max-w-none";

function Chip({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", className)}
      style={{ background: `color-mix(in srgb, var(--stage-${tone}) 15%, transparent)`, color: `var(--stage-${tone}-fg)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--stage-${tone})` }} />
      {label}
    </span>
  );
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="truncate text-sm text-ink">{value || "—"}</div>
    </div>
  );
}

function distinct(roles: OpenRole[], key: keyof OpenRole): string[] {
  return [...new Set(roles.map((r) => r[key]).filter((v): v is string => Boolean(v)))].sort((a, b) =>
    a.localeCompare(b),
  );
}

type FilterKey = "marketUnit" | "industry" | "jobFamilyGroup" | "status" | "priority" | "locationType";
const FILTER_LABELS: Record<FilterKey, string> = {
  marketUnit: "Market",
  industry: "Industry",
  jobFamilyGroup: "Job family",
  status: "Status",
  priority: "Priority",
  locationType: "Location",
};

export function OpenRolesView({
  roles,
  interestedIds,
  canManage = false,
  initialRoleId,
}: {
  roles: OpenRole[];
  interestedIds: string[];
  canManage?: boolean;
  initialRoleId?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    marketUnit: "all",
    industry: "all",
    jobFamilyGroup: "all",
    status: "all",
    priority: "all",
    locationType: "all",
  });
  const [visible, setVisible] = useState(24);
  const [interested, setInterested] = useState<Set<string>>(new Set(interestedIds));
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [detail, setDetail] = useState<OpenRole | null>(() =>
    initialRoleId ? roles.find((r) => r.id === initialRoleId) ?? null : null,
  );
  const [toast, setToast] = useState<string | null>(null);

  const options = useMemo(
    () => ({
      marketUnit: distinct(roles, "marketUnit"),
      industry: distinct(roles, "industry"),
      jobFamilyGroup: distinct(roles, "jobFamilyGroup"),
      status: distinct(roles, "status"),
      priority: ["Critical", "High", "Normal"].filter((p) => roles.some((r) => r.priority === p)),
      locationType: distinct(roles, "locationType"),
    }),
    [roles],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roles.filter((r) => {
      for (const key of Object.keys(filters) as FilterKey[]) {
        if (filters[key] !== "all" && r[key] !== filters[key]) return false;
      }
      if (q) {
        const hay = `${r.title} ${r.client ?? ""} ${r.project ?? ""} ${r.primarySkill ?? ""} ${r.primaryContact ?? ""} ${r.roleId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [roles, filters, search]);

  const shown = filtered.slice(0, visible);
  const criticalHigh = filtered.filter((r) => /critical|high/i.test(r.priority ?? "")).length;
  const activeChips = (Object.keys(filters) as FilterKey[]).filter((k) => filters[k] !== "all");

  function setFilter(key: FilterKey, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setVisible(24);
  }
  function onSearch(v: string) {
    setSearch(v);
    setVisible(24);
  }
  function clearAll() {
    setFilters({ marketUnit: "all", industry: "all", jobFamilyGroup: "all", status: "all", priority: "all", locationType: "all" });
    setSearch("");
    setVisible(24);
  }
  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }

  async function toggle(role: OpenRole) {
    const id = role.id;
    const was = interested.has(id);
    setBusy(id);
    setInterested((prev) => {
      const n = new Set(prev);
      if (was) n.delete(id);
      else n.add(id);
      return n;
    });
    try {
      const res = await fetch(`/api/roles/${id}/interest`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setInterested((prev) => {
        const n = new Set(prev);
        if (data.interested) n.add(id);
        else n.delete(id);
        return n;
      });
      showToast(data.interested ? "Added to Interested" : "Removed from Interested");
    } catch {
      setInterested((prev) => {
        const n = new Set(prev);
        if (was) n.add(id);
        else n.delete(id);
        return n;
      });
      showToast("Could not update");
    } finally {
      setBusy(null);
    }
  }

  async function remove(role: OpenRole) {
    if (!window.confirm(`Delete "${role.title}" from Open Roles?\n\nThis removes it for everyone, including anyone who starred it.`)) return;
    setDeleting(role.id);
    try {
      const res = await fetch(`/api/roles/${role.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDetail((d) => (d?.id === role.id ? null : d));
      showToast("Role deleted");
      router.refresh();
    } catch {
      showToast("Could not delete role");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Open Roles</h1>
        <p className="mt-1 text-sm text-ink-soft">Shortlisted open roles — filter, explore, and star the ones you&apos;re interested in.</p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Open roles", value: roles.length, tone: "sky" as Tone },
          { label: "Matching filters", value: filtered.length, tone: "emerald" as Tone },
          { label: "Critical / High", value: criticalHigh, tone: "rose" as Tone },
          { label: "You're interested", value: interested.size, tone: "gold" as Tone },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
              <span className="h-2 w-2 rounded-full" style={{ background: `var(--stage-${t.tone})` }} />
              {t.label}
            </div>
            <div className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink tnum">{t.value}</div>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search title, client, project, skill, contact…"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
            />
          </div>
          {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
            <select key={key} value={filters[key]} onChange={(e) => setFilter(key, e.target.value)} className={selectCls} aria-label={FILTER_LABELS[key]}>
              <option value="all">{FILTER_LABELS[key]}: all</option>
              {options[key].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ))}
        </div>
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-ink-faint" />
            {activeChips.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k, "all")}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-ink-soft transition-colors hover:text-ink"
              >
                {FILTER_LABELS[k]}: {filters[k]} <X size={12} />
              </button>
            ))}
            <button type="button" onClick={clearAll} className="cursor-pointer px-1 text-xs text-gold-text hover:underline">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
          <Search className="h-8 w-8 text-ink-faint" />
          <p className="mt-3 font-display text-lg font-semibold text-ink">No roles match your filters</p>
          <button type="button" onClick={clearAll} className="mt-4 cursor-pointer rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-surface transition-transform hover:scale-[1.02]">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((r) => {
              const isInt = interested.has(r.id);
              return (
                <div key={r.id} className="group relative flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
                  <div className="absolute right-3 top-3 flex items-center gap-1.5">
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => remove(r)}
                        disabled={deleting === r.id}
                        aria-label={`Delete ${r.title}`}
                        title="Delete role"
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-border bg-surface text-ink-faint transition-colors hover:border-stage-rose hover:text-stage-rose disabled:opacity-50"
                      >
                        {deleting === r.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggle(r)}
                      disabled={busy === r.id}
                      aria-pressed={isInt}
                      aria-label={isInt ? "Remove from interested" : "Mark interested"}
                      className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-border bg-surface transition-colors hover:border-gold disabled:opacity-50"
                    >
                      {busy === r.id ? (
                        <Loader2 size={15} className="animate-spin text-ink-faint" />
                      ) : (
                        <Star size={15} className={isInt ? "fill-[var(--gold)] text-gold" : "text-ink-faint"} />
                      )}
                    </button>
                  </div>
                  <button type="button" onClick={() => setDetail(r)} className={cn("cursor-pointer text-left", canManage ? "pr-[4.75rem]" : "pr-9")}>
                    <div className="font-display text-[15px] font-semibold leading-snug text-ink">{r.title}</div>
                    <div className="mt-0.5 truncate text-sm text-ink-soft">
                      {r.client ?? "—"}
                      {r.industry ? ` · ${r.industry}` : ""}
                    </div>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.status && <Chip label={r.status.replace(/^Open - /, "")} tone={roleStatusTone(r.status)} />}
                    {r.priority && r.priority !== "Normal" && <Chip label={r.priority} tone={priorityTone(r.priority)} />}
                    {r.marketUnit && <Chip label={r.marketUnit} tone="slate" />}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                    <Meta label="Job family" value={r.jobFamilyGroup} />
                    <Meta label="Career level" value={r.careerFrom ? `${r.careerFrom}${r.careerTo && r.careerTo !== r.careerFrom ? `–${r.careerTo}` : ""}` : "—"} />
                    <Meta label="Skill" value={r.primarySkill} />
                    <Meta label="Location" value={r.locationType ? `${r.locationType}${r.country ? ` · ${r.country}` : ""}` : r.country} />
                  </div>
                </div>
              );
            })}
          </div>
          {visible < filtered.length && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + 24)}
                className="cursor-pointer rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
              >
                Load more · {filtered.length - visible} remaining
              </button>
            </div>
          )}
        </>
      )}

      {detail && (
        <RoleDetail
          role={detail}
          interested={interested.has(detail.id)}
          busy={busy === detail.id}
          canDelete={canManage}
          deleting={deleting === detail.id}
          onDelete={() => remove(detail)}
          onToggle={() => toggle(detail)}
          onClose={() => setDetail(null)}
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

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-0.5 text-sm text-ink">{value}</div>
    </div>
  );
}

function RoleDetail({
  role,
  interested,
  busy,
  canDelete,
  deleting,
  onDelete,
  onToggle,
  onClose,
}: {
  role: OpenRole;
  interested: boolean;
  busy: boolean;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="animate-fade-in absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="animate-pop-in relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-[var(--shadow-lg)] sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold leading-snug text-ink">{role.title}</h2>
            <p className="truncate text-sm text-ink-soft">
              {role.client ?? "—"}
              {role.project ? ` · ${role.project}` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          <div className="flex flex-wrap gap-1.5">
            {role.status && <Chip label={role.status} tone={roleStatusTone(role.status)} />}
            {role.priority && <Chip label={role.priority} tone={priorityTone(role.priority)} />}
            {role.demandType && <Chip label={role.demandType} tone="slate" />}
            {role.locationType && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-ink-soft">
                <MapPin size={12} /> {role.locationType}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Market" value={role.marketUnit} />
            <DetailRow label="Country" value={role.country} />
            <DetailRow label="Industry" value={role.industry} />
            <DetailRow label="Job family group" value={role.jobFamilyGroup} />
            <DetailRow label="Project role" value={role.projectRole} />
            <DetailRow label="Career level" value={role.careerFrom ? `${role.careerFrom}${role.careerTo && role.careerTo !== role.careerFrom ? ` – ${role.careerTo}` : ""}` : null} />
            <DetailRow label="Primary skill" value={role.primarySkill} />
            <DetailRow label="Skill group" value={role.skillGroup} />
            <DetailRow label="Work location" value={role.workLocation} />
            <DetailRow label="Language" value={role.language} />
            <DetailRow label="Start" value={role.startDate} />
            <DetailRow label="End" value={role.endDate} />
            <DetailRow label="Primary contact" value={role.primaryContact} />
            <DetailRow label="CN PoC" value={role.cnPoc} />
            <DetailRow label="Role ID" value={role.roleId} />
            <DetailRow label="Win probability" value={role.winProbability ? `${role.winProbability}%` : null} />
          </div>

          {role.description && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-ink-faint">Description</div>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{role.description}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-4">
          <div className="flex items-center gap-3">
            {role.editLink ? (
              <a href={role.editLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-text hover:underline">
                Open in MySched <ExternalLink size={14} />
              </a>
            ) : (
              <span />
            )}
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-stage-rose hover:text-stage-rose disabled:opacity-60"
              >
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Delete
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onToggle}
            disabled={busy}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-transform hover:scale-[1.02] disabled:opacity-60",
              interested ? "border border-gold text-gold-text" : "bg-ink text-surface",
            )}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Star size={15} className={interested ? "fill-[var(--gold)] text-gold" : ""} />}
            {interested ? "Interested" : "I'm interested"}
          </button>
        </div>
      </div>
    </div>
  );
}
