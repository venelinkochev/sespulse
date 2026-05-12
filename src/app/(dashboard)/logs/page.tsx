import Link from "next/link";
import { getDistinctDomains, getLogs } from "@/lib/queries";
import { EventBadge } from "@/components/EventBadge";

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

function rel(d: Date) {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email Logs</h1>
        <p className="text-sm text-fg-muted">
          Most recent messages with their latest event.
        </p>
      </div>

      <form
        method="GET"
        className="flex flex-wrap items-center gap-3 text-sm"
      >
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search subject, from, recipient…"
          className="w-72 rounded-md border border-border bg-bg-card px-3 py-2 placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <select
          name="domain"
          defaultValue={domain ?? ""}
          className="rounded-md border border-border bg-bg-card px-3 py-2"
        >
          <option value="">All domains</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          name="event"
          defaultValue={eventType ?? ""}
          className="rounded-md border border-border bg-bg-card px-3 py-2"
        >
          <option value="">All events</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-border bg-bg-hover px-4 py-2 text-fg hover:bg-bg-card"
        >
          Filter
        </button>
        {(domain || eventType || q) && (
          <Link
            href="/logs"
            className="text-fg-muted hover:text-fg text-xs underline"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-bg-card">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-xs uppercase tracking-wide text-fg-subtle">
            <tr>
              <th className="px-4 py-3 text-left">Sent</th>
              <th className="px-4 py-3 text-left">From</th>
              <th className="px-4 py-3 text-left">To</th>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-fg-muted"
                >
                  No messages match these filters.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.messageId}
                className="border-t border-border-subtle hover:bg-bg-hover/40"
              >
                <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                  {rel(r.sentAt)}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {r.fromAddress}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {r.toAddresses[0]}
                  {r.toAddresses.length > 1 && (
                    <span className="text-fg-subtle">
                      {" "}
                      +{r.toAddresses.length - 1}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 max-w-xs truncate">
                  {r.subject ?? (
                    <span className="text-fg-subtle">(no subject)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <EventBadge type={r.lastEventType} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/logs/${encodeURIComponent(r.messageId)}`}
                    className="text-accent text-xs hover:underline"
                  >
                    Details →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
