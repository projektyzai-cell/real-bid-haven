import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ChatWindow } from "@/components/ChatWindow";
import { formatPLN } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/chats/$id")({
  head: () => ({ meta: [{ title: "Rozmowa — Stay Safe" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["chat", id],
    queryFn: async () => {
      const { data: chat, error } = await supabase
        .from("chats" as never)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!chat) throw notFound();
      const c = chat as unknown as {
        id: string; property_id: string; bid_id: string;
        seller_id: string; buyer_id: string;
      };
      const [{ data: prop }, { data: bid }, { data: profiles }] = await Promise.all([
        supabase.from("properties").select("id, title, city, street, image_url").eq("id", c.property_id).maybeSingle(),
        supabase.from("bids").select("amount").eq("id", c.bid_id).maybeSingle(),
        supabase.from("profiles").select("id, display_name").in("id", [c.seller_id, c.buyer_id]),
      ]);
      const map = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
      return {
        chat: c,
        property: prop,
        bid,
        sellerName: map.get(c.seller_id) ?? "Sprzedający",
        buyerName: map.get(c.buyer_id) ?? "Kupujący",
      };
    },
  });

  if (isLoading || !data) {
    return <div className="container mx-auto px-4 py-16 text-muted-foreground">Ładowanie...</div>;
  }

  const counterpart = user?.id === data.chat.seller_id ? data.buyerName : data.sellerName;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Wróć
      </Link>
      <div className="mt-4 flex items-center gap-4 rounded-3xl border bg-card p-4 shadow-card">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
          {data.property?.image_url && (
            <img src={data.property.image_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link to="/properties/$id" params={{ id: data.chat.property_id }}
            className="block truncate font-semibold hover:underline">
            {data.property?.title}
          </Link>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {data.property?.city} · {data.property?.street}
          </div>
          <div className="mt-1 text-sm">
            Rozmowa z: <span className="font-medium">{counterpart}</span>
            {" · "}
            <span className="text-muted-foreground">
              Zaakceptowana oferta: <strong className="tabular-nums text-foreground">{formatPLN(data.bid?.amount ?? 0)}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ChatWindow chatId={id} />
      </div>
    </div>
  );
}
