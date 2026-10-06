// Inline rate with a small bar, for table cells. `scaleMax` is the rate
// that fills the bar (e.g. 10% for bounce rate, SES's pause threshold).
export function RateBar({
  value,
  scaleMax = 100,
  tone,
}: {
  value: number;
  scaleMax?: number;
  tone: "good" | "warn" | "bad" | "neutral";
}) {
  const fill =
    tone === "good"
      ? "bg-accent-green"
      : tone === "warn"
        ? "bg-accent-yellow"
        : tone === "bad"
          ? "bg-accent-red"
          : "bg-fg-subtle";
  const width = Math.min(100, (value / scaleMax) * 100);
  return (
    <div className="flex items-center justify-end gap-2.5">
      <span className="num font-mono text-[13px]">{value.toFixed(1)}%</span>
      <span className="hidden h-1 w-12 overflow-hidden rounded-full bg-bg-inset ring-1 ring-inset ring-border-subtle sm:block">
        <span
          className={`block h-full rounded-full ${fill}`}
          style={{ width: value > 0 ? `max(${width}%, 2px)` : 0 }}
        />
      </span>
    </div>
  );
}
