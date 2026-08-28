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
}

export function PaymentTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order('id', { ascending: false });
      
      if (error) {
        console.error("Błąd pobierania płatności:", error);
        setErrorMessage(error.message);
      } else if (data) {
        setPayments(data);
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

      {errorMessage && (
        <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
          <strong>Błąd bazy danych:</strong> {errorMessage} (Może to oznaczać brak uprawnień RLS dla administratora w tabeli payments).
        </div>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Płatności</TableHead>
              <TableHead>Użytkownik (ID)</TableHead>
              <TableHead>Typ (Kind)</TableHead>
              <TableHead>Target ID</TableHead>
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
                  Brak płatności w bazie lub brak uprawnień do ich odczytu.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id.slice(0, 8)}...</TableCell>
                  <TableCell className="font-mono text-xs">{p.user_id}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                      {p.kind}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {p.target_id ? `${p.target_id.slice(0, 8)}...` : "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {p.amount} {p.currency}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
