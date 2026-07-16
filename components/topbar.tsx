"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Avatar } from "./avatar";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";
import { ROLE_META, type PublicUser } from "@/lib/types";

export function Topbar({ user }: { user: PublicUser }) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    // Full-page navigation clears cached per-user pages from the router cache.
    window.location.assign("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/70 px-4 backdrop-blur-md lg:px-8">
      <Link href="/dashboard" className="lg:hidden" aria-label="Manila Health Node home">
        <Logo compact />
      </Link>
      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        <ThemeToggle />
        <Link
          href="/account"
          aria-label="Account settings"
          title="Account"
          className="flex items-center gap-2.5 rounded-lg border border-border bg-surface py-1.5 pl-1.5 pr-2 transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:pl-2 sm:pr-3"
        >
          <Avatar name={user.name} accent={user.accent} size={28} />
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-medium text-ink">{user.name}</div>
            <div className="text-[11px] text-gold-text">{user.title ?? ROLE_META[user.role].label}</div>
          </div>
        </Link>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          aria-label="Log out"
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-border bg-surface text-ink-soft transition-colors hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
