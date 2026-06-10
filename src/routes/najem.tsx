import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, KeyRound, Building, ArrowRight, Search, Sparkles, Users, Globe, Linkedin, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatPLN } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/najem")({
  head: () => ({
    meta: [
      { title: "StaySafe — bezpieczeństwo droższe od pieniędzy" },
      { name: "description", content: "StaySafe to PropTech OS: weryfikacja RODO, paszport najemcy, dopasowanie zamiast spamu i 360° obsługa najmu. Zamknięty, bezpieczny ekosystem zaufania." },
      { property: "og:title", content: "StaySafe — bezpieczeństwo droższe od pieniędzy" },
      { property: "og:description", content: "Paszport najemcy, weryfikacja RODO, dopasowanie zamiast spamu." },
    ],
  }),
  component: NajemHub,
});

type Promo = {
  id: string; title: string; city: string; street: string;
  monthly_price: number; area_m2: number; rooms: number;
  images: string[]; main_image_index: number;
};

function NajemHub() {
  return (
    <div className="relative">
      <Hero />
      <RoleCards />
      <QuickVerify />
      <HowItWorks />
      <PromotedStrip />
    </div>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient gold glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1200px] -translate-x-1/2 rounded-full bg-[var(--gold)]/15 blur-3xl" />
      <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:py-20">
        {/* Left */}
        <div className="relative flex items-center gap-6 lg:gap-8">
          <SealBadge />
          <div className="min-w-0">
            <div className="text-sm font-medium tracking-wide text-gold">staysafe.pl:</div>
            <h1 className="mt-2 text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
              Bezpieczeństwo<br />droższe od<br />
              <span className="bg-gradient-to-r from-[var(--gold)] to-amber-300 bg-clip-text text-transparent">pieniędzy.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Dopasowanie, weryfikacja RODO i 360° obsługa najmu.<br />
              Zamknięty, bezpieczny ekosystem zaufania.
            </p>
          </div>
        </div>
        {/* Right — Passport card */}
        <div className="relative flex items-center justify-center">
          <PassportCard />
        </div>
      </div>
    </section>
  );
}

function SealBadge() {
  return (
    <div className="relative hidden h-32 w-32 shrink-0 sm:block lg:h-40 lg:w-40">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-[var(--gold)] to-amber-700 shadow-[0_10px_40px_-5px_rgba(212,175,55,0.6)]" />
      <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600" />
      <div className="absolute inset-3 grid place-items-center rounded-full border-2 border-amber-900/30 bg-gradient-to-br from-amber-200 to-[var(--gold)] text-center">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-amber-950">Stay</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-amber-950">Safe</div>
          <CheckCircle2 className="mx-auto mt-1 h-5 w-5 text-amber-950" strokeWidth={3} />
          <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-amber-950">Verified</div>
        </div>
      </div>
    </div>
  );
}

function PassportCard() {
  return (
    <div className="relative w-full max-w-md rotate-[-3deg] transition hover:rotate-0">
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[var(--gold)]/40 via-transparent to-[var(--gold)]/30 blur-2xl" />
      <div className="glass-strong relative rounded-3xl border-2 border-[var(--gold)]/40 p-6 shadow-glow">
        <div className="absolute right-4 top-4 rounded-full border border-[var(--gold)]/40 px-2 py-0.5 text-[10px] font-bold tracking-wider text-gold">PL/EN</div>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 rotate-[-90deg] origin-left whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.3em] text-gold/80">
          Tenant Passport
        </div>
        <div className="ml-6 flex items-center gap-5">
          <ScoreRing score={88} />
          <div className="min-w-0">
            <div className="truncate text-xl font-bold">Jan Kowalski</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-muted-foreground">Weryfikacja:</span>
              <span className="font-semibold text-emerald-400">Dobre</span>
            </div>
            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Verified Badges</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <MiniBadge icon={<Linkedin className="h-3 w-3" />} label="LinkedIn" tone="blue" />
                <MiniBadge label="Income" tone="emerald" />
                <MiniBadge label="Past Contract" tone="amber" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 32; const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={r} stroke="currentColor" strokeWidth="6" className="text-muted/40" fill="none" />
        <circle cx="40" cy="40" r={r} stroke="url(#gradTeal)" strokeWidth="6" strokeLinecap="round" fill="none"
          strokeDasharray={c} strokeDashoffset={offset} />
        <defs>
          <linearGradient id="gradTeal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-lg font-black leading-none">{score}<span className="text-xs">/100</span></div>
          <div className="mt-0.5 text-[7px] font-semibold uppercase tracking-wider text-muted-foreground">Trusted<br/>Tenant<br/>Score</div>
        </div>
      </div>
    </div>
  );
}

