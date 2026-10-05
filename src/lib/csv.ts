// RFC 4180 CSV helpers.

// Spreadsheet apps treat cells starting with these as formulas. Subjects and
// addresses come from whoever sent or received the mail, so neutralize them
// with a leading apostrophe (shown as text in Excel / Sheets / Numbers).
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (typeof value === "string" && FORMULA_PREFIX.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(csvCell).join(",") + "\r\n";
}
