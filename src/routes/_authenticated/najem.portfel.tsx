import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/najem/portfel")({
  head: () => ({ meta: [{ title: "Portfel Nieruchomości — Stay Safe" }] }),
  component: PortfelPage,
});

function PortfelPage() {
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadedState, setLoadedState] = useState<any | null>(null);
  const [ready, setReady] = useState(false);
  const savingRef = useRef(false);

  // Load state once per user
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("property_manager_state")
        .select("state")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("[portfel] load error", error);
        setLoadedState({});
      } else {
        setLoadedState((data as any)?.state ?? {});
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // postMessage bridge
  useEffect(() => {
    if (!user?.id) return;
    const onMessage = async (ev: MessageEvent) => {
      const d = ev.data;
      if (!d || typeof d !== "object") return;
      if (ev.source !== iframeRef.current?.contentWindow) return;

      if (d.type === "portfel:ready") {
        setReady(true);
        // Send state (or empty) to hydrate
        iframeRef.current?.contentWindow?.postMessage(
          { type: "portfel:load", state: loadedState ?? {} },
          "*",
        );
        return;
      }

      if (d.type === "portfel:save") {
        if (savingRef.current) return;
        savingRef.current = true;
        try {
          const { error } = await supabase
            .from("property_manager_state")
            .upsert(
              { user_id: user.id, state: d.state, updated_at: new Date().toISOString() },
              { onConflict: "user_id" },
            );
          if (error) {
            console.error("[portfel] save error", error);
            toast.error("Nie udało się zapisać zmian portfela");
          }
        } finally {
          savingRef.current = false;
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [user?.id, loadedState]);

  // If iframe was already ready before state loaded, push state now
  useEffect(() => {
    if (ready && loadedState !== null) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "portfel:load", state: loadedState },
        "*",
      );
    }
  }, [ready, loadedState]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3">
          <Wallet className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfel Nieruchomości</h1>
          <p className="text-sm text-muted-foreground">
            Zarządzaj wynajmem, umowami, płatnościami i podatkami — wszystko zapisuje się automatycznie na Twoim koncie.
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <iframe
          ref={iframeRef}
          src="/zarzadzanie-nieruchomosciami.html"
          title="Portfel nieruchomości"
          className="h-[calc(100vh-180px)] min-h-[800px] w-full border-0"
        />
      </div>
    </div>
  );
}
