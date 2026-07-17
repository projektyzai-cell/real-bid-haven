import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** Property badge based on average from active property reviews. */
export function PropertyRatingBadge({ listingId }: { listingId: string }) {
  const { data } = useQuery({
    queryKey: ["listing-review-summary", listingId],
    queryFn: async () => {
      const { data } = await supabase.rpc("listing_review_summary" as never, { _listing_id: listingId } as never);
      const row = (data as any)?.[0];
      return { avg: row?.avg_overall ? Number(row.avg_overall) : null, total: row?.total ?? 0 };
    },
  });
  const total = data?.total ?? 0;
  const avg = data?.avg ?? null;
  if (total < 3 || avg == null) {
    return <span className="inline-flex items-center gap-1 rounded-full border border-[#1e293b] bg-[#0f172a]/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Nowość (zbieranie opinii)</span>;
  }
  const opinii = total === 1 ? "opinia" : total < 5 ? "opinie" : "opinii";
  if (avg > 8.0) {
    return <span className="inline-flex items-center gap-1 rounded-full border border-[#f59e0b]/50 bg-[#f59e0b]/10 px-2 py-0.5 text-[11px] font-bold text-[#f59e0b]">👑 {avg.toFixed(1)} ({total} {opinii})</span>;
  }
  if (avg >= 5.0) {
    return <span className="inline-flex items-center gap-1 rounded-full border border-[#1e293b] bg-[#0f172a]/60 px-2 py-0.5 text-[11px] font-bold text-foreground">🏠 {avg.toFixed(1)} ({total} {opinii})</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-400">⚠️ {avg.toFixed(1)} ({total} {opinii})</span>;
}

/** User-level badge (tenant/landlord). Shown only when >= 1 active review. */
export function UserRatingBadge({ userId, kind }: { userId: string; kind: "landlord" | "tenant" }) {
  const { data } = useQuery({
    queryKey: ["user-review-summary", userId, kind],
    queryFn: async () => {
      const { data } = await supabase.rpc("user_review_summary" as never, { _user_id: userId, _kind: kind } as never);
      const row = (data as any)?.[0];
      return { avg: row?.avg_overall ? Number(row.avg_overall) : null, total: row?.total ?? 0 };
    },
  });
  const total = data?.total ?? 0;
  const avg = data?.avg ?? null;
  if (total < 1 || avg == null) return null;
  const label = `Zweryfikowany użytkownik: średnia ocen ${avg.toFixed(2)}/10 na podstawie ${total} ${total === 1 ? "umowy" : "umów"} najmu`;
  const icon = avg >= 8.0 ? "🛡️" : "★";
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help items-center gap-1 rounded-full border border-[#f59e0b]/50 bg-[#f59e0b]/10 px-2 py-0.5 text-[11px] font-bold text-[#f59e0b]">
            {icon} {avg.toFixed(1)}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
