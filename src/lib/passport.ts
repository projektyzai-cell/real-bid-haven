// Client-side hashing helpers for StaySafe Passport.
// Raw PESEL / document numbers never leave the browser — only SHA-256 hashes are stored.

async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input.trim().toLowerCase());
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizePesel(p: string): string {
  return p.replace(/\D/g, "");
}

export function isValidPesel(p: string): boolean {
  const n = normalizePesel(p);
  if (n.length !== 11) return false;
  const w = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const sum = w.reduce((a, x, i) => a + x * Number(n[i]), 0);
  const c = (10 - (sum % 10)) % 10;
  return c === Number(n[10]);
}

export async function peselHash(pesel: string): Promise<string> {
  return sha256("pesel:" + normalizePesel(pesel));
}

export async function documentHash(country: string, num: string): Promise<string> {
  return sha256(`doc:${country.toUpperCase()}:${num.replace(/\s+/g, "").toUpperCase()}`);
}

export async function identityComboHash(opts: {
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  secret: string; // pesel digits or "country:docnum"
}): Promise<string> {
  return sha256(
    `combo:${opts.firstName.trim().toLowerCase()}|${opts.lastName.trim().toLowerCase()}|${opts.dob}|${opts.secret.toLowerCase()}`,
  );
}
