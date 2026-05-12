export function StatCard({
  label,
  value,
  sublabel,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  tone?: "default" | "good" | "bad" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-accent-green"
      : tone === "bad"
        ? "text-accent-red"
        : tone === "warn"
          ? "text-accent-yellow"
          : "text-fg";
  return (
    <div className="rounded-lg border border-border bg-bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-fg-subtle">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-semibold ${toneClass}`}>{value}</div>
      {sublabel && (
        <div className="mt-1 text-xs text-fg-muted">{sublabel}</div>
      )}
    </div>
  );
}
