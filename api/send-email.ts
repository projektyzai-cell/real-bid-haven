// Vercel Serverless Function (Node.js) — sends the Smart Match landlord email via Resend.
// Requires RESEND_API_KEY in the Vercel environment.
import { Resend } from "resend";

const FROM = '"StaySafe" <noreply@staysafe.pl>';

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://yufwrbqcnutmxgzlekfa.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZndyYnFjbnV0bXhnemxla2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDc1NDIsImV4cCI6MjA5NDYyMzU0Mn0.tATHLvPzbXAWmYMGR9PjlknQMZvDmaaUtOhKKBwCNrg";

const SUBJECT = "Jest zainteresowany wynajmem Twojej nieruchomości! Sprawdź w portalu.";
const BODY = `Witaj! przed chwilą, ktoś zainteresował się wynajmem Twoją nieruchomością. Sprawdź kto to? Poproś o jego pazport Stay Safe by sprawdzić dodatkowo jego wiarygodność. Uzgodnijcie wszystkie szczegóły umowy, umówcie się na prezentację nieruchomości. Jeżeli wszystko będzie Wam pasowało podpiszcie umowę. Pamiętaj by fakt zawarcia umowy również oznaczyć w portalu StaySafe, wówczas masz dodatkowe zabezpieczenie w przypadku braku płatności na czas w przyszłości przez Najemcę. Będziesz mógł zgłosić nieterminowość oraz docelowo wystawić opinie Najemcy.

Z pozdrowieniem
Zespół StaySafe`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ sent: false, error: "Method not allowed" });
  const auth = String(req.headers.authorization ?? "");
  const listingId = req.body?.listingId;
  if (!auth.startsWith("Bearer ") || typeof listingId !== "string" || !UUID.test(listingId)) {
    return res.status(400).json({ sent: false, error: "Bad request" });
  }

  let to: unknown;
  try {
    // Resolves the landlord email only if the caller just expressed interest in this listing.
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/interest_notification_email`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ _listing_id: listingId }),
    });
    if (!r.ok) {
      const text = await r.text();
      console.error("[send-email] recipient lookup failed:", r.status, text);
      return res.status(401).json({ sent: false, error: "Recipient lookup failed" });
    }
    to = await r.json();
  } catch (err: any) {
    console.error("[send-email] recipient lookup error:", err?.message ?? err);
    return res.status(500).json({ sent: false, error: err?.message ?? "Lookup error" });
  }
  if (!to || typeof to !== "string") return res.status(200).json({ sent: false, error: "No recipient" });

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
    const info = await transporter.sendMail({
      from: `"StaySafe" <${SMTP_FROM}>`,
      to,
      subject: SUBJECT,
      text: BODY,
    });
    console.log(`[send-email] sent via ${SMTP_HOST}:${SMTP_PORT}, messageId=${info.messageId}`);
    return res.status(200).json({ sent: true });
  } catch (err: any) {
    console.error(
      `[send-email] SMTP failed (${SMTP_HOST}:${SMTP_PORT}, user ${SMTP_USER}):`,
      err?.code ?? "",
      err?.message ?? err,
    );
    return res.status(500).json({ sent: false, error: err?.message ?? "SMTP error" });
  }
}
