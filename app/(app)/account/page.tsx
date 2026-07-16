import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Card, CardTitle } from "@/components/card";
import { Avatar } from "@/components/avatar";
import { ChangePasswordForm } from "@/components/change-password-form";
import { ROLE_META } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Account</h1>
        <p className="mt-1 text-sm text-ink-soft">Your profile and sign-in security.</p>
      </header>

      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={session.name} accent={session.accent} size={52} />
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold text-ink">{session.name}</div>
            <div className="truncate text-sm text-ink-soft">{session.email}</div>
          </div>
          <span className="ml-auto rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-gold-text">
            {session.title ?? ROLE_META[session.role].label}
          </span>
        </div>
      </Card>

      <Card>
        <CardTitle title="Change password" subtitle="Update your own password anytime." />
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
