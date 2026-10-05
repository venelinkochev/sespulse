import Link from "next/link";
import {
  getProblemRecipients,
  searchRecipients,
  type Range,
} from "@/lib/queries";
import { RangeTabs } from "@/components/RangeTabs";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

function parseRange(v: string | string[] | undefined): Range {
  const s = Array.isArray(v) ? v[0] : v;
  return s === "24h" || s === "7d" || s === "30d" ? s : "7d";
}

function strOrNull(v: string | string[] | undefined): string | null {
  if (!v) return null;
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s.trim() : null;
}

const fmt = (n: number) => n.toLocaleString();

const recipientHref = (address: string) =>
  `/recipients/${encodeURIComponent(address)}`;

export default async function RecipientsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const q = strOrNull(sp.q);

  const [matches, problems] = await Promise.all([
    q ? searchRecipients(q) : Promise.resolve(null),
    getProblemRecipients(range),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Recipients</h1>
        <p className="text-sm text-fg-muted">
          Look up everything sent to an address, or review addresses that are
          bouncing or complaining.
        </p>
      </div>

      <form method="GET" className="flex flex-wrap items-center gap-3 text-sm">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search recipient address…"
          className="w-80 rounded-md border border-border bg-bg-card px-3 py-2 placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input type="hidden" name="range" value={range} />
        <button
          type="submit"
          className="rounded-md border border-border bg-bg-hover px-4 py-2 text-fg hover:bg-bg-card"
        >
          Search
        </button>
        {q && (
          <Link
            href={`/recipients?range=${range}`}
            className="text-fg-muted hover:text-fg text-xs underline"
          >
            Clear
          </Link>
        )}
      </form>

      {matches && (
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wide text-fg-subtle">
            Matching recipients
          </h2>
          <div className="overflow-hidden rounded-lg border border-border bg-bg-card">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle text-xs uppercase tracking-wide text-fg-subtle">
                <tr>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-right">Messages</th>
                  <th className="px-4 py-3 text-left">Last sent</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {matches.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-fg-muted">
                      No recipients match “{q}”.
                    </td>
                  </tr>
                )}
                {matches.map((r) => (
                  <tr
                    key={r.address}
                    className="border-t border-border-subtle hover:bg-bg-hover/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{r.address}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {fmt(r.messages)}
                    </td>
                    <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                      {timeAgo(r.lastSentAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={recipientHref(r.address)}
                        className="text-accent text-xs hover:underline"
                      >
                        History →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-sm uppercase tracking-wide text-fg-subtle">
              Problem recipients
            </h2>
            <p className="text-xs text-fg-muted mt-1">
              Addresses that bounced or complained. Complaints and hard bounces
              first: keep sending to these and your SES reputation suffers.
            </p>
          </div>
          <RangeTabs current={range} basePath="/recipients" />
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-bg-card">
          <table className="w-full text-sm">
            <thead className="bg-bg-subtle text-xs uppercase tracking-wide text-fg-subtle">
              <tr>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-right">Complaints</th>
                <th className="px-4 py-3 text-right">Hard</th>
                <th className="px-4 py-3 text-right">Soft</th>
                <th className="px-4 py-3 text-left">Last reason</th>
                <th className="px-4 py-3 text-left">Last seen</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {problems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-fg-muted">
                    No bounces or complaints in this range.
                  </td>
                </tr>
              )}
              {problems.map((r) => (
                <tr
                  key={r.address}
                  className="border-t border-border-subtle hover:bg-bg-hover/40"
                >
                  <td className="px-4 py-3 font-mono text-xs">{r.address}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      r.complaints > 0 ? "text-accent-red" : "text-fg-subtle"
                    }`}
                  >
                    {fmt(r.complaints)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      r.hardBounces > 0 ? "text-accent-red" : "text-fg-subtle"
                    }`}
                  >
                    {fmt(r.hardBounces)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      r.softBounces > 0 ? "text-accent-yellow" : "text-fg-subtle"
                    }`}
                  >
                    {fmt(r.softBounces)}
                  </td>
                  <td
                    className="px-4 py-3 max-w-sm truncate font-mono text-xs text-fg-muted"
                    title={r.lastDiagnostic ?? undefined}
                  >
                    {r.lastDiagnostic ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                    {timeAgo(r.lastAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={recipientHref(r.address)}
                      className="text-accent text-xs hover:underline"
                    >
                      History →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
