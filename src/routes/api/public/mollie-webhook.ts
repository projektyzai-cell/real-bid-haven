import { createFileRoute } from "@tanstack/react-router";
import { syncMolliePayment } from "@/lib/mollie-sync.server";

/**
 * Webhook Mollie — status pobierany bezpośrednio z API Mollie.
 */
export const Route = createFileRoute("/api/public/mollie-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const mollieId = String(form.get("id") ?? "");
        if (!/^tr_[A-Za-z0-9]+$/.test(mollieId)) return new Response("bad id", { status: 400 });
        try {
          await syncMolliePayment(mollieId);
        } catch (e) {
          console.error("[mollie-webhook]", e);
          return new Response("error", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
