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

        // 1. Pobieramy transakcje z opóźnieniami
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

        // 2. Pobieramy profile użytkowników
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
            profilesData.forEach(p => { 
              profilesMap[p.id] = p; 
            });
          }
        }

        // 3. Łączymy dane
        const combined = delaysData.map(item => ({
          ...item,
          tenant: profilesMap[item.tenant_id] || null,
          landlord: profilesMap[item.landlord_id] || null
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

  // Funkcja przekierowująca do czatu z konkretnym użytkownikiem
  const handleOpenChat = (userId: string) => {
    if (!userId) return;
    window.location.href = `/admin?tab=messages&user_id=${userId}`;
  };

  // Renderowanie informacji z użyciem poprawnej kolumny display_name
  const renderUserInfo = (user: any, roleLabel: string, userId: string) => {
    if (!userId) {
      return <span className="text-muted-foreground italic text-xs">Brak przypisania</span>;
    }

    // Pobieramy nazwę z kolumny display_name (lub fallback na inne)
    const displayName = user?.display_name || user?.full_name || user?.name || user?.email || `Użytkownik (${userId.slice(0, 6)})`;

    return (
      <div className="space-y-1">
        <div className="font-medium text-xs text-foreground">{displayName}</div>
        <button
          onClick={() => handleOpenChat(userId)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/25 transition-colors"
        >
          <MessageSquare className="h-3 w-3" /> Czat z {roleLabel.toLowerCase()}
        </button>
      </div>
    );
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

                return (
                  <tr key={item.id} className="border-b text-sm hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground">
                      {formattedProperty}
                    </td>

                    {/* Najemca */}
                    <td className="p-3">
                      {renderUserInfo(item.tenant, "Najemca", item.tenant_id)}
                    </td>

                    {/* Wynajmujący */}
                    <td className="p-3">
                      {renderUserInfo(item.landlord, "Wynajmujący", item.landlord_id)}
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
