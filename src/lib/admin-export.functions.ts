import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .in("role", ["admin", "passport_verifier"] as any);
  if (error || !data || data.length === 0) throw new Error("Forbidden");
}

/** Wszystkie transakcje najmu (auto-matche) w systemie — widok globalny dla admina. */
export const adminListAllTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("lease_transactions")
      .select(
        "id, state, tenant_id, landlord_id, tenant_finalized_at, landlord_finalized_at, contract_start_date, contract_end_date, created_at, archived_at, listing_id, rental_listings(city, street, property_type, title)",
      )
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

const DATASETS = [
  "passport_applications",
  "users_tenants",
  "users_landlords",
  "maintenance_reports",
  "concierge_leads",
  "rental_listings",
  "rental_requests",
  "auto_matches",
  "reviews",
  "payments",
] as const;

export type ExportDataset = (typeof DATASETS)[number];

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(";")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(";"));
  return "\uFEFF" + lines.join("\n");
}

/** Eksport CSV danych z dowolnej zakładki panelu admina. */
export const adminExportCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ dataset: z.enum(DATASETS) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    await assertAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ds = data.dataset;
    let rows: Record<string, unknown>[] = [];

    if (ds === "passport_applications") {
      const { data: r } = await supabaseAdmin
        .from("profiles")
        .select(
          "id, display_name, serial_num, passport_application_status, passport_application_submitted_at, passport_serial, passport_issued_at, passport_expires_at, passport_score, trusted_tenant_score, verified_identity, verified_income, verified_employer, verified_linkedin, verified_facebook, verified_instagram, staysafe_completed_rentals_count, created_at",
        )
        .not("passport_application_status", "is", null)
        .order("passport_application_submitted_at", { ascending: false });
      rows = (r ?? []) as any[];
    } else if (ds === "users_tenants" || ds === "users_landlords") {
      const wanted = ds === "users_tenants" ? "tenant" : "landlord";
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select(
          "id, display_name, account_type, serial_num, home_city, passport_serial, trusted_tenant_score, concierge_subscription, concierge_subscription_until, preferred_language, created_at",
        );
      const { data: listings } = await supabaseAdmin
        .from("rental_listings")
        .select("landlord_id");
      const { data: reqs } = await supabaseAdmin
        .from("rental_requests")
        .select("tenant_id");
      const landlordIds = new Set((listings ?? []).map((l: any) => l.landlord_id));
      const tenantIds = new Set((reqs ?? []).map((r: any) => r.tenant_id));
      const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const emails = new Map((authList?.users ?? []).map((u) => [u.id, u.email ?? ""]));
      rows = (profs ?? [])
        .filter((p: any) => {
          if (wanted === "landlord") return p.account_type === "landlord" || landlordIds.has(p.id);
          return p.account_type === "tenant" || tenantIds.has(p.id) || (!landlordIds.has(p.id) && p.account_type !== "landlord");
        })
        .map((p: any) => ({ ...p, email: emails.get(p.id) ?? "" }));
    } else if (ds === "maintenance_reports") {
      const { data: r } = await supabaseAdmin
        .from("maintenance_reports")
        .select(
          "id, created_at, category, title, description, urgency, status, tenant_id, landlord_id, contractor_id, listing_id, acknowledged_at, resolved_at",
        )
        .order("created_at", { ascending: false });
      rows = (r ?? []) as any[];
    } else if (ds === "concierge_leads") {
      const { data: r } = await supabaseAdmin
        .from("concierge_leads")
        .select(
          "id, created_at, service_key, service_name, client_type, email, phone, status, contractor_id, assignment_status, forwarded_at, assigned_at, completed_at, admin_notes",
        )
        .order("created_at", { ascending: false });
      rows = (r ?? []) as any[];
    } else if (ds === "rental_listings") {
      const { data: r } = await supabaseAdmin
        .from("rental_listings")
        .select(
          "id, created_at, landlord_id, kind, title, city, district, street, rooms, area_m2, monthly_price, status, promoted, promoted_until, expires_at, views_count, property_type",
        )
        .order("created_at", { ascending: false });
      rows = (r ?? []) as any[];
    } else if (ds === "rental_requests") {
      const { data: r } = await supabaseAdmin
        .from("rental_requests")
        .select(
          "id, created_at, tenant_id, city, district, budget_max, adults_count, children_count, property_type, status, expires_at, min_rooms, is_student, sms_notifications",
        )
        .order("created_at", { ascending: false });
      rows = (r ?? []) as any[];
    } else if (ds === "auto_matches") {
      const { data: r } = await supabaseAdmin
        .from("lease_transactions")
        .select(
          "id, created_at, state, tenant_id, landlord_id, listing_id, request_id, tenant_finalized_at, landlord_finalized_at, contract_start_date, contract_end_date, completed_at, cancelled_at, archived_at",
        )
        .order("created_at", { ascending: false });
      rows = (r ?? []) as any[];
    } else if (ds === "reviews") {
      const { data: r } = await supabaseAdmin
        .from("reviews")
        .select(
          "id, created_at, kind, status, contract_id, reviewer_id, reviewee_id, listing_id, tags, feedback, landlord_communication, landlord_problem_solving, landlord_fairness, tenant_payments, tenant_cleanliness, tenant_neighbors, tenant_communication",
        )
        .order("created_at", { ascending: false });
      rows = (r ?? []) as any[];
    } else {
      const { data: r } = await supabaseAdmin
        .from("payments")
        .select(
          "id, created_at, user_id, kind, target_id, amount, currency, status, description, mollie_payment_id, paid_at",
        )
        .order("created_at", { ascending: false });
      rows = (r ?? []) as any[];
    }

    const stamp = new Date().toISOString().slice(0, 10);
    return { filename: `staysafe-${ds}-${stamp}.csv`, csv: toCsv(rows), count: rows.length };
  });
