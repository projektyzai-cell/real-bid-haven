import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client"; 

export function PaymentDelaysTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        // Pobieramy zgłoszenia WRAZ z tytułem i miastem nieruchomości
        const { data, error } = await supabase
          .from("lease_transactions") 
          .select(`
            id,
            request_id,
            payment_delay_reported_at,
            created_at,
            listings (
              title,
              city
            )
          `)
          .not("payment_delay_reported_at", "is", null)
          .order("payment_delay_reported_at", { ascending: false });

        if (error) {
          console.error("Błąd pobierania zgłoszeń:", error);
        } else {
          setTransactions(data || []);
        }
      } catch (err) {
        console.error("Wystąpił błąd:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Opóźnienia w płatnościach</h2>
      <p className="text-muted-foreground">Panel monitorowania zgłoszonych opóźnień i zaległości.</p>

      {loading ? (
        <p>Ładowanie danych z bazy...</p>
      ) : transactions.length === 0 ? (
        <p className="text-sm text-gray-500">Brak zgłoszonych opóźnień w płatnościach.</p>
      ) : (
        <div className="border rounded-md overflow-hidden bg-card overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <th className="p-3">Nieruchomość</th>
                <th className="p-3">Powiązana umowa / wniosek</th>
                <th className="p-3">Data zgłoszenia opóźnienia</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id} className="border-b text-sm hover:bg-muted/30">
                  <td className="p-3 font-medium">
                    {item.listings?.title ? (
                      <div>
                        <span className="text-primary font-semibold">{item.listings.title}</span>
                        {item.listings.city && <span className="block text-xs text-muted-foreground">{item.listings.city}</span>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Brak przypisanej nieruchomości</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono bg-muted text-foreground">
                      {item.request_id ? `Umowa: ...${item.request_id.slice(-8)}` : `ID: ...${item.id.slice(-8)}`}
                    </span>
                  </td>
                  <td className="p-3 text-xs font-medium text-red-600">
                    {item.payment_delay_reported_at ? new Date(item.payment_delay_reported_at).toLocaleString("pl-PL") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
