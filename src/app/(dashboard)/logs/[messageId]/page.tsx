import Link from "next/link";
import { notFound } from "next/navigation";
import { getMessageWithEvents } from "@/lib/queries";
import { EventBadge, eventDotClass } from "@/components/EventBadge";
import { PageHeader } from "@/components/PageHeader";
import { recipientHref } from "@/lib/address";

export const dynamic = "force-dynamic";

// Delay since the previous event, e.g. "+2s", "+14h".
function delta(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `+${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `+${m}m`;
  const h = Math.round(m / 60);
  if (h < 48) return `+${h}h`;
  return `+${Math.round(h / 24)}d`;
}

export default async function MessagePage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = await params;
  const decoded = decodeURIComponent(messageId);
  const { message, events } = await getMessageWithEvents(decoded);
  if (!message) notFound();

  return (
    <>
      <PageHeader
        back={
          <Link href="/logs" className="text-fg-subtle hover:text-fg">
            ← Email Logs
          </Link>
        }
        title={message.subject ?? <span className="text-fg-subtle">(no subject)</span>}
        description={<span className="break-all font-mono text-xs">{message.message_id}</span>}
      />

      <dl className="card grid grid-cols-1 overflow-hidden sm:grid-cols-2 lg:grid-cols-4 [&>div]:-mb-px [&>div]:-mr-px [&>div]:border-b [&>div]:border-r [&>div]:border-border-subtle">
        <Field label="From" value={message.from_address} />
        <Field label="Sending domain" value={message.from_domain} />
        <Field label="To">
          {message.to_addresses.map((addr, i) => (
            <span key={addr}>
              {i > 0 && ", "}
              <Link href={recipientHref(addr)} className="link">
                {addr}
              </Link>
            </span>
          ))}
        </Field>
        <Field label="Configuration set" value={message.configuration_set ?? "—"} />
      </dl>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Event timeline</h2>
        <ol className="relative ml-1.5 border-l border-border">
          {events.map((e, i) => {
            const at = new Date(e.occurred_at);
            const prev = i > 0 ? new Date(events[i - 1].occurred_at) : null;
            return (
              <li key={e.id} className="relative pb-5 pl-6 last:pb-0">
                <span
                  className={`absolute -left-[5px] top-[7px] h-2.5 w-2.5 rounded-full ring-[3px] ring-bg ${eventDotClass(e.event_type, e.bounce_type)}`}
                />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-medium">
                    <EventBadge type={e.event_type} bounceType={e.bounce_type} dot={false} />
                  </span>
                  <span className="num text-ui text-fg-muted">{at.toLocaleString()}</span>
                  {prev && (
                    <span className="num text-xs text-fg-subtle">
                      {delta(at.getTime() - prev.getTime())}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 space-y-1.5 text-ui text-fg-muted">
                  {e.bounce_type && (
                    <div className="text-xs text-fg-subtle">
                      {e.bounce_type}
                      {e.bounce_sub_type && ` / ${e.bounce_sub_type}`}
                    </div>
                  )}
                  {e.complaint_feedback_type && (
                    <div>
                      Complaint type: <span className="text-fg">{e.complaint_feedback_type}</span>
                    </div>
                  )}
                  {e.diagnostic && (
                    <div className="rounded-md border border-border-subtle bg-bg-inset px-3 py-2 font-mono text-xs text-fg-muted">
                      {e.diagnostic}
                    </div>
                  )}
                  {e.link && (
                    <div className="truncate">
                      Link: <span className="font-mono text-xs text-accent">{e.link}</span>
                    </div>
                  )}
                  {(e.ip_address || e.user_agent) && (
                    <div className="truncate font-mono text-xs text-fg-subtle">
                      {e.ip_address}
                      {e.user_agent ? ` · ${e.user_agent}` : ""}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 break-words text-ui">{children ?? value}</dd>
    </div>
  );
}
