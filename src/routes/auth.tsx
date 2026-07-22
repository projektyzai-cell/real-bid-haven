import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CONTRACTOR_SERVICES, CONTRACTOR_CITIES } from "@/lib/contractor-constants";

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
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  return (
    <div className="relative mt-1.5">
      <Input id={id} type={show ? "text" : "password"} required value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)} className="rounded-xl pr-10" />
      <button type="button" onClick={() => setShow((v) => !v)}
        aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function useAuthErrorMapper() {
  const { t } = useTranslation();
  return (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes("invalid login") || m.includes("invalid credentials")) return t("auth.errInvalid");
    if (m.includes("email not confirmed")) return t("auth.errNotConfirmed");
    if (m.includes("user already registered")) return t("auth.errExists");
    if (m.includes("rate limit")) return t("auth.errRate");
    if (m.includes("password should be")) return t("auth.errPwdWeak");
    return message;
  };
}

function AuthPage() {
  const { t } = useTranslation();
  const mapAuthError = useAuthErrorMapper();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirectTo = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nick, setNick] = useState("");
  const [accountType, setAccountType] = useState<"najemca" | "wynajmujacy" | "oba" | "contractor">("najemca");
  const [companyName, setCompanyName] = useState("");
  const [contractorPhone, setContractorPhone] = useState("");
  const [contractorServices, setContractorServices] = useState<string[]>([]);
  const [contractorCities, setContractorCities] = useState<string[]>([]);
  const [contractorNationwide, setContractorNationwide] = useState(false);
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
    toast.success(t("auth.okSignedIn"));
    const uid = signInData.user?.id;
    if (uid) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      const roleSet = new Set((roles ?? []).map((r: any) => r.role));
      if (roleSet.has("admin")) { navigate({ to: "/admin" }); return; }
      if (roleSet.has("contractor")) { navigate({ to: "/wykonawca" }); return; }
    }
    navigate({ to: redirectTo as string });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptTerms) { toast.error(t("auth.errTermsRequired")); return; }
    if (!nick.trim()) { toast.error(t("auth.errNickRequired")); return; }
    const pwdRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRe.test(password)) { toast.error(t("auth.errPwdPattern")); return; }
    if (password !== password2) { toast.error(t("auth.errPwdMismatch")); return; }
    if (accountType === "contractor") {
      if (!companyName.trim()) { toast.error("Podaj nazwę firmy / imię i nazwisko wykonawcy."); return; }
      if (contractorServices.length === 0) { toast.error("Wybierz co najmniej jedną kategorię usług."); return; }
      if (!contractorNationwide && contractorCities.length === 0) {
        toast.error("Wybierz co najmniej jedno miasto lub zaznacz zasięg ogólnopolski."); return;
      }
      if (contractorPhone.replace(/\D/g, "").length < 9) { toast.error("Podaj poprawny numer telefonu."); return; }
    }
    setLoading(true);
    const metadata: Record<string, unknown> = {
      display_name: nick.trim(),
      account_type: accountType,
      preferred_language: preferredLanguage,
    };
    if (accountType === "contractor") {
      metadata.company_name = companyName.trim();
      metadata.contractor_services = contractorServices;
      metadata.contractor_cities = contractorNationwide ? [] : contractorCities;
      metadata.contractor_nationwide = contractorNationwide;
      metadata.contractor_phone = contractorPhone.trim();
    }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectTo}`,
        data: metadata,
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
    toast.success(t("auth.okCreated"));
  }

  async function resetPwd(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error(t("auth.errEmailRequired")); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(mapAuthError(error.message));
    else { toast.success(t("auth.okResetSent")); setResetMode(false); }
  }

  if (resetMode) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
        <div className="w-full rounded-3xl border bg-card p-8 shadow-card">
          <h1 className="text-2xl font-semibold">{t("auth.forgotTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.forgotSub")}</p>
          <form onSubmit={resetPwd} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="r-email">{t("auth.emailForAccount")}</Label>
              <Input id="r-email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl">
              {loading ? t("auth.sending") : t("auth.sendLink")}
            </Button>
            <button type="button" onClick={() => setResetMode(false)}
              className="block w-full text-center text-sm text-muted-foreground hover:underline">
              {t("auth.backToLogin")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-3xl border bg-card p-8 shadow-card">
        <h1 className="text-2xl font-semibold">{t("auth.welcome")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.oneAccount")}</p>

        <Tabs defaultValue="signin" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="signin">{t("auth.tabSignin")}</TabsTrigger>
            <TabsTrigger value="signup">{t("auth.tabSignup")}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={signIn} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="password">{t("auth.password")}</Label>
                <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-xl">
                {loading ? t("auth.signingIn") : t("auth.signInBtn")}
              </Button>
              <button type="button" onClick={() => setResetMode(true)}
                className="block w-full text-center text-sm text-primary hover:underline">
                {t("auth.forgot")}
              </button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="nick">{t("auth.nick")}</Label>
                <Input id="nick" required value={nick} maxLength={40}
                  onChange={(e) => setNick(e.target.value)} className="mt-1.5 rounded-xl"
                  placeholder={t("auth.nickPh")} />
              </div>
              <div>
                <Label>{t("auth.wantToUseAs")}</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([
                    ["najemca", t("auth.tenant")],
                    ["wynajmujacy", t("auth.landlord")],
                    ["oba", t("auth.both")],
                    ["contractor", "Wykonawca Concierge"],
                  ] as const).map(([val, lbl]) => (
                    <button type="button" key={val} onClick={() => setAccountType(val as typeof accountType)}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${accountType === val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{t("auth.roleHelp")}</p>
              </div>

              {accountType === "contractor" && (
                <div className="space-y-3 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-500">
                    <Sparkles className="h-4 w-4" /> Profil Wykonawcy Concierge
                  </div>
                  <div>
                    <Label htmlFor="company">Nazwa firmy / imię i nazwisko</Label>
                    <Input id="company" value={companyName} maxLength={120}
                      onChange={(e) => setCompanyName(e.target.value)} className="mt-1.5 rounded-xl"
                      placeholder="np. Kancelaria Kowalski" />
                  </div>
                  <div>
                    <Label htmlFor="c-phone">Telefon kontaktowy</Label>
                    <Input id="c-phone" type="tel" inputMode="tel" value={contractorPhone}
                      onChange={(e) => setContractorPhone(e.target.value)}
                      className="mt-1.5 rounded-xl" placeholder="+48 …" />
                  </div>
                  <div>
                    <Label>Świadczone usługi (wybierz jedną lub więcej)</Label>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {CONTRACTOR_SERVICES.map((s) => {
                        const on = contractorServices.includes(s.key);
                        return (
                          <button type="button" key={s.key}
                            onClick={() => setContractorServices((prev) => on ? prev.filter((k) => k !== s.key) : [...prev, s.key])}
                            className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${on ? "border-amber-500 bg-amber-500/15 text-amber-500" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 rounded-xl border border-border bg-background/50 p-3 text-xs">
                      <Checkbox checked={contractorNationwide}
                        onCheckedChange={(v) => setContractorNationwide(v === true)} />
                      <span className="font-semibold">Zasięg ogólnopolski (usługi zdalne)</span>
                    </label>
                  </div>
                  {!contractorNationwide && (
                    <div>
                      <Label>Miasta obsługi</Label>
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border bg-background/40 p-2">
                        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                          {CONTRACTOR_CITIES.map((city) => {
                            const on = contractorCities.includes(city);
                            return (
                              <button type="button" key={city}
                                onClick={() => setContractorCities((prev) => on ? prev.filter((c) => c !== city) : [...prev, city])}
                                className={`rounded-lg border px-2 py-1 text-[11px] transition ${on ? "border-amber-500 bg-amber-500/15 text-amber-500" : "border-transparent text-muted-foreground hover:bg-muted/50"}`}>
                                {city}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">Wybrano: {contractorCities.length}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="lang">{t("auth.preferredLang")}</Label>
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
                <p className="mt-1 text-[11px] text-muted-foreground">{t("auth.preferredLangHelp")}</p>
              </div>
              <div>
                <Label htmlFor="email2">{t("auth.email")}</Label>
                <Input id="email2" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="password2">{t("auth.passwordRules")}</Label>
                <PasswordInput id="password2" value={password} onChange={setPassword} autoComplete="new-password" />
              </div>
              <div>
                <Label htmlFor="password3">{t("auth.repeatPassword")}</Label>
                <PasswordInput id="password3" value={password2} onChange={setPassword2} autoComplete="new-password" />
                {password2.length > 0 && password !== password2 && (
                  <p className="mt-1 text-xs text-destructive">{t("auth.passwordsDiffer")}</p>
                )}
              </div>
              <label className="flex items-start gap-3 rounded-2xl border bg-background/50 p-3 text-sm">
                <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(v === true)} className="mt-0.5" />
                <span>
                  <span className="font-semibold text-primary">*</span> {t("auth.acceptText1")}{" "}
                  <Link to="/regulamin" target="_blank" className="underline">{t("auth.termsLink")}</Link>{" "}
                  {t("auth.andWord")}{" "}
                  <Link to="/polityka-prywatnosci" target="_blank" className="underline">{t("auth.privacyLink")}</Link>{" "}
                  {t("auth.acceptText2")}
                </span>
              </label>
              <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                {t("auth.afterSignupInfo")}
                <br /><span className="font-medium text-foreground">{t("auth.freeAccount")}</span> {t("auth.deleteAnytime")}
              </p>
              <Button type="submit" disabled={loading || !acceptTerms} className="w-full rounded-xl">
                {loading ? t("auth.creating") : t("auth.createAccount")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
