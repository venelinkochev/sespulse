import Link from "next/link";
import { getDistinctDomains, getLogs } from "@/lib/queries";
import { EventBadge } from "@/components/EventBadge";
import { timeAgo } from "@/lib/time";
import { recipientHref } from "@/lib/address";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

const EVENT_TYPES = [
  "Send",
  "Delivery",
  "Bounce",
  "Complaint",
  "Open",
  "Click",
  "Reject",
  "RenderingFailure",
  "DeliveryDelay",
];

function strOrNull(v: string | string[] | undefined): string | null {
  if (!v) return null;
  const s = Array.isArray(v) ? v[0] : v;
  return s ? s : null;
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    domain?: string;
    event?: string;
    q?: string;
  }>;
}) {
  const sp = await searchParams;
  const domain = strOrNull(sp.domain);
  const eventType = strOrNull(sp.event);
  const q = strOrNull(sp.q);

  const [rows, domains] = await Promise.all([
    getLogs({ domain, eventType, q, limit: 200 }),
    getDistinctDomains(),
  ]);

  const exportParams = new URLSearchParams();
  if (domain) exportParams.set("domain", domain);
  if (eventType) exportParams.set("event", eventType);
  if (q) exportParams.set("q", q);
  const exportHref = `/api/logs/export${
    exportParams.size ? `?${exportParams}` : ""
  }`;

  const filtered = Boolean(domain || eventType || q);

  return (
    <>
      <PageHeader
        title="Email Logs"
        description="The 200 most recent messages and their latest event. Export includes every match."
        actions={
          <a
            href={exportHref}
            download
            className="btn"
            title="Download every message matching the applied filters as CSV, not just the 200 shown here"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
            </svg>
            Export CSV
          </a>
        }
      />

      <div className="space-y-3">
        <form method="GET" className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-80">
            <svg viewBox="0 0 16 16" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3 3" />
            </svg>
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search subject, sender, recipient"
              className="input w-full pl-8"
            />
          </div>
          <select name="domain" defaultValue={domain ?? ""} className="select" aria-label="Sending domain">
            <option value="">All domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select name="event" defaultValue={eventType ?? ""} className="select" aria-label="Latest event">
            <option value="">Any status</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button type="submit" className="btn">
            Apply
          </button>
          {filtered && (
            <Link href="/logs" className="px-1 text-xs text-fg-muted hover:text-fg">
              Clear filters
            </Link>
          )}
        </form>

        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-24">Sent</th>
                <th>Subject</th>
                <th className="w-32">Status</th>
                <th>To</th>
                <th>From</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-fg-muted">
                    {filtered ? "No messages match these filters." : "No messages yet."}
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.messageId}>
                  <td
                    className="num whitespace-nowrap text-fg-muted"
                    title={r.sentAt.toLocaleString()}
                  >
                    {timeAgo(r.sentAt)}
                  </td>
                  <td className="max-w-[22rem]">
                    <Link
                      href={`/logs/${encodeURIComponent(r.messageId)}`}
                      className="block truncate text-fg hover:text-accent"
                      title={r.subject ?? undefined}
                    >
                      {r.subject ?? <span className="text-fg-subtle">(no subject)</span>}
                    </Link>
                  </td>
                  <td>
                    <EventBadge type={r.lastEventType} bounceType={r.lastBounceType} />
                  </td>
                  <td className="whitespace-nowrap">
                    {r.toAddresses[0] && (
                      <Link
                        href={recipientHref(r.toAddresses[0])}
                        className="text-fg-muted hover:text-accent"
                      >
                        {r.toAddresses[0]}
                      </Link>
                    )}
                    {r.toAddresses.length > 1 && (
                      <span className="num ml-1.5 text-fg-subtle">+{r.toAddresses.length - 1}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-fg-subtle">
                    {r.fromAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
