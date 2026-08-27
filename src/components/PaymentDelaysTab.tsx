import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client"; 

export function PaymentDelaysTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);

        // 1. Pobieramy zgłoszone opóźnienia wraz z datami umowy
        const { data: delaysData, error: delaysError } = await supabase
          .from("lease_transactions") 
          .select("id, request_id, listing_id, payment_delay_reported_at, contract_start_date, contract_end_date")
          .not("payment_delay_reported_at", "is", null)
          .order("payment_delay_reported_at", { ascending: false });

        if (delaysError || !delaysData || delaysData.length === 0) {
          setTransactions([]);
          setLoading(false);
          return;
        }

        // 2. Pobieramy dane nieruchomości z tabeli "listings"
        const listingIds = [...new Set(delaysData.map(item => item.listing_id).filter(Boolean))];
        let listingsMap: Record<string, any> = {};
        
        if (listingIds.length > 0) {
          const { data: listingsData } = await supabase
            .from("listings")
            .select("*")
            .in("id", listingIds);

          if (listingsData) {
            listingsData.forEach(l => { listingsMap[l.id] = l; });
          }
        }

        // 3. Łączymy dane w JavaScript
        const combined = delaysData.map(item => ({
          ...item,
          listing: listingsMap[item.listing_id] || null
        }));

        setTransactions(combined);
      } catch (err) {
        console.error("Wystąpił błąd podczas pobierania danych:", err);
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
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <th className="p-3">Przedmiot najmu</th>
                <th className="p-3">Okres najmu</th>
                <th className="p-3">Powiązana umowa</th>
                <th className="p-3">Data zgłoszenia</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => {
                const l = item.listing;
                
                // Formatujemy adres dokładnie tak jak w Auto-Machingu: Miasto, — Ulica/Tytuł
                const city = l?.city || "Nieznane miasto";
                const streetOrTitle = l?.street || l?.address || l?.title || l?.name || `ID: ${item.listing_id?.slice(0, 8)}`;
                const formattedProperty = `${city}, — ${streetOrTitle}`;

                return (
                  <tr key={item.id} className="border-b text-sm hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground">
                      {formattedProperty}
                    </td>
                    <td className="p-3 text-xs">
                      {item.contract_start_date || item.contract_end_date ? (
                        <span>
                          {item.contract_start_date ? new Date(item.contract_start_date).toLocaleDateString("pl-PL") : "—"} 
                          {" — "} 
                          {item.contract_end_date ? new Date(item.contract_end_date).toLocaleDateString("pl-PL") : "—"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Brak dat</span>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
