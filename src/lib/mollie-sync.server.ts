/**
 * Wspólna synchronizacja płatności z Mollie (webhook + strona powrotu).
 * Zawsze pobiera status z API Mollie — nie ufa danym od klienta.
 * Usługa jest realizowana tylko raz: przy pierwszym przejściu na "paid".
 */
export async function syncMolliePayment(mollieId: string): Promise<string | null> {
  const apiKey = process.env["MOLLIE_API_KEY"];
  if (!apiKey) throw new Error("Brak klucza Mollie.");
  const res = await fetch(`https://api.mollie.com/v2/payments/${mollieId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    console.error("[mollie] lookup failed", res.status, await res.text());
    return null;
  }
  const mp = (await res.json()) as { id: string; status: string };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("payments")
    .select("id, user_id, kind, target_id, status, metadata")
    .eq("mollie_payment_id", mp.id)
    .maybeSingle();
  if (!row) return null;
  if (row.status === "paid") return "paid";

  const paid = mp.status === "paid";
  const status = paid
    ? "paid"
    : ["canceled", "expired", "failed"].includes(mp.status)
      ? mp.status
      : "pending";

  // Warunkowa aktualizacja = tylko jedno wywołanie zrealizuje usługę.
  const { data: updated, error } = await supabaseAdmin
    .from("payments")
    .update({ status, paid_at: paid ? new Date().toISOString() : null })
    .eq("id", row.id)
    .neq("status", "paid")
    .select("id");
  if (error) throw new Error(error.message);
  if (!paid || !updated?.length) return status;

  if (row.kind === "listing_promotion" && row.target_id) {
    const days = Number((row.metadata as { days?: number } | null)?.days ?? 7);
    const { data: listing } = await supabaseAdmin
      .from("rental_listings")
      .select("promoted_until, expires_at")
      .eq("id", row.target_id)
      .maybeSingle();
    const now = Date.now();
    const base =
      listing?.promoted_until && new Date(listing.promoted_until).getTime() > now
        ? new Date(listing.promoted_until).getTime()
        : now;
    const until = base + days * 86_400_000;
    const curExpiry = listing?.expires_at ? new Date(listing.expires_at).getTime() : 0;
    const expiresAt = Math.max(curExpiry, now + 30 * 86_400_000, until);
    const { error: lErr } = await supabaseAdmin
      .from("rental_listings")
      .update({
        promoted: true,
        promoted_until: new Date(until).toISOString(),
        status: "active",
        expires_at: new Date(expiresAt).toISOString(),
      })
      .eq("id", row.target_id);
    if (lErr) console.error("[mollie] listing update failed", lErr.message);
  } else if (row.kind === "passport_renewal") {
    await supabaseAdmin
      .from("profiles")
      .update({ passport_last_paid_at: new Date().toISOString() })
      .eq("id", row.user_id);
  } else if (row.kind === "smart_match_sms" && row.target_id) {
    await supabaseAdmin
      .from("rental_requests")
      .update({ sms_paid_at: new Date().toISOString(), status: "active" })
      .eq("id", row.target_id);
  }
  return "paid";
}
