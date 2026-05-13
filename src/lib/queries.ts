import { sql } from "drizzle-orm";
import { db } from "../db/client";

export interface OverviewStats {
  totalSent: number;
  recipientCount: number;
  delivered: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
  rejected: number;
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
  openRate: number;
  clickRate: number;
}

export type Range = "24h" | "7d" | "30d";

function intervalFor(range: Range): string {
  switch (range) {
    case "24h":
      return "24 hours";
    case "7d":
      return "7 days";
    case "30d":
      return "30 days";
  }
}

// A message only counts as "sent" if we captured at least one delivery-
// lifecycle event for it (Send, Delivery, Bounce, Complaint, Reject,
// RenderingFailure, DeliveryDelay). Open and Click are recipient actions
// and can arrive long after SESPulse came online — for messages we never
// saw the Send/Delivery for, counting them would inflate "sent" and push
// open-rate above 100%. This filter is applied to every aggregate query
// so all metrics share the same denominator.
const hasLifecycleEvent = sql`EXISTS (
  SELECT 1 FROM events e2
  WHERE e2.message_id = m.message_id
    AND e2.event_type IN (
      'Send','Delivery','Bounce','Complaint','Reject','RenderingFailure','DeliveryDelay'
    )
)`;

export async function getOverview(range: Range): Promise<OverviewStats> {
  const interval = intervalFor(range);
  const rows = await db.execute<{
    sent: string;
    recipients: string;
    delivered: string;
    bounced: string;
    complained: string;
    opened: string;
    clicked: string;
    rejected: string;
  }>(sql`
    WITH msgs AS (
      SELECT m.message_id, m.to_addresses
      FROM messages m
      WHERE m.sent_at >= NOW() - (${interval})::interval
        AND ${hasLifecycleEvent}
    )
    SELECT
      (SELECT COUNT(*) FROM msgs)::text AS sent,
      (SELECT COALESCE(SUM(COALESCE(array_length(to_addresses, 1), 0)), 0) FROM msgs)::text AS recipients,
      COUNT(DISTINCT CASE WHEN e.event_type = 'Delivery' THEN m.message_id END) AS delivered,
      COUNT(DISTINCT CASE WHEN e.event_type = 'Bounce' THEN m.message_id END) AS bounced,
      COUNT(DISTINCT CASE WHEN e.event_type = 'Complaint' THEN m.message_id END) AS complained,
      COUNT(DISTINCT CASE WHEN e.event_type = 'Open' THEN m.message_id END) AS opened,
      COUNT(DISTINCT CASE WHEN e.event_type = 'Click' THEN m.message_id END) AS clicked,
      COUNT(DISTINCT CASE WHEN e.event_type = 'Reject' THEN m.message_id END) AS rejected
    FROM msgs m
    LEFT JOIN events e ON e.message_id = m.message_id
  `);

  const r = rows[0] ?? {
    sent: "0",
    recipients: "0",
    delivered: "0",
    bounced: "0",
    complained: "0",
    opened: "0",
    clicked: "0",
    rejected: "0",
  };
  const totalSent = Number(r.sent);
  const recipientCount = Number(r.recipients);
  const delivered = Number(r.delivered);
  const bounced = Number(r.bounced);
  const complained = Number(r.complained);
  const opened = Number(r.opened);
  const clicked = Number(r.clicked);
  const rejected = Number(r.rejected);
  const safe = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100);
  return {
    totalSent,
    recipientCount,
    delivered,
    bounced,
    complained,
    opened,
    clicked,
    rejected,
    deliveryRate: safe(delivered, totalSent),
    bounceRate: safe(bounced, totalSent),
    complaintRate: safe(complained, totalSent),
    openRate: safe(opened, delivered),
    clickRate: safe(clicked, delivered),
  };
}

export interface DomainRow {
  domain: string;
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  bounceRate: number;
  openRate: number;
}

export async function getDomainStats(range: Range): Promise<DomainRow[]> {
  const interval = intervalFor(range);
  const rows = await db.execute<{
    domain: string;
    sent: string;
    delivered: string;
    bounced: string;
    complained: string;
    opened: string;
    clicked: string;
  }>(sql`
    SELECT
      m.from_domain AS domain,
      COUNT(DISTINCT m.message_id) AS sent,
      COUNT(DISTINCT CASE WHEN e.event_type = 'Delivery' THEN m.message_id END) AS delivered,
      COUNT(DISTINCT CASE WHEN e.event_type = 'Bounce' THEN m.message_id END) AS bounced,
      COUNT(DISTINCT CASE WHEN e.event_type = 'Complaint' THEN m.message_id END) AS complained,
      COUNT(DISTINCT CASE WHEN e.event_type = 'Open' THEN m.message_id END) AS opened,
      COUNT(DISTINCT CASE WHEN e.event_type = 'Click' THEN m.message_id END) AS clicked
    FROM messages m
    LEFT JOIN events e ON e.message_id = m.message_id
    WHERE m.sent_at >= NOW() - (${interval})::interval
      AND ${hasLifecycleEvent}
    GROUP BY m.from_domain
    ORDER BY sent DESC
  `);

  return rows.map((r) => {
    const sent = Number(r.sent);
    const delivered = Number(r.delivered);
    const bounced = Number(r.bounced);
    const complained = Number(r.complained);
    const opened = Number(r.opened);
    const clicked = Number(r.clicked);
    const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100);
    return {
      domain: r.domain,
      sent,
      delivered,
      bounced,
      complained,
      opened,
      clicked,
      deliveryRate: pct(delivered, sent),
      bounceRate: pct(bounced, sent),
      openRate: pct(opened, delivered),
    };
  });
}

