"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

// Client-side ticker that periodically asks the App Router to re-render
// the current route. Next refetches the server-component data and patches
// the DOM in place — no full page reload, no client state lost.
//
// Pauses when the tab is hidden so we don't burn cycles in the background.
// Disables itself entirely on routes matching `disabledOn` prefixes so you
// can dig through logs without the page reloading under you.
export function AutoRefresh({
  intervalMs = 30_000,
  disabledOn = [],
}: {
  intervalMs?: number;
  disabledOn?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const enabled = !disabledOn.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs, enabled]);

  if (!enabled) return null;

  const seconds = Math.round(intervalMs / 1000);
  return (
    <div
      className="text-2xs text-fg-subtle"
      title={`Dashboard data refreshes every ${seconds}s while this tab is visible`}
    >
      Auto-refresh · {seconds}s
    </div>
  );
}
