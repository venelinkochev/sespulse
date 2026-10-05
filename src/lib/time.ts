// Compact relative time ("3m ago"). Under a minute reads "just now" unless
// `seconds` is set, for places where sub-minute precision matters.
export function timeAgo(d: Date, opts: { seconds?: boolean } = {}): string {
  const diffMs = Math.max(0, Date.now() - d.getTime());
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return opts.seconds ? `${s}s ago` : "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
