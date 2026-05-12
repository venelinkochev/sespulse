import Link from "next/link";
import { notFound } from "next/navigation";
import { getMessageWithEvents } from "@/lib/queries";
import { EventBadge } from "@/components/EventBadge";

export const dynamic = "force-dynamic";

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
    <div className="space-y-6">
      <div>
        <Link href="/logs" className="text-fg-muted text-sm hover:text-fg">
          ← Back to logs
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {message.subject ?? <span className="text-fg-subtle">(no subject)</span>}
        </h1>
        <p className="font-mono text-xs text-fg-subtle mt-1">{message.message_id}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <Field label="From" value={message.from_address} />
        <Field label="Domain" value={message.from_domain} />
        <Field label="To" value={message.to_addresses.join(", ")} />
        <Field label="Config set" value={message.configuration_set ?? "—"} />
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-wide text-fg-subtle mb-3">
          Event timeline
        </h2>
        <ol className="space-y-3">
          {events.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-border bg-bg-card p-4 flex items-start gap-4"
            >
              <div className="pt-0.5">
                <EventBadge type={e.event_type} />
              </div>
              <div className="flex-1 text-sm">
                <div className="text-fg-muted text-xs">
                  {new Date(e.occurred_at).toLocaleString()}
                </div>
                {e.bounce_type && (
                  <div className="mt-1">
                    Bounce: <span className="text-fg">{e.bounce_type}</span>
                    {e.bounce_sub_type && ` / ${e.bounce_sub_type}`}
                  </div>
                )}
                {e.complaint_feedback_type && (
                  <div className="mt-1">
                    Complaint type:{" "}
                    <span className="text-fg">{e.complaint_feedback_type}</span>
                  </div>
                )}
                {e.diagnostic && (
                  <div className="mt-1 font-mono text-xs text-fg-muted">
                    {e.diagnostic}
                  </div>
                )}
                {e.link && (
                  <div className="mt-1 truncate">
                    Link:{" "}
                    <span className="font-mono text-xs text-accent">
                      {e.link}
                    </span>
                  </div>
                )}
                {(e.ip_address || e.user_agent) && (
                  <div className="mt-1 text-xs text-fg-subtle">
                    {e.ip_address}
                    {e.user_agent ? ` · ${e.user_agent}` : ""}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-card p-3">
      <div className="text-xs uppercase tracking-wide text-fg-subtle">
        {label}
      </div>
      <div className="mt-1 break-words font-mono text-xs">{value}</div>
    </div>
  );
}
