import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchStreets } from "@/lib/nominatim";

interface Props {
  city: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Free-text street input with OSM/Nominatim suggestions (debounced 400ms). */
export function StreetAutocomplete({ city, value, onChange, placeholder, disabled }: Props) {
  const [query, setQuery] = useState(value);
  const [hits, setHits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (!city || query.trim().length < 2) { setHits([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchStreets(city, query, ctrl.signal);
        setHits(res);
      } catch { /* aborted */ }
      finally { setLoading(false); }
    }, 400);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [city, query]);

  return (
    <div className="relative">
      <Input
        value={query}
        disabled={disabled}
        placeholder={placeholder ?? (city ? "Wpisz nazwę ulicy" : "Najpierw wybierz miasto")}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="h-10 rounded-xl pr-9"
      />
      {loading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
      {open && hits.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-popover shadow-lg">
          {hits.map((h) => (
            <li key={h}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(h); setQuery(h); setOpen(false); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
              >{h}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
