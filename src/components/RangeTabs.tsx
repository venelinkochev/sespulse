import Link from "next/link";

export function RangeTabs({
  current,
  basePath,
}: {
  current: string;
  basePath: string;
}) {
  const ranges: { value: string; label: string }[] = [
    { value: "24h", label: "Last 24h" },
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
  ];
  return (
    <div className="inline-flex rounded-md border border-border bg-bg-card p-1 text-sm">
      {ranges.map((r) => {
        const active = r.value === current;
        return (
          <Link
            key={r.value}
            href={`${basePath}?range=${r.value}`}
            className={`px-3 py-1.5 rounded ${
              active
                ? "bg-bg-hover text-fg"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
