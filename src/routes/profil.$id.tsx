import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck, Star, MapPin, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/profil/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Profil użytkownika — StaySafe` },
      { name: "description", content: `Publiczny profil użytkownika StaySafe z ocenami od najemców i wynajmujących.` },
    ],
  }),
  loader: async ({ params }) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, home_city, passport_city, personal_bio_pl, passport_serial, passport_expires_at")
      .eq("id", params.id)
      .maybeSingle();
    if (!profile) throw notFound();
    return { profile };
  },
  component: PublicProfilePage,
  notFoundComponent: () => (
    <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Profil nie istnieje</h1>
      <Link to="/" className="mt-4 inline-block text-sm text-[#f59e0b] hover:underline">Powrót do strony głównej</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-sm text-red-400">{error.message}</p>
    </div>
  ),
});

function PublicProfilePage() {
  const { profile } = Route.useLoaderData() as { profile: any };
  const userId = profile.id;

  const summary = useQuery({
    queryKey: ["public-profile-summary", userId],
    queryFn: async () => {
      const [{ data: land }, { data: ten }] = await Promise.all([
        supabase.rpc("user_review_summary" as never, { _user_id: userId, _kind: "landlord" } as never),
        supabase.rpc("user_review_summary" as never, { _user_id: userId, _kind: "tenant" } as never),
      ]);
      return {
        landlord: (land as any)?.[0] ?? null,
        tenant: (ten as any)?.[0] ?? null,
      };
    },
  });

  const passportValid = profile.passport_serial && profile.passport_expires_at && new Date(profile.passport_expires_at) > new Date();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Powrót
      </Link>

      <div className="mt-4 rounded-3xl border border-[#1e293b] bg-[#0f172a]/60 p-6 shadow-card">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Avatar className="h-24 w-24 border-2 border-[#f59e0b]/40">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-[#0b0f19] text-2xl">
              <UserIcon className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{profile.display_name ?? "Użytkownik"}</h1>
            {(profile.passport_city || profile.home_city) && (
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {profile.passport_city ?? profile.home_city}
              </p>
            )}
            {passportValid && (
              <Badge className="mt-2 border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20">
                <ShieldCheck className="mr-1 h-3 w-3" /> Aktywny Paszport Najemcy
              </Badge>
            )}
            {profile.personal_bio_pl && (
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">{profile.personal_bio_pl}</p>
            )}
          </div>
        </div>

        {/* Rating summary tiles */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SummaryTile label="Jako wynajmujący" data={summary.data?.landlord} />
          <SummaryTile label="Jako najemca" data={summary.data?.tenant} />
        </div>
      </div>

      <div className="mt-8">
        <Tabs defaultValue="landlord">
          <TabsList className="bg-[#0f172a]/60">
            <TabsTrigger value="landlord">Opinie o wynajmującym</TabsTrigger>
            <TabsTrigger value="tenant">Opinie o najemcy</TabsTrigger>
          </TabsList>
          <TabsContent value="landlord" className="mt-4">
            <ReviewsList userId={userId} kind="landlord" />
          </TabsContent>
          <TabsContent value="tenant" className="mt-4">
            <ReviewsList userId={userId} kind="tenant" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SummaryTile({ label, data }: { label: string; data: any }) {
  const total = data?.total ?? 0;
  const avg = data?.avg_overall ? Number(data.avg_overall) : null;
  return (
    <div className="rounded-2xl border border-[#1e293b] bg-[#0b0f19] p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {total < 1 || avg == null ? (
        <div className="mt-1 text-sm text-muted-foreground">Brak opinii</div>
      ) : (
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[#f59e0b] tabular-nums">{avg.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">/10 · {total} {total === 1 ? "opinia" : total < 5 ? "opinie" : "opinii"}</span>
        </div>
      )}
    </div>
  );
}

function ReviewsList({ userId, kind }: { userId: string; kind: "landlord" | "tenant" }) {
  const { data, isLoading } = useQuery({
    queryKey: ["public-user-reviews", userId, kind],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_user_reviews" as never, { _user_id: userId, _kind: kind } as never);
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Ładuję opinie…</p>;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1e293b] bg-[#0f172a]/60 p-6 text-center text-sm text-muted-foreground">
        Brak publicznych opinii. Opinie są odsłaniane po ocenie obu stron lub po 14 dniach od zakończenia umowy.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <article key={r.id} className="rounded-2xl border border-[#1e293b] bg-[#0f172a]/60 p-4">
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={r.reviewer_avatar_url ?? undefined} />
                <AvatarFallback className="bg-[#0b0f19] text-xs">
                  {(r.reviewer_display_name ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-semibold">{r.reviewer_display_name ?? "Użytkownik"}</div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-[#f59e0b]/50 bg-[#f59e0b]/10 px-2.5 py-1 text-sm font-bold text-[#f59e0b]">
              <Star className="h-3.5 w-3.5" /> {Number(r.overall).toFixed(1)}
            </div>
          </header>
          {r.feedback && <p className="mt-3 text-sm leading-relaxed text-foreground/90">{r.feedback}</p>}
          {r.tags && r.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.tags.map((t: string) => (
                <span key={t} className="rounded-full border border-[#1e293b] bg-[#0b0f19] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