export interface LogRow {
  messageId: string;
  fromAddress: string;
  fromDomain: string;
  toAddresses: string[];
  subject: string | null;
  sentAt: Date;
  lastEventType: string | null;
  lastEventAt: Date | null;
}

export async function getLogs(params: {
  limit?: number;
  domain?: string | null;
  eventType?: string | null;
  q?: string | null;
}): Promise<LogRow[]> {
  const limit = Math.min(params.limit ?? 100, 500);
  const domain = params.domain ?? null;
  const eventType = params.eventType ?? null;
  const q = params.q ? `%${params.q}%` : null;

  const rows = await db.execute<{
    message_id: string;
    from_address: string;
    from_domain: string;
    to_addresses: string[];
    subject: string | null;
    sent_at: string;
    last_event_type: string | null;
    last_event_at: string | null;
  }>(sql`
    SELECT message_id, from_address, from_domain, to_addresses, subject, sent_at, last_event_type, last_event_at
    FROM messages
    WHERE (${domain}::text IS NULL OR from_domain = ${domain})
      AND (${eventType}::text IS NULL OR last_event_type = ${eventType})
      AND (
        ${q}::text IS NULL
        OR subject ILIKE ${q}
        OR from_address ILIKE ${q}
        OR EXISTS (SELECT 1 FROM unnest(to_addresses) addr WHERE addr ILIKE ${q})
      )
    ORDER BY sent_at DESC
    LIMIT ${limit}
  `);

  return rows.map((r) => ({
    messageId: r.message_id,
    fromAddress: r.from_address,
    fromDomain: r.from_domain,
    toAddresses: r.to_addresses,
    subject: r.subject,
    sentAt: new Date(r.sent_at),
    lastEventType: r.last_event_type,
    lastEventAt: r.last_event_at ? new Date(r.last_event_at) : null,
  }));
}

export async function getMessageWithEvents(messageId: string) {
  const messageRows = await db.execute<{
    message_id: string;
    from_address: string;
    from_domain: string;
    to_addresses: string[];
    subject: string | null;
    sent_at: string;
    last_event_type: string | null;
    configuration_set: string | null;
  }>(sql`SELECT * FROM messages WHERE message_id = ${messageId}`);

  const eventRows = await db.execute<{
    id: number;
    event_type: string;
    occurred_at: string;
    bounce_type: string | null;
    bounce_sub_type: string | null;
    complaint_feedback_type: string | null;
    diagnostic: string | null;
    ip_address: string | null;
    user_agent: string | null;
    link: string | null;
  }>(
    sql`SELECT id, event_type, occurred_at, bounce_type, bounce_sub_type, complaint_feedback_type, diagnostic, ip_address, user_agent, link
        FROM events WHERE message_id = ${messageId} ORDER BY occurred_at ASC`
  );

  return { message: messageRows[0] ?? null, events: eventRows };
}

export interface TimeSeriesPoint {
  bucket: Date;
  sent: number;
  delivered: number;
  bounced: number;
}

export async function getTimeSeries(range: Range): Promise<TimeSeriesPoint[]> {
  const interval = intervalFor(range);
  const bucket = range === "24h" ? "hour" : "day";
  const step = bucket === "hour" ? "1 hour" : "1 day";

  const rows = await db.execute<{
    bucket: string;
    sent: string;
    delivered: string;
    bounced: string;
  }>(sql`
    WITH buckets AS (
      SELECT generate_series(
        date_trunc(${bucket}, NOW() - (${interval})::interval),
        date_trunc(${bucket}, NOW()),
        (${step})::interval
      ) AS bucket
    ),
    data AS (
      SELECT
        date_trunc(${bucket}, m.sent_at) AS bucket,
        COUNT(DISTINCT m.message_id) AS sent,
        COUNT(DISTINCT CASE WHEN e.event_type = 'Delivery' THEN m.message_id END) AS delivered,
        COUNT(DISTINCT CASE WHEN e.event_type = 'Bounce' THEN m.message_id END) AS bounced
      FROM messages m
      LEFT JOIN events e ON e.message_id = m.message_id
      WHERE m.sent_at >= NOW() - (${interval})::interval
        AND ${hasLifecycleEvent}
      GROUP BY 1
    )
    SELECT
      b.bucket::text AS bucket,
      COALESCE(d.sent, 0)::text AS sent,
      COALESCE(d.delivered, 0)::text AS delivered,
      COALESCE(d.bounced, 0)::text AS bounced
    FROM buckets b
    LEFT JOIN data d ON d.bucket = b.bucket
    ORDER BY b.bucket ASC
  `);

  return rows.map((r) => ({
    bucket: new Date(r.bucket),
    sent: Number(r.sent),
    delivered: Number(r.delivered),
    bounced: Number(r.bounced),
  }));
}

export async function getDistinctDomains(): Promise<string[]> {
  const rows = await db.execute<{ from_domain: string }>(
    sql`SELECT DISTINCT from_domain FROM messages ORDER BY from_domain`
  );
  return rows.map((r) => r.from_domain);
}
