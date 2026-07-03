import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Lang = "pl" | "en" | "uk";
const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
];

export function LanguageSwitcher() {
  const { user } = useAuth();
  const [lang, setLang] = useState<Lang>("pl");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (stored && LANGS.some((l) => l.code === stored)) setLang(stored);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  async function pick(code: Lang) {
    setLang(code);
    try { localStorage.setItem("lang", code); } catch { /* noop */ }
    if (user?.id) {
      await supabase.from("profiles").update({ preferred_language: code }).eq("id", user.id);
    }
  }

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-background/60 px-2 py-1.5 text-sm hover:bg-muted">
        <span className="text-base leading-none">{current.flag}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem] rounded-xl">
        {LANGS.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => pick(l.code)} className="rounded-lg">
            <span className="mr-2 text-base">{l.flag}</span> {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
