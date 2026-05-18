import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Wiadomości — Stay Safe" }] }),
  component: MessagesPage,
});

interface ChatRow {
  id: string;
  property_id: string;
  seller_id: string;
  buyer_id: string;
  created_at: string;
}

function MessagesPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["chats", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: chats, error } = await supabase
        .from("chats" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (chats ?? []) as unknown as ChatRow[];
      const propIds = Array.from(new Set(rows.map((c) => c.property_id)));
      const otherIds = Array.from(new Set(rows.map((c) => c.seller_id === user!.id ? c.buyer_id : c.seller_id)));
      const [{ data: props }, { data: profs }] = await Promise.all([
        propIds.length
          ? supabase.from("properties").select("id, title, image_url, city").in("id", propIds)
          : Promise.resolve({ data: [] as never[] }),
        otherIds.length
          ? supabase.from("profiles").select("id, display_name").in("id", otherIds)
          : Promise.resolve({ data: [] as never[] }),
      ]);
      const propMap = new Map((props ?? []).map((p: { id: string; title: string; image_url: string | null; city: string }) => [p.id, p]));
      const profMap = new Map((profs ?? []).map((p: { id: string; display_name: string }) => [p.id, p.display_name]));
      return rows.map((c) => ({
        ...c,
        property: propMap.get(c.property_id),
        counterpart: profMap.get(c.seller_id === user!.id ? c.buyer_id : c.seller_id) ?? "Użytkownik",
        role: c.seller_id === user!.id ? "Sprzedawca" : "Kupujący",
      }));
    },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Wiadomości</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Rozmowy uruchamiane są po akceptacji oferty przez sprzedawcę.
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
              <Link to="/chats/$id" params={{ id: c.id }}
                className="flex items-center gap-4 rounded-2xl bg-card p-3 shadow-card transition hover:shadow-glow">
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {c.property?.image_url && (
                    <img src={c.property.image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{c.property?.title ?? "Ogłoszenie"}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.role === "Sprzedawca" ? "Kupujący" : "Sprzedawca"}: {c.counterpart}
                  </div>
                </div>
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
