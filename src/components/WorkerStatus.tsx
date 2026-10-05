import {
  getWorkerHeartbeat,
  workerStaleSeconds,
  type WorkerHeartbeat,
} from "@/lib/queries";
import { timeAgo } from "@/lib/time";

// Sidebar indicator for the SQS worker. Green while it's polling, red when
// the last successful poll is older than WORKER_STALE_SECONDS — i.e. the
// numbers on screen have stopped updating even though the page hasn't.
export async function WorkerStatus() {
  let hb: WorkerHeartbeat | null;
  try {
    hb = await getWorkerHeartbeat();
  } catch {
    return (
      <Status tone="red" label="Worker status unknown" detail="Database unavailable" />
    );
  }

  if (!hb) {
    return (
      <Status
        tone="red"
        label="Worker not seen"
        detail="No heartbeat yet. Is the worker running?"
      />
    );
  }

  const staleAfter = workerStaleSeconds();
  const ageSec = (Date.now() - hb.lastPollAt.getTime()) / 1000;
  const stale = staleAfter > 0 && ageSec > staleAfter;
  const lastEvent = hb.lastEventAt
    ? `Last event ${timeAgo(hb.lastEventAt, { seconds: true })}`
    : "No events yet";

  return (
    <Status
      tone={stale ? "red" : "green"}
      label={stale ? "Worker offline" : "Worker running"}
      detail={
        stale
          ? `Last poll ${timeAgo(hb.lastPollAt, { seconds: true })}`
          : lastEvent
      }
      title={`Last SQS poll: ${hb.lastPollAt.toLocaleString()}\n${
        hb.lastEventAt
          ? `Last event ingested: ${hb.lastEventAt.toLocaleString()}`
          : "No events ingested yet"
      }`}
    />
  );
}

function Status({
  tone,
  label,
  detail,
  title,
}: {
  tone: "green" | "red";
  label: string;
  detail: string;
  title?: string;
}) {
  const dot = tone === "green" ? "bg-accent-green" : "bg-accent-red";
  return (
    <div className="text-xs" title={title}>
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-2 w-2 rounded-full ${dot}`} />
        <span className={tone === "green" ? "text-fg-muted" : "text-accent-red"}>
          {label}
        </span>
      </div>
      <div className="mt-0.5 pl-4 text-fg-subtle">{detail}</div>
    </div>
  );
}
