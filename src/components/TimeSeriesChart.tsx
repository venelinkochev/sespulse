import type { Range, TimeSeriesPoint } from "@/lib/queries";

export function TimeSeriesChart({
  data,
  range,
}: {
  data: TimeSeriesPoint[];
  range: Range;
}) {
  const empty = data.length === 0 || data.every((d) => d.sent === 0);

  return (
    <div className="rounded-lg border border-border bg-bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm uppercase tracking-wide text-fg-subtle">
            Send volume
          </h2>
          <p className="text-xs text-fg-muted mt-0.5">
            {range === "24h" ? "Hourly" : "Daily"} sends and bounces
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-fg-muted">
          <Legend swatch="bg-accent/60" label="Sent" />
          <Legend swatch="bg-accent-red" label="Bounced" />
        </div>
      </div>
      {empty ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-fg-muted">
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
  const padL = 44;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const slotW = chartW / data.length;
  const barW = Math.max(slotW - 4, 2);

  const niceMax = niceCeil(max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padT + chartH - chartH * t,
    label: Math.round(niceMax * t).toLocaleString(),
  }));

  const fmtX = (d: Date) =>
    range === "24h"
      ? d.toLocaleTimeString([], { hour: "numeric" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });

  const fmtTooltip = (d: Date) =>
    range === "24h"
      ? d.toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "numeric",
        })
      : d.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px]">
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={W - padR}
            y1={t.y}
            y2={t.y}
            stroke="#1f2535"
            strokeDasharray={i === 0 ? "0" : "3 3"}
          />
          <text
            x={padL - 8}
            y={t.y + 3}
            fill="#6b7388"
            fontSize="10"
            textAnchor="end"
          >
            {t.label}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const x = padL + i * slotW + 2;
        const sentH = (d.sent / niceMax) * chartH;
        const bouncedH = (d.bounced / niceMax) * chartH;
        const sentY = padT + chartH - sentH;
        const bouncedY = padT + chartH - bouncedH;
        const isLabel = i % labelEvery === 0 || i === data.length - 1;
        return (
          <g key={i}>
            {d.sent > 0 && (
              <rect
                x={x}
                y={sentY}
                width={barW}
                height={sentH}
                fill="#5b8def"
                fillOpacity="0.55"
                rx="2"
              >
                <title>
                  {fmtTooltip(d.bucket)} — {d.sent.toLocaleString()} sent
                  {", "}
                  {d.delivered.toLocaleString()} delivered
                  {d.bounced > 0
                    ? `, ${d.bounced.toLocaleString()} bounced`
                    : ""}
                </title>
              </rect>
            )}
            {d.bounced > 0 && (
              <rect
                x={x}
                y={bouncedY}
                width={barW}
                height={bouncedH}
                fill="#f87171"
                rx="2"
              >
                <title>
                  {fmtTooltip(d.bucket)} — {d.bounced.toLocaleString()} bounced
                </title>
              </rect>
            )}
            {isLabel && (
              <text
                x={x + barW / 2}
                y={H - padB + 16}
                fill="#6b7388"
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
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${swatch}`} />
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
