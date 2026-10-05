import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { getWorkerHeartbeat, workerStaleSeconds } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Check =
  | ({ ok: true } & Record<string, unknown>)
  | ({ ok: false; error: string } & Record<string, unknown>);

export async function GET() {
  const checks: Record<string, Check> = {};
  let healthy = true;

  // Postgres
  const dbStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = { ok: false, error: (err as Error).message };
    healthy = false;
  }

  // Worker: the SQS poller writes a heartbeat every ~20s. If it's gone stale
  // the dashboard keeps serving old numbers, so treat that as unhealthy.
  const staleAfter = workerStaleSeconds();
  if (staleAfter > 0 && checks.database.ok) {
    try {
      const hb = await getWorkerHeartbeat();
      if (!hb) {
        checks.worker = { ok: false, error: "No heartbeat recorded yet" };
        healthy = false;
      } else {
        const ageSeconds = Math.round((Date.now() - hb.lastPollAt.getTime()) / 1000);
        const detail = {
          lastPollAt: hb.lastPollAt.toISOString(),
          lastEventAt: hb.lastEventAt?.toISOString() ?? null,
          ageSeconds,
        };
        if (ageSeconds > staleAfter) {
          checks.worker = {
            ok: false,
            error: `No SQS poll for ${ageSeconds}s (limit ${staleAfter}s)`,
            ...detail,
          };
          healthy = false;
        } else {
          checks.worker = { ok: true, ...detail };
        }
      }
    } catch (err) {
      checks.worker = { ok: false, error: (err as Error).message };
      healthy = false;
    }
  }

  return NextResponse.json(
    {
      status: healthy ? "ok" : "error",
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
