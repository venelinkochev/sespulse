import type { Range, TimeSeriesPoint } from "@/lib/queries";

// Stacked bars per bucket: delivered, bounced, and everything else that was
// sent (in flight, rejected, complained) so the bar height is total sent.
export function TimeSeriesChart({
  data,
  range,
}: {
  data: TimeSeriesPoint[];
  range: Range;
}) {
  const empty = data.length === 0 || data.every((d) => d.sent === 0);

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="t-section">Send volume</h2>
          <p className="t-desc mt-0.5">
            {range === "24h" ? "Per hour" : "Per day"}, by outcome
          </p>
        </div>
        <div className="flex items-center gap-4 text-ui text-fg-muted">
          <Legend swatch="bg-accent" label="Delivered" />
          <Legend swatch="bg-accent-red" label="Bounced" />
          <Legend swatch="bg-fg-subtle/50" label="Other" />
        </div>
      </div>
      {empty ? (
        <div className="flex h-[220px] items-center justify-center rounded-md border border-dashed border-border text-ui text-fg-muted">
          No send activity in this range yet.
        </div>
      ) : (
        <Chart data={data} range={range} />
      )}
    </div>
  );
}

// Bars and gridlines are SVG stretched to the container; axis labels are
// HTML so they stay a real 12px at any width instead of scaling with it.
function Chart({
  data,
  range,
}: {
  data: TimeSeriesPoint[];
  range: Range;
}) {
  const max = Math.max(...data.map((d) => d.sent), 1);
  const niceMax = niceCeil(max);
  const ticks = [1, 0.5, 0];

  const W = 1000;
  const H = 200;
  const slotW = W / data.length;
  const gap = Math.min(6, slotW * 0.3);
  const barW = Math.max(slotW - gap, 1.5);
  const yOf = (n: number) => (n / niceMax) * H;

  const fmtX = (d: Date) =>
    range === "24h"
      ? d.toLocaleTimeString([], { hour: "numeric" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });

  const fmtTooltip = (d: Date) =>
    range === "24h"
      ? d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric" })
      : d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div className="flex gap-3">
      {/* Y axis */}
      <div className="relative h-[200px] w-10 shrink-0 text-right text-xs text-fg-subtle">
        {ticks.map((t) => (
          <span
            key={t}
            className="num absolute right-0 -translate-y-1/2"
            style={{ top: `${(1 - t) * 100}%` }}
          >
            {Math.round(niceMax * t).toLocaleString()}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="block h-[200px] w-full overflow-visible"
        >
          {ticks.map((t) => (
            <line
              key={t}
              x1={0}
              x2={W}
              y1={H - H * t}
              y2={H - H * t}
              className="stroke-border"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {data.map((d, i) => {
            const x = i * slotW + gap / 2;
            const delivered = Math.min(d.delivered, d.sent);
            const bounced = Math.min(d.bounced, d.sent - delivered);
            const other = Math.max(0, d.sent - delivered - bounced);
            const hDel = yOf(delivered);
            const hBnc = yOf(bounced);
            const hOth = yOf(other);
            const bounceRate = d.sent ? ((d.bounced / d.sent) * 100).toFixed(1) : "0";
            return (
              <g key={i}>
                <title>
                  {`${fmtTooltip(d.bucket)}\n${d.sent.toLocaleString()} sent · ${d.delivered.toLocaleString()} delivered · ${d.bounced.toLocaleString()} bounced (${bounceRate}%)`}
                </title>
                <rect x={x} y={0} width={barW} height={H} className="fill-transparent hover:fill-fg/[0.04]" />
                {delivered > 0 && (
                  <rect x={x} y={H - hDel} width={barW} height={hDel} className="fill-accent/80" />
                )}
                {bounced > 0 && (
                  <rect x={x} y={H - hDel - hBnc} width={barW} height={hBnc} className="fill-accent-red" />
                )}
                {other > 0 && (
                  <rect x={x} y={H - hDel - hBnc - hOth} width={barW} height={hOth} className="fill-fg-subtle/40" />
                )}
              </g>
            );
          })}
        </svg>

        {/* X axis */}
        <div className="relative mt-2 h-4 text-xs text-fg-subtle">
          {data.map((d, i) =>
            i % labelEvery === 0 ? (
              <span
                key={i}
                // Every other label on narrow screens so dates don't collide.
                className={`absolute -translate-x-1/2 whitespace-nowrap ${
                  (i / labelEvery) % 2 === 1 ? "hidden sm:block" : ""
                }`}
                style={{ left: `${((i + 0.5) / data.length) * 100}%` }}
              >
                {fmtX(d.bucket)}
              </span>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-[2px] ${swatch}`} />
      <span>{label}</span>
    </div>
  );
}

function niceCeil(n: number): number {
  if (n <= 1) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const norm = n / pow;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * pow;
}
