import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/polityka-prywatnosci")({
  head: () => ({
    meta: [
      { title: "Polityka prywatności (RODO) — Stay Safe" },
      { name: "description", content: "Polityka prywatności i informacja o przetwarzaniu danych osobowych w serwisie Stay Safe." },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Polityka prywatności (RODO)</h1>
      <p className="mt-2 text-sm text-muted-foreground">Serwis Stay Safe · staysafe.pl</p>

      <Section title="§1. Administrator danych osobowych">
        <p>1. Administratorem danych osobowych jest podmiot prowadzący działalność gospodarczą pod nazwą Stay Safe, NIP: 5252651283 (dalej: „Administrator”).</p>
        <p>2. Kontakt z Administratorem możliwy jest poprzez adres e-mail: [adres e-mail].</p>
      </Section>

      <Section title="§2. Zakres przetwarzanych danych">
        <p>Administrator może przetwarzać następujące dane: imię i nazwisko, adres e-mail, numer telefonu, dane identyfikacyjne firmy (jeżeli dotyczy), adres IP, dane dotyczące aktywności w Serwisie, dane zawarte w ogłoszeniach i wiadomościach w Chat.</p>
        <p>Podanie danych jest dobrowolne, lecz niezbędne do korzystania z funkcjonalności Serwisu.</p>
      </Section>

      <Section title="§3. Cele i podstawy prawne przetwarzania">
        <p>Dane przetwarzane są w celu: realizacji usług świadczonych drogą elektroniczną (art. 6 ust. 1 lit. b RODO), prowadzenia Konta Użytkownika, umożliwienia udziału w licytacjach, obsługi reklamacji, zapewnienia bezpieczeństwa Serwisu i przeciwdziałania nadużyciom (art. 6 ust. 1 lit. f RODO – prawnie uzasadniony interes Administratora), realizacji obowiązków księgowych i podatkowych, dochodzenia lub obrony roszczeń.</p>
      </Section>

      <Section title="§4. Odbiorcy danych">
        <p>Dane mogą być przekazywane: podmiotom świadczącym usługi hostingowe, dostawcom systemów IT, kancelariom prawnym, podmiotom księgowym, organom publicznym – gdy wymagają tego przepisy prawa.</p>
        <p>Administrator nie sprzedaje danych osobowych.</p>
      </Section>

      <Section title="§5. Okres przechowywania danych">
        <p>1. Dane przechowywane są przez okres trwania Konta.</p>
        <p>2. Po jego usunięciu dane mogą być przetwarzane przez okres: wymagany przepisami prawa, niezbędny do dochodzenia roszczeń (maksymalnie do przedawnienia roszczeń).</p>
      </Section>

      <Section title="§6. Prawa osoby, której dane dotyczą">
        <p>Użytkownik ma prawo do: dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych, wniesienia sprzeciwu, cofnięcia zgody (jeśli była podstawą przetwarzania), wniesienia skargi do Prezesa UODO.</p>
      </Section>

      <Section title="§7. Zautomatyzowane podejmowanie decyzji">
        <p>1. Administrator może stosować częściowo zautomatyzowane mechanizmy (np. system blokady konta po 4 negatywnych opiniach).</p>
        <p>2. Użytkownik ma prawo do zakwestionowania takiej decyzji i żądania jej weryfikacji przez Administratora.</p>
      </Section>

      <Section title="§8. Bezpieczeństwo danych">
        <p>Administrator stosuje odpowiednie środki techniczne i organizacyjne zapewniające ochronę danych, w szczególności: szyfrowanie połączenia (SSL), zabezpieczenia serwerowe, ograniczony dostęp do danych.</p>
      </Section>

      <Link to="/" className="mt-10 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Wróć na stronę główną
      </Link>
    </article>
  );
}
