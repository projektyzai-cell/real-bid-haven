import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck, UserPlus, FileCheck2, Search, Handshake, Key, Star,
  Sparkles, ArrowRight, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/jak-dzialamy")({
  head: () => ({
    meta: [
      { title: "Jak działamy — Stay Safe" },
      { name: "description", content: "Stay Safe to bezpieczny ekosystem najmu: weryfikacja RODO, Paszport Najemcy, dopasowanie zamiast spamu i pełna obsługa 360°." },
      { property: "og:title", content: "Jak działamy — Stay Safe" },
      { property: "og:description", content: "6 kroków bezpiecznego najmu — od rejestracji po podpisanie umowy." },
    ],
  }),
  component: JakDzialamyPage,
});

function JakDzialamyPage() {
  const { t } = useTranslation();
  const stepIcons = [UserPlus, ShieldCheck, Search, FileCheck2, Handshake, Key];
  const steps = ([1, 2, 3, 4, 5, 6] as const).map((n, i) => ({
    Icon: stepIcons[i],
    title: t(`howItWorks.steps.s${n}t`),
    text: t(`howItWorks.steps.s${n}`),
  }));
  const principles = ([1, 2, 3, 4] as const).map((n) => ({
    label: t(`howItWorks.p${n}l`),
    text: t(`howItWorks.p${n}`),
  }));

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--gold)]/30 bg-gradient-to-br from-background via-background to-[var(--gold)]/5 p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--gold)]/15 blur-3xl" />
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
          <Sparkles className="h-3.5 w-3.5" /> {t("howItWorks.badge")}
        </div>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">
          {t("howItWorks.title1")} <span className="bg-gradient-to-r from-[var(--gold)] to-amber-300 bg-clip-text text-transparent">Stay Safe</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {t("howItWorks.subtitle")}
        </p>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight">{t("howItWorks.stepsTitle")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {steps.map(({ Icon, title, text }) => (
            <div key={title} className="group relative rounded-2xl border border-border bg-card/50 p-5 transition hover:border-[var(--gold)]/50 hover:bg-card">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/10">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold leading-tight">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight">{t("howItWorks.principlesTitle")}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {principles.map((p) => (
            <div key={p.label} className="flex gap-3 rounded-2xl border border-border bg-card/30 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <div className="font-semibold">{p.label}</div>
                <div className="text-sm text-muted-foreground">{p.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-8 text-center">
        <Star className="mx-auto h-8 w-8 text-gold" />
        <h2 className="mt-3 text-2xl font-bold">{t("howItWorks.ctaTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("howItWorks.ctaSub")}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/najem/paszport" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--gold)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
            <ShieldCheck className="h-4 w-4" /> {t("howItWorks.ctaPassport")}
          </Link>
          <Link to="/najem/nowa-oferta" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--gold)]/50 bg-background px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-gold hover:bg-[var(--gold)]/10">
            {t("howItWorks.ctaListing")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
