import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  // Admins and passport_verifier sub-admins can access passport tooling.
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .in("role", ["admin", "passport_verifier"] as any);
  if (error || !data || data.length === 0) throw new Error("Forbidden: admin only");
}

/** Chronological list of submitted passport applications */
export const listPassportApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, passport_application_status, passport_application_submitted_at, passport_generated_at, passport_serial, passport_score, home_city, passport_city, monthly_income_net, employment_type")
      .in("passport_application_status", ["submitted", "approved"])
      .order("passport_application_submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPassportApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error } = await supabaseAdmin
      .from("profiles").select("*").eq("id", data.userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) throw new Error("Profile not found");

    const { data: history } = await supabaseAdmin
      .from("lease_history_entries").select("*").eq("user_id", data.userId)
      .order("date_from", { ascending: false });

    async function sign(paths: string[] | null | undefined) {
      if (!paths || paths.length === 0) return [];
      const out: { path: string; url: string }[] = [];
      for (const p of paths) {
        if (!p) continue;
        const { data: s } = await supabaseAdmin.storage
          .from("passport-docs").createSignedUrl(p, 60 * 60);
        if (s?.signedUrl) out.push({ path: p, url: s.signedUrl });
      }
      return out;
    }

    const p: any = profile;
    return {
      profile: p,
      history: history ?? [],
      docs: {
        identity: await sign(p.identity_doc_urls ?? (p.identity_doc_url ? [p.identity_doc_url] : [])),
        contracts: await sign(p.employment_contract_urls ?? (p.employment_contract_url ? [p.employment_contract_url] : [])),
        bank: await sign(p.bank_statement_urls ?? []),
      },
    };
  });

export const updateAdminVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      userId: z.string().uuid(),
      passport_name_verified: z.boolean().optional(),
      passport_income_verified: z.boolean().optional(),
      passport_contract_valid: z.boolean().optional(),
      passport_social_verified: z.boolean().optional(),
      passport_admin_notes: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId, ...patch } = data;
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const generateTenantPassport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      userId: z.string().uuid(),
      score: z.number().min(0).max(100),
      city: z.string().min(1).max(80),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cur } = await supabaseAdmin
      .from("profiles").select("passport_serial, passport_count").eq("id", data.userId).maybeSingle();
    let serial = (cur as any)?.passport_serial as string | null;
    const prevCount = Number((cur as any)?.passport_count ?? 0);
    if (!serial) {
      const { data: s } = await supabaseAdmin.rpc("gen_passport_serial");
      serial = (s as unknown as string) ?? null;
    }
    const now = new Date();
    const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const { error } = await supabaseAdmin.from("profiles").update({
      passport_application_status: "approved",
      passport_serial: serial,
      passport_score: data.score,
      passport_city: data.city,
      passport_issued_at: now.toISOString(),
      passport_expires_at: expires.toISOString(),
      passport_generated_at: now.toISOString(),
      passport_generated_by: ctx.userId,
      passport_count: prevCount + 1,
      passport_renewal_requested: false,
    }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { serial, issued_at: now.toISOString(), expires_at: expires.toISOString() };
  });

export const passportStatsRows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("display_name, passport_serial, passport_city, passport_generated_at, passport_issued_at, passport_expires_at, passport_score")
      .eq("passport_application_status", "approved")
      .order("passport_generated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
