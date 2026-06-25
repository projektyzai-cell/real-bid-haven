import { useEffect, useState } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchStreets } from "@/lib/nominatim";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  city: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** When true, value is considered valid only if explicitly picked from the list. */
  requireSelection?: boolean;
}

/**
 * Street input with combined suggestions: first our seeded DB list for the city,
 * then OSM/Nominatim. If `requireSelection` is true, the value is only treated
 * as valid (green check) when the user picked from the list — otherwise a small
 * warning is shown.
 */
export function StreetAutocomplete({ city, value, onChange, placeholder, disabled, requireSelection }: Props) {
  const [query, setQuery] = useState(value);
  const [hits, setHits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(!!value); // assume any pre-filled value was confirmed

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (!city || query.trim().length < 2) { setHits([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        // 1) Local DB (curated list)
        const { data: cityRow } = await supabase
          .from("cities").select("id").ilike("name", city).maybeSingle();
        let local: string[] = [];
        if (cityRow?.id) {
          const { data: rows } = await supabase
            .from("streets")
            .select("name")
            .eq("city_id", cityRow.id)
            .ilike("name", `%${query}%`)
            .limit(8);
          local = (rows ?? []).map((r: { name: string }) => r.name);
        }
        // 2) OSM fallback
        const osm = await searchStreets(city, query, ctrl.signal);
        const merged = Array.from(new Set([...local, ...osm])).slice(0, 12);
        setHits(merged);
      } catch { /* aborted */ }
      finally { setLoading(false); }
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [city, query]);

  const showWarn = requireSelection && query.trim().length >= 2 && !picked;

  return (
    <div className="relative">
      <Input
        value={query}
        disabled={disabled}
        placeholder={placeholder ?? (city ? "Wpisz nazwę ulicy i wybierz z listy" : "Najpierw wybierz miasto")}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setPicked(false);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`h-10 rounded-xl pr-9 ${showWarn ? "border-amber-500/60" : picked && query ? "border-emerald-500/50" : ""}`}
      />
      {loading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
      {!loading && picked && query && <Check className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />}
      {!loading && showWarn && <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-amber-500" />}
      {open && hits.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-popover shadow-lg">
          {hits.map((h) => (
            <li key={h}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(h); setQuery(h); setPicked(true); setOpen(false); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
              >{h}</button>
            </li>
          ))}
        </ul>
      )}
      {showWarn && (
        <p className="mt-1 text-[11px] text-amber-500">
          Wybierz ulicę z listy podpowiedzi, aby system mógł dokładnie zlokalizować adres.
        </p>
      )}
    </div>
  );
}
