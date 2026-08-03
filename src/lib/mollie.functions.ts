import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PROMO_PLANS, PASSPORT_RENEWAL_PRICE, SMS_PRICE } from "@/lib/pricing";

/**
 * TURA I — Płatności Mollie.
 * Ceny wyliczane WYŁĄCZNIE po stronie serwera (klient nie przesyła kwoty).
 */
export const createMolliePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        kind: z.enum(["listing_promotion", "passport_renewal", "smart_match_sms"]),
        targetId: z.string().uuid().optional(),
        days: z.number().int().min(1).max(90).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    const apiKey = process.env["MOLLIE_API_KEY"];
    if (!apiKey) throw new Error("Moduł płatności nie jest skonfigurowany (brak klucza Mollie).");

    const origin = getRequestUrl().origin;

    let amount = 0;
    let description = "";

    if (data.kind === "listing_promotion") {
      const plan = PROMO_PLANS.find((p) => p.days === data.days);
      if (!plan || !data.targetId) throw new Error("Nieprawidłowy pakiet promowania.");
      const { data: listing, error } = await ctx.supabase
        .from("rental_listings")
        .select("id, landlord_id, title")
        .eq("id", data.targetId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!listing || listing.landlord_id !== ctx.userId) throw new Error("Brak uprawnień do tej oferty.");
      amount = plan.price;
      description = `Promowanie oferty (${plan.label}) — Stay Safe`;
    } else if (data.kind === "passport_renewal") {
      amount = PASSPORT_RENEWAL_PRICE;
      description = "Odnowienie Paszportu Najemcy — Stay Safe";
    } else {
      if (!data.targetId) throw new Error("Brak zapytania do opłacenia.");
      const { data: req, error } = await ctx.supabase
        .from("rental_requests")
        .select("id, tenant_id")
        .eq("id", data.targetId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!req || req.tenant_id !== ctx.userId) throw new Error("Brak uprawnień do tego zapytania.");
      amount = SMS_PRICE;
      description = "Powiadomienia SMS Smart-Match — Stay Safe";
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error: insErr } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: ctx.userId,
        kind: data.kind,
        target_id: data.targetId ?? null,
        amount,
        currency: "PLN",
        status: "open",
        description,
        metadata: { days: data.days ?? null },
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);

    const res = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: { currency: "PLN", value: amount.toFixed(2) },
        description,
        redirectUrl: `${origin}/platnosc/status?p=${row.id}`,
        webhookUrl: `${origin}/api/public/mollie-webhook`,
        metadata: { payment_id: row.id, kind: data.kind },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Mollie create payment failed", res.status, body);
      await supabaseAdmin.from("payments").update({ status: "failed" }).eq("id", row.id);
      throw new Error("Nie udało się utworzyć płatności. Spróbuj ponownie za chwilę.");
    }

    const mollie = (await res.json()) as {
      id: string;
      _links?: { checkout?: { href?: string } };
    };
    const checkoutUrl = mollie._links?.checkout?.href;
    if (!checkoutUrl) throw new Error("Brak adresu płatności od operatora.");

    await supabaseAdmin
      .from("payments")
      .update({ mollie_payment_id: mollie.id, checkout_url: checkoutUrl, status: "pending" })
      .eq("id", row.id);

    return { paymentId: row.id as string, checkoutUrl };
  });

/** Status płatności — używany przez stronę powrotu z Mollie. */
export const getPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ paymentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    const { data: row, error } = await ctx.supabase
      .from("payments")
      .select("id, kind, amount, status, description, paid_at, target_id")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Nie znaleziono płatności.");
    void ctx.userId;
    return row as {
      id: string;
      kind: string;
      amount: number;
      status: string;
      description: string;
      paid_at: string | null;
      target_id: string | null;
    };
  });
