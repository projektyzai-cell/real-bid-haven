import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles").select("role").eq("user_id", ctx.userId).eq("role", "admin");
  if (error || !data || data.length === 0) throw new Error("Forbidden");
}

export const adminListRentalListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: listings, error } = await supabaseAdmin
      .from("rental_listings")
      .select("id, landlord_id, title, city, district, rooms, monthly_price, promoted, status, expires_at, created_at, views_count")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const landlordIds = Array.from(new Set((listings ?? []).map((l) => l.landlord_id)));
    const ids = (listings ?? []).map((l) => l.id);
    const [{ data: profs }, { data: offers }] = await Promise.all([
      landlordIds.length
        ? supabaseAdmin.from("profiles").select("id, display_name, serial_num, account_type").in("id", landlordIds)
        : Promise.resolve({ data: [] as any[] }),
      ids.length
        ? supabaseAdmin.from("rental_offers").select("listing_id").in("listing_id", ids)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    const matchMap = new Map<string, number>();
    (offers ?? []).forEach((o: any) => {
      if (!o.listing_id) return;
      matchMap.set(o.listing_id, (matchMap.get(o.listing_id) ?? 0) + 1);
    });
    return (listings ?? []).map((l) => {
      const p: any = profMap.get(l.landlord_id) ?? {};
      return {
        ...l,
        landlord_name: p.display_name ?? null,
        landlord_serial: p.serial_num ?? null,
        landlord_account_type: p.account_type ?? null,
        matches_count: matchMap.get(l.id) ?? 0,
      };
    });
  });

export const adminDeleteRentalListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("rental_listings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetListingPromoted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), promoted: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("rental_listings").update({ promoted: data.promoted }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListRentalRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reqs, error } = await supabaseAdmin
      .from("rental_requests")
      .select("id, tenant_id, city, district, budget_max, min_rooms, is_student, status, expires_at, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const tenantIds = Array.from(new Set((reqs ?? []).map((r) => r.tenant_id)));
    const ids = (reqs ?? []).map((r) => r.id);
    const [{ data: profs }, { data: offers }] = await Promise.all([
      tenantIds.length
        ? supabaseAdmin.from("profiles").select("id, display_name, serial_num, account_type, passport_serial, passport_application_status, concierge_subscription").in("id", tenantIds)
        : Promise.resolve({ data: [] as any[] }),
      ids.length
        ? supabaseAdmin.from("rental_offers").select("request_id").in("request_id", ids)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    const matchMap = new Map<string, number>();
    (offers ?? []).forEach((o: any) => {
      matchMap.set(o.request_id, (matchMap.get(o.request_id) ?? 0) + 1);
    });
    return (reqs ?? []).map((r) => {
      const p: any = profMap.get(r.tenant_id) ?? {};
      return {
        ...r,
        tenant_name: p.display_name ?? null,
        tenant_serial: p.serial_num ?? null,
        tenant_account_type: p.account_type ?? null,
        passport_serial: p.passport_serial ?? null,
        passport_status: p.passport_application_status ?? null,
        concierge: !!p.concierge_subscription,
        matches_count: matchMap.get(r.id) ?? 0,
      };
    });
  });

export const adminDeleteRentalRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("rental_requests").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminResetUserPassport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabase } = context as any;
    const { error } = await supabase.rpc("admin_reset_passport_application", { _user_id: data.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
