import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Settings as SettingsIcon, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PassportSection } from "@/components/PassportSection";
import { deleteMyAccount } from "@/lib/admin-rental.functions";

export const Route = createFileRoute("/_authenticated/ustawienia")({
  head: () => ({ meta: [{ title: "Ustawienia — Stay Safe" }] }),
  component: SettingsPage,
});

const PWD_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function PwdField({ id, value, onChange, label }: { id: string; value: string; onChange: (v: string) => void; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1.5">
        <Input id={id} type={show ? "text" : "password"} value={value}
          onChange={(e) => onChange(e.target.value)} className="rounded-xl pr-10" />
        <button type="button" onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function SettingsPage() {
  const { user, displayName } = useAuth();
  const { t } = useTranslation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email) return;
    if (!PWD_RE.test(next)) {
      toast.error(t("settings.errPwdRules"));
      return;
    }
    if (next !== confirm) { toast.error(t("settings.errMismatch")); return; }
    setBusy(true);
    // weryfikacja obecnego hasła
    const { error: reauthErr } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (reauthErr) { setBusy(false); toast.error(t("settings.errCurrent")); return; }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("settings.okChanged"));
      setCurrent(""); setNext(""); setConfirm("");
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-semibold tracking-tight">{t("settings.title")}</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("settings.loggedInAs")} <strong>{displayName ?? user?.email}</strong>
      </p>

      <section className="mt-8 rounded-3xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold">{t("settings.pwdTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.pwdReq")}
        </p>
        <form onSubmit={changePassword} className="mt-5 space-y-4">
          <PwdField id="cur" value={current} onChange={setCurrent} label={t("settings.curPwd")} />
          <PwdField id="new" value={next} onChange={setNext} label={t("settings.newPwd")} />
          <PwdField id="con" value={confirm} onChange={setConfirm} label={t("settings.repeatPwd")} />
          <Button type="submit" disabled={busy || !current || !next || !confirm} className="rounded-xl">
            {busy ? t("settings.saving") : t("settings.changePwd")}
          </Button>
        </form>
      </section>

      {user && <PassportSection userId={user.id} />}

      <DeleteAccountSection />

      <section className="mt-6 rounded-3xl border border-dashed bg-card/40 p-6 text-sm text-muted-foreground">
        <p>{t("settings.soon")}</p>
      </section>
    </div>
  );
}

function DeleteAccountSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const del = useServerFn(deleteMyAccount);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (confirmText !== "USUWAM") return;
    setBusy(true);
    try {
      await del();
      await supabase.auth.signOut();
      toast.success(t("settings.okDeleted"));
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e.message ?? t("settings.errDelete"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-destructive/40 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-destructive">{t("settings.delTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("settings.delDesc1")} <strong>{t("settings.delDescBold")}</strong>.
            {t("settings.delDesc2")} <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">USUWAM</code>.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t("settings.delPlaceholder")} className="rounded-xl sm:max-w-xs" />
            <Button variant="destructive" disabled={confirmText !== "USUWAM" || busy} onClick={handleDelete} className="rounded-xl">
              <Trash2 className="mr-2 h-4 w-4" />
              {busy ? t("settings.deleting") : t("settings.delBtn")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
