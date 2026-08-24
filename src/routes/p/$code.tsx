import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, AlertCircle, Download, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TenantPassportCard, type PassportData } from "@/components/TenantPassportCard";

export const Route = createFileRoute("/p/$code")({
  head: () => ({ meta: [{ title: "Paszport Najemcy — StaySafe" }] }),
  component: PublicPassportPage,
});

function PublicPassportPage() {
  const { code } = Route.useParams();

  const { data: passportPayload, isLoading, error } = useQuery({
    queryKey: ["public-passport", code],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("passport_serial", code)
        .eq("passport_application_status", "approved")
        .maybeSingle();

      if (profileError || !profile) {
        throw profileError || new Error("Nie znaleziono paszportu");
      }

      const { count: extCount } = await supabase
        .from("lease_history_entries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);

      const { count: intCount } = await supabase
        .from("lease_transactions")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", profile.id)
        .eq("state", "completed");

      return toPassport(profile, extCount ?? 0, intCount ?? 0);
    },
  });

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Paszport Najemcy Stay Safe", url: window.location.href });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Skopiowano link do schowka!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  if (error || !passportPayload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] px-4">
        <div className="mx-auto max-w-md rounded-3xl border border-[var(--gold)]/35 bg-card p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold text-white">Nie znaleziono paszportu</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Podany kod paszportu ({code}) jest nieaktywny, nieprawidłowy lub uległ przedawnieniu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-foreground py-10 px-4">
      {/* PANCERNE STYLE DLA DRUKU / PDF */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          body, html {
            background-color: #070a12 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
          }
          /* Ukrywamy absolutnie wszystko na stronie... */
          body * {
            visibility: hidden !important;
          }
          /* ...poza samym kontenerem karty paszportu i jego zawartością */
          .print-card-wrapper, .print-card-wrapper * {
            visibility: visible !important;
          }
          .print-card-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            zoom: 55% !important; /* Idealne pomniejszenie mieszczące całą kartę bez ucinania */
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="container mx-auto max-w-3xl">
        
        {/* Górny pasek akcji (ukrywany przy wydruku) */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[var(--gold)]" />
            <span className="font-bold tracking-tight text-white">Stay Safe — Paszport Najemcy</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleShare} 
              variant="outline" 
              size="sm"
              className="gap-1.5 rounded-full border-[var(--gold)]/40 bg-card text-foreground hover:bg-[var(--gold)]/10"
            >
              <Share2 className="h-3.5 w-3.5" /> Kopiuj link
            </Button>
            <Button 
              onClick={handlePrint} 
              variant="outline" 
              size="sm"
              className="gap-1.5 rounded-full border-[var(--gold)]/40 bg-card text-foreground hover:bg-[var(--gold)]/10"
            >
              <Download className="h-3.5 w-3.5" /> Pobierz PDF
            </Button>
          </div>
        </div>

        {/* KARTA PASZPORTU W IZOLOWANYM KONTENERZE DO DRUKU */}
        <div className="print-card-wrapper">
          <TenantPassportCard data={passportPayload} />
        </div>

      </div>
    </div>
  );
}

function toPassport(p: any, externalLeaseCount: number, internalLeaseCount: number): PassportData {
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
    leaseCount: externalLeaseCount,
    internalLeaseCount,
    socials: {
      linkedin: p.linkedin_url,
      facebook: p.social_facebook_url,
      instagram: p.instagram_username,
    },
    city: p.passport_city ?? p.home_city,
    acceptsOccasionalLease: !!p.accepts_notarial_lease,
    acceptsOneMonthDeposit: !!p.accepts_one_month_deposit,
    isStudent: !!p.is_student,
    hasGuarantor: !!p.has_guarantor,
    hasTenantInsurance: !!(p.has_tenant_insurance || p.willing_tenant_insurance),
    bio: p.personal_bio_pl ?? null,
    avatarUrl: p.avatar_url ?? null,
    contactVerified: true,
    educationVerified: false,
    creditScoreVerified: false,
  };
}
