import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * User requests admin to unlock/change anonymized identity data
 * (PESEL, document number, name) — sends a message to admin inbox.
 */
export const requestPassportDataChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ reason: z.string().min(5).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles").select("display_name").eq("id", ctx.userId).maybeSingle();
    const name = (profile as any)?.display_name ?? "Użytkownik";

    const { data: admins } = await supabaseAdmin
      .from("user_roles").select("user_id").eq("role", "admin").limit(1);
    const adminId = (admins as any)?.[0]?.user_id;
    if (!adminId) throw new Error("Brak konta administratora w systemie.");

    const { error } = await supabaseAdmin.from("admin_messages").insert({
      sender_id: ctx.userId,
      recipient_id: adminId,
      subject: `Prośba o zmianę zanonimizowanych danych — ${name}`,
      body: `Użytkownik prosi o odblokowanie / zmianę danych objętych anonimizacją (PESEL / dokument tożsamości / imię / nazwisko / data urodzenia).\n\nUzasadnienie:\n${data.reason}\n\nID użytkownika: ${ctx.userId}`,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * User initiates a new passport application after the previous one has been issued.
 * Unlocks the non-anonymization fields for editing and resets verification flags.
 * On second+ application, the UI will additionally route the user through a
 * (currently placeholder) payment step before submitting to admin.
 */
export const startPassportRenewal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as { supabase: any; userId: string };
    const { error } = await ctx.supabase.from("profiles").update({
      passport_renewal_requested: true,
      passport_application_status: "draft",
      // re-open verifications — admin must re-approve
      identity_verification_status: "pending",
      income_verification_status: "pending",
      passport_name_verified: false,
      passport_income_verified: false,
      passport_contract_valid: false,
      passport_social_verified: false,
    }).eq("id", ctx.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
