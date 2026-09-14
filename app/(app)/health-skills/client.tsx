"use client";

import { useRouter } from "next/navigation";
import { SkillEntryForm } from "@/components/skill-entry-form";

export function HealthSkillsClient() {
  const router = useRouter();
  return <SkillEntryForm onSuccess={() => router.refresh()} />;
}
