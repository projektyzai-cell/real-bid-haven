import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Logowanie — EstateBid" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Zalogowano");
      navigate({ to: "/" });
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Konto utworzone! Sprawdź email aby potwierdzić.");
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-3xl border bg-card p-8 shadow-card">
        <h1 className="text-2xl font-semibold tracking-tight">Witaj w EstateBid</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zaloguj się, aby licytować i dodawać ogłoszenia.
        </p>

        <Tabs defaultValue="signin" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="signin">Logowanie</TabsTrigger>
            <TabsTrigger value="signup">Rejestracja</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={signIn} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="password">Hasło</Label>
                <Input id="password" type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-xl">
                {loading ? "Logowanie..." : "Zaloguj"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="dn">Imię / Nick</Label>
                <Input id="dn" required value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="email2">E-mail</Label>
                <Input id="email2" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="password2">Hasło (min. 6 znaków)</Label>
                <Input id="password2" type="password" required minLength={6} value={password}
                  onChange={(e) => setPassword(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-xl">
                {loading ? "Tworzę konto..." : "Załóż konto"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
