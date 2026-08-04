import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * TURA J — Flow B: powiadomienie SMS o nowej dopasowanej ofercie.
 * Wysyłane wyłącznie do najemców z opłaconą usługą Smart-Match SMS (9,99 zł).
 */
export const notifyMatchingTenants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ listingId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };

    const { data: listing, error } = await ctx.supabase
      .from("rental_listings")
      .select("id, landlord_id, title, city, monthly_price, rooms, accepts_pets, accepts_children, status")
      .eq("id", data.listingId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!listing || listing.landlord_id !== ctx.userId) throw new Error("Brak uprawnień do tej oferty.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendSms } = await import("@/lib/sms.server");

    const nowIso = new Date().toISOString();
    const { data: requests } = await supabaseAdmin
      .from("rental_requests")
      .select("id, tenant_id, city, budget_max, min_rooms, pets_caged, pets_other, has_children, sms_phone, sms_notifications, sms_paid_at, status, expires_at")
      .eq("status", "active")
      .not("sms_paid_at", "is", null)
      .gt("expires_at", nowIso);

    const l = listing as any;
    const matches = ((requests ?? []) as any[]).filter((r) => {
      if (!r.sms_notifications || !r.sms_phone) return false;
      if ((r.city ?? "").trim().toLowerCase() !== (l.city ?? "").trim().toLowerCase()) return false;
      if (r.budget_max != null && Number(l.monthly_price) > Number(r.budget_max)) return false;
      if (r.min_rooms != null && Number(l.rooms) < Number(r.min_rooms)) return false;
      if ((r.pets_caged || r.pets_other) && !l.accepts_pets) return false;
      if (r.has_children && !l.accepts_children) return false;
      return true;
    });

    let sent = 0;
    for (const r of matches) {
      const msg =
        `Stay Safe: nowa oferta pasujaca do Twojego zapytania - ${l.city}, ` +
        `${l.rooms} pok., ${Number(l.monthly_price).toFixed(0)} zl/mc. ` +
        `Zobacz w panelu Stay Safe.`;
      const res = await sendSms({
        phone: r.sms_phone,
        message: msg,
        kind: "smart_match",
        userId: r.tenant_id,
        targetId: l.id,
      });
      if (res.ok) {
        sent += 1;
        await supabaseAdmin
          .from("rental_requests")
          .update({ last_sms_sent_at: nowIso } as never)
          .eq("id", r.id);
      }
    }

    return { matched: matches.length, sent };
  });
