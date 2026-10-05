import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { findStoredRecipient, getRecipient } from "@/lib/queries";
import { EventBadge } from "@/components/EventBadge";
import { StatCard } from "@/components/StatCard";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString();

export default async function RecipientPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const decoded = decodeURIComponent(address);
  const { summary, messages } = await getRecipient(decoded);
  if (summary.messages === 0) {
    const stored = await findStoredRecipient(decoded);
    if (stored && stored !== decoded) {
      redirect(`/recipients/${encodeURIComponent(stored)}`);
    }
    notFound();
  }

  const hasMultiRecipient = messages.some((m) => m.recipientCount > 1);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/recipients" className="text-fg-muted text-sm hover:text-fg">
          ← Recipients
        </Link>
        <h1 className="mt-2 text-xl font-semibold font-mono break-all">
          {summary.address}
        </h1>
        <p className="text-sm text-fg-muted mt-1">
          {fmt(summary.messages)} message{summary.messages === 1 ? "" : "s"}
          {summary.firstSentAt &&
            ` · first sent ${summary.firstSentAt.toLocaleDateString()}`}
          {summary.lastSentAt && ` · last sent ${timeAgo(summary.lastSentAt)}`}
        </p>
      </div>

      <RecipientAlert summary={summary} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Delivered"
          value={fmt(summary.delivered)}
          tone={summary.delivered > 0 ? "good" : "default"}
        />
        <StatCard
          label="Hard bounces"
          value={fmt(summary.hardBounced)}
          tone={summary.hardBounced > 0 ? "bad" : "default"}
        />
        <StatCard
          label="Soft bounces"
          value={fmt(summary.softBounced)}
          tone={summary.softBounced > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Complaints"
          value={fmt(summary.complained)}
          tone={summary.complained > 0 ? "bad" : "default"}
        />
        <StatCard
          label="Opened / clicked"
          value={`${fmt(summary.opened)} / ${fmt(summary.clicked)}`}
        />
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-wide text-fg-subtle mb-3">
          Messages{messages.length < summary.messages && ` (latest ${messages.length})`}
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-bg-card">
          <table className="w-full text-sm">
            <thead className="bg-bg-subtle text-xs uppercase tracking-wide text-fg-subtle">
              <tr>
                <th className="px-4 py-3 text-left">Sent</th>
                <th className="px-4 py-3 text-left">From</th>
                <th className="px-4 py-3 text-left">Subject</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr
                  key={m.messageId}
                  className="border-t border-border-subtle hover:bg-bg-hover/40"
                >
                  <td
                    className="px-4 py-3 text-fg-muted whitespace-nowrap"
                    title={m.sentAt.toLocaleString()}
                  >
                    {timeAgo(m.sentAt)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{m.fromAddress}</td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    {m.subject ?? (
                      <span className="text-fg-subtle">(no subject)</span>
                    )}
                    {m.recipientCount > 1 && (
                      <span className="ml-2 text-xs text-fg-subtle">
                        +{m.recipientCount - 1} other
                        {m.recipientCount > 2 ? "s" : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <EventBadge type={m.status} bounceType={m.bounceType} />
                      {m.status === "Bounce" && m.diagnostic && (
                        <span
                          className="max-w-xs truncate font-mono text-xs text-fg-subtle"
                          title={m.diagnostic}
                        >
                          {m.diagnostic}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/logs/${encodeURIComponent(m.messageId)}`}
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
        {hasMultiRecipient && (
          <p className="mt-2 text-xs text-fg-subtle">
            Deliveries, bounces and complaints are matched to this address
            exactly. SES doesn&apos;t say which recipient opened or clicked a
            multi-recipient message, so those are counted for every recipient
            on it.
          </p>
        )}
      </div>
    </div>
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
  const cls =
    tone === "red"
      ? "border-accent-red/40 bg-accent-red/10"
      : "border-accent-yellow/40 bg-accent-yellow/10";
  const titleCls = tone === "red" ? "text-accent-red" : "text-accent-yellow";
  return (
    <div className={`rounded-lg border p-4 text-sm ${cls}`}>
      <div className={`font-medium ${titleCls}`}>{title}</div>
      <div className="mt-1 text-fg-muted">{children}</div>
    </div>
  );
}

function Diagnostic({ text }: { text: string }) {
  return (
    <div className="mt-2 font-mono text-xs text-fg-muted break-words">{text}</div>
  );
}
