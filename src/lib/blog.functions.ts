import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Blog database connection is not configured");
  return createClient<Database>(
    url,
    key,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    },
  );
}

export type BlogListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  published_at: string | null;
  views_count: number;
};

export type BlogPost = BlogListItem & {
  content: string;
  seo_title: string | null;
  seo_description: string | null;
};

export const listPublishedPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<BlogListItem[]> => {
    const { data, error } = await publicClient()
      .from("blog_posts")
      .select("id,slug,title,excerpt,cover_image_url,tags,published_at,views_count")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as BlogListItem[];
  },
);

export const getPublishedPost = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }): Promise<BlogPost | null> => {
    const { data: row, error } = await publicClient()
      .from("blog_posts")
      .select(
        "id,slug,title,excerpt,content,cover_image_url,tags,published_at,views_count,seo_title,seo_description",
      )
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as unknown as BlogPost | null;
  });

export const registerPostView = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const client = publicClient();
    const { error } = await client.rpc("increment_blog_views", { _slug: data.slug });
    if (error) {
      console.error("[blog-views] Failed to record visit:", error.message);
      throw new Error("Nie udało się zapisać odwiedzin artykułu.");
    }
    const { data: post, error: readError } = await client
      .from("blog_posts")
      .select("views_count")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (readError || !post) {
      console.error("[blog-views] Failed to read counter:", readError?.message ?? "Article not found");
      throw new Error("Nie udało się odczytać licznika odwiedzin.");
    }
    return { views_count: post.views_count };
  });
