import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, ArrowLeft, Download, Loader2, Sparkles, Clock, FileQuestion } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/najem/moj-paszport")({
  head: () => ({ meta: [{ title: "Mój Paszport Najemcy — StaySafe" }] }),
  component: MyPassportPage,
});

type State = {
  status: string | null;
  score: number | null;
  pdf: string | null;
  serial: string | null;
  expires: string | null;
  displayName: string | null;
};

function MyPassportPage() {
  const { user } = useAuth();
  const [data, setData] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("passport_application_status,passport_score,passport_pdf_url,passport_serial,passport_expires_at,display_name")
      .eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setData(data ? {
          status: (data as { passport_application_status?: string }).passport_application_status ?? null,
          score: (data as { passport_score?: number }).passport_score ?? null,
          pdf: (data as { passport_pdf_url?: string }).passport_pdf_url ?? null,
          serial: data.passport_serial ?? null,
          expires: data.passport_expires_at ?? null,
          displayName: data.display_name ?? null,
        } : null);
        setLoading(false);
      });
  }, [user]);

  async function download() {
    if (!data?.pdf) return;
    const { data: signed } = await supabase.storage.from("passport-docs").createSignedUrl(data.pdf, 60 * 5);
    if (signed?.signedUrl) window.open(signed.signedUrl, "_blank");
  }

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

      {!loading && (!data || !data.status) && (
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

      {!loading && data?.status && data.status !== "approved" && (
        <div className="mt-8 rounded-3xl border border-amber-500/40 bg-amber-500/5 p-8 text-center shadow-card">
          <Clock className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mt-4 text-xl font-semibold">Twoja aplikacja jest w trakcie weryfikacji</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Administrator porównuje załączone dokumenty z Twoimi deklaracjami. Otrzymasz powiadomienie po zakończeniu procesu.
          </p>
        </div>
      )}

      {!loading && data?.status === "approved" && (
        <div className="mt-8 overflow-hidden rounded-3xl border border-[var(--gold)]/50 bg-gradient-to-br from-[#0B132B] to-[#101a3a] p-8 text-white shadow-[0_0_40px_-10px_rgba(212,175,55,0.5)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
              <span className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">Paszport Najemcy</span>
            </div>
            <span className="rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold uppercase text-[#D4AF37]">
              Zweryfikowano
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-[10px] uppercase text-white/60">Posiadacz</div>
              <div className="text-lg font-semibold">{data.displayName ?? "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-white/60">Identyfikator</div>
              <div className="font-mono text-sm font-semibold">{data.serial ?? "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-white/60">Ważny do</div>
              <div className="text-sm font-semibold">
                {data.expires ? new Date(data.expires).toLocaleDateString("pl-PL") : "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-white/60">Trusted Tenant Score</div>
              <div className="text-2xl font-bold text-[#D4AF37]">{data.score ?? "—"}/100</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={download} disabled={!data.pdf}
              className="rounded-xl bg-[#D4AF37] font-bold uppercase tracking-wide text-[#0B132B] hover:opacity-90">
              <Download className="mr-2 h-4 w-4" /> Pobierz paszport (PDF)
            </Button>
            {!data.pdf && <span className="self-center text-xs text-white/60">Plik PDF zostanie wygenerowany wkrótce.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