function MiniBadge({ icon, label, tone }: { icon?: React.ReactNode; label: string; tone: "blue" | "emerald" | "amber" }) {
  const map = {
    blue: "bg-blue-500/15 text-blue-300 border-blue-400/30",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    amber: "bg-amber-500/15 text-amber-200 border-amber-400/30",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${map[tone]}`}>
      {icon}{label}
    </span>
  );
}

/* ---------- Role cards ---------- */
function RoleCards() {
  return (
    <section className="container mx-auto grid gap-5 px-4 pb-8 md:grid-cols-2 md:gap-6">
      <RoleCard
        to="/najem/nowe-zapytanie"
        icon={<KeyRound className="h-6 w-6 text-gold" />}
        eyebrow="Jestem najemcą"
        title="Zbuduj swój Paszport Najemcy"
        desc="Pokaż transparentną deklarację weryfikacji tożsamości, dochodów i household profilu."
        cta="Stwórz swój paszport"
      />
      <RoleCard
        to="/najem/nowa-oferta"
        icon={<Building className="h-6 w-6 text-gold" />}
        eyebrow="Jestem wynajmującym"
        title="Wystaw ofertę i rekrutuj lokatorów"
        desc="Uzyskaj dostęp do zweryfikowanych profili i historii najmu w 100% bezpiecznie."
        cta="Wystaw ofertę i zarządzaj"
      />
    </section>
  );
}

function RoleCard({ to, icon, eyebrow, title, desc, cta }: {
  to: "/najem/nowe-zapytanie" | "/najem/nowa-oferta";
  icon: React.ReactNode; eyebrow: string; title: string; desc: string; cta: string;
}) {
  return (
    <Link to={to} className="group relative block">
      <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-[var(--gold)]/40 via-transparent to-[var(--gold)]/20 opacity-60 blur transition group-hover:opacity-100" />
      <div className="glass relative h-full rounded-3xl p-6 transition group-hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--gold)]/30 bg-background/40 backdrop-blur">
            {icon}
          </div>
          <span className="rounded-full border border-[var(--gold)]/40 px-2 py-0.5 text-[10px] font-bold tracking-wider text-gold">PL/EN</span>
        </div>
        <div className="mt-4 text-lg font-semibold text-foreground/90">{eyebrow}</div>
        <h3 className="mt-2 text-base font-black uppercase tracking-wide">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-gold transition group-hover:bg-[var(--gold)] group-hover:text-[var(--gold-foreground)]">
          {cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

/* ---------- Quick verify widget ---------- */
type PassportLookup = {
  display_name: string;
  trusted_tenant_score: number;
  verified_linkedin: boolean;
  verified_income: boolean;
  verified_past_contract: boolean;
  verified_identity: boolean;
  passport_expires_at: string | null;
  is_expired: boolean;
};

function QuickVerify() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ serial: string; data: PassportLookup | null } | null>(null);

  async function check() {
    const trimmed = q.trim().toUpperCase();
    if (!trimmed) return toast.error("Wpisz numer paszportu (np. SS-XXXXXXXX)");
    setBusy(true);
    const { data, error } = await supabase.rpc("lookup_passport", { _serial: trimmed });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const row = (data as PassportLookup[] | null)?.[0] ?? null;
    setResult({ serial: trimmed, data: row });
  }

  return (
    <section className="container mx-auto px-4 py-4">
      <div className="glass flex flex-col gap-3 rounded-2xl border border-[var(--gold)]/30 p-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2 px-2 text-sm font-semibold sm:shrink-0">
          <ShieldCheck className="h-5 w-5 text-gold" />
          Sprawdź Paszport StaySafe
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Numer paszportu (np. SS-XXXXXXXX)"
            className="rounded-xl border-border bg-background/40 pl-9 font-mono uppercase"
          />
        </div>
        <Button
          onClick={check}
          disabled={busy}
          className="rounded-xl bg-navy text-navy-foreground hover:opacity-90 sm:shrink-0"
        >
          {busy ? "Sprawdzam…" : "Sprawdź Paszport"}
        </Button>
      </div>
      {result && (
        <div className="mt-3 rounded-2xl border border-[var(--gold)]/30 bg-card/40 p-4 text-sm">
          {!result.data ? (
            <div className="text-muted-foreground">
              Nie znaleziono aktywnego paszportu dla <span className="font-mono font-semibold text-foreground">{result.serial}</span>.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{result.data.display_name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{result.serial}</span>
                  {result.data.is_expired ? (
                    <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">
                      Wygasł
                    </span>
                  ) : (
                    <span className="rounded-full border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-gold">
                      Aktywny
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  <Badge ok={result.data.verified_identity} label="Tożsamość" />
                  <Badge ok={result.data.verified_linkedin} label="LinkedIn" />
                  <Badge ok={result.data.verified_income} label="Dochód" />
                  <Badge ok={result.data.verified_past_contract} label="Poprzednia umowa" />
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
                <div className="text-2xl font-black text-gold">{result.data.trusted_tenant_score}<span className="text-sm text-muted-foreground">/100</span></div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wide ${ok ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-gold" : "border-border bg-card/40 text-muted-foreground"}`}>
      {ok ? "✓" : "·"} {label}
    </span>
  );
}

