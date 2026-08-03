import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPaymentStatus } from "@/lib/mollie.functions";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/platnosc/status")({
  head: () => ({
    meta: [
      { title: "Status płatności — Stay Safe" },
      { name: "description", content: "Potwierdzenie płatności za usługi Stay Safe: promowanie oferty, odnowienie Paszportu Najemcy i powiadomienia SMS." },
      { property: "og:title", content: "Status płatności — Stay Safe" },
      { property: "og:description", content: "Potwierdzenie płatności za usługi Stay Safe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ p: typeof s['p'] === "string" ? (s['p'] as string) : "" }),
  component: PaymentStatusPage,
});

function PaymentStatusPage() {
  const { p } = useSearch({ from: "/platnosc/status" });
  const fetchStatus = useServerFn(getPaymentStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["payment-status", p],
    enabled: !!p,
    refetchInterval: (q) => ((q.state.data as any)?.status === "paid" ? false : 3000),
    queryFn: () => fetchStatus({ data: { paymentId: p } }),
  });

  const status = data?.status;
  const paid = status === "paid";
  const failed = status === "failed" || status === "canceled" || status === "expired";

  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <div className="rounded-3xl border bg-card p-8 text-center shadow-card">
        {isLoading || (!paid && !failed) ? (
          <>
            {isLoading ? (
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
            ) : (
              <Clock className="mx-auto h-10 w-10 text-amber-500" />
            )}
            <h1 className="mt-4 text-2xl font-semibold">Potwierdzamy płatność…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              To może potrwać kilkanaście sekund. Strona odświeży się automatycznie.
            </p>
          </>
        ) : paid ? (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h1 className="mt-4 text-2xl font-semibold">Płatność zaksięgowana</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {data?.description} — {formatPLN(Number(data?.amount ?? 0))}. Usługa została aktywowana.
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-4 text-2xl font-semibold">Płatność nie doszła do skutku</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Płatność została anulowana lub wygasła. Możesz spróbować ponownie.
            </p>
          </>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/najem">
            <Button variant="outline" className="rounded-xl">Wróć do najmu</Button>
          </Link>
          {data?.kind === "listing_promotion" && (
            <Link to="/najem/moje-oferty"><Button className="rounded-xl">Moje oferty</Button></Link>
          )}
          {data?.kind === "smart_match_sms" && (
            <Link to="/najem/moje-zapytania"><Button className="rounded-xl">Moje zapytania</Button></Link>
          )}
          {data?.kind === "passport_renewal" && (
            <Link to="/najem/moj-paszport"><Button className="rounded-xl">Mój paszport</Button></Link>
          )}
        </div>
      </div>
    </div>
  );
}
