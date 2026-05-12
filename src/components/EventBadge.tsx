const STYLES: Record<string, string> = {
  Send: "bg-fg-subtle/15 text-fg-muted ring-fg-subtle/30",
  Delivery: "bg-accent-green/15 text-accent-green ring-accent-green/30",
  Bounce: "bg-accent-red/15 text-accent-red ring-accent-red/30",
  Complaint: "bg-accent-red/15 text-accent-red ring-accent-red/30",
  Open: "bg-accent/15 text-accent ring-accent/30",
  Click: "bg-accent-purple/15 text-accent-purple ring-accent-purple/30",
  Reject: "bg-accent-red/15 text-accent-red ring-accent-red/30",
  RenderingFailure: "bg-accent-yellow/15 text-accent-yellow ring-accent-yellow/30",
  DeliveryDelay: "bg-accent-yellow/15 text-accent-yellow ring-accent-yellow/30",
};

export function EventBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-fg-subtle">—</span>;
  const cls = STYLES[type] ?? "bg-fg-subtle/15 text-fg-muted ring-fg-subtle/30";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {type}
    </span>
  );
}