/* ---------- How it works ---------- */
function HowItWorks() {
  const items = [
    { icon: <Users className="h-4 w-4" />, label: "Dopasowanie zamiast spamu" },
    { icon: <ShieldCheck className="h-4 w-4" />, label: "Paszport zaufania" },
    { icon: <Globe className="h-4 w-4" />, label: "Obsługa 360°", suffix: "PL/EN" },
  ];
  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-xs sm:text-sm">
        <span className="mr-2 text-muted-foreground">Jak to działa</span>
        {items.map((it, i) => (
          <span key={it.label} className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 font-semibold uppercase tracking-wide">
              {it.icon}{it.label}
              {it.suffix && <span className="ml-1 rounded-full bg-[var(--gold)]/15 px-1.5 py-0.5 text-[9px] text-gold">{it.suffix}</span>}
            </span>
            {i < items.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------- Promoted listings (kept from previous) ---------- */
function PromotedStrip() {
  const { data: promoted = [] } = useQuery({
    queryKey: ["promoted-rentals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rental_listings" as never)
        .select("id,title,city,street,monthly_price,area_m2,rooms,images,main_image_index")
        .eq("promoted", true).eq("status", "active").gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as Promo[];
    },
  });

  if (promoted.length === 0) {
    return (
      <section className="container mx-auto px-4 py-10 text-center">
        <Link to="/najem/oferty" className="text-sm text-gold underline-offset-4 hover:underline">
          Lub przeglądaj wszystkie aktywne oferty najmu →
        </Link>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-5 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-gold" />
        <h2 className="text-xl font-bold tracking-tight">Promowane oferty najmu</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {promoted.map((r) => {
          const main = r.images?.[r.main_image_index] ?? r.images?.[0];
          return (
            <Link key={r.id} to="/najem/oferty/$id" params={{ id: r.id }}
              className="group overflow-hidden rounded-3xl border border-[var(--gold)]/30 bg-card/60 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow">
              {main ? <img src={main} alt="" className="aspect-[16/10] w-full object-cover transition group-hover:scale-105" /> : <div className="aspect-[16/10] bg-muted" />}
              <div className="space-y-2 p-4">
                <Badge className="rounded-full bg-[var(--gold)]/20 text-gold"><Sparkles className="h-3 w-3" /> Promowane</Badge>
                <h3 className="line-clamp-1 font-semibold">{r.title}</h3>
                <div className="text-xs text-muted-foreground">{r.city} · {r.street}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{r.rooms} pok. · {r.area_m2} m²</span>
                  <span className="font-bold text-gold">{formatPLN(r.monthly_price)} / mc</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
