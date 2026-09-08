// Client-side validation helpers for StaySafe Passport.
// Identity numbers are never hashed or stored in the browser — the server
// computes peppered HMAC digests (see src/lib/identity.functions.ts).

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
