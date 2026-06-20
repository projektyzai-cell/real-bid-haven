import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

type AuthSearch = { redirect?: string; mode?: string };

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Logowanie — Stay Safe" }] }),
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect: typeof s.redirect === "string" && s.redirect.startsWith("/") ? s.redirect : undefined,
    mode: typeof s.mode === "string" ? s.mode : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: (search.redirect ?? "/") as string });
  },
  component: AuthPage,
});

function PasswordInput({ id, value, onChange, autoComplete }: {
  id: string; value: string; onChange: (v: string) => void; autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative mt-1.5">
      <Input id={id} type={show ? "text" : "password"} required value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)} className="rounded-xl pr-10" />
      <button type="button" onClick={() => setShow((v) => !v)}
        aria-label={show ? "Ukryj hasło" : "Pokaż hasło"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "Nieprawidłowy e-mail lub hasło.";
  if (m.includes("email not confirmed")) return "Konto nie zostało jeszcze aktywowane. Sprawdź pocztę.";
  if (m.includes("user already registered")) return "Konto z tym adresem e-mail już istnieje.";
  if (m.includes("rate limit")) return "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
  if (m.includes("password should be")) return "Hasło nie spełnia wymagań.";
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirectTo = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nick, setNick] = useState("");
  const [accountType, setAccountType] = useState<"najemca" | "wynajmujacy" | "oba">("najemca");
  const [preferredLanguage, setPreferredLanguage] = useState<"pl" | "en" | "uk" | "es">("pl");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(mapAuthError(error.message)); return; }
    toast.success("Zalogowano pomyślnie");
    // Admin → bezpośrednio do panelu administratora
    const uid = signInData.user?.id;
    if (uid) {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      if (roleRow) { navigate({ to: "/admin" }); return; }
    }
    navigate({ to: redirectTo as string });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptTerms) { toast.error("Akceptacja Regulaminu jest wymagana."); return; }
    if (!nick.trim()) { toast.error("Podaj nick."); return; }
    const pwdRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRe.test(password)) {
      toast.error("Hasło musi mieć min. 8 znaków, zawierać wielką literę, cyfrę i znak specjalny.");
      return;
    }
    if (password !== password2) {
      toast.error("Hasła nie są identyczne. Wpisz to samo hasło w obu polach.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectTo}`,
        data: { display_name: nick.trim(), account_type: accountType, preferred_language: preferredLanguage },
      },
    });
    if (error) { setLoading(false); toast.error(mapAuthError(error.message)); return; }
    const userId = data.user?.id ?? data.session?.user.id;
    if (userId) {
      await supabase.from("user_consents" as never).insert([
        { user_id: userId, consent_type: "terms", granted: true },
        { user_id: userId, consent_type: "privacy", granted: true },
      ] as never);
    }
    setLoading(false);
    toast.success("Konto utworzone! Kliknij link weryfikacyjny w wiadomości e-mail, aby aktywować konto.");
  }

  async function resetPwd(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error("Podaj adres e-mail przypisany do konta."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(mapAuthError(error.message));
    else { toast.success("Jeśli konto istnieje, wysłaliśmy link do zmiany hasła. Sprawdź pocztę."); setResetMode(false); }
  }

  if (resetMode) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
        <div className="w-full rounded-3xl border bg-card p-8 shadow-card">
          <h1 className="text-2xl font-semibold">Zapomniałem hasła</h1>
          <p className="mt-1 text-sm text-muted-foreground">Podaj adres e-mail, którym zakładałeś konto. Wyślemy na ten adres link do ustawienia nowego hasła.</p>
          <form onSubmit={resetPwd} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="r-email">E-mail przypisany do konta</Label>
              <Input id="r-email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl">
              {loading ? "Wysyłam..." : "Wyślij link do zmiany hasła"}
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
                <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-xl">
                {loading ? "Logowanie..." : "Zaloguj"}
              </Button>
              <button type="button" onClick={() => setResetMode(true)}
                className="block w-full text-center text-sm text-primary hover:underline">
                Zapomniałem hasła
              </button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="nick">Nick</Label>
                <Input id="nick" required value={nick} maxLength={40}
                  onChange={(e) => setNick(e.target.value)} className="mt-1.5 rounded-xl"
                  placeholder="np. JanK" />
              </div>
              <div>
                <Label>Chcę korzystać jako</Label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {([
                    ["najemca", "Najemca"],
                    ["wynajmujacy", "Wynajmujący"],
                    ["oba", "Oba"],
                  ] as const).map(([val, lbl]) => (
                    <button type="button" key={val} onClick={() => setAccountType(val)}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${accountType === val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Wybór wpływa tylko na podpowiedzi w panelu — w każdej chwili możesz korzystać z obu trybów.</p>
              </div>
              <div>
                <Label htmlFor="lang">Preferowany język kontaktu</Label>
                <select
                  id="lang"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value as "pl" | "en" | "uk" | "es")}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="pl">🇵🇱 Polski</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="uk">🇺🇦 Українська</option>
                  <option value="es">🇪🇸 Español</option>
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">W tym języku otrzymasz wiadomość powitalną i powiadomienia systemowe.</p>
              </div>
              <div>
                <Label htmlFor="email2">E-mail</Label>
                <Input id="email2" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="password2">Hasło (min. 8 znaków, wielka litera, cyfra, znak specjalny)</Label>
                <PasswordInput id="password2" value={password} onChange={setPassword} autoComplete="new-password" />
              </div>
              <div>
                <Label htmlFor="password3">Powtórz hasło</Label>
                <PasswordInput id="password3" value={password2} onChange={setPassword2} autoComplete="new-password" />
                {password2.length > 0 && password !== password2 && (
                  <p className="mt-1 text-xs text-destructive">Hasła nie są identyczne.</p>
                )}
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
              <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                Po rejestracji wyślemy Ci e-mail z linkiem weryfikacyjnym. Kliknij go, aby aktywować konto.
                <br /><span className="font-medium text-foreground">Konto jest całkowicie darmowe</span> — w każdej chwili możesz je trwale usunąć w Ustawieniach.
              </p>
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
