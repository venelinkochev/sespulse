// SES reputation gauge: the rate plotted against the thresholds where AWS
// puts an account under review and where it may pause sending.
// https://docs.aws.amazon.com/ses/latest/dg/reputationdashboard-faqs.html

export interface GaugeThresholds {
  elevated: number; // worth watching
  review: number; // AWS reviews the account
  pause: number; // AWS may pause sending
}

type Level = "healthy" | "elevated" | "review" | "pause";

function levelOf(value: number, t: GaugeThresholds): Level {
  if (value >= t.pause) return "pause";
  if (value >= t.review) return "review";
  if (value >= t.elevated) return "elevated";
  return "healthy";
}

const LEVEL: Record<Level, { label: string; text: string; fill: string }> = {
  healthy: { label: "Healthy", text: "text-accent-green", fill: "bg-accent-green" },
  elevated: { label: "Elevated", text: "text-accent-yellow", fill: "bg-accent-yellow" },
  review: { label: "Review risk", text: "text-accent-red", fill: "bg-accent-red" },
  pause: { label: "Pause risk", text: "text-accent-red", fill: "bg-accent-red" },
};

const fmtPct = (n: number, digits: number) => `${n.toFixed(digits)}%`;

export function ReputationGauge({
  label,
  value,
  digits = 2,
  detail,
  thresholds,
  sampleSize,
}: {
  label: string;
  value: number;
  digits?: number;
  detail: React.ReactNode;
  thresholds: GaugeThresholds;
  sampleSize: number;
}) {
  const level = sampleSize === 0 ? null : levelOf(value, thresholds);
  // Scale extends 20% past the pause line so it's visible as a marker.
  const max = thresholds.pause * 1.2;
  const pos = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  const style = level ? LEVEL[level] : null;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">{label}</div>
          <div className="num mt-2 font-mono text-3xl font-medium tracking-tight">
            {sampleSize === 0 ? "—" : fmtPct(value, digits)}
          </div>
        </div>
        {style && (
          <div className={`mt-0.5 flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${style.fill}`} />
            {style.label}
          </div>
        )}
      </div>

      {/* Track */}
      <div className="relative mt-5 mb-6">
        <div className="h-1.5 overflow-hidden rounded-full bg-bg-inset ring-1 ring-inset ring-border-subtle">
          {style && (
            <div
              className={`h-full rounded-full ${style.fill}`}
              style={{ width: value > 0 ? `max(${pos(value)}, 4px)` : 0 }}
            />
          )}
        </div>
        <Marker at={pos(thresholds.review)} label={`${fmtPct(thresholds.review, thresholds.review < 1 ? 1 : 0)} review`} />
        <Marker at={pos(thresholds.pause)} label={`${fmtPct(thresholds.pause, thresholds.pause < 1 ? 1 : 0)} pause`} />
      </div>

      <div className="text-xs text-fg-muted">{detail}</div>
    </div>
  );
}

function Marker({ at, label }: { at: string; label: string }) {
  return (
    <div className="absolute top-[-3px]" style={{ left: at }}>
      <div className="h-3 w-px -translate-x-1/2 bg-fg-subtle" />
      <div className="mt-1 -translate-x-1/2 whitespace-nowrap font-mono text-2xs text-fg-subtle">
        {label}
      </div>
    </div>
  );
}
