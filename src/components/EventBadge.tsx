const STYLES: Record<string, string> = {
  Send: "bg-fg-subtle/15 text-fg-muted ring-fg-subtle/30",
  Delivery: "bg-accent-green/15 text-accent-green ring-accent-green/30",
  Bounce: "bg-accent-red/15 text-accent-red ring-accent-red/30",
  HardBounce: "bg-accent-red/15 text-accent-red ring-accent-red/30",
  SoftBounce: "bg-accent-yellow/15 text-accent-yellow ring-accent-yellow/30",
  Complaint: "bg-accent-red/15 text-accent-red ring-accent-red/30",
  Open: "bg-accent/15 text-accent ring-accent/30",
  Click: "bg-accent-purple/15 text-accent-purple ring-accent-purple/30",
  Reject: "bg-accent-red/15 text-accent-red ring-accent-red/30",
  RenderingFailure:
    "bg-accent-yellow/15 text-accent-yellow ring-accent-yellow/30",
  DeliveryDelay:
    "bg-accent-yellow/15 text-accent-yellow ring-accent-yellow/30",
};

const LABELS: Record<string, string> = {
  HardBounce: "Hard bounce",
  SoftBounce: "Soft bounce",
};

const TOOLTIPS: Record<string, string> = {
  HardBounce: "Permanent failure — recipient address is invalid or rejected outright. Should be suppressed.",
  SoftBounce: "Transient failure — mailbox full, server unavailable, etc. May succeed on retry.",
};

export function EventBadge({
  type,
  bounceType,
}: {
  type: string | null;
  bounceType?: string | null;
}) {
  if (!type) return <span className="text-fg-subtle">—</span>;

  let effectiveType = type;
  if (type === "Bounce" && bounceType) {
    if (bounceType === "Permanent") effectiveType = "HardBounce";
    else if (bounceType === "Transient") effectiveType = "SoftBounce";
  }

  const cls =
    STYLES[effectiveType] ?? "bg-fg-subtle/15 text-fg-muted ring-fg-subtle/30";
  const label = LABELS[effectiveType] ?? effectiveType;
  const tooltip = TOOLTIPS[effectiveType];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
      title={tooltip}
    >
      {label}
    </span>
  );
}
