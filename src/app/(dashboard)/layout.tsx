import { isAuthEnabled } from "@/lib/session";
import { logoutAction } from "../login/actions";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  WorkerStatus,
  WorkerStatusCompact,
  getWorkerState,
} from "@/components/WorkerStatus";
import { Logo } from "@/components/Logo";
import { Nav } from "@/components/Nav";

function refreshIntervalMs(): number {
  const raw = process.env.DASHBOARD_REFRESH_SECONDS;
  if (raw === undefined || raw === "") return 60_000;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 60_000;
  return Math.round(n * 1000);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const refreshMs = refreshIntervalMs();
  const worker = await getWorkerState();
  return (
    <div className="md:flex md:min-h-screen">
      {/* Sidebar on desktop, top bar on small screens */}
      <aside className="sticky top-0 z-10 border-b border-border bg-bg-subtle/95 backdrop-blur md:h-screen md:w-56 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex h-full flex-col gap-3 px-4 py-3 md:gap-0 md:px-3 md:py-5">
          <div className="flex items-center justify-between md:mb-7 md:px-2.5">
            <Logo />
            <div className="flex items-center gap-4 md:hidden">
              <WorkerStatusCompact state={worker} />
              {isAuthEnabled() && (
                <form action={logoutAction}>
                  <button type="submit" className="text-xs text-fg-muted hover:text-fg">
                    Sign out
                  </button>
                </form>
              )}
            </div>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
            <Nav />
          </div>
          <div className="mt-auto hidden space-y-3 border-t border-border-subtle px-2.5 pt-4 md:block">
            <div className="eyebrow">System</div>
            <WorkerStatus state={worker} />
            {refreshMs > 0 && (
              <AutoRefresh
                intervalMs={refreshMs}
                disabledOn={["/logs", "/recipients/"]}
              />
            )}
            {isAuthEnabled() && (
              <form action={logoutAction}>
                <button type="submit" className="text-xs text-fg-muted hover:text-fg">
                  Sign out
                </button>
              </form>
            )}
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-[1280px] space-y-8">{children}</div>
      </main>
    </div>
  );
}
