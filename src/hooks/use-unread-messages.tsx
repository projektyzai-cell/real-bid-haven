import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Zwraca liczbę nieprzeczytanych wiadomości dla bieżącego użytkownika:
 * - wiadomości admina (admin_messages.read_at IS NULL)
 * - rozmowy najmu (na bazie *_last_read_at w rental_chats)
 */
export function useUnreadMessages() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["unread-messages", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      let total = 0;

      // Admin messages
      const { count: adminUnread } = await supabase
        .from("admin_messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .is("read_at", null);
      total += adminUnread ?? 0;

      // Rental chats
      const { data: rchats } = await supabase
        .from("rental_chats" as never)
        .select("id, tenant_id, landlord_id, tenant_last_read_at, landlord_last_read_at")
        .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`);

      for (const c of (rchats ?? []) as Array<{
        id: string; tenant_id: string; landlord_id: string;
        tenant_last_read_at: string; landlord_last_read_at: string;
      }>) {
        const since = c.tenant_id === user.id ? c.tenant_last_read_at : c.landlord_last_read_at;
        const { count } = await supabase.from("rental_messages" as never)
          .select("id", { count: "exact", head: true })
          .eq("chat_id", c.id)
          .neq("sender_id", user.id)
          .gt("created_at", since);
        total += count ?? 0;
      }
      return total;
    },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("unread-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rental_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["unread-messages", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_messages", filter: `recipient_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["unread-messages", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return data ?? 0;
}
