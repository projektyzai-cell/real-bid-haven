import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, BadgeCheck, Loader2, MailQuestion } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { requestPassportDataChange } from "@/lib/passport-actions.functions";
import { submitIdentityHashes } from "@/lib/identity.functions";
import { isValidPesel } from "@/lib/passport";


type Profile = {
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  has_pesel: boolean;
  passport_serial: string | null;
  passport_expires_at: string | null;
  trusted_tenant_score: number;
  verified_identity: boolean;
  verified_linkedin: boolean;
  verified_income: boolean;
  verified_past_contract: boolean;
  identity_change_allowed: boolean | null;
};


export function PassportSection({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const submitIdentity = useServerFn(submitIdentityHashes);


  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [mode, setMode] = useState<"pesel" | "doc">("pesel");
  const [pesel, setPesel] = useState("");
  const [country, setCountry] = useState("PL");
  const [docNum, setDocNum] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select(
        "first_name,last_name,date_of_birth,has_pesel,passport_serial,passport_expires_at,trusted_tenant_score,verified_identity,verified_linkedin,verified_income,verified_past_contract,identity_change_allowed",
      )

      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setProfile(data as Profile);
      setFirstName(data.first_name ?? "");
      setLastName(data.last_name ?? "");
      setDob(data.date_of_birth ?? "");
      setMode(data.has_pesel ? "pesel" : "doc");
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function issue(renew = false) {
    if (!firstName.trim() || !lastName.trim() || !dob) {
      toast.error("Uzupełnij imię, nazwisko i datę urodzenia.");
      return;
    }
    if (mode === "pesel") {
      if (!isValidPesel(pesel)) {
        toast.error("Nieprawidłowy PESEL.");
        return;
      }
    } else {
      if (!country.trim() || country.trim().length !== 2) {
        toast.error("Kod kraju ISO 2-literowy (np. UA, DE).");
        return;
      }
      if (docNum.replace(/\s+/g, "").length < 4) {
        toast.error("Numer dokumentu jest za krótki.");
        return;
      }
    }

    setBusy(true);
    try {
      // Hashing happens server-side with a secret pepper — raw identity
      // numbers are never stored, and the digests cannot be brute-forced.
      await submitIdentity({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dob,
          mode,
          pesel: mode === "pesel" ? pesel : undefined,
          country: mode === "doc" ? country.toUpperCase() : undefined,
          docNum: mode === "doc" ? docNum : undefined,
        },
      });
    } catch (e) {
      setBusy(false);
      toast.error((e as Error).message);
      return;
    }
    setBusy(false);
    toast.success(renew ? "Dane zostały ponownie zanonimizowane w naszym systemie." : "Dane zostały zanonimizowane w naszym systemie.");
    load();

  }

  if (loading) {
    return (
      <section className="mt-6 rounded-3xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Ładuję paszport…
        </div>
      </section>
    );
  }

  const isActive =
    profile?.passport_serial &&
    profile.passport_expires_at &&
    new Date(profile.passport_expires_at) > new Date();
  const isExpired = profile?.passport_serial && !isActive;
  const unlocked = !!profile?.identity_change_allowed;
  const fieldsLocked = !!profile?.passport_serial && !unlocked;


  return (
    <section className="mt-6 rounded-3xl border border-[var(--gold)]/30 bg-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-semibold">Zanonimizuj swoje dane w systemie</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Twoja tożsamość pozostaje prywatna — zapisujemy wyłącznie nieodwracalny skrót (SHA-256), nigdy surowego PESEL-u ani numeru dokumentu. To pierwszy krok do aplikacji o Paszport Najemcy.
          </p>
        </div>
        {isActive && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gold">
            <BadgeCheck className="h-3.5 w-3.5" /> Zanonimizowane
          </span>
        )}
        {isExpired && (
          <span className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-destructive">
            Wygasło
          </span>
        )}
      </div>


      {profile?.passport_serial && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-background/40 p-4 sm:grid-cols-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Identyfikator anonimowy</div>
            <div className="font-mono text-sm font-semibold">{profile.passport_serial}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ważność hasha</div>
            <div className="text-sm font-semibold">
              {profile.passport_expires_at ? new Date(profile.passport_expires_at).toLocaleDateString("pl-PL") : "—"}
            </div>
          </div>
        </div>
      )}


      {unlocked && (
        <div className="mt-4 rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-4 text-sm">
          <div className="font-semibold text-gold">Administrator odblokował dane tożsamości</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Możesz jednorazowo poprawić imię, nazwisko, datę urodzenia oraz PESEL / dokument. Po zapisaniu sekcja zostanie ponownie zablokowana.
          </p>
        </div>
      )}
      {fieldsLocked && (
        <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-xs text-muted-foreground">
          Te dane są zablokowane i nie resetują się przy składaniu wniosku o nowy paszport. Aby je zmienić, wyślij prośbę do administratora — po jej akceptacji formularz zostanie odblokowany.
        </div>
      )}

      <fieldset disabled={fieldsLocked} className={fieldsLocked ? "mt-5 grid gap-4 opacity-60 sm:grid-cols-2" : "mt-5 grid gap-4 sm:grid-cols-2"}>

        <div>
          <Label htmlFor="fn">Imię</Label>
          <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5 rounded-xl" />
        </div>
        <div>
          <Label htmlFor="ln">Nazwisko</Label>
          <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1.5 rounded-xl" />
        </div>
        <div>
          <Label htmlFor="dob">Data urodzenia</Label>
          <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1.5 rounded-xl" />
        </div>
        <div>
          <Label>Rodzaj identyfikacji</Label>
          <div className="mt-1.5 inline-flex rounded-xl border border-border bg-background/40 p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("pesel")}
              className={`rounded-lg px-3 py-1.5 font-semibold ${mode === "pesel" ? "bg-[var(--gold)] text-[var(--gold-foreground)]" : "text-muted-foreground"}`}
            >
              PESEL
            </button>
            <button
              type="button"
              onClick={() => setMode("doc")}
              className={`rounded-lg px-3 py-1.5 font-semibold ${mode === "doc" ? "bg-[var(--gold)] text-[var(--gold-foreground)]" : "text-muted-foreground"}`}
            >
              Dokument zagraniczny
            </button>
          </div>
        </div>

        {mode === "pesel" ? (
          <div className="sm:col-span-2">
            <Label htmlFor="pesel">PESEL</Label>
            <Input
              id="pesel"
              inputMode="numeric"
              maxLength={11}
              value={pesel}
              onChange={(e) => setPesel(e.target.value.replace(/\D/g, ""))}
              placeholder="11 cyfr"
              className="mt-1.5 rounded-xl font-mono"
            />
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="cc">Kraj dokumentu (ISO-2)</Label>
              <Input
                id="cc"
                maxLength={2}
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                placeholder="UA, DE, GB…"
                className="mt-1.5 rounded-xl font-mono uppercase"
              />
            </div>
            <div>
              <Label htmlFor="dn">Numer dokumentu</Label>
              <Input id="dn" value={docNum} onChange={(e) => setDocNum(e.target.value)} className="mt-1.5 rounded-xl font-mono" />
            </div>
          </>
        )}
      </fieldset>

      <div className="mt-5 flex flex-wrap gap-2">
        {unlocked ? (
          <Button
            onClick={() => issue(true)}
            disabled={busy}
            className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Zapisz zmienione dane tożsamości
          </Button>
        ) : isActive || isExpired ? (
          <RequestDataChangeDialog />
        ) : (
          <Button
            onClick={() => issue(false)}
            disabled={busy}
            className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Zanonimizuj moje dane
          </Button>
        )}
      </div>

    </section>
  );
}

function RequestDataChangeDialog() {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const send = useServerFn(requestPassportDataChange);

  async function submit() {
    if (reason.trim().length < 5) {
      toast.error("Opisz krótko powód prośby (min. 5 znaków).");
      return;
    }
    setBusy(true);
    try {
      await send({ data: { reason: reason.trim() } });
      toast.success("Prośba została wysłana do administratora.");
      setOpen(false);
      setReason("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-[var(--gold)] font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
          <MailQuestion className="mr-2 h-4 w-4" /> Poproś administratora o zmianę danych
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Prośba o zmianę zanonimizowanych danych</DialogTitle>
          <DialogDescription>
            Dane tożsamości (PESEL / dokument / imię, nazwisko, data urodzenia) są zaszyfrowane jednokierunkowo i nie mogą być edytowane przez użytkownika. Opisz krótko, dlaczego potrzebujesz ich zmiany — administrator zweryfikuje wniosek i odblokuje formularz.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={5}
          maxLength={2000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Np. zmiana nazwiska po ślubie, nowy dokument tożsamości…"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Anuluj</Button>
          <Button onClick={submit} disabled={busy} className="bg-[var(--gold)] text-[var(--gold-foreground)] hover:opacity-90">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Wyślij prośbę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
