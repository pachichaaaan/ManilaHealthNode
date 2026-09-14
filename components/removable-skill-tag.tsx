"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Props {
  memberName: string;
  skill: string;
  skillType: "functional" | "business";
}

export function RemovableSkillTag({ memberName, skill, skillType }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  function handleRemove() {
    startTransition(async () => {
      const res = await fetch("/api/skill-entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: memberName, skillType, skill }),
      });
      if (res.ok) {
        setRemoved(true);
        router.refresh();
      }
    });
  }

  const base =
    skillType === "functional"
      ? "bg-surface-2 text-ink-soft border-border"
      : "bg-gold/10 text-gold-text border-gold/20";

  return (
    <span
      className={`group inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] transition-opacity ${base} ${pending ? "opacity-40" : ""}`}
    >
      {skill}
      <button
        type="button"
        onClick={handleRemove}
        disabled={pending}
        aria-label={`Remove ${skill}`}
        className="ml-0.5 rounded text-current opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-60 focus-visible:opacity-100 focus-visible:outline-none disabled:cursor-not-allowed"
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </span>
  );
}
