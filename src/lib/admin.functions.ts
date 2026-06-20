import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_EMAIL = "daniel@staysafe.admin";
const ADMIN_PASSWORD = "Domanski";
const ADMIN_DISPLAY = "Daniel";

/**
 * Idempotent provisioning of the first administrator account.
 * - Creates auth user daniel@staysafe.admin / Domanski if missing
 * - Grants role = 'admin' in public.user_roles
 * Returns the login credentials so the UI can display them.
 */
export const provisionDanielAdmin = createServerFn({ method: "POST" }).handler(
  async () => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // 1. Try to find existing user with this email
    let userId: string | null = null;
    const { data: list, error: listErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) throw new Error(listErr.message);
    const existing = list.users.find(
      (u) => u.email?.toLowerCase() === ADMIN_EMAIL,
    );
    if (existing) {
      userId = existing.id;
      // Reset password to known value (idempotent provisioning)
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
    } else {
      const { data: created, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { display_name: ADMIN_DISPLAY },
        });
      if (createErr) throw new Error(createErr.message);
      userId = created.user!.id;
    }

    // 2. Ensure profile exists with admin display name
    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: userId!, display_name: ADMIN_DISPLAY },
        { onConflict: "id" },
      );

    // 3. Grant admin role (idempotent — unique (user_id, role))
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId!, role: "admin" },
        { onConflict: "user_id,role" },
      );
    if (roleErr) throw new Error(roleErr.message);

    return {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      display_name: ADMIN_DISPLAY,
    };
  },
);

/** Aggregated KPIs for admin dashboard */
export const getAdminStats = createServerFn({ method: "GET" }).handler(
  async () => {
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
  },
);

/** Recent profiles for moderation */
export const listRecentProfiles = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ limit: z.number().min(1).max(100).default(25) }).parse(d ?? {}))
  .handler(async ({ data }) => {
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
export const listDuplicateAlerts = createServerFn({ method: "GET" }).handler(
  async () => {
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
  },
);
