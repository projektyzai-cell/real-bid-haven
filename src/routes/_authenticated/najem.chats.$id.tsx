import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/najem/chats/$id")({
  head: () => ({ meta: [{ title: "Czat najmu — Stay Safe" }] }),
  component: RentalChatPage,
});

interface RentalMessage {
  id: string; chat_id: string; sender_id: string; content: string; created_at: string;
}

function RentalChatPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: chat } = useQuery({
    queryKey: ["rental-chat", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_chats" as never).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      const c = data as unknown as {
        id: string; tenant_id: string; landlord_id: string; offer_id: string;
      };
      const { data: offer } = await supabase
        .from("rental_offers" as never).select("monthly_price, property_address").eq("id", c.offer_id).maybeSingle();
      const { data: profs } = await supabase
        .from("profiles").select("id, display_name").in("id", [c.tenant_id, c.landlord_id]);
      const map = new Map((profs ?? []).map((p) => [p.id, p.display_name]));
      return {
        chat: c,
        offer: offer as { monthly_price: number; property_address: string | null } | null,
        tenantName: map.get(c.tenant_id) ?? "Najemca",
        landlordName: map.get(c.landlord_id) ?? "Wynajmujący",
      };
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["rental-messages", id],
    queryFn: async (): Promise<RentalMessage[]> => {
      const { data, error } = await supabase
        .from("rental_messages" as never).select("*").eq("chat_id", id).order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as RentalMessage[];
    },
  });

  useEffect(() => {
    const ch = supabase.channel(`rental-chat-${id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "rental_messages", filter: `chat_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ["rental-messages", id] }),
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, queryClient]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setSending(true);
    const { error } = await supabase.from("rental_messages" as never).insert({
      chat_id: id, sender_id: user.id, content: trimmed.slice(0, 4000),
    } as never);
    setSending(false);
    if (error) toast.error(error.message);
    else setText("");
  }

  if (!chat) return <div className="container mx-auto px-4 py-16 text-muted-foreground">Ładowanie...</div>;
  const counterpart = user?.id === chat.chat.tenant_id ? chat.landlordName : chat.tenantName;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link to="/najem/moje-zapytania" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Wróć
      </Link>
      <div className="mt-4 rounded-3xl border bg-card p-4 shadow-card">
        <div className="text-sm">
          Rozmowa z: <strong>{counterpart}</strong>
          {chat.offer && (
            <span className="ml-2 text-muted-foreground">
              · oferta {formatPLN(chat.offer.monthly_price)}/mies.{chat.offer.property_address ? ` · ${chat.offer.property_address}` : ""}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 flex h-[600px] flex-col overflow-hidden rounded-3xl border bg-card shadow-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!messages || messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Brak wiadomości. Napisz pierwszą wiadomość.</p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleString("pl-PL")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t bg-background/50 p-3">
          <Input value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Napisz wiadomość..." maxLength={4000} disabled={sending} className="rounded-xl" />
          <Button type="submit" disabled={sending || !text.trim()} className="rounded-xl">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
