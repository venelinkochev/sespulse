// Reduce an address in any form ("a@x.com", "Name <A@X.com>",
// "\"Name\" <a@x.com>") to a bare lowercase key. Must match the
// sespulse_bare_address() SQL function in src/db/migrate.ts.
export function bareAddress(address: string): string {
  const inner = address.match(/<([^<>]+)>/)?.[1] ?? address;
  return inner.trim().toLowerCase();
}

export function recipientHref(address: string): string {
  return `/recipients/${encodeURIComponent(bareAddress(address))}`;
}
