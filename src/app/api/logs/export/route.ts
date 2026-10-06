import type { NextRequest } from "next/server";
import { iterateLogs, type LogRow } from "@/lib/queries";
import { csvRow } from "@/lib/csv";
import { emailOnly } from "@/lib/address";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/logs/export?domain=&event=&q=
// Same filters as the Email Logs page, but every matching message rather
// than the 200 most recent. Streamed, so large exports start immediately.
// Protected by the dashboard login like every route except /api/health.

const HEADER = [
  "sent_at",
  "message_id",
  "from_address",
  "from_domain",
  "to_addresses",
  "subject",
  "status",
  "bounce_type",
  "last_event_at",
];

function toCsv(r: LogRow): string {
  return csvRow([
    r.sentAt.toISOString(),
    r.messageId,
    emailOnly(r.fromAddress),
    r.fromDomain,
    r.toAddresses.map(emailOnly).join("; "),
    r.subject,
    r.lastEventType,
    r.lastBounceType,
    r.lastEventAt?.toISOString(),
  ]);
}

function param(req: NextRequest, name: string): string | null {
  const v = req.nextUrl.searchParams.get(name)?.trim();
  return v ? v : null;
}

export async function GET(req: NextRequest) {
  const filters = {
    domain: param(req, "domain"),
    eventType: param(req, "event"),
    q: param(req, "q"),
  };
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
  const filename = `sespulse-logs-${stamp}.csv`;

  const encoder = new TextEncoder();
  const batches = iterateLogs(filters);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // UTF-8 BOM so Excel doesn't mangle non-ASCII subjects.
      controller.enqueue(encoder.encode("﻿" + csvRow(HEADER)));
    },
    async pull(controller) {
      try {
        const { value, done } = await batches.next();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(value.map(toCsv).join("")));
      } catch (err) {
        console.error("CSV export failed", err);
        controller.error(err);
      }
    },
    async cancel() {
      await batches.return(undefined);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
