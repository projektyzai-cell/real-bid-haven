// Vercel Serverless Function (Node.js) — sends the Smart Match landlord email via SMTP.
// Required Vercel env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM,
// SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY.
import nodemailer from "nodemailer";

const SUBJECT = "Jest zainteresowany wynajmem Twojej nieruchomości! Sprawdź w portalu.";
const BODY = `Witaj! przed chwilą, ktoś zainteresował się wynajmem Twoją nieruchomością. Sprawdź kto to? Poproś o jego pazport Stay Safe by sprawdzić dodatkowo jego wiarygodność. Uzgodnijcie wszystkie szczegóły umowy, umówcie się na prezentację nieruchomości. Jeżeli wszystko będzie Wam pasowało podpiszcie umowę. Pamiętaj by fakt zawarcia umowy również oznaczyć w portalu StaySafe, wówczas masz dodatkowe zabezpieczenie w przypadku braku płatności na czas w przyszłości przez Najemcę. Będziesz mógł zgłosić nieterminowość oraz docelowo wystawić opinie Najemcy.

Z pozdrowieniem
Zespół StaySafe`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ sent: false });
  const auth = String(req.headers.authorization ?? "");
  const listingId = req.body?.listingId;
  if (!auth.startsWith("Bearer ") || typeof listingId !== "string" || !UUID.test(listingId)) {
    return res.status(400).json({ sent: false });
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  // Resolves the landlord email only if the caller just expressed interest in this listing.
  const r = await fetch(`${url}/rest/v1/rpc/interest_notification_email`, {
    method: "POST",
    headers: { apikey: key!, Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ _listing_id: listingId }),
  });
  if (!r.ok) return res.status(401).json({ sent: false });
  const to = await r.json();
  if (!to || typeof to !== "string") return res.status(200).json({ sent: false });

  try {
    const port = Number(process.env.SMTP_PORT ?? 465);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"StaySafe" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
      to,
      subject: SUBJECT,
      text: BODY,
    });
    return res.status(200).json({ sent: true });
  } catch (e) {
    console.error("SMTP send failed", e);
    return res.status(500).json({ sent: false });
  }
}
