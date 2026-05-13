import Link from "next/link";
import { isAuthEnabled } from "@/lib/session";
import { logoutAction } from "../login/actions";
import { AutoRefresh } from "@/components/AutoRefresh";

function refreshIntervalMs(): number {
  const raw = process.env.DASHBOARD_REFRESH_SECONDS;
  if (raw === undefined || raw === "") return 60_000;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 60_000;
  return Math.round(n * 1000);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const refreshMs = refreshIntervalMs();
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-bg-subtle p-5 flex flex-col">
        <div className="mb-8 flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-accent/20 ring-1 ring-accent/40 flex items-center justify-center text-accent text-sm font-bold">
            S
          </div>
          <div className="font-semibold tracking-tight">SESPulse</div>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <NavLink href="/" label="Overview" />
          <NavLink href="/domains" label="Domains" />
          <NavLink href="/logs" label="Email Logs" />
        </nav>
        {refreshMs > 0 && (
          <div className="mt-10">
            <AutoRefresh intervalMs={refreshMs} disabledOn={["/logs"]} />
          </div>
        )}
        {isAuthEnabled() && (
          <form action={logoutAction} className="mt-auto pt-6">
            <button
              type="submit"
              className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-xs text-fg-muted hover:bg-bg-hover hover:text-fg transition"
            >
              Sign out
            </button>
          </form>
        )}
      </aside>
      <main className="flex-1 p-8 max-w-[1400px]">{children}</main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-fg-muted hover:bg-bg-hover hover:text-fg transition"
    >
      {label}
    </Link>
  );
}
