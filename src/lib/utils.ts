import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize a filename for safe storage upload:
 * - Strip Polish diacritics and any non-ASCII
 * - Replace whitespace and unsafe chars with "-"
 * - Lowercase, collapse repeats, preserve extension
 * - Hard-limit length to 80 chars (without extension)
 */
export function sanitizeFilename(name: string): string {
  if (!name) return "file";
  const dot = name.lastIndexOf(".");
  const rawBase = dot > 0 ? name.slice(0, dot) : name;
  const rawExt = dot > 0 ? name.slice(dot + 1) : "";
  const fold = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l").replace(/Ł/g, "L")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "")
      .toLowerCase();
  const base = fold(rawBase).slice(0, 80) || "file";
  const ext = fold(rawExt).slice(0, 10);
  return ext ? `${base}.${ext}` : base;
}
