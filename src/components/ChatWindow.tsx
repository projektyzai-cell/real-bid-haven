import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function ChatWindow({ chatId }: { chatId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("messages" as never)
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Message[];
    },
  });

  // Oznacz wiadomości jako przeczytane (znika żółty badge)
  async function markRead() {
    if (!user) return;
    const { data: chat } = await supabase.from("chats" as never)
      .select("seller_id, buyer_id").eq("id", chatId).maybeSingle();
    const c = chat as { seller_id: string; buyer_id: string } | null;
    if (!c) return;
    const patch = c.seller_id === user.id
      ? { seller_last_read_at: new Date().toISOString() }
      : c.buyer_id === user.id
        ? { buyer_last_read_at: new Date().toISOString() }
        : null;
    if (!patch) return;
    await supabase.from("chats" as never).update(patch as never).eq("id", chatId);
    queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
  }

  useEffect(() => {
    const ch = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
          markRead();
        },
      )
      .subscribe();
    markRead();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, queryClient, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages && messages.length > 0) markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setSending(true);
    const { error } = await supabase.from("messages" as never).insert({
      chat_id: chatId,
      sender_id: user.id,
      content: trimmed.slice(0, 4000),
    } as never);
    setSending(false);
    if (error) toast.error(error.message);
    else setText("");
  }

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-3xl border bg-card shadow-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!messages || messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Brak wiadomości. Napisz pierwszą wiadomość, aby rozpocząć rozmowę.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  mine ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
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
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Napisz wiadomość..."
          maxLength={4000}
          disabled={sending}
          className="rounded-xl"
        />
        <Button type="submit" disabled={sending || !text.trim()} className="rounded-xl">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
