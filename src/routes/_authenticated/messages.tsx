import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

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

function MessagesPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
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

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Wiadomości</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Rozmowy uruchamiają się po akceptacji oferty najmu.
      </p>

      {isLoading ? (
        <div className="mt-8 text-muted-foreground">Ładowanie...</div>
      ) : !data || data.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed p-12 text-center text-muted-foreground">
          <MessageCircle className="mx-auto h-8 w-8" />
          <p className="mt-2">Nie masz jeszcze żadnych rozmów.</p>
        </div>
      ) : (
        <ul className="mt-8 space-y-2">
          {data.map((c) => (
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
    </div>
  );
}
