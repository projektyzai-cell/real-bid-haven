import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const TITLE = "Panel administratora — logowanie · Stay Safe";
const DESC = "Oddzielne, zabezpieczone logowanie do panelu administracyjnego Stay Safe.";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .in("role", ["admin", "passport_verifier"] as never);
      if ((roles ?? []).length > 0) throw redirect({ to: "/admin" });
    }
  },
  component: AdminLogin,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">404</div>,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error("Nieprawidłowy e-mail lub hasło.");
      const uid = data.user?.id;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid!)
        .in("role", ["admin", "passport_verifier"] as never);
      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        throw new Error("To konto nie posiada uprawnień administratora. Dostęp zabroniony.");
      }
      toast.success("Zalogowano do panelu administratora");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto flex max-w-md flex-col px-4 py-16">
      <Card className="rounded-3xl border-[var(--gold)]/40 p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3">
            <ShieldCheck className="h-6 w-6 text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Panel administratora</h1>
            <p className="text-sm text-muted-foreground">
              Strefa zamknięta — dostęp wyłącznie dla kont z rolą administratora.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="admin-email">E-mail służbowy</Label>
            <Input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="admin-password">Hasło</Label>
            <div className="relative mt-1.5">
              <Input
                id="admin-password"
                type={show ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl pr-10"
              />
              <button
                type="button"
                aria-label={show ? "Ukryj hasło" : "Pokaż hasło"}
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={busy}
            size="lg"
            className="w-full rounded-2xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            Zaloguj do panelu
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          Próby logowania kontami bez uprawnień są automatycznie wylogowywane. Zwykli użytkownicy logują się na
          standardowej stronie logowania.
        </p>
      </Card>
    </div>
  );
}
