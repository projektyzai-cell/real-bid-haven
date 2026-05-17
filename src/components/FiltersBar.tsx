import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortKey = "newest" | "price_asc" | "price_desc" | "popular" | "ending";

export interface Filters {
  city: string;
  priceMin: string;
  priceMax: string;
  areaMin: string;
  areaMax: string;
  sort: SortKey;
}

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

export function FiltersBar({ value, onChange }: Props) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="sticky top-16 z-40 -mx-4 mb-8 border-b border-border/50 bg-background/80 px-4 py-4 backdrop-blur-xl">
      <div className="container mx-auto grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Miejscowość"
            value={value.city}
            onChange={(e) => set("city", e.target.value)}
            className="rounded-xl pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Cena min"
            value={value.priceMin}
            onChange={(e) => set("priceMin", e.target.value)}
            className="rounded-xl"
          />
          <Input
            type="number"
            placeholder="Cena max"
            value={value.priceMax}
            onChange={(e) => set("priceMax", e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="m² min"
            value={value.areaMin}
            onChange={(e) => set("areaMin", e.target.value)}
            className="rounded-xl"
          />
          <Input
            type="number"
            placeholder="m² max"
            value={value.areaMax}
            onChange={(e) => set("areaMax", e.target.value)}
            className="rounded-xl"
          />
        </div>
        <Select value={value.sort} onValueChange={(v) => set("sort", v as SortKey)}>
          <SelectTrigger className="rounded-xl lg:col-span-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Najnowsze</SelectItem>
            <SelectItem value="price_asc">Cena: rosnąco</SelectItem>
            <SelectItem value="price_desc">Cena: malejąco</SelectItem>
            <SelectItem value="popular">Popularność</SelectItem>
            <SelectItem value="ending">Kończące się</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
