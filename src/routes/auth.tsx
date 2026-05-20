import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Logowanie — Stay Safe" }] }),
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Zalogowano"); navigate({ to: "/" }); }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptTerms) { toast.error("Akceptacja Regulaminu jest wymagana."); return; }
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      toast.error("Imię, nazwisko i telefon są wymagane.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          display_name: `${firstName.trim()} ${lastName.trim()}`,
        },
      },
    });
    if (error) { setLoading(false); toast.error(error.message); return; }
    const userId = data.user?.id ?? data.session?.user.id;
    if (userId) {
      await supabase.from("user_consents" as never).insert([
        { user_id: userId, consent_type: "terms", granted: true },
        { user_id: userId, consent_type: "privacy", granted: true },
      ] as never);
    }
    setLoading(false);
    toast.success("Konto utworzone! Sprawdź email aby potwierdzić.");
  }

  async function resetPwd(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error("Podaj adres e-mail"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Wysłano link resetujący na e-mail."); setResetMode(false); }
  }

  if (resetMode) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
        <div className="w-full rounded-3xl border bg-card p-8 shadow-card">
          <h1 className="text-2xl font-semibold">Przypomnij hasło</h1>
          <p className="mt-1 text-sm text-muted-foreground">Wyślemy link resetujący na podany adres e-mail.</p>
          <form onSubmit={resetPwd} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="r-email">E-mail</Label>
              <Input id="r-email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl">
              {loading ? "Wysyłam..." : "Wyślij link"}
            </Button>
            <button type="button" onClick={() => setResetMode(false)}
              className="block w-full text-center text-sm text-muted-foreground hover:underline">
              ← Wróć do logowania
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-3xl border bg-card p-8 shadow-card">
        <h1 className="text-2xl font-semibold">Witaj w Stay Safe</h1>
        <p className="mt-1 text-sm text-muted-foreground">Jedno konto do wszystkich modułów.</p>

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
              <button type="button" onClick={() => setResetMode(true)}
                className="block w-full text-center text-sm text-primary hover:underline">
                Przypomnij hasło
              </button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fn">Imię</Label>
                  <Input id="fn" required value={firstName}
                    onChange={(e) => setFirstName(e.target.value)} className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="ln">Nazwisko</Label>
                  <Input id="ln" required value={lastName}
                    onChange={(e) => setLastName(e.target.value)} className="mt-1.5 rounded-xl" />
                </div>
              </div>
              <div>
                <Label htmlFor="ph">Numer telefonu</Label>
                <Input id="ph" type="tel" required value={phone}
                  onChange={(e) => setPhone(e.target.value)} className="mt-1.5 rounded-xl"
                  placeholder="+48 ..." />
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
              <label className="flex items-start gap-3 rounded-2xl border bg-background/50 p-3 text-sm">
                <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(v === true)} className="mt-0.5" />
                <span>
                  <span className="font-semibold text-primary">*</span> Oświadczam, że zapoznałem(-am) się z{" "}
                  <Link to="/regulamin" target="_blank" className="underline">Regulaminem</Link>{" "}
                  oraz{" "}
                  <Link to="/polityka-prywatnosci" target="_blank" className="underline">Polityką Prywatności</Link>{" "}
                  i akceptuję ich treść.
                </span>
              </label>
              <Button type="submit" disabled={loading || !acceptTerms} className="w-full rounded-xl">
                {loading ? "Tworzę konto..." : "Załóż konto"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
