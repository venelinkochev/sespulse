import {
  getWorkerHeartbeat,
  workerStaleSeconds,
  type WorkerHeartbeat,
} from "@/lib/queries";
import { timeAgo } from "@/lib/time";

export interface WorkerState {
  live: boolean;
  label: string;
  detail: string;
  title?: string;
}

// Live = the SQS worker completed a poll within WORKER_STALE_SECONDS. When
// it isn't, the numbers on screen have stopped updating even though the
// page hasn't, so this is shown on every page.
export async function getWorkerState(): Promise<WorkerState> {
  let hb: WorkerHeartbeat | null;
  try {
    hb = await getWorkerHeartbeat();
  } catch {
    return { live: false, label: "Worker status unknown", detail: "Database unavailable" };
  }
  if (!hb) {
    return {
      live: false,
      label: "Worker not seen",
      detail: "No heartbeat yet. Is the worker running?",
    };
  }

  const staleAfter = workerStaleSeconds();
  const ageSec = (Date.now() - hb.lastPollAt.getTime()) / 1000;
  const stale = staleAfter > 0 && ageSec > staleAfter;
  return {
    live: !stale,
    label: stale ? "Worker offline" : "Ingesting events",
    detail: stale
      ? `Last poll ${timeAgo(hb.lastPollAt, { seconds: true })}`
      : hb.lastEventAt
        ? `Last event ${timeAgo(hb.lastEventAt, { seconds: true })}`
        : "No events yet",
    title: `Last SQS poll: ${hb.lastPollAt.toLocaleString()}\n${
      hb.lastEventAt
        ? `Last event ingested: ${hb.lastEventAt.toLocaleString()}`
        : "No events ingested yet"
    }`,
  };
}

const BEAT = "M0 10h16l3-6 4 12 3-9 2 3h22l3-6 4 12 3-9 2 3h22l3-6 4 12 3-9 2 3h21";

// Sidebar version: a moving heartbeat trace while live, a red flatline when not.
export function WorkerStatus({ state }: { state: WorkerState }) {
  return (
    <div title={state.title} className="min-w-0">
      <svg
        viewBox="0 0 120 20"
        preserveAspectRatio="xMinYMid meet"
        className="mb-1.5 h-5 w-full max-w-[160px]"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {state.live ? (
          <>
            <path d={BEAT} className="stroke-accent-green/20" strokeWidth="1.5" />
            <path
              d={BEAT}
              pathLength={120}
              strokeDasharray="26 94"
              className="animate-trace stroke-accent-green"
              strokeWidth="1.5"
            />
          </>
        ) : (
          <path d="M0 10h120" className="stroke-accent-red" strokeWidth="1.5" />
        )}
      </svg>
      <div className={`text-ui font-medium ${state.live ? "text-fg" : "text-accent-red"}`}>
        {state.label}
      </div>
      <div className="t-caption mt-0.5 truncate">{state.detail}</div>
    </div>
  );
}

// Top-bar version for small screens: a dot, plus the label when something's wrong.
export function WorkerStatusCompact({ state }: { state: WorkerState }) {
  return (
    <div
      className="flex items-center gap-1.5 text-xs"
      title={`${state.label} — ${state.detail}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${state.live ? "bg-accent-green" : "bg-accent-red"}`}
      />
      <span className={state.live ? "sr-only" : "text-accent-red"}>{state.label}</span>
    </div>
  );
}
