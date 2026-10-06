// Status as a colored dot + label. Color carries meaning only:
// green delivered, amber soft/delayed, red hard bounce/complaint/reject,
// blue/violet engagement, grey in-flight.
const DOT: Record<string, string> = {
  Send: "bg-fg-subtle",
  Delivery: "bg-accent-green",
  Bounce: "bg-accent-red",
  HardBounce: "bg-accent-red",
  SoftBounce: "bg-accent-yellow",
  Complaint: "bg-accent-red",
  Open: "bg-accent",
  Click: "bg-accent-purple",
  Reject: "bg-accent-red",
  RenderingFailure: "bg-accent-yellow",
  DeliveryDelay: "bg-accent-yellow",
};

const LABELS: Record<string, string> = {
  Send: "Sent",
  Delivery: "Delivered",
  HardBounce: "Hard bounce",
  SoftBounce: "Soft bounce",
  Open: "Opened",
  Click: "Clicked",
  Reject: "Rejected",
  Complaint: "Complaint",
  RenderingFailure: "Render failed",
  DeliveryDelay: "Delayed",
};

const TOOLTIPS: Record<string, string> = {
  HardBounce: "Permanent failure — recipient address is invalid or rejected outright. Should be suppressed.",
  SoftBounce: "Transient failure — mailbox full, server unavailable, etc. May succeed on retry.",
  Send: "Accepted by SES, no delivery outcome yet.",
};

function effective(type: string, bounceType?: string | null): string {
  if (type === "Bounce" && bounceType === "Permanent") return "HardBounce";
  if (type === "Bounce" && bounceType === "Transient") return "SoftBounce";
  return type;
}

// Background class for an event's status color, e.g. for timeline nodes.
export function eventDotClass(type: string, bounceType?: string | null): string {
  return DOT[effective(type, bounceType)] ?? "bg-fg-subtle";
}

export function EventBadge({
  type,
  bounceType,
  dot: showDot = true,
}: {
  type: string | null;
  bounceType?: string | null;
  dot?: boolean;
}) {
  if (!type) return <span className="text-fg-subtle">—</span>;

  const effectiveType = effective(type, bounceType);
  const dot = DOT[effectiveType] ?? "bg-fg-subtle";
  const label = LABELS[effectiveType] ?? effectiveType;
  const tooltip = TOOLTIPS[effectiveType];

  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap text-ui text-fg"
      title={tooltip}
    >
      {showDot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />}
      {label}
    </span>
  );
}
