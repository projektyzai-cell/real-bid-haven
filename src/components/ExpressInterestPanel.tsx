import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Loader2, CheckCircle2, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  passport_serial: string | null;
  passport_expires_at: string | null;
  trusted_tenant_score: number;
};

type Txn = { id: string; state: string; chat_id: string | null };

/**
 * Tenant-side widget on a rental listing detail page: shares the passport
 * snapshot with the landlord and tracks lease_transaction state.
 */
export function ExpressInterestPanel({
  listingId,
  userId,
  landlordId,
}: {
  listingId: string;
  userId: string;
  landlordId: string;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [txn, setTxn] = useState<Txn | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const isOwner = userId === landlordId;

  async function load() {
    setLoading(true);
    const [{ data: prof }, { data: existing }] = await Promise.all([
      supabase
        .from("profiles")
        .select("passport_serial,passport_expires_at,trusted_tenant_score")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("lease_transactions")
        .select("id,state,chat_id")
        .eq("tenant_id", userId)
        .eq("listing_id", listingId)
        .maybeSingle(),
    ]);
    setProfile((prof as Profile) ?? null);
    setTxn((existing as Txn) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    if (isOwner) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, listingId]);

  async function express() {
    setBusy(true);
    const { data, error } = await supabase.rpc("express_interest", {
      _listing_id: listingId,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Udostępniłeś Paszport — wynajmujący zobaczy Twój score.");
    if (data) load();
  }

  if (isOwner) return null;
  if (loading) {
    return (
      <div className="rounded-3xl border border-[var(--gold)]/30 bg-card p-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Sprawdzam Twój Paszport…
      </div>
    );
  }

  const hasPassport =
    profile?.passport_serial &&
    profile.passport_expires_at &&
    new Date(profile.passport_expires_at) > new Date();

  if (!hasPassport) {
    return (
      <div className="rounded-3xl border border-[var(--gold)]/30 bg-card p-6">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-5 w-5 text-gold" /> Wystaw Paszport, aby się zgłosić
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Aby wyrazić zainteresowanie, potrzebujesz aktywnego Paszportu StaySafe (ważnego 90 dni).
        </p>
        <Link to="/ustawienia">
          <Button className="mt-4 w-full rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
            Utwórz Paszport
          </Button>
        </Link>
      </div>
    );
  }

  if (txn && txn.state !== "cancelled") {
    const accepted = txn.state === "accepted" || txn.state === "chatting" || txn.state === "completed";
    return (
      <div className="rounded-3xl border border-[var(--gold)]/30 bg-card p-6">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-5 w-5 text-gold" />
          {accepted ? "Wynajmujący zaakceptował Twoje zgłoszenie" : "Paszport udostępniony"}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {accepted
            ? "Możesz teraz prowadzić rozmowę i ustalić szczegóły najmu."
            : "Czekasz na decyzję wynajmującego. Otrzymasz powiadomienie."}
        </p>
        {accepted && txn.chat_id && (
          <Link to="/najem/chats/$id" params={{ id: txn.chat_id }}>
            <Button className="mt-4 w-full rounded-xl">
              <MessageCircle className="mr-2 h-4 w-4" /> Otwórz czat
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[var(--gold)]/30 bg-card p-6">
      <div className="flex items-center gap-2 font-semibold">
        <ShieldCheck className="h-5 w-5 text-gold" /> Wyraź zainteresowanie
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Klikając poniżej udostępnisz wynajmującemu snapshot swojego Paszportu (numer + score + odznaki). Twoje dane wrażliwe pozostają prywatne.
      </p>
      <div className="mt-3 rounded-xl bg-background/40 p-3 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Numer Paszportu</span>
          <span className="font-mono font-semibold">{profile!.passport_serial}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-muted-foreground">Trusted Tenant Score</span>
          <span className="font-bold text-gold">{profile!.trusted_tenant_score}/100</span>
        </div>
      </div>
      <Button
        onClick={express}
        disabled={busy}
        className="mt-4 w-full rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90"
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
        Udostępnij Paszport i zgłoś się
      </Button>
    </div>
  );
}
