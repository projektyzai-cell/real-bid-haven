import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles").select("role").eq("user_id", ctx.userId).eq("role", "admin");
  if (error || !data || data.length === 0) throw new Error("Forbidden: admin only");
}

/**
 * Admin forwards a maintenance report (usterka) to a Concierge contractor.
 * Creates a concierge lead assigned to that contractor and links it to the report.
 */
export const assignMaintenanceToContractor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      reportId: z.string().uuid(),
      contractorId: z.string().uuid(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    await assertAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: report, error: rErr } = await supabaseAdmin
      .from("maintenance_reports")
      .select("id, title, description, category, urgency, landlord_id, tenant_id, listing_id, status")
      .eq("id", data.reportId)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (!report) throw new Error("Nie znaleziono zgłoszenia usterki.");

    const { data: contractor, error: cErr } = await supabaseAdmin
      .from("contractors")
      .select("id, company_name, active")
      .eq("id", data.contractorId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!contractor) throw new Error("Nie znaleziono wykonawcy.");

    const r: any = report;

    // Landlord contact data for the lead
    let email = "";
    let phone = "";
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(r.landlord_id);
      email = authUser?.user?.email ?? "";
      phone = (authUser?.user?.phone as string) ?? "";
    } catch {
      /* ignore — contact fields stay empty */
    }

    let city = "";
    if (r.listing_id) {
      const { data: listing } = await supabaseAdmin
        .from("rental_listings").select("city, title, street").eq("id", r.listing_id).maybeSingle();
      city = (listing as any)?.city ?? "";
    }

    const now = new Date().toISOString();
    const { data: lead, error: lErr } = await supabaseAdmin
      .from("concierge_leads")
      .insert({
        user_id: r.landlord_id,
        service_key: "zlota_raczka",
        service_name: "Usterka z aktywnej umowy — złota rączka",
        client_type: "landlord",
        email,
        phone,
        consent_accepted: true,
        consent_timestamp: now,
        status: "forwarded",
        forwarded_at: now,
        forwarded_by: ctx.userId,
        contractor_id: data.contractorId,
        assignment_status: "assigned",
        assigned_at: now,
        admin_notes:
          `Zgłoszenie usterki #${r.id}\nKategoria: ${r.category}\nPilność: ${r.urgency}\n` +
          `${city ? `Miasto: ${city}\n` : ""}Tytuł: ${r.title}\n\n${r.description}`,
      })
      .select("id")
      .single();
    if (lErr) throw new Error(lErr.message);

    const { error: uErr } = await supabaseAdmin
      .from("maintenance_reports")
      .update({
        contractor_id: data.contractorId,
        concierge_lead_id: (lead as any).id,
        assigned_at: now,
        status: r.status === "reported" ? "acknowledged" : r.status,
      } as any)
      .eq("id", r.id);
    if (uErr) throw new Error(uErr.message);

    return { ok: true, leadId: (lead as any).id, contractor: (contractor as any).company_name };
  });
