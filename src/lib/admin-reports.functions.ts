import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles").select("role").eq("user_id", ctx.userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Brak uprawnień administratora");
}

export const adminListReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      status: z.enum(["all", "new", "in_progress", "resolved", "rejected"]).default("all"),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    await requireAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Join reporter display names
    const ids = Array.from(new Set((rows ?? []).map((r: any) => r.reporter_id)));
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, display_name").in("id", ids)
      : { data: [] as any[] };
    const map = new Map((profiles ?? []).map((p: any) => [p.id, p.display_name]));
    return (rows ?? []).map((r: any) => ({ ...r, reporter_name: map.get(r.reporter_id) ?? "—" }));
  });

export const adminUpdateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "in_progress", "resolved", "rejected"]),
      admin_note: z.string().max(4000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    await requireAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = { status: data.status };
    if (data.admin_note !== undefined) patch.admin_note = data.admin_note;
    if (data.status === "resolved" || data.status === "rejected") {
      patch.resolved_by = ctx.userId;
      patch.resolved_at = new Date().toISOString();
    } else {
      patch.resolved_by = null;
      patch.resolved_at = null;
    }
    const { error } = await supabaseAdmin.from("reports").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminHideReportedTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      target_type: z.enum(["rental_listing", "rental_request", "property"]),
      target_id: z.string().uuid(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    await requireAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.target_type === "rental_listing"
      ? "rental_listings"
      : data.target_type === "rental_request"
      ? "rental_requests"
      : "properties";
    const { error } = await supabaseAdmin
      .from(table as any)
      .update({ status: "hidden" as any })
      .eq("id", data.target_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    await requireAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("reports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
