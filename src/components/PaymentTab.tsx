import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Payment {
  id: string;
  user_id: string;
  kind: string;
  target_id: string | null;
  amount: number;
  currency: string;
  description: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  display_name: string | null;
}

interface Listing {
  id: string;
  title: string | null;
}

export function PaymentTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, Profile>>(new Map());
  const [listingsMap, setListingsMap] = useState<Map<string, Listing>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: paymentsData, error } = await supabase
        .from("payments")
        .select("*")
        .order('created_at', { ascending: false });
      
      if (error || !paymentsData) {
        setLoading(false);
        return;
      }

      setPayments(paymentsData);

      const userIds = Array.from(new Set(paymentsData.map(p => p.user_id).filter((id): id is string => Boolean(id))));
      const targetIds = Array.from(new Set(paymentsData.map(p => p.target_id).filter((id): id is string => Boolean(id))));

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);

        if (profilesData) {
          const map = new Map<string, Profile>();
          profilesData.forEach(p => map.set(p.id, p));
          setProfilesMap(map);
        }
      }

      if (targetIds.length > 0) {
        const { data: listingsData } = await supabase
          .from("rental_listings")
          .select("id, title")
          .in("id", targetIds);

        if (listingsData) {
          const map = new Map<string, Listing>();
          listingsData.forEach(l => map.set(l.id, l));
          setListingsMap(map);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Zarządzanie płatnościami</h2>
        <p className="text-muted-foreground">Panel obsługi płatności i transakcji użytkowników.</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Użytkownik</TableHead>
              <TableHead>Opis / Typ</TableHead>
              <TableHead>Powiązany obiekt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Kwota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Ładowanie płatności...
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Brak płatności w bazie.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => {
                const profile = profilesMap.get(p.user_id);
                const userName = profile?.display_name || profile?.full_name || profile?.email || "Nieznany użytkownik";

                let targetName = "-";
                if (p.target_id) {
                  const listing = listingsMap.get(p.target_id);
                  targetName = listing?.title || `Obiekt ID: ${p.target_id.slice(0, 6)}...`;
                }

                const isPaid = !!p.paid_at;
                const formattedDate = new Date(p.created_at).toLocaleDateString("pl-PL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formattedDate}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {userName}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                          {p.kind}
                        </span>
                        {p.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={p.description}>
                            {p.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={targetName}>
                      {targetName}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        isPaid ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}>
                        {isPaid ? "Opłacona" : "Oczekująca"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {p.amount} {p.currency}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
