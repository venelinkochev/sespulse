"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Minimal 16px line icons, drawn for this app (no icon dependency).
const ICONS: Record<string, React.ReactNode> = {
  overview: <path d="M2.5 13.5h11M4 11V8M7 11V4.5M10 11V6.5M13 11V9" />,
  domains: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M2.5 8h11M8 2.5c1.6 1.6 2.3 3.4 2.3 5.5S9.6 11.9 8 13.5M8 2.5C6.4 4.1 5.7 5.9 5.7 8s.7 3.9 2.3 5.5" />
    </>
  ),
  logs: <path d="M3 4h10M3 8h10M3 12h6" />,
  recipients: (
    <>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 13.5c.6-2.3 2.6-3.8 5-3.8s4.4 1.5 5 3.8" />
    </>
  ),
};

const ITEMS = [
  { href: "/", label: "Overview", icon: "overview" },
  { href: "/domains", label: "Domains", icon: "domains" },
  { href: "/logs", label: "Email Logs", icon: "logs" },
  { href: "/recipients", label: "Recipients", icon: "recipients" },
];

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="flex gap-1 md:flex-col">
      {ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-2.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors ${
              active
                ? "bg-bg-hover text-fg"
                : "text-fg-muted hover:bg-bg-hover/60 hover:text-fg"
            }`}
          >
            <svg
              viewBox="0 0 16 16"
              className={`h-4 w-4 shrink-0 ${active ? "text-accent" : "text-fg-subtle group-hover:text-fg-muted"}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {ICONS[item.icon]}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
