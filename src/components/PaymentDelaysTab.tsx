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

        // 1. Pobieramy transakcje z opóźnieniami i danymi nieruchomości
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

        // 2. Wyciągamy unikalne ID użytkowników (najemców i wynajmujących)
        const userIds = Array.from(new Set([
          ...delaysData.map(d => d.tenant_id),
          ...delaysData.map(d => d.landlord_id)
        ].filter(Boolean)) as string[]);

        // 3. Pobieramy profile dla tych ID z tabeli profiles
        let profilesMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, display_name, email")
            .in("id", userIds);

          if (profilesError) {
            console.error("Błąd pobierania profili:", profilesError);
          } else if (profilesData) {
            profilesData.forEach(p => {
              profilesMap[p.id] = p;
            });
          }
        }

        // 4. Łączymy transakcje z odpowiednimi profilami
        const combined = delaysData.map(item => ({
          ...item,
          tenantProfile: profilesMap[item.tenant_id] || null,
          landlordProfile: profilesMap[item.landlord_id] || null
        }));

        setTransactions(combined);
      } catch (err) {
        console.error("Wystąpił błąd ogólny:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  // Funkcja przekierowująca bezpośrednio do czatu z wybraną osobą
  const handleOpenChat = (userId: string, roleLabel: string) => {
    if (!userId) return;
    
    // Zapisujemy w localStorage, aby zakładka wiadomości mogła odczytać wybranego użytkownika
    localStorage.setItem("active_chat_user_id", userId);
    localStorage.setItem("active_chat_role", roleLabel);
    
    // Przekierowanie przekazujące różne warianty parametrów URL obsługiwane przez systemy wiadomości
    window.location.href = `/admin?tab=messages&user_id=${userId}&recipient=${userId}&chat_with=${userId}`;
  };

  // Renderowanie informacji o użytkowniku (wyświetla display_name lub e-mail)
  const renderUserInfo = (profile: any, userId: string, roleLabel: string) => {
    if (!userId) {
      return <span className="text-muted-foreground italic text-xs">Brak przypisania</span>;
    }

    // Priorytet: display_name -> email -> skrócone ID
    const displayName = profile?.display_name || profile?.email || `Użytkownik (${userId.slice(0, 6)})`;
    const displayEmail = profile?.display_name && profile?.email ? profile.email : null;

    return (
      <div className="space-y-1">
        <div className="font-medium text-xs text-foreground">{displayName}</div>
        {displayEmail && <div className="text-[10px] text-muted-foreground">{displayEmail}</div>}
        <button
          onClick={() => handleOpenChat(userId, roleLabel)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/25 transition-colors cursor-pointer"
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
                      {renderUserInfo(item.tenantProfile, item.tenant_id, "Najemca")}
                    </td>

                    {/* Wynajmujący */}
                    <td className="p-3">
                      {renderUserInfo(item.landlordProfile, item.landlord_id, "Wynajmujący")}
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
