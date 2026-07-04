import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { supabase } from "@/integrations/supabase/client";
import "@/lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-3 text-muted-foreground">Nie znaleziono strony.</p>
        <a href="/" className="mt-6 inline-block rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">
          Wróć na stronę główną
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Coś poszło nie tak</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "StaySafe — PropTech dla najmu i nieruchomości" },
      { name: "description", content: "StaySafe (staysafe.pl) — bezpieczny najem z weryfikacją tożsamości, dopasowaniem najemca↔wynajmujący, RODO Passport i transparentnymi ocenami." },
      { property: "og:title", content: "StaySafe — PropTech" },
      { property: "og:description", content: "Bezpieczny najem, weryfikacja, dopasowanie i RODO Passport." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "StaySafe — PropTech" },
      { name: "twitter:description", content: "Bezpieczny najem, weryfikacja, dopasowanie i RODO Passport." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RealtimeBridge() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel("global-rental")
      .on("postgres_changes", { event: "*", schema: "public", table: "rental_listings" }, () => {
        queryClient.invalidateQueries({ queryKey: ["rental_listings"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "rental_offers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["rental_offers"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);
  return null;
}

function WelcomeMessageBridge() {
  useEffect(() => {
    let triggered = false;
    const fire = async () => {
      if (triggered) return;
      triggered = true;
      try {
        const { sendWelcomeMessageIfFirst } = await import("@/lib/welcome-message.functions");
        await sendWelcomeMessageIfFirst();
      } catch (e) {
        // swallow — non-critical
        console.warn("welcome-msg:", e);
      }
    };
    supabase.auth.getSession().then(({ data }) => { if (data.session) fire(); });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") { triggered = false; fire(); }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeBridge />
        <WelcomeMessageBridge />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <CookieConsent />
        <Toaster position="bottom-right" richColors closeButton expand={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
