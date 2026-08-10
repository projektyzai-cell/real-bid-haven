import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles").select("role").eq("user_id", ctx.userId).eq("role", "admin");
  if (error || !data || data.length === 0) throw new Error("Forbidden");
}

const postSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(120),
  title: z.string().min(2).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1),
  cover_image_url: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().max(40)).max(12).optional(),
  status: z.enum(["draft", "published"]),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(320).optional().nullable(),
});

export const adminListPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { data, error } = await (context as any).supabase
      .from("blog_posts")
      .select("id,slug,title,excerpt,content,cover_image_url,tags,status,published_at,views_count,seo_title,seo_description,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSavePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => postSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context as any);
    const sb = (context as any).supabase;
    const payload: Record<string, unknown> = {
      slug: data.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      title: data.title.trim(),
      excerpt: data.excerpt ?? null,
      content: data.content,
      cover_image_url: data.cover_image_url || null,
      tags: data.tags ?? [],
      status: data.status,
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
      published_at: data.status === "published" ? new Date().toISOString() : null,
      author_id: (context as any).userId,
    };
    if (data.id) {
      delete payload.author_id;
      if (data.status !== "published") payload.published_at = null;
      const { error } = await sb.from("blog_posts").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await sb.from("blog_posts").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context as any);
    const { error } = await (context as any).supabase.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
