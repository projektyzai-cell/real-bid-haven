import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client"; 

export function PaymentDelaysTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);

        // 1. Pobieramy zgłoszone opóźnienia wraz z datami startu i końca umowy z tabeli lease_transactions
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

        // 2. Pobieramy dane nieruchomości z tabeli "listings" (dla czytelnego adresu/tytułu)
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
                <th className="p-3">Nieruchomość / Adres</th>
                <th className="p-3">Okres umowy najmu</th>
                <th className="p-3">Powiązana umowa</th>
                <th className="p-3">Data zgłoszenia</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => {
                const l = item.listing;
                
                // Sprawdzamy możliwe nazwy kolumn z adresem/tytułem w tabeli listings
                const propertyTitle = l?.title || l?.name || l?.address || l?.street || `Nieruchomość ID: ${item.listing_id?.slice(0, 8)}...`;
                const propertyLocation = [l?.city, l?.district].filter(Boolean).join(", ");

                return (
                  <tr key={item.id} className="border-b text-sm hover:bg-muted/30">
                    <td className="p-3 font-medium">
                      <div>
                        <span className="text-primary font-semibold">{propertyTitle}</span>
                        {propertyLocation && <span className="block text-xs text-muted-foreground">{propertyLocation}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      {item.contract_start_date || item.contract_end_date ? (
                        <div className="space-y-0.5">
                          <div><span className="text-muted-foreground">Od:</span> {item.contract_start_date ? new Date(item.contract_start_date).toLocaleDateString("pl-PL") : "—"}</div>
                          <div><span className="text-muted-foreground">Do:</span> {item.contract_end_date ? new Date(item.contract_end_date).toLocaleDateString("pl-PL") : "—"}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Brak dat w transakcji</span>
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
