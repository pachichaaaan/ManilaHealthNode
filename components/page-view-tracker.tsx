"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Records a visit whenever the path changes.
 *
 * Deliberately client-side. Logging in `proxy.ts` or a page's Server Component
 * would also count Next's link prefetches — which render routes the user never
 * actually opened — so the table would fill with visits that didn't happen. An
 * effect only runs once the page is really on screen.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const lastLogged = useRef<string | null>(null);

  useEffect(() => {
    // Effects run twice in dev StrictMode; only send once per path.
    if (lastLogged.current === pathname) return;
    lastLogged.current = pathname;

    fetch("/api/page-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true, // survive a fast navigation away
    }).catch(() => {
      /* analytics must never surface to the user */
    });
  }, [pathname]);

  return null;
}
