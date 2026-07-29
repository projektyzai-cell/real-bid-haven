import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * TURA G — Kontakt z Adminem zapisywany jako wiadomość w panelu (admin_messages),
 * zamiast otwierania mailto.
 */
export const contactAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      subject: z.string().min(3).max(200),
      body: z.string().min(5).max(4000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: admins } = await supabaseAdmin
      .from("user_roles").select("user_id").eq("role", "admin").limit(1);
    const adminId = (admins as any)?.[0]?.user_id;
    if (!adminId) throw new Error("Brak konta administratora w systemie.");

    const { error } = await supabaseAdmin.from("admin_messages").insert({
      sender_id: ctx.userId,
      recipient_id: adminId,
      subject: data.subject,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
