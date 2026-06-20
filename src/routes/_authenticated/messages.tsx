import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Wiadomości — Stay Safe" }] }),
  component: MessagesPage,
});

interface RentalChatRow {
  id: string;
  request_id: string | null;
  offer_id: string | null;
  tenant_id: string;
  landlord_id: string;
  created_at: string;
}

interface AdminMsg {
  id: string;
  subject: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

function MessagesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const chats = useQuery({
    queryKey: ["rental-chats", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: chats, error } = await supabase
        .from("rental_chats" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (chats ?? []) as unknown as RentalChatRow[];
      const otherIds = Array.from(new Set(rows.map((c) => c.tenant_id === user!.id ? c.landlord_id : c.tenant_id)));
      const { data: profs } = otherIds.length
        ? await supabase.from("profiles").select("id, display_name").in("id", otherIds)
        : { data: [] as { id: string; display_name: string }[] };
      const profMap = new Map((profs ?? []).map((p) => [p.id, p.display_name]));
      return rows.map((c) => ({
        ...c,
        counterpart: profMap.get(c.tenant_id === user!.id ? c.landlord_id : c.tenant_id) ?? "Użytkownik",
        role: c.tenant_id === user!.id ? "Wynajmujący" : "Najemca",
      }));
    },
  });

  const adminMsgs = useQuery({
    queryKey: ["admin-messages", "mine", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AdminMsg[]> => {
      const { data, error } = await supabase
        .from("admin_messages")
        .select("id, subject, body, read_at, created_at")
        .eq("recipient_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminMsg[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("admin_messages").update({ read_at: new Date().toISOString() }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      qc.invalidateQueries({ queryKey: ["unread-messages"] });
    },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Wiadomości</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Rozmowy z najemcami/wynajmującymi oraz wiadomości od zespołu StaySafe.
      </p>

      {/* Wiadomości od Admina */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold">
          <ShieldCheck className="h-4 w-4" /> Wiadomości od StaySafe
        </h2>
        {adminMsgs.isLoading ? (
          <div className="text-muted-foreground">Ładowanie...</div>
        ) : !adminMsgs.data || adminMsgs.data.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Brak wiadomości od administracji.
          </div>
        ) : (
          <ul className="space-y-2">
            {adminMsgs.data.map((m) => (
              <AdminMsgItem key={m.id} m={m} onRead={() => markRead.mutate(m.id)} />
            ))}
          </ul>
        )}
      </section>

      {/* Rozmowy */}
      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <MessageCircle className="h-4 w-4" /> Rozmowy o najmie
        </h2>
        {chats.isLoading ? (
          <div className="text-muted-foreground">Ładowanie...</div>
        ) : !chats.data || chats.data.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            <MessageCircle className="mx-auto h-6 w-6" />
            <p className="mt-2">Nie masz jeszcze żadnych rozmów.</p>
            <p className="text-xs">Rozmowy uruchamiają się po akceptacji oferty najmu.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {chats.data.map((c) => (
              <li key={c.id}>
                <Link
                  to="/najem/chats/$id"
                  params={{ id: c.id }}
                  className="flex items-center gap-4 rounded-2xl bg-card p-3 shadow-card transition hover:shadow-glow"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <MessageCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c.counterpart}</div>
                    <div className="text-sm text-muted-foreground">{c.role}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AdminMsgItem({ m, onRead }: { m: AdminMsg; onRead: () => void }) {
  const [expanded, setExpanded] = useState(!m.read_at);
  return (
    <li className={`rounded-2xl border bg-card p-4 shadow-card ${!m.read_at ? "ring-2 ring-gold/40" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!m.read_at && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-gold-foreground">Nowa</span>}
            <h3 className="truncate font-semibold">{m.subject}</h3>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(m.created_at).toLocaleString("pl-PL")} · StaySafe Admin
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Zwiń" : "Rozwiń"}
        </Button>
      </div>
      {expanded && (
        <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {m.body}
        </div>
      )}
      {expanded && !m.read_at && (
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={onRead}>Oznacz jako przeczytane</Button>
        </div>
      )}
    </li>
  );
}
