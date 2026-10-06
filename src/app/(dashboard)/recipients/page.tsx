import Link from "next/link";
import {
  getProblemRecipients,
  searchRecipients,
  type Range,
} from "@/lib/queries";
import { RangeTabs } from "@/components/RangeTabs";
import { PageHeader, SectionTitle } from "@/components/PageHeader";
import { timeAgo } from "@/lib/time";
import { recipientHref } from "@/lib/address";

export const dynamic = "force-dynamic";

function parseRange(v: string | string[] | undefined): Range {
  const s = Array.isArray(v) ? v[0] : v;
  return s === "24h" || s === "7d" || s === "30d" ? s : "7d";
}

function strOrNull(v: string | string[] | undefined): string | null {
  if (!v) return null;
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s.trim() : null;
}

const fmt = (n: number) => n.toLocaleString();

export default async function RecipientsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const q = strOrNull(sp.q);

  const [matches, problems] = await Promise.all([
    q ? searchRecipients(q) : Promise.resolve(null),
    getProblemRecipients(range),
  ]);

  return (
    <>
      <PageHeader
        title="Recipients"
        description="Look up everything sent to an address, or review the ones that are hurting your reputation."
      />

      <form method="GET" className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-80">
          <svg viewBox="0 0 16 16" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Find a recipient address"
            className="input w-full pl-8"
          />
        </div>
        <input type="hidden" name="range" value={range} />
        <button type="submit" className="btn">
          Search
        </button>
        {q && (
          <Link href={`/recipients?range=${range}`} className="px-1 text-xs text-fg-subtle hover:text-fg">
            Clear
          </Link>
        )}
      </form>

      {matches && (
        <section>
          <SectionTitle description={`${matches.length === 50 ? "First 50" : matches.length} match${matches.length === 1 ? "" : "es"} for “${q}”`}>
            Search results
          </SectionTitle>
          <div className="card overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th className="!text-right">Messages</th>
                  <th className="!text-right">Last sent</th>
                </tr>
              </thead>
              <tbody>
                {matches.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-fg-muted">
                      No recipients match “{q}”.
                    </td>
                  </tr>
                )}
                {matches.map((r) => (
                  <tr key={r.address}>
                    <td className="font-mono text-xs">
                      <Link href={recipientHref(r.address)} className="text-fg hover:text-accent">
                        {r.address}
                      </Link>
                    </td>
                    <td className="text-right font-mono text-[13px]">{fmt(r.messages)}</td>
                    <td className="whitespace-nowrap text-right font-mono text-xs text-fg-subtle">
                      {timeAgo(r.lastSentAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <SectionTitle
          description="Addresses that bounced or complained, complaints and hard bounces first. Keep mailing these and your SES reputation suffers."
          actions={<RangeTabs current={range} basePath="/recipients" />}
        >
          Problem recipients
        </SectionTitle>
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Sent from</th>
                <th className="!text-right" title="Spam complaints">Compl.</th>
                <th className="!text-right">Hard</th>
                <th className="!text-right">Soft</th>
                <th>Last reason</th>
                <th className="!text-right">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {problems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-fg-muted">
                    No bounces or complaints in this range.
                  </td>
                </tr>
              )}
              {problems.map((r) => (
                <tr key={r.address}>
                  <td className="font-mono text-xs">
                    <Link href={recipientHref(r.address)} className="text-fg hover:text-accent">
                      {r.address}
                    </Link>
                  </td>
                  <td className="text-xs">
                    <SendingDomains domains={r.fromDomains} address={r.address} />
                  </td>
                  <Count n={r.complaints} tone="text-accent-red" />
                  <Count n={r.hardBounces} tone="text-accent-red" />
                  <Count n={r.softBounces} tone="text-accent-yellow" />
                  <td
                    className="max-w-[18rem] truncate font-mono text-2xs text-fg-subtle"
                    title={r.lastDiagnostic ?? undefined}
                  >
                    {r.lastDiagnostic ?? "—"}
                  </td>
                  <td className="whitespace-nowrap text-right font-mono text-xs text-fg-subtle">
                    {timeAgo(r.lastAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Count({ n, tone }: { n: number; tone: string }) {
  return (
    <td className={`text-right font-mono text-[13px] ${n > 0 ? tone : "text-fg-subtle/60"}`}>
      {n > 0 ? n.toLocaleString() : "·"}
    </td>
  );
}

// Which project(s) the bounces/complaints came from. Each domain links to
// the logs for this address from that domain. Shows two, then "+N".
function SendingDomains({
  domains,
  address,
}: {
  domains: string[];
  address: string;
}) {
  const shown = domains.slice(0, 2);
  const hidden = domains.length - shown.length;
  return (
    <div className="flex flex-col items-start gap-0.5" title={domains.join("\n")}>
      {shown.map((d) => (
        <Link
          key={d}
          href={`/logs?${new URLSearchParams({ domain: d, q: address })}`}
          className="whitespace-nowrap text-fg-muted hover:text-accent"
        >
          {d}
        </Link>
      ))}
      {hidden > 0 && <span className="text-2xs text-fg-subtle">+{hidden} more</span>}
    </div>
  );
}
