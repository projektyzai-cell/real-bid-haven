import { createFileRoute, Link } from "@tanstack/react-router";
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

const landlord = [
  { icon: ShieldCheck, title: "Zweryfikowani najemcy", text: "Dostęp do Paszportu Najemcy — tożsamość, dochód, historia najmu i Trusted Score zanim umówisz się na wizytę." },
  { icon: BellOff, title: "Zero spamu i nietrafionych zgłoszeń", text: "Otrzymujesz wyłącznie zapytania od osób spełniających Twoje kryteria — bez setek telefonów z OLX." },
  { icon: Clock, title: "Oszczędność czasu", text: "Cały proces — od publikacji oferty po podpis umowy — w jednym miejscu, z czatem i ocenami." },
  { icon: Star, title: "Budowanie reputacji właściciela", text: "Oceny od byłych najemców budują Twój profil — najemcy chętniej wybierają sprawdzonych wynajmujących." },
];

const tenant = [
  { icon: Search, title: "Dopasowane oferty zamiast spamu", text: "Wypełniasz jedno zapytanie — silnik dopasowuje oferty wg miasta, budżetu i preferencji. Bez przewijania tysięcy ogłoszeń." },
  { icon: ShieldCheck, title: "Bezpieczeństwo bez ujawniania dokumentów", text: "Twoje dane są przechowywane jako hash SHA-256. Wynajmujący widzi wyłącznie badge'y weryfikacji." },
  { icon: FileCheck2, title: "Paszport budujący zaufanie", text: "Trusted Tenant Score 0–100 i zweryfikowane badge'y przyspieszają decyzję wynajmującego — szybciej dostajesz klucze." },
  { icon: Wallet, title: "Bez prowizji i ukrytych opłat", text: "Podstawowe funkcje Stay Safe są darmowe. Płacisz tylko za opcjonalne dodatki." },
];

const shared = [
  { icon: MessageCircle, title: "Bezpieczna komunikacja", text: "Wbudowany czat z pełną historią — żadnych zagubionych ustaleń." },
  { icon: Star, title: "Wzajemne oceny po najmie", text: "Obie strony oceniają się gwiazdkami — buduje to długoterminową reputację." },
  { icon: Users, title: "Społeczność, nie rynek anonimów", text: "Zamknięty ekosystem zaufania, w którym każdy uczestnik ma historię." },
];

function KorzysciPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
          <Sparkles className="h-3.5 w-3.5" /> Win-win
        </div>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">
          Korzyści dla obu stron
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Stay Safe nie wybiera stron. Tworzymy ekosystem, w którym <span className="text-gold font-semibold">wynajmujący</span> i{" "}
          <span className="text-gold font-semibold">najemca</span> obaj zyskują czas, bezpieczeństwo i jakość dopasowań.
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
            <h2 className="text-2xl font-bold uppercase tracking-tight">Dla Wynajmującego</h2>
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
            Wystaw ofertę <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Tenant */}
        <div className="relative rounded-3xl border-2 border-[var(--gold)]/30 bg-gradient-to-br from-card/80 to-card/40 p-6 transition hover:border-[var(--gold)]/60">
          <div className="absolute -inset-0.5 -z-10 rounded-3xl bg-gradient-to-br from-[var(--gold)]/20 to-transparent blur" />
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/10">
              <KeyRound className="h-6 w-6 text-gold" />
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Dla Najemcy</h2>
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
            Stwórz Paszport <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Shared benefits */}
      <section className="mt-14">
        <h2 className="text-center text-2xl font-bold tracking-tight">Wspólne korzyści</h2>
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
        <h2 className="text-2xl font-bold tracking-tight">Stay Safe vs tradycyjne portale</h2>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Aspekt</th>
                <th className="px-4 py-3 text-left">Tradycyjny portal</th>
                <th className="px-4 py-3 text-left text-gold">Stay Safe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Weryfikacja stron", "Brak", "Paszport Najemcy + oceny"],
                ["Dopasowanie ofert", "Ręczne przeszukiwanie", "Silnik AI dopasowuje za Ciebie"],
                ["Spam i bot-call", "Codziennie", "Zero — tylko trafione zapytania"],
                ["Bezpieczeństwo danych", "Surowe pliki na serwerze", "Tylko nieodwracalny hash SHA-256"],
                ["Reputacja po najmie", "Brak", "Wzajemne oceny budujące historię"],
              ].map(([a, b, c]) => (
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
        <h2 className="text-2xl font-bold">Dołącz do bezpiecznego ekosystemu najmu</h2>
        <p className="mt-2 text-sm text-muted-foreground">Darmowe konto. Bez prowizji. Możliwość usunięcia w każdej chwili.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/najem/paszport" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--gold)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--gold-foreground)] hover:opacity-90">
            <KeyRound className="h-4 w-4" /> Jestem najemcą
          </Link>
          <Link to="/najem/nowa-oferta" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--gold)]/50 bg-background px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-gold hover:bg-[var(--gold)]/10">
            <Building2 className="h-4 w-4" /> Jestem wynajmującym
          </Link>
        </div>
      </section>
    </div>
  );
}
