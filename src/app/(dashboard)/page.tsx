import { getOverview, getTimeSeries, type Range } from "@/lib/queries";
import { estimateCost, formatCost, pricePerEmail } from "@/lib/pricing";
import { StatCard } from "@/components/StatCard";
import { RangeTabs } from "@/components/RangeTabs";
import { TimeSeriesChart } from "@/components/TimeSeriesChart";

export const dynamic = "force-dynamic";

function parseRange(v: string | string[] | undefined): Range {
  const s = Array.isArray(v) ? v[0] : v;
  return s === "24h" || s === "7d" || s === "30d" ? s : "7d";
}

const fmt = (n: number) => n.toLocaleString();
const pct = (n: number) => `${n.toFixed(2)}%`;

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const [stats, series] = await Promise.all([
    getOverview(range),
    getTimeSeries(range),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-fg-muted">
            SES delivery health across all sending domains.
          </p>
        </div>
        <RangeTabs current={range} basePath="/" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Sent" value={fmt(stats.totalSent)} />
        <StatCard
          label="Delivery rate"
          value={pct(stats.deliveryRate)}
          sublabel={`${fmt(stats.delivered)} delivered`}
          tone={
            stats.deliveryRate >= 95
              ? "good"
              : stats.deliveryRate >= 85
                ? "warn"
                : "bad"
          }
        />
        <StatCard
          label="Bounce rate"
          value={pct(stats.bounceRate)}
          sublabel={`${fmt(stats.bounced)} bounced`}
          tone={stats.bounceRate >= 5 ? "bad" : stats.bounceRate >= 2 ? "warn" : "good"}
        />
        <StatCard
          label="Complaint rate"
          value={pct(stats.complaintRate)}
          sublabel={`${fmt(stats.complained)} complaints`}
          tone={
            stats.complaintRate >= 0.1
              ? "bad"
              : stats.complaintRate >= 0.05
                ? "warn"
                : "good"
          }
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Open rate"
          value={pct(stats.openRate)}
          sublabel={`${fmt(stats.opened)} opens / delivered`}
        />
        <StatCard
          label="Click rate"
          value={pct(stats.clickRate)}
          sublabel={`${fmt(stats.clicked)} clicks / delivered`}
        />
        <StatCard
          label="Rejected"
          value={fmt(stats.rejected)}
          sublabel="Refused before send"
          tone={stats.rejected > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Estimated cost"
          value={formatCost(estimateCost(stats.recipientCount))}
          sublabel={`${fmt(stats.recipientCount)} recipients @ ${formatCost(pricePerEmail() * 1000)}/1k`}
        />
      </div>

      <TimeSeriesChart data={series} range={range} />

      {stats.totalSent === 0 && (
        <div className="rounded-lg border border-border bg-bg-card p-6 text-sm text-fg-muted">
          <p className="font-medium text-fg">No events yet.</p>
          <p className="mt-1">
            Make sure SES is publishing to your SNS topic and the topic is
            subscribed to the SQS queue defined in{" "}
            <code className="text-accent">SES_EVENTS_QUEUE_URL</code>. See the
            README for the full setup.
          </p>
        </div>
      )}
    </div>
  );
}
