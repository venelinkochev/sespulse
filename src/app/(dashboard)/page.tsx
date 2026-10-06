import {
  getOverview,
  getTimeSeries,
  type OverviewStats,
  type Range,
} from "@/lib/queries";
import { estimateCost, formatCost, pricePerEmail } from "@/lib/pricing";
import { Metric, MetricStrip } from "@/components/Metrics";
import { ReputationGauge } from "@/components/ReputationGauge";
import { PageHeader, SectionTitle } from "@/components/PageHeader";
import { RangeTabs } from "@/components/RangeTabs";
import { TimeSeriesChart } from "@/components/TimeSeriesChart";

export const dynamic = "force-dynamic";

function parseRange(v: string | string[] | undefined): Range {
  const s = Array.isArray(v) ? v[0] : v;
  return s === "24h" || s === "7d" || s === "30d" ? s : "7d";
}

const fmt = (n: number) => n.toLocaleString();
const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

const RANGE_LABEL: Record<Range, string> = {
  "24h": "last 24 hours",
  "7d": "last 7 days",
  "30d": "last 30 days",
};

function bounceDetail(stats: OverviewStats) {
  if (stats.bounced === 0) return "No bounces.";
  const parts = [
    `${fmt(stats.hardBounced)} hard`,
    `${fmt(stats.softBounced)} soft`,
  ];
  if (stats.undeterminedBounced > 0) {
    parts.push(`${fmt(stats.undeterminedBounced)} undetermined`);
  }
  return (
    <>
      <span className="text-fg">{fmt(stats.bounced)} bounced</span>
      <span className="text-fg-subtle"> · {parts.join(" · ")}</span>
    </>
  );
}

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
  const deliveryDot =
    stats.totalSent === 0
      ? undefined
      : stats.deliveryRate >= 95
        ? "good"
        : stats.deliveryRate >= 85
          ? "warn"
          : "bad";

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Delivery health across all sending domains, ${RANGE_LABEL[range]}.`}
        actions={<RangeTabs current={range} basePath="/" />}
      />

      <MetricStrip>
        <Metric label="Sent" value={fmt(stats.totalSent)} sub={`${fmt(stats.recipientCount)} recipients`} />
        <Metric
          label="Delivered"
          value={stats.totalSent ? pct(stats.deliveryRate) : "—"}
          sub={`${fmt(stats.delivered)} messages`}
          dot={deliveryDot}
        />
        <Metric
          label="Opened"
          value={stats.delivered ? pct(stats.openRate) : "—"}
          sub={`${fmt(stats.opened)} of delivered`}
        />
        <Metric
          label="Clicked"
          value={stats.delivered ? pct(stats.clickRate) : "—"}
          sub={`${fmt(stats.clicked)} of delivered`}
        />
        <Metric
          label="Rejected"
          value={fmt(stats.rejected)}
          sub="Refused by SES"
          dot={stats.rejected > 0 ? "warn" : undefined}
        />
        <Metric
          label="Est. cost"
          value={formatCost(estimateCost(stats.recipientCount))}
          sub={`at ${formatCost(pricePerEmail() * 1000)} per 1k`}
          title="Outbound recipients × SES_PRICE_PER_1000. Excludes attachments and dedicated IPs."
        />
      </MetricStrip>

      <section>
        <SectionTitle description="AWS reviews your account at the first marker and may pause sending at the second. Rates are per message sent in this range.">
          Sending reputation
        </SectionTitle>
        <div className="grid gap-4 lg:grid-cols-2">
          <ReputationGauge
            label="Bounce rate"
            value={stats.bounceRate}
            detail={bounceDetail(stats)}
            thresholds={{ elevated: 2, review: 5, pause: 10 }}
            sampleSize={stats.totalSent}
          />
          <ReputationGauge
            label="Complaint rate"
            value={stats.complaintRate}
            digits={3}
            detail={
              stats.complained === 0 ? (
                "No spam complaints."
              ) : (
                <span className="text-fg">
                  {fmt(stats.complained)} spam complaint{stats.complained === 1 ? "" : "s"}
                </span>
              )
            }
            thresholds={{ elevated: 0.05, review: 0.1, pause: 0.5 }}
            sampleSize={stats.totalSent}
          />
        </div>
      </section>

      <section>
        <TimeSeriesChart data={series} range={range} />
      </section>

      {stats.totalSent === 0 && (
        <div className="card border-dashed p-6 text-sm text-fg-muted">
          <p className="font-medium text-fg">No events yet</p>
          <p className="mt-1">
            Make sure SES is publishing to your SNS topic and the topic is
            subscribed to the SQS queue in{" "}
            <code className="rounded bg-bg-inset px-1.5 py-0.5 font-mono text-[12px] text-fg">
              SES_EVENTS_QUEUE_URL
            </code>
            . See the README for the full setup.
          </p>
        </div>
      )}
    </>
  );
}
