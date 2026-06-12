import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, BadgeCheck, Linkedin, Facebook, Instagram, Download, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type PassportData = {
  displayName: string;
  serial: string;
  issuedAt: string | null;
  expiresAt: string | null;
  score: number;
  incomeVerified: boolean;
  identityVerified: boolean;
  contractValid: boolean;
  socialVerified: boolean;
  leaseCount: number;
  socials: { linkedin?: string | null; facebook?: string | null; instagram?: string | null };
  city?: string | null;
  acceptsOccasionalLease?: boolean;
  hasTenantInsurance?: boolean;
  bio?: string | null;
  avatarUrl?: string | null;
};

export function TenantPassportCard({ data }: { data: PassportData }) {
  const ref = useRef<HTMLDivElement>(null);
  const qrUrl = `https://staysafe.pl/p/${data.serial}`;

  async function downloadPdf() {
    if (!ref.current) return;
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(ref.current, { backgroundColor: "#0B132B", scale: 2, useCORS: true, logging: false });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`paszport-${data.serial}.pdf`);
    } catch (e) {
      toast.error("Nie udało się wygenerować PDF: " + (e as Error).message);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(qrUrl);
      toast.success("Skopiowano link do paszportu");
    } catch {
      toast.error("Nie udało się skopiować linku");
    }
  }


  return (
    <div className="space-y-3">
      <div ref={ref} className="overflow-hidden rounded-3xl border border-[#D4AF37]/50 bg-gradient-to-br from-[#0B132B] via-[#101a3a] to-[#0B132B] p-8 text-white shadow-[0_0_60px_-15px_rgba(212,175,55,0.6)]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border-2 border-[#D4AF37] bg-[#D4AF37]/10 p-2.5">
              <ShieldCheck className="h-7 w-7 text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Paszport Najemcy</div>
              <div className="text-lg font-bold tracking-wide">STAYSAFE.PL</div>
            </div>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-gradient-to-br from-[#D4AF37] to-[#8a6f1f] shadow-[0_0_20px_rgba(212,175,55,0.6)]">
            <BadgeCheck className="h-7 w-7 text-[#0B132B]" />
          </div>
        </div>

        {/* Serial */}
        <div className="mt-6 text-center">
          <div className="text-2xl font-bold tracking-[0.15em] text-white sm:text-3xl">{data.serial}</div>
          <div className="mt-1 text-xs text-white/60">
            ⌛ Ważny do: <span className="font-semibold text-[#D4AF37]">
              {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString("pl-PL") : "—"}
            </span>
          </div>
        </div>

        {/* Identity row */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Cell label="Imię i Nazwisko" value={data.displayName.toUpperCase()} />
          <Cell label="Data wygenerowania" value={data.issuedAt ? new Date(data.issuedAt).toLocaleDateString("pl-PL") : "—"} />
          <Cell label="Miasto" value={data.city ?? "—"} />
        </div>

        {/* Big score */}
        <div className="mt-6 flex items-end justify-between gap-4 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Trusted Tenant Score</div>
            <div className="mt-1 text-5xl font-black leading-none text-[#D4AF37] sm:text-6xl">
              {data.score}<span className="text-2xl text-white/40">/100</span>
            </div>
          </div>
          <div className="text-right text-xs text-white/70">
            <div className="font-semibold text-white">{data.leaseCount} {data.leaseCount === 1 ? "najem" : "najmów"}</div>
            <div className="text-white/50">w historii</div>
          </div>
        </div>

        {/* Verification badges */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Badge ok={data.identityVerified} label="Tożsamość" />
          <Badge ok={data.incomeVerified} label="Dochody" />
          <Badge ok={data.contractValid} label="Umowa ważna" />
          <Badge ok={data.socialVerified} label="Social media" />
        </div>

        {/* Social icons */}
        <div className="mt-4 flex items-center gap-3 text-white/70">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Zweryfikowane profile:</span>
          {data.socials.linkedin && <Linkedin className="h-4 w-4 text-[#D4AF37]" />}
          {data.socials.facebook && <Facebook className="h-4 w-4 text-[#D4AF37]" />}
          {data.socials.instagram && <Instagram className="h-4 w-4 text-[#D4AF37]" />}
        </div>

        {/* Legal declarations */}
        {(data.acceptsOccasionalLease || data.hasTenantInsurance) && (
          <div className="mt-4 space-y-1.5 rounded-xl border border-[#D4AF37]/25 bg-black/20 p-3 text-[11px] text-white/80">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Deklaracje najemcy</div>
            {data.acceptsOccasionalLease && (
              <div className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-400" /><span>Zgadza się na umowę <strong>najmu okazjonalnego</strong> (notarialne poddanie się egzekucji).</span></div>
            )}
            {data.hasTenantInsurance && (
              <div className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-400" /><span>Zgadza się wykupić <strong>ubezpieczenie OC najemcy</strong> na własny koszt.</span></div>
            )}
          </div>
        )}



        {/* Footer QR */}
        <div className="mt-6 flex items-end justify-between border-t border-[#D4AF37]/20 pt-4">
          <div className="text-xs italic text-white/60">„Bezpieczeństwo droższe od pieniędzy"</div>
          <div className="rounded-lg bg-white p-2">
            <QRCodeSVG value={qrUrl} size={72} bgColor="#FFFFFF" fgColor="#0B132B" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={downloadPdf} className="bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
          <Download className="mr-2 h-4 w-4" /> Pobierz paszport (PDF)
        </Button>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</div>
      <div className="mt-0.5 text-sm font-bold tracking-wide text-white">{value}</div>
    </div>
  );
}
function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${ok ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-white/15 bg-white/5 text-white/40"}`}>
      <BadgeCheck className={`h-3.5 w-3.5 ${ok ? "text-emerald-400" : "text-white/30"}`} />
      {label}
    </div>
  );
}
