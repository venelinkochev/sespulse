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
          <h2 className="text-sm font-semibold">Send volume</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            {range === "24h" ? "Per hour" : "Per day"}, by outcome
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-fg-muted">
          <Legend swatch="bg-accent" label="Delivered" />
          <Legend swatch="bg-accent-red" label="Bounced" />
          <Legend swatch="bg-fg-subtle/50" label="Other" />
        </div>
      </div>
      {empty ? (
        <div className="flex h-[220px] items-center justify-center rounded-md border border-dashed border-border text-sm text-fg-subtle">
          No send activity in this range yet.
        </div>
      ) : (
        <Chart data={data} range={range} />
      )}
    </div>
  );
}

function Chart({
  data,
  range,
}: {
  data: TimeSeriesPoint[];
  range: Range;
}) {
  const max = Math.max(...data.map((d) => d.sent), 1);

  const W = 1000;
  const H = 220;
  const padL = 40;
  const padR = 4;
  const padT = 8;
  const padB = 26;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const slotW = chartW / data.length;
  const gap = Math.min(6, slotW * 0.3);
  const barW = Math.max(slotW - gap, 1.5);

  const niceMax = niceCeil(max);
  const ticks = [0, 0.5, 1].map((t) => ({
    y: padT + chartH - chartH * t,
    label: Math.round(niceMax * t).toLocaleString(),
  }));
  const yOf = (n: number) => (n / niceMax) * chartH;

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
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={W - padR}
            y1={t.y}
            y2={t.y}
            className="stroke-border-subtle"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={padL - 8}
            y={t.y + 3}
            className="fill-fg-subtle font-mono"
            fontSize="10"
            textAnchor="end"
          >
            {t.label}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const x = padL + i * slotW + gap / 2;
        const base = padT + chartH;
        const delivered = Math.min(d.delivered, d.sent);
        const bounced = Math.min(d.bounced, d.sent - delivered);
        const other = Math.max(0, d.sent - delivered - bounced);
        const hDel = yOf(delivered);
        const hBnc = yOf(bounced);
        const hOth = yOf(other);
        const isLabel = i % labelEvery === 0;
        const bounceRate = d.sent ? ((d.bounced / d.sent) * 100).toFixed(1) : "0";
        return (
          <g key={i}>
            <title>
              {`${fmtTooltip(d.bucket)}\n${d.sent.toLocaleString()} sent · ${d.delivered.toLocaleString()} delivered · ${d.bounced.toLocaleString()} bounced (${bounceRate}%)`}
            </title>
            {/* Full-height hover target */}
            <rect x={x} y={padT} width={barW} height={chartH} className="fill-transparent hover:fill-fg/[0.04]" />
            {delivered > 0 && (
              <rect x={x} y={base - hDel} width={barW} height={hDel} className="fill-accent/80" />
            )}
            {bounced > 0 && (
              <rect x={x} y={base - hDel - hBnc} width={barW} height={hBnc} className="fill-accent-red" />
            )}
            {other > 0 && (
              <rect
                x={x}
                y={base - hDel - hBnc - hOth}
                width={barW}
                height={hOth}
                className="fill-fg-subtle/40"
              />
            )}
            {isLabel && (
              <text
                x={x + barW / 2}
                y={H - 6}
                className="fill-fg-subtle font-mono"
                fontSize="10"
                textAnchor="middle"
              >
                {fmtX(d.bucket)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
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
