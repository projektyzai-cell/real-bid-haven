import { supabase } from "@/integrations/supabase/client";

/**
 * Calls the Vercel /api/send-email function to notify the landlord.
 * Awaits the response and logs every step so the flow is visible in
 * the browser console and in Vercel logs. Never throws.
 */
export async function notifyLandlordOfInterest(listingId: string) {
  console.log("[interest-email] start, listingId:", listingId);
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      console.warn("[interest-email] no session token — skipping email");
      return;
    }
    console.log("[interest-email] calling /api/send-email …");
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ listingId }),
    });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.sent) {
      console.log("[interest-email] email sent OK");
    } else {
      console.warn("[interest-email] email NOT sent:", res.status, body);
    }
  } catch (err) {
    console.error("[interest-email] fetch failed:", err);
  }
}
