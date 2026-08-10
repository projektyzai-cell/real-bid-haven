import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

function publicClient() {
  return createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
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
    await publicClient().rpc("increment_blog_views", { _slug: data.slug });
    return { ok: true };
  });
