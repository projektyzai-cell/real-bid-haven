import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, BadgeCheck, MessageCircle, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/najem/zainteresowani")({
  head: () => ({ meta: [{ title: "Zainteresowani najemcy — StaySafe" }] }),
  component: InterestedTenantsPage,
});

type PassportInfo = {
  display_name: string;
  trusted_tenant_score: number;
  verified_linkedin: boolean;
  verified_income: boolean;
  verified_past_contract: boolean;
  verified_identity: boolean;
  passport_expires_at: string | null;
  is_expired: boolean;
};

type Txn = {
  id: string;
  state: string;
  listing_id: string | null;
  request_id: string | null;
  tenant_id: string;
  passport_serial_snapshot: string | null;
  passport_shared_at: string | null;
  accepted_at: string | null;
  chat_id: string | null;
  created_at: string;
};

function InterestedTenantsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState<string | null>(null);

  const { data: rows = [], refetch } = useQuery({
    queryKey: ["lease-txns-landlord", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lease_transactions")
        .select("id,state,listing_id,request_id,tenant_id,passport_serial_snapshot,passport_shared_at,accepted_at,chat_id,created_at")
        .eq("landlord_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const txns = (data ?? []) as Txn[];

      // Hydrate passport + listing snippets in parallel
      const serials = Array.from(new Set(txns.map((t) => t.passport_serial_snapshot).filter(Boolean))) as string[];
      const listingIds = Array.from(new Set(txns.map((t) => t.listing_id).filter(Boolean))) as string[];

      const [passports, listings] = await Promise.all([
        Promise.all(
          serials.map(async (s) => {
            const { data } = await supabase.rpc("lookup_passport", { _serial: s });
            return [s, (data as PassportInfo[] | null)?.[0] ?? null] as const;
          }),
        ),
        listingIds.length
          ? supabase.from("rental_listings").select("id,title,city,monthly_price").in("id", listingIds)
          : Promise.resolve({ data: [] as { id: string; title: string; city: string; monthly_price: number }[] }),
      ]);

      const passportMap = new Map(passports);
      const listingMap = new Map((listings.data ?? []).map((l) => [l.id, l]));
      return txns.map((t) => ({
        ...t,
        passport: t.passport_serial_snapshot ? passportMap.get(t.passport_serial_snapshot) ?? null : null,
        listing: t.listing_id ? listingMap.get(t.listing_id) ?? null : null,
      }));
    },
  });

  async function accept(t: { id: string; chat_id: string | null }) {
    setAccepting(t.id);
    const { error } = await supabase.rpc("accept_tenant", { _transaction_id: t.id });
    setAccepting(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Najemca zaakceptowany — możesz rozpocząć rozmowę.");
    refetch();
  }

  const grouped = {
    new: rows.filter((r) => r.state === "interested_passport_shared"),
    accepted: rows.filter((r) => r.state === "accepted" || r.state === "chatting" || r.state === "completed"),
    closed: rows.filter((r) => r.state === "cancelled"),
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-gold" />
        <h1 className="text-3xl font-bold">Zainteresowani najemcy</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Każdy najemca, który zgłosił zainteresowanie, udostępnił Ci snapshot swojego Paszportu StaySafe — wraz ze Trusted Tenant Score i odznakami weryfikacji.
      </p>

      <Section title="Nowe zgłoszenia" count={grouped.new.length}>
        {grouped.new.map((t) => (
          <TenantRow key={t.id} t={t} onAccept={() => accept(t)} busy={accepting === t.id} />
        ))}
      </Section>

      <Section title="Zaakceptowani / w rozmowie" count={grouped.accepted.length}>
        {grouped.accepted.map((t) => (
          <TenantRow
            key={t.id}
            t={t}
            cta={
              t.chat_id ? (
                <Button size="sm" className="rounded-xl" onClick={() => navigate({ to: "/najem/chats/$id", params: { id: t.chat_id! } })}>
                  <MessageCircle className="h-4 w-4" /> Otwórz czat
                </Button>
              ) : (
                <Badge className="rounded-full">Zaakceptowany</Badge>
              )
            }
          />
        ))}
      </Section>

      {rows.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed bg-card/40 p-12 text-center text-muted-foreground">
          Nikt jeszcze nie wyraził zainteresowania Twoimi ofertami.
        </div>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {title} <span className="text-gold">({count})</span>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

type RowProps = {
  t: {
    id: string;
    passport_serial_snapshot: string | null;
    passport_shared_at: string | null;
    passport: PassportInfo | null;
    listing: { id: string; title: string; city: string; monthly_price: number } | null;
  };
  onAccept?: () => void;
  busy?: boolean;
  cta?: React.ReactNode;
};

function TenantRow({ t, onAccept, busy, cta }: RowProps) {
  const p = t.passport;
  return (
    <div className="rounded-2xl border border-[var(--gold)]/30 bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{p?.display_name ?? "Najemca"}</span>
            <span className="font-mono text-xs text-muted-foreground">{t.passport_serial_snapshot}</span>
            {p?.is_expired ? (
              <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">
                Paszport wygasł
              </span>
            ) : p ? (
              <span className="rounded-full border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-gold">
                Aktywny
              </span>
            ) : null}
          </div>
          {t.listing && (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {t.listing.title} · {t.listing.city} · {formatPLN(t.listing.monthly_price)}/mc
            </div>
          )}
          {p && (
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <Chip ok={p.verified_identity} label="Tożsamość" />
              <Chip ok={p.verified_linkedin} label="LinkedIn" />
              <Chip ok={p.verified_income} label="Dochód" />
              <Chip ok={p.verified_past_contract} label="Poprzednia umowa" />
            </div>
          )}
          {t.passport_shared_at && (
            <div className="mt-2 text-[11px] text-muted-foreground">
              Udostępniono: {new Date(t.passport_shared_at).toLocaleString("pl-PL")}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {p && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
              <div className="text-2xl font-black text-gold">{p.trusted_tenant_score}<span className="text-xs text-muted-foreground">/100</span></div>
            </div>
          )}
          {cta ?? (onAccept && (
            <Button onClick={onAccept} disabled={busy || !p || p.is_expired} className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
              Akceptuj najemcę
            </Button>
          ))}
          {t.listing && (
            <Link to="/najem/oferty/$id" params={{ id: t.listing.id }} className="text-[11px] text-muted-foreground hover:underline">
              Zobacz ofertę →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wide ${ok ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-gold" : "border-border bg-card/40 text-muted-foreground"}`}>
      {ok ? "✓" : "·"} {label}
    </span>
  );
}
