import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client"; 

export function PaymentDelaysTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        // Pobieramy dane bezpośrednio z tabeli lease_transactions
        const { data, error } = await supabase
          .from("lease_transactions") 
          .select("*")
          .order("id", { ascending: false });

        if (error) {
          console.error("Błąd pobierania transakcji:", error);
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
      <p className="text-muted-foreground">Panel monitorowania transakcji najmu i zgłoszeń.</p>

      {loading ? (
        <p>Ładowanie danych z bazy...</p>
      ) : transactions.length === 0 ? (
        <p className="text-sm text-gray-500">Brak wpisów w tabeli lease_transactions.</p>
      ) : (
        <div className="border rounded-md overflow-hidden bg-card overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <th className="p-3">ID Transakcji</th>
                <th className="p-3">Najemca (Tenant ID)</th>
                <th className="p-3">Wynajmujący (Landlord ID)</th>
                <th className="p-3">Listing ID</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id} className="border-b text-sm hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{item.id}</td>
                  <td className="p-3 font-mono text-xs">{item.tenant_id || "—"}</td>
                  <td className="p-3 font-mono text-xs">{item.landlord_id || "—"}</td>
                  <td className="p-3 font-mono text-xs">{item.listing_id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
