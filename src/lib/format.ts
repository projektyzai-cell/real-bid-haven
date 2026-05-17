export function formatPLN(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function maskName(name: string | null | undefined): string {
  if (!name) return "Anonim";
  const trimmed = name.trim();
  if (!trimmed) return "Anonim";
  const parts = trimmed.split(/\s+/);
  const mask = (s: string) =>
    s.length <= 2 ? s[0] + "*" : s[0] + "***" + s[s.length - 1];
  return parts.map(mask).join(" ");
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  ended: boolean;
  urgent: boolean; // < 24h
}

export function getCountdown(endsAt: string | Date): CountdownParts {
  const end = typeof endsAt === "string" ? new Date(endsAt) : endsAt;
  const totalMs = end.getTime() - Date.now();
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, ended: true, urgent: false };
  }
  const days = Math.floor(totalMs / 86_400_000);
  const hours = Math.floor((totalMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);
  return { days, hours, minutes, seconds, totalMs, ended: false, urgent: totalMs < 86_400_000 };
}
