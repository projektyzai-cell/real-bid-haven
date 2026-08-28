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
  profiles?: {
    full_name?: string | null;
    email?: string | null;
  } | null;
  rental_listings?: {
    title?: string | null;
  } | null;
}

export function PaymentTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      // Pobieramy płatności wraz z powiązanym profilem użytkownika oraz ogłoszeniem
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          user_id,
          kind,
          target_id,
          amount,
          currency,
          profiles:user_id (full_name, email),
          rental_listings:target_id (title)
        `)
        .order('id', { ascending: false });
      
      if (!error && data) {
        setPayments(data as unknown as Payment[]);
      }
      setLoading(false);
    }
    fetchPayments();
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
              <TableHead>ID Płatności</TableHead>
              <TableHead>Użytkownik</TableHead>
              <TableHead>Typ (Kind)</TableHead>
              <TableHead>Powiązany obiekt (Target)</TableHead>
              <TableHead>Kwota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Ładowanie płatności...
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Brak płatności w bazie.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => {
                const userName = p.profiles?.full_name || p.profiles?.email || p.user_id;
                const targetName = p.rental_listings?.title || (p.target_id ? `ID: ${p.target_id.slice(0, 8)}...` : "-");

                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium text-sm">
                      {userName}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                        {p.kind}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {targetName}
                    </TableCell>
                    <TableCell className="font-medium">
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
