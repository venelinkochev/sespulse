import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Check = { ok: true; latencyMs: number } | { ok: false; error: string };

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
