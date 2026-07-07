import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck, BadgeCheck, Lock, Fingerprint, Linkedin, Wallet, FileText,
  Clock, ArrowRight, CheckCircle2, Eye, Hash,
} from "lucide-react";

export const Route = createFileRoute("/paszport-najemcy")({
  head: () => ({
    meta: [
      { title: "Co to jest Paszport Najemcy — Stay Safe" },
      { name: "description", content: "Paszport Najemcy Stay Safe to cyfrowy dokument zaufania: tożsamość, dochód, LinkedIn i historia najmu — w zgodzie z RODO." },
      { property: "og:title", content: "Co to jest Paszport Najemcy — Stay Safe" },
      { property: "og:description", content: "Twoja reputacja w jednym kliknięciu — bezpieczna, transparentna, ważna 12 miesięcy." },
    ],
  }),
  component: PaszportPage,
});

function PaszportPage() {
  const { t } = useTranslation();
  const badges = [
    { icon: Fingerprint, label: t("passport.b1l"), text: t("passport.b1") },
    { icon: Linkedin, label: t("passport.b2l"), text: t("passport.b2") },
    { icon: Wallet, label: t("passport.b3l"), text: t("passport.b3") },
    { icon: FileText, label: t("passport.b4l"), text: t("passport.b4") },
  ];
  const faq = [
    { q: t("passport.faq1q"), a: t("passport.faq1a") },
    { q: t("passport.faq2q"), a: t("passport.faq2a") },
    { q: t("passport.faq3q"), a: t("passport.faq3a") },
    { q: t("passport.faq4q"), a: t("passport.faq4a") },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
            <BadgeCheck className="h-3.5 w-3.5" /> {t("passport.badge")}
          </div>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">
            {t("passport.titlePre")} <span className="bg-gradient-to-r from-[var(--gold)] to-amber-300 bg-clip-text text-transparent">{t("passport.titleAccent")}</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {t("passport.intro")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/najem/paszport" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--gold)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
              <ShieldCheck className="h-4 w-4" /> {t("passport.cta")}
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-[var(--gold)]/30 via-transparent to-[var(--gold)]/20 blur-2xl" />
          <div className="relative rounded-3xl border-2 border-[var(--gold)]/40 bg-card/80 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">SS-XXXXXXXX</span>
              <span className="rounded-full border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-gold">{t("passport.active")}</span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-[var(--gold)]/40 bg-background text-2xl font-black text-gold">88</div>
              <div>
                <div className="font-bold">Jan Kowalski</div>
                <div className="text-xs text-muted-foreground">{t("passport.trustedScore")}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[t("home.vIdentity"), "LinkedIn", t("home.vIncome"), t("home.vPast")].map((b) => (
                <span key={b} className="inline-flex items-center gap-1 rounded-full border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold">
                  ✓ {b}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" /> {t("passport.validUntil")} 30.06.2027
            </div>
          </div>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">{t("passport.contentsTitle")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {badges.map(({ icon: Icon, label, text }) => (
            <div key={label} className="flex gap-4 rounded-2xl border border-border bg-card/50 p-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/10">
                <Icon className="h-5 w-5 text-gold" />
              </div>
              <div>
                <div className="font-bold">{label}</div>
                <div className="mt-1 text-sm text-muted-foreground">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5">
          <Lock className="h-6 w-6 text-emerald-400" />
          <div className="mt-2 font-bold">{t("passport.rodo1t")}</div>
          <p className="mt-1 text-sm text-muted-foreground">{t("passport.rodo1")}</p>
        </div>
        <div className="rounded-2xl border border-blue-400/30 bg-blue-500/5 p-5">
          <Eye className="h-6 w-6 text-blue-400" />
          <div className="mt-2 font-bold">{t("passport.rodo2t")}</div>
          <p className="mt-1 text-sm text-muted-foreground">{t("passport.rodo2")}</p>
        </div>
        <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-5">
          <Hash className="h-6 w-6 text-gold" />
          <div className="mt-2 font-bold">{t("passport.rodo3t")}</div>
          <p className="mt-1 text-sm text-muted-foreground">{t("passport.rodo3")}</p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">{t("passport.faqTitle")}</h2>
        <div className="mt-6 space-y-3">
          {faq.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border bg-card/40 p-5 open:border-[var(--gold)]/40">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                {f.q}
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-gold" />
        <h2 className="mt-3 text-2xl font-bold">{t("passport.ctaTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("passport.ctaSub")}</p>
        <Link to="/najem/paszport" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--gold)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
          <ShieldCheck className="h-4 w-4" /> {t("passport.ctaStart")}
        </Link>
      </section>
    </div>
  );
}
