import { supabase } from "@/integrations/supabase/client";

const RESEND_FN_URL = "https://yfgwqexjnwafrggabzkk.supabase.co/functions/v1/resend-email";
const SUBJECT = "Nowe zainteresowanie ofertą - Smart Match";
const HTML = "<p>Ktoś wyraził zainteresowanie Twoją ofertą na StaySafe!</p>";

/**
 * Plain POST fetch to the external "resend-email" function with { to, subject, html }.
 * Called directly from the "express interest" button. Never throws; logs every step.
 */
export async function notifyLandlordOfInterest(listingId: string) {
  console.log("[interest-email] start, listingId:", listingId);
  try {
    const { data: emailOdbiorcy, error: lookupErr } = await supabase.rpc(
      "interest_notification_email",
      { _listing_id: listingId },
    );
    if (lookupErr || !emailOdbiorcy) {
      console.error("[interest-email] recipient lookup failed:", lookupErr ?? "no recipient");
      return;
    }

    console.log("[interest-email] POST", RESEND_FN_URL, "to:", emailOdbiorcy);
    const res = await fetch(RESEND_FN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: emailOdbiorcy, subject: SUBJECT, html: HTML }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("[interest-email] resend-email error:", res.status, text);
      return;
    }
    console.log("[interest-email] resend-email response:", res.status, text);
  } catch (err) {
    console.error("[interest-email] failed:", err);
  }
}
