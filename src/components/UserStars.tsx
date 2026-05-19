import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  className?: string;
}

export function UserStars({ userId, className }: Props) {
  const { data: count = 0 } = useQuery({
    queryKey: ["user-stars", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bids")
        .select("id", { count: "exact", head: true })
        .eq("bidder_id", userId)
        .eq("status", "accepted");
      if (error) return 0;
      return count ?? 0;
    },
  });
  if (!count) return null;
  const shown = Math.min(count, 5);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 align-middle", className)}
      title={`${count} wygranych aukcji`}
      aria-label={`${count} wygranych aukcji`}
    >
      {Array.from({ length: shown }).map((_, i) => (
        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
      ))}
      {count > 5 && (
        <span className="ml-0.5 text-[10px] font-medium text-amber-500">+{count - 5}</span>
      )}
    </span>
  );
}
