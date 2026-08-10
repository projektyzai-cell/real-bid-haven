import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { getPublishedPost, registerPostView } from "@/lib/blog.functions";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPublishedPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => {
    const p = loaderData;
    if (!p) return { meta: [{ title: "Artykuł – Blog StaySafe" }] };
    const title = p.seo_title || `${p.title} – Blog StaySafe`;
    const desc = p.seo_description || p.excerpt || "Poradnik bezpiecznego najmu StaySafe.";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: desc },
    ];
    if (p.cover_image_url?.startsWith("https://")) {
      meta.push({ property: "og:image", content: p.cover_image_url });
      meta.push({ name: "twitter:image", content: p.cover_image_url });
    }
    return { meta };
  },
  component: BlogPostPage,
  errorComponent: ({ error }) => <div className="container mx-auto px-4 py-10 text-destructive">{error.message}</div>,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-10">
      <p>Nie znaleziono artykułu.</p>
      <Link to="/blog" className="mt-4 inline-block text-sm underline">Wróć do bloga</Link>
    </div>
  ),
});

function BlogPostPage() {
  const post = Route.useLoaderData();
  useEffect(() => {
    registerPostView({ data: { slug: post.slug } }).catch(() => {});
  }, [post.slug]);

  return (
    <article className="container mx-auto max-w-3xl px-4 py-10">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Blog
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{post.title}</h1>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{post.published_at ? new Date(post.published_at).toLocaleDateString("pl-PL") : ""}</span>
        <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views_count}</span>
        {post.tags?.length > 0 && <span>{post.tags.join(" · ")}</span>}
      </div>
      {post.cover_image_url && (
        <img src={post.cover_image_url} alt={post.title} className="mt-6 w-full rounded-3xl object-cover" />
      )}
      <div className="prose prose-invert mt-6 max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
        {post.content}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.seo_description || post.excerpt || undefined,
            datePublished: post.published_at || undefined,
            image: post.cover_image_url || undefined,
          }),
        }}
      />
    </article>
  );
}
