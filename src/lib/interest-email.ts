import { supabase } from "@/integrations/supabase/client";

const SUBJECT = "Jest zainteresowany wynajmem Twojej nieruchomości! Sprawdź w portalu.";
const HTML = `<p>Witaj! przed chwilą, ktoś zainteresował się wynajmem Twoją nieruchomością. Sprawdź kto to? Poproś o jego pazport Stay Safe by sprawdzić dodatkowo jego wiarygodność. Uzgodnijcie wszystkie szczegóły umowy, umówcie się na prezentację nieruchomości. Jeżeli wszystko będzie Wam pasowało podpiszcie umowę. Pamiętaj by fakt zawarcia umowy również oznaczyć w portalu StaySafe, wówczas masz dodatkowe zabezpieczenie w przypadku braku płatności na czas w przyszłości przez Najemcę. Będziesz mógł zgłosić nieterminowość oraz docelowo wystawić opinie Najemcy.</p><p>Z pozdrowieniem<br/>Zespół StaySafe</p>`;

/**
 * Calls the Supabase Edge Function "resend-email" with { to, subject, html }
 * and the user's session token. Never throws; logs every step.
 */
export async function notifyLandlordOfInterest(listingId: string) {
  console.log("[interest-email] start, listingId:", listingId);
  try {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      console.warn("[interest-email] no session token — skipping email");
      return;
    }

    const { data: to, error: lookupErr } = await supabase.rpc("interest_notification_email", {
      _listing_id: listingId,
    });
    if (lookupErr || !to) {
      console.error("[interest-email] recipient lookup failed:", lookupErr ?? "no recipient");
      return;
    }

    console.log("[interest-email] invoking resend-email …");
    const { data, error } = await supabase.functions.invoke("resend-email", {
      body: { to, subject: SUBJECT, html: HTML },
      headers: { Authorization: `Bearer ${token}` },
    });
    if (error) {
      console.error("[interest-email] resend-email error:", error);
      return;
    }
    console.log("[interest-email] resend-email response:", data);
  } catch (err) {
    console.error("[interest-email] failed:", err);
  }
}
