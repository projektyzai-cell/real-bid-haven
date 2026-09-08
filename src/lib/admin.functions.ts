import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .in("role", ["admin"] as any);
  if (error || !data || data.length === 0) throw new Error("Forbidden");
}

/** Aggregated KPIs for admin dashboard */
export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const tables = [
      "profiles",
      "rental_listings",
      "rental_requests",
      "rental_offers",
      "lease_transactions",
      "lease_ratings",
    ] as const;
    const counts: Record<string, number> = {};
    for (const t of tables) {
      const { count } = await supabaseAdmin
        .from(t)
        .select("*", { count: "exact", head: true });
      counts[t] = count ?? 0;
    }
    return counts;
  });

/** Recent profiles for moderation */
export const listRecentProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ limit: z.number().min(1).max(100).default(25) }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, display_name, trusted_tenant_score, passport_serial, passport_expires_at, verified_identity, verified_linkedin, verified_income, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Duplicate-account heuristic: profiles sharing the same display_name */
export const listDuplicateAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, created_at");
    if (error) throw new Error(error.message);
    const groups = new Map<string, typeof data>();
    for (const p of data ?? []) {
      const key = (p.display_name ?? "").trim().toLowerCase();
      if (!key) continue;
      const arr = groups.get(key) ?? [];
      arr.push(p);
      groups.set(key, arr);
    }
    return Array.from(groups.entries())
      .filter(([, arr]) => arr.length > 1)
      .map(([name, arr]) => ({ name, accounts: arr }));
  });
