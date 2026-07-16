"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Star, X } from "lucide-react";
import { Card, CardTitle } from "./card";
import { roleStatusTone, type OpenRole } from "@/lib/types";

export function InterestedRolesBox({ roles }: { roles: OpenRole[] }) {
  const router = useRouter();
  const [items, setItems] = useState<OpenRole[]>(roles);
  const [busy, setBusy] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function remove(role: OpenRole) {
    setBusy(role.id);
    try {
      // POST toggles interest — for a starred role this removes it.
      const res = await fetch(`/api/roles/${role.id}/interest`, { method: "POST" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((r) => r.id !== role.id));
      router.refresh();
    } catch {
      setBusy(null);
    }
  }

  return (
    <Card className="animate-fade-up" style={{ animationDelay: "240ms" }}>
      <CardTitle
        title="Roles you're interested in"
        subtitle={`${items.length} starred open role${items.length === 1 ? "" : "s"}`}
        action={
          <Link href="/open-roles" className="inline-flex items-center gap-1 text-sm font-medium text-gold-text hover:underline">
            Open Roles <ArrowUpRight size={15} />
          </Link>
        }
      />
      <ul className="flex flex-col divide-y divide-border">
        {items.map((r) => (
          <li key={r.id} className="group flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <Star size={15} className="shrink-0 fill-[var(--gold)] text-gold" />
            <Link href={`/open-roles?role=${r.id}`} className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink transition-colors group-hover:text-gold-text">{r.title}</div>
              <div className="truncate text-xs text-ink-faint">
                {r.client ?? "—"}
                {r.marketUnit ? ` · ${r.marketUnit}` : ""}
              </div>
            </Link>
            {r.status && (
              <span
                className="hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline-flex"
                style={{
                  background: `color-mix(in srgb, var(--stage-${roleStatusTone(r.status)}) 15%, transparent)`,
                  color: `var(--stage-${roleStatusTone(r.status)}-fg)`,
                }}
              >
                {r.status.replace(/^Open - /, "")}
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(r)}
              disabled={busy === r.id}
              aria-label={`Remove ${r.title} from interested`}
              title="Remove from interested"
              className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md text-ink-faint transition-colors hover:bg-[color-mix(in_srgb,var(--stage-rose)_14%,transparent)] hover:text-stage-rose disabled:opacity-50"
            >
              {busy === r.id ? <Loader2 size={14} className="animate-spin" /> : <X size={15} />}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
