import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getWelcomeTemplate } from "./welcome-templates";

/**
 * Idempotent: on first invocation per user, inserts a welcome admin_message
 * in the user's preferred language and tailored to account_type.
 * Sets profiles.welcome_message_sent_at on success so it never repeats.
 */
export const sendWelcomeMessageIfFirst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("welcome_message_sent_at, account_type, preferred_language")
      .eq("id", userId)
      .maybeSingle();
    if (!prof || prof.welcome_message_sent_at) return { sent: false };

    const { data: admin } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    if (!admin?.user_id) return { sent: false };

    const tpl = getWelcomeTemplate(prof.account_type as string | null, prof.preferred_language as string | null);

    const { error } = await supabaseAdmin.from("admin_messages").insert({
      sender_id: admin.user_id,
      recipient_id: userId,
      subject: tpl.subject,
      body: tpl.body,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("profiles")
      .update({ welcome_message_sent_at: new Date().toISOString() })
      .eq("id", userId);

    return { sent: true };
  });
