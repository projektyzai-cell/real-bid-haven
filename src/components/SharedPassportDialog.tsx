import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { TenantPassportCard, type PassportData } from "@/components/TenantPassportCard";
import { toast } from "sonner";

export function SharedPassportDialog({
  transactionId,
  chatId,
  open,
  onClose,
}: {
  transactionId?: string;
  chatId?: string;
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      const call = chatId
        ? supabase.rpc("get_shared_passport_by_chat" as never, { _chat_id: chatId } as never)
        : supabase.rpc("get_shared_passport" as never, { _transaction_id: transactionId } as never);
      const { data: rows, error } = await call;
      setLoading(false);
      if (error) {
        toast.error(error.message);
        onClose();
        return;
      }
      const r = (rows as any[])?.[0];
      if (!r) {
        toast.error("Brak paszportu do wyświetlenia");
        onClose();
        return;
      }
      setData({
        displayName: r.display_name ?? "—",
        serial: r.passport_serial ?? "—",
        issuedAt: r.passport_issued_at,
        expiresAt: r.passport_expires_at,
        score: r.passport_score ?? 0,
        identityVerified: !!r.passport_name_verified,
        incomeVerified: !!r.passport_income_verified,
        contractValid: !!r.passport_contract_valid,
        socialVerified: !!r.passport_social_verified,
        leaseCount: r.lease_count ?? 0,
        internalLeaseCount: r.internal_lease_count ?? undefined,
        socials: {
          linkedin: r.linkedin_url,
          facebook: r.social_facebook_url,
          instagram: r.instagram_username,
        },
        city: r.passport_city ?? r.home_city,
        acceptsOccasionalLease: !!r.accepts_notarial_lease,
        acceptsOneMonthDeposit: !!r.accepts_one_month_deposit,
        isStudent: !!r.is_student,
        hasGuarantor: !!r.has_guarantor,
        hasTenantInsurance: !!(r.has_tenant_insurance || r.willing_tenant_insurance),
        bio: r.personal_bio_pl ?? null,
        avatarUrl: r.avatar_url ?? null,
        contactVerified: true,
        educationVerified: false,
        creditScoreVerified: false,
      });
    })();
  }, [open, transactionId, chatId, onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            Paszport Najemcy udostępniony w tej transakcji
          </DialogTitle>
        </DialogHeader>
        {loading || !data ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Ładuję paszport…
          </div>
        ) : (
          <TenantPassportCard data={data} />
        )}
      </DialogContent>
    </Dialog>
  );
}
