// A row of key numbers in one panel, separated by hairlines rather than
// boxed individually.
export function MetricStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="card grid grid-cols-2 overflow-hidden sm:grid-cols-3 lg:grid-cols-6 [&>*]:border-border-subtle [&>*]:border-b [&>*]:border-r">
      {children}
    </div>
  );
}

export function Metric({
  label,
  value,
  sub,
  dot,
  title,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  dot?: "good" | "warn" | "bad";
  title?: string;
}) {
  const dotCls =
    dot === "good"
      ? "bg-accent-green"
      : dot === "warn"
        ? "bg-accent-yellow"
        : dot === "bad"
          ? "bg-accent-red"
          : null;
  return (
    <div className="-mb-px -mr-px px-5 py-4" title={title}>
      <div className="eyebrow flex items-center gap-1.5">
        {dotCls && <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />}
        {label}
      </div>
      <div className="t-metric mt-2">{value}</div>
      {sub && <div className="t-caption mt-1 truncate">{sub}</div>}
    </div>
  );
}
