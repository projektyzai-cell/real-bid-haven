import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { provisionDanielAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, KeyRound, Mail, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/setup")({
  component: AdminSetup,
  head: () => ({ meta: [{ title: "Provisioning admina · StaySafe" }] }),
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">404</div>,
});

function AdminSetup() {
  const router = useRouter();
  const provision = useServerFn(provisionDanielAdmin);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const r = await provision();
      setCreds({ email: r.email, password: r.password });
      toast.success("Konto admina gotowe");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-12">
      <Card className="rounded-3xl border-gold/40 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-gold" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Provisioning konta administratora</h1>
            <p className="text-sm text-muted-foreground">Jednorazowe utworzenie konta „Daniel" z rolą admin.</p>
          </div>
        </div>

        {!creds ? (
          <Button onClick={run} disabled={busy} className="rounded-2xl" size="lg">
            {busy ? "Tworzenie…" : "Utwórz / odśwież konto Daniel"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-gold" /> <b>Daniel</b></div>
              <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-gold" /> <code className="font-mono">{creds.email}</code></div>
              <div className="flex items-center gap-2 text-sm"><KeyRound className="h-4 w-4 text-gold" /> <code className="font-mono">{creds.password}</code></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Supabase Auth wymaga formatu e-mail w loginie. Hasło jest zgodne z Twoim wyborem.
            </p>
            <Button onClick={() => router.navigate({ to: "/auth" })} className="rounded-2xl w-full" size="lg">
              Przejdź do logowania
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
