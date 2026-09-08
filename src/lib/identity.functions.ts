import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side, peppered hashing of identity secrets (PESEL / document number).
 * Raw values never reach the database — only HMAC-SHA256 digests keyed with a
 * server-only pepper, which makes offline brute force of the low-entropy PESEL
 * space infeasible.
 */
const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mode: z.enum(["pesel", "doc"]),
  pesel: z.string().max(20).optional(),
  country: z.string().max(2).optional(),
  docNum: z.string().max(60).optional(),
});

async function hmac(pepper: string, value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const submitIdentityHashes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    const pepper = process.env["IDENTITY_HASH_PEPPER"];
    if (!pepper) throw new Error("Brak konfiguracji bezpieczeństwa serwera.");

    let pesel_hash: string | null = null;
    let document_country_code: string | null = null;
    let document_number_hash: string | null = null;
    let secret = "";

    if (data.mode === "pesel") {
      const n = (data.pesel ?? "").replace(/\D/g, "");
      if (n.length !== 11) throw new Error("Nieprawidłowy PESEL.");
      pesel_hash = await hmac(pepper, `pesel:${n}`);
      secret = n;
    } else {
      const c = (data.country ?? "").trim().toUpperCase();
      const num = (data.docNum ?? "").replace(/\s+/g, "").toUpperCase();
      if (c.length !== 2) throw new Error("Nieprawidłowy kod kraju.");
      if (num.length < 4) throw new Error("Numer dokumentu jest za krótki.");
      document_country_code = c;
      document_number_hash = await hmac(pepper, `doc:${c}:${num}`);
      secret = `${c}:${num}`;
    }

    const combo = await hmac(
      pepper,
      `combo:${data.firstName.trim().toLowerCase()}|${data.lastName.trim().toLowerCase()}|${data.dob}|${secret.toLowerCase()}`,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Reject reuse of the same identity across accounts.
    const { data: clash } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("identity_combo_hash", combo)
      .neq("id", ctx.userId)
      .maybeSingle();
    if (clash) throw new Error("Te dane tożsamości są już powiązane z innym kontem.");

    const { data: serialData, error: serialErr } = await supabaseAdmin.rpc(
      "gen_passport_serial" as never,
    );
    if (serialErr) throw new Error("Nie udało się wygenerować numeru paszportu.");

    const expires = new Date();
    expires.setDate(expires.getDate() + 90);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        date_of_birth: data.dob,
        has_pesel: data.mode === "pesel",
        pesel_hash,
        document_country_code,
        document_number_hash,
        identity_combo_hash: combo,
        passport_serial: serialData as unknown as string,
        passport_expires_at: expires.toISOString(),
        identity_change_allowed: false,
      } as never)
      .eq("id", ctx.userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
