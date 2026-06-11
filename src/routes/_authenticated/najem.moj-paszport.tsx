import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, ArrowLeft, Loader2, Sparkles, Clock, FileQuestion } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TenantPassportCard, type PassportData } from "@/components/TenantPassportCard";

export const Route = createFileRoute("/_authenticated/najem/moj-paszport")({
  head: () => ({ meta: [{ title: "Mój Paszport Najemcy — StaySafe" }] }),
  component: MyPassportPage,
});

function MyPassportPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [leaseCount, setLeaseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      const { count } = await supabase.from("lease_history_entries")
        .select("*", { count: "exact", head: true }).eq("user_id", user.id);
      setProfile(data);
      setLeaseCount(count ?? 0);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Link to="/najem" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Powrót do Strefy najmu
      </Link>
      <div className="mt-3 flex items-center gap-2">
        <ShieldCheck className="h-7 w-7 text-gold" />
        <h1 className="text-3xl font-semibold tracking-tight">Mój Paszport Najemcy</h1>
      </div>

      {loading && (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Ładuję paszport…
        </div>
      )}

      {!loading && (!profile || !profile.passport_application_status) && (
        <div className="mt-8 rounded-3xl border border-[var(--gold)]/30 bg-card p-8 text-center shadow-card">
          <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Nie złożyłeś jeszcze aplikacji o Paszport Najemcy</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Wypełnij szczegółowy profil i kliknij „Aplikuj o Paszport Najemcy StaySafe", aby uruchomić weryfikację.
          </p>
          <Link to="/najem/paszport"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[var(--gold)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
            <Sparkles className="h-4 w-4" /> Stwórz swój Paszport
          </Link>
        </div>
      )}

      {!loading && profile?.passport_application_status === "submitted" && (
        <div className="mt-8 rounded-3xl border border-amber-500/40 bg-amber-500/5 p-8 text-center shadow-card">
          <Clock className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mt-4 text-xl font-semibold">Twoja aplikacja jest w trakcie weryfikacji</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Administrator porównuje załączone dokumenty z Twoimi deklaracjami. Otrzymasz powiadomienie po zakończeniu procesu.
          </p>
        </div>
      )}

      {!loading && profile?.passport_application_status === "approved" && (
        <div className="mt-8">
          <TenantPassportCard data={toPassport(profile, leaseCount)} />
        </div>
      )}
    </div>
  );
}

function toPassport(p: any, leaseCount: number): PassportData {
  return {
    displayName: p.display_name ?? "—",
    serial: p.passport_serial ?? "—",
    issuedAt: p.passport_issued_at ?? p.passport_generated_at,
    expiresAt: p.passport_expires_at,
    score: p.passport_score ?? 0,
    identityVerified: !!p.passport_name_verified,
    incomeVerified: !!p.passport_income_verified,
    contractValid: !!p.passport_contract_valid,
    socialVerified: !!p.passport_social_verified,
    leaseCount,
    socials: {
      linkedin: p.linkedin_url,
      facebook: p.social_facebook_url,
      instagram: p.instagram_username,
    },
    city: p.passport_city ?? p.home_city,
  };
}
