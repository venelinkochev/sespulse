import Link from "next/link";

export function RangeTabs({
  current,
  basePath,
}: {
  current: string;
  basePath: string;
}) {
  const ranges: { value: string; label: string }[] = [
    { value: "24h", label: "24h" },
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Time range"
      className="inline-flex rounded-md border border-border bg-bg-inset p-0.5 font-mono text-xs"
    >
      {ranges.map((r) => {
        const active = r.value === current;
        return (
          <Link
            key={r.value}
            href={`${basePath}?range=${r.value}`}
            role="tab"
            aria-selected={active}
            title={`Last ${r.value === "24h" ? "24 hours" : r.value === "7d" ? "7 days" : "30 days"}`}
            className={`rounded px-3 py-1.5 transition-colors ${
              active
                ? "bg-bg-hover text-fg shadow-[inset_0_0_0_1px_rgb(var(--border-strong))]"
                : "text-fg-subtle hover:text-fg"
            }`}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
