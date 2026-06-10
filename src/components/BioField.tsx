import { useMemo, useState } from "react";
import { Languages } from "lucide-react";
import { BIO_LANGS, type BioLang, translateToPl } from "@/lib/bio-translate";

export function BioField({
  value, lang, onChange,
}: {
  value: string;
  lang: BioLang;
  onChange: (v: { text: string; lang: BioLang; translated: string }) => void;
}) {
  const preview = useMemo(() => translateToPl(value, lang), [value, lang]);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Krótkie bio (poznaj wynajmującego)
          <span className="ml-2 text-xs font-normal text-muted-foreground">Tłumaczone na polski automatycznie</span>
        </label>
        <select
          value={lang}
          onChange={(e) => {
            const nl = e.target.value as BioLang;
            onChange({ text: value, lang: nl, translated: translateToPl(value, nl) });
          }}
          className="h-8 rounded-lg border bg-background px-2 text-xs"
        >
          {BIO_LANGS.map((l) => (
            <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
          ))}
        </select>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange({ text: e.target.value, lang, translated: translateToPl(e.target.value, lang) })}
        rows={4}
        maxLength={600}
        placeholder="Hi! I'm a 28yo software engineer with stable income, non-smoker, no pets, looking for a long-term apartment…"
        className="w-full rounded-xl border bg-background p-3 text-sm"
      />
      {lang !== "pl" && value.trim() && (
        <div className="rounded-xl border border-[var(--gold)]/30 bg-card/40 p-3 text-sm">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gold">
            <Languages className="h-3 w-3" /> Podgląd po polsku
          </div>
          <p className="whitespace-pre-line text-muted-foreground">{preview}</p>
        </div>
      )}
    </div>
  );
}

export function BioDisplay({
  original, originalLang, translated,
}: { original: string | null; originalLang: string | null; translated: string | null }) {
  const [showOriginal, setShowOriginal] = useState(false);
  if (!original?.trim() && !translated?.trim()) return null;
  const lang = (originalLang ?? "pl") as BioLang;
  const flag = BIO_LANGS.find((l) => l.code === lang)?.flag ?? "🌐";
  const hasTranslation = lang !== "pl" && !!translated?.trim();
  return (
    <div className="rounded-2xl border border-[var(--gold)]/30 bg-card/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
          <Languages className="h-3.5 w-3.5" /> Bio najemcy {flag}
        </div>
        {hasTranslation && (
          <button
            type="button"
            onClick={() => setShowOriginal((v) => !v)}
            className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            {showOriginal ? "Pokaż polskie" : "Pokaż oryginał"}
          </button>
        )}
      </div>
      <p className="whitespace-pre-line text-sm">
        {showOriginal || !hasTranslation ? original : translated}
      </p>
    </div>
  );
}
