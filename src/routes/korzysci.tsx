import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  KeyRound, Building2, ShieldCheck, Sparkles, Clock, Wallet, Users,
  Search, Star, FileCheck2, BellOff, MessageCircle, ArrowRight, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/korzysci")({
  head: () => ({
    meta: [
      { title: "Korzyści dla Wynajmującego i Najemcy — Stay Safe" },
      { name: "description", content: "Stay Safe daje wynajmującym zweryfikowanych najemców, a najemcom — dopasowane oferty i transparentny Paszport." },
      { property: "og:title", content: "Korzyści dla Wynajmującego i Najemcy — Stay Safe" },
      { property: "og:description", content: "Wzajemne korzyści: bezpieczeństwo, czas, jakość dopasowań." },
    ],
  }),
  component: KorzysciPage,
});

function KorzysciPage() {
  const { t } = useTranslation();

  const landlord = [
    { icon: ShieldCheck, title: t("benefits.l1t"), text: t("benefits.l1") },
    { icon: BellOff, title: t("benefits.l2t"), text: t("benefits.l2") },
    { icon: Clock, title: t("benefits.l3t"), text: t("benefits.l3") },
    { icon: Star, title: t("benefits.l4t"), text: t("benefits.l4") },
  ];
  const tenant = [
    { icon: Search, title: t("benefits.t1t"), text: t("benefits.t1") },
    { icon: ShieldCheck, title: t("benefits.t2t"), text: t("benefits.t2") },
    { icon: FileCheck2, title: t("benefits.t3t"), text: t("benefits.t3") },
    { icon: Wallet, title: t("benefits.t4t"), text: t("benefits.t4") },
  ];
  const shared = [
    { icon: MessageCircle, title: t("benefits.s1t"), text: t("benefits.s1") },
    { icon: Star, title: t("benefits.s2t"), text: t("benefits.s2") },
    { icon: Users, title: t("benefits.s3t"), text: t("benefits.s3") },
  ];
  const rows: [string, string, string][] = [
    [t("benefits.r1a"), t("benefits.r1b"), t("benefits.r1c")],
    [t("benefits.r2a"), t("benefits.r2b"), t("benefits.r2c")],
    [t("benefits.r3a"), t("benefits.r3b"), t("benefits.r3c")],
    [t("benefits.r4a"), t("benefits.r4b"), t("benefits.r4c")],
    [t("benefits.r5a"), t("benefits.r5b"), t("benefits.r5c")],
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
          <Sparkles className="h-3.5 w-3.5" /> {t("benefits.badge")}
        </div>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">
          {t("benefits.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {t("benefits.subPre")} <span className="text-gold font-semibold">{t("benefits.subLandlord")}</span> {t("benefits.subAnd")}{" "}
          <span className="text-gold font-semibold">{t("benefits.subTenant")}</span> {t("benefits.subPost")}
        </p>
      </div>

      {/* Two-column landlord vs tenant */}
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* Landlord */}
        <div className="relative rounded-3xl border-2 border-[var(--gold)]/30 bg-gradient-to-br from-card/80 to-card/40 p-6 transition hover:border-[var(--gold)]/60">
          <div className="absolute -inset-0.5 -z-10 rounded-3xl bg-gradient-to-br from-[var(--gold)]/20 to-transparent blur" />
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/10">
              <Building2 className="h-6 w-6 text-gold" />
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">{t("benefits.landlordTitle")}</h2>
          </div>
          <ul className="mt-6 space-y-4">
            {landlord.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--gold)]/30 bg-background/40">
                  <Icon className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <div className="font-semibold">{title}</div>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/najem/nowa-oferta" className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-gold transition hover:bg-[var(--gold)] hover:text-[var(--gold-foreground)]">
            {t("benefits.ctaListing")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Tenant */}
        <div className="relative rounded-3xl border-2 border-[var(--gold)]/30 bg-gradient-to-br from-card/80 to-card/40 p-6 transition hover:border-[var(--gold)]/60">
          <div className="absolute -inset-0.5 -z-10 rounded-3xl bg-gradient-to-br from-[var(--gold)]/20 to-transparent blur" />
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/10">
              <KeyRound className="h-6 w-6 text-gold" />
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">{t("benefits.tenantTitle")}</h2>
          </div>
          <ul className="mt-6 space-y-4">
            {tenant.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--gold)]/30 bg-background/40">
                  <Icon className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <div className="font-semibold">{title}</div>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/najem/paszport" className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-gold transition hover:bg-[var(--gold)] hover:text-[var(--gold-foreground)]">
            {t("benefits.ctaPassport")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Shared benefits */}
      <section className="mt-14">
        <h2 className="text-center text-2xl font-bold tracking-tight">{t("benefits.sharedTitle")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {shared.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card/40 p-5 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/10">
                <Icon className="h-5 w-5 text-gold" />
              </div>
              <div className="mt-3 font-bold">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">{t("benefits.cmpTitle")}</h2>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">{t("benefits.cmpAspect")}</th>
                <th className="px-4 py-3 text-left">{t("benefits.cmpTrad")}</th>
                <th className="px-4 py-3 text-left text-gold">{t("benefits.cmpSS")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(([a, b, c]) => (
                <tr key={a}>
                  <td className="px-4 py-3 font-semibold">{a}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b}</td>
                  <td className="px-4 py-3 font-semibold text-gold">
                    <CheckCircle2 className="mr-1.5 inline h-4 w-4" />{c}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12 rounded-3xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-8 text-center">
        <h2 className="text-2xl font-bold">{t("benefits.ctaTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("benefits.ctaSub")}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/najem/paszport" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--gold)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
            <KeyRound className="h-4 w-4" /> {t("benefits.iamTenant")}
          </Link>
          <Link to="/najem/nowa-oferta" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--gold)]/50 bg-background px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-gold hover:bg-[var(--gold)]/10">
            <Building2 className="h-4 w-4" /> {t("benefits.iamLandlord")}
          </Link>
        </div>
      </section>
    </div>
  );
}
