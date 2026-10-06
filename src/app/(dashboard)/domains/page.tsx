import Link from "next/link";
import { getDomainStats, type Range } from "@/lib/queries";
import { RangeTabs } from "@/components/RangeTabs";
import { PageHeader } from "@/components/PageHeader";
import { RateBar } from "@/components/RateBar";

export const dynamic = "force-dynamic";

function parseRange(v: string | string[] | undefined): Range {
  const s = Array.isArray(v) ? v[0] : v;
  return s === "24h" || s === "7d" || s === "30d" ? s : "7d";
}

const fmt = (n: number) => n.toLocaleString();

// Same thresholds as the Overview page.
const deliveryTone = (n: number) => (n >= 95 ? "good" : n >= 85 ? "warn" : "bad");
const bounceTone = (n: number) => (n >= 5 ? "bad" : n >= 2 ? "warn" : "good");

export default async function DomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const rows = await getDomainStats(range);

  return (
    <>
      <PageHeader
        title="Domains"
        description="Delivery health per sending domain. Bounce bars fill at 10%, where SES may pause sending."
        actions={<RangeTabs current={range} basePath="/domains" />}
      />

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th className="!text-right">Sent</th>
              <th className="!text-right">Delivered</th>
              <th className="!text-right">Bounced</th>
              <th className="!text-right">Complaints</th>
              <th className="!text-right">Opened</th>
              <th className="!text-right">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-fg-muted">
                  No data in this range.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.domain}>
                <td>
                  <Link
                    href={`/logs?domain=${encodeURIComponent(r.domain)}`}
                    className="font-medium text-fg hover:text-accent"
                    title="View logs for this domain"
                  >
                    {r.domain}
                  </Link>
                </td>
                <td className="num text-right">{fmt(r.sent)}</td>
                <td>
                  <RateBar value={r.deliveryRate} tone={deliveryTone(r.deliveryRate)} />
                </td>
                <td>
                  <RateBar value={r.bounceRate} scaleMax={10} tone={bounceTone(r.bounceRate)} />
                  <div className="t-caption num mt-0.5 text-right">
                    {fmt(r.hardBounced)} hard · {fmt(r.softBounced)} soft
                  </div>
                </td>
                <td
                  className={`num text-right ${r.complained > 0 ? "text-accent-red" : "text-fg-subtle"}`}
                >
                  {fmt(r.complained)}
                </td>
                <td>
                  <RateBar value={r.openRate} tone="neutral" />
                </td>
                <td className="num text-right text-fg-muted">{fmt(r.clicked)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
