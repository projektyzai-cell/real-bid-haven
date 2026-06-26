import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

interface City { id: string; name: string; voivodeship: string | null; }
interface District { id: string; name: string; city_id: string; }
interface Street { id: string; name: string; city_id: string; district_id: string | null; }

export interface LocationValue {
  city: string;          // nazwa
  district: string;      // nazwa, opcjonalna
  street: string;        // nazwa, opcjonalna (z możliwością wpisania ręcznego)
}

interface Props {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  required?: boolean;
  /** Which fields to render. Default = all three. */
  fields?: Array<"city" | "district" | "street">;
  /** Make street selection strict (no free-text fallback). */
  strictStreet?: boolean;
}

/**
 * Kaskadowy picker Miasto → Dzielnica → Ulica.
 * - dane czytane z public.cities/districts/streets
 * - "Ulica" pozwala wpisać własną wartość, jeśli nie ma jej w słowniku
 */
export function LocationPicker({ value, onChange, required, fields, strictStreet }: Props) {
  const show = (f: "city" | "district" | "street") => !fields || fields.includes(f);
  const cols = fields ? fields.length : 3;
  const { data: cities } = useQuery({
    queryKey: ["loc-cities"],
    queryFn: async (): Promise<City[]> => {
      const { data, error } = await supabase.from("cities" as never).select("id, name, voivodeship").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as City[];
    },
    staleTime: 5 * 60_000,
  });

  const selectedCity = useMemo(
    () => cities?.find((c) => c.name.toLowerCase() === value.city.toLowerCase()),
    [cities, value.city],
  );

  const { data: districts } = useQuery({
    queryKey: ["loc-districts", selectedCity?.id],
    enabled: !!selectedCity?.id,
    queryFn: async (): Promise<District[]> => {
      const { data, error } = await supabase.from("districts" as never)
        .select("id, name, city_id").eq("city_id", selectedCity!.id).order("name");
      if (error) throw error;
      return (data ?? []) as unknown as District[];
    },
    staleTime: 5 * 60_000,
  });

  const { data: streets } = useQuery({
    queryKey: ["loc-streets", selectedCity?.id],
    enabled: !!selectedCity?.id,
    queryFn: async (): Promise<Street[]> => {
      const { data, error } = await supabase.from("streets" as never)
        .select("id, name, city_id, district_id").eq("city_id", selectedCity!.id).order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Street[];
    },
    staleTime: 5 * 60_000,
  });

  // Jeżeli zmienimy miasto, czyścimy dzielnicę i ulicę.
  useEffect(() => {
    if (!selectedCity) return;
    if (value.district && !districts?.some((d) => d.name === value.district)) {
      onChange({ ...value, district: "" });
    }
    // ulicę zostawiamy — pozwalamy wpisać ręcznie
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity?.id, districts]);

  const gridCls = cols === 1 ? "grid gap-3" : cols === 2 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-3";
  return (
    <div className={gridCls}>
      {show("city") && (
        <Picker
          label="Miasto"
          required={required}
          value={value.city}
          placeholder="Wybierz miasto"
          options={(cities ?? []).map((c) => ({ value: c.name, label: c.name, hint: c.voivodeship ?? undefined }))}
          onPick={(v) => onChange({ city: v, district: "", street: "" })}
        />
      )}

      {show("district") && (
        <Picker
          label="Dzielnica"
          value={value.district}
          placeholder={selectedCity ? "Wybierz dzielnicę" : "Najpierw miasto"}
          disabled={!selectedCity}
          options={(districts ?? []).map((d) => ({ value: d.name, label: d.name }))}
          onPick={(v) => onChange({ ...value, district: v })}
          allowClear
        />
      )}

      {show("street") && (
        <Picker
          label="Ulica"
          value={value.street}
          placeholder={selectedCity ? (strictStreet ? "Wybierz z listy" : "Wpisz lub wybierz") : "Najpierw miasto"}
          disabled={!selectedCity}
          options={(streets ?? [])
            .filter((s) => !value.district || !s.district_id || districts?.find((d) => d.id === s.district_id)?.name === value.district)
            .map((s) => ({ value: s.name, label: s.name }))}
          onPick={(v) => onChange({ ...value, street: v })}
          allowCustom={!strictStreet}
          allowClear
        />
      )}
    </div>
  );
}

interface PickerProps {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string; hint?: string }>;
  onPick: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
  allowCustom?: boolean;
  allowClear?: boolean;
}

function Picker({ label, value, placeholder, options, onPick, disabled, required, allowCustom, allowClear }: PickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" disabled={disabled}
            className={cn("h-10 w-full justify-between rounded-xl font-normal", !value && "text-muted-foreground")}>
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={!allowCustom}>
            <CommandInput
              placeholder={`Szukaj…`}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {allowCustom && query.trim() ? (
                  <button type="button"
                    className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent rounded"
                    onClick={() => { onPick(query.trim()); setQuery(""); setOpen(false); }}>
                    Użyj: <strong>{query.trim()}</strong>
                  </button>
                ) : "Brak wyników."}
              </CommandEmpty>
              <CommandGroup>
                {allowClear && value && (
                  <CommandItem value="__clear" onSelect={() => { onPick(""); setOpen(false); }}>
                    <span className="text-muted-foreground">Wyczyść</span>
                  </CommandItem>
                )}
                {options
                  .filter((o) => !allowCustom || o.label.toLowerCase().includes(query.toLowerCase()))
                  .map((o) => (
                  <CommandItem key={o.value} value={o.label} onSelect={() => {
                    onPick(o.value); setQuery(""); setOpen(false);
                  }}>
                    <Check className={cn("mr-2 h-4 w-4", o.value === value ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1">{o.label}</span>
                    {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
                  </CommandItem>
                ))}
                {allowCustom && query.trim() && !options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase()) && (
                  <CommandItem value={`__custom__${query}`}
                    onSelect={() => { onPick(query.trim()); setQuery(""); setOpen(false); }}>
                    <span className="text-muted-foreground">Użyj: </span>
                    <strong className="ml-1">{query.trim()}</strong>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
