import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertRole(
  ctx: { supabase: any; userId: string },
  roles: ("admin" | "passport_verifier")[] = ["admin"],
) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .in("role", roles as any);
  if (error || !data || data.length === 0) throw new Error("Forbidden");
}

/** ---------------- USER ACCOUNTS ---------------- */
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context as any, ["admin"]);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: authList, error: authErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authErr) throw new Error(authErr.message);

    const ids = authList.users.map((u) => u.id);
    const [{ data: profs }, { data: roles }, { data: reqs }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("*").in("id", ids),
        supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
        supabaseAdmin
          .from("rental_requests")
          .select("tenant_id, status, expires_at")
          .in("tenant_id", ids),
      ]);
    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });
    const reqMap = new Map<string, { active: number; past: number }>();
    const now = Date.now();
    (reqs ?? []).forEach((r: any) => {
      const cur = reqMap.get(r.tenant_id) ?? { active: 0, past: 0 };
      const isActive =
        r.status === "open" &&
        (!r.expires_at || new Date(r.expires_at).getTime() > now);
      if (isActive) cur.active += 1;
      else cur.past += 1;
      reqMap.set(r.tenant_id, cur);
    });

    return authList.users.map((u) => {
      const p: any = profMap.get(u.id) ?? {};
      const r = reqMap.get(u.id) ?? { active: 0, past: 0 };
      return {
        id: u.id,
        email: u.email ?? "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        display_name: p.display_name ?? null,
        passport_application_status: p.passport_application_status ?? null,
        passport_serial: p.passport_serial ?? null,
        trusted_tenant_score: p.trusted_tenant_score ?? 0,
        roles: roleMap.get(u.id) ?? [],
        active_requests: r.active,
        past_requests: r.past,
      };
    });
  });

export const adminGetUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context as any, ["admin"]);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const [{ data: authUser }, { data: profile }, { data: requests }, { data: roles }] =
      await Promise.all([
        supabaseAdmin.auth.admin.getUserById(data.userId),
        supabaseAdmin.from("profiles").select("*").eq("id", data.userId).maybeSingle(),
        supabaseAdmin
          .from("rental_requests")
          .select("*")
          .eq("tenant_id", data.userId)
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", data.userId),
      ]);
    return {
      auth: {
        email: authUser?.user?.email ?? null,
        created_at: authUser?.user?.created_at ?? null,
        last_sign_in_at: authUser?.user?.last_sign_in_at ?? null,
      },
      profile: profile ?? null,
      requests: requests ?? [],
      roles: (roles ?? []).map((r: any) => r.role),
    };
  });

/** ---------------- SUB-ADMINS ---------------- */
export const adminListStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context as any, ["admin"]);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "passport_verifier"] as any);
    const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
    if (ids.length === 0) return [];
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const auth = new Map((list?.users ?? []).map((u) => [u.id, u]));
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name")
      .in("id", ids);
    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    return ids.map((id) => {
      const u = auth.get(id);
      const p: any = profMap.get(id) ?? {};
      const r = (roles ?? []).filter((x: any) => x.user_id === id).map((x: any) => x.role);
      return {
        id,
        email: u?.email ?? "",
        display_name: p.display_name ?? null,
        created_at: u?.created_at ?? null,
        roles: r,
      };
    });
  });

export const adminCreateStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      display_name: z.string().min(1).max(80),
      role: z.enum(["admin", "passport_verifier"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context as any, ["admin"]);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Find or create
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    let userId = list?.users.find(
      (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
    )?.id;

    if (!userId) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { display_name: data.display_name },
      });
      if (error) throw new Error(error.message);
      userId = created.user!.id;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
        email_confirm: true,
      });
    }

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, display_name: data.display_name }, { onConflict: "id" });

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role } as any, {
        onConflict: "user_id,role",
      });
    if (roleErr) throw new Error(roleErr.message);

    return { id: userId, email: data.email };
  });

export const adminRevokeStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["admin", "passport_verifier"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context as any, ["admin"]);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    // Don't allow removing yourself as last admin
    if (data.role === "admin" && (context as any).userId === data.userId) {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) throw new Error("Nie możesz odebrać sobie roli ostatniego administratora.");
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** ---------------- MESSAGES (admin → user) ---------------- */
export const adminSendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      recipient_id: z.string().uuid().nullable(),
      subject: z.string().min(1).max(160),
      body: z.string().min(1).max(5000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context as any, ["admin"]);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin.from("admin_messages").insert({
      sender_id: (context as any).userId,
      recipient_id: data.recipient_id,
      subject: data.subject,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context as any, ["admin"]);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("admin_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** ---------------- USER-FACING: reset passport application ---------------- */
export const resetPassportApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    // Only allow reset when current application is approved (issued) or rejected
    const { data: cur } = await supabase
      .from("profiles")
      .select("passport_application_status")
      .eq("id", userId)
      .maybeSingle();
    if (!cur || cur.passport_application_status !== "approved") {
      throw new Error("Reset jest dostępny dopiero po wydaniu obecnego paszportu.");
    }
    // Keep identity hashes; clear application data. Status → draft.
    const { error } = await supabase
      .from("profiles")
      .update({
        passport_application_status: "draft",
        passport_application_submitted_at: null,
        identity_doc_urls: [],
        identity_doc_url: null,
        employment_contract_urls: [],
        employment_contract_url: null,
        bank_statement_urls: [],
        monthly_income_net: null,
        employer_name: null,
        employment_type: null,
        employment_contract_until: null,
        employment_contract_indefinite: false,
        income_verification_status: "pending",
        identity_verification_status: "pending",
        passport_name_verified: false,
        passport_income_verified: false,
        passport_contract_valid: false,
        passport_social_verified: false,
      })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
