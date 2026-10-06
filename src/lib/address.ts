// Just the email from an address in any form: "a@x.com",
// "Name <A@X.com>", "\"Name\" <a@x.com>". Keeps the original casing; used
// for display and exports. The stored value keeps the display name, so
// searching by name still works.
export function emailOnly(address: string): string {
  const inner = address.match(/<([^<>]+)>/)?.[1] ?? address;
  return inner.trim();
}

// emailOnly(), lowercased: the key recipients are matched on. Must match
// the sespulse_bare_address() SQL function in src/db/migrate.ts.
export function bareAddress(address: string): string {
  return emailOnly(address).toLowerCase();
}

export function recipientHref(address: string): string {
  return `/recipients/${encodeURIComponent(bareAddress(address))}`;
}
