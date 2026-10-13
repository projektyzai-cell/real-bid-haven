import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SUBJECT = "Jest zainteresowany wynajmem Twojej nieruchomości! Sprawdź w portalu.";
const BODY = `Witaj! przed chwilą, ktoś zainteresował się wynajmem Twoją nieruchomością. Sprawdź kto to? Poproś o jego pazport Stay Safe by sprawdzić dodatkowo jego wiarygodność. Uzgodnijcie wszystkie szczegóły umowy, umówcie się na prezentację nieruchomości. Jeżeli wszystko będzie Wam pasowało podpiszcie umowę. Pamiętaj by fakt zawarcia umowy również oznaczyć w portalu StaySafe, wówczas masz dodatkowe zabezpieczenie w przypadku braku płatności na czas w przyszłości przez Najemcę. Będziesz mógł zgłosić nieterminowość oraz docelowo wystawić opinie Najemcy.

Z pozdrowieniem
Zespół StaySafe`;

/**
 * Powiadomienie e-mail (SMTP) do Wynajmującego po wyrażeniu zainteresowania przez Najemcę.
 * Wysyła tylko, gdy wywołujący faktycznie ma transakcję dla tej oferty.
 */
export const notifyLandlordOfInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ listingId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    const { data: txn } = await ctx.supabase
      .from("lease_transactions")
      .select("id, landlord_id")
      .eq("tenant_id", ctx.userId)
      .eq("listing_id", data.listingId)
      .maybeSingle();
    if (!txn?.landlord_id) return { sent: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(txn.landlord_id);
    const to = u?.user?.email;
    if (!to) return { sent: false };

    try {
      const { WorkerMailer } = await import("worker-mailer");
      await WorkerMailer.send(
        {
          host: process.env["SMTP_HOST"]!,
          port: Number(process.env["SMTP_PORT"] ?? 465),
          secure: true,
          credentials: { username: process.env["SMTP_USER"]!, password: process.env["SMTP_PASSWORD"]! },
          authType: ["plain", "login"],
        },
        {
          from: { name: "StaySafe", email: process.env["SMTP_FROM"]! },
          to: { email: to },
          subject: SUBJECT,
          text: BODY,
        },
      );
      return { sent: true };
    } catch (e) {
      console.error("SMTP send failed", e);
      return { sent: false };
    }
  });
