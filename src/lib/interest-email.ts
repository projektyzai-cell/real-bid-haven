import { supabase } from "@/integrations/supabase/client";

/** Calls the Vercel /api/send-email function to notify the landlord. Never throws. */
export async function notifyLandlordOfInterest(listingId: string) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ listingId }),
    });
  } catch {
    /* ignore */
  }
}
