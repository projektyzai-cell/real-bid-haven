import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook Mollie — wywoływany przez operatora po zmianie statusu płatności.
 * Nie ufamy treści żądania: pobieramy status bezpośrednio z API Mollie.
 */
export const Route = createFileRoute("/api/public/mollie-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["MOLLIE_API_KEY"];
        if (!apiKey) return new Response("not configured", { status: 500 });

        const form = await request.formData();
        const mollieId = String(form.get("id") ?? "");
        if (!/^tr_[A-Za-z0-9]+$/.test(mollieId)) return new Response("bad id", { status: 400 });

        const res = await fetch(`https://api.mollie.com/v2/payments/${mollieId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return new Response("lookup failed", { status: 400 });
        const mp = (await res.json()) as { id: string; status: string };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("payments")
          .select("id, user_id, kind, target_id, status, metadata")
          .eq("mollie_payment_id", mp.id)
          .maybeSingle();
        if (!row) return new Response("ok");

        const paid = mp.status === "paid";
        const status = paid
          ? "paid"
          : ["canceled", "expired", "failed"].includes(mp.status)
            ? (mp.status as string)
            : "pending";

        if (row.status === "paid") return new Response("ok");

        await supabaseAdmin
          .from("payments")
          .update({ status, paid_at: paid ? new Date().toISOString() : null })
          .eq("id", row.id);

        if (!paid) return new Response("ok");

        // ── Realizacja usługi ──────────────────────────────────────
        if (row.kind === "listing_promotion" && row.target_id) {
          const days = Number((row.metadata as any)?.days ?? 7);
          const { data: listing } = await supabaseAdmin
            .from("rental_listings")
            .select("promoted_until")
            .eq("id", row.target_id)
            .maybeSingle();
          const base = listing?.promoted_until && new Date(listing.promoted_until) > new Date()
            ? new Date(listing.promoted_until)
            : new Date();
          const until = new Date(base.getTime() + days * 86_400_000).toISOString();
          await supabaseAdmin
            .from("rental_listings")
            .update({ promoted: true, promoted_until: until })
            .eq("id", row.target_id);
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

        return new Response("ok");
      },
    },
  },
});
