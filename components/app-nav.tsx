"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, ClipboardList, Compass, FileCheck2, LayoutDashboard, Star, Users, type LucideIcon } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

type NavItem = { href: string; label: string; icon: LucideIcon; leadOnly?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/open-roles", label: "Open Roles", icon: Compass },
  { href: "/plus-one", label: "Plus 1", icon: Star },
  { href: "/wbs", label: "WBS", icon: FileCheck2 },
  { href: "/archived", label: "Archived", icon: Archive },
  { href: "/team", label: "Team", icon: Users, leadOnly: true },
];

function itemsFor(role: Role) {
  return NAV_ITEMS.filter((i) => !i.leadOnly || role === "lead");
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface/50 px-3 py-5 backdrop-blur-sm lg:flex">
      <div className="px-2">
        <Link href="/dashboard" className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          <Logo />
        </Link>
      </div>
      <nav className="mt-9 flex flex-col gap-1">
        {itemsFor(role).map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-surface-2 text-ink" : "text-ink-soft hover:bg-surface-2/60 hover:text-ink",
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gold" />}
              <Icon size={18} className={active ? "text-gold-text" : ""} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="mt-auto px-3 text-[11px] leading-relaxed text-ink-faint">
        Manila Health Node · BD &amp; +1 tracker
      </p>
    </aside>
  );
}

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch overflow-x-auto border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {itemsFor(role).map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 basis-1/5 min-w-[68px] flex-col items-center gap-1 whitespace-nowrap px-2 py-2.5 text-[11px] font-medium transition-colors",
              active ? "text-gold-text" : "text-ink-faint",
            )}
          >
            <Icon size={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
