/**
 * TURA J — wysyłka SMS przez JustSend.pl (server-only).
 * Każda próba wysyłki jest logowana w tabeli `sms_logs`.
 */

export type SmsKind = "contractor_assignment" | "smart_match";

export function normalizePhone(raw: string): string | null {
  const digits = (raw ?? "").replace(/[^\d+]/g, "");
  const only = digits.replace(/\D/g, "");
  if (only.length === 9) return `+48${only}`;
  if (only.length === 11 && only.startsWith("48")) return `+${only}`;
  if (digits.startsWith("+") && only.length >= 9 && only.length <= 15) return `+${only}`;
  return null;
}

export async function sendSms(opts: {
  phone: string;
  message: string;
  kind: SmsKind;
  userId?: string | null;
  targetId?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const phone = normalizePhone(opts.phone);
  const log = async (status: string, error?: string) => {
    await supabaseAdmin.from("sms_logs").insert({
      user_id: opts.userId ?? null,
      phone: phone ?? opts.phone,
      message: opts.message,
      kind: opts.kind,
      target_id: opts.targetId ?? null,
      status,
      error: error ?? null,
    } as never);
  };

  if (!phone) {
    await log("failed", "Nieprawidłowy numer telefonu");
    return { ok: false, error: "Nieprawidłowy numer telefonu" };
  }

  const apiKey = process.env["JUSTSEND_API_KEY"];
  const sender = process.env["JUSTSEND_SENDER"] || "InfoSMS";
  if (!apiKey) {
    await log("failed", "Brak klucza JUSTSEND_API_KEY");
    return { ok: false, error: "Moduł SMS nie jest skonfigurowany." };
  }

  try {
    const res = await fetch("https://api.justsend.pl/api/rest/v3/message/send/simple", {
      method: "POST",
      headers: { "App-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        bulkVariant: "ECO",
        from: sender,
        message: opts.message,
        to: phone,
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      await log("failed", `${res.status}: ${body.slice(0, 400)}`);
      return { ok: false, error: `Błąd bramki SMS (${res.status})` };
    }
    await log("sent");
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Nieznany błąd";
    await log("failed", msg);
    return { ok: false, error: msg };
  }
}
