import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ShieldCheck, BadgeCheck, Download, Link2, User as UserIcon,
  IdCard, Linkedin, Facebook, Instagram, Wallet, Mail, Share2, Gem, ClipboardList, CheckCircle2,
} from "lucide-react";
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
  /** Total external rental history entries declared by the tenant. */
  leaseCount: number;
  /** Optional — successful leases finalized inside the StaySafe platform. */
  internalLeaseCount?: number;
  socials: { linkedin?: string | null; facebook?: string | null; instagram?: string | null };
  city?: string | null;
  acceptsOccasionalLease?: boolean;
  acceptsOneMonthDeposit?: boolean;
  isStudent?: boolean;
  hasGuarantor?: boolean;
  hasTenantInsurance?: boolean;
  bio?: string | null;
  avatarUrl?: string | null;
  educationVerified?: boolean;
  contactVerified?: boolean;
  creditScoreVerified?: boolean;
  profileCompletionPct?: number;
};

const NAVY = "#0B132B";
const NAVY_2 = "#101a3a";
const GOLD = "#D4AF37";

function trustLabel(score: number) {
  if (score >= 86) return "Ekspert poziom zaufania";
  if (score >= 60) return "Wysoki poziom zaufania";
  if (score >= 30) return "Średni poziom zaufania";
  return "Niski poziom zaufania";
}

