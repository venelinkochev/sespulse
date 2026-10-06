import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRecipient } from "@/lib/queries";
import { bareAddress, recipientHref } from "@/lib/address";
import { EventBadge } from "@/components/EventBadge";
import { Metric, MetricStrip } from "@/components/Metrics";
import { PageHeader, SectionTitle } from "@/components/PageHeader";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString();
const pct = (n: number | null) => (n === null ? "—" : `${n.toFixed(1)}%`);

// Same thresholds as the Overview delivery rate.
function deliveryTone(rate: number | null) {
  if (rate === null) return undefined;
  return rate >= 95 ? ("good" as const) : rate >= 85 ? ("warn" as const) : ("bad" as const);
}

export default async function RecipientPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const decoded = decodeURIComponent(address);
  // One canonical URL per recipient: /recipients/Name%20%3CA@X.com%3E
  // and /recipients/A@X.com both land on /recipients/a@x.com.
  const key = bareAddress(decoded);
  if (!key) notFound();
  if (key !== decoded) redirect(recipientHref(key));

  const { summary, messages } = await getRecipient(key);
  if (summary.messages === 0) notFound();

  const hasMultiRecipient = messages.some((m) => m.recipientCount > 1);

  return (
    <>
      <PageHeader
        back={
          <Link href="/recipients" className="text-fg-subtle hover:text-fg">
            ← Recipients
          </Link>
        }
        title={<span className="break-all">{summary.address}</span>}
        description={
          <>
            {fmt(summary.messages)} message{summary.messages === 1 ? "" : "s"}
            {summary.firstSentAt && ` · first sent ${summary.firstSentAt.toLocaleDateString()}`}
            {summary.lastSentAt && ` · last sent ${timeAgo(summary.lastSentAt)}`}
          </>
        }
      />

      <RecipientAlert summary={summary} />

      <MetricStrip>
        <Metric
          label="Delivered"
          value={pct(summary.deliveryRate)}
          sub={`${fmt(summary.delivered)} of ${fmt(summary.tracked)}`}
          dot={deliveryTone(summary.deliveryRate)}
        />
        <Metric
          label="Opened"
          value={pct(summary.openRate)}
          sub={`${fmt(summary.openedDelivered)} of ${fmt(summary.delivered)} delivered`}
        />
        <Metric label="Clicked" value={fmt(summary.clicked)} sub="messages" />
        <Metric
          label="Hard bounces"
          value={fmt(summary.hardBounced)}
          dot={summary.hardBounced > 0 ? "bad" : undefined}
        />
        <Metric
          label="Soft bounces"
          value={fmt(summary.softBounced)}
          dot={summary.softBounced > 0 ? "warn" : undefined}
        />
        <Metric
          label="Complaints"
          value={fmt(summary.complained)}
          dot={summary.complained > 0 ? "bad" : undefined}
        />
      </MetricStrip>

      <section>
        <SectionTitle
          description={
            messages.length < summary.messages
              ? `Latest ${messages.length} of ${fmt(summary.messages)}`
              : undefined
          }
        >
          Messages
        </SectionTitle>
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-24">Sent</th>
                <th>Subject</th>
                <th>From</th>
                <th className="w-64">Status</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.messageId}>
                  <td
                    className="num whitespace-nowrap text-fg-muted"
                    title={m.sentAt.toLocaleString()}
                  >
                    {timeAgo(m.sentAt)}
                  </td>
                  <td className="max-w-[22rem]">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/logs/${encodeURIComponent(m.messageId)}`}
                        className="truncate text-fg hover:text-accent"
                        title={m.subject ?? undefined}
                      >
                        {m.subject ?? <span className="text-fg-subtle">(no subject)</span>}
                      </Link>
                      {m.recipientCount > 1 && (
                        <span className="t-caption num shrink-0">
                          +{m.recipientCount - 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-fg-muted">
                    {m.fromAddress}
                  </td>
                  <td>
                    <EventBadge type={m.status} bounceType={m.bounceType} />
                    {m.status === "Bounce" && m.diagnostic && (
                      <div
                        className="mt-0.5 max-w-[16rem] truncate font-mono text-xs text-fg-subtle"
                        title={m.diagnostic}
                      >
                        {m.diagnostic}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMultiRecipient && (
          <p className="t-caption mt-2">
            Deliveries, bounces and complaints are matched to this address
            exactly. SES doesn&apos;t say which recipient opened or clicked a
            multi-recipient message, so those are counted for every recipient
            on it.
          </p>
        )}
      </section>
    </>
  );
}

function RecipientAlert({
  summary,
}: {
  summary: Awaited<ReturnType<typeof getRecipient>>["summary"];
}) {
  const b = summary.lastBounce;
  if (summary.complained > 0) {
    return (
      <Banner tone="red" title="This recipient marked your mail as spam">
        Last complaint{" "}
        {summary.lastComplaintAt ? timeAgo(summary.lastComplaintAt) : "recorded"}.
        Stop sending to this address. SES adds complainers to your account
        suppression list if it&apos;s enabled for complaints.
      </Banner>
    );
  }
  if (b && b.bounceType === "Permanent") {
    return (
      <Banner tone="red" title="Hard bounce: this address doesn't accept mail">
        Last bounced {timeAgo(b.at)}
        {b.bounceSubType && ` (${b.bounceSubType})`}. SES will usually have
        added it to your suppression list.
        {b.diagnostic && <Diagnostic text={b.diagnostic} />}
      </Banner>
    );
  }
  if (b && summary.delivered === 0) {
    return (
      <Banner tone="yellow" title="Soft bounces, nothing delivered yet">
        Last bounced {timeAgo(b.at)}
        {b.bounceSubType && ` (${b.bounceSubType})`}.
        {b.diagnostic && <Diagnostic text={b.diagnostic} />}
      </Banner>
    );
  }
  return null;
}

function Banner({
  tone,
  title,
  children,
}: {
  tone: "red" | "yellow";
  title: string;
  children: React.ReactNode;
}) {
  const bar = tone === "red" ? "bg-accent-red" : "bg-accent-yellow";
  const titleCls = tone === "red" ? "text-accent-red" : "text-accent-yellow";
  return (
    <div className="card relative overflow-hidden py-3.5 pl-5 pr-4 text-sm">
      <span className={`absolute inset-y-0 left-0 w-[3px] ${bar}`} />
      <div className={`font-medium ${titleCls}`}>{title}</div>
      <div className="mt-1 text-fg-muted">{children}</div>
    </div>
  );
}

function Diagnostic({ text }: { text: string }) {
  return (
    <div className="mt-2 break-words rounded-md border border-border-subtle bg-bg-inset px-3 py-2 font-mono text-xs text-fg-muted">
      {text}
    </div>
  );
}
