import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Newspaper, Eye } from "lucide-react";
import { listPublishedPosts } from "@/lib/blog.functions";

const postsQuery = queryOptions({
  queryKey: ["blog", "published"],
  queryFn: () => listPublishedPosts(),
});

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog StaySafe – porady o bezpiecznym najmie" },
      { name: "description", content: "Poradnik najmu: umowy, kaucje, weryfikacja najemcy i Paszport Najemcy. Praktyczna wiedza dla najemców i wynajmujących." },
      { property: "og:title", content: "Blog StaySafe – porady o bezpiecznym najmie" },
      { property: "og:description", content: "Poradnik najmu: umowy, kaucje, weryfikacja najemcy i Paszport Najemcy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Blog StaySafe – porady o bezpiecznym najmie" },
      { name: "twitter:description", content: "Poradnik najmu: umowy, kaucje, weryfikacja najemcy i Paszport Najemcy." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  component: BlogIndex,
  errorComponent: ({ error }) => <div className="container mx-auto px-4 py-10 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="container mx-auto px-4 py-10">Nie znaleziono.</div>,
});

function BlogIndex() {
  const { data: posts } = useSuspenseQuery(postsQuery);
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-2">
        <Newspaper className="h-7 w-7 text-gold" />
        <h1 className="text-3xl font-semibold tracking-tight">Blog StaySafe</h1>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Praktyczna wiedza o bezpiecznym najmie: umowy, kaucje, weryfikacja najemcy i Paszport Najemcy.
      </p>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Wkrótce pojawią się pierwsze artykuły.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group overflow-hidden rounded-3xl border border-border bg-card/60 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt={p.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition group-hover:scale-105" />
              ) : (
                <div className="aspect-[16/10] w-full bg-muted" />
              )}
              <div className="space-y-2 p-4">
                <h2 className="line-clamp-2 font-semibold leading-snug">{p.title}</h2>
                {p.excerpt && <p className="line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>}
                <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                  <span>{p.published_at ? new Date(p.published_at).toLocaleDateString("pl-PL") : ""}</span>
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {p.views_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