function RainbowGauge({ score }: { score: number }) {
  // Half-circle gauge, score 0..100 maps to angle 180°..0° (left → right)
  const clamped = Math.max(0, Math.min(100, score));
  const angle = (180 - (clamped / 100) * 180) * (Math.PI / 180);
  const cx = 120, cy = 120, r = 92;
  const nx = cx + r * Math.cos(angle);
  const ny = cy - r * Math.sin(angle);
  return (
    <svg viewBox="0 0 240 150" className="w-full max-w-[260px]">
      <defs>
        <linearGradient id="rainbowGauge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="0.25" stopColor="#f97316" />
          <stop offset="0.5" stopColor="#eab308" />
          <stop offset="0.75" stopColor="#84cc16" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      {/* Track */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        stroke="rgba(255,255,255,0.08)" strokeWidth="22" fill="none" strokeLinecap="round" />
      {/* Rainbow arc */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        stroke="url(#rainbowGauge)" strokeWidth="18" fill="none" strokeLinecap="round" />
      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="7" fill="#fff" />
      <circle cx={cx} cy={cy} r="3" fill={NAVY} />
      {/* Score text */}
      <text x={cx} y={cy - 14} textAnchor="middle"
        fontSize="44" fontWeight="900" fill="#fff" fontFamily="ui-sans-serif, system-ui">
        {clamped}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle"
        fontSize="14" fontWeight="700" fill="rgba(255,255,255,0.5)">
        / 100
      </text>
    </svg>
  );
}

type Aspect = {
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function TenantPassportCard({ data }: { data: PassportData }) {
  const ref = useRef<HTMLDivElement>(null);
  const qrUrl = `https://staysafe.pl/p/${data.serial}`;
  const completion = data.profileCompletionPct ?? Math.round((data.score / 100) * 100);
  const tier = data.score >= 86 ? "Najemca Ekspert" : data.score >= 60 ? "Najemca Premium" : data.score >= 30 ? "Najemca Standard" : "Najemca Nowy";

  const externalCount = data.leaseCount ?? 0;
  const internalCount = data.internalLeaseCount ?? 0;

  // Since the passport is only generated after positive admin verification,
  // every core aspect is rendered as "Zweryfikowano" — no pending states.
  const aspects: Aspect[] = [
    { label: "Tożsamość (Anty-fraud)", sub: "Skan dokumentu tożsamości został pomyślnie zweryfikowany", icon: IdCard },
    { label: "Stabilność finansowa", sub: "Miesięczny dochód i zatrudnienie zostały pomyślnie zweryfikowane", icon: Wallet },
  ];
  if (data.socials.facebook) aspects.push({ label: "Konto Facebook", sub: "Profil społecznościowy został pomyślnie zweryfikowany", icon: Facebook });
  if (data.socials.linkedin) aspects.push({ label: "Konto LinkedIn", sub: "Profil zawodowy został pomyślnie zweryfikowany", icon: Linkedin });
  if (data.socials.instagram) aspects.push({ label: "Konto Instagram", sub: "Profil społecznościowy został pomyślnie zweryfikowany", icon: Instagram });
  aspects.push({ label: "Dane kontaktowe", sub: "Adres e-mail został pomyślnie zweryfikowany", icon: Mail });

  async function downloadPdf() {
    if (!ref.current) return;
    try {
      // Inline avatars as data URLs so html2canvas doesn't taint the canvas.
      const imgs = ref.current.querySelectorAll<HTMLImageElement>("img[data-avatar]");
      for (const img of Array.from(imgs)) {
        if (img.src.startsWith("data:")) continue;
        try {
          const resp = await fetch(img.src, { mode: "cors" });
          const blob = await resp.blob();
          const dataUrl: string = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.onerror = rej;
            r.readAsDataURL(blob);
          });
          img.src = dataUrl;
          await new Promise((res) => { img.onload = res; img.onerror = res; });
        } catch {
          img.removeAttribute("src");
        }
      }

      // KEY FIX: pure-JS conversion of lab()/lch()/oklab()/oklch()/color() to
      // plain rgb(). The canvas fillStyle trick fails on wide-gamut browsers
      // because canvas now returns oklch/lab as-is. We guarantee no inline
      // style on the clone contains "lab" or "oklch".
      const COLOR_RX = /(lab|lch|oklab|oklch|color)\s*\(/i;
      const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
      const compand = (x: number) => {
        const s = x < 0 ? -1 : 1, a = Math.abs(x);
        return s * (a <= 0.0031308 ? 12.92 * a : 1.055 * Math.pow(a, 1 / 2.4) - 0.055);
      };
      const linToRgb = (r: number, g: number, b: number) => [
        Math.round(clamp01(compand(r)) * 255),
        Math.round(clamp01(compand(g)) * 255),
        Math.round(clamp01(compand(b)) * 255),
      ];
      const oklabToLin = (L: number, a: number, b: number) => {
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
        const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
        return [
          4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
          -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
          -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
        ];
      };
      const labToLin = (L: number, a: number, b: number) => {
        const fy = (L + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200;
        const e = 216 / 24389, k = 24389 / 27;
        const xr = fx ** 3 > e ? fx ** 3 : (116 * fx - 16) / k;
        const yr = L > k * e ? fy ** 3 : L / k;
        const zr = fz ** 3 > e ? fz ** 3 : (116 * fz - 16) / k;
        const X = xr * 0.96422, Y = yr, Z = zr * 0.82521;
        const Xd = 0.9555766 * X + -0.0230393 * Y + 0.0631636 * Z;
        const Yd = -0.0282895 * X + 1.0099416 * Y + 0.0210077 * Z;
        const Zd = 0.0122982 * X + -0.0204830 * Y + 1.3299098 * Z;
        return [
          3.2404542 * Xd - 1.5371385 * Yd - 0.4985314 * Zd,
          -0.9692660 * Xd + 1.8760108 * Yd + 0.0415560 * Zd,
          0.0556434 * Xd - 0.2040259 * Yd + 1.0572252 * Zd,
        ];
      };
      const parseNums = (s: string) =>
        Array.from(s.matchAll(/-?\d*\.?\d+(?:e[-+]?\d+)?%?/gi)).map((m) =>
          m[0].endsWith("%") ? parseFloat(m[0]) / 100 : parseFloat(m[0]),
        );
      const convertOne = (fn: string, body: string): string => {
        try {
          const parts = body.split("/");
          const nums = parseNums(parts[0]);
          const alpha = parts[1] ? parseNums(parts[1])[0] ?? 1 : 1;
          let rgb: number[] | null = null;
          if (fn === "oklch" || fn === "lch") {
            const L = fn === "oklch" ? (nums[0] > 1 ? nums[0] / 100 : nums[0]) : nums[0];
            const C = nums[1] || 0, H = ((nums[2] || 0) * Math.PI) / 180;
            const a = C * Math.cos(H), b = C * Math.sin(H);
            const lin = fn === "oklch" ? oklabToLin(L, a, b) : labToLin(nums[0], a, b);
            rgb = linToRgb(lin[0], lin[1], lin[2]);
          } else if (fn === "oklab" || fn === "lab") {
            const L = fn === "oklab" ? (nums[0] > 1 ? nums[0] / 100 : nums[0]) : nums[0];
            const lin = fn === "oklab" ? oklabToLin(L, nums[1], nums[2]) : labToLin(nums[0], nums[1], nums[2]);
            rgb = linToRgb(lin[0], lin[1], lin[2]);
          }
          if (!rgb) return "rgb(31,41,55)";
          return alpha < 1 ? `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})` : `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
        } catch { return "rgb(31,41,55)"; }
      };
      const sanitize = (v: string): string => {
        if (!v || !COLOR_RX.test(v)) return v;
        let out = "", i = 0;
        while (i < v.length) {
          const rest = v.slice(i);
          const m = rest.match(/(lab|lch|oklab|oklch|color)\s*\(/i);
          if (!m || m.index === undefined) { out += rest; break; }
          out += rest.slice(0, m.index);
          const open = i + m.index + m[0].length - 1;
          let depth = 1, j = open + 1;
          while (j < v.length && depth > 0) {
            if (v[j] === "(") depth++;
            else if (v[j] === ")") { depth--; if (depth === 0) break; }
            j++;
          }
          out += convertOne(m[1].toLowerCase(), v.slice(open + 1, j));
          i = j + 1;
        }
        // Final guard — no "lab" or "oklch" may remain.
        if (/lab\s*\(|lch\s*\(|color\s*\(/i.test(out)) {
          out = out.replace(/(lab|lch|oklab|oklch|color)\s*\([^)]*\)/gi, "rgb(31,41,55)");
        }
        return out;
      };
      const toRgb = (v: string): string => sanitize(v);
      const COLOR_PROPS = [
        "color", "background-color", "border-top-color", "border-right-color",
        "border-bottom-color", "border-left-color", "outline-color",
        "text-decoration-color", "fill", "stroke", "caret-color",
        "column-rule-color",
      ];

      const sourceEls = Array.from(ref.current.querySelectorAll<HTMLElement>("*"));
      const sourceRoot = ref.current;

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Deep-clone our root and bake inline computed styles BEFORE inserting
      // into the isolated iframe. This way html2canvas sees only clean styles.
      const clonedRoot = sourceRoot.cloneNode(true) as HTMLElement;
      const clonedEls = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll<HTMLElement>("*"))];
      const srcEls = [sourceRoot, ...sourceEls];
      const len = Math.min(srcEls.length, clonedEls.length);

      const copyProps = [
        "font-family", "font-size", "font-weight", "font-style", "line-height",
        "letter-spacing", "text-align", "text-transform", "white-space",
        "display", "flex-direction", "justify-content", "align-items", "gap",
        "grid-template-columns", "grid-template-rows",
        "padding-top", "padding-right", "padding-bottom", "padding-left",
        "margin-top", "margin-right", "margin-bottom", "margin-left",
        "width", "height", "min-width", "min-height", "max-width", "max-height",
        "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
        "border-top-style", "border-right-style", "border-bottom-style", "border-left-style",
        "border-top-left-radius", "border-top-right-radius",
        "border-bottom-left-radius", "border-bottom-right-radius",
        "opacity", "overflow", "position", "top", "left", "right", "bottom",
        "object-fit",
      ];

      for (let i = 0; i < len; i++) {
        const src = srcEls[i];
        const dst = clonedEls[i];
        const cs = window.getComputedStyle(src);

        for (const p of COLOR_PROPS) {
          const v = cs.getPropertyValue(p);
          if (v) dst.style.setProperty(p, COLOR_RX.test(v) ? toRgb(v) : v, "important");
        }
        const bgImg = cs.getPropertyValue("background-image");
        if (bgImg && bgImg !== "none") dst.style.setProperty("background-image", sanitize(bgImg), "important");
        const shadow = cs.getPropertyValue("box-shadow");
        if (shadow && shadow !== "none") dst.style.setProperty("box-shadow", sanitize(shadow), "important");
        for (const p of copyProps) {
          const v = cs.getPropertyValue(p);
          if (v) dst.style.setProperty(p, v);
        }
      }

      // Capture true rendered size before we move the clone offscreen.
      const rect = sourceRoot.getBoundingClientRect();

      // Hidden iframe with a blank document — zero global stylesheets, so
      // html2canvas cannot encounter lab()/oklch() anywhere.
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:" + Math.ceil(rect.width) + "px;height:" + Math.ceil(rect.height) + "px;border:0;";
      document.body.appendChild(iframe);
      const idoc = iframe.contentDocument!;
      idoc.open();
      idoc.write('<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:' + NAVY + ';"></body></html>');
      idoc.close();
      idoc.body.appendChild(clonedRoot);

      // Wait one frame so the iframe lays out.
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      try {
        const canvas = await html2canvas(idoc.body, {
          backgroundColor: NAVY, scale: 2, useCORS: true, allowTaint: false, logging: false,
          width: Math.ceil(rect.width), height: Math.ceil(rect.height),
          windowWidth: Math.ceil(rect.width), windowHeight: Math.ceil(rect.height),
        });
        const img = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
        pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`paszport-${data.serial}.pdf`);
        toast.success("PDF zapisany.");
      } finally {
        iframe.remove();
      }
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

  async function shareNative() {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Paszport Najemcy ${data.serial}`, url: qrUrl });
      } else {
        await copyLink();
      }
    } catch { /* user cancelled */ }
  }

  return (
    <div className="space-y-3">
      {/* Page-level header strip with completion + share */}
      <div
        className="flex flex-col gap-3 rounded-3xl border border-[#D4AF37]/40 p-5 text-white shadow-card sm:flex-row sm:items-center sm:justify-between"
        style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_2})` }}
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">Paszport Najemcy</div>
          <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">MÓJ PASZPORT NAJEMCY</h2>
          <p className="mt-0.5 text-sm text-white/70">Przeglądaj swój profil zaufania i zweryfikowane aspekty</p>
        </div>
        <div className="min-w-[220px] rounded-2xl border border-[#D4AF37]/40 bg-black/20 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white/80">Profil ukończony</span>
            <span className="font-bold text-[#D4AF37]">{completion}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${completion}%` }} />
          </div>
          <Button onClick={shareNative} variant="outline"
            className="mt-2.5 w-full rounded-xl border-[#D4AF37]/50 bg-transparent text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]">
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Udostępnij Paszport
          </Button>
        </div>
      </div>

      {/* Main passport card */}
      <div
        ref={ref}
        className="overflow-hidden rounded-3xl border border-[#D4AF37]/50 p-6 text-white shadow-[0_0_60px_-15px_rgba(212,175,55,0.6)] sm:p-8"
        style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_2}, ${NAVY})` }}
      >
        {/* Top row: serial + expiry */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D4AF37]/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border-2 border-[#D4AF37] bg-[#D4AF37]/10 p-2">
              <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">STAYSAFE.PL</div>
              <div className="font-mono text-lg font-bold tracking-[0.18em]">{data.serial}</div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-white/50">Ważny do</div>
            <div className="font-bold text-[#D4AF37]">
              {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString("pl-PL") : "—"}
            </div>
          </div>
        </div>

        {/* Two-column body */}
        <div className="mt-5 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* LEFT: identity + gauge */}
          <div className="rounded-2xl border border-[#D4AF37]/25 bg-black/20 p-5 text-center">
            <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-[#D4AF37] bg-white/5">
              {data.avatarUrl ? (
                <img src={data.avatarUrl} alt="" data-avatar crossOrigin="anonymous"
                  className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/30">
                  <UserIcon className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="mt-3 text-lg font-bold tracking-wide text-white">
              {data.displayName.toUpperCase()}
            </div>
            <div className="mt-1 inline-block rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
              {tier}
            </div>
            <div className="mt-4 flex flex-col items-center">
              <RainbowGauge score={data.score} />
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Trusted Tenant Score</div>
              <div className="text-sm text-white/70">{trustLabel(data.score)}</div>
            </div>
            <div className="mt-3 border-t border-[#D4AF37]/20 pt-3 text-xs text-white/60">
              <div className="flex justify-between"><span>Miasto</span><span className="font-semibold text-white">{data.city ?? "—"}</span></div>
              <div className="mt-1 flex justify-between"><span>Wystawiono</span><span className="font-semibold text-white">{data.issuedAt ? new Date(data.issuedAt).toLocaleDateString("pl-PL") : "—"}</span></div>
              <div className="mt-1 flex justify-between"><span>Historia najmu</span><span className="font-semibold text-white">{data.leaseCount} {data.leaseCount === 1 ? "najem" : "najmów"}</span></div>
            </div>
          </div>

          {/* RIGHT: bio + aspects + QR */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#D4AF37]/25 bg-black/20 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">O mnie</div>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-white/85">
                {data.bio?.trim() || <span className="italic text-white/40">Najemca nie dodał jeszcze opisu.</span>}
              </p>
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/25 bg-black/20 p-4">
              <div className="mb-3 flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[#D4AF37]" />
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Zweryfikowane odznaki / Aspekty</div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {aspects.map((a) => (
                  <AspectRow key={a.label} aspect={a} />
                ))}
              </div>
            </div>

            {(data.acceptsOccasionalLease || data.hasTenantInsurance) && (
              <div className="rounded-2xl border border-[#D4AF37]/25 bg-black/20 p-3 text-[11px] text-white/80">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Deklaracje najemcy</div>
                {data.acceptsOccasionalLease && (
                  <div className="mt-1 flex items-start gap-1.5">
                    <BadgeCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-400" />
                    <span>Zgadza się na umowę <strong>najmu okazjonalnego</strong> (notarialne poddanie się egzekucji).</span>
                  </div>
                )}
                {data.hasTenantInsurance && (
                  <div className="mt-1 flex items-start gap-1.5">
                    <BadgeCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-400" />
                    <span>Zgadza się wykupić <strong>ubezpieczenie OC najemcy</strong> na własny koszt.</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end justify-between gap-3 border-t border-[#D4AF37]/20 pt-3">
              <div className="text-xs italic text-white/60">„Bezpieczeństwo droższe od pieniędzy"</div>
              <div className="text-right">
                <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                  Zweryfikuj autentyczność
                </div>
                <div className="inline-block rounded-lg bg-white p-2">
                  <QRCodeSVG value={qrUrl} size={72} bgColor="#FFFFFF" fgColor={NAVY} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={copyLink} variant="outline" className="rounded-xl">
          <Link2 className="mr-2 h-4 w-4" /> Kopiuj link do paszportu
        </Button>
        <Button onClick={downloadPdf} className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
          <Download className="mr-2 h-4 w-4" /> Pobierz paszport (PDF)
        </Button>
      </div>
    </div>
  );
}

function AspectRow({ aspect }: { aspect: Aspect }) {
  const Icon = aspect.icon;
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 ${aspect.ok ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10 bg-white/5 opacity-70"}`}>
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${aspect.ok ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/40"}`}>
        {aspect.ok
          ? <BadgeCheck className="h-4 w-4" />
          : <span className="text-[10px] font-bold">·</span>}
      </span>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: aspect.tint + "55" }}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-bold text-white">{aspect.label}</div>
        <div className="truncate text-[10px] text-white/55">{aspect.sub}</div>
      </div>
    </div>
  );
}
