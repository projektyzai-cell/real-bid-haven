import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .in("role", ["admin", "passport_verifier"] as any);
  if (error || !data || data.length === 0) throw new Error("Forbidden: admin only");
}

async function assertSuperAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles").select("role").eq("user_id", ctx.userId).eq("role", "admin");
  if (error || !data || data.length === 0) throw new Error("Forbidden: admin only");
}

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

    const { count: completedRentals } = await supabaseAdmin
      .from("lease_transactions")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", data.userId)
      .eq("state", "completed");

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
      completedRentals: completedRentals ?? 0,
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
      passport_facebook_verified: z.boolean().optional(),
      passport_instagram_verified: z.boolean().optional(),
      passport_linkedin_verified: z.boolean().optional(),
      passport_admin_notes: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId, ...patch } = data;
    // Mirror aggregate social flag from individual channels for backwards compat.
    if (
      patch.passport_facebook_verified !== undefined ||
      patch.passport_instagram_verified !== undefined ||
      patch.passport_linkedin_verified !== undefined
    ) {
      const { data: cur } = await supabaseAdmin.from("profiles")
        .select("passport_facebook_verified, passport_instagram_verified, passport_linkedin_verified")
        .eq("id", userId).maybeSingle();
      const fb = patch.passport_facebook_verified ?? (cur as any)?.passport_facebook_verified ?? false;
      const ig = patch.passport_instagram_verified ?? (cur as any)?.passport_instagram_verified ?? false;
      const li = patch.passport_linkedin_verified ?? (cur as any)?.passport_linkedin_verified ?? false;
      (patch as any).passport_social_verified = fb || ig || li;
    }
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
      .from("profiles")
      .select("passport_serial, passport_count, identity_doc_urls, identity_doc_url, employment_contract_urls, employment_contract_url, bank_statement_urls")
      .eq("id", data.userId).maybeSingle();
    let serial = (cur as any)?.passport_serial as string | null;
    const prevCount = Number((cur as any)?.passport_count ?? 0);
    if (!serial) {
      const { data: s } = await supabaseAdmin.rpc("gen_passport_serial");
      serial = (s as unknown as string) ?? null;
    }
    const now = new Date();
    // Passport validity: 90 days from issuance.
    const expires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
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
      // Post-generation: wipe URL columns so renewal requires re-uploading fresh docs.
      identity_doc_urls: [],
      identity_doc_url: null,
      employment_contract_urls: [],
      employment_contract_url: null,
      bank_statement_urls: [],
    }).eq("id", data.userId);
    if (error) throw new Error(error.message);

    // Best-effort delete of uploaded source documents from storage.
    try {
      const p: any = cur ?? {};
      const paths: string[] = [
        ...(Array.isArray(p.identity_doc_urls) ? p.identity_doc_urls : []),
        ...(p.identity_doc_url ? [p.identity_doc_url] : []),
        ...(Array.isArray(p.employment_contract_urls) ? p.employment_contract_urls : []),
        ...(p.employment_contract_url ? [p.employment_contract_url] : []),
        ...(Array.isArray(p.bank_statement_urls) ? p.bank_statement_urls : []),
      ].filter(Boolean);
      if (paths.length > 0) {
        await supabaseAdmin.storage.from("passport-docs").remove(paths);
      }
    } catch (e) {
      console.warn("passport-docs cleanup failed", e);
    }

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

// -------- Trust score weights (admin-managed silnik) --------

export const getTrustScoreWeights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("trust_score_weights" as any)
      .select("*").eq("singleton", true).maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
  });

const weightsSchema = z.object({
  identity: z.number(),
  income_low: z.number(),
  income_mid: z.number(),
  income_high: z.number(),
  deposit: z.number(),
  guarantor: z.number(),
  occasional_lease: z.number(),
  tenant_insurance: z.number(),
  student: z.number(),
  facebook: z.number(),
  instagram: z.number(),
  linkedin: z.number(),
  external_history_first: z.number(),
  external_history_next: z.number(),
  external_history_reference: z.number(),
  external_history_scan: z.number(),
  staysafe_first_rental: z.number(),
  staysafe_second_rental: z.number(),
  finance_cap: z.number(),
  social_cap: z.number(),
  history_cap: z.number(),
  staysafe_cap: z.number(),
  global_cap: z.number(),
  cap_no_staysafe: z.number(),
}).partial();

export const updateTrustScoreWeights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => weightsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = { ...data, updated_at: new Date().toISOString(), updated_by: (context as any).userId };
    const { error } = await supabaseAdmin
      .from("trust_score_weights" as any)
      .update(patch).eq("singleton", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Admin unlocks (or re-locks) the anonymized identity section of a tenant profile,
 * so the user can edit name / date of birth / PESEL / document data once.
 */
export const setIdentityChangeAllowed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), allowed: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ identity_change_allowed: data.allowed } as any)
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
