// SES list price (us-east-1 etc.) is $0.10 per 1,000 outbound recipients.
// Override with SES_PRICE_PER_1000 if you're on a different rate or want
// to include a rough attachment-data estimate.

const DEFAULT_PRICE_PER_1000 = 0.1;

export function pricePerEmail(): number {
  const raw = process.env.SES_PRICE_PER_1000;
  const parsed = raw ? Number(raw) : NaN;
  const per1000 = Number.isFinite(parsed) ? parsed : DEFAULT_PRICE_PER_1000;
  return per1000 / 1000;
}

export function estimateCost(recipients: number): number {
  return recipients * pricePerEmail();
}

export function formatCost(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  if (usd < 1000) return `$${usd.toFixed(2)}`;
  return `$${usd.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
