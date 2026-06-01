import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface Props {
  propertyId: string;
  variant?: "icon" | "button";
  className?: string;
}

export function FavoriteButton({ propertyId, variant = "icon", className }: Props) {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) { setActive(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("favorites" as never).select("id")
        .eq("user_id", user.id).eq("property_id", propertyId).maybeSingle();
      if (!cancelled) setActive(!!data);
    })();
    return () => { cancelled = true; };
  }, [user, propertyId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Zaloguj się, aby obserwować ogłoszenia"); return; }
    setBusy(true);
    if (active) {
      const { error } = await supabase.from("favorites" as never)
        .delete().eq("user_id", user.id).eq("property_id", propertyId);
      if (error) toast.error(error.message);
      else { setActive(false); toast.success("Usunięto z polubionych"); }
    } else {
      const { error } = await supabase.from("favorites" as never)
        .insert({ user_id: user.id, property_id: propertyId } as never);
      if (error) toast.error(error.message);
      else { setActive(true); toast.success("Dodano do polubionych"); }
    }
    setBusy(false);
  }

  if (variant === "button") {
    return (
      <button type="button" onClick={toggle} disabled={busy}
        className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition hover:bg-muted",
          active && "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-500/10", className)}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4", active && "fill-current")} />}
        {active ? "Polubione" : "Obserwuj"}
      </button>
    );
  }

  return (
    <button type="button" onClick={toggle} disabled={busy}
      aria-label={active ? "Usuń z polubionych" : "Dodaj do polubionych"}
      className={cn("grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow backdrop-blur transition hover:scale-105",
        active && "text-rose-600", className)}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4", active && "fill-current")} />}
    </button>
  );
}
