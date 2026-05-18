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
import { supabase } from "@/integrations/supabase/client";

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
      { title: "Stay Safe — Aukcje nieruchomości w czasie rzeczywistym" },
      { name: "description", content: "Portal aukcyjny nieruchomości. Licytuj mieszkania i domy w czasie rzeczywistym. Sprawdź ile Twoja nieruchomość jest warta" },
      { property: "og:title", content: "Stay Safe — Aukcje nieruchomości w czasie rzeczywistym" },
      { property: "og:description", content: "Portal aukcyjny nieruchomości. Licytuj mieszkania i domy w czasie rzeczywistym. Sprawdź ile Twoja nieruchomość jest warta" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Stay Safe — Aukcje nieruchomości w czasie rzeczywistym" },
      { name: "twitter:description", content: "Portal aukcyjny nieruchomości. Licytuj mieszkania i domy w czasie rzeczywistym. Sprawdź ile Twoja nieruchomość jest warta" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ec313ec2-5bc9-422b-a0d6-8dde96fa084b/id-preview-ef73c0be--d6d7cf5e-de49-4031-b01e-bbab2aa59558.lovable.app-1779090990790.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ec313ec2-5bc9-422b-a0d6-8dde96fa084b/id-preview-ef73c0be--d6d7cf5e-de49-4031-b01e-bbab2aa59558.lovable.app-1779090990790.png" },
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
      .channel("global-bidding")
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => {
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        queryClient.invalidateQueries({ queryKey: ["property"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bids" }, () => {
        queryClient.invalidateQueries({ queryKey: ["bids"] });
        queryClient.invalidateQueries({ queryKey: ["properties"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeBridge />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
