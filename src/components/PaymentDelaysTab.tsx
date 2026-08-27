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

        // Pobieramy transakcje wraz z relacjami do rental_listings oraz profilami najemcy i wynajmującego
        const { data, error } = await supabase
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
            ),
            tenant:profiles!tenant_id (
              display_name,
              email
            ),
            landlord:profiles!landlord_id (
              display_name,
              email
            )
          `)
          .not("payment_delay_reported_at", "is", null)
          .order("payment_delay_reported_at", { ascending: false });

        if (error) {
          console.error("Błąd pobierania danych:", error);
          setTransactions([]);
        } else {
          console.log("Pobrane transakcje:", data);
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

  // Funkcja przekierowująca do czatu z konkretnym użytkownikiem
  const handleOpenChat = (userId: string) => {
    if (!userId) return;
    window.location.href = `/admin?tab=messages&user_id=${userId}`;
  };

  // Renderowanie informacji o użytkowniku korzystające z bezpośredniej relacji
  const renderUserInfo = (user: any, roleLabel: string, userId: string) => {
    if (!userId) {
      return <span className="text-muted-foreground italic text-xs">Brak przypisania</span>;
    }

    // Pobieramy display_name lub e-mail z złączonego obiektu profilu
    const displayName = user?.display_name || user?.email || `Użytkownik (${userId.slice(0, 6)})`;

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
