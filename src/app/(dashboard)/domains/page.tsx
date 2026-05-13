import Link from "next/link";
import { getDomainStats, type Range } from "@/lib/queries";
import { RangeTabs } from "@/components/RangeTabs";

export const dynamic = "force-dynamic";

function parseRange(v: string | string[] | undefined): Range {
  const s = Array.isArray(v) ? v[0] : v;
  return s === "24h" || s === "7d" || s === "30d" ? s : "7d";
}

const fmt = (n: number) => n.toLocaleString();
const pct = (n: number) => `${n.toFixed(2)}%`;

function rateClass(n: number, kind: "delivery" | "bounce" | "open") {
  if (kind === "delivery")
    return n >= 95 ? "text-accent-green" : n >= 85 ? "text-accent-yellow" : "text-accent-red";
  if (kind === "bounce")
    return n >= 5 ? "text-accent-red" : n >= 2 ? "text-accent-yellow" : "text-fg-muted";
  return "text-fg";
}

export default async function DomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const rows = await getDomainStats(range);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Domains</h1>
          <p className="text-sm text-fg-muted">
            Delivery health grouped by sending domain.
          </p>
        </div>
        <RangeTabs current={range} basePath="/domains" />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-bg-card">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle text-xs uppercase tracking-wide text-fg-subtle">
            <tr>
              <th className="px-4 py-3 text-left">Domain</th>
              <th className="px-4 py-3 text-right">Sent</th>
              <th className="px-4 py-3 text-right">Delivery</th>
              <th className="px-4 py-3 text-right">Bounce</th>
              <th className="px-4 py-3 text-right">Complaints</th>
              <th className="px-4 py-3 text-right">Open</th>
              <th className="px-4 py-3 text-right">Click</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-fg-muted"
                >
                  No data in this range.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.domain}
                className="border-t border-border-subtle hover:bg-bg-hover/40"
              >
                <td className="px-4 py-3 font-medium">{r.domain}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {fmt(r.sent)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono ${rateClass(
                    r.deliveryRate,
                    "delivery"
                  )}`}
                >
                  {pct(r.deliveryRate)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono ${rateClass(
                    r.bounceRate,
                    "bounce"
                  )}`}
                >
                  {pct(r.bounceRate)}{" "}
                  <span className="text-fg-subtle">
                    ({fmt(r.bounced)})
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {fmt(r.complained)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {pct(r.openRate)}{" "}
                  <span className="text-fg-subtle">({fmt(r.opened)})</span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {fmt(r.clicked)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/logs?domain=${encodeURIComponent(r.domain)}`}
                    className="text-accent text-xs hover:underline"
                  >
                    View logs →
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
