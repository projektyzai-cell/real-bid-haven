import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client"; 
import { MessageSquare, ExternalLink, User } from "lucide-react";

export function PaymentDelaysTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);

        // 1. Pobieramy transakcje z opóźnieniami, danymi nieruchomości oraz ID najemcy i wynajmującego
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
          setTransactions([]);
          setLoading(false);
          return;
        }

        // 2. Pobieramy dane profilowe użytkowników (najemców i wynajmujących)
        const userIds = [
          ...new Set([
            ...delaysData.map(d => d.tenant_id),
            ...delaysData.map(d => d.landlord_id)
          ].filter(Boolean))
        ];

        let profilesMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("*")
            .in("id", userIds);

          if (profilesData) {
            profilesData.forEach(p => { profilesMap[p.id] = p; });
          }
        }

        // 3. Łączymy transakcje z profilami i danymi nieruchomości
        const combined = delaysData.map(item => ({
          ...item,
          tenant: profilesMap[item.tenant_id] || { id: item.tenant_id, full_name: "Najemca", email: "Brak danych" },
          landlord: profilesMap[item.landlord_id] || { id: item.landlord_id, full_name: "Wynajmujący", email: "Brak danych" }
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

  // Funkcja obsługująca przejście do wewnętrznego czatu / zakładki wiadomości z konkretnym użytkownikiem
  const handleOpenChat = (userId: string, role: string) => {
    if (!userId) return;
    // Przekierowujemy do zakładki wiadomości w panelu admina (lub otwiera odpowiedni widok)
    window.location.href = `/admin?tab=messages&user_id=${userId}&role=${role}`;
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
                const tenant = item.tenant;
                const landlord = item.landlord;
                
                const formattedProperty = rl 
                  ? `${rl.city || ""}, ${rl.property_type || ""} — ${rl.street || ""}`
                  : `ID: ...${item.listing_id?.slice(-8) || item.id.slice(-8)}`;

                return (
                  <tr key={item.id} className="border-b text-sm hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground">
                      {formattedProperty}
                    </td>

                    {/* Kolumna: Najemca + Czat */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="font-medium text-xs">{tenant.full_name || tenant.email || "Nieznany"}</div>
                        <button
                          onClick={() => handleOpenChat(item.tenant_id, "tenant")}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" /> Czat z najemcą
                        </button>
                      </div>
                    </td>

                    {/* Kolumna: Wynajmujący + Czat */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="font-medium text-xs">{landlord.full_name || landlord.email || "Nieznany"}</div>
                        <button
                          onClick={() => handleOpenChat(item.landlord_id, "landlord")}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" /> Czat z wynajmującym
                        </button>
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
