// The pulse mark, same artwork as brand/icon.svg.
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" className="fill-accent" />
      <path
        d="M4.5 17h6l2.5-7.5 5 14 2.5-8.5 1.5 2h5.5"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">
        SES<span className="text-fg-muted">Pulse</span>
      </span>
    </div>
  );
}
