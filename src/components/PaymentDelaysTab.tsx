import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client"; 
import { MessageSquare } from "lucide-react";

export function PaymentDelaysTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);

        // 1. Pobieramy transakcje z opóźnieniami z tabeli lease_transactions
        const { data: delaysData, error: delaysError } = await supabase
          .from("lease_transactions") 
          .select(`
            id,
            request_id,
            listing_id,
            tenant_id,
            landlord_id,
            payment_delay_reported_at,
            contract_start_date,
            contract_end_date,
            rental_listings (
              city,
              street,
              property_type
            )
          `)
          .not("payment_delay_reported_at", "is", null)
          .order("payment_delay_reported_at", { ascending: false });

        if (delaysError || !delaysData) {
          console.error("Błąd pobierania transakcji:", delaysError);
          setTransactions([]);
          setLoading(false);
          return;
        }

        console.log("1. Pobrane transakcje z opóźnieniami:", delaysData);

        // 2. Wyciągamy unikalne ID stron umowy (najemców i wynajmujących)
        const tenantIds = delaysData.map(d => d.tenant_id).filter(Boolean);
        const landlordIds = delaysData.map(d => d.landlord_id).filter(Boolean);
        const allUserIds = Array.from(new Set([...tenantIds, ...landlordIds]));

        console.log("2. ID użytkowników do pobrania z profiles:", allUserIds);

        // 3. Pobieramy kolumnę display_name z tabeli profiles dla tych konkretnych ID
        let profilesMap: Record<string, string> = {};
        if (allUserIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", allUserIds);

          if (profilesError) {
            console.error("Błąd pobierania profili:", profilesError);
          } else {
            console.log("3. Pobrane profile z bazy:", profilesData);
            if (profilesData) {
              profilesData.forEach(profile => {
                if (profile.id) {
                  profilesMap[profile.id] = profile.display_name || "Brak nazwy";
                }
              });
            }
          }
        }

        console.log("4. Mapa nazw użytkowników:", profilesMap);

        // 4. Łączymy transakcje ze znalezionymi nazwami z profiles
        const combined = delaysData.map(item => ({
          ...item,
          tenantDisplayName: profilesMap[item.tenant_id] || null,
          landlordDisplayName: profilesMap[item.landlord_id] || null
        }));

        setTransactions(combined);
      } catch (err) {
        console.error("Wystąpił błąd krytyczny:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  // Funkcja przekierowująca bezpośrednio do czatu z wybraną osobą
  const handleOpenChat = (userId: string) => {
    if (!userId) return;
    localStorage.setItem("active_chat_user_id", userId);
    window.location.href = `/admin?tab=messages&user_id=${userId}&recipient=${userId}&chat_with=${userId}`;
  };

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
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <th className="p-3">Przedmiot najmu</th>
                <th className="p-3">Najemca</th>
                <th className="p-3">Wynajmujący</th>
                <th className="p-3">Okres najmu</th>
                <th className="p-3">Powiązana umowa</th>
                <th className="p-3">Data zgłoszenia</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => {
                const rl = item.rental_listings;
                const formattedProperty = rl 
                  ? `${rl.city || ""}, ${rl.property_type || ""} — ${rl.street || ""}`
                  : `ID: ...${item.listing_id?.slice(-8) || item.id.slice(-8)}`;

                // Pobieramy nazwę z profiles lub fallback na ID, jeśli nazwa nie została znaleziona
                const tenantName = item.tenantDisplayName || (item.tenant_id ? `Użytkownik (${item.tenant_id.slice(0, 6)})` : "Brak");
                const landlordName = item.landlordDisplayName || (item.landlord_id ? `Użytkownik (${item.landlord_id.slice(0, 6)})` : "Brak");

                return (
                  <tr key={item.id} className="border-b text-sm hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground">
                      {formattedProperty}
                    </td>

                    {/* Najemca */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="font-semibold text-xs text-foreground">{tenantName}</div>
                        {item.tenant_id && (
                          <button
                            onClick={() => handleOpenChat(item.tenant_id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/25 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="h-3 w-3" /> Czat z najemcą
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Wynajmujący */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="font-semibold text-xs text-foreground">{landlordName}</div>
                        {item.landlord_id && (
                          <button
                            onClick={() => handleOpenChat(item.landlord_id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/25 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="h-3 w-3" /> Czat z wynajmującym
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-xs">
                      {item.contract_start_date && item.contract_end_date ? (
                        <span>
                          {item.contract_start_date} — {item.contract_end_date}
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
